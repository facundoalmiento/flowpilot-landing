import { Project, Task } from "../../types/domain";

export function calculateProjectProgress(tasks: Task[], fallbackProgress: number) {
  if (tasks.length === 0) return fallbackProgress;
  const completed = tasks.filter((task) => task.status === "completed").length;
  return Math.round((completed / tasks.length) * 100);
}

export function findNextActionTask(tasks: Task[]) {
  return tasks.find((task) => task.isNextAction && task.status !== "completed") ?? null;
}

export function getProjectNextActionText(project: Project, tasks: Task[]) {
  const nextTask = findNextActionTask(tasks);
  if (nextTask) return nextTask.title;
  if (tasks.length > 0) return "";
  return project.nextAction.trim();
}

export function syncProjectsProgress(projects: Project[], tasks: Task[]) {
  return projects.map((project) => {
    const projectTasks = tasks.filter((task) => task.projectId === project.id);
    const progress = calculateProjectProgress(projectTasks, project.progress);
    return progress === project.progress ? project : { ...project, progress };
  });
}
