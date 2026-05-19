-- Allow a rider to cancel and later rebook the same ride without tripping the
-- unique(ride_id, rider_id) constraint. We reuse the cancelled row instead of
-- creating a second booking record for the same rider/ride pair.
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
        status = 'confirmed'
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
  END IF;

  RETURN v_booking_id;
END;
$$;
