import {
  DashboardAlert,
  DashboardPriorityItem,
  DecisionItem,
  Project,
  Task
} from "../../types/domain";
import { daysUntil, formatRelativeDeadline, isDateWithinCurrentWeek, isPastDate } from "../../utils/dates";
import { taskPriorityWeight } from "../../utils/format";
import { getProjectNextActionText } from "../tasks/taskDerivations";

function isProjectActive(project: Project) {
  return project.status !== "Completado" && project.status !== "Archivado";
}

function getTaskPriorityScore(task: Task) {
  const overdue = task.dueDate && daysUntil(task.dueDate) < 0 ? 1000 : 0;
  const nextAction = task.isNextAction ? 200 : 0;
  const dueScore = task.dueDate ? 100 - Math.min(daysUntil(task.dueDate), 100) : 0;
  return overdue + nextAction + taskPriorityWeight(task.priority) * 100 + dueScore;
}

export function getWeeklyPriorities(projects: Project[], tasks: Task[]): DashboardPriorityItem[] {
  const activeProjectIds = new Set(projects.filter(isProjectActive).map((project) => project.id));

  return tasks
    .filter((task) => task.status !== "completed" && activeProjectIds.has(task.projectId))
    .sort((a, b) => getTaskPriorityScore(b) - getTaskPriorityScore(a))
    .slice(0, 3)
    .map((task) => {
      const project = projects.find((item) => item.id === task.projectId);
      return {
        id: task.id,
        title: task.title,
        subtitle: project ? project.name : "Proyecto sin nombre",
        dueLabel: formatRelativeDeadline(task.dueDate),
        priority: task.priority,
        projectId: task.projectId
      };
    });
}

export function getUpcomingDeadlines(projects: Project[], tasks: Task[]) {
  const activeProjectIds = new Set(projects.filter(isProjectActive).map((project) => project.id));

  return tasks
    .filter((task) => task.status !== "completed" && task.dueDate && activeProjectIds.has(task.projectId))
    .sort((a, b) => daysUntil(a.dueDate!) - daysUntil(b.dueDate!))
    .slice(0, 5)
    .map((task) => ({
      id: task.id,
      type: "task" as const,
      title: task.title,
      date: task.dueDate!,
      subtitle: formatRelativeDeadline(task.dueDate)
    }));
}

export function getWeeklyProgress(tasks: Task[]) {
  const plannedThisWeek = tasks.filter((task) => task.dueDate && isDateWithinCurrentWeek(task.dueDate));
  if (plannedThisWeek.length === 0) return 0;

  const completedThisWeek = plannedThisWeek.filter(
    (task) => task.completedAt && isDateWithinCurrentWeek(task.completedAt)
  );

  return Math.round((completedThisWeek.length / plannedThisWeek.length) * 100);
}

export function getDashboardAlerts(
  projects: Project[],
  tasks: Task[],
  decisions: DecisionItem[]
): DashboardAlert[] {
  const alerts: DashboardAlert[] = [];

  const overdueTask = tasks.find((task) => task.status !== "completed" && isPastDate(task.dueDate));
  if (overdueTask) {
    alerts.push({
      id: "overdue-task",
      title: "Hay tareas vencidas",
      description: `${overdueTask.title} ya quedo fuera de fecha y conviene reordenarla hoy.`,
      severity: "danger"
    });
  }

  const blockedProject = projects.find((project) => project.status === "Bloqueado");
  if (blockedProject) {
    alerts.push({
      id: "blocked-project",
      title: "Hay un proyecto bloqueado",
      description: `${blockedProject.name} sigue frenado y necesita una definicion.`,
      severity: "warning"
    });
  }

  const projectWithoutAction = projects.find((project) => {
    const projectTasks = tasks.filter((task) => task.projectId === project.id);
    return !getProjectNextActionText(project, projectTasks);
  });
  if (projectWithoutAction) {
    alerts.push({
      id: "missing-action",
      title: "Un proyecto no tiene próxima acción",
      description: `${projectWithoutAction.name} necesita un siguiente paso concreto.`,
      severity: "info"
    });
  }

  const projectWithoutTasks = projects.find((project) => {
    if (!isProjectActive(project)) return false;
    return !tasks.some((task) => task.projectId === project.id);
  });
  if (projectWithoutTasks) {
    alerts.push({
      id: "missing-tasks",
      title: "Hay un proyecto sin tareas",
      description: `${projectWithoutTasks.name} todavía no tiene tareas asociadas.`,
      severity: "warning"
    });
  }

  const criticalDecision = decisions.find(
    (decision) =>
      decision.status !== "archived" &&
      decision.urgency === "critical" &&
      decision.status !== "approved" &&
      decision.status !== "completed"
  );
  if (criticalDecision) {
    alerts.push({
      id: "critical-decision",
      title: "Hay una decisión crítica sin cierre",
      description: `${criticalDecision.name} necesita un plan financiero definido.`,
      severity: "warning"
    });
  }

  return alerts.slice(0, 4);
}
