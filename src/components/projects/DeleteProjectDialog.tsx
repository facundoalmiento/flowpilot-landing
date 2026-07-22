import { Project } from "../../types/domain";
import { Modal } from "../ui/Modal";

interface ProjectDependencySummary {
  tasksCount: number;
  decisionsCount: number;
  linkedExpensesCount: number;
  linkedInstallmentPlansCount: number;
  linkedReservesCount: number;
}

interface DeleteProjectDialogProps {
  open: boolean;
  project: Project | null;
  summary?: ProjectDependencySummary | null;
  onClose: () => void;
  onConfirm: (projectId: string) => void;
  onArchive?: (projectId: string) => void;
}

export function DeleteProjectDialog({
  open,
  project,
  summary,
  onClose,
  onConfirm,
  onArchive
}: DeleteProjectDialogProps) {
  const hasDependencies = Boolean(
    summary &&
      (summary.tasksCount > 0 ||
        summary.decisionsCount > 0 ||
        summary.linkedExpensesCount > 0 ||
        summary.linkedInstallmentPlansCount > 0 ||
        summary.linkedReservesCount > 0)
  );

  return (
    <Modal
      open={open}
      title="Eliminar proyecto"
      description="La eliminacion es definitiva. Si solo queres sacarlo de la vista principal, conviene archivarlo."
      onClose={onClose}
    >
      <div className="space-y-5">
        <p className="text-sm leading-7 text-morga-muted">
          {project
            ? `Vas a eliminar "${project.name}". Esta accion tambien eliminara sus tareas asociadas y desvinculara las decisiones relacionadas.`
            : "Selecciona un proyecto para continuar."}
        </p>

        {summary ? (
          <div className="rounded-[20px] border border-morga-line bg-morga-surfaceAlt/40 p-4 text-sm text-morga-text">
            <p className="font-semibold">Relaciones detectadas</p>
            <ul className="mt-2 space-y-1 text-morga-muted">
              <li>{summary.tasksCount} tarea(s) asociada(s)</li>
              <li>{summary.decisionsCount} decision(es) asociada(s)</li>
              <li>{summary.linkedExpensesCount} gasto(s) vinculados por decisiones</li>
              <li>{summary.linkedInstallmentPlansCount} plan(es) de cuotas vinculados</li>
              <li>{summary.linkedReservesCount} reserva(s) vinculadas</li>
            </ul>
          </div>
        ) : null}

        {hasDependencies ? (
          <p className="text-sm leading-7 text-morga-muted">
            Recomendacion: archivar primero para conservar el contexto y evitar una eliminacion innecesaria.
          </p>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          {project && onArchive ? (
            <button
              type="button"
              onClick={() => {
                onArchive(project.id);
                onClose();
              }}
              className="rounded-full border border-morga-line px-5 py-3 text-sm font-semibold text-morga-text transition hover:bg-morga-surfaceAlt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent"
            >
              Archivar en su lugar
            </button>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-morga-line px-5 py-3 text-sm font-semibold text-morga-muted transition hover:border-morga-accent hover:text-morga-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={() => {
              if (!project) return;
              onConfirm(project.id);
              onClose();
            }}
            className="rounded-full bg-red-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            Eliminar proyecto
          </button>
        </div>
      </div>
    </Modal>
  );
}
