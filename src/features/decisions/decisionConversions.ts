import { Expense, PlanningStore, DecisionItem } from "../../types/domain";

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

export function convertDecisionInStore(state: PlanningStore, decisionId: string): PlanningStore {
  const decision = state.decisions.items.find((item) => item.id === decisionId);
  if (!decision) return state;

  const option =
    decision.paymentOptions.find((item) => item.id === decision.selectedPaymentOptionId) ??
    decision.paymentOptions[0] ??
    null;
  if (!option || decision.convertedEntity) return state;

  const dueDate = decision.desiredDate ?? new Date().toISOString().slice(0, 10);
  const now = new Date().toISOString();
  let nextState = { ...state };
  let expenseId = null;
  let installmentPlanId = null;
  let reserveId = null;

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

  return {
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
}
