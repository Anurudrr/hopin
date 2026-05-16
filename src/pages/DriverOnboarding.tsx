import * as React from "react";
import { CalendarDays, CarFront, FileText, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button, ButtonLink } from "../components/ui/Button";
import { submitDriverApplication } from "../lib/api";
import { getErrorMessage, logDevError } from "../lib/errors";
import { useAuthStore } from "../store/useAuthStore";

export default function DriverOnboarding() {
  const navigate = useNavigate();
  const { user, profile, fetchProfile } = useAuthStore();
  const [loading, setLoading] = React.useState(false);
  const [completed, setCompleted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({
    licenseNumber: "",
    licenseExpiry: "",
    documentUrl: "",
    make: "",
    model: "",
    year: "",
    color: "",
    capacity: "4",
    plate: "",
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      setError("Sign in before submitting a driver application.");
      return;
    }

    if (!profile?.city) {
      setError("Complete account onboarding first so your city is on file.");
      return;
    }

    if (
      !formData.licenseNumber.trim() ||
      !formData.licenseExpiry ||
      !formData.make.trim() ||
      !formData.model.trim() ||
      !formData.year.trim() ||
      !formData.color.trim() ||
      !formData.plate.trim()
    ) {
      setError("Complete the license and vehicle fields before submitting.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await submitDriverApplication({
        licenseNumber: formData.licenseNumber.trim(),
        licenseExpiry: formData.licenseExpiry,
        documentUrl: formData.documentUrl.trim(),
        make: formData.make.trim(),
        model: formData.model.trim(),
        year: Number(formData.year),
        color: formData.color.trim(),
        capacity: Number(formData.capacity) || 4,
        plate: formData.plate.trim().toUpperCase(),
      });
      await fetchProfile();
      toast.success("Application submitted!");
      setCompleted(true);
    } catch (submissionError) {
      logDevError("DriverOnboarding.submit", submissionError);
      const message = getErrorMessage(submissionError, "Could not submit the driver application.");
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="section-shell flex min-h-[calc(100vh-5rem)] items-center">
        <div className="section-frame max-w-3xl">
          <div className="panel p-8 text-center md:p-10">
            <h1 className="text-4xl font-semibold tracking-[-0.05em] text-brand-text-primary">
              Sign in before applying as a driver.
            </h1>
            <p className="mt-4 text-sm leading-7 text-brand-text-secondary">
              Driver applications are tied directly to your Supabase account profile.
            </p>
            <ButtonLink to="/login?mode=signup" size="lg" className="mt-8">
              Create an account
            </ButtonLink>
          </div>
        </div>
      </div>
    );
  }

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
              Your license details, review document link, and vehicle metadata are now stored in
              Supabase. Open the dashboard to start publishing shared rides.
            </p>
            <Button size="lg" className="mt-8" onClick={() => navigate("/dashboard")}>
              Return to dashboard
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
              <div className="eyebrow text-white/55">Driver application</div>
              <h1 className="text-5xl font-semibold tracking-[-0.06em] text-white">
                Add the license and vehicle details needed to schedule rides.
              </h1>
              <p className="text-base leading-8 text-white/62">
                This flow writes directly to `driver_applications` and `vehicles`, then upgrades
                your profile role to driver.
              </p>
            </div>

            <div className="grid gap-3 text-sm text-white/65">
              <div className="rounded-[1.6rem] border border-white/12 bg-white/8 px-5 py-4">
                01 / License metadata
              </div>
              <div className="rounded-[1.6rem] border border-white/12 bg-white/8 px-5 py-4">
                02 / Review document link
              </div>
              <div className="rounded-[1.6rem] border border-white/12 bg-white/8 px-5 py-4">
                03 / Vehicle record
              </div>
            </div>
          </div>

          <motion.form
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="panel space-y-8 p-8 md:p-10"
          >
            <div>
              <h2 className="text-4xl font-semibold tracking-[-0.05em] text-brand-text-primary">
                Driver details
              </h2>
              <p className="mt-3 text-sm leading-7 text-brand-text-secondary">
                Use the exact details you want attached to your public driver and vehicle records.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="license-number" className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-text-secondary">
                  License number
                </label>
                <div className="relative">
                  <FileText className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-text-secondary" size={16} />
                  <input
                    id="license-number"
                    type="text"
                    value={formData.licenseNumber}
                    onChange={(event) => {
                      setError(null);
                      setFormData((current) => ({ ...current, licenseNumber: event.target.value }));
                    }}
                    className="field-shell pl-12"
                    placeholder="MH1420261234567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="license-expiry" className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-text-secondary">
                  License expiry
                </label>
                <div className="relative">
                  <CalendarDays className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-text-secondary" size={16} />
                  <input
                    id="license-expiry"
                    type="date"
                    value={formData.licenseExpiry}
                    onChange={(event) => {
                      setError(null);
                      setFormData((current) => ({ ...current, licenseExpiry: event.target.value }));
                    }}
                    className="field-shell pl-12"
                  />
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label htmlFor="document-file" className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-text-secondary">
                  Document Upload (PDF or Image)
                </label>
                <input
                  id="document-file"
                  type="file"
                  accept=".pdf,image/*"
                  onChange={(event) => {
                    setError(null);
                    const file = event.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        const dataUrl = e.target?.result as string;
                        setFormData((current) => ({ ...current, documentUrl: dataUrl }));
                        toast.success("Document loaded");
                      };
                      reader.onerror = () => {
                        toast.error("Failed to read file");
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="field-shell"
                />
                <p className="text-xs text-brand-text-secondary">Upload your license scan or photo</p>
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="vehicle-make" className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-text-secondary">
                  Make
                </label>
                <div className="relative">
                  <CarFront className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-text-secondary" size={16} />
                  <input
                    id="vehicle-make"
                    type="text"
                    value={formData.make}
                    onChange={(event) => {
                      setError(null);
                      setFormData((current) => ({ ...current, make: event.target.value }));
                    }}
                    className="field-shell pl-12"
                    placeholder="Hyundai"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label htmlFor="vehicle-model" className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-text-secondary">
                  Model
                </label>
                <input
                  id="vehicle-model"
                  type="text"
                  value={formData.model}
                  onChange={(event) => {
                    setError(null);
                    setFormData((current) => ({ ...current, model: event.target.value }));
                  }}
                  className="field-shell"
                  placeholder="Creta"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="vehicle-year" className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-text-secondary">
                  Year
                </label>
                <input
                  id="vehicle-year"
                  type="number"
                  min={2000}
                  max={2100}
                  value={formData.year}
                  onChange={(event) => {
                    setError(null);
                    setFormData((current) => ({ ...current, year: event.target.value }));
                  }}
                  className="field-shell"
                  placeholder="2023"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="vehicle-color" className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-text-secondary">
                  Color
                </label>
                <input
                  id="vehicle-color"
                  type="text"
                  value={formData.color}
                  onChange={(event) => {
                    setError(null);
                    setFormData((current) => ({ ...current, color: event.target.value }));
                  }}
                  className="field-shell"
                  placeholder="White"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="vehicle-capacity" className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-text-secondary">
                  Capacity
                </label>
                <input
                  id="vehicle-capacity"
                  type="number"
                  min={1}
                  max={8}
                  value={formData.capacity}
                  onChange={(event) => {
                    setError(null);
                    setFormData((current) => ({ ...current, capacity: event.target.value }));
                  }}
                  className="field-shell"
                  placeholder="4"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="vehicle-plate" className="text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-text-secondary">
                  License plate
                </label>
                <input
                  id="vehicle-plate"
                  type="text"
                  value={formData.plate}
                  onChange={(event) => {
                    setError(null);
                    setFormData((current) => ({ ...current, plate: event.target.value }));
                  }}
                  className="field-shell"
                  placeholder="MH01AB1234"
                />
              </div>
            </div>

            {error ? (
              <div className="rounded-[1.5rem] border border-brand-warning/25 bg-brand-warning/10 px-5 py-4 text-sm text-brand-warning">
                {error}
              </div>
            ) : null}

            <Button type="submit" size="lg" disabled={loading}>
              {loading ? "Submitting application" : "Submit driver application"}
            </Button>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
