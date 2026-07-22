import {
  createDefaultDecisionsState,
  createDefaultFinanceState,
  seedStore
} from "../../data/mock/seed";
import { syncProjectsProgress } from "../../features/tasks/taskDerivations";
import {
  Commitment,
  CommitmentOccurrence,
  ConfirmedFinancialRecord,
  CreditCard,
  DecisionComparison,
  DecisionItem,
  DecisionPaymentOption,
  DecisionRulesConfig,
  DecisionsState,
  Expense,
  FinanceSettings,
  FinanceState,
  Income,
  InstallmentPlan,
  ManualBalanceAdjustment,
  MonthlyClosure,
  PlanningStore,
  Project,
  Reserve,
  Task,
  TaskPriority,
  TaskStatus
} from "../../types/domain";

const STORAGE_KEY = "morga-planning-store-v6";
const LEGACY_STORAGE_KEYS = [
  STORAGE_KEY,
  "morga-planning-store-v5",
  "morga-planning-store-v4",
  "morga-planning-store-v3",
  "morga-planning-store-v2",
  "morga-planning-store-v1"
];
export const PLANNING_SCHEMA_VERSION = 6;

interface PlanningBackupFile {
  schemaVersion: number;
  exportedAt: string;
  data: PlanningStore;
}

interface PlanningBackupSummary {
  projects: number;
  archivedProjects: number;
  tasks: number;
  completedTasks: number;
  incomes: number;
  expenses: number;
  commitments: number;
  creditCards: number;
  installmentPlans: number;
  reserves: number;
  confirmedRecords: number;
  commitmentOccurrences: number;
  manualAdjustments: number;
  monthlyClosures: number;
  decisions: number;
  archivedDecisions: number;
  approvedDecisions: number;
}

type LegacySettings = {
  currentBalance?: unknown;
  reservedCash?: unknown;
  minimumReserve?: unknown;
  cardCloseDate?: unknown;
};

function canUseStorage() {
  return typeof window !== "undefined" && "localStorage" in window;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function toNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toNullableNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function toDateString(value: unknown, fallback: string | null = null) {
  return typeof value === "string" && value ? value : fallback;
}

function buildBackupSummary(store: PlanningStore): PlanningBackupSummary {
  return {
    projects: store.projects.length,
    archivedProjects: store.projects.filter((project) => project.status === "Archivado").length,
    tasks: store.tasks.length,
    completedTasks: store.tasks.filter((task) => task.status === "completed").length,
    incomes: store.finance.incomes.length,
    expenses: store.finance.expenses.length,
    commitments: store.finance.commitments.length,
    creditCards: store.finance.creditCards.length,
    installmentPlans: store.finance.installmentPlans.length,
    reserves: store.finance.reserves.length,
    confirmedRecords: store.finance.confirmedRecords.length,
    commitmentOccurrences: store.finance.commitmentOccurrences.length,
    manualAdjustments: store.finance.manualAdjustments.length,
    monthlyClosures: store.finance.monthlyClosures.length,
    decisions: store.decisions.items.length,
    archivedDecisions: store.decisions.items.filter((item) => item.status === "archived").length,
    approvedDecisions: store.decisions.items.filter((item) => item.status === "approved").length
  };
}

function normalizeTaskStatus(status: unknown): TaskStatus {
  switch (status) {
    case "completed":
    case "Completada":
      return "completed";
    case "in-progress":
    case "En progreso":
      return "in-progress";
    default:
      return "pending";
  }
}

function normalizeTaskPriority(priority: unknown): TaskPriority {
  switch (priority) {
    case "critical":
    case "Critica":
    case "Crítica":
    case "Alta critica":
      return "critical";
    case "high":
    case "Alta":
      return "high";
    case "low":
    case "Baja":
      return "low";
    default:
      return "medium";
  }
}

function normalizeProjectPriority(priority: unknown): Project["priority"] {
  switch (priority) {
    case "Critica":
    case "Crítica":
      return "Critica";
    case "Alta":
      return "Alta";
    case "Baja":
      return "Baja";
    default:
      return "Media";
  }
}

function migrateTask(rawTask: Record<string, unknown>): Task {
  const status = normalizeTaskStatus(rawTask.status);

  return {
    id: String(rawTask.id ?? crypto.randomUUID()),
    title: String(rawTask.title ?? ""),
    description: String(rawTask.description ?? ""),
    projectId: String(rawTask.projectId ?? ""),
    sourceDecisionId: toDateString(rawTask.sourceDecisionId),
    priority: normalizeTaskPriority(rawTask.priority),
    status,
    dueDate: toDateString(rawTask.dueDate),
    estimatedCost:
      typeof rawTask.estimatedCost === "number"
        ? rawTask.estimatedCost
        : typeof rawTask.cost === "number"
          ? rawTask.cost
          : null,
    isNextAction: Boolean(rawTask.isNextAction),
    createdAt: toDateString(rawTask.createdAt, new Date().toISOString())!,
    updatedAt: toDateString(rawTask.updatedAt, new Date().toISOString())!,
    completedAt:
      status === "completed"
        ? toDateString(
            rawTask.completedAt,
            toDateString(rawTask.updatedAt, new Date().toISOString())
          )
        : null
  };
}

function migrateProject(rawProject: Record<string, unknown>): Project {
  const now = new Date().toISOString();

  return {
    id: String(rawProject.id ?? crypto.randomUUID()),
    name: String(rawProject.name ?? ""),
    category: (rawProject.category as Project["category"]) ?? "Personal",
    description: String(rawProject.description ?? ""),
    status: (rawProject.status as Project["status"]) ?? "Pendiente",
    priority: normalizeProjectPriority(rawProject.priority),
    targetDate: toDateString(rawProject.targetDate),
    costEstimated: toNullableNumber(rawProject.costEstimated),
    progress:
      typeof rawProject.progress === "number" && Number.isFinite(rawProject.progress)
        ? rawProject.progress
        : 0,
    nextAction: String(rawProject.nextAction ?? ""),
    blockedReason: String(rawProject.blockedReason ?? ""),
    updatedAt: toDateString(rawProject.updatedAt, now)!,
    createdAt: toDateString(rawProject.createdAt, now)!
  };
}

function migrateLegacyFinanceSettings(rawSettings: LegacySettings | undefined): FinanceSettings {
  return {
    currency: "ARS",
    currentBalance: toNumber(rawSettings?.currentBalance, 0),
    minimumReserve: toNumber(rawSettings?.minimumReserve, 0),
    salaryPayday: 5,
    allowancePayday: 20
  };
}

function migrateFinanceSettings(rawSettings: Record<string, unknown> | undefined): FinanceSettings {
  if (!rawSettings) {
    return createDefaultFinanceState().settings;
  }

  return {
    currency: "ARS",
    currentBalance: toNumber(rawSettings.currentBalance, 0),
    minimumReserve: toNumber(rawSettings.minimumReserve, 0),
    salaryPayday: toNumber(rawSettings.salaryPayday, 5),
    allowancePayday: toNumber(rawSettings.allowancePayday, 20)
  };
}

function migrateCreditCard(rawCard: Record<string, unknown>): CreditCard {
  const now = new Date().toISOString();

  return {
    id: String(rawCard.id ?? crypto.randomUUID()),
    name: String(rawCard.name ?? "Tarjeta"),
    limit: toNullableNumber(rawCard.limit),
    closeDay: toNumber(rawCard.closeDay, 1),
    dueDay: toNumber(rawCard.dueDay, 1),
    state: rawCard.state === "archived" ? "archived" : "active",
    createdAt: toDateString(rawCard.createdAt, now)!,
    updatedAt: toDateString(rawCard.updatedAt, now)!
  };
}

function migrateIncome(rawIncome: Record<string, unknown>): Income {
  const now = new Date().toISOString();
  const status = rawIncome.status === "received" ? "received" : "expected";

  return {
    id: String(rawIncome.id ?? crypto.randomUUID()),
    type: (rawIncome.type as Income["type"]) ?? "other",
    name: String(rawIncome.name ?? ""),
    amount: toNumber(rawIncome.amount, 0),
    expectedDate: toDateString(rawIncome.expectedDate, new Date().toISOString().slice(0, 10))!,
    receivedDate: toDateString(rawIncome.receivedDate),
    status,
    recurrence:
      rawIncome.recurrence === "monthly" || rawIncome.recurrence === "one-time"
        ? rawIncome.recurrence
        : null,
    notes: String(rawIncome.notes ?? ""),
    createdAt: toDateString(rawIncome.createdAt, now)!,
    updatedAt: toDateString(rawIncome.updatedAt, now)!
  };
}

function migrateExpense(rawExpense: Record<string, unknown>): Expense {
  const now = new Date().toISOString();

  return {
    id: String(rawExpense.id ?? crypto.randomUUID()),
    name: String(rawExpense.name ?? ""),
    amount: toNumber(rawExpense.amount, 0),
    dueDate: toDateString(rawExpense.dueDate, new Date().toISOString().slice(0, 10))!,
    paidDate: toDateString(rawExpense.paidDate),
    status: rawExpense.status === "paid" ? "paid" : "pending",
    category: (rawExpense.category as Expense["category"]) ?? "other",
    paymentMethod: (rawExpense.paymentMethod as Expense["paymentMethod"]) ?? "other",
    creditCardId: toDateString(rawExpense.creditCardId),
    installmentPlanId: toDateString(rawExpense.installmentPlanId),
    decisionId: toDateString(rawExpense.decisionId),
    notes: String(rawExpense.notes ?? ""),
    createdAt: toDateString(rawExpense.createdAt, now)!,
    updatedAt: toDateString(rawExpense.updatedAt, now)!
  };
}

function migrateCommitment(rawCommitment: Record<string, unknown>): Commitment {
  const now = new Date().toISOString();

  return {
    id: String(rawCommitment.id ?? crypto.randomUUID()),
    name: String(rawCommitment.name ?? ""),
    amount: toNumber(rawCommitment.amount, 0),
    frequency: "monthly",
    nextDueDate: toDateString(rawCommitment.nextDueDate, new Date().toISOString().slice(0, 10))!,
    startDate: toDateString(rawCommitment.startDate, new Date().toISOString().slice(0, 10))!,
    endDate: toDateString(rawCommitment.endDate),
    totalInstallments: toNullableNumber(rawCommitment.totalInstallments),
    currentInstallment: toNullableNumber(rawCommitment.currentInstallment),
    state: rawCommitment.state === "archived" ? "archived" : "active",
    notes: String(rawCommitment.notes ?? ""),
    createdAt: toDateString(rawCommitment.createdAt, now)!,
    updatedAt: toDateString(rawCommitment.updatedAt, now)!
  };
}

function migrateInstallmentPlan(rawPlan: Record<string, unknown>): InstallmentPlan {
  const now = new Date().toISOString();
  const totalInstallments = Math.max(toNumber(rawPlan.totalInstallments, 1), 1);
  const currentInstallment = Math.min(
    Math.max(toNumber(rawPlan.currentInstallment, 1), 1),
    totalInstallments
  );

  return {
    id: String(rawPlan.id ?? crypto.randomUUID()),
    description: String(rawPlan.description ?? ""),
    creditCardId: String(rawPlan.creditCardId ?? ""),
    totalAmount: toNumber(rawPlan.totalAmount, 0),
    totalInstallments,
    installmentAmount: toNumber(rawPlan.installmentAmount, 0),
    firstDueDate: toDateString(rawPlan.firstDueDate, new Date().toISOString().slice(0, 10))!,
    currentInstallment,
    decisionId: toDateString(rawPlan.decisionId),
    status:
      rawPlan.status === "completed" || rawPlan.status === "archived"
        ? rawPlan.status
        : "active",
    createdAt: toDateString(rawPlan.createdAt, now)!,
    updatedAt: toDateString(rawPlan.updatedAt, now)!
  };
}

function migrateReserve(rawReserve: Record<string, unknown>): Reserve {
  const now = new Date().toISOString();

  return {
    id: String(rawReserve.id ?? crypto.randomUUID()),
    name: String(rawReserve.name ?? ""),
    targetAmount: toNumber(rawReserve.targetAmount, 0),
    savedAmount: toNumber(rawReserve.savedAmount, 0),
    targetDate: toDateString(rawReserve.targetDate),
    priority:
      rawReserve.priority === "high" || rawReserve.priority === "low"
        ? rawReserve.priority
        : "medium",
    status:
      rawReserve.status === "completed" || rawReserve.status === "archived"
        ? rawReserve.status
        : "active",
    decisionId: toDateString(rawReserve.decisionId),
    notes: String(rawReserve.notes ?? ""),
    createdAt: toDateString(rawReserve.createdAt, now)!,
    updatedAt: toDateString(rawReserve.updatedAt, now)!
  };
}

function migrateConfirmedRecord(rawRecord: Record<string, unknown>): ConfirmedFinancialRecord {
  const now = new Date().toISOString();
  return {
    id: String(rawRecord.id ?? crypto.randomUUID()),
    sourceType:
      (rawRecord.sourceType as ConfirmedFinancialRecord["sourceType"]) ?? "manual-adjustment",
    sourceId: String(rawRecord.sourceId ?? ""),
    direction: rawRecord.direction === "credit" ? "credit" : "debit",
    amount: toNumber(rawRecord.amount, 0),
    effectiveDate: toDateString(rawRecord.effectiveDate, new Date().toISOString().slice(0, 10))!,
    description: String(rawRecord.description ?? ""),
    createdAt: toDateString(rawRecord.createdAt, now)!,
    reversalOf: toDateString(rawRecord.reversalOf),
    status: rawRecord.status === "reversed" ? "reversed" : "active"
  };
}

function migrateCommitmentOccurrence(rawOccurrence: Record<string, unknown>): CommitmentOccurrence {
  const now = new Date().toISOString();
  return {
    id: String(rawOccurrence.id ?? crypto.randomUUID()),
    commitmentId: String(rawOccurrence.commitmentId ?? ""),
    periodKey: String(rawOccurrence.periodKey ?? ""),
    dueDate: toDateString(rawOccurrence.dueDate, new Date().toISOString().slice(0, 10))!,
    amount: toNumber(rawOccurrence.amount, 0),
    status:
      rawOccurrence.status === "paid" || rawOccurrence.status === "reversed"
        ? rawOccurrence.status
        : "pending",
    createdAt: toDateString(rawOccurrence.createdAt, now)!,
    updatedAt: toDateString(rawOccurrence.updatedAt, now)!,
    paidDate: toDateString(rawOccurrence.paidDate),
    settledRecordId: toDateString(rawOccurrence.settledRecordId)
  };
}

function migrateManualAdjustment(rawAdjustment: Record<string, unknown>): ManualBalanceAdjustment {
  const now = new Date().toISOString();
  return {
    id: String(rawAdjustment.id ?? crypto.randomUUID()),
    direction: rawAdjustment.direction === "credit" ? "credit" : "debit",
    amount: toNumber(rawAdjustment.amount, 0),
    effectiveDate: toDateString(
      rawAdjustment.effectiveDate,
      new Date().toISOString().slice(0, 10)
    )!,
    reason: (rawAdjustment.reason as ManualBalanceAdjustment["reason"]) ?? "other",
    note: String(rawAdjustment.note ?? ""),
    createdAt: toDateString(rawAdjustment.createdAt, now)!,
    reversedAt: toDateString(rawAdjustment.reversedAt),
    recordId: toDateString(rawAdjustment.recordId)
  };
}

function migrateMonthlyClosure(rawClosure: Record<string, unknown>): MonthlyClosure {
  const now = new Date().toISOString();
  return {
    id: String(rawClosure.id ?? crypto.randomUUID()),
    periodKey: String(rawClosure.periodKey ?? ""),
    openingBalance: toNumber(rawClosure.openingBalance, 0),
    closingBalance: toNumber(rawClosure.closingBalance, 0),
    expectedIncomeRemaining: toNumber(rawClosure.expectedIncomeRemaining, 0),
    pendingPaymentsRemaining: toNumber(rawClosure.pendingPaymentsRemaining, 0),
    reserveMoney: toNumber(rawClosure.reserveMoney, 0),
    minimumReserve: toNumber(rawClosure.minimumReserve, 0),
    availableToDecide: toNumber(rawClosure.availableToDecide, 0),
    warnings: Array.isArray(rawClosure.warnings) ? rawClosure.warnings.map(String) : [],
    createdAt: toDateString(rawClosure.createdAt, now)!
  };
}

function migrateDecisionPaymentOption(rawOption: Record<string, unknown>): DecisionPaymentOption {
  return {
    id: String(rawOption.id ?? crypto.randomUUID()),
    type: (rawOption.type as DecisionPaymentOption["type"]) ?? "one-time",
    totalAmount: toNumber(rawOption.totalAmount, 0),
    upfrontAmount: toNullableNumber(rawOption.upfrontAmount),
    installmentCount: toNullableNumber(rawOption.installmentCount),
    installmentAmount: toNullableNumber(rawOption.installmentAmount),
    interestAmount: toNullableNumber(rawOption.interestAmount),
    firstDueDate: toDateString(rawOption.firstDueDate),
    creditCardId: toDateString(rawOption.creditCardId),
    reserveId: toDateString(rawOption.reserveId),
    notes: String(rawOption.notes ?? "")
  };
}

function migrateDecisionItem(rawDecision: Record<string, unknown>): DecisionItem {
  const now = new Date().toISOString();
  const defaults = createDefaultDecisionsState().items[0];
  const convertedEntity = isRecord(rawDecision.convertedEntity) ? rawDecision.convertedEntity : null;
  return {
    id: String(rawDecision.id ?? crypto.randomUUID()),
    name: String(rawDecision.name ?? ""),
    description: String(rawDecision.description ?? ""),
    category: (rawDecision.category as DecisionItem["category"]) ?? defaults.category,
    projectId: toDateString(rawDecision.projectId),
    totalAmount: toNumber(rawDecision.totalAmount, 0),
    desiredDate: toDateString(rawDecision.desiredDate),
    urgency: (rawDecision.urgency as DecisionItem["urgency"]) ?? "medium",
    impact: (rawDecision.impact as DecisionItem["impact"]) ?? "medium",
    necessity: (rawDecision.necessity as DecisionItem["necessity"]) ?? "important",
    paymentOptions: Array.isArray(rawDecision.paymentOptions)
      ? rawDecision.paymentOptions.map((item) =>
          migrateDecisionPaymentOption(item as Record<string, unknown>)
        )
      : [],
    selectedPaymentOptionId: toDateString(rawDecision.selectedPaymentOptionId),
    status: (rawDecision.status as DecisionItem["status"]) ?? "evaluating",
    recommendation: (rawDecision.recommendation as DecisionItem["recommendation"]) ?? null,
    recommendationReasons: Array.isArray(rawDecision.recommendationReasons)
      ? rawDecision.recommendationReasons.map(String)
      : [],
    evaluation: isRecord(rawDecision.evaluation)
      ? (rawDecision.evaluation as unknown as DecisionItem["evaluation"])
      : null,
    createdAt: toDateString(rawDecision.createdAt, now)!,
    updatedAt: toDateString(rawDecision.updatedAt, now)!,
    resolvedAt: toDateString(rawDecision.resolvedAt),
    convertedEntity: convertedEntity
      ? {
          kind:
            (convertedEntity.kind as NonNullable<DecisionItem["convertedEntity"]>["kind"]) ??
            "expense",
          expenseId: toDateString(convertedEntity.expenseId),
          installmentPlanId: toDateString(convertedEntity.installmentPlanId),
          reserveId: toDateString(convertedEntity.reserveId),
          createdAt: toDateString(convertedEntity.createdAt, now)!
        }
      : null,
    statusHistory: Array.isArray(rawDecision.statusHistory)
      ? rawDecision.statusHistory.map((entry) => ({
          id: String((entry as Record<string, unknown>).id ?? crypto.randomUUID()),
          status:
            (((entry as Record<string, unknown>).status as DecisionItem["statusHistory"][number]["status"]) ??
              "evaluating"),
          changedAt: toDateString((entry as Record<string, unknown>).changedAt, now)!,
          note: String((entry as Record<string, unknown>).note ?? "")
        }))
      : [
          {
            id: crypto.randomUUID(),
            status: (rawDecision.status as DecisionItem["status"]) ?? "evaluating",
            changedAt: toDateString(rawDecision.createdAt, now)!,
            note: "Decision migrada."
          }
        ]
  };
}

function migrateDecisionComparison(rawComparison: Record<string, unknown>): DecisionComparison {
  return {
    id: String(rawComparison.id ?? crypto.randomUUID()),
    decisionIds: Array.isArray(rawComparison.decisionIds)
      ? rawComparison.decisionIds.map(String).slice(0, 4)
      : [],
    createdAt: toDateString(rawComparison.createdAt, new Date().toISOString())!
  };
}

function migrateRulesConfig(rawConfig: Record<string, unknown> | undefined): DecisionRulesConfig {
  const defaults = createDefaultDecisionsState().rulesConfig;
  if (!rawConfig) return defaults;
  return {
    minimumPostPurchaseMargin: toNumber(
      rawConfig.minimumPostPurchaseMargin,
      defaults.minimumPostPurchaseMargin
    ),
    maxNewInstallmentIncomeRatio: toNumber(
      rawConfig.maxNewInstallmentIncomeRatio,
      defaults.maxNewInstallmentIncomeRatio
    ),
    maxFutureInstallmentDebt: toNumber(
      rawConfig.maxFutureInstallmentDebt,
      defaults.maxFutureInstallmentDebt
    ),
    longFinancingMonths: toNumber(rawConfig.longFinancingMonths, defaults.longFinancingMonths),
    safetyHealthPriorityBoost: toNumber(
      rawConfig.safetyHealthPriorityBoost,
      defaults.safetyHealthPriorityBoost
    )
  };
}

function normalizeTaskSet(tasks: Task[]) {
  const nextByProject = new Set<string>();

  return tasks.map((task) => {
    if (task.status === "completed") {
      return task.isNextAction ? { ...task, isNextAction: false } : task;
    }

    if (!task.isNextAction) return task;
    if (nextByProject.has(task.projectId)) return { ...task, isNextAction: false };

    nextByProject.add(task.projectId);
    return task;
  });
}

function normalizeFinanceState(finance: FinanceState) {
  return {
    ...finance,
    installmentPlans: finance.installmentPlans.map((plan) => {
      if (plan.currentInstallment > plan.totalInstallments && plan.status !== "archived") {
        return { ...plan, status: "completed" as const };
      }

      if (plan.currentInstallment === plan.totalInstallments && plan.status === "completed") {
        return plan;
      }

      return plan;
    }),
    reserves: finance.reserves.map((reserve) => {
      if (
        reserve.status === "active" &&
        reserve.savedAmount >= reserve.targetAmount &&
        reserve.targetAmount > 0
      ) {
        return { ...reserve, status: "completed" as const };
      }
      return reserve;
    })
  };
}

function normalizeDecisionsState(decisions: DecisionsState): DecisionsState {
  const itemIds = new Set(decisions.items.map((item) => item.id));
  return {
    ...decisions,
    comparisons: decisions.comparisons.filter(
      (comparison) =>
        comparison.decisionIds.length >= 2 &&
        comparison.decisionIds.every((decisionId) => itemIds.has(decisionId))
    )
  };
}

function createMigratedDefaultFinance(rawSettings: LegacySettings | undefined) {
  return createDefaultFinanceState({
    ...migrateLegacyFinanceSettings(rawSettings),
    reservedCash: toNumber(rawSettings?.reservedCash, 0),
    cardCloseDate:
      typeof rawSettings?.cardCloseDate === "string" ? rawSettings.cardCloseDate : undefined
  });
}

function migrateFinanceState(
  rawFinance: Record<string, unknown> | undefined,
  legacySettings: LegacySettings | undefined
): FinanceState {
  if (!rawFinance) {
    return createMigratedDefaultFinance(legacySettings);
  }

  const fallback = createMigratedDefaultFinance(legacySettings);

  return normalizeFinanceState({
    settings: migrateFinanceSettings(rawFinance.settings as Record<string, unknown> | undefined),
    creditCards: Array.isArray(rawFinance.creditCards)
      ? rawFinance.creditCards.map((item) => migrateCreditCard(item as Record<string, unknown>))
      : fallback.creditCards,
    incomes: Array.isArray(rawFinance.incomes)
      ? rawFinance.incomes.map((item) => migrateIncome(item as Record<string, unknown>))
      : fallback.incomes,
    expenses: Array.isArray(rawFinance.expenses)
      ? rawFinance.expenses.map((item) => migrateExpense(item as Record<string, unknown>))
      : fallback.expenses,
    commitments: Array.isArray(rawFinance.commitments)
      ? rawFinance.commitments.map((item) => migrateCommitment(item as Record<string, unknown>))
      : fallback.commitments,
    installmentPlans: Array.isArray(rawFinance.installmentPlans)
      ? rawFinance.installmentPlans.map((item) =>
          migrateInstallmentPlan(item as Record<string, unknown>)
        )
      : fallback.installmentPlans,
    reserves: Array.isArray(rawFinance.reserves)
      ? rawFinance.reserves.map((item) => migrateReserve(item as Record<string, unknown>))
      : fallback.reserves,
    confirmedRecords: Array.isArray(rawFinance.confirmedRecords)
      ? rawFinance.confirmedRecords.map((item) =>
          migrateConfirmedRecord(item as Record<string, unknown>)
        )
      : [],
    commitmentOccurrences: Array.isArray(rawFinance.commitmentOccurrences)
      ? rawFinance.commitmentOccurrences.map((item) =>
          migrateCommitmentOccurrence(item as Record<string, unknown>)
        )
      : [],
    manualAdjustments: Array.isArray(rawFinance.manualAdjustments)
      ? rawFinance.manualAdjustments.map((item) =>
          migrateManualAdjustment(item as Record<string, unknown>)
        )
      : [],
    monthlyClosures: Array.isArray(rawFinance.monthlyClosures)
      ? rawFinance.monthlyClosures.map((item) =>
          migrateMonthlyClosure(item as Record<string, unknown>)
        )
      : []
  });
}

function migrateDecisionsState(rawDecisions: Record<string, unknown> | undefined): DecisionsState {
  if (!rawDecisions) {
    return createDefaultDecisionsState();
  }

  return normalizeDecisionsState({
    items: Array.isArray(rawDecisions.items)
      ? rawDecisions.items.map((item) => migrateDecisionItem(item as Record<string, unknown>))
      : createDefaultDecisionsState().items,
    comparisons: Array.isArray(rawDecisions.comparisons)
      ? rawDecisions.comparisons.map((item) =>
          migrateDecisionComparison(item as Record<string, unknown>)
        )
      : [],
    rulesConfig: migrateRulesConfig(rawDecisions.rulesConfig as Record<string, unknown> | undefined)
  });
}

function validateProjectShape(project: unknown) {
  if (!isRecord(project)) throw new Error("Hay un proyecto con formato invalido.");
  if (typeof project.id !== "string" || typeof project.name !== "string") {
    throw new Error("Cada proyecto debe incluir id y nombre.");
  }
}

function validateTaskShape(task: unknown) {
  if (!isRecord(task)) throw new Error("Hay una tarea con formato invalido.");
  if (
    typeof task.id !== "string" ||
    typeof task.title !== "string" ||
    typeof task.projectId !== "string"
  ) {
    throw new Error("Cada tarea debe incluir id, titulo y proyecto asociado.");
  }
}

function extractStoreCandidate(rawStore: unknown) {
  if (!isRecord(rawStore)) {
    throw new Error("El archivo no contiene un objeto valido.");
  }

  const hasWrappedData =
    "data" in rawStore && "schemaVersion" in rawStore && isRecord(rawStore.data);
  const candidate = hasWrappedData ? rawStore.data : rawStore;

  if (!isRecord(candidate)) {
    throw new Error("No encontramos datos importables dentro del archivo.");
  }

  if (!Array.isArray(candidate.projects) || !Array.isArray(candidate.tasks)) {
    throw new Error("El respaldo debe incluir proyectos y tareas.");
  }

  candidate.projects.forEach(validateProjectShape);
  candidate.tasks.forEach(validateTaskShape);

  return {
    candidate,
    schemaVersion:
      hasWrappedData && typeof rawStore.schemaVersion === "number"
        ? rawStore.schemaVersion
        : 1,
    exportedAt:
      hasWrappedData && typeof rawStore.exportedAt === "string" ? rawStore.exportedAt : null
  };
}

function validateRelationships(store: PlanningStore) {
  const projectIds = new Set(store.projects.map((project) => project.id));
  const cardIds = new Set(store.finance.creditCards.map((card) => card.id));
  const planIds = new Set(store.finance.installmentPlans.map((plan) => plan.id));
  const commitmentIds = new Set(store.finance.commitments.map((commitment) => commitment.id));
  const reserveIds = new Set(store.finance.reserves.map((reserve) => reserve.id));
  const recordIds = new Set(store.finance.confirmedRecords.map((record) => record.id));
  const decisionIds = new Set(store.decisions.items.map((decision) => decision.id));

  const orphanTask = store.tasks.find((task) => !projectIds.has(task.projectId));
  if (orphanTask) {
    throw new Error("El respaldo contiene tareas apuntando a proyectos inexistentes.");
  }

  const invalidTaskDecision = store.tasks.find(
    (task) => task.sourceDecisionId && !decisionIds.has(task.sourceDecisionId)
  );
  if (invalidTaskDecision) {
    throw new Error("Hay tareas con referencias invalidas a decisiones.");
  }

  const invalidExpenseCard = store.finance.expenses.find(
    (expense) => expense.creditCardId && !cardIds.has(expense.creditCardId)
  );
  if (invalidExpenseCard) {
    throw new Error("Hay gastos con referencias invalidas a tarjetas.");
  }

  const invalidExpensePlan = store.finance.expenses.find(
    (expense) => expense.installmentPlanId && !planIds.has(expense.installmentPlanId)
  );
  if (invalidExpensePlan) {
    throw new Error("Hay gastos con referencias invalidas a planes de cuotas.");
  }

  const invalidExpenseDecision = store.finance.expenses.find(
    (expense) => expense.decisionId && !decisionIds.has(expense.decisionId)
  );
  if (invalidExpenseDecision) {
    throw new Error("Hay gastos con decisiones inexistentes.");
  }

  const invalidPlanCard = store.finance.installmentPlans.find(
    (plan) => !cardIds.has(plan.creditCardId)
  );
  if (invalidPlanCard) {
    throw new Error("Hay planes de cuotas con tarjetas inexistentes.");
  }

  const invalidPlanDecision = store.finance.installmentPlans.find(
    (plan) => plan.decisionId && !decisionIds.has(plan.decisionId)
  );
  if (invalidPlanDecision) {
    throw new Error("Hay planes de cuotas con decisiones inexistentes.");
  }

  const invalidReserveDecision = store.finance.reserves.find(
    (reserve) => reserve.decisionId && !decisionIds.has(reserve.decisionId)
  );
  if (invalidReserveDecision) {
    throw new Error("Hay reservas con decisiones inexistentes.");
  }

  const invalidOccurrenceCommitment = store.finance.commitmentOccurrences.find(
    (occurrence) => !commitmentIds.has(occurrence.commitmentId)
  );
  if (invalidOccurrenceCommitment) {
    throw new Error("Hay ocurrencias con compromisos inexistentes.");
  }

  const invalidOccurrenceRecord = store.finance.commitmentOccurrences.find(
    (occurrence) => occurrence.settledRecordId && !recordIds.has(occurrence.settledRecordId)
  );
  if (invalidOccurrenceRecord) {
    throw new Error("Hay ocurrencias con historial financiero invalido.");
  }

  const invalidAdjustmentRecord = store.finance.manualAdjustments.find(
    (adjustment) => adjustment.recordId && !recordIds.has(adjustment.recordId)
  );
  if (invalidAdjustmentRecord) {
    throw new Error("Hay ajustes manuales con historial invalido.");
  }

  const invalidDecisionProject = store.decisions.items.find(
    (decision) => decision.projectId && !projectIds.has(decision.projectId)
  );
  if (invalidDecisionProject) {
    throw new Error("Hay decisiones apuntando a proyectos inexistentes.");
  }

  const invalidDecisionCard = store.decisions.items.find((decision) =>
    decision.paymentOptions.some((option) => option.creditCardId && !cardIds.has(option.creditCardId))
  );
  if (invalidDecisionCard) {
    throw new Error("Hay decisiones con tarjetas invalidas.");
  }

  const invalidDecisionReserve = store.decisions.items.find((decision) =>
    decision.paymentOptions.some((option) => option.reserveId && !reserveIds.has(option.reserveId))
  );
  if (invalidDecisionReserve) {
    throw new Error("Hay decisiones con reservas invalidas.");
  }

  const invalidConvertedExpense = store.decisions.items.find(
    (decision) =>
      decision.convertedEntity?.expenseId &&
      !store.finance.expenses.some((expense) => expense.id === decision.convertedEntity?.expenseId)
  );
  if (invalidConvertedExpense) {
    throw new Error("Hay decisiones con gastos convertidos inexistentes.");
  }

  const invalidConvertedPlan = store.decisions.items.find(
    (decision) =>
      decision.convertedEntity?.installmentPlanId &&
      !store.finance.installmentPlans.some(
        (plan) => plan.id === decision.convertedEntity?.installmentPlanId
      )
  );
  if (invalidConvertedPlan) {
    throw new Error("Hay decisiones con planes convertidos inexistentes.");
  }

  const invalidConvertedReserve = store.decisions.items.find(
    (decision) =>
      decision.convertedEntity?.reserveId &&
      !store.finance.reserves.some((reserve) => reserve.id === decision.convertedEntity?.reserveId)
  );
  if (invalidConvertedReserve) {
    throw new Error("Hay decisiones con reservas convertidas inexistentes.");
  }
}

export function migratePlanningStore(rawStore: unknown): PlanningStore {
  if (!rawStore || typeof rawStore !== "object") {
    return seedStore;
  }

  const candidate = rawStore as Record<string, unknown>;
  const projects = Array.isArray(candidate.projects)
    ? candidate.projects.map((project) => migrateProject(project as Record<string, unknown>))
    : seedStore.projects;
  const tasks = Array.isArray(candidate.tasks)
    ? candidate.tasks.map((task) => migrateTask(task as Record<string, unknown>))
    : seedStore.tasks;
  const normalizedTasks = normalizeTaskSet(tasks);

  const decisions =
    "decisions" in candidate
      ? migrateDecisionsState(candidate.decisions as Record<string, unknown> | undefined)
      : createDefaultDecisionsState();

  return {
    projects: syncProjectsProgress(projects, normalizedTasks),
    tasks: normalizedTasks,
    finance: migrateFinanceState(
      candidate.finance as Record<string, unknown> | undefined,
      candidate.settings as LegacySettings | undefined
    ),
    decisions
  };
}

export function loadPlanningStore(): PlanningStore {
  if (!canUseStorage()) return seedStore;

  const raw = LEGACY_STORAGE_KEYS.map((key) => window.localStorage.getItem(key)).find(Boolean);

  if (!raw) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedStore));
    return seedStore;
  }

  try {
    const migrated = parsePlanningStoreJson(raw);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seedStore));
    return seedStore;
  }
}

export function savePlanningStore(store: PlanningStore) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function createPlanningBackup(store: PlanningStore) {
  const backup: PlanningBackupFile = {
    schemaVersion: PLANNING_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    data: store
  };
  return JSON.stringify(backup, null, 2);
}

export function parsePlanningStoreJson(raw: string) {
  const parsed = JSON.parse(raw) as unknown;
  const { candidate } = extractStoreCandidate(parsed);
  const store = migratePlanningStore(candidate);
  validateRelationships(store);
  return store;
}

export function parsePlanningBackup(raw: string) {
  const parsed = JSON.parse(raw) as unknown;
  const { candidate, exportedAt, schemaVersion } = extractStoreCandidate(parsed);
  const store = migratePlanningStore(candidate);
  validateRelationships(store);

  return {
    schemaVersion,
    exportedAt,
    store,
    summary: buildBackupSummary(store)
  };
}

export { STORAGE_KEY };
