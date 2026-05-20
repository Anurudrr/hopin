import * as React from "react";
import { Clock3, MapPin, Share2, ShieldCheck, Users } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

import { LazyMap } from "../components/LazyMap";
import { Button, ButtonLink } from "../components/ui/Button";
import { supportedCities } from "../content/siteContent";
import { getAvailableRides } from "../lib/api";
import { buildRideShareUrl, getRequestedRideId } from "../lib/rideShare";
import { cn } from "../lib/utils";
import { useBookingStore } from "../store/useBookingStore";
import type { Ride } from "../types";

type City = (typeof supportedCities)[number];
const defaultCity: City = supportedCities[0];

function isSupportedCity(value: string | null): value is City {
  return value !== null && supportedCities.includes(value as City);
}

function getRequestedCity(value: string | null): City {
  return isSupportedCity(value) ? value : defaultCity;
}

export default function Booking() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const {
    activeRide,
    bookingError,
    cancelSearch,
    clearBookingError,
    currentRequest,
    isSearching,
    reset,
    selectRide,
    selectedRide,
    setSeats,
    startSearch,
  } = useBookingStore();

  const [selectedCity, setSelectedCity] = React.useState<City>(() =>
    getRequestedCity(searchParams.get("city")),
  );
  const [rides, setRides] = React.useState<Ride[]>([]);
  const [loadingRides, setLoadingRides] = React.useState(true);
  const [ridesError, setRidesError] = React.useState<string | null>(null);
  const [sharedRideNotice, setSharedRideNotice] = React.useState<string | null>(null);
  const requestedRideId = getRequestedRideId(searchParams.get("ride"));

  React.useEffect(() => {
    const requestedCity = getRequestedCity(searchParams.get("city"));

    if (requestedCity !== selectedCity) {
      setSelectedCity(requestedCity);
      reset();
    }
  }, [reset, searchParams, selectedCity]);

  React.useEffect(() => {
    if (loadingRides) {
      return;
    }

    if (!requestedRideId) {
      setSharedRideNotice(null);
      return;
    }

    const requestedRide = rides.find((ride) => ride.id === requestedRideId);

    if (!requestedRide) {
      setSharedRideNotice("That shared ride is no longer live. Choose another route from the list.");
      return;
    }

    setSharedRideNotice(null);

    if (selectedRide?.id !== requestedRide.id) {
      selectRide(requestedRide);
    }
  }, [loadingRides, requestedRideId, rides, selectRide, selectedRide?.id]);

  React.useEffect(() => {
    let isMounted = true;

    const loadRides = async () => {
      setLoadingRides(true);
      setRidesError(null);

      try {
        const data = await getAvailableRides(selectedCity);
        if (!isMounted) return;
        setRides(data);
      } catch (error) {
        if (!isMounted) return;
        setRides([]);
        setRidesError(error instanceof Error ? error.message : "Could not load live rides.");
      } finally {
        if (isMounted) {
          setLoadingRides(false);
        }
      }
    };

    void loadRides();

    return () => {
      isMounted = false;
    };
  }, [selectedCity]);

  const stage = isSearching ? "matching" : activeRide ? "active" : selectedRide ? "ready" : "select";
  const routeSummaryCards = [
    `${rides.length} live rides in ${selectedCity}`,
    stage === "matching"
      ? "Booking in progress"
      : stage === "active"
        ? "Ride booked"
        : selectedRide
          ? `${selectedRide.seats_available} seats currently open`
          : "Choose a route",
  ];

  const handleBooking = async () => {
    clearBookingError();
    const booking = await startSearch();
    if (booking) {
      navigate("/dashboard");
    }
  };

  const handleCityChange = (city: City) => {
    if (city === selectedCity) {
      return;
    }

    const nextParams = new URLSearchParams();
    nextParams.set("city", city);
    setSearchParams(nextParams, { replace: true });
  };

  const handleRideSelect = (ride: Ride) => {
    selectRide(ride);

    const nextParams = new URLSearchParams();
    nextParams.set("city", ride.city);
    nextParams.set("ride", ride.id);
    setSearchParams(nextParams, { replace: true });
  };

  const handleReset = () => {
    reset();

    const nextParams = new URLSearchParams();
    nextParams.set("city", selectedCity);
    setSearchParams(nextParams, { replace: true });
  };

  const handleShareRide = async (ride: Ride) => {
    const shareUrl = buildRideShareUrl(window.location.origin, ride);
    const shareTitle = `${ride.origin_name} to ${ride.destination_name}`;
    const shareText = `Ride leaving ${new Date(ride.departure_time).toLocaleString()} with ${ride.seats_available} seats open.`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `HopIn ride: ${shareTitle}`,
          text: shareText,
          url: shareUrl,
        });
        return;
      }

      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Ride link copied.");
        return;
      }

      throw new Error("Sharing is not supported in this browser.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      toast.error(error instanceof Error ? error.message : "Could not share that ride.");
    }
  };

  return (
    <div className="section-shell pt-6">
      <div className="section-frame">
        <div className="grid gap-6 xl:grid-cols-[0.42fr_0.58fr]">
          <aside className="panel flex flex-col gap-8 p-6 md:p-8">
            <div className="space-y-5">
              <div className="eyebrow">Book a route</div>
              <h1 className="text-4xl font-black uppercase tracking-tighter text-black">
                Browse live shared rides and reserve your seat.
              </h1>
              <p className="text-sm leading-7 text-black/60">
                Choose a city, review the currently published driver routes, and book against a
                real ride instead of a placeholder match request.
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {supportedCities.map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => handleCityChange(city)}
                  aria-pressed={selectedCity === city}
                  className={cn(
                    "route-chip",
                    selectedCity === city
                      ? "bg-black text-white shadow-premium"
                      : "",
                  )}
                >
                  {city}
                </button>
              ))}
            </div>

            <div className="grid gap-4">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-black/60">
                  Live rides
                </p>
                <div className="mt-3 grid gap-3">
                  {loadingRides ? (
                    <div className="rounded-none border-2 border-black bg-gray-100 p-5 text-sm text-black/60">
                      Loading live rides for {selectedCity}.
                    </div>
                  ) : rides.length ? (
                    rides.map((ride) => {
                      const isSelected = selectedRide?.id === ride.id;

                      return (
                        <article
                          key={ride.id}
                          className={cn(
                            "rounded-none border-2 p-5 transition-colors shadow-soft",
                            isSelected
                              ? "border-black bg-white shadow-premium"
                              : "border-black bg-gray-100 hover:border-black",
                          )}
                        >
                          <button
                            type="button"
                            onClick={() => handleRideSelect(ride)}
                            className="w-full text-left"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-sm font-semibold text-black">
                                  {ride.origin_name} to {ride.destination_name}
                                </p>
                                <p className="mt-2 text-sm text-black/60">
                                  {new Date(ride.departure_time).toLocaleString()}
                                </p>
                                <p className="mt-2 text-sm text-black/60">
                                  Driver: {ride.driver?.full_name || "HopIn driver"}
                                </p>
                              </div>
                              <div className="text-right text-sm text-black/60">
                                <p>INR {ride.fare_per_seat} / seat</p>
                                <p className="mt-2">{ride.seats_available} seats open</p>
                              </div>
                            </div>
                          </button>
                          <div className="mt-4 flex justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2"
                              onClick={() => void handleShareRide(ride)}
                            >
                              <Share2 size={16} />
                              Share ride
                            </Button>
                          </div>
                        </article>
                      );
                    })
                  ) : (
                    <div className="rounded-none border-2 border-black bg-gray-100 p-5 text-sm text-black/60">
                      No live rides are currently published in {selectedCity}.
                    </div>
                  )}
                </div>
              </div>

              {selectedRide ? (
                <div className="rounded-none border-2 border-black bg-gray-100 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-black">
                        Selected route
                      </p>
                      <h3 className="mt-3 text-2xl font-black uppercase tracking-tight text-black">
                        {selectedRide.origin_name} to {selectedRide.destination_name}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-black/60">
                        Departure {new Date(selectedRide.departure_time).toLocaleString()} / Driver{" "}
                        {selectedRide.driver?.full_name || "HopIn driver"} / Vehicle{" "}
                        {selectedRide.vehicle
                          ? `${selectedRide.vehicle.color} ${selectedRide.vehicle.make} ${selectedRide.vehicle.model}`
                          : "Details shared after booking"}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-2 self-start"
                      onClick={() => void handleShareRide(selectedRide)}
                    >
                      <Share2 size={16} />
                      Share ride
                    </Button>
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <label
                  htmlFor="booking-seats"
                  className="text-[11px] font-black uppercase tracking-[0.24em] text-black/60"
                >
                  Seats requested
                </label>
                <input
                  id="booking-seats"
                  type="number"
                  min={1}
                  max={selectedRide?.seats_available ?? 8}
                  value={currentRequest.seats ?? 1}
                  onChange={(event) => setSeats(Number(event.target.value))}
                  className="field-shell"
                />
              </div>
            </div>

            <div className="grid gap-4">
              <div className="rounded-none border-2 border-black bg-gray-100 p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.24em] text-black">
                      Estimated fare
                    </p>
                    <p className="mt-2 text-4xl font-black uppercase tracking-tight text-black">
                      INR {currentRequest.fareEstimate ?? "--"}
                    </p>
                    <p className="mt-2 text-sm text-black/60">
                      Total fare for the selected seat count on the chosen ride.
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-none border-2 border-black bg-black text-white">
                    <Users size={20} />
                  </div>
                </div>
              </div>

              {ridesError ? (
                <div className="rounded-none border-2 border-black bg-gray-100 px-5 py-4 text-sm text-black">
                  {ridesError}
                </div>
              ) : null}

              {sharedRideNotice ? (
                <div className="rounded-none border-2 border-black bg-gray-100 px-5 py-4 text-sm text-black">
                  {sharedRideNotice}
                </div>
              ) : null}

              {bookingError ? (
                <div className="rounded-none border-2 border-black bg-gray-100 px-5 py-4 text-sm text-black">
                  {bookingError}
                </div>
              ) : null}

              {stage === "active" ? (
                <div className="rounded-none border-2 border-black bg-black p-5 text-white shadow-premium">
                  <p className="text-[11px] font-black uppercase tracking-[0.24em] text-white">
                    Ride booked
                  </p>
                  <h3 className="mt-3 text-2xl font-black uppercase tracking-tight text-white">
                    Your HopIn booking is confirmed
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-white">
                    Ride ID: {activeRide?.id} / {activeRide?.pickup_address} to {activeRide?.dest_address}
                  </p>
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                {stage === "active" ? (
                  <>
                    <Button size="lg" className="flex-1" onClick={() => void cancelSearch()}>
                      Cancel ride
                    </Button>
                    <ButtonLink to="/dashboard" variant="outline" size="lg" className="flex-1">
                      Open dashboard
                    </ButtonLink>
                  </>
                ) : (
                  <>
                    <Button
                      size="lg"
                      className="flex-1"
                      onClick={() => void handleBooking()}
                      disabled={!selectedRide || isSearching || loadingRides}
                    >
                      {isSearching ? "Booking ride" : "Book selected ride"}
                    </Button>
                    <Button variant="outline" size="lg" className="flex-1" onClick={handleReset}>
                      Reset form
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="grid gap-3 rounded-none border-2 border-black bg-gray-100 p-5">
              <div className="flex items-center gap-3 text-sm text-black">
                <Clock3 size={16} className="text-black" />
                Book against currently published departures, not a placeholder request queue.
              </div>
              <div className="flex items-center gap-3 text-sm text-black">
                <ShieldCheck size={16} className="text-black" />
                Driver identity and vehicle context travel with each live route.
              </div>
              <div className="flex items-center gap-3 text-sm text-black">
                <MapPin size={16} className="text-black" />
                Switch cities to compare real corridor inventory before booking.
              </div>
            </div>
          </aside>

          <section className="panel relative min-h-[620px] overflow-hidden p-3">
            <div className="grid gap-3 px-3 pb-3 md:hidden">
              <div className="rounded-none border-2 border-black bg-white p-5 shadow-soft">
                <p className="text-[11px] font-black uppercase tracking-[0.24em] text-black/60">
                  Route preview
                </p>
                <h2 className="mt-3 text-2xl font-black uppercase tracking-tight text-black">
                  {selectedCity} live ride map
                </h2>
                <p className="mt-3 text-sm leading-7 text-black/60">
                  Review the corridor context while comparing live rides in the selected city.
                </p>
              </div>
              {routeSummaryCards.map((card) => (
                <div
                  key={card}
                  className="rounded-none border-2 border-black bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.24em] text-black shadow-soft"
                >
                  {card}
                </div>
              ))}
            </div>

            <div className="absolute left-8 top-8 z-20 hidden max-w-sm rounded-none border-2 border-black bg-white p-5 shadow-soft md:block">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-black/60">
                Route preview
              </p>
              <h2 className="mt-3 text-2xl font-black uppercase tracking-tight text-black">
                {selectedCity} live ride map
              </h2>
              <p className="mt-3 text-sm leading-7 text-black/60">
                Use the map to compare the city context while your live ride list stays stable on
                the left.
              </p>
            </div>

            <div className="absolute right-8 top-8 z-20 hidden gap-3 md:grid">
              {routeSummaryCards.map((card) => (
                <div
                  key={card}
                  className="rounded-none border-2 border-black bg-white px-4 py-3 text-[11px] font-black uppercase tracking-[0.24em] text-black shadow-soft"
                >
                  {card}
                </div>
              ))}
            </div>

            <div className="min-h-[460px] md:h-full">
              <LazyMap city={selectedCity} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

