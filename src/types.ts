export type UserRole = "rider" | "driver" | "admin";
export type DriverApplicationStatus = "pending" | "approved" | "rejected";
export type RideStatus = "scheduled" | "active" | "completed" | "cancelled";
export type BookingStatus =
  | "searching"
  | "matched"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "scheduled"
  | "active";

export interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  email: string | null;
  role: UserRole;
  city: string | null;
  gender: string | null;
  home_address: string | null;
  work_address: string | null;
  is_phone_verified: boolean;
  is_email_verified: boolean;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface Vehicle {
  id: string;
  driver_id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  color: string;
  capacity: number;
  created_at: string;
}

export interface DriverApplication {
  id: string;
  user_id: string;
  status: DriverApplicationStatus;
  license_number: string;
  license_expiry: string;
  document_url: string | null;
  reviewed_at: string | null;
  created_at: string;
}

export interface Ride {
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
  fare_per_seat: number;
  status: RideStatus;
  created_at: string;
  driver: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  vehicle: Pick<Vehicle, "make" | "model" | "color" | "license_plate"> | null;
}

export interface Booking {
  id: string;
  ride_id: string;
  rider_id: string;
  driver_id: string | null;
  city: string;
  pickup_address: string;
  pickup_lat: number;
  pickup_lng: number;
  dest_address: string;
  dest_lat: number;
  dest_lng: number;
  fare_total: number;
  fare_shared: number;
  seats: number;
  status: BookingStatus;
  created_at: string;
  departure_time: string;
  driver_name: string | null;
  vehicle_label: string | null;
}

export interface DriverDashboardData {
  application: DriverApplication | null;
  vehicles: Vehicle[];
  rides: Ride[];
}

export interface RiderDashboardData {
  recentBookings: Booking[];
}

export interface DriverApplicationInput {
  licenseNumber: string;
  licenseExpiry: string;
  documentUrl: string;
  make: string;
  model: string;
  year: number;
  plate: string;
  color: string;
  capacity: number;
}

export interface RideInput {
  origin_name: string;
  origin_lat: number;
  origin_lng: number;
  destination_name: string;
  destination_lat: number;
  destination_lng: number;
  city: string;
  departure_time: string;
  seats_total: number;
  fare_per_seat: number;
}
