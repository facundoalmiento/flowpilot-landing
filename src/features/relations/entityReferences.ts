import { ConfirmedFinancialRecord, PlanningStore } from "../../types/domain";

export function findTaskBySourceDecisionId(store: PlanningStore, decisionId: string) {
  return store.tasks.find((task) => task.sourceDecisionId === decisionId) ?? null;
}

export function findDecisionByExpenseId(store: PlanningStore, expenseId: string) {
  return (
    store.decisions.items.find(
      (decision) => decision.convertedEntity?.expenseId === expenseId
    ) ??
    store.decisions.items.find((decision) =>
      store.finance.expenses.some(
        (expense) => expense.id === expenseId && expense.decisionId === decision.id
      )
    ) ??
    null
  );
}

export function findDecisionByInstallmentPlanId(store: PlanningStore, planId: string) {
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

export function findDecisionByReserveId(store: PlanningStore, reserveId: string) {
  return (
    store.decisions.items.find(
      (decision) => decision.convertedEntity?.reserveId === reserveId
    ) ??
    store.decisions.items.find((decision) =>
      store.finance.reserves.some(
        (reserve) => reserve.id === reserveId && reserve.decisionId === decision.id
      )
    ) ??
    null
  );
}

export function findDecisionByHistoryRecord(store: PlanningStore, record: ConfirmedFinancialRecord) {
  if (record.sourceType === "expense") {
    return findDecisionByExpenseId(store, record.sourceId);
  }

  if (record.sourceType === "installment") {
    const planId = record.sourceId.split(":")[0];
    return findDecisionByInstallmentPlanId(store, planId);
  }

  return null;
}

export function getProjectLinkedFinance(store: PlanningStore, projectId: string) {
  const decisionIds = new Set(
    store.decisions.items
      .filter((decision) => decision.projectId === projectId)
      .map((decision) => decision.id)
  );

  return {
    expenses: store.finance.expenses.filter(
      (expense) => expense.decisionId && decisionIds.has(expense.decisionId)
    ),
    installmentPlans: store.finance.installmentPlans.filter(
      (plan) => plan.decisionId && decisionIds.has(plan.decisionId)
    ),
    reserves: store.finance.reserves.filter(
      (reserve) => reserve.decisionId && decisionIds.has(reserve.decisionId)
    )
  };
}
