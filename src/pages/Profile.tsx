import { CreditCard, LogOut, MapPin, Settings, Shield, User } from "lucide-react";
import { motion } from "motion/react";

import { Button, ButtonLink } from "../components/ui/Button";
import { Avatar } from "../components/ui/Avatar";
import { useAuthStore } from "../store/useAuthStore";

const sections = [
  { icon: Shield, title: "Email verification", description: "Used for login and ride alerts." },
  { icon: MapPin, title: "Primary city", description: "Used for route defaults and onboarding context." },
  { icon: CreditCard, title: "Phone verification", description: "Used for trust and urgent support contact." },
  { icon: Settings, title: "Onboarding status", description: "Tracks whether your route identity is complete." },
];

export default function Profile() {
  const { user, profile, signOut, loading } = useAuthStore();

  if (loading || (user && !profile)) {
    return (
      <div className="section-shell flex min-h-[calc(100vh-5rem)] items-center justify-center">
        <div className="panel flex items-center gap-4 px-6 py-5">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-black border-t-transparent" />
          <p className="text-sm font-medium text-black/60">Fetching your profile.</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="section-shell flex min-h-[calc(100vh-5rem)] items-center justify-center">
        <div className="panel max-w-xl p-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-none border-2 border-black bg-white text-black">
            <User size={28} />
          </div>
          <h1 className="mt-6 text-4xl font-black uppercase tracking-tight text-black">
            Sign in to view your profile.
          </h1>
          <ButtonLink to="/login" size="lg" className="mt-8">
            Go to login
          </ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <div className="section-shell pt-6">
      <div className="section-frame max-w-5xl space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="panel flex flex-col gap-8 p-8 md:flex-row md:items-center"
        >
          <Avatar
            src={profile.avatar_url}
            name={profile.full_name}
            alt={`${profile.full_name || "HopIn user"} avatar`}
            className="h-28 w-28"
          />

          <div className="flex-1 space-y-4">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-black">
                Profile
              </p>
              <h1 className="mt-2 text-4xl font-black uppercase tracking-tight text-black">
                {profile.full_name || "HopIn user"}
              </h1>
              <p className="mt-2 text-sm text-black/60">{profile.email}</p>
            </div>

            <div className="flex flex-wrap gap-3">
              <span className="route-chip">Role / {profile.role}</span>
              <span className="route-chip">City / {profile.city || "Not added"}</span>
              <span className="route-chip">
                Verified /{" "}
                {profile.is_email_verified && profile.is_phone_verified
                  ? "Confirmed"
                  : profile.is_email_verified || profile.is_phone_verified
                    ? "Partial"
                    : "Pending"}
              </span>
              <span className="route-chip">
                Account / {profile.onboarding_completed ? "Complete" : "Needs onboarding"}
              </span>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2">
            {sections.map((section) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="panel flex items-center justify-between p-6 text-left"
              >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-none border-2 border-black bg-black text-white">
                  <section.icon size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold tracking-[-0.04em] text-black">
                    {section.title}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-black/60">
                    {section.description}
                  </p>
                </div>
                </div>
                <span className="text-sm text-black/60">
                  {section.title === "Email verification"
                    ? profile.is_email_verified
                      ? "Verified"
                      : "Pending"
                    : section.title === "Primary city"
                      ? profile.city || "Not added"
                      : section.title === "Phone verification"
                        ? profile.is_phone_verified
                          ? "Verified"
                          : profile.phone || "Not added"
                        : profile.onboarding_completed
                          ? "Complete"
                          : "Incomplete"}
                </span>
              </motion.div>
            ))}
          </div>

        <div className="flex justify-center">
          <Button variant="outline" className="gap-2" onClick={() => void signOut()}>
            <LogOut size={16} />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}

