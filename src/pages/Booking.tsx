import * as React from "react";
import { Clock3, MapPin, ShieldCheck, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { LazyMap } from "../components/LazyMap";
import { Button, ButtonLink } from "../components/ui/Button";
import { bookingLocations, supportedCities } from "../content/siteContent";
import { cn } from "../lib/utils";
import { useBookingStore } from "../store/useBookingStore";

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
    setDestination,
    setPickup,
    setSeats,
    startSearch,
  } = useBookingStore();

  const [selectedCity, setSelectedCity] = React.useState<City>("Mumbai");

  const locations = bookingLocations.filter((location) => location.city === selectedCity);
  const stage = isSearching
    ? "matching"
    : activeRide
      ? activeRide.status === "searching"
        ? "pending"
        : "active"
      : "select";
  const routeSummaryCards = [
    `${locations.length} mapped zones in ${selectedCity}`,
    stage === "matching"
      ? "Matching in progress"
      : stage === "pending"
        ? "Request queued"
        : stage === "active"
          ? "Ride active"
          : "Ready to search",
  ];

  const handleBooking = async () => {
    clearBookingError();
    await startSearch();
    if (activeRide) {
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
                Choose a corridor, review the fare, and start matching.
              </h1>
              <p className="text-sm leading-7 text-brand-text-secondary">
                The booking surface now uses simpler native selectors for pickup and destination, which removes the brittle custom dropdown behavior from the old UI.
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

            <div className="grid gap-5">
              <label htmlFor="booking-pickup" className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-text-secondary">
                  Pickup
                </span>
                <select
                  id="booking-pickup"
                  value={currentRequest.pickup?.address || ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    const selected = locations.find((location) => location.address === value) || null;
                    setPickup(selected);
                  }}
                  className="field-shell"
                >
                  <option value="">Select pickup point</option>
                  {locations.map((location) => (
                    <option key={location.address} value={location.address}>
                      {location.address}
                    </option>
                  ))}
                </select>
              </label>

              <label htmlFor="booking-destination" className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-text-secondary">
                  Destination
                </span>
                <select
                  id="booking-destination"
                  value={currentRequest.destination?.address || ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    const selected = locations.find((location) => location.address === value) || null;
                    setDestination(selected);
                  }}
                  className="field-shell"
                >
                  <option value="">Select destination</option>
                  {locations.map((location) => (
                    <option key={location.address} value={location.address}>
                      {location.address}
                    </option>
                  ))}
                </select>
              </label>

              <div className="space-y-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-text-secondary">
                  Seats requested
                </span>
                <div className="flex gap-3">
                  {[1, 2, 3].map((seat) => (
                    <button
                      key={seat}
                      type="button"
                      onClick={() => setSeats(seat)}
                      aria-pressed={currentRequest.seats === seat}
                      className={cn(
                        "flex-1 rounded-2xl border px-4 py-4 text-sm font-semibold",
                        currentRequest.seats === seat
                          ? "border-brand-accent bg-brand-accent text-brand-surface-strong"
                          : "border-brand-border bg-brand-surface-soft text-brand-text-primary",
                      )}
                    >
                      {seat} seat{seat > 1 ? "s" : ""}
                    </button>
                  ))}
                </div>
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
                      Shared pricing per rider for the selected route.
                    </p>
                  </div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-surface-soft text-brand-accent">
                    <Users size={20} />
                  </div>
                </div>
              </div>

              {bookingError ? (
                <div className="rounded-[1.5rem] border border-brand-warning/25 bg-brand-warning/10 px-5 py-4 text-sm text-brand-warning">
                  {bookingError}
                </div>
              ) : null}

              {stage === "active" || stage === "pending" ? (
                <div className="rounded-[1.8rem] border border-brand-accent bg-brand-accent/8 p-5">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-accent">
                    {stage === "active" ? "Match confirmed" : "Search live"}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-brand-text-primary">
                    {stage === "active" ? "HopIn Share active" : "Looking for a live driver"}
                  </h3>
                  <p className="mt-3 text-sm leading-7 text-brand-text-secondary">
                    {stage === "active"
                      ? `Your route is live with a matched vehicle and co-riders. Ride ID: ${activeRide?.id}`
                      : `Your request is stored and waiting for a live driver assignment. Ride ID: ${activeRide?.id}`}
                  </p>
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                {stage === "active" || stage === "pending" ? (
                  <>
                    <Button
                      size="lg"
                      className="flex-1"
                      onClick={() => void cancelSearch()}
                    >
                      {stage === "active" ? "Cancel ride" : "Cancel request"}
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
                      disabled={!currentRequest.pickup || !currentRequest.destination || isSearching}
                    >
                      {isSearching ? "Searching routes" : "Start matching"}
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
                Typical weekday match in 10 to 15 minutes.
              </div>
              <div className="flex items-center gap-3 text-sm text-brand-text-primary">
                <ShieldCheck size={16} className="text-brand-accent" />
                Verified riders and clearer route context.
              </div>
              <div className="flex items-center gap-3 text-sm text-brand-text-primary">
                <MapPin size={16} className="text-brand-accent" />
                Live zones tuned for dense repeat corridors.
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
                  {selectedCity} booking surface
                </h2>
                <p className="mt-3 text-sm leading-7 text-brand-text-secondary">
                  Review the route context without losing the form on smaller screens.
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
                {selectedCity} booking surface
              </h2>
              <p className="mt-3 text-sm leading-7 text-brand-text-secondary">
                Use the map to review pickup and destination context while the route form stays stable on the left.
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
