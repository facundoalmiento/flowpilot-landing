import { Search } from "lucide-react";
import {
  ProjectCategory,
  ProjectFilters,
  ProjectPriority,
  ProjectStatus
} from "../../types/domain";

const categories: Array<ProjectCategory | "Todas"> = [
  "Todas",
  "Carrera IT",
  "Entrenamiento",
  "Finanzas",
  "Auto",
  "Muebles y proyectos DIY",
  "Viajes",
  "Personal"
];

const priorities: Array<ProjectPriority | "Todas"> = [
  "Todas",
  "Critica",
  "Alta",
  "Media",
  "Baja"
];

const statuses: Array<ProjectStatus | "Todas"> = [
  "Todas",
  "Pendiente",
  "En progreso",
  "Bloqueado",
  "Completado",
  "Archivado"
];

const sortOptions = [
  { value: "updatedAt", label: "Última actualización" },
  { value: "targetDate", label: "Fecha objetivo" },
  { value: "priority", label: "Prioridad" },
  { value: "name", label: "Nombre" },
  { value: "progress", label: "Avance" }
] as const;

interface ProjectFiltersBarProps {
  filters: ProjectFilters;
  onChange: (next: ProjectFilters) => void;
}

function BaseSelect({
  value,
  onChange,
  options,
  ariaLabel
}: {
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<string> | ReadonlyArray<{ value: string; label: string }>;
  ariaLabel: string;
}) {
  return (
    <select
      aria-label={ariaLabel}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full rounded-2xl border border-morga-line bg-white px-4 text-sm font-medium text-morga-text outline-none transition focus:border-morga-accent focus-visible:ring-2 focus-visible:ring-morga-accent/30"
    >
      {options.map((option) => (
        <option
          key={typeof option === "string" ? option : option.value}
          value={typeof option === "string" ? option : option.value}
        >
          {typeof option === "string" ? option : option.label}
        </option>
      ))}
    </select>
  );
}

function hasActiveFilters(filters: ProjectFilters) {
  return (
    filters.search.trim() !== "" ||
    filters.category !== "Todas" ||
    filters.priority !== "Todas" ||
    filters.status !== "Todas" ||
    filters.sortBy !== "updatedAt"
  );
}

export function ProjectFiltersBar({
  filters,
  onChange
}: ProjectFiltersBarProps) {
  const showReset = hasActiveFilters(filters);

  return (
    <div className="rounded-[20px] border border-morga-line bg-white p-4 shadow-soft">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[minmax(0,1.35fr)_repeat(4,minmax(0,1fr))_auto] xl:items-end">
        <label className="block space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
            Buscar
          </span>
          <span className="flex min-h-[44px] items-center gap-3 rounded-2xl border border-morga-line bg-morga-surfaceAlt/45 px-4">
            <Search className="h-4 w-4 shrink-0 text-morga-muted" />
            <input
              aria-label="Buscar"
              value={filters.search}
              onChange={(event) =>
                onChange({ ...filters, search: event.target.value })
              }
              placeholder="Nombre, descripción o próxima acción"
              className="w-full min-w-0 bg-transparent text-sm text-morga-text outline-none placeholder:text-morga-muted"
            />
          </span>
        </label>

        <label className="block space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
            Categoría
          </span>
          <BaseSelect
            value={filters.category}
            onChange={(value) =>
              onChange({
                ...filters,
                category: value as ProjectCategory | "Todas"
              })
            }
            options={categories}
            ariaLabel="Categoría"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
            Prioridad
          </span>
          <BaseSelect
            value={filters.priority}
            onChange={(value) =>
              onChange({
                ...filters,
                priority: value as ProjectPriority | "Todas"
              })
            }
            options={priorities}
            ariaLabel="Prioridad"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
            Estado
          </span>
          <BaseSelect
            value={filters.status}
            onChange={(value) =>
              onChange({
                ...filters,
                status: value as ProjectStatus | "Todas"
              })
            }
            options={statuses}
            ariaLabel="Estado"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
            Ordenar por
          </span>
          <BaseSelect
            value={filters.sortBy}
            onChange={(value) =>
              onChange({
                ...filters,
                sortBy: value as ProjectFilters["sortBy"]
              })
            }
            options={sortOptions}
            ariaLabel="Ordenar por"
          />
        </label>

        {showReset ? (
          <div className="flex xl:justify-end">
            <button
              type="button"
              onClick={() =>
                onChange({
                  search: "",
                  category: "Todas",
                  priority: "Todas",
                  status: "Todas",
                  sortBy: "updatedAt"
                })
              }
              className="min-h-[44px] rounded-2xl border border-morga-line px-4 text-sm font-semibold text-morga-muted transition hover:border-morga-accent hover:text-morga-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent"
            >
              Limpiar filtros
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
