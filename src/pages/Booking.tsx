import * as React from "react";
import { Clock3, MapPin, ShieldCheck, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { LazyMap } from "../components/LazyMap";
import { Button, ButtonLink } from "../components/ui/Button";
import { supportedCities } from "../content/siteContent";
import { getAvailableRides } from "../lib/api";
import { cn } from "../lib/utils";
import { useBookingStore } from "../store/useBookingStore";
import type { Ride } from "../types";

type City = (typeof supportedCities)[number];

export default function Booking() {
  const navigate = useNavigate();
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

  const [selectedCity, setSelectedCity] = React.useState<City>("Mumbai");
  const [rides, setRides] = React.useState<Ride[]>([]);
  const [loadingRides, setLoadingRides] = React.useState(true);
  const [ridesError, setRidesError] = React.useState<string | null>(null);

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
    setSelectedCity(city);
    reset();
  };

  return (
    <div className="section-shell pt-6">
      <div className="section-frame">
        <div className="grid gap-6 xl:grid-cols-[0.42fr_0.58fr]">
          <aside className="panel flex flex-col gap-8 p-6 md:p-8">
            <div className="space-y-5">
              <div className="eyebrow">Book a route</div>
              <h1 className="text-4xl font-semibold tracking-[-0.05em] text-brand-text-primary">
                Browse live shared rides and reserve your seat.
              </h1>
              <p className="text-sm leading-7 text-brand-text-secondary">
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
                      ? "border-brand-accent bg-brand-accent text-brand-surface-strong"
                      : "bg-brand-surface-soft",
                  )}
                >
                  {city}
                </button>
              ))}
            </div>

            <div className="grid gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-text-secondary">
                  Live rides
                </p>
                <div className="mt-3 grid gap-3">
                  {loadingRides ? (
                    <div className="rounded-[1.6rem] border border-brand-border bg-brand-surface-soft p-5 text-sm text-brand-text-secondary">
                      Loading live rides for {selectedCity}.
                    </div>
                  ) : rides.length ? (
                    rides.map((ride) => {
                      const isSelected = selectedRide?.id === ride.id;

                      return (
                        <button
                          key={ride.id}
                          type="button"
                          onClick={() => selectRide(ride)}
                          className={cn(
                            "rounded-[1.6rem] border p-5 text-left transition-colors",
                            isSelected
                              ? "border-brand-accent bg-brand-accent/10"
                              : "border-brand-border bg-brand-surface-soft hover:border-brand-accent/40",
                          )}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-brand-text-primary">
                                {ride.origin_name} to {ride.destination_name}
                              </p>
                              <p className="mt-2 text-sm text-brand-text-secondary">
                                {new Date(ride.departure_time).toLocaleString()}
                              </p>
                              <p className="mt-2 text-sm text-brand-text-secondary">
                                Driver: {ride.driver?.full_name || "HopIn driver"}
                              </p>
                            </div>
                            <div className="text-right text-sm text-brand-text-secondary">
                              <p>INR {ride.fare_per_seat} / seat</p>
                              <p className="mt-2">{ride.seats_available} seats open</p>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <div className="rounded-[1.6rem] border border-brand-border bg-brand-surface-soft p-5 text-sm text-brand-text-secondary">
                      No live rides are currently published in {selectedCity}.
                    </div>
                  )}
                </div>
              </div>

              {selectedRide ? (
                <div className="rounded-[1.8rem] border border-brand-accent bg-brand-accent/8 p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-accent">
                    Selected route
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-brand-text-primary">
                    {selectedRide.origin_name} to {selectedRide.destination_name}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-brand-text-secondary">
                    Departure {new Date(selectedRide.departure_time).toLocaleString()} / Driver{" "}
                    {selectedRide.driver?.full_name || "HopIn driver"} / Vehicle{" "}
                    {selectedRide.vehicle
                      ? `${selectedRide.vehicle.color} ${selectedRide.vehicle.make} ${selectedRide.vehicle.model}`
                      : "Details shared after booking"}
                  </p>
                </div>
              ) : null}

              <div className="space-y-2">
                <label
                  htmlFor="booking-seats"
                  className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-text-secondary"
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
              <div className="rounded-[1.8rem] border border-brand-border bg-brand-surface-soft p-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-accent">
                      Estimated fare
                    </p>
                    <p className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-brand-text-primary">
                      INR {currentRequest.fareEstimate ?? "--"}
                    </p>
                    <p className="mt-2 text-sm text-brand-text-secondary">
                      Total fare for the selected seat count on the chosen ride.
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-surface-soft text-brand-accent">
                    <Users size={20} />
                  </div>
                </div>
              </div>

              {ridesError ? (
                <div className="rounded-[1.5rem] border border-brand-warning/25 bg-brand-warning/10 px-5 py-4 text-sm text-brand-warning">
                  {ridesError}
                </div>
              ) : null}

              {bookingError ? (
                <div className="rounded-[1.5rem] border border-brand-warning/25 bg-brand-warning/10 px-5 py-4 text-sm text-brand-warning">
                  {bookingError}
                </div>
              ) : null}

              {stage === "active" ? (
                <div className="rounded-[1.8rem] border border-brand-accent bg-brand-accent/8 p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-accent">
                    Ride booked
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-brand-text-primary">
                    Your HopIn booking is confirmed
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-brand-text-secondary">
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
                    <Button variant="outline" size="lg" className="flex-1" onClick={() => reset()}>
                      Reset form
                    </Button>
                  </>
                )}
              </div>
            </div>

            <div className="grid gap-3 rounded-[1.8rem] border border-brand-border bg-brand-surface-soft p-5">
              <div className="flex items-center gap-3 text-sm text-brand-text-primary">
                <Clock3 size={16} className="text-brand-accent" />
                Book against currently published departures, not a placeholder request queue.
              </div>
              <div className="flex items-center gap-3 text-sm text-brand-text-primary">
                <ShieldCheck size={16} className="text-brand-accent" />
                Driver identity and vehicle context travel with each live route.
              </div>
              <div className="flex items-center gap-3 text-sm text-brand-text-primary">
                <MapPin size={16} className="text-brand-accent" />
                Switch cities to compare real corridor inventory before booking.
              </div>
            </div>
          </aside>

          <section className="panel relative min-h-[620px] overflow-hidden p-3">
            <div className="grid gap-3 px-3 pb-3 md:hidden">
              <div className="rounded-[1.6rem] border border-white/15 bg-black/40 p-5 shadow-[var(--shadow-panel)] backdrop-blur-md">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-accent">
                  Route preview
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-brand-text-primary">
                  {selectedCity} live ride map
                </h2>
                <p className="mt-3 text-sm leading-7 text-brand-text-secondary">
                  Review the corridor context while comparing live rides in the selected city.
                </p>
              </div>
              {routeSummaryCards.map((card) => (
                <div
                  key={card}
                  className="rounded-[1.4rem] border border-white/15 bg-black/40 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-text-primary shadow-[var(--shadow-panel)] backdrop-blur-md"
                >
                  {card}
                </div>
              ))}
            </div>

            <div className="absolute left-8 top-8 z-20 hidden max-w-sm rounded-[1.6rem] border border-white/15 bg-black/40 p-5 shadow-[var(--shadow-panel)] backdrop-blur-md md:block">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-accent">
                Route preview
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-brand-text-primary">
                {selectedCity} live ride map
              </h2>
              <p className="mt-3 text-sm leading-7 text-brand-text-secondary">
                Use the map to compare the city context while your live ride list stays stable on
                the left.
              </p>
            </div>

            <div className="absolute right-8 top-8 z-20 hidden gap-3 md:grid">
              {routeSummaryCards.map((card) => (
                <div
                  key={card}
                  className="rounded-[1.4rem] border border-white/15 bg-black/40 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-text-primary shadow-[var(--shadow-panel)] backdrop-blur-md"
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
