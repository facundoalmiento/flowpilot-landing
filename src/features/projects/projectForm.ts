import { Project, ProjectFormValues } from "../../types/domain";

export const emptyProjectForm: ProjectFormValues = {
  name: "",
  category: "Carrera IT",
  description: "",
  status: "Pendiente",
  priority: "Media",
  targetDate: "",
  costEstimated: "",
  progress: 0,
  nextAction: "",
  blockedReason: ""
};

export function projectToFormValues(project: Project): ProjectFormValues {
  return {
    name: project.name,
    category: project.category,
    description: project.description,
    status: project.status,
    priority: project.priority,
    targetDate: project.targetDate ?? "",
    costEstimated:
      typeof project.costEstimated === "number" ? String(project.costEstimated) : "",
    progress: project.progress,
    nextAction: project.nextAction,
    blockedReason: project.blockedReason
  };
}

export function validateProject(values: ProjectFormValues) {
  const errors: Partial<Record<keyof ProjectFormValues, string>> = {};

  if (!values.name.trim()) errors.name = "El proyecto necesita un nombre.";
  if (!values.description.trim()) errors.description = "Sumá una descripción corta.";
  if (!values.targetDate.trim()) errors.targetDate = "Definí una fecha objetivo.";

  if (
    values.status !== "Completado" &&
    values.status !== "Archivado" &&
    !values.nextAction.trim()
  ) {
    errors.nextAction = "Indicá la próxima acción concreta.";
  }

  if (values.status === "Bloqueado" && !values.blockedReason.trim()) {
    errors.blockedReason = "Contá por qué está bloqueado.";
  }

  if (values.progress < 0 || values.progress > 100) {
    errors.progress = "El avance debe estar entre 0 y 100.";
  }

  if (values.costEstimated.trim()) {
    const numericValue = Number(values.costEstimated);
    if (!Number.isFinite(numericValue) || numericValue < 0) {
      errors.costEstimated = "Ingresá un costo válido.";
    }
  }

  return errors;
}
