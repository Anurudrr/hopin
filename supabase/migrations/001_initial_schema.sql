create extension if not exists "pgcrypto";

create table public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  full_name text,
  phone text,
  city text,
  role text not null default 'rider' check (role in ('rider', 'driver', 'admin')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.vehicles (
  id uuid primary key default gen_random_uuid(),
  driver_id uuid references public.profiles(id) on delete cascade not null,
  make text not null,
  model text not null,
  year integer not null,
  color text not null,
  license_plate text not null unique,
  capacity integer not null default 4,
  created_at timestamptz not null default now()
);

create table public.driver_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null unique,
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
  seats_total integer not null default 4,
  seats_available integer not null default 4,
  fare_per_seat numeric(10,2) not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'active', 'completed', 'cancelled')),
  created_at timestamptz not null default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  ride_id uuid references public.rides(id) on delete cascade not null,
  rider_id uuid references public.profiles(id) on delete cascade not null,
  seats_booked integer not null default 1,
  total_fare numeric(10,2) not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  unique(ride_id, rider_id)
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
  on public.rides (city, departure_time, status);

create index bookings_rider_idx
  on public.bookings (rider_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.vehicles enable row level security;
alter table public.driver_applications enable row level security;
alter table public.rides enable row level security;
alter table public.bookings enable row level security;
alter table public.contact_messages enable row level security;
alter table public.newsletter_subscriptions enable row level security;

create policy "Users can read any profile" on public.profiles for select using (true);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

create policy "Anyone can read scheduled rides" on public.rides for select using (status = 'scheduled' or driver_id = auth.uid());
create policy "Riders can read booked rides" on public.rides for select using (
  exists (
    select 1
    from public.bookings
    where bookings.ride_id = rides.id
      and bookings.rider_id = auth.uid()
  )
);
create policy "Drivers can insert rides" on public.rides for insert with check (auth.uid() = driver_id);
create policy "Drivers can update own rides" on public.rides for update using (auth.uid() = driver_id);

create policy "Riders see own bookings" on public.bookings for select using (auth.uid() = rider_id);
create policy "Riders can book" on public.bookings for insert with check (auth.uid() = rider_id);
create policy "Riders can cancel own booking" on public.bookings for update using (auth.uid() = rider_id);

create policy "Users can read own application" on public.driver_applications for select using (auth.uid() = user_id);
create policy "Users can submit application" on public.driver_applications for insert with check (auth.uid() = user_id);

create policy "Anyone can read vehicles" on public.vehicles for select using (true);
create policy "Drivers can manage own vehicles" on public.vehicles for all using (auth.uid() = driver_id);

create policy "Anyone can submit contact messages" on public.contact_messages for insert to anon, authenticated with check (true);
create policy "Anyone can subscribe to the newsletter" on public.newsletter_subscriptions for insert to anon, authenticated with check (true);
