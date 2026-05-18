-- CONSOLIDATED MIGRATION: fix booking/profile/auth schema issues
-- This replaces the split 004 files and is safe to re-run in Supabase PostgreSQL.
-- The migration preserves existing rows, avoids duplicate constraint/policy creation,
-- and fixes trigger/function syntax plus unresolved merge artifacts.

-- 1. Rename legacy booking columns only when the old name still exists and the
--    new name does not. PostgreSQL does not support RENAME COLUMN IF EXISTS.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bookings'
      AND column_name = 'seats_booked'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bookings'
      AND column_name = 'seats'
  ) THEN
    EXECUTE 'ALTER TABLE public.bookings RENAME COLUMN seats_booked TO seats';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bookings'
      AND column_name = 'total_fare'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'bookings'
      AND column_name = 'fare_total'
  ) THEN
    EXECUTE 'ALTER TABLE public.bookings RENAME COLUMN total_fare TO fare_total';
  END IF;
END;
$$;

-- 2. Add missing booking columns without inline foreign keys. The FK is added
--    separately so reruns do not create duplicate constraints when the column
--    already exists from a partial migration.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS driver_id uuid,
  ADD COLUMN IF NOT EXISTS city text DEFAULT '',
  ADD COLUMN IF NOT EXISTS pickup_address text DEFAULT '',
  ADD COLUMN IF NOT EXISTS pickup_lat double precision DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pickup_lng double precision DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dest_address text DEFAULT '',
  ADD COLUMN IF NOT EXISTS dest_lat double precision DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dest_lng double precision DEFAULT 0,
  ADD COLUMN IF NOT EXISTS fare_shared numeric(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS departure_time timestamptz,
  ADD COLUMN IF NOT EXISTS driver_name text,
  ADD COLUMN IF NOT EXISTS vehicle_label text;

-- 3. Backfill the new booking columns from the related ride/profile data where
--    possible so existing bookings stay usable after the schema expansion.
UPDATE public.bookings AS b
SET
  driver_id = COALESCE(b.driver_id, r.driver_id),
  city = CASE
    WHEN COALESCE(b.city, '') = '' THEN r.city
    ELSE b.city
  END,
  fare_shared = CASE
    WHEN COALESCE(b.fare_shared, 0) = 0 AND COALESCE(b.seats, 0) > 0
      THEN ROUND((b.fare_total / b.seats)::numeric, 2)
    ELSE b.fare_shared
  END,
  departure_time = COALESCE(b.departure_time, r.departure_time),
  driver_name = COALESCE(b.driver_name, p.full_name),
  vehicle_label = COALESCE(b.vehicle_label, v.vehicle_label)
FROM public.rides AS r
LEFT JOIN public.profiles AS p
  ON p.id = r.driver_id
LEFT JOIN LATERAL (
  SELECT NULLIF(concat_ws(' ', v.color, v.make, v.model), '') AS vehicle_label
  FROM public.vehicles AS v
  WHERE v.driver_id = r.driver_id
  ORDER BY v.created_at DESC, v.id DESC
  LIMIT 1
) AS v
  ON true
WHERE b.ride_id = r.id
  AND (
    b.driver_id IS NULL
    OR COALESCE(b.city, '') = ''
    OR COALESCE(b.fare_shared, 0) = 0
    OR b.departure_time IS NULL
    OR b.driver_name IS NULL
    OR b.vehicle_label IS NULL
  );

-- 4. Normalize defaults and NOT NULL requirements for the new booking columns.
--    This keeps boolean/numeric/text defaults explicit and uses timestamptz for
--    time-based data without rewriting existing departure timestamps.
UPDATE public.bookings
SET
  city = COALESCE(city, ''),
  pickup_address = COALESCE(pickup_address, ''),
  pickup_lat = COALESCE(pickup_lat, 0),
  pickup_lng = COALESCE(pickup_lng, 0),
  dest_address = COALESCE(dest_address, ''),
  dest_lat = COALESCE(dest_lat, 0),
  dest_lng = COALESCE(dest_lng, 0),
  fare_shared = COALESCE(fare_shared, 0)
WHERE
  city IS NULL
  OR pickup_address IS NULL
  OR pickup_lat IS NULL
  OR pickup_lng IS NULL
  OR dest_address IS NULL
  OR dest_lat IS NULL
  OR dest_lng IS NULL
  OR fare_shared IS NULL;

ALTER TABLE public.bookings
  ALTER COLUMN city SET DEFAULT '',
  ALTER COLUMN city SET NOT NULL,
  ALTER COLUMN pickup_address SET DEFAULT '',
  ALTER COLUMN pickup_address SET NOT NULL,
  ALTER COLUMN pickup_lat SET DEFAULT 0,
  ALTER COLUMN pickup_lat SET NOT NULL,
  ALTER COLUMN pickup_lng SET DEFAULT 0,
  ALTER COLUMN pickup_lng SET NOT NULL,
  ALTER COLUMN dest_address SET DEFAULT '',
  ALTER COLUMN dest_address SET NOT NULL,
  ALTER COLUMN dest_lat SET DEFAULT 0,
  ALTER COLUMN dest_lat SET NOT NULL,
  ALTER COLUMN dest_lng SET DEFAULT 0,
  ALTER COLUMN dest_lng SET NOT NULL,
  ALTER COLUMN fare_shared SET DEFAULT 0,
  ALTER COLUMN fare_shared SET NOT NULL;

-- 5. Add the bookings.driver_id foreign key safely. NOT VALID preserves any
--    unexpected legacy rows, and validation runs only if the data is clean.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint AS con
    JOIN pg_attribute AS att
      ON att.attrelid = con.conrelid
     AND att.attnum = ANY (con.conkey)
    WHERE con.conrelid = 'public.bookings'::regclass
      AND con.confrelid = 'public.profiles'::regclass
      AND con.contype = 'f'
    GROUP BY con.oid
    HAVING array_agg(att.attname ORDER BY att.attnum) = ARRAY['driver_id']
  ) THEN
    EXECUTE '
      ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_driver_id_fkey
      FOREIGN KEY (driver_id)
      REFERENCES public.profiles(id)
      ON DELETE SET NULL
      NOT VALID
    ';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.bookings'::regclass
      AND conname = 'bookings_driver_id_fkey'
      AND NOT convalidated
  ) AND NOT EXISTS (
    SELECT 1
    FROM public.bookings AS b
    WHERE b.driver_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1
        FROM public.profiles AS p
        WHERE p.id = b.driver_id
      )
  ) THEN
    EXECUTE 'ALTER TABLE public.bookings VALIDATE CONSTRAINT bookings_driver_id_fkey';
  END IF;
END;
$$;

-- 6. Replace legacy/duplicate booking status constraints with one canonical
--    constraint. CHECK constraints do not support IF NOT EXISTS, so catalog
--    inspection is required. NOT VALID preserves unexpected legacy statuses.
DO $$
DECLARE
  v_constraint record;
BEGIN
  FOR v_constraint IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.bookings'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
  LOOP
    EXECUTE format(
      'ALTER TABLE public.bookings DROP CONSTRAINT %I',
      v_constraint.conname
    );
  END LOOP;

  EXECUTE '
    ALTER TABLE public.bookings
    ADD CONSTRAINT bookings_status_check
    CHECK (
      status = ANY (
        ARRAY[
          ''searching'',
          ''matched'',
          ''confirmed'',
          ''in_progress'',
          ''completed'',
          ''cancelled'',
          ''scheduled'',
          ''active''
        ]::text[]
      )
    )
    NOT VALID
  ';

  IF NOT EXISTS (
    SELECT 1
    FROM public.bookings
    WHERE status IS NULL
       OR status <> ALL (
         ARRAY[
           'searching',
           'matched',
           'confirmed',
           'in_progress',
           'completed',
           'cancelled',
           'scheduled',
           'active'
         ]::text[]
       )
  ) THEN
    EXECUTE 'ALTER TABLE public.bookings VALIDATE CONSTRAINT bookings_status_check';
  END IF;
END;
$$;

-- 7. Add the missing profile columns. The boolean columns are explicitly
--    normalized to false defaults and NOT NULL for Supabase client consistency.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS home_address text,
  ADD COLUMN IF NOT EXISTS work_address text,
  ADD COLUMN IF NOT EXISTS is_phone_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_email_verified boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- 8. Backfill profile emails from auth.users and normalize boolean nulls that
--    might exist from a partial migration before NOT NULL is enforced.
UPDATE public.profiles AS p
SET email = u.email
FROM auth.users AS u
WHERE u.id = p.id
  AND p.email IS DISTINCT FROM u.email;

UPDATE public.profiles
SET
  is_phone_verified = COALESCE(is_phone_verified, false),
  is_email_verified = COALESCE(is_email_verified, false),
  onboarding_completed = COALESCE(onboarding_completed, false)
WHERE
  is_phone_verified IS NULL
  OR is_email_verified IS NULL
  OR onboarding_completed IS NULL;

ALTER TABLE public.profiles
  ALTER COLUMN is_phone_verified SET DEFAULT false,
  ALTER COLUMN is_phone_verified SET NOT NULL,
  ALTER COLUMN is_email_verified SET DEFAULT false,
  ALTER COLUMN is_email_verified SET NOT NULL,
  ALTER COLUMN onboarding_completed SET DEFAULT false,
  ALTER COLUMN onboarding_completed SET NOT NULL;

-- 9. Keep public.profiles.email synchronized with auth.users.email. The trigger
--    only fires on auth.users updates, so it cannot recurse back into auth.users.
CREATE OR REPLACE FUNCTION public.sync_user_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.email IS NOT DISTINCT FROM OLD.email THEN
    RETURN NEW;
  END IF;

  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id
    AND email IS DISTINCT FROM NEW.email;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;
CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  WHEN (OLD.email IS DISTINCT FROM NEW.email)
  EXECUTE FUNCTION public.sync_user_email();

-- 10. Recreate the auth insert trigger with modern EXECUTE FUNCTION syntax and
--     an upsert that preserves existing profile data while backfilling email.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email)
  ON CONFLICT (id) DO UPDATE
  SET
    full_name = COALESCE(NULLIF(EXCLUDED.full_name, ''), public.profiles.full_name),
    email = COALESCE(NULLIF(EXCLUDED.email, ''), public.profiles.email);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 11. Recreate the booking RPC with a fixed signature, explicit auth checks,
--     timestamptz-safe booking timestamps, and a single-row vehicle lookup to
--     avoid "query returned more than one row" errors.
DROP FUNCTION IF EXISTS public.book_ride(uuid, uuid, integer);
DROP FUNCTION IF EXISTS public.book_ride(
  uuid,
  uuid,
  integer,
  text,
  double precision,
  double precision,
  text,
  double precision,
  double precision
);

CREATE OR REPLACE FUNCTION public.book_ride(
  p_ride_id uuid,
  p_rider_id uuid,
  p_seats integer,
  p_pickup_address text,
  p_pickup_lat double precision,
  p_pickup_lng double precision,
  p_dest_address text,
  p_dest_lat double precision,
  p_dest_lng double precision
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fare_per_seat numeric(10,2);
  v_driver_id uuid;
  v_city text;
  v_departure_time timestamptz;
  v_driver_name text;
  v_vehicle_label text;
  v_booking_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_rider_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Rider mismatch';
  END IF;

  IF p_ride_id IS NULL THEN
    RAISE EXCEPTION 'Ride id is required';
  END IF;

  IF COALESCE(p_seats, 0) < 1 THEN
    RAISE EXCEPTION 'At least one seat must be booked';
  END IF;

  SELECT
    r.fare_per_seat,
    r.driver_id,
    r.city,
    r.departure_time,
    p.full_name
  INTO
    v_fare_per_seat,
    v_driver_id,
    v_city,
    v_departure_time,
    v_driver_name
  FROM public.rides AS r
  LEFT JOIN public.profiles AS p
    ON p.id = r.driver_id
  WHERE r.id = p_ride_id
    AND r.status IN ('scheduled', 'active')
    AND r.seats_available >= p_seats
  FOR UPDATE OF r;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ride not available or not enough seats';
  END IF;

  SELECT NULLIF(concat_ws(' ', v.color, v.make, v.model), '')
  INTO v_vehicle_label
  FROM public.vehicles AS v
  WHERE v.driver_id = v_driver_id
  ORDER BY v.created_at DESC, v.id DESC
  LIMIT 1;

  UPDATE public.rides
  SET seats_available = seats_available - p_seats
  WHERE id = p_ride_id;

  INSERT INTO public.bookings (
    ride_id,
    rider_id,
    driver_id,
    city,
    pickup_address,
    pickup_lat,
    pickup_lng,
    dest_address,
    dest_lat,
    dest_lng,
    fare_total,
    fare_shared,
    seats,
    departure_time,
    driver_name,
    vehicle_label,
    status
  )
  VALUES (
    p_ride_id,
    p_rider_id,
    v_driver_id,
    COALESCE(v_city, ''),
    COALESCE(p_pickup_address, ''),
    COALESCE(p_pickup_lat, 0),
    COALESCE(p_pickup_lng, 0),
    COALESCE(p_dest_address, ''),
    COALESCE(p_dest_lat, 0),
    COALESCE(p_dest_lng, 0),
    v_fare_per_seat * p_seats,
    v_fare_per_seat,
    p_seats,
    v_departure_time,
    v_driver_name,
    v_vehicle_label,
    'confirmed'
  )
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$;

-- 12. Recreate the cancellation RPC with the correct return type and auth
--     checks. LEAST prevents seat counts from exceeding seats_total on reruns
--     or unusual recovery paths.
DROP FUNCTION IF EXISTS public.cancel_booking(uuid, uuid);

CREATE OR REPLACE FUNCTION public.cancel_booking(
  p_booking_id uuid,
  p_rider_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ride_id uuid;
  v_seats integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_rider_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Rider mismatch';
  END IF;

  SELECT ride_id, seats
  INTO v_ride_id, v_seats
  FROM public.bookings
  WHERE id = p_booking_id
    AND rider_id = p_rider_id
    AND status <> 'cancelled'
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or already cancelled';
  END IF;

  UPDATE public.bookings
  SET status = 'cancelled'
  WHERE id = p_booking_id;

  IF v_ride_id IS NOT NULL AND COALESCE(v_seats, 0) > 0 THEN
    UPDATE public.rides
    SET seats_available = LEAST(seats_total, seats_available + v_seats)
    WHERE id = v_ride_id;
  END IF;
END;
$$;

-- 13. Keep RLS enabled on the affected table. This is idempotent and protects
--     against manual drift while remaining compatible with existing policies.
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 14. PostgreSQL does not support CREATE POLICY IF NOT EXISTS, so use a
--     catalog check before adding the driver booking visibility policy.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'bookings'
      AND policyname = 'Drivers see bookings on their rides'
  ) THEN
    EXECUTE '
      CREATE POLICY "Drivers see bookings on their rides"
      ON public.bookings
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.rides
          WHERE rides.id = bookings.ride_id
            AND rides.driver_id = auth.uid()
        )
      )
    ';
  END IF;
END;
$$;

-- 15. Ensure the driver documents bucket exists. ON CONFLICT DO NOTHING keeps
--     any existing bucket metadata intact instead of overwriting storage config.
INSERT INTO storage.buckets (id, name, public)
VALUES ('driver-documents', 'driver-documents', false)
ON CONFLICT (id) DO NOTHING;

-- 16. storage.objects policies also need catalog checks because CREATE POLICY
--     has no IF NOT EXISTS clause in PostgreSQL.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Drivers upload own documents'
  ) THEN
    EXECUTE '
      CREATE POLICY "Drivers upload own documents"
      ON storage.objects
      FOR INSERT
      WITH CHECK (
        bucket_id = ''driver-documents''
        AND auth.uid()::text = (storage.foldername(name))[1]
      )
    ';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Drivers read own documents'
  ) THEN
    EXECUTE '
      CREATE POLICY "Drivers read own documents"
      ON storage.objects
      FOR SELECT
      USING (
        bucket_id = ''driver-documents''
        AND auth.uid()::text = (storage.foldername(name))[1]
      )
    ';
  END IF;
END;
$$;
