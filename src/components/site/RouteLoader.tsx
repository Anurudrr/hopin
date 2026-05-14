export function RouteLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6" role="status" aria-live="polite">
      <div className="panel-dark flex min-w-[280px] items-center gap-4 px-6 py-5">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-white/15 border-t-brand-accent" />
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/50">
            Loading Route
          </p>
          <p className="text-sm text-white/72">
            Preparing the next surface.
          </p>
        </div>
      </div>
    </div>
  );
}
