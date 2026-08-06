import { Link, useParams } from "react-router-dom";
import { useMemo } from "react";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { SectionCard } from "../components/ui/SectionCard";
import { usePlanning } from "../features/planning/usePlanning";
import {
  evaluateDecision as evaluateDecisionWithRules,
  simulateDecision
} from "../features/decisions/decisionEngine";
import {
  findTaskBySourceDecisionId
} from "../features/relations/entityReferences";
import { formatDate, formatDateTime, formatRelativeDeadline } from "../utils/dates";
import {
  formatDecisionCategory,
  formatDecisionImpact,
  formatDecisionNecessity,
  formatDecisionPaymentOptionType,
  formatDecisionRecommendation,
  formatDecisionStatus,
  formatDecisionUrgency,
  formatMoney
} from "../utils/format";
import { DecisionItem } from "../types/domain";

function getStatusTone(status: DecisionItem["status"]) {
  switch (status) {
    case "approved":
    case "completed":
      return "success";
    case "rejected":
      return "danger";
    case "postponed":
    case "archived":
      return "muted";
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

export function DecisionDetailPage() {
  const { decisionId } = useParams();
  const {
    store,
    projects,
    tasks,
    finance,
    decisions,
    evaluateDecision,
    setDecisionStatus,
    convertDecision,
    createTaskFromDecision
  } = usePlanning();

  const decision = decisions.items.find((item) => item.id === decisionId) ?? null;

  const evaluation = useMemo(() => {
    if (!decision) return null;
    return (
      decision.evaluation ??
      evaluateDecisionWithRules(decision, finance, decisions.rulesConfig, projects, tasks)
    );
  }, [decision, finance, decisions.rulesConfig, projects, tasks]);

  const simulation = useMemo(() => {
    if (!decision) return null;
    return simulateDecision(decision, finance, decisions.rulesConfig);
  }, [decision, finance, decisions.rulesConfig]);

  if (!decision || !evaluation || !simulation) {
    return (
      <EmptyState
        title="Decisión no encontrada"
        description="No encontramos esa decisión en el almacenamiento local actual."
        action={
          <Link
            to="/decisions"
            className="inline-flex rounded-full bg-morga-dark px-5 py-3 text-sm font-semibold text-white"
          >
            Volver a Decisiones
          </Link>
        }
      />
    );
  }

  const project = decision.projectId
    ? projects.find((item) => item.id === decision.projectId) ?? null
    : null;
  const relatedTask = findTaskBySourceDecisionId(store, decision.id);
  const convertedEntity = decision.convertedEntity;
  const relatedExpense = convertedEntity?.expenseId
    ? finance.expenses.find((item) => item.id === convertedEntity.expenseId) ?? null
    : null;
  const relatedPlan = convertedEntity?.installmentPlanId
    ? finance.installmentPlans.find((item) => item.id === convertedEntity.installmentPlanId) ?? null
    : null;
  const relatedReserve = convertedEntity?.reserveId
    ? finance.reserves.find((item) => item.id === convertedEntity.reserveId) ?? null
    : null;

  const optionEvaluations = decision.paymentOptions.map((option) => {
    const simulatedDecision = { ...decision, selectedPaymentOptionId: option.id };
    return {
      option,
      evaluation: evaluateDecisionWithRules(
        simulatedDecision,
        finance,
        decisions.rulesConfig,
        projects,
        tasks
      ),
      simulation: simulateDecision(simulatedDecision, finance, decisions.rulesConfig),
      selected: decision.selectedPaymentOptionId === option.id
    };
  });

  const handleCreateTask = () => {
    if (!decision.projectId) {
      window.alert("Asociá primero la decisión a un proyecto para crear una tarea.");
      return;
    }

    const title = window.prompt(
      "Escribí el título de la tarea que querés crear desde esta decisión.",
      `Revisar siguiente paso de ${decision.name}`
    );
    if (!title?.trim()) return;

    const confirmed = window.confirm(
      `Se va a crear una tarea en ${project?.name ?? "el proyecto asociado"} con el título "${title.trim()}". ¿Querés continuar?`
    );
    if (!confirmed) return;

    createTaskFromDecision(decision.id, title.trim());
  };

  const handleConvert = () => {
    if (decision.status !== "approved") {
      window.alert("Primero aprobá la decisión para convertirla.");
      return;
    }

    const confirmed = window.confirm(
      `Se va a convertir "${decision.name}" en una operación financiera real. ¿Querés continuar?`
    );
    if (!confirmed) return;

    convertDecision(decision.id);
  };

  return (
    <div className="space-y-5">
      <section className="rounded-panel border border-morga-line bg-morga-surface p-5 shadow-soft md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <Link
              to="/decisions"
              className="text-sm font-semibold text-morga-muted underline-offset-4 hover:underline"
            >
              Volver a Decisiones
            </Link>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge tone={getStatusTone(decision.status)}>{formatDecisionStatus(decision.status)}</Badge>
              <Badge tone={getUrgencyTone(decision.urgency)}>{formatDecisionUrgency(decision.urgency)}</Badge>
              <Badge tone="muted">{formatDecisionCategory(decision.category)}</Badge>
              <Badge tone="muted">{formatDecisionNecessity(decision.necessity)}</Badge>
            </div>
            <h1 className="mt-4 font-display text-4xl font-semibold text-morga-text md:text-5xl">
              {decision.name}
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-morga-muted">
              {decision.description || "Sin descripción adicional."}
            </p>
            <p className="mt-4 text-sm text-morga-muted">
              Esta recomendación es una regla de planificación personal basada en tus datos cargados. No reemplaza asesoramiento financiero profesional.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 lg:justify-end">
            <button type="button" onClick={() => evaluateDecision(decision.id)} className="rounded-full border border-morga-line px-4 py-3 text-sm font-semibold text-morga-text">
              Reevaluar
            </button>
            <button type="button" onClick={() => setDecisionStatus(decision.id, "approved")} className="rounded-full border border-morga-line px-4 py-3 text-sm font-semibold text-morga-text">
              Aprobar
            </button>
            <button type="button" onClick={() => setDecisionStatus(decision.id, "postponed")} className="rounded-full border border-morga-line px-4 py-3 text-sm font-semibold text-morga-text">
              Posponer
            </button>
            <button type="button" onClick={handleConvert} disabled={decision.status !== "approved" || Boolean(decision.convertedEntity)} className="rounded-full bg-morga-dark px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">
              {decision.convertedEntity ? "Ya convertida" : "Convertir"}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-[22px] border border-morga-line bg-morga-surface p-4 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">Recomendación</p>
          <p className="mt-2 text-sm font-semibold text-morga-text">{formatDecisionRecommendation(evaluation.recommendationCode)}</p>
          <p className="mt-1 text-sm text-morga-muted">{evaluation.confidenceLabel} confianza</p>
        </article>
        <article className="rounded-[22px] border border-morga-line bg-morga-surface p-4 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">Fecha objetivo</p>
          <p className="mt-2 text-sm font-semibold text-morga-text">{formatDate(decision.desiredDate)}</p>
          <p className="mt-1 text-sm text-morga-muted">{formatRelativeDeadline(decision.desiredDate)}</p>
        </article>
        <article className="rounded-[22px] border border-morga-line bg-morga-surface p-4 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">Disponible después</p>
          <p className="mt-2 text-sm font-semibold text-morga-text">{formatMoney(simulation.availableAfterDecision)}</p>
        </article>
        <article className="rounded-[22px] border border-morga-line bg-morga-surface p-4 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">Proyección de mes</p>
          <p className="mt-2 text-sm font-semibold text-morga-text">{formatMoney(simulation.projectedMonthEndAfterDecision)}</p>
        </article>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="space-y-5">
          <SectionCard title="Lectura general" description={evaluation.explanation}>
            <div className="grid gap-4 md:grid-cols-2">
              <article className="rounded-[20px] border border-morga-line bg-morga-surfaceAlt/35 p-4">
                <p className="text-sm font-semibold text-morga-text">Razones</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-morga-muted">
                  {evaluation.reasons.map((reason) => (
                    <li key={reason}>• {reason}</li>
                  ))}
                </ul>
              </article>
              <article className="rounded-[20px] border border-morga-line bg-morga-surfaceAlt/35 p-4">
                <p className="text-sm font-semibold text-morga-text">Advertencias</p>
                {evaluation.warnings.length === 0 ? (
                  <p className="mt-3 text-sm text-morga-muted">Sin advertencias relevantes.</p>
                ) : (
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-morga-muted">
                    {evaluation.warnings.map((warning) => (
                      <li key={warning}>• {warning}</li>
                    ))}
                  </ul>
                )}
              </article>
            </div>
          </SectionCard>

          <SectionCard title="Opciones de pago" description="Cada alternativa se evalúa con los mismos datos financieros actuales.">
            <div className="space-y-4">
              {optionEvaluations.map(({ option, evaluation: optionEvaluation, simulation: optionSimulation, selected }) => (
                <article key={option.id} className="rounded-[22px] border border-morga-line bg-morga-surface p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-morga-text">{formatDecisionPaymentOptionType(option.type)}</p>
                    {selected ? <Badge tone="info">Opción principal</Badge> : null}
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <p className="text-sm text-morga-text">Total: {formatMoney(option.totalAmount)}</p>
                    <p className="text-sm text-morga-text">Anticipo: {option.upfrontAmount ? formatMoney(option.upfrontAmount) : "No aplica"}</p>
                    <p className="text-sm text-morga-text">Cuota: {option.installmentAmount ? formatMoney(option.installmentAmount) : "No aplica"}</p>
                    <p className="text-sm text-morga-text">Duración: {option.installmentCount ? `${option.installmentCount} cuotas` : "Sin cuotas"}</p>
                  </div>
                  <div className="mt-3 grid gap-3 md:grid-cols-2">
                    <p className="text-sm text-morga-muted">
                      Recomendación: <span className="font-semibold text-morga-text">{formatDecisionRecommendation(optionEvaluation.recommendationCode)}</span>
                    </p>
                    <p className="text-sm text-morga-muted">
                      Proyección posterior: <span className="font-semibold text-morga-text">{formatMoney(optionSimulation.projectedMonthEndAfterDecision)}</span>
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Datos usados por la regla" description="Los cálculos salen de tu estado financiero actual, sin modificarlo durante la simulación.">
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <article className="rounded-[18px] border border-morga-line bg-morga-surfaceAlt/35 p-3"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">Saldo actual</p><p className="mt-2 text-sm font-semibold text-morga-text">{formatMoney(evaluation.metrics.currentBalance)}</p></article>
              <article className="rounded-[18px] border border-morga-line bg-morga-surfaceAlt/35 p-3"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">Disponible para decidir</p><p className="mt-2 text-sm font-semibold text-morga-text">{formatMoney(evaluation.metrics.availableToDecide)}</p></article>
              <article className="rounded-[18px] border border-morga-line bg-morga-surfaceAlt/35 p-3"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">Proyección de fin de mes</p><p className="mt-2 text-sm font-semibold text-morga-text">{formatMoney(evaluation.metrics.monthEndProjection)}</p></article>
              <article className="rounded-[18px] border border-morga-line bg-morga-surfaceAlt/35 p-3"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">Deuda futura en cuotas</p><p className="mt-2 text-sm font-semibold text-morga-text">{formatMoney(evaluation.metrics.futureInstallmentDebt)}</p></article>
              <article className="rounded-[18px] border border-morga-line bg-morga-surfaceAlt/35 p-3"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">Reserva mínima</p><p className="mt-2 text-sm font-semibold text-morga-text">{formatMoney(evaluation.metrics.minimumReserve)}</p></article>
              <article className="rounded-[18px] border border-morga-line bg-morga-surfaceAlt/35 p-3"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">Prioridad total</p><p className="mt-2 text-sm font-semibold text-morga-text">{evaluation.priorityScore} puntos</p></article>
            </div>
          </SectionCard>
        </div>

        <div className="space-y-5">
          <SectionCard title="Contexto" description="Relaciones y estado actual de la decisión.">
            <div className="space-y-3 text-sm text-morga-text">
              <p>Categoría: {formatDecisionCategory(decision.category)}</p>
              <p>Impacto: {formatDecisionImpact(decision.impact)}</p>
              <p>Necesidad: {formatDecisionNecessity(decision.necessity)}</p>
              <p>Proyecto: {decision.projectId ? project?.name ?? "Proyecto eliminado" : "Sin proyecto asociado"}</p>
              <p>Tarea creada: {relatedTask ? relatedTask.title : "Todavía no hay tarea creada"}</p>
              <p>Creada: {formatDateTime(decision.createdAt)}</p>
              <p>Última actualización: {formatDateTime(decision.updatedAt)}</p>
              <p>Fecha posible según la regla: {formatDate(evaluation.feasibleFromDate)}</p>
            </div>

            {project ? (
              <Link to={`/projects/${project.id}`} className="mt-4 inline-flex rounded-full border border-morga-line px-4 py-2 text-sm font-semibold text-morga-text transition hover:bg-morga-surface">
                Ver proyecto relacionado
              </Link>
            ) : decision.projectId ? (
              <p className="mt-4 text-sm text-morga-muted">Proyecto eliminado.</p>
            ) : null}

            {relatedTask ? (
              <Link to={`/projects/${relatedTask.projectId}`} className="mt-3 inline-flex rounded-full border border-morga-line px-4 py-2 text-sm font-semibold text-morga-text transition hover:bg-morga-surface">
                Ver tarea dentro del proyecto
              </Link>
            ) : null}

            <button type="button" onClick={handleCreateTask} className="mt-3 inline-flex rounded-full bg-morga-dark px-4 py-2 text-sm font-semibold text-white">
              Crear tarea desde esta decisión
            </button>
          </SectionCard>

          <SectionCard title="Operación relacionada" description="Se completa cuando convertís la decisión en una operación real.">
            {!decision.convertedEntity ? (
              <EmptyState
                title="Todavía no fue convertida"
                description="La simulación no mueve dinero ni genera movimientos hasta confirmar la conversión."
              />
            ) : (
              <div className="space-y-3 text-sm text-morga-text">
                <p>Tipo de conversión: {decision.convertedEntity.kind}</p>
                <p>Convertida el {formatDateTime(decision.convertedEntity.createdAt)}</p>
                {relatedExpense ? (
                  <p>
                    Gasto creado:{" "}
                    <Link to={`/finances?tab=movements&highlight=${relatedExpense.id}`} className="font-semibold underline-offset-4 hover:underline">
                      {relatedExpense.name}
                    </Link>{" "}
                    · {formatMoney(relatedExpense.amount)}
                  </p>
                ) : convertedEntity?.expenseId ? (
                  <p>Gasto creado: Referencia no disponible</p>
                ) : null}
                {relatedPlan ? (
                  <p>
                    Plan de cuotas:{" "}
                    <Link to={`/finances?tab=cards&highlight=${relatedPlan.id}`} className="font-semibold underline-offset-4 hover:underline">
                      {relatedPlan.description}
                    </Link>{" "}
                    · {relatedPlan.totalInstallments} cuotas
                  </p>
                ) : convertedEntity?.installmentPlanId ? (
                  <p>Plan de cuotas: Referencia no disponible</p>
                ) : null}
                {relatedReserve ? (
                  <p>
                    Reserva creada:{" "}
                    <Link to={`/finances?tab=reserves&highlight=${relatedReserve.id}`} className="font-semibold underline-offset-4 hover:underline">
                      {relatedReserve.name}
                    </Link>{" "}
                    · objetivo {formatMoney(relatedReserve.targetAmount)}
                  </p>
                ) : convertedEntity?.reserveId ? (
                  <p>Reserva creada: Referencia no disponible</p>
                ) : null}
              </div>
            )}
          </SectionCard>

          <SectionCard title="Historial" description="Cada cambio de estado queda guardado como referencia.">
            <div className="space-y-3">
              {decision.statusHistory.slice().reverse().map((entry) => (
                <article key={entry.id} className="rounded-[18px] border border-morga-line bg-morga-surfaceAlt/35 p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={getStatusTone(entry.status)}>{formatDecisionStatus(entry.status)}</Badge>
                    <span className="text-sm text-morga-muted">{formatDateTime(entry.changedAt)}</span>
                  </div>
                  <p className="mt-2 text-sm text-morga-text">{entry.note}</p>
                </article>
              ))}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
