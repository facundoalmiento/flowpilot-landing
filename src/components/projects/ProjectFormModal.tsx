import { useEffect, useMemo, useState } from "react";
import {
  Project,
  ProjectCategory,
  ProjectPriority,
  ProjectStatus
} from "../../types/domain";
import {
  emptyProjectForm,
  projectToFormValues,
  validateProject
} from "../../features/projects/projectForm";
import { Modal } from "../ui/Modal";

const categories: ProjectCategory[] = [
  "Carrera IT",
  "Entrenamiento",
  "Finanzas",
  "Auto",
  "Muebles y proyectos DIY",
  "Viajes",
  "Personal"
];

const priorities: ProjectPriority[] = ["Critica", "Alta", "Media", "Baja"];
const statuses: ProjectStatus[] = [
  "Pendiente",
  "En progreso",
  "Bloqueado",
  "Completado",
  "Archivado"
];

interface ProjectFormModalProps {
  open: boolean;
  mode: "create" | "edit";
  project?: Project | null;
  onClose: () => void;
  onSubmit: (projectId: string | null, values: typeof emptyProjectForm) => void;
}

function InputField({
  label,
  error,
  hint,
  children
}: {
  label: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-morga-text">{label}</span>
      {children}
      {error ? (
        <span className="text-sm text-red-700">{error}</span>
      ) : hint ? (
        <span className="text-xs text-morga-muted">{hint}</span>
      ) : null}
    </label>
  );
}

const inputClassName =
  "h-11 rounded-2xl border border-morga-line bg-white px-4 text-sm text-morga-text outline-none transition focus:border-morga-accent";
const textareaClassName =
  "min-h-[104px] rounded-2xl border border-morga-line bg-white px-4 py-3 text-sm text-morga-text outline-none transition focus:border-morga-accent";

export function ProjectFormModal({
  open,
  mode,
  project,
  onClose,
  onSubmit
}: ProjectFormModalProps) {
  const [values, setValues] = useState(emptyProjectForm);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(project ? projectToFormValues(project) : emptyProjectForm);
    setSubmitted(false);
  }, [open, project]);

  const errors = useMemo(() => validateProject(values), [values]);

  const showError = (field: keyof typeof values) =>
    submitted ? errors[field] : undefined;

  return (
    <Modal
      open={open}
      title={mode === "create" ? "Nuevo proyecto" : "Editar proyecto"}
      description="Completá los datos clave para que el dashboard pueda priorizarlo, alertarte y guardarlo en local."
      onClose={onClose}
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
          if (Object.keys(errors).length > 0) return;
          onSubmit(project?.id ?? null, values);
          onClose();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <InputField label="Nombre" error={showError("name")}>
            <input
              value={values.name}
              placeholder="Ej: Terminar el portfolio"
              onChange={(event) =>
                setValues((current) => ({ ...current, name: event.target.value }))
              }
              className={inputClassName}
            />
          </InputField>

          <InputField label="Categoría">
            <select
              value={values.category}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  category: event.target.value as ProjectCategory
                }))
              }
              className={inputClassName}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </InputField>
        </div>

        <InputField label="Descripción" error={showError("description")}>
          <textarea
            value={values.description}
            placeholder="En pocas palabras, de que se trata este proyecto."
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                description: event.target.value
              }))
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
                  status: event.target.value as ProjectStatus
                }))
              }
              className={inputClassName}
            >
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
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
                  priority: event.target.value as ProjectPriority
                }))
              }
              className={inputClassName}
            >
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </InputField>

          <InputField
            label="Fecha objetivo"
            error={showError("targetDate")}
            hint="Opcional. Para cuando te gustaria tenerlo resuelto."
          >
            <input
              type="date"
              value={values.targetDate}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  targetDate: event.target.value
                }))
              }
              className={inputClassName}
            />
          </InputField>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <InputField
            label="Costo estimado"
            error={showError("costEstimated")}
            hint="Opcional. Cuanto pensas que te va a costar en total."
          >
            <input
              inputMode="numeric"
              value={values.costEstimated}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  costEstimated: event.target.value
                }))
              }
              placeholder="Ej: 45000"
              className={inputClassName}
            />
          </InputField>

          <InputField label={`Avance (${values.progress}%)`} error={showError("progress")}>
            <input
              type="range"
              min={0}
              max={100}
              step={1}
              value={values.progress}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  progress: Number(event.target.value)
                }))
              }
              className="accent-morga-dark"
            />
          </InputField>
        </div>

        <InputField
          label="Próxima acción"
          error={showError("nextAction")}
          hint="Lo primero y mas concreto que hay que hacer para avanzar. Ej: Pedir tres presupuestos."
        >
          <textarea
            value={values.nextAction}
            placeholder="Ej: Pedir tres presupuestos"
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                nextAction: event.target.value
              }))
            }
            className={textareaClassName}
          />
        </InputField>

        <InputField label="Motivo de bloqueo" error={showError("blockedReason")}>
          <textarea
            value={values.blockedReason}
            onChange={(event) =>
              setValues((current) => ({
                ...current,
                blockedReason: event.target.value
              }))
            }
            placeholder="Solo es obligatorio si el proyecto está bloqueado."
            className={textareaClassName}
          />
        </InputField>

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
            {mode === "create" ? "Crear proyecto" : "Guardar cambios"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
