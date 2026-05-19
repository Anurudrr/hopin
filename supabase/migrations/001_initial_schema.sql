create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  email text,
  city text,
  role text not null default 'rider' check (role in ('rider', 'driver', 'admin')),
  gender text,
  home_address text,
  work_address text,
  avatar_url text,
  is_phone_verified boolean not null default false,
  is_email_verified boolean not null default false,
  onboarding_completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid not null references public.profiles(id) on delete cascade,
  make text not null,
  model text not null,
  year integer not null check (year between 1900 and 2100),
  color text not null,
  license_plate text not null unique,
  capacity integer not null default 4 check (capacity between 1 and 8),
  created_at timestamptz not null default now()
);

create table public.driver_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  license_number text not null,
  license_expiry date not null,
  document_url text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.rides (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references public.profiles(id) on delete set null,
  origin_name text not null,
  origin_lat double precision not null,
  origin_lng double precision not null,
  destination_name text not null,
  destination_lat double precision not null,
  destination_lng double precision not null,
  city text not null,
  departure_time timestamptz not null,
  seats_total integer not null default 4 check (seats_total between 1 and 8),
  seats_available integer not null default 4 check (seats_available between 0 and seats_total),
  fare_per_seat numeric(10,2) not null check (fare_per_seat >= 0),
  status text not null default 'scheduled' check (status in ('scheduled', 'active', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid not null references public.rides(id) on delete cascade,
  rider_id uuid not null references public.profiles(id) on delete cascade,
  driver_id uuid references public.profiles(id) on delete set null,
  city text not null default '',
  pickup_address text not null default '',
  pickup_lat double precision not null default 0,
  pickup_lng double precision not null default 0,
  dest_address text not null default '',
  dest_lat double precision not null default 0,
  dest_lng double precision not null default 0,
  fare_total numeric(10,2) not null default 0 check (fare_total >= 0),
  fare_shared numeric(10,2) not null default 0 check (fare_shared >= 0),
  seats integer not null default 1 check (seats > 0),
  status text not null default 'confirmed' check (status in ('searching', 'matched', 'confirmed', 'in_progress', 'completed', 'cancelled', 'scheduled', 'active')),
  departure_time timestamptz,
  driver_name text,
  vehicle_label text,
  created_at timestamptz not null default now(),
  unique (ride_id, rider_id)
);

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  topic text not null,
  message text not null,
  requested_role text,
  requested_city text,
  created_at timestamptz not null default now()
);

create table public.newsletter_subscriptions (
  email text primary key,
  created_at timestamptz not null default now()
);

create index rides_city_departure_idx
  on public.rides (city, status, departure_time);

create index rides_driver_departure_idx
  on public.rides (driver_id, departure_time desc);

create index bookings_rider_idx
  on public.bookings (rider_id, created_at desc);

create index vehicles_driver_created_idx
  on public.vehicles (driver_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email, is_email_verified)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.email_confirmed_at is not null
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

create or replace function public.sync_user_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set
    email = new.email,
    is_email_verified = new.email_confirmed_at is not null
  where id = new.id;

  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

create trigger on_auth_user_email_updated
  after update of email, email_confirmed_at on auth.users
  for each row execute function public.sync_user_email();

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.driver_applications enable row level security;
alter table public.rides enable row level security;
alter table public.bookings enable row level security;
alter table public.contact_messages enable row level security;
alter table public.newsletter_subscriptions enable row level security;

create policy "Users can read own profile"
  on public.profiles
  for select
  using (auth.uid() = id);

create policy "Anyone can read driver profiles on public rides"
  on public.profiles
  for select
  using (
    exists (
      select 1
      from public.rides
      where rides.driver_id = profiles.id
        and rides.status in ('scheduled', 'active')
    )
  );

create policy "Users can update own profile"
  on public.profiles
  for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Anyone can read live rides"
  on public.rides
  for select
  using (status in ('scheduled', 'active') or driver_id = auth.uid());

create policy "Riders can read booked rides"
  on public.rides
  for select
  using (
    exists (
      select 1
      from public.bookings
      where bookings.ride_id = rides.id
        and bookings.rider_id = auth.uid()
    )
  );

create policy "Approved drivers can insert rides"
  on public.rides
  for insert
  with check (
    auth.uid() = driver_id
    and exists (
      select 1
      from public.driver_applications
      where driver_applications.user_id = auth.uid()
        and driver_applications.status = 'approved'
    )
  );

create policy "Approved drivers can update own rides"
  on public.rides
  for update
  using (
    auth.uid() = driver_id
    and exists (
      select 1
      from public.driver_applications
      where driver_applications.user_id = auth.uid()
        and driver_applications.status = 'approved'
    )
  )
  with check (
    auth.uid() = driver_id
    and exists (
      select 1
      from public.driver_applications
      where driver_applications.user_id = auth.uid()
        and driver_applications.status = 'approved'
    )
  );

create policy "Riders see own bookings"
  on public.bookings
  for select
  using (auth.uid() = rider_id);

create policy "Drivers see bookings on their rides"
  on public.bookings
  for select
  using (
    exists (
      select 1
      from public.rides
      where rides.id = bookings.ride_id
        and rides.driver_id = auth.uid()
    )
  );

create policy "Users can read own application"
  on public.driver_applications
  for select
  using (auth.uid() = user_id);

create policy "Users can submit application"
  on public.driver_applications
  for insert
  with check (
    auth.uid() = user_id
    and status = 'pending'
  );

create policy "Users can update own pending application"
  on public.driver_applications
  for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and status = 'pending'
  );

create policy "Users can read own vehicles"
  on public.vehicles
  for select
  using (auth.uid() = driver_id);

create policy "Anyone can read vehicles on public rides"
  on public.vehicles
  for select
  using (
    exists (
      select 1
      from public.rides
      where rides.driver_id = vehicles.driver_id
        and rides.status in ('scheduled', 'active')
    )
  );

create policy "Drivers can manage own vehicles"
  on public.vehicles
  for all
  using (auth.uid() = driver_id)
  with check (auth.uid() = driver_id);

create policy "Anyone can submit contact messages"
  on public.contact_messages
  for insert
  with check (true);

create policy "Anyone can subscribe to the newsletter"
  on public.newsletter_subscriptions
  for insert
  with check (true);
