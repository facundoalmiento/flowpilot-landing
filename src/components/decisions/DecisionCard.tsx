import {
  CheckCircle2,
  ChevronRight,
  EllipsisVertical,
  RotateCcw,
  Scale,
  Trash2
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../ui/Badge";
import { DecisionEvaluation, DecisionItem } from "../../types/domain";
import { formatDate, formatRelativeDeadline } from "../../utils/dates";
import {
  formatDecisionCategory,
  formatDecisionNecessity,
  formatDecisionRecommendation,
  formatDecisionStatus,
  formatDecisionUrgency,
  formatMoney
} from "../../utils/format";
import { DecisionSimulation } from "../../features/decisions/decisionEngine";

function getStatusTone(status: DecisionItem["status"]) {
  switch (status) {
    case "approved":
    case "completed":
      return "success";
    case "postponed":
    case "archived":
      return "muted";
    case "rejected":
      return "danger";
    default:
      return "warning";
  }
}

function getUrgencyTone(urgency: DecisionItem["urgency"]) {
  switch (urgency) {
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

interface DecisionCardProps {
  decision: DecisionItem;
  evaluation: DecisionEvaluation;
  simulation: DecisionSimulation;
  projectName?: string | null;
  selectedForCompare: boolean;
  onToggleCompare: (decisionId: string) => void;
  onEdit: (decision: DecisionItem) => void;
  onEvaluate: (decisionId: string) => void;
  onConvert: (decision: DecisionItem) => void;
  onSetStatus: (decisionId: string, status: DecisionItem["status"]) => void;
  onArchive: (decisionId: string) => void;
  onRestore: (decisionId: string) => void;
  onDelete: (decisionId: string) => void;
}

export function DecisionCard({
  decision,
  evaluation,
  simulation,
  projectName,
  selectedForCompare,
  onToggleCompare,
  onEdit,
  onEvaluate,
  onConvert,
  onSetStatus,
  onArchive,
  onRestore,
  onDelete
}: DecisionCardProps) {
  const selectedOption =
    decision.paymentOptions.find((item) => item.id === decision.selectedPaymentOptionId) ??
    decision.paymentOptions[0] ??
    null;

  return (
    <article className="rounded-panel border border-morga-line bg-morga-surface p-4 shadow-soft md:p-5">
      <div className="flex flex-col gap-4 border-b border-morga-line/70 pb-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-2">
              <Badge tone={getStatusTone(decision.status)}>{formatDecisionStatus(decision.status)}</Badge>
              <Badge tone={getUrgencyTone(decision.urgency)}>
                {formatDecisionUrgency(decision.urgency)}
              </Badge>
              <Badge tone="muted">{formatDecisionCategory(decision.category)}</Badge>
              <Badge tone="muted">{formatDecisionNecessity(decision.necessity)}</Badge>
            </div>

            <h3 className="mt-3 text-lg font-semibold leading-tight text-morga-text md:text-xl">
              {decision.name}
            </h3>

            <p className="mt-2 text-sm leading-6 text-morga-muted">
              {decision.description || "Sin descripción adicional."}
            </p>

            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-morga-muted">
              <span>Fecha objetivo: {formatDate(decision.desiredDate)}</span>
              <span>{formatRelativeDeadline(decision.desiredDate)}</span>
              {projectName ? <span>Proyecto: {projectName}</span> : null}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start">
            <Link
              to={`/decisions/${decision.id}`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-morga-dark px-4 py-2 text-sm font-semibold text-white transition hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent"
            >
              Ver decisión
              <ChevronRight className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={() => onEvaluate(decision.id)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-morga-line px-4 py-2 text-sm font-semibold text-morga-text transition hover:bg-morga-surfaceAlt"
            >
              Evaluar
            </button>

            <details className="relative">
              <summary className="flex min-h-[44px] min-w-[44px] cursor-pointer list-none items-center justify-center rounded-full border border-morga-line text-morga-muted transition hover:border-morga-accent hover:text-morga-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent">
                <span className="sr-only">Abrir acciones de la decisión</span>
                <EllipsisVertical className="h-4 w-4" />
              </summary>
              <div className="absolute right-0 top-[calc(100%+0.5rem)] z-10 w-56 rounded-2xl border border-morga-line bg-morga-surface p-2 shadow-panel">
                <button
                  type="button"
                  onClick={() => onEdit(decision)}
                  className="flex min-h-[44px] w-full items-center rounded-xl px-3 text-left text-sm font-semibold text-morga-text transition hover:bg-morga-surfaceAlt"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onSetStatus(decision.id, "approved")}
                  className="flex min-h-[44px] w-full items-center rounded-xl px-3 text-left text-sm font-semibold text-morga-text transition hover:bg-morga-surfaceAlt"
                >
                  Aprobar
                </button>
                <button
                  type="button"
                  onClick={() => onSetStatus(decision.id, "postponed")}
                  className="flex min-h-[44px] w-full items-center rounded-xl px-3 text-left text-sm font-semibold text-morga-text transition hover:bg-morga-surfaceAlt"
                >
                  Posponer
                </button>
                <button
                  type="button"
                  onClick={() => onSetStatus(decision.id, "rejected")}
                  className="flex min-h-[44px] w-full items-center rounded-xl px-3 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50"
                >
                  Descartar
                </button>
                {decision.status === "archived" ? (
                  <button
                    type="button"
                    onClick={() => onRestore(decision.id)}
                    className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-morga-text transition hover:bg-morga-surfaceAlt"
                  >
                    <RotateCcw className="h-4 w-4 text-morga-muted" />
                    Restaurar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => onArchive(decision.id)}
                    className="flex min-h-[44px] w-full items-center rounded-xl px-3 text-left text-sm font-semibold text-morga-text transition hover:bg-morga-surfaceAlt"
                  >
                    Archivar
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(decision.id)}
                  className="flex min-h-[44px] w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-semibold text-red-700 transition hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar
                </button>
              </div>
            </details>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-[18px] border border-morga-line/80 bg-morga-surfaceAlt/45 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
              Costo total
            </p>
            <p className="mt-2 text-sm font-semibold text-morga-text">
              {formatMoney(selectedOption?.totalAmount ?? decision.totalAmount)}
            </p>
          </div>
          <div className="rounded-[18px] border border-morga-line/80 bg-morga-surfaceAlt/45 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
              Recomendación
            </p>
            <p className="mt-2 text-sm font-semibold text-morga-text">
              {formatDecisionRecommendation(evaluation.recommendationCode)}
            </p>
          </div>
          <div className="rounded-[18px] border border-morga-line/80 bg-morga-surfaceAlt/45 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
              Impacto mensual
            </p>
            <p className="mt-2 text-sm font-semibold text-morga-text">
              {selectedOption?.installmentAmount
                ? formatMoney(selectedOption.installmentAmount)
                : "Sin cuotas"}
            </p>
          </div>
          <div
            className="rounded-[18px] border border-morga-line/80 bg-morga-surfaceAlt/45 p-3"
            title="Un puntaje que combina urgencia, impacto y necesidad para ordenar qué mirar primero. Más puntos, más prioridad."
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
              Prioridad
            </p>
            <p className="mt-2 text-sm font-semibold text-morga-text">
              {evaluation.priorityScore} puntos
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto]">
        <div className="rounded-[18px] border border-morga-line bg-morga-surfaceAlt/55 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
            Lectura principal
          </p>
          <p className="mt-2 text-sm leading-6 text-morga-text">{evaluation.explanation}</p>
        </div>

        <div className="rounded-[18px] border border-morga-line bg-morga-surfaceAlt/55 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
            Simulación
          </p>
          <p className="mt-2 text-sm text-morga-text">
            Disponible después: {formatMoney(simulation.availableAfterDecision)}
          </p>
          <p className="mt-1 text-sm text-morga-text">
            Proyección de mes: {formatMoney(simulation.projectedMonthEndAfterDecision)}
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="inline-flex min-h-[44px] items-center gap-3 rounded-[18px] border border-morga-line bg-morga-surface px-4 py-3 text-sm font-semibold text-morga-text">
            <input
              type="checkbox"
              checked={selectedForCompare}
              onChange={() => onToggleCompare(decision.id)}
              className="h-4 w-4 accent-morga-dark"
            />
            Comparar
          </label>

          <button
            type="button"
            onClick={() => onConvert(decision)}
            disabled={decision.status !== "approved" || Boolean(decision.convertedEntity)}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[18px] bg-[#c97d60] px-4 py-3 text-sm font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCircle2 className="h-4 w-4" />
            {decision.convertedEntity ? "Ya convertida" : "Convertir"}
          </button>

          <div
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-[18px] border border-morga-line bg-morga-surface px-4 py-3 text-sm font-semibold text-morga-muted"
            title="Qué tan segura está la app de esta recomendación, según cuántos datos tiene cargados."
          >
            <Scale className="h-4 w-4" />
            Confianza {evaluation.confidenceLabel}
          </div>
        </div>
      </div>
    </article>
  );
}
