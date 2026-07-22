import { ReactNode } from "react";

interface StatCardProps {
  label: string;
  value: string;
  detail: string;
  accent?: ReactNode;
}

export function StatCard({ label, value, detail, accent }: StatCardProps) {
  return (
    <article className="rounded-panel border border-morga-line bg-white p-5 shadow-soft">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-morga-muted">
            {label}
          </p>
          <p className="mt-4 font-display text-4xl font-semibold leading-none text-morga-text">
            {value}
          </p>
        </div>
        {accent}
      </div>
      <p className="mt-4 text-sm leading-7 text-morga-muted">{detail}</p>
    </article>
  );
}
