import { Task, TaskFormValues, TaskPriority, TaskStatus } from "../../types/domain";

export const emptyTaskForm: TaskFormValues = {
  title: "",
  description: "",
  projectId: "",
  status: "pending",
  priority: "medium",
  dueDate: "",
  estimatedCost: "",
  isNextAction: false
};

export const taskPriorities: TaskPriority[] = [
  "critical",
  "high",
  "medium",
  "low"
];

export const taskStatuses: TaskStatus[] = [
  "pending",
  "in-progress",
  "completed"
];

export function taskToFormValues(task: Task): TaskFormValues {
  return {
    title: task.title,
    description: task.description,
    projectId: task.projectId,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ?? "",
    estimatedCost:
      typeof task.estimatedCost === "number" ? String(task.estimatedCost) : "",
    isNextAction: task.isNextAction
  };
}

export function validateTaskForm(values: TaskFormValues, validProjectIds: string[]) {
  const errors: Partial<Record<keyof TaskFormValues, string>> = {};

  if (!values.title.trim()) errors.title = "La tarea necesita un título.";
  if (!validProjectIds.includes(values.projectId)) {
    errors.projectId = "Elegí un proyecto válido.";
  }

  if (values.estimatedCost.trim()) {
    const numeric = Number(values.estimatedCost);
    if (!Number.isFinite(numeric) || numeric < 0) {
      errors.estimatedCost = "Ingresá un costo válido.";
    }
  }

  if (values.dueDate.trim()) {
    const parsed = new Date(values.dueDate);
    if (Number.isNaN(parsed.getTime())) {
      errors.dueDate = "Ingresá una fecha válida.";
    }
  }

  return errors;
}
