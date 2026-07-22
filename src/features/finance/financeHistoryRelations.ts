import { findTaskBySourceDecisionId } from "../relations/entityReferences";
import {
  CommitmentOccurrence,
  ConfirmedFinancialRecord,
  DecisionItem,
  Expense,
  Income,
  InstallmentPlan,
  ManualBalanceAdjustment,
  PlanningStore,
  Project,
  Task
} from "../../types/domain";

export interface FinanceHistoryLink {
  kind:
    | "income"
    | "expense"
    | "installment"
    | "commitment"
    | "manual-adjustment"
    | "decision"
    | "project"
    | "task"
    | "history";
  label: string;
  to: string | null;
  state: "active" | "archived" | "missing";
}

export interface FinanceHistoryResolution {
  primary: FinanceHistoryLink;
  related: FinanceHistoryLink[];
  reversedFrom: FinanceHistoryLink | null;
  reversedBy: FinanceHistoryLink | null;
}

function getHistoryLink(recordId: string, label: string): FinanceHistoryLink {
  return {
    kind: "history",
    label,
    to: `/finances?tab=history&highlight=${recordId}`,
    state: "active"
  };
}

function getProjectLink(project: Project | null): FinanceHistoryLink {
  if (!project) {
    return {
      kind: "project",
      label: "Referencia no disponible",
      to: null,
      state: "missing"
    };
  }

  return {
    kind: "project",
    label: `Proyecto ${project.name}`,
    to: `/projects/${project.id}`,
    state: project.status === "Archivado" ? "archived" : "active"
  };
}

function getTaskLink(task: Task | null): FinanceHistoryLink {
  if (!task) {
    return {
      kind: "task",
      label: "Referencia no disponible",
      to: null,
      state: "missing"
    };
  }

  return {
    kind: "task",
    label: `Tarea ${task.title}`,
    to: `/projects/${task.projectId}`,
    state: "active"
  };
}

function getDecisionLink(decision: DecisionItem | null): FinanceHistoryLink {
  if (!decision) {
    return {
      kind: "decision",
      label: "Referencia no disponible",
      to: null,
      state: "missing"
    };
  }

  return {
    kind: "decision",
    label: `Creado desde la decision ${decision.name}`,
    to: `/decisions/${decision.id}`,
    state: decision.status === "archived" ? "archived" : "active"
  };
}

function getIncomeLink(income: Income | null): FinanceHistoryLink {
  if (!income) {
    return {
      kind: "income",
      label: "Referencia no disponible",
      to: null,
      state: "missing"
    };
  }

  return {
    kind: "income",
    label: `Ingreso ${income.name}`,
    to: `/finances?tab=movements&highlight=${income.id}`,
    state: "active"
  };
}

function getExpenseLink(expense: Expense | null): FinanceHistoryLink {
  if (!expense) {
    return {
      kind: "expense",
      label: "Referencia no disponible",
      to: null,
      state: "missing"
    };
  }

  return {
    kind: "expense",
    label: `Gasto ${expense.name}`,
    to: `/finances?tab=movements&highlight=${expense.id}`,
    state: "active"
  };
}

function getInstallmentLink(
  plan: InstallmentPlan | null,
  installmentNumber?: number | null
): FinanceHistoryLink {
  if (!plan) {
    return {
      kind: "installment",
      label: "Referencia no disponible",
      to: null,
      state: "missing"
    };
  }

  const quotaLabel =
    typeof installmentNumber === "number"
      ? `Cuota ${installmentNumber} de ${plan.totalInstallments} - ${plan.description}`
      : `Plan ${plan.description}`;

  return {
    kind: "installment",
    label: quotaLabel,
    to: `/finances?tab=cards&highlight=${plan.id}`,
    state: plan.status === "archived" ? "archived" : "active"
  };
}

function getCommitmentLink(
  occurrence: CommitmentOccurrence | null,
  commitmentName: string | null
): FinanceHistoryLink {
  if (!occurrence || !commitmentName) {
    return {
      kind: "commitment",
      label: "Referencia no disponible",
      to: null,
      state: "missing"
    };
  }

  const monthLabel = new Date(`${occurrence.periodKey}-01T12:00:00`).toLocaleDateString("es-AR", {
    month: "long",
    year: "numeric"
  });

  return {
    kind: "commitment",
    label: `Ocurrencia de ${commitmentName} - ${monthLabel}`,
    to: `/finances?tab=commitments&highlight=${occurrence.id}`,
    state: "active"
  };
}

function getManualAdjustmentLink(adjustment: ManualBalanceAdjustment | null): FinanceHistoryLink {
  if (!adjustment) {
    return {
      kind: "manual-adjustment",
      label: "Referencia no disponible",
      to: null,
      state: "missing"
    };
  }

  return {
    kind: "manual-adjustment",
    label: adjustment.note.trim() ? `Ajuste ${adjustment.note}` : "Ajuste manual",
    to: `/finances?tab=settings&highlight=${adjustment.id}`,
    state: "active"
  };
}

function getDecisionContextLinks(store: PlanningStore, decision: DecisionItem | null) {
  if (!decision) return [];

  const project = decision.projectId
    ? store.projects.find((item) => item.id === decision.projectId) ?? null
    : null;
  const task = findTaskBySourceDecisionId(store, decision.id);
  const links = [getDecisionLink(decision)];

  if (decision.projectId) {
    links.push(getProjectLink(project));
  }

  if (task) {
    links.push(getTaskLink(task));
  }

  return links;
}

function getDecisionByExpense(store: PlanningStore, expenseId: string) {
  return (
    store.decisions.items.find((decision) => decision.convertedEntity?.expenseId === expenseId) ??
    store.decisions.items.find((decision) =>
      store.finance.expenses.some(
        (expense) => expense.id === expenseId && expense.decisionId === decision.id
      )
    ) ??
    null
  );
}

function getDecisionByInstallmentPlan(store: PlanningStore, planId: string) {
  return (
    store.decisions.items.find(
      (decision) => decision.convertedEntity?.installmentPlanId === planId
    ) ??
    store.decisions.items.find((decision) =>
      store.finance.installmentPlans.some(
        (plan) => plan.id === planId && plan.decisionId === decision.id
      )
    ) ??
    null
  );
}

function getReversalLinks(store: PlanningStore, record: ConfirmedFinancialRecord) {
  const original = record.reversalOf
    ? store.finance.confirmedRecords.find((item) => item.id === record.reversalOf) ?? null
    : null;
  const reversedBy =
    store.finance.confirmedRecords.find((item) => item.reversalOf === record.id) ?? null;

  return {
    reversedFrom: original
      ? getHistoryLink(original.id, `Reversion de ${original.description}`)
      : record.reversalOf
        ? {
            kind: "history" as const,
            label: "Referencia no disponible",
            to: null,
            state: "missing" as const
          }
        : null,
    reversedBy: reversedBy
      ? getHistoryLink(reversedBy.id, `Registro que revierte ${record.description}`)
      : null
  };
}

export function resolveFinanceHistoryRecord(
  store: PlanningStore,
  record: ConfirmedFinancialRecord
): FinanceHistoryResolution {
  const reversalLinks = getReversalLinks(store, record);

  if (record.sourceType === "income") {
    const income = store.finance.incomes.find((item) => item.id === record.sourceId) ?? null;
    return {
      primary: getIncomeLink(income),
      related: [],
      ...reversalLinks
    };
  }

  if (record.sourceType === "expense") {
    const expense = store.finance.expenses.find((item) => item.id === record.sourceId) ?? null;
    const decision = expense?.decisionId
      ? store.decisions.items.find((item) => item.id === expense.decisionId) ?? null
      : getDecisionByExpense(store, record.sourceId);

    return {
      primary: getExpenseLink(expense),
      related: getDecisionContextLinks(store, decision),
      ...reversalLinks
    };
  }

  if (record.sourceType === "installment") {
    const [planId, installmentNumberValue] = record.sourceId.split(":");
    const installmentNumber = Number(installmentNumberValue);
    const plan = store.finance.installmentPlans.find((item) => item.id === planId) ?? null;
    const decision = plan?.decisionId
      ? store.decisions.items.find((item) => item.id === plan.decisionId) ?? null
      : getDecisionByInstallmentPlan(store, planId);

    return {
      primary: getInstallmentLink(plan, Number.isFinite(installmentNumber) ? installmentNumber : null),
      related: getDecisionContextLinks(store, decision),
      ...reversalLinks
    };
  }

  if (record.sourceType === "commitment-occurrence") {
    const occurrence =
      store.finance.commitmentOccurrences.find((item) => item.id === record.sourceId) ?? null;
    const commitmentName =
      occurrence
        ? store.finance.commitments.find((item) => item.id === occurrence.commitmentId)?.name ?? null
        : null;

    return {
      primary: getCommitmentLink(occurrence, commitmentName),
      related: [],
      ...reversalLinks
    };
  }

  const adjustment =
    store.finance.manualAdjustments.find((item) => item.id === record.sourceId) ?? null;

  return {
    primary: getManualAdjustmentLink(adjustment),
    related: [],
    ...reversalLinks
  };
}
