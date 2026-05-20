import type { Ride } from "../types";

const BOOKING_PATH = "/book";

type ShareableRide = Pick<Ride, "city" | "id">;

export function getRequestedRideId(value: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function buildRideSharePath(ride: ShareableRide) {
  const params = new URLSearchParams({
    city: ride.city,
    ride: ride.id,
  });

  return `${BOOKING_PATH}?${params.toString()}`;
}

export function buildRideShareUrl(origin: string, ride: ShareableRide) {
  return new URL(buildRideSharePath(ride), origin).toString();
}
