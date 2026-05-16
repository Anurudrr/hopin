import * as React from "react";
import { ChevronRight, MapPin, Route } from "lucide-react";

import { getRiderDashboardData } from "../../lib/api";
import { supabase } from "../../lib/supabase";
import type { Booking, Profile } from "../../types";
import { ButtonLink } from "../ui/Button";

interface RiderDashboardProps {
  profile: Profile | null;
}

export const RiderDashboard = ({ profile }: RiderDashboardProps) => {
  const [recentBookings, setRecentBookings] = React.useState<Booking[]>([]);
  const [loadingBookings, setLoadingBookings] = React.useState(true);
  const [bookingError, setBookingError] = React.useState<string | null>(null);

  const savedLocations = React.useMemo(
    () =>
      [
        { label: "Home", address: profile?.home_address || null },
        { label: "Work", address: profile?.work_address || null },
      ].filter((location) => location.address),
    [profile?.home_address, profile?.work_address],
  );

  React.useEffect(() => {
    let isMounted = true;

    const loadBookings = async () => {
      if (!profile?.id) {
        if (isMounted) {
          setRecentBookings([]);
          setLoadingBookings(false);
          setBookingError(null);
        }
        return;
      }

      setLoadingBookings(true);
      setBookingError(null);

      try {
        const data = await getRiderDashboardData();

        if (!isMounted) return;
        setRecentBookings(data.recentBookings ?? []);
      } catch (error) {
        if (!isMounted) return;

        setBookingError(
          error instanceof Error
            ? error.message
            : "Recent ride activity will appear here once booking history is available.",
        );
        setRecentBookings([]);
      } finally {
        if (isMounted) {
          setLoadingBookings(false);
        }
      }
    };

    void loadBookings();

    return () => {
      isMounted = false;
    };
  }, [profile?.id]);

  React.useEffect(() => {
    if (!profile?.id) return

    const channel = supabase
      .channel('rider-bookings-' + profile.id)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `rider_id=eq.${profile.id}`,
      }, () => { 
        const loadBookings = async () => {
          const data = await getRiderDashboardData();
          setRecentBookings(data.recentBookings ?? []);
        };
        void loadBookings();
      })
      .subscribe()

    return () => { void supabase.removeChannel(channel) }
  }, [profile?.id])

  const activeBooking =
    recentBookings.find((booking) =>
      ["searching", "matched", "confirmed", "in_progress"].includes(booking.status),
    ) ?? null;
  const bookedTrips = recentBookings.length;
  const liveTrips = recentBookings.filter((booking) =>
    ["searching", "matched", "confirmed", "in_progress"].includes(booking.status),
  ).length;

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <div className="grid gap-6">
        <div className="panel p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-accent">
            Rider control room
          </p>
          <h2 className="mt-4 text-4xl font-semibold tracking-[-0.05em] text-brand-text-primary">
            Where are you heading next, {profile?.full_name?.split(" ")[0]}?
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-brand-text-secondary">
            Open the booking surface to match with riders on overlapping city corridors and review your per-seat fare before you confirm.
          </p>

          <ButtonLink
            to="/book"
            variant="outline"
            className="mt-8 flex justify-between rounded-[1.8rem] border-brand-border bg-brand-surface-soft p-5 normal-case tracking-normal text-left"
          >
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-accent text-brand-surface-strong">
                <MapPin size={22} />
              </div>
              <div>
                <p className="text-sm font-semibold text-brand-text-primary">
                  Plan a new shared ride
                </p>
                <p className="text-sm text-brand-text-secondary">
                  Review fare estimates and active route context before you confirm.
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-brand-text-secondary" />
          </ButtonLink>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="panel p-6">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-text-secondary">
                Trips booked
              </p>
              <Route size={16} className="text-brand-accent" />
            </div>
            <p className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-brand-text-primary">
              {bookedTrips}
            </p>
            <p className="mt-3 text-sm leading-7 text-brand-text-secondary">
              Total bookings found for this rider profile.
            </p>
          </div>
          <div className="panel p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-text-secondary">
              Live activity
            </p>
            <p className="mt-5 text-4xl font-semibold tracking-[-0.05em] text-brand-text-primary">
              {liveTrips}
            </p>
            <p className="mt-3 text-sm leading-7 text-brand-text-secondary">
              Searches or trips currently in progress.
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-6">
        <div className="panel p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-accent">
            Active route
          </p>
          <div className="mt-5 rounded-[1.8rem] border border-brand-border bg-brand-surface-soft p-5">
            {activeBooking ? (
              <>
                <p className="text-base font-semibold text-brand-text-primary">
                  {activeBooking.pickup_address} to {activeBooking.dest_address}
                </p>
                <p className="mt-2 text-sm text-brand-text-secondary">
                  Status: {activeBooking.status.replace("_", " ")} / Seats: {activeBooking.seats} /
                  {" "}Fare: INR {activeBooking.fare_total}
                </p>
              </>
            ) : (
              <>
                <p className="text-base font-semibold text-brand-text-primary">
                  No active route yet
                </p>
                <p className="mt-2 text-sm text-brand-text-secondary">
                  Once you start matching, the latest live ride will appear here.
                </p>
              </>
            )}
          </div>
        </div>

        <div className="panel p-6">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-accent">
              Account signals
            </p>
            {profile?.is_email_verified ? (
              <span className="route-chip border-brand-accent/20 bg-brand-accent/10 text-brand-text-primary">
                Verified
              </span>
            ) : null}
          </div>
          <div className="mt-5 grid gap-3">
            <div className="rounded-[1.6rem] border border-brand-border bg-brand-surface-soft p-5">
              <p className="text-sm font-semibold text-brand-text-primary">Primary city</p>
              <p className="mt-1 text-sm text-brand-text-secondary">
                {profile?.city || "Add your city in onboarding"}
              </p>
            </div>
            <div className="rounded-[1.6rem] border border-brand-border bg-brand-surface-soft p-5">
              <p className="text-sm font-semibold text-brand-text-primary">Verification</p>
              <p className="mt-1 text-sm text-brand-text-secondary">
                {profile?.is_email_verified ? "Email verified" : "Email verification pending"}
                {" / "}
                {profile?.is_phone_verified ? "Phone verified" : "Phone verification pending"}
              </p>
            </div>
            {savedLocations.length ? (
              savedLocations.map((location) => (
                <div
                  key={location.label}
                  className="rounded-[1.6rem] border border-brand-border bg-brand-surface-soft p-5"
                >
                  <p className="text-sm font-semibold text-brand-text-primary">
                    {location.label}
                  </p>
                  <p className="mt-1 text-sm text-brand-text-secondary">{location.address}</p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.6rem] border border-brand-border bg-brand-surface-soft p-5">
                <p className="text-sm font-semibold text-brand-text-primary">Saved locations</p>
                <p className="mt-1 text-sm text-brand-text-secondary">
                  Add home and work addresses during onboarding to speed up route setup.
                </p>
              </div>
            )}
          </div>
          {loadingBookings ? (
            <p className="mt-4 text-sm text-brand-text-secondary">
              Loading recent ride activity.
            </p>
          ) : null}
          {bookingError ? (
            <p className="mt-4 text-sm text-brand-text-secondary">{bookingError}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
