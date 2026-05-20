import { describe, expect, it } from "vitest";

import { buildRideSharePath, buildRideShareUrl, getRequestedRideId } from "./rideShare";

describe("rideShare", () => {
  it("builds a booking path with city and ride id", () => {
    expect(
      buildRideSharePath({
        city: "Bangalore",
        id: "ride-123",
      }),
    ).toBe("/book?city=Bangalore&ride=ride-123");
  });

  it("builds an absolute share url", () => {
    expect(
      buildRideShareUrl("https://hopin.example", {
        city: "Bangalore",
        id: "ride-123",
      }),
    ).toBe("https://hopin.example/book?city=Bangalore&ride=ride-123");
  });

  it("normalizes requested ride ids from search params", () => {
    expect(getRequestedRideId("  ride-123  ")).toBe("ride-123");
    expect(getRequestedRideId("   ")).toBeNull();
    expect(getRequestedRideId(null)).toBeNull();
  });
});
