import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { DeleteProjectDialog } from "../components/projects/DeleteProjectDialog";
import { ProjectCard } from "../components/projects/ProjectCard";
import { ProjectFiltersBar } from "../components/projects/ProjectFiltersBar";
import { ProjectFormModal } from "../components/projects/ProjectFormModal";
import { EmptyState } from "../components/ui/EmptyState";
import { SectionCard } from "../components/ui/SectionCard";
import { usePlanning } from "../features/planning/usePlanning";
import { filterAndSortProjects } from "../features/projects/projectFilters";
import { getProjectDependencySummary } from "../features/relations/entityIntegrity";
import { Project, ProjectFilters } from "../types/domain";

const defaultFilters: ProjectFilters = {
  search: "",
  category: "Todas",
  priority: "Todas",
  status: "Todas",
  sortBy: "updatedAt"
};

export function ProjectsPage() {
  const {
    store,
    projects,
    tasks,
    createProject,
    updateProject,
    deleteProject,
    archiveProject,
    restoreProject
  } = usePlanning();
  const [filters, setFilters] = useState(defaultFilters);
  const [searchParams, setSearchParams] = useSearchParams();
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [archiveScope, setArchiveScope] = useState<"active" | "archived" | "all">("active");

  const isComposeOpen = searchParams.get("compose") === "1";

  useEffect(() => {
    if (!isComposeOpen) return;
    setFormMode("create");
    setEditingProject(null);
  }, [isComposeOpen]);

  const scopedProjects = useMemo(() => {
    switch (archiveScope) {
      case "archived":
        return projects.filter((project) => project.status === "Archivado");
      case "all":
        return projects;
      case "active":
      default:
        return projects.filter((project) => project.status !== "Archivado");
    }
  }, [archiveScope, projects]);

  const filteredProjects = useMemo(
    () => filterAndSortProjects(scopedProjects, filters),
    [filters, scopedProjects]
  );

  const closeComposer = () => {
    searchParams.delete("compose");
    setSearchParams(searchParams, { replace: true });
    setEditingProject(null);
  };

  return (
    <div className="space-y-4 lg:space-y-5">
      <section className="flex flex-col gap-4 rounded-panel border border-morga-line bg-morga-surface px-5 py-5 shadow-soft md:px-6 md:py-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-morga-muted">
            Proyectos
          </p>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-[-0.02em] text-morga-text md:text-[2rem]">
              Proyectos
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-morga-muted md:text-[15px]">
              Organiza tus pendientes, costos y proximas acciones.
            </p>
          </div>
        </div>

        <div className="flex w-full lg:w-auto lg:justify-end">
          <button
            type="button"
            onClick={() => {
              setFormMode("create");
              setEditingProject(null);
              setSearchParams({ compose: "1" });
            }}
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full bg-morga-dark px-5 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent lg:w-auto"
          >
            <Plus className="h-4 w-4" />
            Nuevo proyecto
          </button>
        </div>
      </section>

      <ProjectFiltersBar filters={filters} onChange={setFilters} />

      <SectionCard
        title="Listado de proyectos"
        description={`Mostrando ${filteredProjects.length} proyecto${filteredProjects.length === 1 ? "" : "s"} segun la vista actual y tus filtros.`}
        action={
          <div className="flex flex-wrap gap-2">
            {[
              { value: "active", label: "Activos" },
              { value: "archived", label: "Archivados" },
              { value: "all", label: "Todos" }
            ].map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  setArchiveScope(option.value as "active" | "archived" | "all")
                }
                className={`min-h-[44px] rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent ${
                  archiveScope === option.value
                    ? "bg-morga-dark text-white"
                    : "border border-morga-line text-morga-text hover:bg-morga-surfaceAlt"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        }
      >
        {filteredProjects.length === 0 ? (
          <EmptyState
            title="No hay proyectos para mostrar"
            description={
              archiveScope === "archived"
                ? "Todavia no archivaste proyectos en este almacenamiento local."
                : "Proba cambiar los filtros o crear uno nuevo. El dashboard se alimenta de lo que cargues aca."
            }
            action={
              archiveScope === "archived" ? null : (
                <button
                  type="button"
                  onClick={() => {
                    setFormMode("create");
                    setEditingProject(null);
                    setSearchParams({ compose: "1" });
                  }}
                  className="rounded-full bg-morga-dark px-5 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent"
                >
                  Crear primer proyecto
                </button>
              )
            }
          />
        ) : (
          <div className="space-y-4">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                tasks={tasks.filter((task) => task.projectId === project.id)}
                onEdit={(current) => {
                  setFormMode("edit");
                  setEditingProject(current);
                  setSearchParams({ compose: "1" });
                }}
                onDelete={setDeleteTarget}
                onRestore={restoreProject}
              />
            ))}
          </div>
        )}
      </SectionCard>

      <ProjectFormModal
        open={isComposeOpen}
        mode={formMode}
        project={editingProject}
        onClose={closeComposer}
        onSubmit={(projectId, values) => {
          if (projectId) {
            updateProject(projectId, values);
            return;
          }
          createProject(values);
        }}
      />

      <DeleteProjectDialog
        open={Boolean(deleteTarget)}
        project={deleteTarget}
        summary={deleteTarget ? getProjectDependencySummary(store, deleteTarget.id) : null}
        onClose={() => setDeleteTarget(null)}
        onArchive={archiveProject}
        onConfirm={deleteProject}
      />
    </div>
  );
}
