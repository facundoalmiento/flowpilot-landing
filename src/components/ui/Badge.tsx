import { ReactNode } from "react";

type BadgeTone = "default" | "danger" | "warning" | "success" | "info" | "muted";

const toneClasses: Record<BadgeTone, string> = {
  default: "border-morga-line bg-white text-morga-text",
  danger: "border-red-200 bg-red-50 text-red-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  success: "border-emerald-200 bg-emerald-50 text-emerald-700",
  info: "border-sky-200 bg-sky-50 text-sky-700",
  muted: "border-morga-line bg-morga-surfaceAlt text-morga-muted"
};

interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
}

export function Badge({ children, tone = "default" }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${toneClasses[tone]}`}
    >
      {children}
    </span>
  );
}
