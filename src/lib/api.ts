import { supabase } from './supabase'
import { getErrorMessage, logDevError } from './errors'
import type {
  Booking, DriverApplicationInput, DriverDashboardData,
  Ride, RideInput, RiderDashboardData,
} from '../types'

// ── Rides ──────────────────────────────────────────────────────────

export async function getAvailableRides(city: string): Promise<Ride[]> {
  const { data, error } = await supabase
    .from('rides')
    .select(`*, driver:profiles!rides_driver_id_fkey(id,full_name,avatar_url), vehicle:vehicles!vehicles_driver_id_fkey(make,model,color,license_plate)`)
    .eq('status', 'scheduled')
    .eq('city', city)
    .gte('departure_time', new Date().toISOString())
    .order('departure_time', { ascending: true })
  if (error) { logDevError('getAvailableRides', error); throw new Error(getErrorMessage(error, 'Could not load rides.')) }
  return (data ?? []) as Ride[]
}

export async function createDriverRide(input: RideInput): Promise<Ride> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')
  const { data, error } = await supabase
    .from('rides')
    .insert({ driver_id: user.id, ...input })
    .select(`*, driver:profiles!rides_driver_id_fkey(id,full_name,avatar_url), vehicle:vehicles!vehicles_driver_id_fkey(make,model,color,license_plate)`)
    .single()
  if (error) { logDevError('createDriverRide', error); throw new Error(getErrorMessage(error, 'Could not publish ride.')) }
  return data as Ride
}

// ── Bookings ───────────────────────────────────────────────────────

export async function bookRide(
  rideId: string,
  seats: number,
  pickupAddress: string, pickupLat: number, pickupLng: number,
  destAddress: string, destLat: number, destLng: number
): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')
  const { data, error } = await supabase.rpc('book_ride', {
    p_ride_id: rideId, p_rider_id: user.id, p_seats: seats,
    p_pickup_address: pickupAddress, p_pickup_lat: pickupLat, p_pickup_lng: pickupLng,
    p_dest_address: destAddress, p_dest_lat: destLat, p_dest_lng: destLng,
  })
  if (error) { logDevError('bookRide', error); throw new Error(getErrorMessage(error, 'Could not book ride.')) }
  return data as string
}

export async function cancelBooking(bookingId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')
  const { error } = await supabase.rpc('cancel_booking', {
    p_booking_id: bookingId, p_rider_id: user.id,
  })
  if (error) { logDevError('cancelBooking', error); throw new Error(getErrorMessage(error, 'Could not cancel booking.')) }
}

// ── Rider dashboard ────────────────────────────────────────────────

export async function getRiderDashboardData(): Promise<RiderDashboardData> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { recentBookings: [] }
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('rider_id', user.id)
    .order('created_at', { ascending: false })
    .limit(20)
  if (error) { logDevError('getRiderDashboardData', error); throw new Error(getErrorMessage(error, 'Could not load bookings.')) }
  return { recentBookings: (data ?? []) as Booking[] }
}

// ── Driver dashboard ───────────────────────────────────────────────

export async function getDriverDashboardData(): Promise<DriverDashboardData> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { application: null, vehicles: [], rides: [] }

  const [appResult, vehiclesResult, ridesResult] = await Promise.all([
    supabase.from('driver_applications').select('*').eq('user_id', user.id).maybeSingle(),
    supabase.from('vehicles').select('*').eq('driver_id', user.id),
    supabase.from('rides').select('*').eq('driver_id', user.id).order('departure_time', { ascending: false }).limit(20),
  ])

  if (appResult.error) { logDevError('getDriverDashboardData.app', appResult.error) }
  if (vehiclesResult.error) { logDevError('getDriverDashboardData.vehicles', vehiclesResult.error) }
  if (ridesResult.error) { logDevError('getDriverDashboardData.rides', ridesResult.error) }

  return {
    application: appResult.data ?? null,
    vehicles: vehiclesResult.data ?? [],
    rides: ridesResult.data ?? [],
  }
}

// ── Driver application ─────────────────────────────────────────────

export async function submitDriverApplication(input: DriverApplicationInput): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')

  let documentUrl = ''

  if (input.documentUrl && input.documentUrl.startsWith('data:')) {
    const base64 = input.documentUrl.split(',')[1]
    const mimeMatch = input.documentUrl.match(/data:(.*?);/)
    const mime = mimeMatch?.[1] ?? 'application/pdf'
    const ext = mime.split('/')[1] ?? 'pdf'
    const filePath = `${user.id}/license.${ext}`
    const byteChars = atob(base64)
    const byteArr = new Uint8Array(byteChars.length)
    for (let i = 0; i < byteChars.length; i++) byteArr[i] = byteChars.charCodeAt(i)
    const { error: uploadError } = await supabase.storage
      .from('driver-documents')
      .upload(filePath, byteArr, { contentType: mime, upsert: true })
    if (uploadError) { logDevError('submitDriverApplication.upload', uploadError); throw new Error(getErrorMessage(uploadError, 'Could not upload document.')) }
    const { data: { publicUrl } } = supabase.storage.from('driver-documents').getPublicUrl(filePath)
    documentUrl = publicUrl
  }

  const { error: appError } = await supabase.from('driver_applications').upsert({
    user_id: user.id,
    license_number: input.licenseNumber,
    license_expiry: input.licenseExpiry,
    document_url: documentUrl || null,
    status: 'pending',
  }, { onConflict: 'user_id' })

  if (appError) { logDevError('submitDriverApplication', appError); throw new Error(getErrorMessage(appError, 'Could not submit application.')) }

  const { error: vehicleError } = await supabase.from('vehicles').insert({
    driver_id: user.id,
    make: input.make, model: input.model, year: input.year,
    license_plate: input.plate, color: input.color, capacity: input.capacity,
  })

  if (vehicleError) { logDevError('submitDriverApplication.vehicle', vehicleError); throw new Error(getErrorMessage(vehicleError, 'Could not save vehicle.')) }
}

// ── Profile ────────────────────────────────────────────────────────

export async function updateProfile(updates: {
  full_name?: string; phone?: string; city?: string;
  gender?: string; home_address?: string; work_address?: string;
  avatar_url?: string; onboarding_completed?: boolean;
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')
  const { error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', user.id)
  if (error) { logDevError('updateProfile', error); throw new Error(getErrorMessage(error, 'Could not update profile.')) }
}
