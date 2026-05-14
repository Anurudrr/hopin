import * as React from "react";
import { Car, CheckCircle2, Clock, ShieldCheck, UserCheck, Wallet } from "lucide-react";

import { getDriverDashboardData, updateDriverAvailability } from "../../lib/api";
import { cn } from "../../lib/utils";
import { useAuthStore } from "../../store/useAuthStore";
import type { Booking, DriverRecord } from "../../types";
import { ButtonLink } from "../ui/Button";
import { StatCard } from "./StatCard";

interface DriverDashboardProps {
  isOnline: boolean;
  setIsOnline: (value: boolean) => void;
}

export const DriverDashboard = ({ isOnline, setIsOnline }: DriverDashboardProps) => {
  const profile = useAuthStore((state) => state.profile);
  const [assignedTrips, setAssignedTrips] = React.useState<Booking[]>([]);
  const [driverRecord, setDriverRecord] = React.useState<DriverRecord | null>(null);
  const [driverError, setDriverError] = React.useState<string | null>(null);
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [vehicleCount, setVehicleCount] = React.useState(0);

  React.useEffect(() => {
    let isMounted = true;

    const loadDriverData = async () => {
      if (!profile?.id) {
        return;
      }

      setDriverError(null);

      try {
        const data = await getDriverDashboardData();

        if (!isMounted) return;

        setDriverRecord(data.driverRecord ?? null);
        setVehicleCount(data.vehicleCount ?? 0);
        setAssignedTrips(data.assignedTrips ?? []);
      } catch (error) {
        if (!isMounted) return;

        setDriverError(
          error instanceof Error
            ? error.message
            : "Assigned trips will appear here once driver trip history is available.",
        );
        setDriverRecord(null);
        setVehicleCount(0);
        setAssignedTrips([]);
      }
    };

    void loadDriverData();

    return () => {
      isMounted = false;
    };
  }, [profile?.id]);

  React.useEffect(() => {
    if (driverRecord) {
      setIsOnline(driverRecord.is_online);
    }
  }, [driverRecord, setIsOnline]);

  const handleToggleOnline = async () => {
    const nextValue = !isOnline;

    if (!driverRecord) {
      setDriverError("Complete the driver application before changing availability.");
      return;
    }

    setIsOnline(nextValue);
    setIsSyncing(true);

    try {
      const { driverRecord: updatedDriver } = await updateDriverAvailability(nextValue);
      setDriverRecord(updatedDriver);
      setDriverError(null);
    } catch (error) {
      setDriverError(
        error instanceof Error
          ? error.message
          : "Could not update live availability right now.",
      );
      setIsOnline(!nextValue);
    } finally {
      setIsSyncing(false);
    }
  };

  const activeTrips = assignedTrips.filter((trip) =>
    ["matched", "confirmed", "in_progress"].includes(trip.status),
  );
  const completedTrips = assignedTrips.filter((trip) => trip.status === "completed").length;

  return (
    <div className="grid gap-6">
      <div
        className={cn(
          "rounded-[2rem] border p-8",
          isOnline
            ? "border-brand-accent bg-brand-accent text-brand-surface-strong shadow-[var(--shadow-float)]"
            : "panel",
        )}
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p
              className={cn(
                "text-[11px] font-semibold uppercase tracking-[0.24em]",
                isOnline ? "text-brand-surface-strong/70" : "text-brand-accent",
              )}
            >
              Driver status
            </p>
            <h2
              className={cn(
                "mt-3 text-4xl font-semibold tracking-[-0.05em]",
                isOnline ? "text-brand-surface-strong" : "text-brand-text-primary",
              )}
            >
              {isOnline ? "Availability is on." : "Driver availability is off."}
            </h2>
            <p
              className={cn(
                "mt-3 text-sm leading-7",
                isOnline ? "text-brand-surface-strong/74" : "text-brand-text-secondary",
              )}
            >
              {driverRecord
                ? "This toggle syncs to your driver record and can immediately pull queued demand in your city."
                : "A driver dispatch record is not connected yet, so availability cannot be synced from this dashboard."}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleToggleOnline()}
            role="switch"
            aria-checked={isOnline}
            aria-label={isOnline ? "Turn driver availability off" : "Turn driver availability on"}
            disabled={isSyncing}
            className={cn(
              "relative h-14 w-28 rounded-full border-4",
              isOnline ? "border-black/10 bg-black/6" : "border-brand-border bg-brand-surface-soft",
            )}
          >
            <span
              className={cn(
                "absolute top-1.5 h-8 w-8 rounded-full shadow-lg transition-all",
                isOnline ? "right-1.5 bg-brand-surface-strong" : "left-1.5 bg-brand-text-primary",
              )}
            />
          </button>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Assigned trips"
          value={String(assignedTrips.length)}
          icon={Wallet}
          color="text-brand-accent"
        />
        <StatCard label="Active trips" value={String(activeTrips.length)} icon={Car} />
        <StatCard
          label="Vehicles on file"
          value={String(vehicleCount)}
          icon={CheckCircle2}
          color="text-brand-success"
        />
        <StatCard
          label="Completed trips"
          value={String(completedTrips)}
          icon={ShieldCheck}
          color="text-brand-success"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="panel p-8">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-accent">
              Assigned trips
            </p>
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-text-secondary">
              {activeTrips.length ? `${activeTrips.length} live` : "No active trips"}
            </span>
          </div>

          {!assignedTrips.length ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-surface-soft text-brand-text-secondary">
                <Clock size={28} />
              </div>
              <p className="mt-6 max-w-md text-sm leading-7 text-brand-text-secondary">
                Assigned driver trips will appear here once the dispatch and driver assignment pipeline is connected to your account.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4">
              {assignedTrips.map((trip) => (
                <div
                  key={trip.id}
                  className="rounded-[1.8rem] border border-brand-border bg-brand-surface-soft p-5"
                >
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-accent">
                        {trip.status.replace("_", " ")}
                      </p>
                      <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-brand-text-primary">
                        {trip.pickup_address}
                      </h3>
                      <p className="mt-2 text-sm text-brand-text-secondary">
                        to {trip.dest_address}
                      </p>
                    </div>
                    <span className="route-chip bg-brand-surface-soft">INR {trip.fare_total}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="grid gap-6">
          <div className="panel p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-accent">
              Verification
            </p>
            <div className="mt-5 rounded-[1.8rem] border border-brand-border bg-brand-surface-soft p-5">
              <p className="text-base font-semibold text-brand-text-primary">
                {driverRecord ? `Driver status: ${driverRecord.status}` : "Driver record not connected"}
              </p>
              <p className="mt-2 text-sm leading-7 text-brand-text-secondary">
                {driverRecord
                  ? "Use profile and onboarding surfaces to keep your account and document details current."
                  : "Complete the driver application flow to add review details and vehicle information to your dispatch record."}
              </p>
            </div>
          </div>

          <div className="panel p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-accent">
              Next actions
            </p>
            <div className="mt-5 grid gap-3">
              <ButtonLink
                to="/profile"
                variant="outline"
                className="justify-between rounded-[1.6rem] border-brand-border bg-brand-surface-soft px-5 py-5 normal-case tracking-normal text-left"
              >
                <span className="text-sm font-semibold text-brand-text-primary">
                  Review profile and verification details
                </span>
                <UserCheck size={16} className="text-brand-accent" />
              </ButtonLink>
              <ButtonLink
                to="/book"
                variant="outline"
                className="justify-between rounded-[1.6rem] border-brand-border bg-brand-surface-soft px-5 py-5 normal-case tracking-normal text-left"
              >
                <span className="text-sm font-semibold text-brand-text-primary">
                  Open the rider booking view for route context
                </span>
                <Car size={16} className="text-brand-accent" />
              </ButtonLink>
            </div>
            {driverError ? (
              <p className="mt-4 text-sm text-brand-text-secondary">{driverError}</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
