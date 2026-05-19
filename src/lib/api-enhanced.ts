/**
 * Enhanced API Layer with Error Handling & Retry Logic
 * 
 * This module provides all API calls to Supabase with:
 * - Consistent error handling
 * - Retry logic for transient failures
 * - Type safety with TypeScript
 * - Dev logging for debugging
 */

import { supabase } from './supabase'
import { getErrorMessage, logDevError, mapApiErrorMessage, withRetry } from './errors'
import type {
  Booking,
  ContactMessageInput,
  DriverApplicationInput,
  DriverDashboardData,
  Ride,
  RideInput,
  RiderDashboardData,
} from '../types'

const rideSelect = `
  *,
  driver:profiles!rides_driver_id_fkey(id,full_name,avatar_url),
  vehicle:vehicles!vehicles_driver_id_fkey(make,model,color,license_plate)
`

/**
 * Get available rides for a specific city
 */
export async function getAvailableRides(city: string): Promise<Ride[]> {
  if (!city.trim()) return []

  try {
    const { data, error } = await withRetry(() =>
      supabase
        .from('rides')
        .select(rideSelect)
        .eq('city', city)
        .in('status', ['scheduled', 'active'])
        .gt('seats_available', 0)
        .gte('departure_time', new Date().toISOString())
        .order('departure_time', { ascending: true })
    );

    if (error) {
      logDevError('getAvailableRides', error)
      throw new Error(mapApiErrorMessage(error, 'fetching rides'))
    }

    return (data ?? []) as Ride[]
  } catch (error) {
    logDevError('getAvailableRides', error)
    throw error
  }
}

/**
 * Create a new ride as a driver
 */
export async function createDriverRide(input: RideInput): Promise<Ride> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')

  try {
    const { data: application, error: applicationError } = await supabase
      .from('driver_applications')
      .select('status')
      .eq('user_id', user.id)
      .maybeSingle()

    if (applicationError) {
      logDevError('createDriverRide.application', applicationError)
      throw new Error(mapApiErrorMessage(applicationError, 'verifying driver application'))
    }

    if (application?.status !== 'approved') {
      throw new Error('Your driver application must be approved before you can publish rides.')
    }

    const { data, error } = await supabase
      .from('rides')
      .insert({ driver_id: user.id, seats_available: input.seats_total, ...input })
      .select(rideSelect)
      .single()

    if (error) {
      logDevError('createDriverRide', error)
      throw new Error(mapApiErrorMessage(error, 'publishing ride'))
    }

    return data as Ride
  } catch (error) {
    logDevError('createDriverRide', error)
    throw error
  }
}

/**
 * Submit a contact message
 */
export async function submitContactMessage(input: ContactMessageInput): Promise<void> {
  const payload = {
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    topic: input.topic.trim(),
    message: input.message.trim(),
    requested_role: input.requestedRole?.trim() || null,
    requested_city: input.requestedCity?.trim() || null,
  }

  try {
    const { error } = await supabase.from('contact_messages').insert(payload)

    if (error) {
      logDevError('submitContactMessage', error)
      throw new Error(mapApiErrorMessage(error, 'submitting contact message'))
    }
  } catch (error) {
    logDevError('submitContactMessage', error)
    throw error
  }
}

/**
 * Subscribe to newsletter
 */
export async function subscribeToJournal(email: string): Promise<{ email: string }> {
  const normalizedEmail = email.trim().toLowerCase()

  try {
    const { data, error } = await supabase
      .from('newsletter_subscriptions')
      .insert({ email: normalizedEmail })
      .select('email')
      .single()

    if (error) {
      if ('code' in error && error.code === '23505') {
        return { email: normalizedEmail }
      }

      logDevError('subscribeToJournal', error)
      throw new Error(mapApiErrorMessage(error, 'subscribing to newsletter'))
    }

    return data as { email: string }
  } catch (error) {
    logDevError('subscribeToJournal', error)
    throw error
  }
}

/**
 * Book a ride
 */
export async function bookRide(
  rideId: string,
  seats: number,
  pickupAddress: string,
  pickupLat: number,
  pickupLng: number,
  destAddress: string,
  destLat: number,
  destLng: number,
): Promise<Booking> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')

  try {
    const { data: bookingId, error } = await withRetry(() =>
      supabase.rpc('book_ride', {
        p_ride_id: rideId,
        p_rider_id: user.id,
        p_seats: seats,
        p_pickup_address: pickupAddress,
        p_pickup_lat: pickupLat,
        p_pickup_lng: pickupLng,
        p_dest_address: destAddress,
        p_dest_lat: destLat,
        p_dest_lng: destLng,
      })
    )

    if (error) {
      logDevError('bookRide', error)
      throw new Error(mapApiErrorMessage(error, 'booking ride'))
    }

    const { data, error: bookingError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single()

    if (bookingError) {
      logDevError('bookRide.fetchBooking', bookingError)
      throw new Error(mapApiErrorMessage(bookingError, 'loading booking details'))
    }

    return data as Booking
  } catch (error) {
    logDevError('bookRide', error)
    throw error
  }
}

/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId: string): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')

  try {
    const { error } = await withRetry(() =>
      supabase.rpc('cancel_booking', {
        p_booking_id: bookingId,
        p_rider_id: user.id,
      })
    )

    if (error) {
      logDevError('cancelBooking', error)
      throw new Error(mapApiErrorMessage(error, 'cancelling booking'))
    }
  } catch (error) {
    logDevError('cancelBooking', error)
    throw error
  }
}

/**
 * Get rider dashboard data (recent bookings)
 */
export async function getRiderDashboardData(): Promise<RiderDashboardData> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { recentBookings: [] }

  try {
    const { data, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('rider_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      logDevError('getRiderDashboardData', error)
      // Return empty array on error instead of throwing
      // User sees "No bookings" which is better than error state
      return { recentBookings: [] }
    }

    return { recentBookings: (data ?? []) as Booking[] }
  } catch (error) {
    logDevError('getRiderDashboardData', error)
    return { recentBookings: [] }
  }
}

/**
 * Get driver dashboard data (applications, vehicles, rides)
 */
export async function getDriverDashboardData(): Promise<DriverDashboardData> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { application: null, vehicles: [], rides: [] }

  try {
    const [appResult, vehiclesResult, ridesResult] = await Promise.all([
      supabase.from('driver_applications').select('*').eq('user_id', user.id).maybeSingle(),
      supabase.from('vehicles').select('*').eq('driver_id', user.id),
      supabase.from('rides').select('*').eq('driver_id', user.id).order('departure_time', { ascending: false }).limit(20),
    ])

    if (appResult.error) logDevError('getDriverDashboardData.app', appResult.error)
    if (vehiclesResult.error) logDevError('getDriverDashboardData.vehicles', vehiclesResult.error)
    if (ridesResult.error) logDevError('getDriverDashboardData.rides', ridesResult.error)

    return {
      application: appResult.data ?? null,
      vehicles: vehiclesResult.data ?? [],
      rides: ridesResult.data ?? [],
    }
  } catch (error) {
    logDevError('getDriverDashboardData', error)
    return { application: null, vehicles: [], rides: [] }
  }
}

/**
 * Submit a driver application
 */
export async function submitDriverApplication(input: DriverApplicationInput): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')

  let documentPath = ''

  try {
    const [existingApplicationResult, existingVehicleResult] = await Promise.all([
      supabase.from('driver_applications').select('document_url').eq('user_id', user.id).maybeSingle(),
      supabase
        .from('vehicles')
        .select('id')
        .eq('driver_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    if (existingApplicationResult.error) {
      logDevError('submitDriverApplication.applicationLookup', existingApplicationResult.error)
      throw new Error(mapApiErrorMessage(existingApplicationResult.error, 'verifying application'))
    }

    if (existingVehicleResult.error) {
      logDevError('submitDriverApplication.vehicleLookup', existingVehicleResult.error)
      throw new Error(mapApiErrorMessage(existingVehicleResult.error, 'verifying vehicle'))
    }

    // Handle document upload if provided
    if (input.documentUrl && input.documentUrl.startsWith('data:')) {
      const uploadResponse = await fetch(input.documentUrl)
      const uploadBlob = await uploadResponse.blob()
      const mime = uploadBlob.type || 'application/pdf'
      const ext = mime.split('/')[1] ?? 'pdf'
      const filePath = `${user.id}/license.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('driver-documents')
        .upload(filePath, uploadBlob, { contentType: mime, upsert: true })

      if (uploadError) {
        logDevError('submitDriverApplication.upload', uploadError)
        throw new Error(mapApiErrorMessage(uploadError, 'uploading document'))
      }

      documentPath = filePath
    }
    
    documentPath = documentPath || existingApplicationResult.data?.document_url || ''

    // Update or insert application
    const { error: appError } = await supabase.from('driver_applications').upsert({
      user_id: user.id,
      license_number: input.licenseNumber,
      license_expiry: input.licenseExpiry,
      document_url: documentPath || null,
      status: 'pending',
    }, { onConflict: 'user_id' })

    if (appError) {
      logDevError('submitDriverApplication', appError)
      throw new Error(mapApiErrorMessage(appError, 'submitting application'))
    }

    // Update or insert vehicle
    const vehiclePayload = {
      driver_id: user.id,
      make: input.make,
      model: input.model,
      year: input.year,
      license_plate: input.plate,
      color: input.color,
      capacity: input.capacity,
    }

    const vehicleQuery = existingVehicleResult.data
      ? supabase.from('vehicles').update(vehiclePayload).eq('id', existingVehicleResult.data.id)
      : supabase.from('vehicles').insert(vehiclePayload)

    const { error: vehicleError } = await vehicleQuery

    if (vehicleError) {
      logDevError('submitDriverApplication.vehicle', vehicleError)
      throw new Error(mapApiErrorMessage(vehicleError, 'saving vehicle'))
    }
  } catch (error) {
    logDevError('submitDriverApplication', error)
    throw error
  }
}

/**
 * Update user profile
 */
export async function updateProfile(updates: {
  full_name?: string
  phone?: string
  city?: string
  gender?: string
  home_address?: string
  work_address?: string
  avatar_url?: string
  onboarding_completed?: boolean
}): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Not authenticated.')

  try {
    const { error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)

    if (error) {
      logDevError('updateProfile', error)
      throw new Error(mapApiErrorMessage(error, 'updating profile'))
    }
  } catch (error) {
    logDevError('updateProfile', error)
    throw error
  }
}