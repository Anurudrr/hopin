create or replace function public.cancel_booking(
  p_booking_id uuid,
  p_rider_id uuid
) returns uuid as $$
declare
  v_ride_id uuid;
  v_seats integer;
begin
  select ride_id, seats_booked
  into v_ride_id, v_seats
  from public.bookings
  where id = p_booking_id
    and rider_id = p_rider_id
    and status = 'confirmed'
  for update;

  if not found then
    raise exception 'Active booking not found';
  end if;

  update public.bookings
  set status = 'cancelled'
  where id = p_booking_id;

  update public.rides
  set seats_available = seats_available + v_seats
  where id = v_ride_id;

  return p_booking_id;
end;
$$ language plpgsql security definer;
