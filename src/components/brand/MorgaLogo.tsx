export function MorgaLogo() {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-11 w-11 place-items-center rounded-full border border-morga-line bg-morga-surfaceAlt font-display text-3xl font-bold text-morga-text">
        M
      </div>
      <div>
        <p className="font-display text-3xl font-semibold leading-none text-morga-text">
          Morga
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.2em] text-morga-muted">
          planner personal
        </p>
      </div>
    </div>
  );
}
