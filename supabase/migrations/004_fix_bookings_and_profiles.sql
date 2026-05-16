-- 1. Drop old status constraint
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- 2. Rename columns to match TypeScript interface
ALTER TABLE public.bookings RENAME COLUMN seats_booked TO seats;
ALTER TABLE public.bookings RENAME COLUMN total_fare TO fare_total;

-- 3. Add all missing columns to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS driver_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pickup_address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pickup_lat double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pickup_lng double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dest_address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS dest_lat double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dest_lng double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fare_shared numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS departure_time timestamptz,
  ADD COLUMN IF NOT EXISTS driver_name text,
  ADD COLUMN IF NOT EXISTS vehicle_label text;

-- 4. Add correct status constraint
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('searching','matched','confirmed','in_progress','completed','cancelled','scheduled','active'));

-- 5. Add missing columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS home_address text,
  ADD COLUMN IF NOT EXISTS work_address text,
  ADD COLUMN IF NOT EXISTS is_phone_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- 6. Keep profile email in sync with auth.users
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.sync_user_email();

-- 7. Fix handle_new_user to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Drop and recreate book_ride with correct column names and full data
DROP FUNCTION IF EXISTS public.book_ride;
CREATE OR REPLACE FUNCTION public.book_ride(
  p_ride_id uuid, p_rider_id uuid, p_seats integer,
  p_pickup_address text, p_pickup_lat double precision, p_pickup_lng double precision,
  p_dest_address text, p_dest_lat double precision, p_dest_lng double precision
) RETURNS uuid AS $$
DECLARE
  v_fare_per_seat numeric; v_driver_id uuid; v_city text;
  v_departure_time timestamptz; v_driver_name text; v_vehicle_label text;
  v_booking_id uuid;
BEGIN
  SELECT r.fare_per_seat, r.driver_id, r.city, r.departure_time,
    p.full_name,
    COALESCE(v.color || ' ' || v.make || ' ' || v.model, NULL)
  INTO v_fare_per_seat, v_driver_id, v_city, v_departure_time, v_driver_name, v_vehicle_label
  FROM public.rides r
  LEFT JOIN public.profiles p ON p.id = r.driver_id
  LEFT JOIN public.vehicles v ON v.driver_id = r.driver_id
  WHERE r.id = p_ride_id AND r.seats_available >= p_seats
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Not enough seats available'; END IF;

  UPDATE public.rides SET seats_available = seats_available - p_seats WHERE id = p_ride_id;

  INSERT INTO public.bookings (
    ride_id, rider_id, driver_id, city,
    pickup_address, pickup_lat, pickup_lng,
    dest_address, dest_lat, dest_lng,
    fare_total, fare_shared, seats,
    departure_time, driver_name, vehicle_label, status
  ) VALUES (
    p_ride_id, p_rider_id, v_driver_id, v_city,
    p_pickup_address, p_pickup_lat, p_pickup_lng,
    p_dest_address, p_dest_lat, p_dest_lng,
    v_fare_per_seat * p_seats, v_fare_per_seat, p_seats,
    v_departure_time, v_driver_name, v_vehicle_label, 'confirmed'
  ) RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Drop and recreate cancel_booking with correct column names
DROP FUNCTION IF EXISTS public.cancel_booking;
CREATE OR REPLACE FUNCTION public.cancel_booking(
  p_booking_id uuid, p_rider_id uuid
) RETURNS void AS $$
DECLARE v_ride_id uuid; v_seats integer;
BEGIN
  SELECT ride_id, seats INTO v_ride_id, v_seats
  FROM public.bookings
  WHERE id = p_booking_id AND rider_id = p_rider_id AND status != 'cancelled'
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found or already cancelled'; END IF;

  UPDATE public.bookings SET status = 'cancelled' WHERE id = p_booking_id;
  UPDATE public.rides SET seats_available = seats_available + v_seats WHERE id = v_ride_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. RLS: drivers can see bookings on their rides
CREATE POLICY IF NOT EXISTS "Drivers see bookings on their rides"
  ON public.bookings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.rides
    WHERE rides.id = bookings.ride_id AND rides.driver_id = auth.uid()
  ));

-- 11. Supabase Storage bucket for driver documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-documents', 'driver-documents', false)
ON CONFLICT DO NOTHING;

CREATE POLICY IF NOT EXISTS "Drivers upload own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "Drivers read own documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
-- 1. Drop old status constraint
ALTER TABLE public.bookings DROP CONSTRAINT IF EXISTS bookings_status_check;

-- 2. Rename columns to match TypeScript interface
ALTER TABLE public.bookings RENAME COLUMN seats_booked TO seats;
ALTER TABLE public.bookings RENAME COLUMN total_fare TO fare_total;

-- 3. Add all missing columns to bookings
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS driver_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS city text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pickup_address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS pickup_lat double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pickup_lng double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dest_address text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS dest_lat double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dest_lng double precision NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fare_shared numeric(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS departure_time timestamptz,
  ADD COLUMN IF NOT EXISTS driver_name text,
  ADD COLUMN IF NOT EXISTS vehicle_label text;

-- 4. Add correct status constraint
ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check
  CHECK (status IN ('searching','matched','confirmed','in_progress','completed','cancelled','scheduled','active'));

-- 5. Add missing columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS home_address text,
  ADD COLUMN IF NOT EXISTS work_address text,
  ADD COLUMN IF NOT EXISTS is_phone_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_email_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;

-- 6. Keep profile email in sync with auth.users
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS trigger AS $$
BEGIN
  UPDATE public.profiles SET email = NEW.email WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.sync_user_email();

-- 7. Fix handle_new_user to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Drop and recreate book_ride with correct column names and full data
DROP FUNCTION IF EXISTS public.book_ride;
CREATE OR REPLACE FUNCTION public.book_ride(
  p_ride_id uuid, p_rider_id uuid, p_seats integer,
  p_pickup_address text, p_pickup_lat double precision, p_pickup_lng double precision,
  p_dest_address text, p_dest_lat double precision, p_dest_lng double precision
) RETURNS uuid AS $$
DECLARE
  v_fare_per_seat numeric; v_driver_id uuid; v_city text;
  v_departure_time timestamptz; v_driver_name text; v_vehicle_label text;
  v_booking_id uuid;
BEGIN
  SELECT r.fare_per_seat, r.driver_id, r.city, r.departure_time,
    p.full_name,
    COALESCE(v.color || ' ' || v.make || ' ' || v.model, NULL)
  INTO v_fare_per_seat, v_driver_id, v_city, v_departure_time, v_driver_name, v_vehicle_label
  FROM public.rides r
  LEFT JOIN public.profiles p ON p.id = r.driver_id
  LEFT JOIN public.vehicles v ON v.driver_id = r.driver_id
  WHERE r.id = p_ride_id AND r.seats_available >= p_seats
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Not enough seats available'; END IF;

  UPDATE public.rides SET seats_available = seats_available - p_seats WHERE id = p_ride_id;

  INSERT INTO public.bookings (
    ride_id, rider_id, driver_id, city,
    pickup_address, pickup_lat, pickup_lng,
    dest_address, dest_lat, dest_lng,
    fare_total, fare_shared, seats,
    departure_time, driver_name, vehicle_label, status
  ) VALUES (
    p_ride_id, p_rider_id, v_driver_id, v_city,
    p_pickup_address, p_pickup_lat, p_pickup_lng,
    p_dest_address, p_dest_lat, p_dest_lng,
    v_fare_per_seat * p_seats, v_fare_per_seat, p_seats,
    v_departure_time, v_driver_name, v_vehicle_label, 'confirmed'
  ) RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Drop and recreate cancel_booking with correct column names
DROP FUNCTION IF EXISTS public.cancel_booking;
CREATE OR REPLACE FUNCTION public.cancel_booking(
  p_booking_id uuid, p_rider_id uuid
) RETURNS void AS $$
DECLARE v_ride_id uuid; v_seats integer;
BEGIN
  SELECT ride_id, seats INTO v_ride_id, v_seats
  FROM public.bookings
  WHERE id = p_booking_id AND rider_id = p_rider_id AND status != 'cancelled'
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'Booking not found or already cancelled'; END IF;

  UPDATE public.bookings SET status = 'cancelled' WHERE id = p_booking_id;
  UPDATE public.rides SET seats_available = seats_available + v_seats WHERE id = v_ride_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. RLS: drivers can see bookings on their rides
CREATE POLICY IF NOT EXISTS "Drivers see bookings on their rides"
  ON public.bookings FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.rides
    WHERE rides.id = bookings.ride_id AND rides.driver_id = auth.uid()
  ));

-- 11. Supabase Storage bucket for driver documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-documents', 'driver-documents', false)
ON CONFLICT DO NOTHING;

CREATE POLICY IF NOT EXISTS "Drivers upload own documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY IF NOT EXISTS "Drivers read own documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'driver-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
