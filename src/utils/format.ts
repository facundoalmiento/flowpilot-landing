import {
  DecisionCategory,
  DecisionNecessity,
  DecisionPaymentOptionType,
  DecisionRecommendationCode,
  DecisionStatus,
  DecisionUrgency,
  ExpenseCategory,
  IncomeStatus,
  IncomeType,
  DecisionImpact,
  PaymentMethod,
  ProjectPriority,
  ReservePriority,
  ReserveStatus,
  TaskPriority,
  TaskStatus
} from "../types/domain";

export function formatMoney(value: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  }).format(value);
}

const projectPriorityOrder: Record<ProjectPriority, number> = {
  Critica: 4,
  Alta: 3,
  Media: 2,
  Baja: 1
};

const taskPriorityOrder: Record<TaskPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1
};

const taskPriorityLabels: Record<TaskPriority, string> = {
  critical: "Critica",
  high: "Alta",
  medium: "Media",
  low: "Baja"
};

const taskStatusLabels: Record<TaskStatus, string> = {
  pending: "Pendiente",
  "in-progress": "En progreso",
  completed: "Completada"
};

const incomeTypeLabels: Record<IncomeType, string> = {
  salary: "Sueldo",
  allowance: "Viatico",
  bonus: "Aguinaldo",
  refund: "Reintegro",
  extra: "Ingreso extra",
  other: "Otro"
};

const incomeStatusLabels: Record<IncomeStatus, string> = {
  expected: "Esperado",
  received: "Cobrado"
};

const expenseCategoryLabels: Record<ExpenseCategory, string> = {
  housing: "Vivienda",
  transport: "Transporte",
  health: "Salud",
  training: "Entrenamiento",
  food: "Alimentacion",
  cards: "Tarjetas",
  loan: "Prestamo",
  travel: "Viajes",
  shopping: "Compras",
  projects: "Proyectos",
  other: "Otro"
};

const paymentMethodLabels: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  debit: "Debito",
  "bank-transfer": "Transferencia",
  "credit-card": "Tarjeta",
  other: "Otro"
};

const reservePriorityLabels: Record<ReservePriority, string> = {
  high: "Alta",
  medium: "Media",
  low: "Baja"
};

const reserveStatusLabels: Record<ReserveStatus, string> = {
  active: "Activa",
  completed: "Completa",
  archived: "Archivada"
};

const decisionCategoryLabels: Record<DecisionCategory, string> = {
  safety: "Seguridad",
  health: "Salud",
  transport: "Transporte",
  housing: "Vivienda",
  training: "Entrenamiento",
  work: "Trabajo",
  technology: "Tecnologia",
  travel: "Viaje",
  "personal-project": "Proyecto personal",
  comfort: "Comodidad",
  maintenance: "Mantenimiento",
  other: "Otro"
};

const decisionUrgencyLabels: Record<DecisionUrgency, string> = {
  low: "Baja",
  medium: "Media",
  high: "Alta",
  critical: "Critica"
};

const decisionImpactLabels: Record<DecisionImpact, string> = {
  low: "Bajo",
  medium: "Medio",
  high: "Alto"
};

const decisionNecessityLabels: Record<DecisionNecessity, string> = {
  essential: "Esencial",
  important: "Importante",
  optional: "Opcional"
};

const decisionStatusLabels: Record<DecisionStatus, string> = {
  evaluating: "En evaluacion",
  planned: "Planificada",
  saving: "Ahorrando",
  approved: "Aprobada",
  postponed: "Pospuesta",
  rejected: "Descartada",
  completed: "Convertida",
  archived: "Archivada"
};

const decisionPaymentOptionTypeLabels: Record<DecisionPaymentOptionType, string> = {
  "one-time": "Pago unico",
  installments: "Cuotas",
  "save-first": "Ahorro previo",
  mixed: "Anticipo y cuotas",
  "use-reserve": "Usar reserva"
};

const decisionRecommendationLabels: Record<DecisionRecommendationCode, string> = {
  "buy-now": "Comprar ahora",
  "buy-next-income": "Comprar al proximo ingreso",
  "finance-carefully": "Financiar con precaucion",
  "save-first": "Ahorrar primero",
  "create-reserve": "Crear una reserva",
  "wait-next-month": "Esperar al proximo mes",
  postpone: "Posponer",
  "manual-review": "Requiere revision manual"
};

export function projectPriorityWeight(priority: ProjectPriority) {
  return projectPriorityOrder[priority];
}

export const priorityWeight = projectPriorityWeight;

export function taskPriorityWeight(priority: TaskPriority) {
  return taskPriorityOrder[priority];
}

export function formatTaskPriority(priority: TaskPriority) {
  return taskPriorityLabels[priority];
}

export function formatTaskStatus(status: TaskStatus) {
  return taskStatusLabels[status];
}

export function formatIncomeType(type: IncomeType) {
  return incomeTypeLabels[type];
}

export function formatIncomeStatus(status: IncomeStatus) {
  return incomeStatusLabels[status];
}

export function formatExpenseCategory(category: ExpenseCategory) {
  return expenseCategoryLabels[category];
}

export function formatPaymentMethod(method: PaymentMethod) {
  return paymentMethodLabels[method];
}

export function formatReservePriority(priority: ReservePriority) {
  return reservePriorityLabels[priority];
}

export function formatReserveStatus(status: ReserveStatus) {
  return reserveStatusLabels[status];
}

export function formatDecisionCategory(category: DecisionCategory) {
  return decisionCategoryLabels[category];
}

export function formatDecisionUrgency(urgency: DecisionUrgency) {
  return decisionUrgencyLabels[urgency];
}

export function formatDecisionImpact(impact: DecisionImpact) {
  return decisionImpactLabels[impact];
}

export function formatDecisionNecessity(necessity: DecisionNecessity) {
  return decisionNecessityLabels[necessity];
}

export function formatDecisionStatus(status: DecisionStatus) {
  return decisionStatusLabels[status];
}

export function formatDecisionPaymentOptionType(type: DecisionPaymentOptionType) {
  return decisionPaymentOptionTypeLabels[type];
}

export function formatDecisionRecommendation(code: DecisionRecommendationCode) {
  return decisionRecommendationLabels[code];
}
