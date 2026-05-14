import * as React from "react";
import { CheckCircle2, MapPin, ShieldAlert, UserCircle2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useNavigate } from "react-router-dom";

import { Button } from "../components/ui/Button";
import { supportedCities } from "../content/siteContent";
import { updateAccountProfile } from "../lib/api";
import { cn } from "../lib/utils";
import { useAuthStore } from "../store/useAuthStore";

const steps = [
  { id: 1, label: "Identity" },
  { id: 2, label: "City" },
  { id: 3, label: "Safety" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuthStore();
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({
    gender: "",
    city: "",
    home_address: "",
    work_address: "",
    avatar_url: "",
  });

  React.useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (profile?.onboarding_completed) {
      navigate("/dashboard");
    }
  }, [user, profile, navigate]);

  React.useEffect(() => {
    if (!profile) return;

    setFormData((current) => ({
      gender: current.gender || profile?.gender || "",
      city: current.city || profile?.city || "",
      home_address: current.home_address || profile?.home_address || "",
      work_address: current.work_address || profile?.work_address || "",
      avatar_url: current.avatar_url || profile?.avatar_url || "",
    }));
  }, [profile]);

  const validateStep = () => {
    if (step === 1 && !formData.gender) {
      return "Choose how you want to present yourself in the network.";
    }

    if (step === 2 && !formData.city) {
      return "Select your primary city before continuing.";
    }

    return null;
  };

  const handleNext = async () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setError(null);

    if (step < 3) {
      setStep((current) => current + 1);
      return;
    }

    if (!user) {
      setError("Sign in again to complete onboarding.");
      return;
    }

    setLoading(true);

    try {
      await updateAccountProfile({
        avatar_url: formData.avatar_url,
        city: formData.city,
        gender: formData.gender,
        home_address: formData.home_address,
        work_address: formData.work_address,
        onboarding_completed: true,
      });
      await refreshProfile();
      navigate("/dashboard");
    } catch (error) {
      console.error(error);
      setError(error instanceof Error ? error.message : "Could not save onboarding right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section-shell flex min-h-[calc(100vh-5rem)] items-center">
      <div className="section-frame max-w-5xl">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="panel-dark flex flex-col justify-between gap-8 p-8 md:p-10">
            <div className="space-y-5">
              <div className="eyebrow text-white/55">Onboarding</div>
              <h1 className="text-5xl font-semibold tracking-[-0.06em] text-white">
                Set up the route identity riders will see.
              </h1>
              <p className="text-base leading-8 text-white/62">
                A few profile details help create clearer matching, safer pickups, and better rider trust from the start.
              </p>
            </div>

            <div className="grid gap-3">
              {steps.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-[1.6rem] border px-5 py-4 text-sm font-semibold uppercase tracking-[0.22em]",
                    step === item.id
                      ? "border-brand-accent bg-brand-accent text-brand-surface-strong"
                      : step > item.id
                        ? "border-white/12 bg-white/8 text-white"
                        : "border-white/10 bg-white/6 text-white/60",
                  )}
                >
                  0{item.id} / {item.label}
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-8 md:p-10">
            <AnimatePresence mode="wait">
              {step === 1 ? (
                <motion.div
                  key="identity"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="space-y-8"
                >
                  <div>
                    <h2 className="text-4xl font-semibold tracking-[-0.05em] text-brand-text-primary">
                      Identity details
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-brand-text-secondary">
                      Use a clear name and choose how you would like to present yourself in the network.
                    </p>
                  </div>

                  <div className="flex flex-col items-center gap-4">
                    <div className="flex h-28 w-28 items-center justify-center rounded-full border border-brand-border bg-brand-surface-soft text-brand-text-secondary">
                      <UserCircle2 size={42} />
                    </div>
                    <input
                      id="avatar-url"
                      type="url"
                      autoComplete="url"
                      value={formData.avatar_url}
                      onChange={(event) => {
                        setError(null);
                        setFormData((current) => ({ ...current, avatar_url: event.target.value }));
                      }}
                      className="field-shell max-w-md"
                      placeholder="Optional avatar image URL"
                    />
                  </div>

                  <div className="space-y-3">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-text-secondary">
                      Gender
                    </p>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {["Male", "Female", "Other"].map((gender) => (
                        <button
                          key={gender}
                          type="button"
                          onClick={() => {
                            setError(null);
                            setFormData((current) => ({ ...current, gender }));
                          }}
                          aria-pressed={formData.gender === gender}
                          className={cn(
                            "rounded-2xl border px-4 py-4 text-sm font-semibold",
                            formData.gender === gender
                              ? "border-brand-accent bg-brand-accent text-brand-surface-strong"
                              : "border-brand-border bg-brand-surface-soft text-brand-text-primary",
                          )}
                        >
                          {gender}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : null}

              {step === 2 ? (
                <motion.div
                  key="city"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="space-y-8"
                >
                  <div>
                    <h2 className="text-4xl font-semibold tracking-[-0.05em] text-brand-text-primary">
                      Route context
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-brand-text-secondary">
                      Your primary city and common addresses help us create better route suggestions.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    {supportedCities.map((city) => (
                      <button
                        key={city}
                        type="button"
                        onClick={() => {
                          setError(null);
                          setFormData((current) => ({ ...current, city }));
                        }}
                        aria-pressed={formData.city === city}
                        className={cn(
                          "rounded-2xl border px-4 py-4 text-sm font-semibold",
                          formData.city === city
                            ? "border-brand-accent bg-brand-accent text-brand-surface-strong"
                            : "border-brand-border bg-brand-surface-soft text-brand-text-primary",
                        )}
                      >
                        {city}
                      </button>
                    ))}
                  </div>

                  <div className="grid gap-5">
                    <div className="space-y-2">
                      <label htmlFor="home-address" className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-text-secondary">
                        Home address
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-text-secondary" size={16} />
                        <input
                          id="home-address"
                          type="text"
                          autoComplete="street-address"
                          value={formData.home_address}
                          onChange={(event) => {
                            setError(null);
                            setFormData((current) => ({ ...current, home_address: event.target.value }));
                          }}
                          className="field-shell pl-12"
                          placeholder="Where you usually start"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="work-address" className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-text-secondary">
                        Work address
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-text-secondary" size={16} />
                        <input
                          id="work-address"
                          type="text"
                          autoComplete="off"
                          value={formData.work_address}
                          onChange={(event) => {
                            setError(null);
                            setFormData((current) => ({ ...current, work_address: event.target.value }));
                          }}
                          className="field-shell pl-12"
                          placeholder="Optional destination cluster"
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null}

              {step === 3 ? (
                <motion.div
                  key="safety"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="space-y-8"
                >
                  <div>
                    <h2 className="text-4xl font-semibold tracking-[-0.05em] text-brand-text-primary">
                      Safety and conduct
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-brand-text-secondary">
                      Clear conduct and verification expectations make shared commuting work better for everyone.
                    </p>
                  </div>

                  <div className="grid gap-4">
                    <div className="rounded-[1.8rem] border border-brand-border bg-brand-surface-soft p-5">
                      <div className="flex items-start gap-4">
                        <ShieldAlert className="mt-1 text-brand-accent" size={20} />
                        <div>
                          <h3 className="text-xl font-semibold tracking-[-0.04em] text-brand-text-primary">
                            Identity review
                          </h3>
                          <p className="mt-3 text-sm leading-7 text-brand-text-secondary">
                            We recommend completing identity verification later to improve rider confidence and route quality.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[1.8rem] border border-brand-border bg-brand-surface-soft p-5">
                      <div className="flex items-start gap-4">
                        <CheckCircle2 className="mt-1 text-brand-success" size={20} />
                        <div>
                          <h3 className="text-xl font-semibold tracking-[-0.04em] text-brand-text-primary">
                            Community code
                          </h3>
                          <p className="mt-3 text-sm leading-7 text-brand-text-secondary">
                            Shared rides require punctual pickups, respectful behavior, and reliable route information.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>

            {error ? (
              <div className="mt-6 rounded-[1.5rem] border border-brand-warning/25 bg-brand-warning/10 px-5 py-4 text-sm text-brand-warning">
                {error}
              </div>
            ) : null}

            <div className="mt-10 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => {
                  setError(null);
                  setStep((current) => Math.max(1, current - 1));
                }}
                disabled={step === 1}
                className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-text-secondary disabled:opacity-40"
              >
                Back
              </button>
              <Button onClick={handleNext} disabled={loading} size="lg">
                {loading ? "Saving" : step === 3 ? "Complete profile" : "Continue"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
