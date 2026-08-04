export type FinanceTab = "home" | "movements" | "more";

export type FinanceMoreSection = "month" | "commitments" | "cards" | "reserves" | "settings";

export type FinanceMovementsView = "list" | "history";

export type FinanceComposeTarget = "income" | "expense" | null;

export const financeTabs: Array<{ id: FinanceTab; label: string }> = [
  { id: "home", label: "Hoy" },
  { id: "movements", label: "Movimientos" },
  { id: "more", label: "Mas" }
];

export const financeMoreSections: Array<{ id: FinanceMoreSection; label: string }> = [
  { id: "month", label: "Cierre mensual" },
  { id: "commitments", label: "Compromisos fijos" },
  { id: "cards", label: "Tarjetas y cuotas" },
  { id: "reserves", label: "Reservas" },
  { id: "settings", label: "Configuracion" }
];

// Mapea las pestañas viejas (8) a la navegacion nueva (3) para que los enlaces
// existentes en el resto de la app (Proyectos, Decisiones, Historial) sigan
// funcionando sin tener que tocarlos uno por uno.
const legacyTabToTab: Record<string, FinanceTab> = {
  summary: "home",
  movements: "movements",
  history: "movements",
  month: "more",
  commitments: "more",
  cards: "more",
  reserves: "more",
  settings: "more"
};

export function parseFinanceTab(value: string | null): FinanceTab {
  if (!value) return "home";
  if (financeTabs.some((tab) => tab.id === value)) return value as FinanceTab;
  return legacyTabToTab[value] ?? "home";
}

export function parseFinanceMoreSection(
  tabValue: string | null,
  sectionValue: string | null
): FinanceMoreSection {
  if (sectionValue && financeMoreSections.some((section) => section.id === sectionValue)) {
    return sectionValue as FinanceMoreSection;
  }
  if (tabValue && financeMoreSections.some((section) => section.id === tabValue)) {
    return tabValue as FinanceMoreSection;
  }
  return "month";
}

export function parseFinanceMovementsView(
  tabValue: string | null,
  viewValue: string | null
): FinanceMovementsView {
  if (viewValue === "history" || tabValue === "history") return "history";
  return "list";
}

export function parseFinanceComposeTarget(value: string | null): FinanceComposeTarget {
  return value === "income" || value === "expense" ? value : null;
}
