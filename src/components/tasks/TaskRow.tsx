import { Link } from "react-router-dom";
import { Pencil, RotateCcw, Star, Trash2, CheckCircle2 } from "lucide-react";
import { Badge } from "../ui/Badge";
import { Project, Task } from "../../types/domain";
import {
  formatDate,
  formatDateTime,
  formatRelativeDeadline
} from "../../utils/dates";
import {
  formatMoney,
  formatTaskPriority,
  formatTaskStatus
} from "../../utils/format";

interface TaskRowProps {
  task: Task;
  project?: Project;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
  onComplete: (taskId: string) => void;
  onReopen: (taskId: string) => void;
  onToggleNextAction: (taskId: string) => void;
  compact?: boolean;
}

function getPriorityTone(task: Task) {
  switch (task.priority) {
    case "critical":
      return "danger";
    case "high":
      return "warning";
    case "medium":
      return "info";
    default:
      return "muted";
  }
}

function getStatusTone(task: Task) {
  switch (task.status) {
    case "completed":
      return "success";
    case "in-progress":
      return "info";
    default:
      return "default";
  }
}

export function TaskRow({
  task,
  project,
  onEdit,
  onDelete,
  onComplete,
  onReopen,
  onToggleNextAction,
  compact = false
}: TaskRowProps) {
  return (
    <article className="rounded-[22px] border border-morga-line bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap gap-2">
            <Badge tone={getStatusTone(task)}>{formatTaskStatus(task.status)}</Badge>
            <Badge tone={getPriorityTone(task)}>{formatTaskPriority(task.priority)}</Badge>
            {task.isNextAction ? <Badge tone="muted">Próxima acción</Badge> : null}
          </div>

          <h3 className="mt-3 text-base font-semibold text-morga-text md:text-lg">
            {task.title}
          </h3>
          {project ? (
            <p className="mt-1 text-sm text-morga-muted">
              <Link
                to={`/projects/${project.id}`}
                className="font-medium text-morga-text underline-offset-4 hover:underline"
              >
                {project.name}
              </Link>
            </p>
          ) : null}
          {task.description ? (
            <p className="mt-2 text-sm leading-6 text-morga-muted">{task.description}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          {task.status === "completed" ? (
            <button
              type="button"
              onClick={() => onReopen(task.id)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-morga-line px-4 py-2 text-sm font-semibold text-morga-text transition hover:border-morga-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent"
            >
              <RotateCcw className="h-4 w-4" />
              Reabrir
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onComplete(task.id)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-morga-dark px-4 py-2 text-sm font-semibold text-white transition hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent"
            >
              <CheckCircle2 className="h-4 w-4" />
              Completar
            </button>
          )}

          <button
            type="button"
            onClick={() => onEdit(task)}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-morga-line px-4 py-2 text-sm font-semibold text-morga-text transition hover:border-morga-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent"
          >
            <Pencil className="h-4 w-4" />
            Editar
          </button>
        </div>
      </div>

      <div className={`mt-4 grid gap-3 ${compact ? "md:grid-cols-2 xl:grid-cols-4" : "md:grid-cols-2 xl:grid-cols-5"}`}>
        <div className="rounded-[18px] border border-morga-line/80 bg-morga-surfaceAlt/45 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
            Fecha límite
          </p>
          <p className="mt-2 text-sm font-semibold text-morga-text">
            {formatDate(task.dueDate)}
          </p>
          <p className="mt-1 text-sm text-morga-muted">
            {formatRelativeDeadline(task.dueDate)}
          </p>
        </div>

        <div className="rounded-[18px] border border-morga-line/80 bg-morga-surfaceAlt/45 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
            Costo estimado
          </p>
          <p className="mt-2 text-sm font-semibold text-morga-text">
            {typeof task.estimatedCost === "number" ? formatMoney(task.estimatedCost) : "Sin costo"}
          </p>
        </div>

        <div className="rounded-[18px] border border-morga-line/80 bg-morga-surfaceAlt/45 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
            Última actualización
          </p>
          <p className="mt-2 text-sm font-semibold text-morga-text">
            {formatDateTime(task.updatedAt)}
          </p>
        </div>

        {task.completedAt ? (
          <div className="rounded-[18px] border border-morga-line/80 bg-morga-surfaceAlt/45 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
              Completada
            </p>
            <p className="mt-2 text-sm font-semibold text-morga-text">
              {formatDateTime(task.completedAt)}
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-2 rounded-[18px] border border-morga-line/80 bg-morga-surfaceAlt/45 p-3">
          <button
            type="button"
            onClick={() => onToggleNextAction(task.id)}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-morga-line px-3 py-2 text-sm font-semibold text-morga-text transition hover:border-morga-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent"
          >
            <Star className="h-4 w-4" />
            {task.isNextAction ? "Quitar próxima acción" : "Marcar próxima acción"}
          </button>
          <button
            type="button"
            onClick={() => onDelete(task)}
            className="inline-flex min-h-[40px] items-center gap-2 rounded-full border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
          >
            <Trash2 className="h-4 w-4" />
            Eliminar
          </button>
        </div>
      </div>
    </article>
  );
}
