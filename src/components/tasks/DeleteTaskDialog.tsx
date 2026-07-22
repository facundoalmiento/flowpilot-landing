import { Task } from "../../types/domain";
import { Modal } from "../ui/Modal";

interface DeleteTaskDialogProps {
  open: boolean;
  task: Task | null;
  onClose: () => void;
  onConfirm: (taskId: string) => void;
}

export function DeleteTaskDialog({
  open,
  task,
  onClose,
  onConfirm
}: DeleteTaskDialogProps) {
  return (
    <Modal
      open={open}
      title="Eliminar tarea"
      description="Esta acción saca la tarea del almacenamiento local."
      onClose={onClose}
    >
      <div className="space-y-5">
        <p className="text-sm leading-7 text-morga-muted">
          {task
            ? `Vas a eliminar “${task.title}”. Confirmá solo si ya no la necesitás.`
            : "Seleccioná una tarea para continuar."}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
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
              if (task) {
                onConfirm(task.id);
                onClose();
              }
            }}
            className="rounded-full bg-red-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
          >
            Eliminar tarea
          </button>
        </div>
      </div>
    </Modal>
  );
}
