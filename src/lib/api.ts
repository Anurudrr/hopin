import type {
  AuthSession,
  AuthSessionSnapshot,
  Booking,
  DriverApplicationInput,
  DriverDashboardData,
  DriverRecord,
  Profile,
  RiderDashboardData,
  Vehicle,
} from "../types";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "/api").replace(/\/$/, "");
const AUTH_TOKEN_KEY = "hopin.authToken";

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

type RequestOptions = Omit<RequestInit, "body" | "headers"> & {
  auth?: boolean;
  body?: unknown;
  headers?: HeadersInit;
};

function buildUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function getStoredAuthToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(AUTH_TOKEN_KEY);
}

export function storeAuthToken(token: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearStoredAuthToken() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_TOKEN_KEY);
}

async function request<T>(path: string, options: RequestOptions = {}) {
  const { auth = false, body, headers, ...init } = options;
  const authToken = auth ? getStoredAuthToken() : null;
  const requestHeaders = new Headers(headers);

  if (body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (authToken) {
    requestHeaders.set("Authorization", `Bearer ${authToken}`);
  }

  const response = await fetch(buildUrl(path), {
    ...init,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;

  if (!response.ok) {
    throw new ApiError(response.status, payload?.error || "Request failed.");
  }

  return payload as T;
}

export function registerAccount(payload: {
  email: string;
  fullName: string;
  password: string;
  phone: string;
  role: "rider" | "driver";
}) {
  return request<AuthSession>("/auth/register", {
    method: "POST",
    body: payload,
  });
}

export function loginAccount(payload: { email: string; password: string }) {
  return request<AuthSession>("/auth/login", {
    method: "POST",
    body: payload,
  });
}

export function logoutAccount() {
  return request<{ ok: boolean }>("/auth/logout", {
    method: "POST",
    auth: true,
  });
}

export function getCurrentSession() {
  return request<AuthSessionSnapshot>("/auth/me", {
    auth: true,
  });
}

export function updateAccountProfile(payload: Partial<Profile>) {
  return request<AuthSessionSnapshot>("/profile", {
    method: "PATCH",
    auth: true,
    body: payload,
  });
}

export function createRideBooking(payload: {
  city: string;
  destination: { address: string; lat: number; lng: number };
  pickup: { address: string; lat: number; lng: number };
  seats: number;
}) {
  return request<{ booking: Booking }>("/bookings", {
    method: "POST",
    auth: true,
    body: payload,
  });
}

export function getRiderDashboardData() {
  return request<RiderDashboardData>("/bookings/me", {
    auth: true,
  });
}

export function cancelRideBooking(bookingId: string) {
  return request<{ booking: Booking }>(`/bookings/${bookingId}/cancel`, {
    method: "PATCH",
    auth: true,
  });
}

export function getDriverDashboardData() {
  return request<DriverDashboardData>("/dashboard/driver", {
    auth: true,
  });
}

export function submitDriverApplication(payload: DriverApplicationInput) {
  return request<{ driverRecord: DriverRecord; vehicle: Vehicle }>("/driver/application", {
    method: "POST",
    auth: true,
    body: payload,
  });
}

export function updateDriverAvailability(isOnline: boolean) {
  return request<{ driverRecord: DriverRecord }>("/driver/availability", {
    method: "PATCH",
    auth: true,
    body: { isOnline },
  });
}

export function submitContactMessage(payload: {
  email: string;
  message: string;
  name: string;
  requestedCity?: string | null;
  requestedRole?: string | null;
  topic: string;
}) {
  return request<{ id: string }>("/contact", {
    method: "POST",
    body: payload,
  });
}

export function subscribeToJournal(email: string) {
  return request<{ email: string }>("/newsletter", {
    method: "POST",
    body: { email },
  });
}
