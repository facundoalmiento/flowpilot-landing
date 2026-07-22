import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { Task } from "../types/domain";
import { usePlanning } from "../features/planning/usePlanning";
import { EmptyState } from "../components/ui/EmptyState";
import { TaskFormModal } from "../components/tasks/TaskFormModal";
import { DeleteTaskDialog } from "../components/tasks/DeleteTaskDialog";
import { TaskRow } from "../components/tasks/TaskRow";
import { filterTasksForWeekView, getWeekSections } from "../features/tasks/taskSelectors";
import { formatTaskPriority } from "../utils/format";

const defaultFilters = {
  projectId: "all",
  category: "Todas" as const,
  priority: "all" as const,
  showCompleted: false
};

function WeekSection({
  title,
  tasks,
  children
}: {
  title: string;
  tasks: Task[];
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="border-b border-morga-line/70 pb-3">
        <h2 className="font-display text-3xl font-semibold text-morga-text">{title}</h2>
        <p className="mt-1 text-sm text-morga-muted">
          {tasks.length} tarea{tasks.length === 1 ? "" : "s"}
        </p>
      </div>
      {children}
    </section>
  );
}

export function WeekPage() {
  const {
    projects,
    tasks,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    reopenTask,
    toggleTaskNextAction
  } = usePlanning();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState(defaultFilters);
  const [taskModalMode, setTaskModalMode] = useState<"create" | "edit">("create");
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTaskTarget, setDeleteTaskTarget] = useState<Task | null>(null);
  const [feedback, setFeedback] = useState("");
  const isComposeOpen = searchParams.get("compose") === "1";

  useEffect(() => {
    if (!isComposeOpen) return;
    setTaskModalMode("create");
    setEditingTask(null);
  }, [isComposeOpen]);

  const closeComposer = () => {
    searchParams.delete("compose");
    setSearchParams(searchParams, { replace: true });
  };

  const visibleTasks = useMemo(
    () => filterTasksForWeekView(tasks, projects, filters),
    [filters, projects, tasks]
  );
  const sections = useMemo(
    () => getWeekSections(visibleTasks, projects),
    [projects, visibleTasks]
  );
  const completedTasks = useMemo(
    () =>
      visibleTasks.filter((task) => task.status === "completed").sort((a, b) =>
        (b.completedAt ?? "").localeCompare(a.completedAt ?? "")
      ),
    [visibleTasks]
  );

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 rounded-panel border border-morga-line bg-white px-5 py-5 shadow-soft md:px-6 md:py-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-morga-muted">
            Planificación
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-morga-text md:text-5xl">
            Mi semana
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-morga-muted">
            Una vista clara para resolver primero lo vencido, lo urgente y lo próximo.
          </p>
        </div>

          <button
            type="button"
            onClick={() => {
              setTaskModalMode("create");
              setEditingTask(null);
              setSearchParams({ compose: "1" });
            }}
          className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-morga-dark px-5 py-3 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Nueva tarea
        </button>
      </section>

      <div className="sr-only" aria-live="polite">
        {feedback}
      </div>

      <section className="rounded-panel border border-morga-line bg-white p-4 shadow-soft md:p-5">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.2fr)_repeat(2,minmax(0,1fr))_auto] xl:items-end">
          <label className="grid gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
              Proyecto
            </span>
            <select
              value={filters.projectId}
              onChange={(event) =>
                setFilters((current) => ({ ...current, projectId: event.target.value }))
              }
              className="h-11 rounded-2xl border border-morga-line bg-white px-4 text-sm text-morga-text"
            >
              <option value="all">Todos</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
              Categoría
            </span>
            <select
              value={filters.category}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  category: event.target.value as typeof current.category
                }))
              }
              className="h-11 rounded-2xl border border-morga-line bg-white px-4 text-sm text-morga-text"
            >
              <option value="Todas">Todas</option>
              {[...new Set(projects.map((project) => project.category))].map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
              Prioridad
            </span>
            <select
              value={filters.priority}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  priority: event.target.value as typeof current.priority
                }))
              }
              className="h-11 rounded-2xl border border-morga-line bg-white px-4 text-sm text-morga-text"
            >
              <option value="all">Todas</option>
              <option value="critical">{formatTaskPriority("critical")}</option>
              <option value="high">{formatTaskPriority("high")}</option>
              <option value="medium">{formatTaskPriority("medium")}</option>
              <option value="low">{formatTaskPriority("low")}</option>
            </select>
          </label>

          <label className="flex min-h-[44px] items-center gap-3 rounded-2xl border border-morga-line bg-white px-4 text-sm text-morga-text">
            <input
              type="checkbox"
              checked={filters.showCompleted}
              onChange={(event) =>
                setFilters((current) => ({ ...current, showCompleted: event.target.checked }))
              }
              className="h-4 w-4 accent-morga-dark"
            />
            Mostrar completadas
          </label>
        </div>
      </section>

      <WeekSection title="Vencidas" tasks={sections.overdue}>
        {sections.overdue.length === 0 ? (
          <EmptyState
            title="Nada vencido"
            description="No hay tareas pendientes con fecha pasada en los filtros actuales."
          />
        ) : (
          <div className="space-y-4">
            {sections.overdue.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                project={projects.find((project) => project.id === task.projectId)}
                onEdit={(current) => {
                  setTaskModalMode("edit");
                  setEditingTask(current);
                  setTaskModalOpen(true);
                }}
                onDelete={setDeleteTaskTarget}
                onComplete={completeTask}
                onReopen={reopenTask}
                onToggleNextAction={toggleTaskNextAction}
                compact
              />
            ))}
          </div>
        )}
      </WeekSection>

      <WeekSection title="Hoy" tasks={sections.today}>
        {sections.today.length === 0 ? (
          <EmptyState
            title="Nada para hoy"
            description="No hay tareas que venzan hoy ni próximas acciones destacadas."
          />
        ) : (
          <div className="space-y-4">
            {sections.today.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                project={projects.find((project) => project.id === task.projectId)}
                onEdit={(current) => {
                  setTaskModalMode("edit");
                  setEditingTask(current);
                  setTaskModalOpen(true);
                }}
                onDelete={setDeleteTaskTarget}
                onComplete={completeTask}
                onReopen={reopenTask}
                onToggleNextAction={toggleTaskNextAction}
                compact
              />
            ))}
          </div>
        )}
      </WeekSection>

      <WeekSection title="Esta semana" tasks={sections.thisWeek}>
        {sections.thisWeek.length === 0 ? (
          <EmptyState
            title="Sin pendientes para esta semana"
            description="Las tareas que quedan en los filtros actuales no vencen dentro de los próximos siete días."
          />
        ) : (
          <div className="space-y-4">
            {sections.thisWeek.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                project={projects.find((project) => project.id === task.projectId)}
                onEdit={(current) => {
                  setTaskModalMode("edit");
                  setEditingTask(current);
                  setTaskModalOpen(true);
                }}
                onDelete={setDeleteTaskTarget}
                onComplete={completeTask}
                onReopen={reopenTask}
                onToggleNextAction={toggleTaskNextAction}
                compact
              />
            ))}
          </div>
        )}
      </WeekSection>

      <WeekSection title="Sin fecha" tasks={sections.noDate}>
        {sections.noDate.length === 0 ? (
          <EmptyState
            title="Sin tareas abiertas sin fecha"
            description="Todas las tareas visibles tienen fecha o ya quedaron cerradas."
          />
        ) : (
          <div className="space-y-4">
            {sections.noDate.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                project={projects.find((project) => project.id === task.projectId)}
                onEdit={(current) => {
                  setTaskModalMode("edit");
                  setEditingTask(current);
                  setTaskModalOpen(true);
                }}
                onDelete={setDeleteTaskTarget}
                onComplete={completeTask}
                onReopen={reopenTask}
                onToggleNextAction={toggleTaskNextAction}
                compact
              />
            ))}
          </div>
        )}
      </WeekSection>

      {filters.showCompleted ? (
        <WeekSection title="Completadas" tasks={completedTasks}>
          {completedTasks.length === 0 ? (
            <EmptyState
              title="Sin completadas"
              description="No hay tareas resueltas en los filtros actuales."
            />
          ) : (
            <div className="space-y-4">
              {completedTasks.map((task) => (
                <TaskRow
                  key={task.id}
                  task={task}
                  project={projects.find((project) => project.id === task.projectId)}
                  onEdit={(current) => {
                    setTaskModalMode("edit");
                    setEditingTask(current);
                    setTaskModalOpen(true);
                  }}
                  onDelete={setDeleteTaskTarget}
                  onComplete={completeTask}
                  onReopen={reopenTask}
                  onToggleNextAction={toggleTaskNextAction}
                  compact
                />
              ))}
            </div>
          )}
        </WeekSection>
      ) : null}

      <TaskFormModal
        open={taskModalOpen || isComposeOpen}
        mode={taskModalMode}
        task={editingTask}
        projects={projects.map((project) => ({ id: project.id, name: project.name }))}
        onClose={() => {
          setTaskModalOpen(false);
          closeComposer();
        }}
        onSubmit={(taskId, values) => {
          if (taskId) {
            updateTask(taskId, values);
            setFeedback("Tarea actualizada.");
            return;
          }
          createTask(values);
          setFeedback("Tarea creada.");
        }}
      />

      <DeleteTaskDialog
        open={Boolean(deleteTaskTarget)}
        task={deleteTaskTarget}
        onClose={() => setDeleteTaskTarget(null)}
        onConfirm={deleteTask}
      />
    </div>
  );
}
