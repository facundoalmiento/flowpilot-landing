import { DecisionFormValues, DecisionItem, PlanningStore } from "../../types/domain";

export function getProjectDependencySummary(store: PlanningStore, projectId: string) {
  const tasks = store.tasks.filter((task) => task.projectId === projectId);
  const decisions = store.decisions.items.filter((decision) => decision.projectId === projectId);
  const decisionIds = new Set(decisions.map((decision) => decision.id));

  return {
    tasksCount: tasks.length,
    decisionsCount: decisions.length,
    linkedExpensesCount: store.finance.expenses.filter(
      (expense) => expense.decisionId && decisionIds.has(expense.decisionId)
    ).length,
    linkedInstallmentPlansCount: store.finance.installmentPlans.filter(
      (plan) => plan.decisionId && decisionIds.has(plan.decisionId)
    ).length,
    linkedReservesCount: store.finance.reserves.filter(
      (reserve) => reserve.decisionId && decisionIds.has(reserve.decisionId)
    ).length
  };
}

export function getCreditCardDeletionGuard(store: PlanningStore, cardId: string) {
  const activePlans = store.finance.installmentPlans.filter(
    (plan) => plan.creditCardId === cardId && plan.status === "active"
  );
  const pendingExpenses = store.finance.expenses.filter(
    (expense) => expense.creditCardId === cardId && expense.status === "pending"
  );
  const activeDecisions = store.decisions.items.filter(
    (decision) =>
      decision.status !== "archived" &&
      decision.paymentOptions.some((option) => option.creditCardId === cardId)
  );

  const reasons = [
    activePlans.length > 0 ? `${activePlans.length} plan(es) de cuotas activos` : null,
    activeDecisions.length > 0 ? `${activeDecisions.length} decision(es) activas` : null,
    pendingExpenses.length > 0 ? `${pendingExpenses.length} gasto(s) pendientes` : null
  ].filter(Boolean) as string[];

  return {
    allowed: reasons.length === 0,
    reasons,
    activePlansCount: activePlans.length,
    activeDecisionsCount: activeDecisions.length,
    pendingExpensesCount: pendingExpenses.length
  };
}

export function getReserveDeletionGuard(store: PlanningStore, reserveId: string) {
  const activeDecisions = store.decisions.items.filter(
    (decision) =>
      decision.status !== "archived" &&
      decision.paymentOptions.some((option) => option.reserveId === reserveId)
  );

  return {
    allowed: activeDecisions.length === 0,
    reasons:
      activeDecisions.length > 0
        ? [`${activeDecisions.length} decision(es) activas dependen de esta reserva`]
        : [],
    activeDecisionsCount: activeDecisions.length
  };
}

export function sanitizeDecisionUpdate(existing: DecisionItem, nextValues: DecisionFormValues) {
  if (!existing.convertedEntity) return nextValues;

  return {
    ...nextValues,
    category: existing.category,
    totalAmount: String(existing.totalAmount),
    desiredDate: existing.desiredDate ?? "",
    selectedPaymentOptionId: existing.selectedPaymentOptionId ?? "",
    paymentOptions: existing.paymentOptions.map((option) => ({
      id: option.id,
      type: option.type,
      totalAmount: String(option.totalAmount),
      upfrontAmount: option.upfrontAmount === null ? "" : String(option.upfrontAmount),
      installmentCount: option.installmentCount === null ? "" : String(option.installmentCount),
      installmentAmount: option.installmentAmount === null ? "" : String(option.installmentAmount),
      interestAmount: option.interestAmount === null ? "" : String(option.interestAmount),
      firstDueDate: option.firstDueDate ?? "",
      creditCardId: option.creditCardId ?? "",
      reserveId: option.reserveId ?? "",
      notes: option.notes
    }))
  };
}
