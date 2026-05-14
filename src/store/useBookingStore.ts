import { create } from "zustand";

import { cancelRideBooking, createRideBooking } from "../lib/api";
import type { BookingStatus } from "../types";

export interface Location {
  lng: number;
  lat: number;
  address: string;
  city?: "Mumbai" | "Delhi" | "Bangalore" | "Hyderabad" | "Pune";
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
  activeRideId: string | null;
  activeRideStatus: BookingStatus | null;
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
  activeRideId: null,
  activeRideStatus: null,
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
        activeRideId: null,
        activeRideStatus: null,
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
        activeRideId: null,
        activeRideStatus: null,
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
        activeRideId: null,
        activeRideStatus: null,
        isSearching: false,
        bookingError: null,
      };
    });
  },

  startSearch: async () => {
    const { pickup, destination, seats } = get().currentRequest;

    if (!pickup || !destination) {
      set({
        bookingError: "Select both pickup and destination before starting a search.",
        isSearching: false,
        activeRideId: null,
        activeRideStatus: null,
      });
      return;
    }

    if (pickup.address === destination.address) {
      set({
        bookingError: "Pickup and destination need to be different locations.",
        isSearching: false,
        activeRideId: null,
        activeRideStatus: null,
      });
      return;
    }

    if (!pickup.city) {
      set({
        bookingError: "Pickup city is missing from the selected route.",
        isSearching: false,
        activeRideId: null,
        activeRideStatus: null,
      });
      return;
    }

    set({ isSearching: true, bookingError: null });

    try {
      const { booking } = await createRideBooking({
        city: pickup.city,
        pickup,
        destination,
        seats: seats ?? 1,
      });

      set({
        activeRideId: booking.id,
        activeRideStatus: booking.status,
        bookingError: null,
        isSearching: false,
        currentRequest: {
          ...get().currentRequest,
          fareEstimate: booking.fare_total,
        },
      });
    } catch (error) {
      console.error("Booking failed:", error);
      set({
        isSearching: false,
        activeRideId: null,
        activeRideStatus: null,
        bookingError: error instanceof Error ? error.message : "Could not find a ride. Please try again.",
      });
    }
  },

  cancelSearch: async () => {
    const { activeRideId } = get();

    if (activeRideId) {
      try {
        await cancelRideBooking(activeRideId);
      } catch (error) {
        console.error("Ride cancellation failed:", error);
      }
    }

    set({
      isSearching: false,
      activeRideId: null,
      activeRideStatus: null,
      bookingError: null,
    });
  },

  reset: () =>
    set({
      currentRequest: { seats: 1 },
      isSearching: false,
      activeRideId: null,
      activeRideStatus: null,
      bookingError: null,
    }),
}));
