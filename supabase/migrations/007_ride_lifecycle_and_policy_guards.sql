-- 007: formalize ride lifecycle actions and tighten backend state handling

-- 1. Preserve lifecycle timestamps and cancellation reasons on rides/bookings.
ALTER TABLE public.rides
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_reason text;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancel_reason text;

-- 2. Drivers must be able to read their own ride history, including completed
--    and cancelled rides, while the public still sees only live inventory.
DROP POLICY IF EXISTS "Drivers can read own ride history" ON public.rides;
CREATE POLICY "Drivers can read own ride history"
  ON public.rides
  FOR SELECT
  USING (auth.uid() = driver_id);

-- 3. Block direct client-side ride updates for now. Lifecycle changes should go
--    through the RPCs below so booking state stays synchronized with ride state.
DROP POLICY IF EXISTS "Approved drivers can update own rides" ON public.rides;

-- 4. Recreate book_ride so booking state reflects whether the ride is already
--    active and so cancelled rows can be safely reused.
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
  v_existing_booking_id uuid;
  v_existing_booking_status text;
  v_ride_status text;
  v_booking_status text;
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
    r.status,
    p.full_name
  INTO
    v_fare_per_seat,
    v_driver_id,
    v_city,
    v_departure_time,
    v_ride_status,
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

  SELECT
    b.id,
    b.status
  INTO
    v_existing_booking_id,
    v_existing_booking_status
  FROM public.bookings AS b
  WHERE b.ride_id = p_ride_id
    AND b.rider_id = p_rider_id
  ORDER BY b.created_at DESC, b.id DESC
  LIMIT 1
  FOR UPDATE OF b;

  IF v_existing_booking_id IS NOT NULL AND v_existing_booking_status <> 'cancelled' THEN
    RAISE EXCEPTION 'Ride already booked by this rider';
  END IF;

  SELECT NULLIF(concat_ws(' ', v.color, v.make, v.model), '')
  INTO v_vehicle_label
  FROM public.vehicles AS v
  WHERE v.driver_id = v_driver_id
  ORDER BY v.created_at DESC, v.id DESC
  LIMIT 1;

  v_booking_status := CASE
    WHEN v_ride_status = 'active' THEN 'in_progress'
    ELSE 'confirmed'
  END;

  UPDATE public.rides
  SET seats_available = seats_available - p_seats
  WHERE id = p_ride_id;

  IF v_existing_booking_id IS NOT NULL THEN
    UPDATE public.bookings
    SET driver_id = v_driver_id,
        city = COALESCE(v_city, ''),
        pickup_address = COALESCE(p_pickup_address, ''),
        pickup_lat = COALESCE(p_pickup_lat, 0),
        pickup_lng = COALESCE(p_pickup_lng, 0),
        dest_address = COALESCE(p_dest_address, ''),
        dest_lat = COALESCE(p_dest_lat, 0),
        dest_lng = COALESCE(p_dest_lng, 0),
        fare_total = v_fare_per_seat * p_seats,
        fare_shared = v_fare_per_seat,
        seats = p_seats,
        departure_time = v_departure_time,
        driver_name = v_driver_name,
        vehicle_label = v_vehicle_label,
        status = v_booking_status,
        started_at = CASE
          WHEN v_booking_status = 'in_progress' THEN COALESCE(started_at, now())
          ELSE NULL
        END,
        completed_at = NULL,
        cancelled_at = NULL,
        cancel_reason = NULL
    WHERE id = v_existing_booking_id;

    v_booking_id := v_existing_booking_id;
  ELSE
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
      status,
      started_at,
      completed_at,
      cancelled_at,
      cancel_reason
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
      v_booking_status,
      CASE WHEN v_booking_status = 'in_progress' THEN now() ELSE NULL END,
      NULL,
      NULL,
      NULL
    )
    RETURNING id INTO v_booking_id;
  END IF;

  RETURN v_booking_id;
END;
$$;

-- 5. Recreate cancel_booking so cancelling an in-progress booking does not
--    incorrectly increase seat availability on a ride that already started.
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
  v_ride_status text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_rider_id IS DISTINCT FROM auth.uid() THEN
    RAISE EXCEPTION 'Rider mismatch';
  END IF;

  SELECT
    b.ride_id,
    b.seats,
    r.status
  INTO
    v_ride_id,
    v_seats,
    v_ride_status
  FROM public.bookings AS b
  JOIN public.rides AS r
    ON r.id = b.ride_id
  WHERE b.id = p_booking_id
    AND b.rider_id = p_rider_id
    AND b.status NOT IN ('cancelled', 'completed')
  FOR UPDATE OF b, r;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Booking not found or cannot be cancelled';
  END IF;

  UPDATE public.bookings
  SET status = 'cancelled',
      cancelled_at = COALESCE(cancelled_at, now()),
      cancel_reason = COALESCE(cancel_reason, 'Cancelled by rider')
  WHERE id = p_booking_id;

  IF v_ride_status = 'scheduled' THEN
    UPDATE public.rides
    SET seats_available = LEAST(seats_total, seats_available + v_seats)
    WHERE id = v_ride_id;
  END IF;
END;
$$;

-- 6. Formal ride lifecycle actions for drivers.
DROP FUNCTION IF EXISTS public.start_ride(uuid);
CREATE OR REPLACE FUNCTION public.start_ride(
  p_ride_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_started_at timestamptz := now();
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_ride_id IS NULL THEN
    RAISE EXCEPTION 'Ride id is required';
  END IF;

  UPDATE public.rides
  SET status = 'active',
      started_at = COALESCE(started_at, v_started_at),
      completed_at = NULL,
      cancelled_at = NULL,
      cancel_reason = NULL
  WHERE id = p_ride_id
    AND driver_id = auth.uid()
    AND status = 'scheduled';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ride must be scheduled before it can start';
  END IF;

  UPDATE public.bookings
  SET status = 'in_progress',
      started_at = COALESCE(started_at, v_started_at)
  WHERE ride_id = p_ride_id
    AND status IN ('searching', 'matched', 'confirmed', 'scheduled', 'active');

  RETURN p_ride_id;
END;
$$;

DROP FUNCTION IF EXISTS public.complete_ride(uuid);
CREATE OR REPLACE FUNCTION public.complete_ride(
  p_ride_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_completed_at timestamptz := now();
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_ride_id IS NULL THEN
    RAISE EXCEPTION 'Ride id is required';
  END IF;

  UPDATE public.rides
  SET status = 'completed',
      completed_at = COALESCE(completed_at, v_completed_at)
  WHERE id = p_ride_id
    AND driver_id = auth.uid()
    AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ride must be active before it can complete';
  END IF;

  UPDATE public.bookings
  SET status = 'completed',
      completed_at = COALESCE(completed_at, v_completed_at)
  WHERE ride_id = p_ride_id
    AND status IN ('searching', 'matched', 'confirmed', 'in_progress', 'scheduled', 'active');

  RETURN p_ride_id;
END;
$$;

DROP FUNCTION IF EXISTS public.cancel_ride_by_driver(uuid, text);
CREATE OR REPLACE FUNCTION public.cancel_ride_by_driver(
  p_ride_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cancelled_at timestamptz := now();
  v_reason text := COALESCE(NULLIF(BTRIM(p_reason), ''), 'Cancelled by driver');
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_ride_id IS NULL THEN
    RAISE EXCEPTION 'Ride id is required';
  END IF;

  UPDATE public.rides
  SET status = 'cancelled',
      seats_available = seats_total,
      cancelled_at = COALESCE(cancelled_at, v_cancelled_at),
      cancel_reason = v_reason
  WHERE id = p_ride_id
    AND driver_id = auth.uid()
    AND status IN ('scheduled', 'active');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Only scheduled or active rides can be cancelled';
  END IF;

  UPDATE public.bookings
  SET status = 'cancelled',
      cancelled_at = COALESCE(cancelled_at, v_cancelled_at),
      cancel_reason = COALESCE(cancel_reason, v_reason)
  WHERE ride_id = p_ride_id
    AND status NOT IN ('cancelled', 'completed');

  RETURN p_ride_id;
END;
$$;
