import { DecisionEvaluation, DecisionItem, Project } from "../../types/domain";

export interface DecisionFilterState {
  search: string;
  status: string;
  category: string;
  projectId: string;
  urgency: string;
  recommendation: string;
  converted: string;
  archived: string;
  sortBy: "updatedAt" | "priority" | "amount" | "desiredDate" | "viability";
}

export const defaultDecisionFilters: DecisionFilterState = {
  search: "",
  status: "all",
  category: "all",
  projectId: "all",
  urgency: "all",
  recommendation: "all",
  converted: "all",
  archived: "active",
  sortBy: "updatedAt"
};

export function hasActiveDecisionFilters(filters: DecisionFilterState) {
  return JSON.stringify(filters) !== JSON.stringify(defaultDecisionFilters);
}

function getPriorityScore(evaluation: DecisionEvaluation) {
  return evaluation.priorityScore;
}

function getViabilityScore(evaluation: DecisionEvaluation) {
  const projectionSafe = evaluation.metrics.monthEndProjection >= 0 ? 40 : 0;
  const availableSafe = evaluation.metrics.availableToDecide >= 0 ? 40 : 0;
  const confidence = evaluation.confidence / 5;
  return projectionSafe + availableSafe + confidence;
}

export function filterAndSortDecisions<T extends { decision: DecisionItem; evaluation: DecisionEvaluation }>(
  entries: T[],
  filters: DecisionFilterState,
  projects: Project[]
): T[] {
  const projectIds = new Set(projects.map((project) => project.id));

  return entries
    .filter(({ decision, evaluation }) => {
      const haystack = `${decision.name} ${decision.description}`.toLowerCase();
      if (filters.search.trim() && !haystack.includes(filters.search.trim().toLowerCase())) {
        return false;
      }
      if (filters.archived === "active" && decision.status === "archived") return false;
      if (filters.archived === "archived" && decision.status !== "archived") return false;
      if (filters.status !== "all" && decision.status !== filters.status) return false;
      if (filters.category !== "all" && decision.category !== filters.category) return false;
      if (filters.projectId !== "all" && decision.projectId !== filters.projectId) return false;
      if (filters.projectId === "missing" && (!decision.projectId || projectIds.has(decision.projectId))) {
        return false;
      }
      if (filters.urgency !== "all" && decision.urgency !== filters.urgency) return false;
      if (
        filters.recommendation !== "all" &&
        evaluation.recommendationCode !== filters.recommendation
      ) {
        return false;
      }
      if (filters.converted === "converted" && !decision.convertedEntity) return false;
      if (filters.converted === "pending" && decision.convertedEntity) return false;
      return true;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case "priority":
          return getPriorityScore(b.evaluation) - getPriorityScore(a.evaluation);
        case "amount":
          return b.decision.totalAmount - a.decision.totalAmount;
        case "desiredDate":
          return (a.decision.desiredDate ?? "9999-12-31").localeCompare(
            b.decision.desiredDate ?? "9999-12-31"
          );
        case "viability":
          return getViabilityScore(b.evaluation) - getViabilityScore(a.evaluation);
        case "updatedAt":
        default:
          return b.decision.updatedAt.localeCompare(a.decision.updatedAt);
      }
    });
}
