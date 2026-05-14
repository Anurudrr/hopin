import { bookingLocations } from "../content/siteContent";
import type {
  Booking,
  BookingStatus,
  DriverApplication,
  DriverApplicationInput,
  DriverDashboardData,
  Profile,
  Ride,
  RideInput,
  RiderDashboardData,
  RideStatus,
  Vehicle,
} from "../types";
import { getErrorMessage, logDevError } from "./errors";
import { buildProfile, type ProfileRow } from "./profile";
import { supabase } from "./supabase";

type RideDriver = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
};

type RawRideRow = {
  id: string;
  driver_id: string | null;
  origin_name: string;
  origin_lat: number;
  origin_lng: number;
  destination_name: string;
  destination_lat: number;
  destination_lng: number;
  city: string;
  departure_time: string;
  seats_total: number;
  seats_available: number;
  fare_per_seat: number | string;
  status: RideStatus;
  created_at: string;
  driver: RideDriver | null;
};

type RawVehicleRow = Vehicle;

type RawBookingRow = {
  id: string;
  ride_id: string;
  rider_id: string;
  seats_booked: number;
  total_fare: number | string;
  status: BookingStatus;
  created_at: string;
  ride: RawRideRow | null;
};

function numberValue(value: number | string) {
  return typeof value === "number" ? value : Number(value)
}

function resolveVehicleLabel(vehicle: Pick<Vehicle, "make" | "model" | "color" | "license_plate"> | null) {
  if (!vehicle) {
    return null
  }

  return `${vehicle.color} ${vehicle.make} ${vehicle.model} · ${vehicle.license_plate}`
}

async function getCurrentUser() {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.user) {
    throw new Error("Sign in to continue.")
  }

  return session.user
}

async function getVehicleMap(driverIds: string[]) {
  if (!driverIds.length) {
    return new Map<string, RawVehicleRow>()
  }

  const { data, error } = await supabase
    .from("vehicles")
    .select("*")
    .in("driver_id", driverIds)
    .order("created_at", { ascending: false })

  if (error) {
    throw error
  }

  const vehicles = new Map<string, RawVehicleRow>()

  for (const vehicle of data ?? []) {
    if (!vehicles.has(vehicle.driver_id)) {
      vehicles.set(vehicle.driver_id, vehicle)
    }
  }

  return vehicles
}

async function transformRides(rows: RawRideRow[]) {
  const driverIds = rows
    .map((ride) => ride.driver_id)
    .filter((driverId): driverId is string => Boolean(driverId))
  const vehicleMap = await getVehicleMap([...new Set(driverIds)])

  return rows.map<Ride>((ride) => {
    const vehicle = ride.driver_id ? vehicleMap.get(ride.driver_id) ?? null : null

    return {
      id: ride.id,
      driver_id: ride.driver_id,
      origin_name: ride.origin_name,
      origin_lat: ride.origin_lat,
      origin_lng: ride.origin_lng,
      destination_name: ride.destination_name,
      destination_lat: ride.destination_lat,
      destination_lng: ride.destination_lng,
      city: ride.city,
      departure_time: ride.departure_time,
      seats_total: ride.seats_total,
      seats_available: ride.seats_available,
      fare_per_seat: numberValue(ride.fare_per_seat),
      status: ride.status,
      created_at: ride.created_at,
      driver: ride.driver,
      vehicle: vehicle
        ? {
            make: vehicle.make,
            model: vehicle.model,
            color: vehicle.color,
            license_plate: vehicle.license_plate,
          }
        : null,
    }
  })
}

async function transformBookings(rows: RawBookingRow[]) {
  const rides = rows
    .map((booking) => booking.ride)
    .filter((ride): ride is RawRideRow => Boolean(ride))
  const rideMap = new Map((await transformRides(rides)).map((ride) => [ride.id, ride]))

  return rows.map<Booking>((booking) => {
    const ride = rideMap.get(booking.ride_id) ?? null

    return {
      id: booking.id,
      ride_id: booking.ride_id,
      rider_id: booking.rider_id,
      driver_id: ride?.driver_id ?? null,
      city: ride?.city ?? "",
      pickup_address: ride?.origin_name ?? "",
      pickup_lat: ride?.origin_lat ?? 0,
      pickup_lng: ride?.origin_lng ?? 0,
      dest_address: ride?.destination_name ?? "",
      dest_lat: ride?.destination_lat ?? 0,
      dest_lng: ride?.destination_lng ?? 0,
      fare_total: numberValue(booking.total_fare),
      fare_shared: numberValue(booking.total_fare),
      seats: booking.seats_booked,
      status: booking.status,
      created_at: booking.created_at,
      departure_time: ride?.departure_time ?? booking.created_at,
      driver_name: ride?.driver?.full_name ?? null,
      vehicle_label: resolveVehicleLabel(ride?.vehicle ?? null),
    }
  })
}

function pickMatchedRide(
  rides: Ride[],
  payload: {
    city: string;
    destination: { address: string; lat: number; lng: number };
    pickup: { address: string; lat: number; lng: number };
    seats: number;
  },
) {
  const exactMatch = rides.find(
    (ride) =>
      ride.origin_name === payload.pickup.address &&
      ride.destination_name === payload.destination.address &&
      ride.seats_available >= payload.seats,
  )

  if (exactMatch) {
    return exactMatch
  }

  const supportedStops = bookingLocations.filter((location) => location.city === payload.city)
  const knownRouteNames = new Set(supportedStops.map((location) => location.address))

  return rides.find(
    (ride) =>
      knownRouteNames.has(ride.origin_name) &&
      knownRouteNames.has(ride.destination_name) &&
      ride.seats_available >= payload.seats,
  )
}

export async function listAvailableRides(city: string) {
  try {
    const { data, error } = await supabase
      .from("rides")
      .select(`
        *,
        driver:profiles!rides_driver_id_fkey(id, full_name, avatar_url)
      `)
      .eq("status", "scheduled")
      .eq("city", city)
      .gte("departure_time", new Date().toISOString())
      .order("departure_time", { ascending: true })

    if (error) {
      throw error
    }

    return await transformRides((data as RawRideRow[] | null) ?? [])
  } catch (error) {
    logDevError("listAvailableRides", error)
    throw new Error(getErrorMessage(error, "Could not load available rides."))
  }
}

export async function updateAccountProfile(payload: Partial<Profile>) {
  try {
    const user = await getCurrentUser()
    const updates: Record<string, unknown> = {}

    if (payload.full_name !== undefined) updates.full_name = payload.full_name
    if (payload.phone !== undefined) updates.phone = payload.phone
    if (payload.city !== undefined) updates.city = payload.city
    if (payload.avatar_url !== undefined) updates.avatar_url = payload.avatar_url
    if (payload.role !== undefined) updates.role = payload.role

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select("*")
      .single()

    if (error) {
      throw error
    }

    return buildProfile((data as ProfileRow | null) ?? null, user)
  } catch (error) {
    logDevError("updateAccountProfile", error)
    throw new Error(getErrorMessage(error, "Could not save your profile right now."))
  }
}

export async function createRideBooking(payload: {
  city: string;
  destination: { address: string; lat: number; lng: number };
  pickup: { address: string; lat: number; lng: number };
  seats: number;
}) {
  try {
    const user = await getCurrentUser()
    const rides = await listAvailableRides(payload.city)
    const matchedRide = pickMatchedRide(rides, payload)

    if (!matchedRide) {
      throw new Error("No scheduled shared rides are available for this route right now.")
    }

    const { data: bookingId, error: bookingError } = await supabase.rpc("book_ride", {
      p_ride_id: matchedRide.id,
      p_rider_id: user.id,
      p_seats: payload.seats,
    })

    if (bookingError) {
      throw bookingError
    }

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        ride:rides!bookings_ride_id_fkey(
          *,
          driver:profiles!rides_driver_id_fkey(id, full_name, avatar_url)
        )
      `)
      .eq("id", bookingId)
      .single()

    if (error) {
      throw error
    }

    const [booking] = await transformBookings([data as RawBookingRow])
    return { booking }
  } catch (error) {
    logDevError("createRideBooking", error)
    throw new Error(getErrorMessage(error, "Could not complete that booking."))
  }
}

export async function getRiderDashboardData(): Promise<RiderDashboardData> {
  try {
    const user = await getCurrentUser()
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        ride:rides!bookings_ride_id_fkey(
          *,
          driver:profiles!rides_driver_id_fkey(id, full_name, avatar_url)
        )
      `)
      .eq("rider_id", user.id)
      .order("created_at", { ascending: false })

    if (error) {
      throw error
    }

    return {
      recentBookings: await transformBookings((data as RawBookingRow[] | null) ?? []),
    }
  } catch (error) {
    logDevError("getRiderDashboardData", error)
    throw new Error(getErrorMessage(error, "Could not load your bookings right now."))
  }
}

export async function cancelRideBooking(bookingId: string) {
  try {
    const user = await getCurrentUser()
    const { data: cancelledId, error: cancelError } = await supabase.rpc("cancel_booking", {
      p_booking_id: bookingId,
      p_rider_id: user.id,
    })

    if (cancelError) {
      throw cancelError
    }

    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        ride:rides!bookings_ride_id_fkey(
          *,
          driver:profiles!rides_driver_id_fkey(id, full_name, avatar_url)
        )
      `)
      .eq("id", cancelledId)
      .single()

    if (error) {
      throw error
    }

    const [booking] = await transformBookings([data as RawBookingRow])
    return { booking }
  } catch (error) {
    logDevError("cancelRideBooking", error)
    throw new Error(getErrorMessage(error, "Could not cancel that booking right now."))
  }
}

export async function getDriverDashboardData(): Promise<DriverDashboardData> {
  try {
    const user = await getCurrentUser()
    const [{ data: application, error: applicationError }, { data: vehicles, error: vehiclesError }, { data: rides, error: ridesError }] =
      await Promise.all([
        supabase
          .from("driver_applications")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("vehicles")
          .select("*")
          .eq("driver_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("rides")
          .select(`
            *,
            driver:profiles!rides_driver_id_fkey(id, full_name, avatar_url)
          `)
          .eq("driver_id", user.id)
          .order("departure_time", { ascending: true }),
      ])

    if (applicationError) {
      throw applicationError
    }

    if (vehiclesError) {
      throw vehiclesError
    }

    if (ridesError) {
      throw ridesError
    }

    return {
      application: (application as DriverApplication | null) ?? null,
      vehicles: (vehicles as Vehicle[] | null) ?? [],
      rides: await transformRides((rides as RawRideRow[] | null) ?? []),
    }
  } catch (error) {
    logDevError("getDriverDashboardData", error)
    throw new Error(getErrorMessage(error, "Could not load the driver dashboard right now."))
  }
}

export async function submitDriverApplication(payload: DriverApplicationInput) {
  try {
    const user = await getCurrentUser()
    const { data: existingApplication, error: applicationLookupError } = await supabase
      .from("driver_applications")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle()

    if (applicationLookupError) {
      throw applicationLookupError
    }

    if (existingApplication) {
      throw new Error("A driver application is already on file for this account.")
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ role: "driver" })
      .eq("id", user.id)

    if (profileError) {
      throw profileError
    }

    const { error: applicationError } = await supabase.from("driver_applications").insert({
      user_id: user.id,
      license_number: payload.licenseNumber,
      license_expiry: payload.licenseExpiry,
      document_url: payload.documentUrl || null,
    })

    if (applicationError) {
      throw applicationError
    }

    const { error: vehicleError } = await supabase.from("vehicles").insert({
      driver_id: user.id,
      make: payload.make,
      model: payload.model,
      year: payload.year,
      color: payload.color,
      license_plate: payload.plate,
      capacity: payload.capacity,
    })

    if (vehicleError) {
      throw vehicleError
    }
  } catch (error) {
    logDevError("submitDriverApplication", error)
    throw new Error(getErrorMessage(error, "Could not submit the driver application."))
  }
}

export async function createDriverRide(input: RideInput) {
  try {
    const user = await getCurrentUser()
    const { data, error } = await supabase
      .from("rides")
      .insert({
        driver_id: user.id,
        origin_name: input.origin_name,
        origin_lat: input.origin_lat,
        origin_lng: input.origin_lng,
        destination_name: input.destination_name,
        destination_lat: input.destination_lat,
        destination_lng: input.destination_lng,
        city: input.city,
        departure_time: input.departure_time,
        seats_total: input.seats_total,
        seats_available: input.seats_total,
        fare_per_seat: input.fare_per_seat,
      })
      .select(`
        *,
        driver:profiles!rides_driver_id_fkey(id, full_name, avatar_url)
      `)
      .single()

    if (error) {
      throw error
    }

    const [ride] = await transformRides([data as RawRideRow])
    return ride
  } catch (error) {
    logDevError("createDriverRide", error)
    throw new Error(getErrorMessage(error, "Could not publish that ride right now."))
  }
}

export async function submitContactMessage(payload: {
  email: string;
  message: string;
  name: string;
  requestedCity?: string | null;
  requestedRole?: string | null;
  topic: string;
}) {
  try {
    const { error } = await supabase.from("contact_messages").insert({
      name: payload.name,
      email: payload.email,
      topic: payload.topic,
      message: payload.message,
      requested_city: payload.requestedCity ?? null,
      requested_role: payload.requestedRole ?? null,
    })

    if (error) {
      throw error
    }

    return { id: crypto.randomUUID() }
  } catch (error) {
    logDevError("submitContactMessage", error)
    throw new Error(getErrorMessage(error, "Could not submit the contact message right now."))
  }
}

export async function subscribeToJournal(email: string) {
  try {
    const { error } = await supabase.from("newsletter_subscriptions").insert({ email })

    if (error && error.code !== "23505") {
      throw error
    }

    return { email }
  } catch (error) {
    logDevError("subscribeToJournal", error)
    throw new Error(getErrorMessage(error, "Could not save that journal subscription."))
  }
}
