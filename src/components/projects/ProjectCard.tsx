import {
  CalendarDays,
  ChevronRight,
  EllipsisVertical,
  Pencil,
  RotateCcw,
  Trash2
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../ui/Badge";
import { Project, Task } from "../../types/domain";
import { formatDate, formatRelativeDeadline } from "../../utils/dates";
import { formatMoney } from "../../utils/format";
import {
  findNextActionTask,
  getProjectNextActionText
} from "../../features/tasks/taskDerivations";

interface ProjectCardProps {
  project: Project;
  tasks: Task[];
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
  onRestore?: (projectId: string) => void;
}

function getStatusTone(status: Project["status"]) {
  switch (status) {
    case "Completado":
      return "success";
    case "Bloqueado":
      return "danger";
    case "En progreso":
      return "info";
    case "Archivado":
      return "muted";
    default:
      return "warning";
  }
}

function getPriorityTone(priority: Project["priority"]) {
  switch (priority) {
    case "Critica":
      return "danger";
    case "Alta":
      return "warning";
    case "Media":
      return "info";
    default:
      return "muted";
  }
}

export function ProjectCard({
  project,
  tasks,
  onEdit,
  onDelete,
  onRestore
}: ProjectCardProps) {
  const pendingTasks = tasks.filter((task) => task.status !== "completed").length;
  const nextTask = findNextActionTask(tasks);
  const hasTargetDate = Boolean(project.targetDate);
  const hasEstimatedCost = project.costEstimated !== null;
  const nextActionText = getProjectNextActionText(project, tasks);
  const hasNextAction = nextActionText.trim() !== "";
  const hasBlockedReason = project.blockedReason.trim() !== "";

  return (
    <article className="rounded-panel border border-morga-line bg-white p-4 shadow-soft md:p-5">
      <div className="flex flex-col gap-4 border-b border-morga-line/70 pb-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              <Badge tone={getStatusTone(project.status)}>{project.status}</Badge>
              <Badge tone={getPriorityTone(project.priority)}>{project.priority}</Badge>
              <Badge tone="muted">{project.category}</Badge>
            </div>

            <h3 className="mt-3 text-lg font-semibold leading-tight text-morga-text md:text-xl">
              {project.name}
            </h3>

            <p className="mt-2 text-sm font-medium text-morga-text">Próxima acción</p>
            <p className="mt-1 text-sm leading-6 text-morga-muted">
              {hasNextAction ? nextActionText : "Todavía no definiste una próxima acción."}
            </p>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-morga-muted">
              {project.description}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start">
            <Link
              to={`/projects/${project.id}`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-morga-dark px-4 py-2 text-sm font-semibold text-white transition hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent"
            >
              Ver proyecto
              <ChevronRight className="h-4 w-4" />
            </Link>

            <details className="relative">
              <summary className="flex min-h-[44px] min-w-[44px] cursor-pointer list-none items-center justify-center rounded-full border border-morga-line text-morga-muted transition hover:border-morga-accent hover:text-morga-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent">
                <span className="sr-only">Abrir acciones del proyecto</span>
                <EllipsisVertical className="h-4 w-4" />
              </summary>
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-10 w-48 rounded-2xl border border-morga-line bg-white p-2 shadow-panel">
                <button
                  type="button"
                  onClick={() => onEdit(project)}
                  className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-morga-text transition hover:bg-morga-surfaceAlt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent"
                >
                  <Pencil className="h-4 w-4 text-morga-muted" />
                  Editar
                </button>
                {project.status === "Archivado" && onRestore ? (
                  <button
                    type="button"
                    onClick={() => onRestore(project.id)}
                    className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-morga-text transition hover:bg-morga-surfaceAlt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent"
                  >
                    <RotateCcw className="h-4 w-4 text-morga-muted" />
                    Restaurar
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => onDelete(project)}
                  className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-300"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </button>
              </div>
            </details>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {hasTargetDate ? (
            <div className="rounded-[18px] border border-morga-line/80 bg-morga-surfaceAlt/45 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
                Fecha objetivo
              </p>
              <p className="mt-2 text-sm font-semibold text-morga-text">
                {formatDate(project.targetDate)}
              </p>
              <p className="mt-1 text-sm text-morga-muted">
                {formatRelativeDeadline(project.targetDate)}
              </p>
            </div>
          ) : null}

          <div className="rounded-[18px] border border-morga-line/80 bg-morga-surfaceAlt/45 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
              Avance
            </p>
            <p className="mt-2 text-sm font-semibold text-morga-text">
              {project.progress}%
            </p>
            <div
              className="mt-2 h-2 rounded-full bg-white"
              role="progressbar"
              aria-label={`Avance del proyecto: ${project.progress}%`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={project.progress}
            >
              <div
                className="h-2 rounded-full bg-morga-dark"
                style={{ width: `${project.progress}%` }}
              />
            </div>
          </div>

          {hasEstimatedCost ? (
            <div className="rounded-[18px] border border-morga-line/80 bg-morga-surfaceAlt/45 p-3">
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
                Costo estimado
              </p>
              <p className="mt-2 text-sm font-semibold text-morga-text">
                {formatMoney(project.costEstimated!)}
              </p>
            </div>
          ) : null}

          <div className="rounded-[18px] border border-morga-line/80 bg-morga-surfaceAlt/45 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
              Tareas
            </p>
            <p className="mt-2 text-sm font-semibold text-morga-text">
              {tasks.length > 0 ? `${tasks.length} cargadas` : "Sin tareas cargadas"}
            </p>
            <p className="mt-1 text-sm text-morga-muted">
              {pendingTasks > 0 ? `${pendingTasks} abiertas` : "No quedan tareas abiertas"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_auto_auto] xl:items-start">
        {nextTask ? (
          <div className="rounded-[18px] border border-morga-line bg-morga-surfaceAlt/55 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
              Siguiente tarea marcada
            </p>
            <p className="mt-2 text-sm leading-6 text-morga-text">{nextTask.title}</p>
          </div>
        ) : null}

        {hasBlockedReason ? (
          <div className="rounded-[18px] border border-morga-line bg-morga-surfaceAlt/55 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
              Bloqueo
            </p>
            <p className="mt-2 text-sm leading-6 text-morga-text">
              {project.blockedReason}
            </p>
          </div>
        ) : null}

        <div className="rounded-[18px] border border-morga-line bg-morga-surfaceAlt/55 p-4 xl:min-w-[220px]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
            Última actualización
          </p>
          <p className="mt-2 text-sm font-semibold text-morga-text">
            {formatDate(project.updatedAt.slice(0, 10))}
          </p>
          {hasTargetDate ? (
            <div className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-morga-accent">
              <CalendarDays className="h-4 w-4" />
              <span>{formatRelativeDeadline(project.targetDate)}</span>
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
