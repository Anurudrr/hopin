import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  createQueryBuilder,
  mockAuthUser,
  mockBooking,
  mockRide,
  mockSupabaseClient,
  resetMockSupabase,
} from "../mocks/supabase";

vi.mock("./supabase", () => ({
  supabase: mockSupabaseClient,
}));

import {
  bookRide,
  cancelBooking,
  getAvailableRides,
  submitContactMessage,
} from "./api";

describe("api", () => {
  beforeEach(() => {
    resetMockSupabase();
  });

  it("returns an empty list when no city is provided", async () => {
    await expect(getAvailableRides("")).resolves.toEqual([]);
    expect(mockSupabaseClient.from).not.toHaveBeenCalled();
  });

  it("loads available rides for a city", async () => {
    mockSupabaseClient.from.mockReturnValueOnce(
      createQueryBuilder({
        data: [mockRide],
        error: null,
      }),
    );

    await expect(getAvailableRides("Bangalore")).resolves.toEqual([mockRide]);
  });

  it("creates a booking from the booking RPC and follow-up query", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
      data: { user: mockAuthUser },
    });
    mockSupabaseClient.rpc.mockResolvedValueOnce({
      data: mockBooking.id,
      error: null,
    });
    mockSupabaseClient.from.mockReturnValueOnce(
      createQueryBuilder({
        data: mockBooking,
        error: null,
      }),
    );

    await expect(
      bookRide(
        mockRide.id,
        2,
        mockRide.origin_name,
        mockRide.origin_lat,
        mockRide.origin_lng,
        mockRide.destination_name,
        mockRide.destination_lat,
        mockRide.destination_lng,
      ),
    ).resolves.toEqual(mockBooking);
  });

  it("rejects booking cancellation when the user is not authenticated", async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
    });

    await expect(cancelBooking(mockBooking.id)).rejects.toThrow("Not authenticated.");
  });

  it("submits a trimmed contact message payload", async () => {
    const builder = createQueryBuilder({
      data: null,
      error: null,
    });
    mockSupabaseClient.from.mockReturnValueOnce(builder);

    await expect(
      submitContactMessage({
        name: "  Aarav  ",
        email: "  rider@example.com  ",
        topic: "  Support  ",
        message: "  Need help with a booking  ",
        requestedRole: "driver",
        requestedCity: "Bangalore",
      }),
    ).resolves.toBeUndefined();

    expect(builder.insert).toHaveBeenCalledWith({
      name: "Aarav",
      email: "rider@example.com",
      topic: "Support",
      message: "Need help with a booking",
      requested_role: "driver",
      requested_city: "Bangalore",
    });
  });
});
