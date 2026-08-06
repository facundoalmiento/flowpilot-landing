import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Plus } from "lucide-react";
import { usePlanning } from "../features/planning/usePlanning";
import { EmptyState } from "../components/ui/EmptyState";
import { Badge } from "../components/ui/Badge";
import { formatDate, formatDateTime, formatRelativeDeadline } from "../utils/dates";
import {
  formatDecisionRecommendation,
  formatDecisionStatus,
  formatMoney
} from "../utils/format";
import { ProjectFormModal } from "../components/projects/ProjectFormModal";
import { DeleteProjectDialog } from "../components/projects/DeleteProjectDialog";
import { TaskFormModal } from "../components/tasks/TaskFormModal";
import { DeleteTaskDialog } from "../components/tasks/DeleteTaskDialog";
import { TaskRow } from "../components/tasks/TaskRow";
import { Task } from "../types/domain";
import { getProjectDependencySummary } from "../features/relations/entityIntegrity";
import { getProjectLinkedFinance } from "../features/relations/entityReferences";
import {
  findNextActionTask,
  getProjectNextActionText
} from "../features/tasks/taskDerivations";

function getStatusTone(status: string) {
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

function getPriorityTone(priority: string) {
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

export function ProjectDetailPage() {
  const navigate = useNavigate();
  const { projectId } = useParams();
  const {
    store,
    projects,
    tasks,
    decisions,
    updateProject,
    archiveProject,
    restoreProject,
    deleteProject,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    reopenTask,
    toggleTaskNextAction
  } = usePlanning();

  const project = projects.find((item) => item.id === projectId) ?? null;
  const projectTasks = useMemo(
    () => tasks.filter((task) => task.projectId === projectId),
    [projectId, tasks]
  );
  const projectDecisions = useMemo(
    () => decisions.items.filter((decision) => decision.projectId === projectId),
    [decisions.items, projectId]
  );
  const linkedFinance = useMemo(
    () =>
      projectId
        ? getProjectLinkedFinance(store, projectId)
        : { expenses: [], installmentPlans: [], reserves: [] },
    [projectId, store]
  );

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [taskModalMode, setTaskModalMode] = useState<"create" | "edit">("create");
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<Task | null>(null);

  if (!project) {
    return (
      <EmptyState
        title="Proyecto no encontrado"
        description="No encontramos ese proyecto dentro del almacenamiento local actual."
        action={
          <Link
            to="/projects"
            className="inline-flex rounded-full bg-morga-dark px-5 py-3 text-sm font-semibold text-white"
          >
            Volver a Proyectos
          </Link>
        }
      />
    );
  }

  const nextTask = findNextActionTask(projectTasks);
  const nextActionText = getProjectNextActionText(project, projectTasks);

  return (
    <div className="space-y-5">
      <section className="rounded-panel border border-morga-line bg-morga-surface p-5 shadow-soft md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <Link
              to="/projects"
              className="text-sm font-semibold text-morga-muted underline-offset-4 hover:underline"
            >
              Volver a Proyectos
            </Link>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone={getStatusTone(project.status)}>{project.status}</Badge>
              <Badge tone={getPriorityTone(project.priority)}>{project.priority}</Badge>
              <Badge tone="muted">{project.category}</Badge>
            </div>
            <h1 className="mt-4 font-display text-4xl font-semibold text-morga-text md:text-5xl">
              {project.name}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-morga-muted">
              {project.description.trim() ? project.description : "Todavía no cargaste una descripción."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <button
              type="button"
              onClick={() => setProjectModalOpen(true)}
              className="rounded-full border border-morga-line px-4 py-3 text-sm font-semibold text-morga-text"
            >
              Editar proyecto
            </button>
            <button
              type="button"
              onClick={() =>
                project.status === "Archivado"
                  ? restoreProject(project.id)
                  : archiveProject(project.id)
              }
              className="rounded-full border border-morga-line px-4 py-3 text-sm font-semibold text-morga-text"
            >
              {project.status === "Archivado" ? "Restaurar" : "Archivar"}
            </button>
            <button
              type="button"
              onClick={() => setDeleteProjectOpen(true)}
              className="rounded-full border border-red-200 px-4 py-3 text-sm font-semibold text-red-700"
            >
              Eliminar
            </button>
            <button
              type="button"
              onClick={() => {
                setTaskModalMode("create");
                setEditingTask(null);
                setTaskModalOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-full bg-morga-dark px-4 py-3 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              Crear tarea
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-[22px] border border-morga-line bg-morga-surface p-4 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
            Fecha objetivo
          </p>
          <p className="mt-2 text-sm font-semibold text-morga-text">
            {formatDate(project.targetDate)}
          </p>
          <p className="mt-1 text-sm text-morga-muted">
            {formatRelativeDeadline(project.targetDate)}
          </p>
        </article>
        <article className="rounded-[22px] border border-morga-line bg-morga-surface p-4 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
            Costo estimado
          </p>
          <p className="mt-2 text-sm font-semibold text-morga-text">
            {typeof project.costEstimated === "number"
              ? formatMoney(project.costEstimated)
              : "Sin costo"}
          </p>
        </article>
        <article className="rounded-[22px] border border-morga-line bg-morga-surface p-4 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
            Progreso
          </p>
          <p className="mt-2 text-sm font-semibold text-morga-text">{project.progress}%</p>
          <div className="mt-2 h-2 rounded-full bg-morga-surfaceAlt">
            <div className="h-2 rounded-full bg-morga-dark" style={{ width: `${project.progress}%` }} />
          </div>
        </article>
        <article className="rounded-[22px] border border-morga-line bg-morga-surface p-4 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
            Próxima acción
          </p>
          <p className="mt-2 text-sm leading-6 text-morga-text">
            {nextActionText || "Todavía no hay próxima acción definida."}
          </p>
        </article>
        <article className="rounded-[22px] border border-morga-line bg-morga-surface p-4 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
            Motivo de bloqueo
          </p>
          <p className="mt-2 text-sm leading-6 text-morga-text">
            {project.blockedReason || "Sin bloqueos activos."}
          </p>
        </article>
        <article className="rounded-[22px] border border-morga-line bg-morga-surface p-4 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
            Última actualización
          </p>
          <p className="mt-2 text-sm font-semibold text-morga-text">
            {formatDateTime(project.updatedAt)}
          </p>
          <p className="mt-1 text-sm text-morga-muted">
            {projectTasks.length} tarea{projectTasks.length === 1 ? "" : "s"} asociada{projectTasks.length === 1 ? "" : "s"}
          </p>
        </article>
      </section>

      <section className="space-y-4">
        <div className="rounded-panel border border-morga-line bg-morga-surface p-5 shadow-soft">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
                Decisiones
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-morga-text">
                Decisiones asociadas
              </h2>
            </div>
            <Link
              to="/decisions"
              className="text-sm font-semibold text-morga-muted underline-offset-4 hover:underline"
            >
              Ir a Decisiones
            </Link>
          </div>
        </div>

        {projectDecisions.length === 0 ? (
          <EmptyState
            title="Sin decisiones vinculadas"
            description="Cuando asocies decisiones de compra o planificación a este proyecto, van a aparecer acá."
          />
        ) : (
          <div className="space-y-3">
            {projectDecisions.map((decision) => (
              <article
                key={decision.id}
                className="rounded-[22px] border border-morga-line bg-morga-surface p-4 shadow-soft"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <Badge tone="muted">{formatDecisionStatus(decision.status)}</Badge>
                      {decision.recommendation ? (
                        <Badge tone="info">
                          {formatDecisionRecommendation(decision.recommendation)}
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-3 text-base font-semibold text-morga-text">
                      {decision.name}
                    </p>
                    <p className="mt-1 text-sm text-morga-muted">
                      {decision.description || "Sin descripción adicional."}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <Link
                      to={`/decisions/${decision.id}`}
                      className="inline-flex min-h-[44px] items-center rounded-full border border-morga-line px-4 py-2 text-sm font-semibold text-morga-text transition hover:bg-morga-surfaceAlt"
                    >
                      Ver decisión
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="rounded-panel border border-morga-line bg-morga-surface p-5 shadow-soft">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
                Finanzas
              </p>
              <h2 className="mt-2 font-display text-3xl font-semibold text-morga-text">
                Operaciones vinculadas
              </h2>
            </div>
            <Link
              to="/finances"
              className="text-sm font-semibold text-morga-muted underline-offset-4 hover:underline"
            >
              Ir a Finanzas
            </Link>
          </div>
        </div>

        {linkedFinance.expenses.length === 0 &&
        linkedFinance.installmentPlans.length === 0 &&
        linkedFinance.reserves.length === 0 ? (
          <EmptyState
            title="Sin operaciones vinculadas"
            description="Cuando una decisión de este proyecto se convierta en gasto, cuotas o reserva, aparecerá acá."
          />
        ) : (
          <div className="grid gap-4 xl:grid-cols-3">
            <article className="rounded-[22px] border border-morga-line bg-morga-surface p-4 shadow-soft">
              <p className="text-sm font-semibold text-morga-text">Gastos relacionados</p>
              <div className="mt-3 space-y-3">
                {linkedFinance.expenses.length === 0 ? (
                  <p className="text-sm text-morga-muted">Sin gastos vinculados.</p>
                ) : (
                  linkedFinance.expenses.map((expense) => (
                    <Link
                      key={expense.id}
                      to={`/finances?tab=movements&highlight=${expense.id}`}
                      className="block rounded-[18px] border border-morga-line bg-morga-surfaceAlt/35 p-3 transition hover:bg-morga-surfaceAlt"
                    >
                      <p className="text-sm font-semibold text-morga-text">{expense.name}</p>
                      <p className="mt-1 text-sm text-morga-muted">
                        {formatMoney(expense.amount)} · {formatDate(expense.dueDate)}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </article>

            <article className="rounded-[22px] border border-morga-line bg-morga-surface p-4 shadow-soft">
              <p className="text-sm font-semibold text-morga-text">Planes de cuotas</p>
              <div className="mt-3 space-y-3">
                {linkedFinance.installmentPlans.length === 0 ? (
                  <p className="text-sm text-morga-muted">Sin cuotas vinculadas.</p>
                ) : (
                  linkedFinance.installmentPlans.map((plan) => (
                    <Link
                      key={plan.id}
                      to={`/finances?tab=cards&highlight=${plan.id}`}
                      className="block rounded-[18px] border border-morga-line bg-morga-surfaceAlt/35 p-3 transition hover:bg-morga-surfaceAlt"
                    >
                      <p className="text-sm font-semibold text-morga-text">{plan.description}</p>
                      <p className="mt-1 text-sm text-morga-muted">
                        {plan.currentInstallment} de {plan.totalInstallments} · {formatMoney(plan.installmentAmount)}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </article>

            <article className="rounded-[22px] border border-morga-line bg-morga-surface p-4 shadow-soft">
              <p className="text-sm font-semibold text-morga-text">Reservas</p>
              <div className="mt-3 space-y-3">
                {linkedFinance.reserves.length === 0 ? (
                  <p className="text-sm text-morga-muted">Sin reservas vinculadas.</p>
                ) : (
                  linkedFinance.reserves.map((reserve) => (
                    <Link
                      key={reserve.id}
                      to={`/finances?tab=reserves&highlight=${reserve.id}`}
                      className="block rounded-[18px] border border-morga-line bg-morga-surfaceAlt/35 p-3 transition hover:bg-morga-surfaceAlt"
                    >
                      <p className="text-sm font-semibold text-morga-text">{reserve.name}</p>
                      <p className="mt-1 text-sm text-morga-muted">
                        {formatMoney(reserve.savedAmount)} de {formatMoney(reserve.targetAmount)}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </article>
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex flex-col gap-2 rounded-panel border border-morga-line bg-morga-surface p-5 shadow-soft md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
              Tareas
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-morga-text">
              Tareas asociadas
            </h2>
            {nextTask ? (
              <p className="mt-2 text-sm text-morga-muted">
                Próxima acción marcada: {nextTask.title}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => {
              setTaskModalMode("create");
              setEditingTask(null);
              setTaskModalOpen(true);
            }}
            className="rounded-full bg-morga-dark px-5 py-3 text-sm font-semibold text-white"
          >
            Crear tarea asociada
          </button>
        </div>

        {projectTasks.length === 0 ? (
          <EmptyState
            title="Todavía no hay tareas"
            description="Creá la primera tarea para empezar a mover el progreso del proyecto automáticamente."
          />
        ) : (
          <div className="space-y-4">
            {projectTasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                project={project}
                onEdit={(current) => {
                  setTaskModalMode("edit");
                  setEditingTask(current);
                  setTaskModalOpen(true);
                }}
                onDelete={setDeleteTaskTarget}
                onComplete={completeTask}
                onReopen={reopenTask}
                onToggleNextAction={toggleTaskNextAction}
              />
            ))}
          </div>
        )}
      </section>

      <ProjectFormModal
        open={projectModalOpen}
        mode="edit"
        project={project}
        onClose={() => setProjectModalOpen(false)}
        onSubmit={(projectId, values) => {
          if (!projectId) return;
          updateProject(projectId, values);
        }}
      />

      <TaskFormModal
        open={taskModalOpen}
        mode={taskModalMode}
        task={editingTask}
        defaultProjectId={project.id}
        projects={projects.map((item) => ({ id: item.id, name: item.name }))}
        onClose={() => setTaskModalOpen(false)}
        onSubmit={(taskId, values) => {
          if (taskId) {
            updateTask(taskId, values);
            return;
          }
          createTask(values);
        }}
      />

      <DeleteTaskDialog
        open={Boolean(deleteTaskTarget)}
        task={deleteTaskTarget}
        onClose={() => setDeleteTaskTarget(null)}
        onConfirm={deleteTask}
      />

      <DeleteProjectDialog
        open={deleteProjectOpen}
        project={project}
        summary={getProjectDependencySummary(store, project.id)}
        onClose={() => setDeleteProjectOpen(false)}
        onArchive={archiveProject}
        onConfirm={(nextProjectId) => {
          deleteProject(nextProjectId);
          navigate("/projects");
        }}
      />
    </div>
  );
}
