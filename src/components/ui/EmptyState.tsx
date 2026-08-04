interface EmptyStateProps {
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <div className="rounded-panel border border-dashed border-morga-line bg-morga-surface/70 p-8 text-center shadow-soft">
      <p className="font-display text-3xl font-semibold text-morga-text">{title}</p>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-morga-muted">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
