import { FormEvent, useEffect, useMemo, useState } from "react";
import { Filter, Plus, RotateCcw } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { SectionCard } from "../components/ui/SectionCard";
import { usePlanning } from "../features/planning/usePlanning";
import {
  compareDecisions,
  evaluateDecision as evaluateDecisionWithRules,
  simulateDecision
} from "../features/decisions/decisionEngine";
import { DecisionCard } from "../components/decisions/DecisionCard";
import { DecisionFormModal } from "../components/decisions/DecisionFormModal";
import { decisionRulesToFormValues } from "../features/decisions/decisionForm";
import { Badge } from "../components/ui/Badge";
import { DecisionItem, DecisionRulesConfigFormValues } from "../types/domain";
import {
  defaultDecisionFilters,
  filterAndSortDecisions,
  hasActiveDecisionFilters,
  type DecisionFilterState
} from "../features/decisions/decisionFilters";
import {
  formatDecisionCategory,
  formatDecisionStatus,
  formatMoney
} from "../utils/format";
import { formatDate, formatDateTime } from "../utils/dates";

type DecisionTab = "summary" | "all" | "compare" | "archived";
type CompareMetric = "viability" | "priority" | "amount" | "monthly";

const tabs: Array<{ id: DecisionTab; label: string }> = [
  { id: "summary", label: "Resumen" },
  { id: "all", label: "Todas" },
  { id: "compare", label: "Comparar" },
  { id: "archived", label: "Archivadas" }
];

const compareMetrics: Array<{ id: CompareMetric; label: string }> = [
  { id: "viability", label: "Viabilidad" },
  { id: "priority", label: "Prioridad" },
  { id: "amount", label: "Importe" },
  { id: "monthly", label: "Impacto mensual" }
];

const inputClassName =
  "h-11 rounded-2xl border border-morga-line bg-morga-surface px-4 text-sm text-morga-text outline-none transition focus:border-morga-accent";

function DecisionFiltersForm({
  filters,
  onChange,
  onReset,
  projects
}: {
  filters: DecisionFilterState;
  onChange: (next: DecisionFilterState) => void;
  onReset: () => void;
  projects: Array<{ id: string; name: string }>;
}) {
  const hasActive = hasActiveDecisionFilters(filters);

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      <label className="grid gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
          Buscar
        </span>
        <input
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder="Nombre o contexto"
          className={inputClassName}
        />
      </label>

      <label className="grid gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
          Estado
        </span>
        <select
          value={filters.status}
          onChange={(event) => onChange({ ...filters, status: event.target.value })}
          className={inputClassName}
        >
          <option value="all">Todos</option>
          <option value="evaluating">En evaluacion</option>
          <option value="planned">Planificadas</option>
          <option value="saving">Ahorrando</option>
          <option value="approved">Aprobadas</option>
          <option value="postponed">Pospuestas</option>
          <option value="rejected">Descartadas</option>
          <option value="completed">Convertidas</option>
          <option value="archived">Archivadas</option>
        </select>
      </label>

      <label className="grid gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
          Categoria
        </span>
        <select
          value={filters.category}
          onChange={(event) => onChange({ ...filters, category: event.target.value })}
          className={inputClassName}
        >
          <option value="all">Todas</option>
          <option value="safety">Seguridad</option>
          <option value="health">Salud</option>
          <option value="transport">Transporte</option>
          <option value="housing">Vivienda</option>
          <option value="training">Entrenamiento</option>
          <option value="work">Trabajo</option>
          <option value="technology">Tecnologia</option>
          <option value="travel">Viaje</option>
          <option value="personal-project">Proyecto personal</option>
          <option value="comfort">Comodidad</option>
          <option value="maintenance">Mantenimiento</option>
          <option value="other">Otro</option>
        </select>
      </label>

      <label className="grid gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
          Proyecto
        </span>
        <select
          value={filters.projectId}
          onChange={(event) => onChange({ ...filters, projectId: event.target.value })}
          className={inputClassName}
        >
          <option value="all">Todos</option>
          <option value="missing">Proyecto no disponible</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      </label>

      <label className="grid gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
          Urgencia
        </span>
        <select
          value={filters.urgency}
          onChange={(event) => onChange({ ...filters, urgency: event.target.value })}
          className={inputClassName}
        >
          <option value="all">Todas</option>
          <option value="critical">Critica</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
          <option value="low">Baja</option>
        </select>
      </label>

      <label className="grid gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
          Recomendacion
        </span>
        <select
          value={filters.recommendation}
          onChange={(event) => onChange({ ...filters, recommendation: event.target.value })}
          className={inputClassName}
        >
          <option value="all">Todas</option>
          <option value="buy-now">Comprar ahora</option>
          <option value="buy-next-income">Proximo ingreso</option>
          <option value="finance-carefully">Financiar con precaucion</option>
          <option value="save-first">Ahorrar primero</option>
          <option value="create-reserve">Crear reserva</option>
          <option value="wait-next-month">Esperar al proximo mes</option>
          <option value="postpone">Posponer</option>
          <option value="manual-review">Revision manual</option>
        </select>
      </label>

      <label className="grid gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
          Conversion
        </span>
        <select
          value={filters.converted}
          onChange={(event) => onChange({ ...filters, converted: event.target.value })}
          className={inputClassName}
        >
          <option value="all">Todas</option>
          <option value="converted">Convertidas</option>
          <option value="pending">Sin convertir</option>
        </select>
      </label>

      <label className="grid gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
          Ordenar por
        </span>
        <select
          value={filters.sortBy}
          onChange={(event) =>
            onChange({
              ...filters,
              sortBy: event.target.value as DecisionFilterState["sortBy"]
            })
          }
          className={inputClassName}
        >
          <option value="updatedAt">Ultima actualizacion</option>
          <option value="priority">Prioridad</option>
          <option value="amount">Importe</option>
          <option value="desiredDate">Fecha deseada</option>
          <option value="viability">Viabilidad</option>
        </select>
      </label>

      {hasActive ? (
        <div className="md:col-span-2 xl:col-span-4">
          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-morga-line px-4 py-2 text-sm font-semibold text-morga-text transition hover:bg-morga-surfaceAlt"
          >
            <RotateCcw className="h-4 w-4" />
            Limpiar filtros
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function DecisionsPage() {
  const {
    projects,
    tasks,
    finance,
    decisions,
    createDecision,
    updateDecision,
    deleteDecision,
    archiveDecision,
    restoreDecision,
    setDecisionStatus,
    evaluateDecision,
    evaluateAllDecisions,
    updateDecisionRulesConfig,
    saveDecisionComparison,
    removeDecisionComparison,
    convertDecision
  } = usePlanning();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<DecisionTab>("summary");
  const [modalOpen, setModalOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [editingDecision, setEditingDecision] = useState<DecisionItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [feedback, setFeedback] = useState("");
  const [compareMetric, setCompareMetric] = useState<CompareMetric>("viability");
  const [filters, setFilters] = useState<DecisionFilterState>(defaultDecisionFilters);
  const [rulesValues, setRulesValues] = useState<DecisionRulesConfigFormValues>(() =>
    decisionRulesToFormValues(decisions.rulesConfig)
  );

  const isComposeOpen = searchParams.get("compose") === "1";

  useEffect(() => {
    if (!isComposeOpen) return;
    setEditingDecision(null);
    setModalOpen(true);
  }, [isComposeOpen]);

  const evaluatedDecisions = useMemo(
    () =>
      decisions.items.map((decision) => {
        const evaluation =
          decision.evaluation ??
          evaluateDecisionWithRules(
            decision,
            finance,
            decisions.rulesConfig,
            projects,
            tasks
          );
        const simulation = simulateDecision(decision, finance, decisions.rulesConfig);
        return { decision, evaluation, simulation };
      }),
    [decisions.items, decisions.rulesConfig, finance, projects, tasks]
  );

  const activeEntries = evaluatedDecisions.filter(({ decision }) => decision.status !== "archived");
  const archivedEntries = evaluatedDecisions.filter(({ decision }) => decision.status === "archived");
  const filteredActiveEntries = useMemo(
    () => filterAndSortDecisions(activeEntries, filters, projects),
    [activeEntries, filters, projects]
  );
  const filteredArchivedEntries = useMemo(
    () => filterAndSortDecisions(archivedEntries, { ...filters, archived: "archived" }, projects),
    [archivedEntries, filters, projects]
  );
  const urgentEntries = activeEntries.filter(
    ({ decision }) => decision.urgency === "critical" || decision.urgency === "high"
  );
  const viableEntries = activeEntries.filter(({ evaluation }) =>
    ["buy-now", "buy-next-income", "finance-carefully", "save-first", "create-reserve"].includes(
      evaluation.recommendationCode
    )
  );
  const postponedEntries = activeEntries.filter(
    ({ decision }) => decision.status === "postponed" || decision.status === "rejected"
  );
  const totalInEvaluation = activeEntries.reduce(
    (total, { decision }) => total + decision.totalAmount,
    0
  );
  const monthlyImpactPotential = activeEntries.reduce(
    (total, { evaluation }) => total + evaluation.metrics.monthlyInstallmentAmount,
    0
  );

  const comparisonResult = useMemo(
    () =>
      compareDecisions(
        selectedIds,
        decisions.items,
        finance,
        decisions.rulesConfig,
        projects,
        tasks
      ),
    [decisions.items, decisions.rulesConfig, finance, projects, selectedIds, tasks]
  );

  const projectNames = new Map(projects.map((project) => [project.id, project.name]));

  const closeComposer = () => {
    searchParams.delete("compose");
    setSearchParams(searchParams, { replace: true });
    setModalOpen(false);
    setEditingDecision(null);
  };

  const handleOpenCreate = () => {
    setEditingDecision(null);
    setSearchParams({ compose: "1" });
  };

  const handleToggleCompare = (decisionId: string) => {
    setSelectedIds((current) => {
      if (current.includes(decisionId)) {
        return current.filter((id) => id !== decisionId);
      }
      if (current.length >= 4) return current;
      return [...current, decisionId];
    });
  };

  const handleConvert = (decision: DecisionItem) => {
    if (decision.status !== "approved") {
      window.alert("Primero aproba la decision para convertirla en una operacion real.");
      return;
    }

    const option =
      decision.paymentOptions.find((item) => item.id === decision.selectedPaymentOptionId) ??
      decision.paymentOptions[0];
    const optionLabel = option ? `${option.type} por ${formatMoney(option.totalAmount)}` : "opcion actual";
    const confirmed = window.confirm(
      `Se va a convertir "${decision.name}" en una operacion real usando ${optionLabel}. Esta accion no duplica registros si ya fue convertida. Queres continuar?`
    );

    if (!confirmed) return;
    convertDecision(decision.id);
    setFeedback("Decision convertida.");
  };

  const handleRulesSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateDecisionRulesConfig(rulesValues);
    setFeedback("Reglas de decision actualizadas.");
  };

  const visibleEntries = useMemo(
    () => (tab === "archived" ? filteredArchivedEntries : filteredActiveEntries),
    [filteredActiveEntries, filteredArchivedEntries, tab]
  );
  const compareSummary = comparisonResult.entries[0]
    ? compareMetric === "priority"
      ? `${comparisonResult.entries[0].priorityScore} puntos`
      : compareMetric === "amount"
        ? formatMoney(comparisonResult.entries[0].totalAmount)
        : compareMetric === "monthly"
          ? formatMoney(comparisonResult.entries[0].installmentAmount)
          : formatMoney(comparisonResult.entries[0].effectOnMonthProjection)
    : "";

  void compareSummary;

  return (
    <div className="space-y-5">
      <div className="sr-only" aria-live="polite">
        {feedback}
      </div>

      <section className="flex flex-col gap-4 rounded-panel border border-morga-line bg-morga-surface px-5 py-5 shadow-soft md:px-6 md:py-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-morga-muted">
            Planificacion
          </p>
          <h1 className="mt-2 font-display text-4xl font-semibold text-morga-text md:text-5xl">
            Decisiones
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-morga-muted">
            Anota una compra que estas pensando hacer, y Morga te dice si conviene pagarla ahora, financiarla o esperar, segun tu plata real.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={evaluateAllDecisions}
            className="inline-flex min-h-[44px] items-center justify-center rounded-full border border-morga-line px-4 py-3 text-sm font-semibold text-morga-text transition hover:bg-morga-surfaceAlt"
          >
            Evaluar todas
          </button>
          <button
            type="button"
            onClick={handleOpenCreate}
            className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full bg-morga-dark px-5 py-3 text-sm font-semibold text-white"
          >
            <Plus className="h-4 w-4" />
            Nueva decision
          </button>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <article className="rounded-[22px] border border-morga-line bg-morga-surface p-4 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">Activas</p>
          <p className="mt-2 text-2xl font-semibold text-morga-text">{activeEntries.length}</p>
        </article>
        <article className="rounded-[22px] border border-morga-line bg-morga-surface p-4 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">Urgentes</p>
          <p className="mt-2 text-2xl font-semibold text-morga-text">{urgentEntries.length}</p>
        </article>
        <article className="rounded-[22px] border border-morga-line bg-morga-surface p-4 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">Viables hoy</p>
          <p className="mt-2 text-2xl font-semibold text-morga-text">{viableEntries.length}</p>
        </article>
        <article className="rounded-[22px] border border-morga-line bg-morga-surface p-4 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">Monto en evaluacion</p>
          <p className="mt-2 text-2xl font-semibold text-morga-text">{formatMoney(totalInEvaluation)}</p>
        </article>
        <article className="rounded-[22px] border border-morga-line bg-morga-surface p-4 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">Impacto mensual potencial</p>
          <p className="mt-2 text-2xl font-semibold text-morga-text">{formatMoney(monthlyImpactPotential)}</p>
        </article>
      </section>

      <div className="flex flex-wrap gap-2">
        {tabs.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`min-h-[44px] rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === item.id
                ? "bg-morga-accentSoft text-morga-text"
                : "border border-morga-line bg-morga-surface text-morga-muted hover:bg-morga-surfaceAlt"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {(tab === "all" || tab === "archived") && (
        <>
          <section className="hidden rounded-panel border border-morga-line bg-morga-surface p-4 shadow-soft md:block">
            <DecisionFiltersForm
              filters={tab === "archived" ? { ...filters, archived: "archived" } : filters}
              onChange={setFilters}
              onReset={() => setFilters(defaultDecisionFilters)}
              projects={projects.map((project) => ({ id: project.id, name: project.name }))}
            />
          </section>

          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full border border-morga-line bg-morga-surface px-4 py-2 text-sm font-semibold text-morga-text"
            >
              <Filter className="h-4 w-4" />
              Filtros
            </button>
          </div>
        </>
      )}

      {tab === "summary" ? (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.85fr)]">
          <div className="space-y-5">
            <SectionCard title="Decisiones urgentes" description="Las que conviene revisar primero por fecha, necesidad o impacto.">
              {urgentEntries.length === 0 ? (
                <EmptyState
                  title="Sin urgentes en este momento"
                  description="Cuando aparezcan decisiones con urgencia alta o critica, las vas a ver aca primero."
                />
              ) : (
                <div className="space-y-4">
                  {urgentEntries.slice(0, 3).map(({ decision, evaluation, simulation }) => (
                    <DecisionCard
                      key={decision.id}
                      decision={decision}
                      evaluation={evaluation}
                      simulation={simulation}
                      projectName={decision.projectId ? projectNames.get(decision.projectId) : null}
                      selectedForCompare={selectedIds.includes(decision.id)}
                      onToggleCompare={handleToggleCompare}
                      onEdit={(item) => {
                        setEditingDecision(item);
                        setModalOpen(true);
                      }}
                      onEvaluate={evaluateDecision}
                      onConvert={handleConvert}
                      onSetStatus={setDecisionStatus}
                      onArchive={archiveDecision}
                      onRestore={restoreDecision}
                      onDelete={(decisionId) => {
                        if (window.confirm("Esta decision se eliminara definitivamente. Queres continuar?")) {
                          deleteDecision(decisionId);
                          setFeedback("Decision eliminada.");
                        }
                      }}
                    />
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard title="Decisiones pospuestas" description="Aca quedan visibles las que decidiste esperar o descartar.">
              {postponedEntries.length === 0 ? (
                <EmptyState
                  title="Sin decisiones pospuestas"
                  description="Todavia no hay decisiones marcadas para mas adelante."
                />
              ) : (
                <div className="space-y-3">
                  {postponedEntries.map(({ decision, evaluation }) => (
                    <article key={decision.id} className="rounded-[20px] border border-morga-line bg-morga-surfaceAlt/40 p-4">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-morga-text">{decision.name}</p>
                          <p className="mt-1 text-sm text-morga-muted">{evaluation.explanation}</p>
                        </div>
                        <Badge tone="muted">{formatDecisionStatus(decision.status)}</Badge>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </SectionCard>
          </div>

          <div className="space-y-5">
            <SectionCard title="Comparaciones guardadas" description="Quedan persistidas para revisarlas despues sin volver a seleccionar todo.">
              {decisions.comparisons.length === 0 ? (
                <EmptyState
                  title="Todavia no guardaste comparaciones"
                  description="Selecciona entre dos y cuatro decisiones y guarda una comparacion."
                />
              ) : (
                <div className="space-y-3">
                  {decisions.comparisons.map((comparison) => (
                    <article key={comparison.id} className="rounded-[20px] border border-morga-line bg-morga-surfaceAlt/40 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-morga-text">
                            {comparison.decisionIds
                              .map((id) => decisions.items.find((decision) => decision.id === id)?.name)
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                          <p className="mt-1 text-sm text-morga-muted">
                            Guardada el {formatDateTime(comparison.createdAt)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeDecisionComparison(comparison.id)}
                          className="rounded-full border border-morga-line px-4 py-2 text-sm font-semibold text-morga-text transition hover:bg-morga-surface"
                        >
                          Quitar
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </SectionCard>

            <SectionCard
              title="Reglas de recomendacion"
              description="Como de estricta es la recomendacion automatica. No hace falta tocar esto para usar Morga."
            >
              <details className="group">
                <summary className="flex min-h-[44px] cursor-pointer list-none items-center justify-between rounded-2xl border border-morga-line bg-morga-surfaceAlt/40 px-4 text-sm font-semibold text-morga-text">
                  <span>Ver ajustes avanzados</span>
                  <span className="text-xs font-normal text-morga-muted group-open:hidden">Mostrar</span>
                  <span className="hidden text-xs font-normal text-morga-muted group-open:inline">Ocultar</span>
                </summary>
                <form className="mt-4 grid gap-4" onSubmit={handleRulesSubmit}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-morga-text">Margen minimo despues de comprar</span>
                      <span className="text-xs text-morga-muted">Cuanta plata queres que te quede si o si despues de cualquier compra.</span>
                      <input value={rulesValues.minimumPostPurchaseMargin} onChange={(event) => setRulesValues((current) => ({ ...current, minimumPostPurchaseMargin: event.target.value }))} className={inputClassName} />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-morga-text">Maximo de ingreso para nuevas cuotas</span>
                      <span className="text-xs text-morga-muted">Que porcentaje de tu ingreso mensual aceptas comprometer en cuotas nuevas.</span>
                      <input value={rulesValues.maxNewInstallmentIncomeRatio} onChange={(event) => setRulesValues((current) => ({ ...current, maxNewInstallmentIncomeRatio: event.target.value }))} className={inputClassName} />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-morga-text">Maximo de deuda futura</span>
                      <span className="text-xs text-morga-muted">El techo total de cuotas pendientes que estas dispuesto a acumular.</span>
                      <input value={rulesValues.maxFutureInstallmentDebt} onChange={(event) => setRulesValues((current) => ({ ...current, maxFutureInstallmentDebt: event.target.value }))} className={inputClassName} />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-sm font-semibold text-morga-text">Financiacion extensa desde</span>
                      <span className="text-xs text-morga-muted">A partir de cuantos meses de cuotas se considera "financiacion larga".</span>
                      <input value={rulesValues.longFinancingMonths} onChange={(event) => setRulesValues((current) => ({ ...current, longFinancingMonths: event.target.value }))} className={inputClassName} />
                    </label>
                  </div>
                  <label className="grid gap-2">
                    <span className="text-sm font-semibold text-morga-text">Prioridad extra para seguridad y salud</span>
                    <span className="text-xs text-morga-muted">Puntos extra que suman las decisiones de salud o seguridad para aparecer primero.</span>
                    <input value={rulesValues.safetyHealthPriorityBoost} onChange={(event) => setRulesValues((current) => ({ ...current, safetyHealthPriorityBoost: event.target.value }))} className={inputClassName} />
                  </label>
                  <div className="flex justify-end">
                    <button type="submit" className="rounded-full bg-morga-dark px-5 py-3 text-sm font-semibold text-white">
                      Guardar reglas
                    </button>
                  </div>
                </form>
              </details>
            </SectionCard>
          </div>
        </div>
      ) : null}

      {(tab === "all" || tab === "archived") ? (
        visibleEntries.length === 0 ? (
          <EmptyState
            title={tab === "archived" ? "No hay archivadas" : "Sin resultados para estos filtros"}
            description={
              tab === "archived"
                ? "Cuando archives decisiones, van a aparecer aca sin perderse del almacenamiento."
                : hasActiveDecisionFilters(filters)
                  ? "Prueba limpiar filtros o cambiar el orden actual."
                  : "Crea la primera decision para empezar a evaluar alternativas reales."
            }
            action={
              hasActiveDecisionFilters(filters) ? (
                <button
                  type="button"
                  onClick={() => setFilters(defaultDecisionFilters)}
                  className="rounded-full bg-morga-dark px-5 py-3 text-sm font-semibold text-white"
                >
                  Limpiar filtros
                </button>
              ) : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            {visibleEntries.map(({ decision, evaluation, simulation }) => (
              <DecisionCard
                key={decision.id}
                decision={decision}
                evaluation={evaluation}
                simulation={simulation}
                projectName={
                  decision.projectId
                    ? projectNames.get(decision.projectId) ?? "Proyecto eliminado"
                    : null
                }
                selectedForCompare={selectedIds.includes(decision.id)}
                onToggleCompare={handleToggleCompare}
                onEdit={(item) => {
                  setEditingDecision(item);
                  setModalOpen(true);
                }}
                onEvaluate={evaluateDecision}
                onConvert={handleConvert}
                onSetStatus={setDecisionStatus}
                onArchive={archiveDecision}
                onRestore={restoreDecision}
                onDelete={(decisionId) => {
                  if (window.confirm("Esta decision se eliminara definitivamente. Queres continuar?")) {
                    deleteDecision(decisionId);
                    setFeedback("Decision eliminada.");
                  }
                }}
              />
            ))}
          </div>
        )
      ) : null}

      {tab === "compare" ? (
        <div className="space-y-5">
          <SectionCard
            title="Seleccion para comparar"
            description="Marca entre dos y cuatro decisiones. La comparacion no modifica tus finanzas."
            action={
              selectedIds.length >= 2 ? (
                <button
                  type="button"
                  onClick={() => saveDecisionComparison(selectedIds)}
                  className="rounded-full border border-morga-line px-4 py-2 text-sm font-semibold text-morga-text transition hover:bg-morga-surfaceAlt"
                >
                  Guardar comparacion
                </button>
              ) : null
            }
          >
            {activeEntries.length === 0 ? (
              <EmptyState
                title="No hay decisiones para comparar"
                description="Primero crea o restaura decisiones activas."
              />
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {activeEntries.map(({ decision }) => (
                  <label key={decision.id} className="flex min-h-[44px] items-start gap-3 rounded-[20px] border border-morga-line bg-morga-surfaceAlt/35 p-4">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(decision.id)}
                      onChange={() => handleToggleCompare(decision.id)}
                      className="mt-1 h-4 w-4 accent-morga-dark"
                    />
                    <div>
                      <p className="text-sm font-semibold text-morga-text">{decision.name}</p>
                      <p className="mt-1 text-sm text-morga-muted">
                        {formatDecisionCategory(decision.category)} · {formatMoney(decision.totalAmount)}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}
          </SectionCard>

          {comparisonResult.entries.length < 2 ? (
            <EmptyState
              title="Selecciona al menos dos decisiones"
              description="La comparacion aparece automaticamente cuando hay suficiente contexto."
            />
          ) : (
            <SectionCard title="Resultado de la comparacion" description="En movil se mantienen como bloques apilados para evitar scroll horizontal.">
              <div className="flex flex-wrap gap-2">
                {compareMetrics.map((metric) => (
                  <button
                    key={metric.id}
                    type="button"
                    title={
                      metric.id === "viability"
                        ? "Cuanto te queda disponible ese mes si la elegis."
                        : undefined
                    }
                    onClick={() => setCompareMetric(metric.id)}
                    className={`min-h-[44px] rounded-full px-4 py-2 text-sm font-semibold ${
                      compareMetric === metric.id
                        ? "bg-morga-accentSoft text-morga-text"
                        : "border border-morga-line bg-morga-surface text-morga-muted"
                    }`}
                  >
                    {metric.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                {comparisonResult.entries.map((entry) => (
                  <article key={entry.decisionId} className="rounded-[22px] border border-morga-line bg-morga-surface p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-base font-semibold text-morga-text">{entry.name}</p>
                      <Badge tone="muted">{formatDecisionCategory(entry.category)}</Badge>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-morga-text">
                      {compareMetric === "priority"
                        ? `Prioridad: ${entry.priorityScore} puntos`
                        : compareMetric === "amount"
                          ? `Importe: ${formatMoney(entry.totalAmount)}`
                          : compareMetric === "monthly"
                            ? `Impacto mensual: ${entry.installmentAmount ? formatMoney(entry.installmentAmount) : "Sin cuota"}`
                            : `Viabilidad: ${formatMoney(entry.effectOnMonthProjection)}`}
                    </p>
                    <div className="mt-3 grid gap-2 text-sm text-morga-text">
                      <p>Pago inicial: {formatMoney(entry.upfrontAmount)}</p>
                      <p>Cuota: {entry.installmentAmount ? formatMoney(entry.installmentAmount) : "Sin cuota"}</p>
                      <p>Duracion: {entry.installmentCount ? `${entry.installmentCount} cuotas` : "Sin financiacion"}</p>
                      <p>Disponible despues: {formatMoney(entry.effectOnAvailableToDecide)}</p>
                      <p>Deuda futura: {formatMoney(entry.futureDebtGenerated)}</p>
                      <p>Fecha posible: {formatDate(entry.possiblePurchaseDate)}</p>
                      <p>Recomendacion: {entry.recommendationTitle}</p>
                    </div>
                  </article>
                ))}
              </div>

              <div className="mt-4 rounded-[22px] border border-morga-line bg-morga-surfaceAlt/40 p-4">
                <p className="text-sm font-semibold text-morga-text">Lectura comparada</p>
                <ul className="mt-3 space-y-2 text-sm leading-6 text-morga-muted">
                  {comparisonResult.highlights.map((highlight) => (
                    <li key={highlight}>• {highlight}</li>
                  ))}
                </ul>
              </div>
            </SectionCard>
          )}
        </div>
      ) : null}

      <DecisionFormModal
        open={modalOpen || isComposeOpen}
        mode={editingDecision ? "edit" : "create"}
        decision={editingDecision}
        projects={projects.map((project) => ({ id: project.id, name: project.name }))}
        creditCards={finance.creditCards.map((card) => ({ id: card.id, name: card.name }))}
        reserves={finance.reserves.map((reserve) => ({ id: reserve.id, name: reserve.name }))}
        onClose={closeComposer}
        onSubmit={(decisionId, values) => {
          if (decisionId) {
            updateDecision(decisionId, values);
            setFeedback("Decision actualizada.");
            return;
          }
          createDecision(values);
          setFeedback("Decision creada.");
        }}
      />

      <Modal
        open={filtersOpen}
        title="Filtros de decisiones"
        description="Ajusta estado, categoria, recomendacion y orden sin dejar la pantalla."
        onClose={() => setFiltersOpen(false)}
      >
        <DecisionFiltersForm
          filters={tab === "archived" ? { ...filters, archived: "archived" } : filters}
          onChange={setFilters}
          onReset={() => setFilters(defaultDecisionFilters)}
          projects={projects.map((project) => ({ id: project.id, name: project.name }))}
        />
      </Modal>
    </div>
  );
}
