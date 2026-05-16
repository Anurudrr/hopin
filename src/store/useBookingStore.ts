import { create } from "zustand";
import { toast } from "sonner";

import { bookRide, cancelBooking } from "../lib/api";
import type { Booking } from "../types";

export interface Location {
  lng: number;
  lat: number;
  address: string;
  city?: "Mumbai" | "Delhi" | "Bangalore" | "Hyderabad" | "Pune" | "Chennai";
}

export interface RideRequest {
  id: string;
  pickup: Location;
  destination: Location;
  date: string;
  time: string;
  seats: number;
  fareEstimate: number;
}

interface BookingState {
  currentRequest: Partial<RideRequest>;
  isSearching: boolean;
  activeRide: Booking | null;
  bookingError: string | null;
  clearBookingError: () => void;
  setPickup: (loc: Location | null) => void;
  setDestination: (loc: Location | null) => void;
  setSeats: (n: number) => void;
  startSearch: () => Promise<void>;
  cancelSearch: () => Promise<void>;
  reset: () => void;
}

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const radiusKm = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return radiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function calculateFare(pickup: Location, destination: Location, seats: number): number {
  const distance = haversineKm(pickup.lat, pickup.lng, destination.lat, destination.lng);
  const baseFare = Math.max(45, Math.round(distance * 12));
  return Math.round(baseFare / Math.max(1, seats));
}

function getFareEstimate(pickup?: Location, destination?: Location, seats = 1): number | undefined {
  return pickup && destination ? calculateFare(pickup, destination, seats) : undefined;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  currentRequest: {
    seats: 1,
  },
  isSearching: false,
  activeRide: null,
  bookingError: null,
  clearBookingError: () => set({ bookingError: null }),

  setPickup: (loc) => {
    set((state) => {
      const pickup = loc ?? undefined;
      const destination = state.currentRequest.destination;
      const seats = state.currentRequest.seats ?? 1;

      return {
        currentRequest: {
          ...state.currentRequest,
          pickup,
          fareEstimate: getFareEstimate(pickup, destination, seats),
        },
        activeRide: null,
        isSearching: false,
        bookingError: null,
      };
    });
  },

  setDestination: (loc) => {
    set((state) => {
      const destination = loc ?? undefined;
      const pickup = state.currentRequest.pickup;
      const seats = state.currentRequest.seats ?? 1;

      return {
        currentRequest: {
          ...state.currentRequest,
          destination,
          fareEstimate: getFareEstimate(pickup, destination, seats),
        },
        activeRide: null,
        isSearching: false,
        bookingError: null,
      };
    });
  },

  setSeats: (n) => {
    const seatCount = Math.max(1, Math.min(3, n));

    set((state) => {
      const { pickup, destination } = state.currentRequest;

      return {
        currentRequest: {
          ...state.currentRequest,
          seats: seatCount,
          fareEstimate: getFareEstimate(pickup, destination, seatCount),
        },
        activeRide: null,
        isSearching: false,
        bookingError: null,
      };
    });
  },

  startSearch: async () => {
    const { pickup, destination, seats } = get().currentRequest;

    if (!pickup || !destination) {
      const msg = "Select both pickup and destination before starting a search.";
      set({
        bookingError: msg,
        isSearching: false,
        activeRide: null,
      });
      toast.error(msg);
      return;
    }

    if (pickup.address === destination.address) {
      const msg = "Pickup and destination need to be different locations.";
      set({
        bookingError: msg,
        isSearching: false,
        activeRide: null,
      });
      toast.error(msg);
      return;
    }

    set({ isSearching: true, bookingError: null });

    try {
      const bookingId = await bookRide(
        "", // rideId will be determined by matching in the backend
        seats ?? 1,
        pickup.address, pickup.lat, pickup.lng,
        destination.address, destination.lat, destination.lng
      );

      set({
        activeRide: {
          id: bookingId,
          ride_id: "",
          rider_id: "",
          driver_id: null,
          city: pickup.city || "",
          pickup_address: pickup.address,
          pickup_lat: pickup.lat,
          pickup_lng: pickup.lng,
          dest_address: destination.address,
          dest_lat: destination.lat,
          dest_lng: destination.lng,
          fare_total: get().currentRequest.fareEstimate || 0,
          fare_shared: get().currentRequest.fareEstimate || 0,
          seats: seats || 1,
          status: "confirmed",
          created_at: new Date().toISOString(),
          departure_time: null,
          driver_name: null,
          vehicle_label: null,
        } as Booking,
        bookingError: null,
        isSearching: false,
      });
      toast.success("Ride booked!");
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Could not find a ride. Please try again.";
      set({
        isSearching: false,
        activeRide: null,
        bookingError: msg,
      });
      toast.error(msg);
    }
  },

  cancelSearch: async () => {
    const { activeRide } = get();

    if (activeRide) {
      try {
        await cancelBooking(activeRide.id);
        toast.success("Ride cancelled.");
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Could not cancel ride.";
        toast.error(msg);
      }
    }

    set({
      isSearching: false,
      activeRide: null,
      bookingError: null,
    });
  },

  reset: () =>
    set({
      currentRequest: { seats: 1 },
      isSearching: false,
      activeRide: null,
      bookingError: null,
    }),
}));
