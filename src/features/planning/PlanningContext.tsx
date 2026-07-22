import { PropsWithChildren, useEffect, useMemo, useReducer } from "react";
import { createDefaultDecisionsState, seedStore } from "../../data/mock/seed";
import {
  createComparison,
  evaluateDecision as evaluateDecisionWithRules
} from "../../features/decisions/decisionEngine";
import { sanitizeDecisionUpdate } from "../../features/relations/entityIntegrity";
import {
  closeMonthlyPeriod as closeMonthlyPeriodInLedger,
  createManualAdjustment as createManualAdjustmentInLedger,
  ensureCommitmentOccurrenceForMonth,
  markExpensePaid as markExpensePaidInLedger,
  markIncomeReceived as markIncomeReceivedInLedger,
  payCommitmentOccurrence as payCommitmentOccurrenceInLedger,
  payInstallmentPlan as payInstallmentPlanInLedger,
  reopenCommitmentOccurrence as reopenCommitmentOccurrenceInLedger,
  reopenExpense as reopenExpenseInLedger,
  reopenIncome as reopenIncomeInLedger,
  reopenMonthlyPeriod as reopenMonthlyPeriodInLedger,
  reverseManualAdjustment as reverseManualAdjustmentInLedger,
  revertInstallmentPlan as revertInstallmentPlanInLedger
} from "../../features/finance/financeLedger";
import { syncProjectsProgress } from "../../features/tasks/taskDerivations";
import { createTaskFromDecisionTask } from "../../features/tasks/taskFromDecision";
import { loadPlanningStore, savePlanningStore } from "../../services/storage/planningStorage";
import {
  Commitment,
  CommitmentFormValues,
  CreditCard,
  CreditCardFormValues,
  DecisionFormValues,
  DecisionItem,
  DecisionPaymentOption,
  DecisionRulesConfig,
  DecisionRulesConfigFormValues,
  Expense,
  ExpenseFormValues,
  FinanceSettings,
  FinanceSettingsFormValues,
  FinanceState,
  Income,
  IncomeFormValues,
  InstallmentPlan,
  InstallmentPlanFormValues,
  ManualAdjustmentFormValues,
  PlanningStore,
  Project,
  ProjectFormValues,
  Reserve,
  ReserveFormValues,
  SettlementFormValues,
  Task,
  TaskFormValues
} from "../../types/domain";
import { PlanningContext, PlanningContextValue } from "./PlanningContextValue";

type PlanningAction =
  | { type: "create-project"; payload: Project }
  | { type: "update-project"; payload: Project }
  | { type: "archive-project"; payload: { projectId: string } }
  | { type: "restore-project"; payload: { projectId: string } }
  | { type: "delete-project"; payload: { projectId: string } }
  | { type: "create-task"; payload: Task }
  | { type: "update-task"; payload: Task }
  | { type: "delete-task"; payload: { taskId: string } }
  | { type: "complete-task"; payload: { taskId: string } }
  | { type: "reopen-task"; payload: { taskId: string } }
  | { type: "toggle-next-action"; payload: { taskId: string } }
  | { type: "update-finance-settings"; payload: FinanceSettings }
  | { type: "create-credit-card"; payload: CreditCard }
  | { type: "update-credit-card"; payload: CreditCard }
  | { type: "delete-credit-card"; payload: { cardId: string } }
  | { type: "create-income"; payload: Income }
  | { type: "update-income"; payload: Income }
  | { type: "mark-income-received"; payload: { incomeId: string; settlement: SettlementFormValues } }
  | { type: "reopen-income"; payload: { incomeId: string } }
  | { type: "delete-income"; payload: { incomeId: string } }
  | { type: "create-expense"; payload: Expense }
  | { type: "update-expense"; payload: Expense }
  | { type: "mark-expense-paid"; payload: { expenseId: string; settlement: SettlementFormValues } }
  | { type: "reopen-expense"; payload: { expenseId: string } }
  | { type: "delete-expense"; payload: { expenseId: string } }
  | { type: "create-commitment"; payload: Commitment }
  | { type: "update-commitment"; payload: Commitment }
  | { type: "archive-commitment"; payload: { commitmentId: string } }
  | { type: "restore-commitment"; payload: { commitmentId: string } }
  | { type: "delete-commitment"; payload: { commitmentId: string } }
  | { type: "ensure-commitment-occurrences"; payload: { periodKey: string } }
  | { type: "pay-commitment-occurrence"; payload: { occurrenceId: string; settlement: SettlementFormValues } }
  | { type: "reopen-commitment-occurrence"; payload: { occurrenceId: string } }
  | { type: "create-installment-plan"; payload: InstallmentPlan }
  | { type: "update-installment-plan"; payload: InstallmentPlan }
  | { type: "archive-installment-plan"; payload: { planId: string } }
  | { type: "restore-installment-plan"; payload: { planId: string } }
  | { type: "delete-installment-plan"; payload: { planId: string } }
  | { type: "pay-installment-plan"; payload: { planId: string; settlement: SettlementFormValues } }
  | { type: "revert-installment-plan"; payload: { planId: string } }
  | { type: "create-reserve"; payload: Reserve }
  | { type: "update-reserve"; payload: Reserve }
  | { type: "complete-reserve"; payload: { reserveId: string } }
  | { type: "archive-reserve"; payload: { reserveId: string } }
  | { type: "restore-reserve"; payload: { reserveId: string } }
  | { type: "delete-reserve"; payload: { reserveId: string } }
  | { type: "create-manual-adjustment"; payload: ManualAdjustmentFormValues }
  | { type: "reverse-manual-adjustment"; payload: { adjustmentId: string } }
  | { type: "close-month"; payload: { periodKey: string } }
  | { type: "reopen-month"; payload: { periodKey: string } }
  | { type: "create-decision"; payload: DecisionItem }
  | { type: "update-decision"; payload: DecisionItem }
  | { type: "delete-decision"; payload: { decisionId: string } }
  | { type: "archive-decision"; payload: { decisionId: string } }
  | { type: "restore-decision"; payload: { decisionId: string } }
  | { type: "set-decision-status"; payload: { decisionId: string; status: DecisionItem["status"] } }
  | { type: "evaluate-decision"; payload: { decisionId: string } }
  | { type: "evaluate-all-decisions" }
  | { type: "update-decision-rules"; payload: DecisionRulesConfig }
  | { type: "save-decision-comparison"; payload: { decisionIds: string[] } }
  | { type: "remove-decision-comparison"; payload: { comparisonId: string } }
  | { type: "convert-decision"; payload: { decisionId: string } }
  | { type: "create-task-from-decision"; payload: Task }
  | { type: "replace-store"; payload: PlanningStore };

function toNullableNumber(value: string) {
  if (!value.trim()) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function toRequiredNumber(value: string) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function toOptionalString(value: string) {
  return value.trim() ? value.trim() : null;
}

function mapDecisionToExpenseCategory(
  category: DecisionItem["category"]
): Expense["category"] {
  switch (category) {
    case "safety":
    case "transport":
    case "maintenance":
      return "transport";
    case "health":
      return "health";
    case "housing":
      return "housing";
    case "training":
      return "training";
    case "technology":
    case "work":
      return "projects";
    case "travel":
      return "travel";
    default:
      return "other";
  }
}

function buildProject(values: ProjectFormValues, existing?: Project): Project {
  const now = new Date().toISOString();

  return {
    id: existing?.id ?? crypto.randomUUID(),
    name: values.name.trim(),
    category: values.category,
    description: values.description.trim(),
    status: values.status,
    priority: values.priority,
    targetDate: values.targetDate || null,
    costEstimated: toNullableNumber(values.costEstimated),
    progress: values.progress,
    nextAction: values.nextAction.trim(),
    blockedReason: values.blockedReason.trim(),
    updatedAt: now,
    createdAt: existing?.createdAt ?? now
  };
}

function buildTask(values: TaskFormValues, existing?: Task): Task {
  const now = new Date().toISOString();
  const nextStatus = values.status;

  return {
    id: existing?.id ?? crypto.randomUUID(),
    title: values.title.trim(),
    description: values.description.trim(),
    projectId: values.projectId,
    sourceDecisionId: existing?.sourceDecisionId ?? null,
    status: nextStatus,
    priority: values.priority,
    dueDate: values.dueDate || null,
    estimatedCost: toNullableNumber(values.estimatedCost),
    isNextAction: nextStatus === "completed" ? false : values.isNextAction,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    completedAt: nextStatus === "completed" ? existing?.completedAt ?? now : null
  };
}

function buildFinanceSettings(values: FinanceSettingsFormValues): FinanceSettings {
  return {
    currency: values.currency,
    currentBalance: toRequiredNumber(values.currentBalance),
    minimumReserve: toRequiredNumber(values.minimumReserve),
    salaryPayday: toRequiredNumber(values.salaryPayday),
    allowancePayday: toRequiredNumber(values.allowancePayday)
  };
}

function buildCreditCard(values: CreditCardFormValues, existing?: CreditCard): CreditCard {
  const now = new Date().toISOString();
  return {
    id: existing?.id ?? crypto.randomUUID(),
    name: values.name.trim(),
    limit: toNullableNumber(values.limit),
    closeDay: toRequiredNumber(values.closeDay),
    dueDay: toRequiredNumber(values.dueDay),
    state: values.state,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
}

function buildIncome(values: IncomeFormValues, existing?: Income): Income {
  const now = new Date().toISOString();
  return {
    id: existing?.id ?? crypto.randomUUID(),
    type: values.type,
    name: values.name.trim(),
    amount: toRequiredNumber(values.amount),
    expectedDate: values.expectedDate,
    receivedDate:
      values.status === "received" ? toOptionalString(values.receivedDate) ?? now.slice(0, 10) : null,
    status: values.status,
    recurrence: values.recurrence || null,
    notes: values.notes.trim(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
}

function buildExpense(values: ExpenseFormValues, existing?: Expense): Expense {
  const now = new Date().toISOString();
  return {
    id: existing?.id ?? crypto.randomUUID(),
    name: values.name.trim(),
    amount: toRequiredNumber(values.amount),
    dueDate: values.dueDate,
    paidDate:
      values.status === "paid" ? toOptionalString(values.paidDate) ?? now.slice(0, 10) : null,
    status: values.status,
    category: values.category,
    paymentMethod: values.paymentMethod,
    creditCardId: toOptionalString(values.creditCardId),
    installmentPlanId: toOptionalString(values.installmentPlanId),
    decisionId: existing?.decisionId ?? null,
    notes: values.notes.trim(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
}

function buildCommitment(values: CommitmentFormValues, existing?: Commitment): Commitment {
  const now = new Date().toISOString();
  return {
    id: existing?.id ?? crypto.randomUUID(),
    name: values.name.trim(),
    amount: toRequiredNumber(values.amount),
    frequency: values.frequency,
    nextDueDate: values.nextDueDate,
    startDate: values.startDate,
    endDate: toOptionalString(values.endDate),
    totalInstallments: toNullableNumber(values.totalInstallments),
    currentInstallment: toNullableNumber(values.currentInstallment),
    state: values.state,
    notes: values.notes.trim(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
}

function buildInstallmentPlan(
  values: InstallmentPlanFormValues,
  existing?: InstallmentPlan
): InstallmentPlan {
  const now = new Date().toISOString();
  const totalInstallments = Math.max(toRequiredNumber(values.totalInstallments), 1);
  const currentInstallment = Math.min(
    Math.max(toRequiredNumber(values.currentInstallment), 1),
    totalInstallments
  );
  return {
    id: existing?.id ?? crypto.randomUUID(),
    description: values.description.trim(),
    creditCardId: values.creditCardId,
    totalAmount: toRequiredNumber(values.totalAmount),
    totalInstallments,
    installmentAmount: toRequiredNumber(values.installmentAmount),
    firstDueDate: values.firstDueDate,
    currentInstallment,
    decisionId: existing?.decisionId ?? null,
    status:
      values.status === "completed" && currentInstallment <= totalInstallments
        ? "completed"
        : values.status,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
}

function buildReserve(values: ReserveFormValues, existing?: Reserve): Reserve {
  const now = new Date().toISOString();
  const targetAmount = toRequiredNumber(values.targetAmount);
  const savedAmount = toRequiredNumber(values.savedAmount);

  return {
    id: existing?.id ?? crypto.randomUUID(),
    name: values.name.trim(),
    targetAmount,
    savedAmount,
    targetDate: toOptionalString(values.targetDate),
    priority: values.priority,
    status:
      values.status === "archived"
        ? "archived"
        : targetAmount > 0 && savedAmount >= targetAmount
          ? "completed"
          : values.status,
    decisionId: existing?.decisionId ?? null,
    notes: values.notes.trim(),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };
}

function buildDecisionRules(values: DecisionRulesConfigFormValues): DecisionRulesConfig {
  return {
    minimumPostPurchaseMargin: toRequiredNumber(values.minimumPostPurchaseMargin),
    maxNewInstallmentIncomeRatio: Number(values.maxNewInstallmentIncomeRatio) || 0,
    maxFutureInstallmentDebt: toRequiredNumber(values.maxFutureInstallmentDebt),
    longFinancingMonths: toRequiredNumber(values.longFinancingMonths),
    safetyHealthPriorityBoost: toRequiredNumber(values.safetyHealthPriorityBoost)
  };
}

function buildDecisionPaymentOption(
  values: DecisionFormValues["paymentOptions"][number]
): DecisionPaymentOption {
  const totalAmount = toRequiredNumber(values.totalAmount);
  const installmentCount = toNullableNumber(values.installmentCount);
  const installmentAmount =
    values.installmentAmount.trim()
      ? toRequiredNumber(values.installmentAmount)
      : installmentCount && installmentCount > 0
        ? Math.round(totalAmount / installmentCount)
        : null;

  return {
    id: values.id ?? crypto.randomUUID(),
    type: values.type,
    totalAmount,
    upfrontAmount: toNullableNumber(values.upfrontAmount),
    installmentCount,
    installmentAmount,
    interestAmount: toNullableNumber(values.interestAmount),
    firstDueDate: toOptionalString(values.firstDueDate),
    creditCardId: toOptionalString(values.creditCardId),
    reserveId: toOptionalString(values.reserveId),
    notes: values.notes.trim()
  };
}

function buildDecision(values: DecisionFormValues, existing?: DecisionItem): DecisionItem {
  const now = new Date().toISOString();
  const paymentOptions = values.paymentOptions.map(buildDecisionPaymentOption);
  const selectedPaymentOptionId =
    paymentOptions.find((option) => option.id === values.selectedPaymentOptionId)?.id ??
    paymentOptions[0]?.id ??
    null;
  const nextStatus = values.status;
  return {
    id: existing?.id ?? crypto.randomUUID(),
    name: values.name.trim(),
    description: values.description.trim(),
    category: existing?.convertedEntity ? existing.category : values.category,
    projectId: toOptionalString(values.projectId),
    totalAmount: existing?.convertedEntity ? existing.totalAmount : toRequiredNumber(values.totalAmount),
    desiredDate: existing?.convertedEntity ? existing.desiredDate : toOptionalString(values.desiredDate),
    urgency: values.urgency,
    impact: values.impact,
    necessity: values.necessity,
    paymentOptions: existing?.convertedEntity ? existing.paymentOptions : paymentOptions,
    selectedPaymentOptionId: existing?.convertedEntity ? existing.selectedPaymentOptionId : selectedPaymentOptionId,
    status: nextStatus,
    recommendation: existing?.recommendation ?? null,
    recommendationReasons: existing?.recommendationReasons ?? [],
    evaluation: existing?.evaluation ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    resolvedAt:
      nextStatus === "completed" || nextStatus === "rejected" ? existing?.resolvedAt ?? now : null,
    convertedEntity: existing?.convertedEntity ?? null,
    statusHistory: existing?.statusHistory ?? [
      {
        id: crypto.randomUUID(),
        status: nextStatus,
        changedAt: now,
        note: "Decision creada."
      }
    ]
  };
}

function withSingleNextAction(tasks: Task[], taskId: string) {
  const target = tasks.find((task) => task.id === taskId);
  if (!target) return tasks;

  return tasks.map((task) => {
    if (task.projectId !== target.projectId) return task;
    if (task.id === taskId) {
      return task.status === "completed"
        ? { ...task, isNextAction: false }
        : { ...task, isNextAction: !task.isNextAction };
    }
    return task.isNextAction ? { ...task, isNextAction: false } : task;
  });
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

function normalizeFinanceState(finance: FinanceState): FinanceState {
  return {
    ...finance,
    installmentPlans: finance.installmentPlans.map((plan) =>
      plan.currentInstallment > plan.totalInstallments && plan.status !== "archived"
        ? { ...plan, status: "completed" }
        : plan
    ),
    reserves: finance.reserves.map((reserve) =>
      reserve.status === "active" &&
      reserve.targetAmount > 0 &&
      reserve.savedAmount >= reserve.targetAmount
        ? { ...reserve, status: "completed" }
        : reserve
    )
  };
}

function normalizeDecisionsState(state: PlanningStore): PlanningStore["decisions"] {
  const ids = new Set(state.decisions.items.map((item) => item.id));
  return {
    ...state.decisions,
    comparisons: state.decisions.comparisons.filter(
      (comparison) =>
        comparison.decisionIds.length >= 2 &&
        comparison.decisionIds.every((decisionId) => ids.has(decisionId))
    )
  };
}

function finalizeState(state: PlanningStore): PlanningStore {
  const tasks = normalizeTaskSet(state.tasks);
  const nextState = {
    ...state,
    tasks,
    projects: syncProjectsProgress(state.projects, tasks),
    finance: normalizeFinanceState(state.finance)
  };
  return {
    ...nextState,
    decisions: normalizeDecisionsState(nextState)
  };
}

function evaluateDecisionInState(state: PlanningStore, decisionId: string) {
  return {
    ...state,
    decisions: {
      ...state.decisions,
      items: state.decisions.items.map((decision) => {
        if (decision.id !== decisionId) return decision;
        const evaluation = evaluateDecisionWithRules(
          decision,
          state.finance,
          state.decisions.rulesConfig,
          state.projects,
          state.tasks
        );
        return {
          ...decision,
          recommendation: evaluation.recommendationCode,
          recommendationReasons: evaluation.reasons,
          evaluation,
          updatedAt: new Date().toISOString()
        };
      })
    }
  };
}

function appendDecisionStatus(
  decision: DecisionItem,
  status: DecisionItem["status"],
  note: string
): DecisionItem {
  const now = new Date().toISOString();
  return {
    ...decision,
    status,
    updatedAt: now,
    resolvedAt:
      status === "completed" || status === "rejected" ? decision.resolvedAt ?? now : null,
    statusHistory: [
      ...decision.statusHistory,
      {
        id: crypto.randomUUID(),
        status,
        changedAt: now,
        note
      }
    ]
  };
}

function convertDecisionInState(state: PlanningStore, decisionId: string): PlanningStore {
  const decision = state.decisions.items.find((item) => item.id === decisionId);
  if (!decision) return state;

  const option =
    decision.paymentOptions.find((item) => item.id === decision.selectedPaymentOptionId) ??
    decision.paymentOptions[0] ??
    null;
  if (!option) return state;

  if (decision.convertedEntity) {
    return state;
  }

  const dueDate = decision.desiredDate ?? new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();
  let nextState = { ...state };
  let expenseId: string | null = null;
  let installmentPlanId: string | null = null;
  let reserveId: string | null = null;

  const existingExpense = state.finance.expenses.find((expense) => expense.decisionId === decision.id);
  const existingPlan = state.finance.installmentPlans.find((plan) => plan.decisionId === decision.id);
  const existingReserve = state.finance.reserves.find((reserve) => reserve.decisionId === decision.id);

  if (option.type === "one-time" || option.type === "use-reserve") {
    expenseId = existingExpense?.id ?? crypto.randomUUID();
    if (!existingExpense) {
      nextState = {
        ...nextState,
        finance: {
          ...nextState.finance,
          expenses: [
            {
              id: expenseId,
              name: decision.name,
              amount: option.totalAmount,
              dueDate,
              paidDate: null,
              status: "pending",
              category: mapDecisionToExpenseCategory(decision.category),
              paymentMethod: option.type === "use-reserve" ? "bank-transfer" : "other",
              creditCardId: null,
              installmentPlanId: null,
              decisionId: decision.id,
              notes: decision.description,
              createdAt: now,
              updatedAt: now
            },
            ...nextState.finance.expenses
          ]
        }
      };
    }
  }

  if (option.type === "installments") {
    installmentPlanId = existingPlan?.id ?? crypto.randomUUID();
    if (!existingPlan) {
      nextState = {
        ...nextState,
        finance: {
          ...nextState.finance,
          installmentPlans: [
            {
              id: installmentPlanId,
              description: decision.name,
              creditCardId: option.creditCardId ?? nextState.finance.creditCards[0]?.id ?? "",
              totalAmount: option.totalAmount,
              totalInstallments: option.installmentCount ?? 1,
              installmentAmount: option.installmentAmount ?? option.totalAmount,
              firstDueDate: option.firstDueDate ?? dueDate,
              currentInstallment: 1,
              decisionId: decision.id,
              status: "active",
              createdAt: now,
              updatedAt: now
            },
            ...nextState.finance.installmentPlans
          ]
        }
      };
    }
  }

  if (option.type === "save-first") {
    reserveId = existingReserve?.id ?? crypto.randomUUID();
    if (!existingReserve) {
      nextState = {
        ...nextState,
        finance: {
          ...nextState.finance,
          reserves: [
            {
              id: reserveId,
              name: decision.name,
              targetAmount: option.totalAmount,
              savedAmount: 0,
              targetDate: decision.desiredDate,
              priority: decision.urgency === "critical" || decision.urgency === "high" ? "high" : "medium",
              status: "active",
              decisionId: decision.id,
              notes: decision.description,
              createdAt: now,
              updatedAt: now
            },
            ...nextState.finance.reserves
          ]
        }
      };
    }
  }

  if (option.type === "mixed") {
    expenseId = existingExpense?.id ?? crypto.randomUUID();
    installmentPlanId = existingPlan?.id ?? crypto.randomUUID();
    if (!existingExpense) {
      nextState = {
        ...nextState,
        finance: {
          ...nextState.finance,
          expenses: [
            {
              id: expenseId,
              name: `${decision.name} · anticipo`,
              amount: option.upfrontAmount ?? 0,
              dueDate,
              paidDate: null,
              status: "pending",
              category: mapDecisionToExpenseCategory(decision.category),
              paymentMethod: "other",
              creditCardId: null,
              installmentPlanId: null,
              decisionId: decision.id,
              notes: decision.description,
              createdAt: now,
              updatedAt: now
            },
            ...nextState.finance.expenses
          ]
        }
      };
    }
    if (!existingPlan) {
      nextState = {
        ...nextState,
        finance: {
          ...nextState.finance,
          installmentPlans: [
            {
              id: installmentPlanId,
              description: `${decision.name} · saldo financiado`,
              creditCardId: option.creditCardId ?? nextState.finance.creditCards[0]?.id ?? "",
              totalAmount: (option.installmentAmount ?? 0) * (option.installmentCount ?? 1),
              totalInstallments: option.installmentCount ?? 1,
              installmentAmount: option.installmentAmount ?? 0,
              firstDueDate: option.firstDueDate ?? dueDate,
              currentInstallment: 1,
              decisionId: decision.id,
              status: "active",
              createdAt: now,
              updatedAt: now
            },
            ...nextState.finance.installmentPlans
          ]
        }
      };
    }
  }

  nextState = {
    ...nextState,
    decisions: {
      ...nextState.decisions,
      items: nextState.decisions.items.map((item) =>
        item.id === decision.id
          ? appendDecisionStatus(
              {
                ...item,
                convertedEntity: {
                  kind:
                    option.type === "mixed"
                      ? "mixed"
                      : option.type === "installments"
                        ? "installment-plan"
                        : option.type === "save-first"
                          ? "reserve"
                          : "expense",
                  expenseId,
                  installmentPlanId,
                  reserveId,
                  createdAt: now
                }
              },
              "completed",
              "Decision convertida en operacion real."
            )
          : item
      )
    }
  };

  return nextState;
}

function planningReducer(state: PlanningStore, action: PlanningAction): PlanningStore {
  switch (action.type) {
    case "create-project":
      return finalizeState({ ...state, projects: [action.payload, ...state.projects] });
    case "update-project":
      return finalizeState({
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.payload.id ? action.payload : project
        )
      });
    case "archive-project":
      return finalizeState({
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.payload.projectId
            ? { ...project, status: "Archivado", updatedAt: new Date().toISOString() }
            : project
        )
      });
    case "restore-project":
      return finalizeState({
        ...state,
        projects: state.projects.map((project) =>
          project.id === action.payload.projectId
            ? { ...project, status: "Pendiente", updatedAt: new Date().toISOString() }
            : project
        )
      });
    case "delete-project":
      return finalizeState({
        ...state,
        projects: state.projects.filter((project) => project.id !== action.payload.projectId),
        tasks: state.tasks.filter((task) => task.projectId !== action.payload.projectId),
        decisions: {
          ...state.decisions,
          items: state.decisions.items.map((decision) =>
            decision.projectId === action.payload.projectId
              ? { ...decision, projectId: null, updatedAt: new Date().toISOString() }
              : decision
          )
        }
      });
    case "create-task":
      return finalizeState({ ...state, tasks: [action.payload, ...state.tasks] });
    case "update-task":
      return finalizeState({
        ...state,
        tasks: state.tasks.map((task) => (task.id === action.payload.id ? action.payload : task))
      });
    case "delete-task":
      return finalizeState({
        ...state,
        tasks: state.tasks.filter((task) => task.id !== action.payload.taskId)
      });
    case "complete-task":
      return finalizeState({
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.taskId
            ? {
                ...task,
                status: "completed",
                isNextAction: false,
                updatedAt: new Date().toISOString(),
                completedAt: new Date().toISOString()
              }
            : task
        )
      });
    case "reopen-task":
      return finalizeState({
        ...state,
        tasks: state.tasks.map((task) =>
          task.id === action.payload.taskId
            ? { ...task, status: "pending", updatedAt: new Date().toISOString(), completedAt: null }
            : task
        )
      });
    case "toggle-next-action":
      return finalizeState({ ...state, tasks: withSingleNextAction(state.tasks, action.payload.taskId) });
    case "update-finance-settings":
      return finalizeState({ ...state, finance: { ...state.finance, settings: action.payload } });
    case "create-credit-card":
      return finalizeState({
        ...state,
        finance: { ...state.finance, creditCards: [action.payload, ...state.finance.creditCards] }
      });
    case "update-credit-card":
      return finalizeState({
        ...state,
        finance: {
          ...state.finance,
          creditCards: state.finance.creditCards.map((card) =>
            card.id === action.payload.id ? action.payload : card
          )
        }
      });
    case "delete-credit-card":
      return finalizeState({
        ...state,
        finance: {
          ...state.finance,
          creditCards: state.finance.creditCards.filter((card) => card.id !== action.payload.cardId)
        }
      });
    case "create-income":
      return finalizeState({ ...state, finance: { ...state.finance, incomes: [action.payload, ...state.finance.incomes] } });
    case "update-income":
      return finalizeState({
        ...state,
        finance: {
          ...state.finance,
          incomes: state.finance.incomes.map((income) =>
            income.id === action.payload.id ? action.payload : income
          )
        }
      });
    case "mark-income-received":
      return finalizeState({
        ...state,
        finance: markIncomeReceivedInLedger(state.finance, action.payload.incomeId, action.payload.settlement)
      });
    case "reopen-income":
      return finalizeState({ ...state, finance: reopenIncomeInLedger(state.finance, action.payload.incomeId) });
    case "delete-income":
      return finalizeState({
        ...state,
        finance: {
          ...state.finance,
          incomes: state.finance.incomes.filter((income) => income.id !== action.payload.incomeId)
        }
      });
    case "create-expense":
      return finalizeState({ ...state, finance: { ...state.finance, expenses: [action.payload, ...state.finance.expenses] } });
    case "update-expense":
      return finalizeState({
        ...state,
        finance: {
          ...state.finance,
          expenses: state.finance.expenses.map((expense) =>
            expense.id === action.payload.id ? action.payload : expense
          )
        }
      });
    case "mark-expense-paid":
      return finalizeState({
        ...state,
        finance: markExpensePaidInLedger(state.finance, action.payload.expenseId, action.payload.settlement)
      });
    case "reopen-expense":
      return finalizeState({ ...state, finance: reopenExpenseInLedger(state.finance, action.payload.expenseId) });
    case "delete-expense":
      return finalizeState({
        ...state,
        finance: {
          ...state.finance,
          expenses: state.finance.expenses.filter((expense) => expense.id !== action.payload.expenseId)
        }
      });
    case "create-commitment":
      return finalizeState({ ...state, finance: { ...state.finance, commitments: [action.payload, ...state.finance.commitments] } });
    case "update-commitment":
      return finalizeState({
        ...state,
        finance: {
          ...state.finance,
          commitments: state.finance.commitments.map((commitment) =>
            commitment.id === action.payload.id ? action.payload : commitment
          )
        }
      });
    case "archive-commitment":
      return finalizeState({
        ...state,
        finance: {
          ...state.finance,
          commitments: state.finance.commitments.map((commitment) =>
            commitment.id === action.payload.commitmentId
              ? { ...commitment, state: "archived", updatedAt: new Date().toISOString() }
              : commitment
          )
        }
      });
    case "restore-commitment":
      return finalizeState({
        ...state,
        finance: {
          ...state.finance,
          commitments: state.finance.commitments.map((commitment) =>
            commitment.id === action.payload.commitmentId
              ? { ...commitment, state: "active", updatedAt: new Date().toISOString() }
              : commitment
          )
        }
      });
    case "delete-commitment":
      return finalizeState({
        ...state,
        finance: {
          ...state.finance,
          commitments: state.finance.commitments.filter(
            (commitment) => commitment.id !== action.payload.commitmentId
          ),
          commitmentOccurrences: state.finance.commitmentOccurrences.filter(
            (occurrence) => occurrence.commitmentId !== action.payload.commitmentId
          )
        }
      });
    case "ensure-commitment-occurrences":
      return finalizeState({
        ...state,
        finance: ensureCommitmentOccurrenceForMonth(state.finance, action.payload.periodKey)
      });
    case "pay-commitment-occurrence":
      return finalizeState({
        ...state,
        finance: payCommitmentOccurrenceInLedger(
          state.finance,
          action.payload.occurrenceId,
          action.payload.settlement
        )
      });
    case "reopen-commitment-occurrence":
      return finalizeState({
        ...state,
        finance: reopenCommitmentOccurrenceInLedger(state.finance, action.payload.occurrenceId)
      });
    case "create-installment-plan":
      return finalizeState({
        ...state,
        finance: {
          ...state.finance,
          installmentPlans: [action.payload, ...state.finance.installmentPlans]
        }
      });
    case "update-installment-plan":
      return finalizeState({
        ...state,
        finance: {
          ...state.finance,
          installmentPlans: state.finance.installmentPlans.map((plan) =>
            plan.id === action.payload.id ? action.payload : plan
          )
        }
      });
    case "archive-installment-plan":
      return finalizeState({
        ...state,
        finance: {
          ...state.finance,
          installmentPlans: state.finance.installmentPlans.map((plan) =>
            plan.id === action.payload.planId
              ? { ...plan, status: "archived", updatedAt: new Date().toISOString() }
              : plan
          )
        }
      });
    case "restore-installment-plan":
      return finalizeState({
        ...state,
        finance: {
          ...state.finance,
          installmentPlans: state.finance.installmentPlans.map((plan) =>
            plan.id === action.payload.planId
              ? { ...plan, status: "active", updatedAt: new Date().toISOString() }
              : plan
          )
        }
      });
    case "delete-installment-plan":
      return finalizeState({
        ...state,
        finance: {
          ...state.finance,
          installmentPlans: state.finance.installmentPlans.filter(
            (plan) => plan.id !== action.payload.planId
          ),
          expenses: state.finance.expenses.map((expense) =>
            expense.installmentPlanId === action.payload.planId
              ? { ...expense, installmentPlanId: null }
              : expense
          ),
          confirmedRecords: state.finance.confirmedRecords.filter(
            (record) =>
              !(record.sourceType === "installment" &&
                record.sourceId.startsWith(`${action.payload.planId}:`))
          )
        }
      });
    case "pay-installment-plan":
      return finalizeState({
        ...state,
        finance: payInstallmentPlanInLedger(state.finance, action.payload.planId, action.payload.settlement)
      });
    case "revert-installment-plan":
      return finalizeState({
        ...state,
        finance: revertInstallmentPlanInLedger(state.finance, action.payload.planId)
      });
    case "create-reserve":
      return finalizeState({ ...state, finance: { ...state.finance, reserves: [action.payload, ...state.finance.reserves] } });
    case "update-reserve":
      return finalizeState({
        ...state,
        finance: {
          ...state.finance,
          reserves: state.finance.reserves.map((reserve) =>
            reserve.id === action.payload.id ? action.payload : reserve
          )
        }
      });
    case "complete-reserve":
      return finalizeState({
        ...state,
        finance: {
          ...state.finance,
          reserves: state.finance.reserves.map((reserve) =>
            reserve.id === action.payload.reserveId
              ? {
                  ...reserve,
                  savedAmount: Math.max(reserve.savedAmount, reserve.targetAmount),
                  status: "completed",
                  updatedAt: new Date().toISOString()
                }
              : reserve
          )
        }
      });
    case "archive-reserve":
      return finalizeState({
        ...state,
        finance: {
          ...state.finance,
          reserves: state.finance.reserves.map((reserve) =>
            reserve.id === action.payload.reserveId
              ? { ...reserve, status: "archived", updatedAt: new Date().toISOString() }
              : reserve
          )
        }
      });
    case "restore-reserve":
      return finalizeState({
        ...state,
        finance: {
          ...state.finance,
          reserves: state.finance.reserves.map((reserve) =>
            reserve.id === action.payload.reserveId
              ? { ...reserve, status: "active", updatedAt: new Date().toISOString() }
              : reserve
          )
        }
      });
    case "delete-reserve":
      return finalizeState({
        ...state,
        finance: {
          ...state.finance,
          reserves: state.finance.reserves.filter((reserve) => reserve.id !== action.payload.reserveId)
        }
      });
    case "create-manual-adjustment":
      return finalizeState({
        ...state,
        finance: createManualAdjustmentInLedger(state.finance, action.payload)
      });
    case "reverse-manual-adjustment":
      return finalizeState({
        ...state,
        finance: reverseManualAdjustmentInLedger(state.finance, action.payload.adjustmentId)
      });
    case "close-month":
      return finalizeState({
        ...state,
        finance: closeMonthlyPeriodInLedger(state.finance, action.payload.periodKey)
      });
    case "reopen-month":
      return finalizeState({
        ...state,
        finance: reopenMonthlyPeriodInLedger(state.finance, action.payload.periodKey)
      });
    case "create-decision":
      return finalizeState({
        ...state,
        decisions: { ...state.decisions, items: [action.payload, ...state.decisions.items] }
      });
    case "update-decision":
      return finalizeState({
        ...state,
        decisions: {
          ...state.decisions,
          items: state.decisions.items.map((decision) =>
            decision.id === action.payload.id ? action.payload : decision
          )
        }
      });
    case "delete-decision":
      return finalizeState({
        ...state,
        decisions: {
          ...state.decisions,
          items: state.decisions.items.filter((decision) => decision.id !== action.payload.decisionId),
          comparisons: state.decisions.comparisons.filter(
            (comparison) => !comparison.decisionIds.includes(action.payload.decisionId)
          )
        }
      });
    case "archive-decision":
      return finalizeState({
        ...state,
        decisions: {
          ...state.decisions,
          items: state.decisions.items.map((decision) =>
            decision.id === action.payload.decisionId
              ? appendDecisionStatus(decision, "archived", "Decision archivada.")
              : decision
          )
        }
      });
    case "restore-decision":
      return finalizeState({
        ...state,
        decisions: {
          ...state.decisions,
          items: state.decisions.items.map((decision) =>
            decision.id === action.payload.decisionId
              ? appendDecisionStatus(decision, "evaluating", "Decision restaurada.")
              : decision
          )
        }
      });
    case "set-decision-status":
      return finalizeState({
        ...state,
        decisions: {
          ...state.decisions,
          items: state.decisions.items.map((decision) =>
            decision.id === action.payload.decisionId
              ? appendDecisionStatus(decision, action.payload.status, "Estado actualizado.")
              : decision
          )
        }
      });
    case "evaluate-decision":
      return finalizeState(evaluateDecisionInState(state, action.payload.decisionId));
    case "evaluate-all-decisions":
      return finalizeState({
        ...state,
        decisions: {
          ...state.decisions,
          items: state.decisions.items.map((decision) => {
            const evaluation = evaluateDecisionWithRules(
              decision,
              state.finance,
              state.decisions.rulesConfig,
              state.projects,
              state.tasks
            );
            return {
              ...decision,
              recommendation: evaluation.recommendationCode,
              recommendationReasons: evaluation.reasons,
              evaluation
            };
          })
        }
      });
    case "update-decision-rules":
      return finalizeState({
        ...state,
        decisions: { ...state.decisions, rulesConfig: action.payload }
      });
    case "save-decision-comparison":
      return finalizeState({
        ...state,
        decisions: {
          ...state.decisions,
          comparisons: [createComparison(action.payload.decisionIds), ...state.decisions.comparisons]
        }
      });
    case "remove-decision-comparison":
      return finalizeState({
        ...state,
        decisions: {
          ...state.decisions,
          comparisons: state.decisions.comparisons.filter(
            (comparison) => comparison.id !== action.payload.comparisonId
          )
        }
      });
    case "convert-decision":
      return finalizeState(convertDecisionInState(state, action.payload.decisionId));
    case "create-task-from-decision":
      return finalizeState({ ...state, tasks: [action.payload, ...state.tasks] });
    case "replace-store":
      return finalizeState(action.payload);
    default:
      return state;
  }
}

export function PlanningProvider({ children }: PropsWithChildren) {
  const [store, dispatch] = useReducer(planningReducer, undefined, loadPlanningStore);

  useEffect(() => {
    savePlanningStore(store);
  }, [store]);

  const value = useMemo<PlanningContextValue>(
    () => ({
      store,
      projects: store.projects,
      tasks: store.tasks,
      finance: store.finance,
      decisions: store.decisions,
      createProject(values) {
        dispatch({ type: "create-project", payload: buildProject(values) });
      },
      updateProject(projectId, values) {
        const existing = store.projects.find((project) => project.id === projectId);
        if (!existing) return;
        dispatch({ type: "update-project", payload: buildProject(values, existing) });
      },
      archiveProject(projectId) {
        dispatch({ type: "archive-project", payload: { projectId } });
      },
      restoreProject(projectId) {
        dispatch({ type: "restore-project", payload: { projectId } });
      },
      deleteProject(projectId) {
        dispatch({ type: "delete-project", payload: { projectId } });
      },
      createTask(values) {
        if (!store.projects.some((project) => project.id === values.projectId)) return;
        dispatch({ type: "create-task", payload: buildTask(values) });
      },
      updateTask(taskId, values) {
        const existing = store.tasks.find((task) => task.id === taskId);
        if (!existing) return;
        dispatch({ type: "update-task", payload: buildTask(values, existing) });
      },
      deleteTask(taskId) {
        dispatch({ type: "delete-task", payload: { taskId } });
      },
      completeTask(taskId) {
        dispatch({ type: "complete-task", payload: { taskId } });
      },
      reopenTask(taskId) {
        dispatch({ type: "reopen-task", payload: { taskId } });
      },
      toggleTaskNextAction(taskId) {
        dispatch({ type: "toggle-next-action", payload: { taskId } });
      },
      updateFinanceSettings(values) {
        dispatch({ type: "update-finance-settings", payload: buildFinanceSettings(values) });
      },
      createCreditCard(values) {
        dispatch({ type: "create-credit-card", payload: buildCreditCard(values) });
      },
      updateCreditCard(cardId, values) {
        const existing = store.finance.creditCards.find((card) => card.id === cardId);
        if (!existing) return;
        dispatch({ type: "update-credit-card", payload: buildCreditCard(values, existing) });
      },
      deleteCreditCard(cardId) {
        dispatch({ type: "delete-credit-card", payload: { cardId } });
      },
      createIncome(values) {
        dispatch({ type: "create-income", payload: buildIncome(values) });
      },
      updateIncome(incomeId, values) {
        const existing = store.finance.incomes.find((income) => income.id === incomeId);
        if (!existing) return;
        dispatch({ type: "update-income", payload: buildIncome(values, existing) });
      },
      markIncomeReceived(incomeId, values) {
        dispatch({ type: "mark-income-received", payload: { incomeId, settlement: values } });
      },
      reopenIncome(incomeId) {
        dispatch({ type: "reopen-income", payload: { incomeId } });
      },
      deleteIncome(incomeId) {
        dispatch({ type: "delete-income", payload: { incomeId } });
      },
      createExpense(values) {
        dispatch({ type: "create-expense", payload: buildExpense(values) });
      },
      updateExpense(expenseId, values) {
        const existing = store.finance.expenses.find((expense) => expense.id === expenseId);
        if (!existing) return;
        dispatch({ type: "update-expense", payload: buildExpense(values, existing) });
      },
      markExpensePaid(expenseId, values) {
        dispatch({ type: "mark-expense-paid", payload: { expenseId, settlement: values } });
      },
      reopenExpense(expenseId) {
        dispatch({ type: "reopen-expense", payload: { expenseId } });
      },
      deleteExpense(expenseId) {
        dispatch({ type: "delete-expense", payload: { expenseId } });
      },
      createCommitment(values) {
        dispatch({ type: "create-commitment", payload: buildCommitment(values) });
      },
      updateCommitment(commitmentId, values) {
        const existing = store.finance.commitments.find((commitment) => commitment.id === commitmentId);
        if (!existing) return;
        dispatch({ type: "update-commitment", payload: buildCommitment(values, existing) });
      },
      archiveCommitment(commitmentId) {
        dispatch({ type: "archive-commitment", payload: { commitmentId } });
      },
      restoreCommitment(commitmentId) {
        dispatch({ type: "restore-commitment", payload: { commitmentId } });
      },
      deleteCommitment(commitmentId) {
        dispatch({ type: "delete-commitment", payload: { commitmentId } });
      },
      ensureCommitmentOccurrencesForMonth(periodKey) {
        dispatch({ type: "ensure-commitment-occurrences", payload: { periodKey } });
      },
      payCommitmentOccurrence(occurrenceId, values) {
        dispatch({ type: "pay-commitment-occurrence", payload: { occurrenceId, settlement: values } });
      },
      reopenCommitmentOccurrence(occurrenceId) {
        dispatch({ type: "reopen-commitment-occurrence", payload: { occurrenceId } });
      },
      createInstallmentPlan(values) {
        dispatch({ type: "create-installment-plan", payload: buildInstallmentPlan(values) });
      },
      updateInstallmentPlan(planId, values) {
        const existing = store.finance.installmentPlans.find((plan) => plan.id === planId);
        if (!existing) return;
        dispatch({ type: "update-installment-plan", payload: buildInstallmentPlan(values, existing) });
      },
      archiveInstallmentPlan(planId) {
        dispatch({ type: "archive-installment-plan", payload: { planId } });
      },
      restoreInstallmentPlan(planId) {
        dispatch({ type: "restore-installment-plan", payload: { planId } });
      },
      deleteInstallmentPlan(planId) {
        dispatch({ type: "delete-installment-plan", payload: { planId } });
      },
      payInstallmentPlan(planId, values) {
        dispatch({ type: "pay-installment-plan", payload: { planId, settlement: values } });
      },
      revertInstallmentPlan(planId) {
        dispatch({ type: "revert-installment-plan", payload: { planId } });
      },
      createReserve(values) {
        dispatch({ type: "create-reserve", payload: buildReserve(values) });
      },
      updateReserve(reserveId, values) {
        const existing = store.finance.reserves.find((reserve) => reserve.id === reserveId);
        if (!existing) return;
        dispatch({ type: "update-reserve", payload: buildReserve(values, existing) });
      },
      completeReserve(reserveId) {
        dispatch({ type: "complete-reserve", payload: { reserveId } });
      },
      archiveReserve(reserveId) {
        dispatch({ type: "archive-reserve", payload: { reserveId } });
      },
      restoreReserve(reserveId) {
        dispatch({ type: "restore-reserve", payload: { reserveId } });
      },
      deleteReserve(reserveId) {
        dispatch({ type: "delete-reserve", payload: { reserveId } });
      },
      createManualAdjustment(values) {
        dispatch({ type: "create-manual-adjustment", payload: values });
      },
      reverseManualAdjustment(adjustmentId) {
        dispatch({ type: "reverse-manual-adjustment", payload: { adjustmentId } });
      },
      closeMonthlyPeriod(periodKey) {
        dispatch({ type: "close-month", payload: { periodKey } });
      },
      reopenMonthlyPeriod(periodKey) {
        dispatch({ type: "reopen-month", payload: { periodKey } });
      },
      createDecision(values) {
        dispatch({ type: "create-decision", payload: buildDecision(values) });
      },
      updateDecision(decisionId, values) {
        const existing = store.decisions.items.find((decision) => decision.id === decisionId);
        if (!existing) return;
        dispatch({
          type: "update-decision",
          payload: buildDecision(sanitizeDecisionUpdate(existing, values), existing)
        });
      },
      deleteDecision(decisionId) {
        dispatch({ type: "delete-decision", payload: { decisionId } });
      },
      archiveDecision(decisionId) {
        dispatch({ type: "archive-decision", payload: { decisionId } });
      },
      restoreDecision(decisionId) {
        dispatch({ type: "restore-decision", payload: { decisionId } });
      },
      setDecisionStatus(decisionId, status) {
        dispatch({ type: "set-decision-status", payload: { decisionId, status } });
      },
      evaluateDecision(decisionId) {
        dispatch({ type: "evaluate-decision", payload: { decisionId } });
      },
      evaluateAllDecisions() {
        dispatch({ type: "evaluate-all-decisions" });
      },
      updateDecisionRulesConfig(values) {
        dispatch({ type: "update-decision-rules", payload: buildDecisionRules(values) });
      },
      saveDecisionComparison(decisionIds) {
        dispatch({ type: "save-decision-comparison", payload: { decisionIds } });
      },
      removeDecisionComparison(comparisonId) {
        dispatch({ type: "remove-decision-comparison", payload: { comparisonId } });
      },
      convertDecision(decisionId) {
        dispatch({ type: "convert-decision", payload: { decisionId } });
      },
      createTaskFromDecision(decisionId, title) {
        const createdTask = createTaskFromDecisionTask(store, decisionId, title);
        if (!createdTask) return;
        dispatch({
          type: "create-task-from-decision",
          payload: createdTask
        });
      },
      replaceStore(nextStore) {
        dispatch({ type: "replace-store", payload: nextStore });
      },
      resetStore() {
        dispatch({
          type: "replace-store",
          payload: { ...seedStore, decisions: createDefaultDecisionsState() }
        });
      }
    }),
    [store]
  );

  return <PlanningContext.Provider value={value}>{children}</PlanningContext.Provider>;
}
