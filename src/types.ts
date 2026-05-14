export type UserRole = "rider" | "driver" | "admin";
export type DriverStatus = "pending" | "approved" | "rejected";
export type VehicleType = "sedan" | "suv" | "hatchback" | "luxury";
export type BookingStatus =
  | "searching"
  | "matched"
  | "confirmed"
  | "in_progress"
  | "completed"
  | "cancelled";

export interface SessionUser {
  id: string;
  email: string;
  role: UserRole;
}

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
}

export interface Vehicle {
  id: string;
  driver_id: string;
  make: string;
  model: string;
  year: number;
  license_plate: string;
  color: string | null;
  type: VehicleType;
  rc_ready: boolean;
  status: DriverStatus;
  created_at: string;
  updated_at: string;
}

export interface DriverRecord {
  id: string;
  user_id: string;
  experience: string | null;
  history: string | null;
  license_ready: boolean;
  aadhaar_ready: boolean;
  pan_ready: boolean;
  is_online: boolean;
  is_demo: boolean;
  status: DriverStatus;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
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
  updated_at: string;
}

export interface AuthSession {
  token: string;
  user: SessionUser;
  profile: Profile;
}

export interface AuthSessionSnapshot {
  user: SessionUser;
  profile: Profile;
}

export interface DriverDashboardData {
  driverRecord: DriverRecord | null;
  assignedTrips: Booking[];
  vehicleCount: number;
}

export interface RiderDashboardData {
  recentBookings: Booking[];
}

export interface DriverApplicationInput {
  experience: string;
  history: string;
  documents: {
    license: boolean;
    aadhaar: boolean;
    pan: boolean;
  };
  make: string;
  model: string;
  year: number;
  plate: string;
}
