import { DecisionItem, PlanningStore, Task } from "../../types/domain";

function toPriority(decision: DecisionItem): Task["priority"] {
  if (decision.urgency === "critical") return "critical";
  if (decision.urgency === "high") return "high";
  return "medium";
}

export function createTaskFromDecisionTask(
  store: PlanningStore,
  decisionId: string,
  title: string
): Task | null {
  const decision = store.decisions.items.find((item) => item.id === decisionId);
  if (!decision || !decision.projectId) return null;

  const normalizedTitle = title.trim();
  if (!normalizedTitle) return null;

  const duplicate = store.tasks.find(
    (task) => task.sourceDecisionId === decisionId && task.title.trim() === normalizedTitle
  );
  if (duplicate) return null;

  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    title: normalizedTitle,
    description: decision.description,
    projectId: decision.projectId,
    sourceDecisionId: decision.id,
    priority: toPriority(decision),
    status: "pending",
    dueDate: decision.desiredDate ?? null,
    estimatedCost: decision.totalAmount,
    isNextAction: false,
    createdAt: now,
    updatedAt: now,
    completedAt: null
  };
}
