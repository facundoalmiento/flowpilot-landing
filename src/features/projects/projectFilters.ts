import { Project, ProjectFilters } from "../../types/domain";
import { priorityWeight } from "../../utils/format";

export function filterAndSortProjects(projects: Project[], filters: ProjectFilters) {
  const normalizedSearch = filters.search.trim().toLowerCase();

  return projects
    .filter((project) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        project.name.toLowerCase().includes(normalizedSearch) ||
        project.description.toLowerCase().includes(normalizedSearch) ||
        project.nextAction.toLowerCase().includes(normalizedSearch);

      const matchesCategory =
        filters.category === "Todas" || project.category === filters.category;
      const matchesPriority =
        filters.priority === "Todas" || project.priority === filters.priority;
      const matchesStatus = filters.status === "Todas" || project.status === filters.status;

      return matchesSearch && matchesCategory && matchesPriority && matchesStatus;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case "name":
          return a.name.localeCompare(b.name, "es");
        case "priority":
          return priorityWeight(b.priority) - priorityWeight(a.priority);
        case "progress":
          return b.progress - a.progress;
        case "targetDate":
          if (!a.targetDate) return 1;
          if (!b.targetDate) return -1;
          return a.targetDate.localeCompare(b.targetDate);
        case "updatedAt":
        default:
          return b.updatedAt.localeCompare(a.updatedAt);
      }
    });
}
