import { useEffect, useMemo, useState } from "react";
import { Modal } from "../ui/Modal";
import { Task, TaskFormValues } from "../../types/domain";
import {
  emptyTaskForm,
  taskPriorities,
  taskStatuses,
  taskToFormValues,
  validateTaskForm
} from "../../features/tasks/taskForm";
import { formatTaskPriority, formatTaskStatus } from "../../utils/format";

interface TaskFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  task?: Task | null;
  defaultProjectId?: string;
  projects: Array<{ id: string; name: string }>;
  onClose: () => void;
  onSubmit: (taskId: string | null, values: TaskFormValues) => void;
}

function InputField({
  label,
  error,
  children
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-morga-text">{label}</span>
      {children}
      {error ? <span className="text-sm text-red-700">{error}</span> : null}
    </label>
  );
}

const inputClassName =
  "h-11 rounded-2xl border border-morga-line bg-white px-4 text-sm text-morga-text outline-none transition focus:border-morga-accent";
const textareaClassName =
  "min-h-[104px] rounded-2xl border border-morga-line bg-white px-4 py-3 text-sm text-morga-text outline-none transition focus:border-morga-accent";

export function TaskFormModal({
  open,
  mode,
  task,
  defaultProjectId,
  projects,
  onClose,
  onSubmit
}: TaskFormModalProps) {
  const [values, setValues] = useState<TaskFormValues>(emptyTaskForm);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (task) {
      setValues(taskToFormValues(task));
    } else {
      setValues({
        ...emptyTaskForm,
        projectId: defaultProjectId ?? projects[0]?.id ?? ""
      });
    }
    setSubmitted(false);
  }, [defaultProjectId, open, projects, task]);

  const errors = useMemo(
    () => validateTaskForm(values, projects.map((project) => project.id)),
    [projects, values]
  );

  const showError = (field: keyof TaskFormValues) =>
    submitted ? errors[field] : undefined;

  return (
    <Modal
      open={open}
      title={mode === "create" ? "Nueva tarea" : "Editar tarea"}
      description="Completá los datos mínimos para ubicarla bien en la semana y dentro del proyecto."
      onClose={onClose}
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
          if (Object.keys(errors).length > 0) return;
          onSubmit(task?.id ?? null, values);
          onClose();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <InputField label="Título" error={showError("title")}>
            <input
              value={values.title}
              onChange={(event) =>
                setValues((current) => ({ ...current, title: event.target.value }))
              }
              className={inputClassName}
            />
          </InputField>

          <InputField label="Proyecto" error={showError("projectId")}>
            <select
              value={values.projectId}
              onChange={(event) =>
                setValues((current) => ({ ...current, projectId: event.target.value }))
              }
              className={inputClassName}
            >
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </InputField>
        </div>

        <InputField label="Descripción">
          <textarea
            value={values.description}
            onChange={(event) =>
              setValues((current) => ({ ...current, description: event.target.value }))
            }
            className={textareaClassName}
          />
        </InputField>

        <div className="grid gap-4 md:grid-cols-3">
          <InputField label="Estado">
            <select
              value={values.status}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  status: event.target.value as TaskFormValues["status"]
                }))
              }
              className={inputClassName}
            >
              {taskStatuses.map((status) => (
                <option key={status} value={status}>
                  {formatTaskStatus(status)}
                </option>
              ))}
            </select>
          </InputField>

          <InputField label="Prioridad">
            <select
              value={values.priority}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  priority: event.target.value as TaskFormValues["priority"]
                }))
              }
              className={inputClassName}
            >
              {taskPriorities.map((priority) => (
                <option key={priority} value={priority}>
                  {formatTaskPriority(priority)}
                </option>
              ))}
            </select>
          </InputField>

          <InputField label="Fecha límite" error={showError("dueDate")}>
            <input
              type="date"
              value={values.dueDate}
              onChange={(event) =>
                setValues((current) => ({ ...current, dueDate: event.target.value }))
              }
              className={inputClassName}
            />
          </InputField>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <InputField label="Costo estimado" error={showError("estimatedCost")}>
            <input
              inputMode="numeric"
              value={values.estimatedCost}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  estimatedCost: event.target.value
                }))
              }
              placeholder="Ej: 35000"
              className={inputClassName}
            />
          </InputField>

          <label className="flex min-h-[44px] items-center gap-3 rounded-2xl border border-morga-line bg-white px-4 text-sm text-morga-text">
            <input
              type="checkbox"
              checked={values.isNextAction}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  isNextAction: event.target.checked
                }))
              }
              className="h-4 w-4 accent-morga-dark"
            />
            Marcar como próxima acción
          </label>
        </div>

        <div className="flex flex-col gap-3 border-t border-morga-line pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-morga-line px-5 py-3 text-sm font-semibold text-morga-muted transition hover:border-morga-accent hover:text-morga-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-full bg-morga-dark px-5 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent"
          >
            {mode === "create" ? "Crear tarea" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
