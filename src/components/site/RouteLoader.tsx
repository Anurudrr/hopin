export function RouteLoader() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6" role="status" aria-live="polite">
      <div className="panel flex min-w-[280px] items-center gap-4 px-6 py-5">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-black border-t-transparent" />
        <div>
          <p className="text-xs font-black uppercase tracking-[0.28em] text-black/55">
            Loading Route
          </p>
          <p className="text-sm font-medium text-black/60">
            Preparing the next surface.
          </p>
        </div>
      </div>
    </div>
  );
}
