import { ArrowLeft } from "lucide-react";

import { ButtonLink } from "../components/ui/Button";

export default function NotFound() {
  return (
    <div className="section-shell flex min-h-[calc(100vh-5rem)] items-center">
      <div className="section-frame max-w-3xl">
        <div className="panel-dark p-8 text-center md:p-10">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-brand-accent">
            404
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-[-0.06em] text-white">
            That route does not exist.
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-white/62">
            The page may have moved, or the URL is not part of the current HopIn site map.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <ButtonLink to="/" size="lg" className="gap-2">
              <ArrowLeft size={16} />
              Back to home
            </ButtonLink>
            <ButtonLink to="/contact" variant="outline" size="lg" className="border-white/15 text-white hover:bg-white/10">
              Contact support
            </ButtonLink>
          </div>
        </div>
      </div>
    </div>
  );
}
