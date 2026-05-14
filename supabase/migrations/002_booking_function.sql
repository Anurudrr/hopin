create or replace function public.book_ride(
  p_ride_id uuid,
  p_rider_id uuid,
  p_seats integer
) returns uuid as $$
declare
  v_fare_per_seat numeric;
  v_booking_id uuid;
begin
  select fare_per_seat into v_fare_per_seat
  from public.rides
  where id = p_ride_id and seats_available >= p_seats
  for update;

  if not found then
    raise exception 'Not enough seats available';
  end if;

  update public.rides
  set seats_available = seats_available - p_seats
  where id = p_ride_id;

  insert into public.bookings (ride_id, rider_id, seats_booked, total_fare)
  values (p_ride_id, p_rider_id, p_seats, v_fare_per_seat * p_seats)
  returning id into v_booking_id;

  return v_booking_id;
end;
$$ language plpgsql security definer;
