import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createQueryBuilder,
  mockAuthUser,
  mockProfileRow,
  mockRide,
  mockSupabaseClient,
  resetMockSupabase,
} from "../mocks/supabase";

vi.mock("../lib/supabase", () => ({
  supabase: mockSupabaseClient,
}));

import { useAuthStore } from "./useAuthStore";
import { useBookingStore } from "./useBookingStore";

describe("useAuthStore", () => {
  beforeEach(() => {
    resetMockSupabase();
    useAuthStore.setState({
      user: null,
      session: null,
      profile: null,
      loading: true,
    });
  });

  it("starts in a loading state", () => {
    const state = useAuthStore.getState();

    expect(state.user).toBeNull();
    expect(state.profile).toBeNull();
    expect(state.loading).toBe(true);
  });

  it("calls sign up with the expected payload", async () => {
    await useAuthStore.getState().signUp("rider@example.com", "password123", "Aarav Rider");

    expect(mockSupabaseClient.auth.signUp).toHaveBeenCalledWith({
      email: "rider@example.com",
      password: "password123",
      options: {
        data: { full_name: "Aarav Rider" },
      },
    });
  });

  it("loads a profile for the current user", async () => {
    useAuthStore.setState({
      user: mockAuthUser as never,
      session: null,
      profile: null,
      loading: false,
    });
    mockSupabaseClient.from
      .mockReturnValueOnce(
        createQueryBuilder({
          data: mockProfileRow,
          error: null,
        }),
      )
      .mockReturnValueOnce(
        createQueryBuilder({
          data: { status: "approved" },
          error: null,
        }),
      );

    await useAuthStore.getState().fetchProfile();

    expect(useAuthStore.getState().profile?.id).toBe(mockProfileRow.id);
    expect(useAuthStore.getState().profile?.role).toBe("driver");
  });

  it("clears auth state when signing out", async () => {
    useAuthStore.setState({
      user: mockAuthUser as never,
      session: {} as never,
      profile: {
        id: mockProfileRow.id,
        full_name: mockProfileRow.full_name,
        avatar_url: null,
        phone: mockProfileRow.phone,
        email: mockProfileRow.email,
        role: "rider",
        city: mockProfileRow.city,
        gender: mockProfileRow.gender,
        home_address: mockProfileRow.home_address,
        work_address: mockProfileRow.work_address,
        is_phone_verified: false,
        is_email_verified: true,
        onboarding_completed: true,
        created_at: mockProfileRow.created_at,
        updated_at: mockProfileRow.updated_at,
      },
      loading: false,
    });

    await useAuthStore.getState().signOut();

    expect(useAuthStore.getState().user).toBeNull();
    expect(useAuthStore.getState().session).toBeNull();
    expect(useAuthStore.getState().profile).toBeNull();
  });
});

describe("useBookingStore", () => {
  beforeEach(() => {
    resetMockSupabase();
    useBookingStore.getState().reset();
  });

  it("selects a ride and computes the initial fare estimate", () => {
    useBookingStore.getState().selectRide(mockRide);

    const state = useBookingStore.getState();
    expect(state.selectedRide?.id).toBe(mockRide.id);
    expect(state.currentRequest.fareEstimate).toBe(mockRide.fare_per_seat);
  });

  it("clamps requested seats to the ride inventory", () => {
    useBookingStore.getState().selectRide(mockRide);
    useBookingStore.getState().setSeats(99);

    expect(useBookingStore.getState().currentRequest.seats).toBe(mockRide.seats_available);
  });

  it("clears and resets booking state", () => {
    useBookingStore.setState({ bookingError: "Could not book ride." });
    useBookingStore.getState().clearBookingError();
    expect(useBookingStore.getState().bookingError).toBeNull();

    useBookingStore.getState().selectRide(mockRide);
    useBookingStore.getState().reset();

    const state = useBookingStore.getState();
    expect(state.selectedRide).toBeNull();
    expect(state.activeRide).toBeNull();
    expect(state.currentRequest).toEqual({ seats: 1 });
  });
});
