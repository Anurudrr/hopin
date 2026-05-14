import * as React from "react";
import { Bell, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { DriverDashboard } from "../components/dashboard/DriverDashboard";
import { RiderDashboard } from "../components/dashboard/RiderDashboard";
import { useAuthStore } from "../store/useAuthStore";
import { Avatar } from "../components/ui/Avatar";

export default function Dashboard() {
  const { profile } = useAuthStore();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = React.useState(false);

  if (!profile) {
    return (
      <div className="section-shell flex min-h-[calc(100vh-5rem)] items-center justify-center">
        <div className="panel flex items-center gap-4 px-6 py-5">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-brand-border border-t-brand-accent" />
          <p className="text-sm text-brand-text-secondary">Loading your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="section-shell pt-6">
      <div className="section-frame space-y-6">
        <header className="panel flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <Avatar
              src={profile.avatar_url}
              name={profile.full_name}
              alt={`${profile.full_name || "HopIn user"} avatar`}
              className="h-14 w-14"
            />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-text-secondary">
                Dashboard
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-brand-text-primary">
                Welcome back, {profile.full_name || "HopIn user"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div
              aria-hidden="true"
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-border bg-brand-surface-soft text-brand-text-secondary"
            >
              <Bell size={18} />
            </div>
            <button
              onClick={() => navigate("/profile")}
              aria-label="Open profile settings"
              className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-border bg-brand-surface-soft text-brand-text-secondary"
            >
              <Settings size={18} />
            </button>
          </div>
        </header>

        {profile.role === "driver" ? (
          <DriverDashboard isOnline={isOnline} setIsOnline={setIsOnline} />
        ) : (
          <RiderDashboard profile={profile} />
        )}
      </div>
    </div>
  );
}
