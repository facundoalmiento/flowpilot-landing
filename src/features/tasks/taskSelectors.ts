import { Project, ProjectCategory, Task, TaskPriority } from "../../types/domain";
import {
  daysUntil,
  isDateWithinCurrentWeek,
  isPastDate,
  isToday,
  isWithinDays
} from "../../utils/dates";
import { taskPriorityWeight } from "../../utils/format";

function isProjectActive(project: Project | undefined) {
  return project && project.status !== "Completado" && project.status !== "Archivado";
}

export function sortTasksForPriority(tasks: Task[], projects: Project[]) {
  return [...tasks].sort((a, b) => {
    const aProject = projects.find((project) => project.id === a.projectId);
    const bProject = projects.find((project) => project.id === b.projectId);
    const aOverdue = a.dueDate && daysUntil(a.dueDate) < 0 ? 1 : 0;
    const bOverdue = b.dueDate && daysUntil(b.dueDate) < 0 ? 1 : 0;
    if (aOverdue !== bOverdue) return bOverdue - aOverdue;

    const aImportant = a.priority === "critical" || a.priority === "high" ? 1 : 0;
    const bImportant = b.priority === "critical" || b.priority === "high" ? 1 : 0;
    if (aImportant !== bImportant) return bImportant - aImportant;

    if (a.isNextAction !== b.isNextAction) return Number(b.isNextAction) - Number(a.isNextAction);

    const aDays = a.dueDate ? daysUntil(a.dueDate) : 999;
    const bDays = b.dueDate ? daysUntil(b.dueDate) : 999;
    if (aDays !== bDays) return aDays - bDays;

    const aProjectActive = isProjectActive(aProject) ? 1 : 0;
    const bProjectActive = isProjectActive(bProject) ? 1 : 0;
    if (aProjectActive !== bProjectActive) return bProjectActive - aProjectActive;

    return taskPriorityWeight(b.priority) - taskPriorityWeight(a.priority);
  });
}

export function getWeekSections(tasks: Task[], projects: Project[]) {
  const activeTasks = sortTasksForPriority(
    tasks.filter((task) => task.status !== "completed"),
    projects
  );

  const overdue = activeTasks.filter((task) => isPastDate(task.dueDate));
  const today = activeTasks.filter(
    (task) =>
      isToday(task.dueDate) ||
      (task.isNextAction && !isPastDate(task.dueDate) && !isWithinDays(task.dueDate, 7))
  );
  const thisWeek = activeTasks.filter(
    (task) => !isPastDate(task.dueDate) && isDateWithinCurrentWeek(task.dueDate)
  );
  const noDate = activeTasks.filter((task) => !task.dueDate);

  return {
    overdue,
    today,
    thisWeek: thisWeek.filter((task) => !today.some((current) => current.id === task.id)),
    noDate: noDate.filter((task) => !today.some((current) => current.id === task.id))
  };
}

export function filterTasksForWeekView(
  tasks: Task[],
  projects: Project[],
  filters: {
    projectId: string;
    category: ProjectCategory | "Todas";
    priority: TaskPriority | "all";
    showCompleted: boolean;
  }
) {
  return tasks.filter((task) => {
    const project = projects.find((item) => item.id === task.projectId);
    if (!project) return false;
    if (!isProjectActive(project)) return false;
    if (!filters.showCompleted && task.status === "completed") return false;
    if (filters.projectId !== "all" && task.projectId !== filters.projectId) return false;
    if (filters.category !== "Todas" && project.category !== filters.category) return false;
    if (filters.priority !== "all" && task.priority !== filters.priority) return false;
    return true;
  });
}
