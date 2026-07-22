export type ProjectCategory =
  | "Carrera IT"
  | "Entrenamiento"
  | "Finanzas"
  | "Auto"
  | "Muebles y proyectos DIY"
  | "Viajes"
  | "Personal";

export type ProjectStatus =
  | "Pendiente"
  | "En progreso"
  | "Bloqueado"
  | "Completado"
  | "Archivado";

export type ProjectPriority = "Baja" | "Media" | "Alta" | "Critica";

export type TaskStatus = "pending" | "in-progress" | "completed";
export type TaskPriority = "low" | "medium" | "high" | "critical";

export interface Task {
  id: string;
  title: string;
  description: string;
  projectId: string;
  sourceDecisionId: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  estimatedCost: number | null;
  isNextAction: boolean;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

export interface Project {
  id: string;
  name: string;
  category: ProjectCategory;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  targetDate: string | null;
  costEstimated: number | null;
  progress: number;
  nextAction: string;
  blockedReason: string;
  updatedAt: string;
  createdAt: string;
}

export type FinanceCurrency = "ARS";
export type IncomeStatus = "expected" | "received";
export type IncomeRecurrence = "monthly" | "one-time";
export type IncomeType =
  | "salary"
  | "allowance"
  | "bonus"
  | "refund"
  | "extra"
  | "other";

export type ExpenseStatus = "pending" | "paid";
export type ExpenseCategory =
  | "housing"
  | "transport"
  | "health"
  | "training"
  | "food"
  | "cards"
  | "loan"
  | "travel"
  | "shopping"
  | "projects"
  | "other";

export type PaymentMethod =
  | "cash"
  | "debit"
  | "bank-transfer"
  | "credit-card"
  | "other";

export type CommitmentFrequency = "monthly";
export type ArchiveState = "active" | "archived";
export type InstallmentPlanStatus = "active" | "completed" | "archived";
export type ReservePriority = "high" | "medium" | "low";
export type ReserveStatus = "active" | "completed" | "archived";
export type ConfirmedRecordDirection = "credit" | "debit";
export type ConfirmedRecordStatus = "active" | "reversed";
export type ConfirmedRecordSourceType =
  | "income"
  | "expense"
  | "installment"
  | "commitment-occurrence"
  | "manual-adjustment";
export type ManualAdjustmentReason =
  | "correction"
  | "cash-found"
  | "bank-difference"
  | "missing-expense"
  | "missing-income"
  | "opening-balance"
  | "other";
export type CommitmentOccurrenceStatus = "pending" | "paid" | "reversed";

export type DecisionCategory =
  | "safety"
  | "health"
  | "transport"
  | "housing"
  | "training"
  | "work"
  | "technology"
  | "travel"
  | "personal-project"
  | "comfort"
  | "maintenance"
  | "other";

export type DecisionUrgency = "low" | "medium" | "high" | "critical";
export type DecisionImpact = "low" | "medium" | "high";
export type DecisionNecessity = "essential" | "important" | "optional";
export type DecisionStatus =
  | "evaluating"
  | "planned"
  | "saving"
  | "approved"
  | "postponed"
  | "rejected"
  | "completed"
  | "archived";

export type DecisionPaymentOptionType =
  | "one-time"
  | "installments"
  | "save-first"
  | "mixed"
  | "use-reserve";

export type DecisionRecommendationCode =
  | "buy-now"
  | "buy-next-income"
  | "finance-carefully"
  | "save-first"
  | "create-reserve"
  | "wait-next-month"
  | "postpone"
  | "manual-review";

export interface FinanceSettings {
  currency: FinanceCurrency;
  currentBalance: number;
  minimumReserve: number;
  salaryPayday: number;
  allowancePayday: number;
}

export interface CreditCard {
  id: string;
  name: string;
  limit: number | null;
  closeDay: number;
  dueDay: number;
  state: ArchiveState;
  createdAt: string;
  updatedAt: string;
}

export interface Income {
  id: string;
  type: IncomeType;
  name: string;
  amount: number;
  expectedDate: string;
  receivedDate: string | null;
  status: IncomeStatus;
  recurrence: IncomeRecurrence | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  paidDate: string | null;
  status: ExpenseStatus;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  creditCardId: string | null;
  installmentPlanId: string | null;
  decisionId: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Commitment {
  id: string;
  name: string;
  amount: number;
  frequency: CommitmentFrequency;
  nextDueDate: string;
  startDate: string;
  endDate: string | null;
  totalInstallments: number | null;
  currentInstallment: number | null;
  state: ArchiveState;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface InstallmentPlan {
  id: string;
  description: string;
  creditCardId: string;
  totalAmount: number;
  totalInstallments: number;
  installmentAmount: number;
  firstDueDate: string;
  currentInstallment: number;
  decisionId: string | null;
  status: InstallmentPlanStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Reserve {
  id: string;
  name: string;
  targetAmount: number;
  savedAmount: number;
  targetDate: string | null;
  priority: ReservePriority;
  status: ReserveStatus;
  decisionId: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConfirmedFinancialRecord {
  id: string;
  sourceType: ConfirmedRecordSourceType;
  sourceId: string;
  direction: ConfirmedRecordDirection;
  amount: number;
  effectiveDate: string;
  description: string;
  createdAt: string;
  reversalOf: string | null;
  status: ConfirmedRecordStatus;
}

export interface CommitmentOccurrence {
  id: string;
  commitmentId: string;
  periodKey: string;
  dueDate: string;
  amount: number;
  status: CommitmentOccurrenceStatus;
  createdAt: string;
  updatedAt: string;
  paidDate: string | null;
  settledRecordId: string | null;
}

export interface ManualBalanceAdjustment {
  id: string;
  direction: ConfirmedRecordDirection;
  amount: number;
  effectiveDate: string;
  reason: ManualAdjustmentReason;
  note: string;
  createdAt: string;
  reversedAt: string | null;
  recordId: string | null;
}

export interface MonthlyClosure {
  id: string;
  periodKey: string;
  openingBalance: number;
  closingBalance: number;
  expectedIncomeRemaining: number;
  pendingPaymentsRemaining: number;
  reserveMoney: number;
  minimumReserve: number;
  availableToDecide: number;
  warnings: string[];
  createdAt: string;
}

export interface DecisionPaymentOption {
  id: string;
  type: DecisionPaymentOptionType;
  totalAmount: number;
  upfrontAmount: number | null;
  installmentCount: number | null;
  installmentAmount: number | null;
  interestAmount: number | null;
  firstDueDate: string | null;
  creditCardId: string | null;
  reserveId: string | null;
  notes: string;
}

export interface DecisionEvaluationMetrics {
  currentBalance: number;
  availableAfterPayments: number;
  availableToDecide: number;
  monthEndProjection: number;
  futureInstallmentDebt: number;
  activeReserveMoney: number;
  minimumReserve: number;
  pendingPayments: number;
  expectedIncomeInPeriod: number;
  totalAmount: number;
  upfrontAmount: number;
  monthlyInstallmentAmount: number;
  installmentCount: number;
  totalInstallmentExposure: number;
  desiredMonthsUntilTarget: number | null;
  monthlySavingsNeeded: number | null;
  projectedReserveAfterUse: number | null;
}

export interface DecisionPriorityBreakdown {
  urgency: number;
  impact: number;
  necessity: number;
  category: number;
  date: number;
  project: number;
  blocking: number;
  viability: number;
}

export interface DecisionEvaluation {
  recommendationCode: DecisionRecommendationCode;
  title: string;
  explanation: string;
  reasons: string[];
  warnings: string[];
  metrics: DecisionEvaluationMetrics;
  confidence: number;
  confidenceLabel: string;
  priorityScore: number;
  priorityBreakdown: DecisionPriorityBreakdown;
  feasibleFromDate: string | null;
}

export interface DecisionStatusHistoryEntry {
  id: string;
  status: DecisionStatus;
  changedAt: string;
  note: string;
}

export interface DecisionConvertedEntity {
  kind: "expense" | "installment-plan" | "reserve" | "mixed";
  expenseId: string | null;
  installmentPlanId: string | null;
  reserveId: string | null;
  createdAt: string;
}

export interface DecisionItem {
  id: string;
  name: string;
  description: string;
  category: DecisionCategory;
  projectId: string | null;
  totalAmount: number;
  desiredDate: string | null;
  urgency: DecisionUrgency;
  impact: DecisionImpact;
  necessity: DecisionNecessity;
  paymentOptions: DecisionPaymentOption[];
  selectedPaymentOptionId: string | null;
  status: DecisionStatus;
  recommendation: DecisionRecommendationCode | null;
  recommendationReasons: string[];
  evaluation: DecisionEvaluation | null;
  createdAt: string;
  updatedAt: string;
  resolvedAt: string | null;
  convertedEntity: DecisionConvertedEntity | null;
  statusHistory: DecisionStatusHistoryEntry[];
}

export interface DecisionComparison {
  id: string;
  decisionIds: string[];
  createdAt: string;
}

export interface DecisionRulesConfig {
  minimumPostPurchaseMargin: number;
  maxNewInstallmentIncomeRatio: number;
  maxFutureInstallmentDebt: number;
  longFinancingMonths: number;
  safetyHealthPriorityBoost: number;
}

export interface DecisionsState {
  items: DecisionItem[];
  comparisons: DecisionComparison[];
  rulesConfig: DecisionRulesConfig;
}

export interface FinanceState {
  settings: FinanceSettings;
  creditCards: CreditCard[];
  incomes: Income[];
  expenses: Expense[];
  commitments: Commitment[];
  installmentPlans: InstallmentPlan[];
  reserves: Reserve[];
  confirmedRecords: ConfirmedFinancialRecord[];
  commitmentOccurrences: CommitmentOccurrence[];
  manualAdjustments: ManualBalanceAdjustment[];
  monthlyClosures: MonthlyClosure[];
}

export interface PlanningStore {
  projects: Project[];
  tasks: Task[];
  finance: FinanceState;
  decisions: DecisionsState;
}

export interface DecisionPaymentOptionFormValues {
  id?: string;
  type: DecisionPaymentOptionType;
  totalAmount: string;
  upfrontAmount: string;
  installmentCount: string;
  installmentAmount: string;
  interestAmount: string;
  firstDueDate: string;
  creditCardId: string;
  reserveId: string;
  notes: string;
}

export interface DecisionFormValues {
  name: string;
  description: string;
  category: DecisionCategory;
  projectId: string;
  totalAmount: string;
  desiredDate: string;
  urgency: DecisionUrgency;
  impact: DecisionImpact;
  necessity: DecisionNecessity;
  status: DecisionStatus;
  selectedPaymentOptionId: string;
  paymentOptions: DecisionPaymentOptionFormValues[];
}

export interface DecisionRulesConfigFormValues {
  minimumPostPurchaseMargin: string;
  maxNewInstallmentIncomeRatio: string;
  maxFutureInstallmentDebt: string;
  longFinancingMonths: string;
  safetyHealthPriorityBoost: string;
}

export interface ProjectFormValues {
  name: string;
  category: ProjectCategory;
  description: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  targetDate: string;
  costEstimated: string;
  progress: number;
  nextAction: string;
  blockedReason: string;
}

export interface TaskFormValues {
  title: string;
  description: string;
  projectId: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  estimatedCost: string;
  isNextAction: boolean;
}

export interface FinanceSettingsFormValues {
  currency: FinanceCurrency;
  currentBalance: string;
  minimumReserve: string;
  salaryPayday: string;
  allowancePayday: string;
}

export interface CreditCardFormValues {
  name: string;
  limit: string;
  closeDay: string;
  dueDay: string;
  state: ArchiveState;
}

export interface IncomeFormValues {
  type: IncomeType;
  name: string;
  amount: string;
  expectedDate: string;
  receivedDate: string;
  status: IncomeStatus;
  recurrence: IncomeRecurrence | "";
  notes: string;
}

export interface ExpenseFormValues {
  name: string;
  amount: string;
  dueDate: string;
  paidDate: string;
  status: ExpenseStatus;
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  creditCardId: string;
  installmentPlanId: string;
  notes: string;
}

export interface CommitmentFormValues {
  name: string;
  amount: string;
  frequency: CommitmentFrequency;
  nextDueDate: string;
  startDate: string;
  endDate: string;
  totalInstallments: string;
  currentInstallment: string;
  state: ArchiveState;
  notes: string;
}

export interface InstallmentPlanFormValues {
  description: string;
  creditCardId: string;
  totalAmount: string;
  totalInstallments: string;
  installmentAmount: string;
  firstDueDate: string;
  currentInstallment: string;
  status: InstallmentPlanStatus;
}

export interface ReserveFormValues {
  name: string;
  targetAmount: string;
  savedAmount: string;
  targetDate: string;
  priority: ReservePriority;
  status: ReserveStatus;
  notes: string;
}

export interface SettlementFormValues {
  effectiveDate: string;
  effectiveAmount: string;
}

export interface ManualAdjustmentFormValues {
  amount: string;
  direction: ConfirmedRecordDirection;
  effectiveDate: string;
  reason: ManualAdjustmentReason;
  note: string;
}

export interface ProjectFilters {
  search: string;
  category: ProjectCategory | "Todas";
  priority: ProjectPriority | "Todas";
  status: ProjectStatus | "Todas";
  sortBy: "updatedAt" | "targetDate" | "priority" | "name" | "progress";
}

export interface WeekFilters {
  projectId: string;
  category: ProjectCategory | "Todas";
  priority: TaskPriority | "all";
  showCompleted: boolean;
}

export interface DashboardPriorityItem {
  id: string;
  title: string;
  subtitle: string;
  dueLabel: string;
  priority: TaskPriority;
  projectId: string;
}

export interface DashboardAlert {
  id: string;
  title: string;
  description: string;
  severity: "danger" | "warning" | "info";
}
