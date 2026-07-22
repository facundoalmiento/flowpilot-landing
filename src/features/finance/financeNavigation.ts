export type FinanceTab =
  | "summary"
  | "movements"
  | "month"
  | "history"
  | "commitments"
  | "cards"
  | "reserves"
  | "settings";

export type FinanceComposeTarget = "income" | "expense" | null;

export const financeTabs: Array<{ id: FinanceTab; label: string }> = [
  { id: "summary", label: "Resumen" },
  { id: "movements", label: "Ingresos y gastos" },
  { id: "month", label: "Mes" },
  { id: "history", label: "Historial" },
  { id: "commitments", label: "Compromisos" },
  { id: "cards", label: "Tarjetas y cuotas" },
  { id: "reserves", label: "Reservas" },
  { id: "settings", label: "Configuracion" }
];

export function parseFinanceTab(value: string | null): FinanceTab {
  return financeTabs.some((tab) => tab.id === value) ? (value as FinanceTab) : "summary";
}

export function parseFinanceComposeTarget(value: string | null): FinanceComposeTarget {
  return value === "income" || value === "expense" ? value : null;
}
