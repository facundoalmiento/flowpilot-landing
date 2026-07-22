import { ReactNode } from "react";

interface SectionCardProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function SectionCard({
  title,
  description,
  action,
  children
}: SectionCardProps) {
  return (
    <section className="rounded-panel border border-morga-line bg-white p-4 shadow-soft md:p-5">
      <div className="flex flex-col gap-3 border-b border-morga-line/70 pb-3 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <h2 className="font-display text-[1.65rem] font-semibold text-morga-text md:text-[1.85rem]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1.5 text-sm leading-6 text-morga-muted">{description}</p>
          ) : null}
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}
