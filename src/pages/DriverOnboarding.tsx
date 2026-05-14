import * as React from "react";
import { FileText, ShieldCheck, CarFront } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useNavigate } from "react-router-dom";

import { submitDriverApplication } from "../lib/api";
import { Button, ButtonLink } from "../components/ui/Button";
import { cn } from "../lib/utils";
import { useAuthStore } from "../store/useAuthStore";

const steps = [
  { id: 1, label: "Personal" },
  { id: 2, label: "Documents" },
  { id: 3, label: "Vehicle" },
];

export default function DriverOnboarding() {
  const navigate = useNavigate();
  const { user, profile } = useAuthStore();
  const [step, setStep] = React.useState(1);
  const [loading, setLoading] = React.useState(false);
  const [completed, setCompleted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({
    experience: "",
    history: "",
    documents: {
      license: false,
      aadhaar: false,
      pan: false,
    },
    make: "",
    model: "",
    year: "",
    plate: "",
  });

  const allDocumentsReady = Object.values(formData.documents).every(Boolean);

  const validateStep = () => {
    if (step === 1) {
      if (!formData.experience.trim() || !formData.history.trim()) {
        return "Complete both personal fields before continuing.";
      }
    }

    if (step === 2 && !allDocumentsReady) {
      return "Confirm that each required document is ready for review.";
    }

    if (step === 3) {
      if (!formData.make.trim() || !formData.model.trim() || !formData.plate.trim()) {
        return "Enter the core vehicle details before submitting.";
      }

      if (!/^\d{4}$/.test(formData.year.trim())) {
        return "Enter a valid 4-digit model year.";
      }
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
      setError("Create a driver account before submitting an application.");
      return;
    }

    if (user.role !== "driver") {
      setError("Use a driver account to submit this application.");
      return;
    }

    if (!profile?.onboarding_completed || !profile.city) {
      setError("Complete account onboarding first so your city and profile details are saved.");
      return;
    }

    setLoading(true);

    try {
      await submitDriverApplication({
        experience: formData.experience.trim(),
        history: formData.history.trim(),
        documents: formData.documents,
        make: formData.make.trim(),
        model: formData.model.trim(),
        year: Number(formData.year.trim()),
        plate: formData.plate.trim(),
      });
      setCompleted(true);
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "Could not submit the driver application.",
      );
    } finally {
      setLoading(false);
    }
  };

  if (completed) {
    return (
      <div className="section-shell flex min-h-[calc(100vh-5rem)] items-center">
        <div className="section-frame max-w-3xl">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="panel-dark p-8 text-center md:p-10"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/8 text-brand-accent">
              <ShieldCheck size={28} />
            </div>
            <h1 className="mt-6 text-4xl font-semibold tracking-[-0.05em] text-white">
              Application submitted
            </h1>
            <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/62">
              Your driver details, document confirmations, and vehicle metadata are now stored in HopIn. Review the dashboard to manage availability and future trip assignments.
            </p>
            <Button
              size="lg"
              className="mt-8"
              onClick={() => navigate(user ? "/dashboard" : "/auth?mode=signup&role=driver")}
            >
              {user ? "Return to dashboard" : "Create driver account"}
            </Button>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="section-shell flex min-h-[calc(100vh-5rem)] items-center">
      <div className="section-frame max-w-6xl">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="panel-dark flex flex-col justify-between gap-8 p-8 md:p-10">
            <div className="space-y-5">
              <div className="eyebrow text-white/55">Driver onboarding</div>
              <h1 className="text-5xl font-semibold tracking-[-0.06em] text-white">
                Add the details needed to activate shared driving.
              </h1>
              <p className="text-base leading-8 text-white/62">
                We keep the application structured so drivers know what information is required at each step.
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
                  key="personal"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="space-y-8"
                >
                  <div>
                    <h2 className="text-4xl font-semibold tracking-[-0.05em] text-brand-text-primary">
                      Personal details
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-brand-text-secondary">
                      Give riders confidence in who they are sharing a vehicle with.
                    </p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <input
                      id="driving-experience"
                      type="text"
                      autoComplete="off"
                      value={formData.experience}
                      onChange={(event) => {
                        setError(null);
                        setFormData((current) => ({ ...current, experience: event.target.value }));
                      }}
                      className="field-shell"
                      placeholder="Years of driving experience"
                    />
                    <input
                      id="fleet-history"
                      type="text"
                      autoComplete="off"
                      value={formData.history}
                      onChange={(event) => {
                        setError(null);
                        setFormData((current) => ({ ...current, history: event.target.value }));
                      }}
                      className="field-shell"
                      placeholder="Previous platforms or fleet history"
                    />
                  </div>
                </motion.div>
              ) : null}

              {step === 2 ? (
                <motion.div
                  key="documents"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="space-y-8"
                >
                  <div>
                    <h2 className="text-4xl font-semibold tracking-[-0.05em] text-brand-text-primary">
                      Document checklist
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-brand-text-secondary">
                      Confirm that each review document is ready before the application is stored for operations review.
                    </p>
                  </div>

                  <div className="grid gap-4">
                    {[
                      { key: "license", label: "Driving license" },
                      { key: "aadhaar", label: "Aadhaar card" },
                      { key: "pan", label: "PAN card" },
                    ].map((document) => (
                      <button
                        key={document.key}
                        type="button"
                        onClick={() => {
                          setError(null);
                          setFormData((current) => ({
                            ...current,
                            documents: {
                              ...current.documents,
                              [document.key]:
                                !current.documents[document.key as keyof typeof current.documents],
                            },
                          }));
                        }}
                        className="flex items-center justify-between rounded-[1.8rem] border border-brand-border bg-brand-surface-soft p-5"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-surface-soft text-brand-accent">
                            <FileText size={20} />
                          </div>
                          <span className="text-sm font-semibold text-brand-text-primary">
                            {document.label}
                          </span>
                        </div>
                        <span className="route-chip">
                          {formData.documents[document.key as keyof typeof formData.documents]
                            ? "Ready"
                            : "Required"}
                        </span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : null}

              {step === 3 ? (
                <motion.div
                  key="vehicle"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="space-y-8"
                >
                  <div>
                    <h2 className="text-4xl font-semibold tracking-[-0.05em] text-brand-text-primary">
                      Vehicle details
                    </h2>
                    <p className="mt-3 text-sm leading-7 text-brand-text-secondary">
                      Core vehicle metadata keeps rider expectations accurate before pickup.
                    </p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <input
                      id="vehicle-make"
                      type="text"
                      autoComplete="off"
                      value={formData.make}
                      onChange={(event) => {
                        setError(null);
                        setFormData((current) => ({ ...current, make: event.target.value }));
                      }}
                      className="field-shell"
                      placeholder="Vehicle make"
                    />
                    <input
                      id="vehicle-model"
                      type="text"
                      autoComplete="off"
                      value={formData.model}
                      onChange={(event) => {
                        setError(null);
                        setFormData((current) => ({ ...current, model: event.target.value }));
                      }}
                      className="field-shell"
                      placeholder="Vehicle model"
                    />
                    <input
                      id="vehicle-year"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={formData.year}
                      onChange={(event) => {
                        setError(null);
                        setFormData((current) => ({ ...current, year: event.target.value }));
                      }}
                      className="field-shell"
                      placeholder="Year"
                    />
                    <input
                      id="vehicle-plate"
                      type="text"
                      autoComplete="off"
                      value={formData.plate}
                      onChange={(event) => {
                        setError(null);
                        setFormData((current) => ({
                          ...current,
                          plate: event.target.value.toUpperCase(),
                        }));
                      }}
                      className="field-shell"
                      placeholder="License plate"
                    />
                  </div>

                  <div className="rounded-[1.8rem] border border-brand-border bg-brand-surface-soft p-5">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-surface-soft text-brand-accent">
                        <CarFront size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-brand-text-primary">
                          Vehicle RC readiness
                        </p>
                        <p className="mt-1 text-sm text-brand-text-secondary">
                          RC readiness is stored with the application so the operations team can review it alongside the vehicle record.
                        </p>
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

            {!user ? (
              <div className="mt-6 rounded-[1.5rem] border border-brand-border bg-brand-surface-soft px-5 py-4 text-sm text-brand-text-secondary">
                Driver applications require a signed-in driver account. Create one, complete onboarding, then return here to submit your documents and vehicle details.
                <div className="mt-4">
                  <ButtonLink to="/auth?mode=signup&role=driver&next=/driver-signup" size="md">
                    Create driver account
                  </ButtonLink>
                </div>
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
              <Button onClick={() => void handleNext()} disabled={loading} size="lg">
                {loading ? "Submitting" : step === 3 ? "Submit application" : "Continue"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
