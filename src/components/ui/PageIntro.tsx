interface PageIntroProps {
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function PageIntro({ eyebrow, title, description, action }: PageIntroProps) {
  return (
    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.22em] text-morga-accent">
          {eyebrow}
        </p>
        <h1 className="mt-3 font-display text-5xl font-semibold leading-none tracking-[-0.03em] text-morga-text md:text-6xl">
          {title}
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-morga-muted md:text-base">
          {description}
        </p>
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}
