import { BriefcaseBusiness, CalendarPlus2, CircleDollarSign, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import {
  getFinanceOverview,
  getFinancePeriod
} from "../features/finance/financeCalculations";
import { usePlanning } from "../features/planning/usePlanning";
import {
  getDashboardAlerts,
  getUpcomingDeadlines,
  getWeeklyPriorities,
  getWeeklyProgress
} from "../features/dashboard/dashboardMetrics";
import { formatDate } from "../utils/dates";
import { formatMoney, formatTaskPriority } from "../utils/format";

function getAlertStyles(severity: "danger" | "warning" | "info") {
  switch (severity) {
    case "danger":
      return {
        border: "border-l-[3px] border-red-300",
        dot: "bg-red-500",
        text: "text-red-800"
      };
    case "warning":
      return {
        border: "border-l-[3px] border-amber-300",
        dot: "bg-amber-500",
        text: "text-amber-800"
      };
    default:
      return {
        border: "border-l-[3px] border-sky-300",
        dot: "bg-sky-500",
        text: "text-sky-800"
      };
  }
}

export function DashboardPage() {
  const { projects, tasks, finance, decisions } = usePlanning();
  const activeProjects = projects.filter(
    (project) => project.status !== "Completado" && project.status !== "Archivado"
  );
  const activeProjectIds = new Set(activeProjects.map((project) => project.id));
  const activeTasks = tasks.filter((task) => activeProjectIds.has(task.projectId));
  const activeDecisions = decisions.items.filter((decision) => decision.status !== "archived");
  const weeklyPriorities = getWeeklyPriorities(activeProjects, activeTasks);
  const upcomingDeadlines = getUpcomingDeadlines(activeProjects, activeTasks);
  const alerts = getDashboardAlerts(activeProjects, activeTasks, activeDecisions);
  const weeklyProgress = getWeeklyProgress(activeTasks);
  const finances = getFinanceOverview(finance, getFinancePeriod("30d"));
  const highPressureProjects = activeProjects.filter(
    (project) => project.priority === "Critica" || project.priority === "Alta"
  );
  const urgentDecision = activeDecisions.find(
    (decision) => decision.urgency === "critical" || decision.urgency === "high"
  );
  const approvedDecision = activeDecisions.find((decision) => decision.status === "approved");
  const moneyTone =
    finances.availableToDecide < 0 ? "text-[#9f5f49]" : "text-morga-text";
  const isFreshAccount =
    projects.length === 0 &&
    tasks.length === 0 &&
    decisions.items.length === 0 &&
    finance.incomes.length === 0 &&
    finance.expenses.length === 0 &&
    finance.creditCards.length === 0;

  const gettingStartedSteps = [
    {
      label: "Cargar un proyecto",
      description: "Algo que quieras avanzar: un tramite, un curso, una reparacion.",
      to: "/projects?compose=1",
      icon: BriefcaseBusiness
    },
    {
      label: "Cargar una tarea",
      description: "Un paso concreto, con fecha si la tiene.",
      to: "/week?compose=1",
      icon: CalendarPlus2
    },
    {
      label: "Cargar tu sueldo o ingreso",
      description: "Para que Morga sepa con cuanto contas.",
      to: "/finances?tab=movements&compose=income",
      icon: CircleDollarSign
    },
    {
      label: "Cargar un gasto o compromiso",
      description: "Alquiler, tarjeta, algo que tengas que pagar.",
      to: "/finances?tab=movements&compose=expense",
      icon: Sparkles
    }
  ];

  return (
    <div className="space-y-8 lg:space-y-10">
      <section className="border-b border-morga-line/80 pb-6">
        <div className="max-w-[48rem] xl:max-w-[54rem]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-morga-muted">
            Morga
          </p>
          <h1
            className="mt-3 max-w-[19ch] font-display text-[2.35rem] font-semibold leading-[0.98] tracking-[-0.04em] text-morga-text md:text-[3rem] xl:text-[3.25rem]"
            style={{ textWrap: "balance" }}
          >
            {isFreshAccount
              ? "Tu cuenta esta vacia. Empecemos a cargar tus datos."
              : "Un panorama sereno para decidir que mover primero."}
          </h1>
        </div>
      </section>

      {isFreshAccount ? (
        <section className="rounded-[28px] border border-morga-line bg-white px-5 py-6 md:px-7">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-morga-muted">
            Primeros pasos
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold text-morga-text">
            Cuatro cosas para arrancar
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-morga-muted">
            No hace falta cargar todo de una. Con uno de estos ya vas a ver el dashboard tomar
            forma.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {gettingStartedSteps.map((step) => {
              const Icon = step.icon;
              return (
                <Link
                  key={step.to}
                  to={step.to}
                  className="flex items-start gap-3 rounded-[20px] border border-morga-line bg-morga-surfaceAlt/40 px-4 py-4 transition hover:bg-morga-surfaceAlt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent"
                >
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-morga-text">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold text-morga-text">
                      {step.label}
                    </span>
                    <span className="mt-1 block text-sm leading-6 text-morga-muted">
                      {step.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      ) : null}

      <section className="overflow-hidden rounded-[28px] border border-morga-line bg-white">
        <div className="grid sm:grid-cols-2 xl:grid-cols-[1.05fr_0.95fr_1.15fr_0.95fr]">
          <article className="border-b border-morga-line px-5 py-5 sm:border-r xl:border-b-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-morga-muted">
              Prioridades
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-morga-text">
              {weeklyPriorities.length}
            </p>
          </article>

          <article className="border-b border-morga-line px-5 py-5 xl:border-b-0 xl:border-r">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-morga-muted">
              Proximos vencimientos
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-morga-text">
              {upcomingDeadlines.length}
            </p>
          </article>

          <article className="border-b border-morga-line px-5 py-5 sm:border-r sm:border-b-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-morga-muted">
              Disponible para decidir
            </p>
            <p className={`mt-3 text-4xl font-semibold tracking-[-0.04em] ${moneyTone}`}>
              {formatMoney(finances.availableToDecide)}
            </p>
          </article>

          <article className="px-5 py-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-morga-muted">
              Progreso semanal
            </p>
            <p className="mt-3 text-4xl font-semibold tracking-[-0.04em] text-morga-text">
              {weeklyProgress}%
            </p>
          </article>
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.9fr)]">
        <div className="space-y-4">
          <div className="border-b border-morga-line/70 pb-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-morga-muted">
              Semana
            </p>
            <h2 className="mt-2 font-display text-[2rem] font-semibold leading-none text-morga-text">
              Tres prioridades
            </h2>
          </div>

          {weeklyPriorities.length === 0 ? (
            <EmptyState
              title="No hay prioridades cargadas"
              description="Cuando agregues tareas pendientes con fechas y prioridad, este bloque se ordena solo."
            />
          ) : (
            <div className="divide-y divide-morga-line rounded-[24px] border border-morga-line bg-white">
              {weeklyPriorities.map((item, index) => (
                <article
                  key={item.id}
                  className="grid gap-4 px-5 py-5 md:grid-cols-[72px_minmax(0,1fr)_auto] md:items-start"
                >
                  <div className="font-display text-4xl leading-none tracking-[-0.05em] text-morga-muted/70">
                    0{index + 1}
                  </div>

                  <div className="min-w-0">
                    <h3 className="text-lg font-semibold leading-tight text-morga-text">
                      {item.title}
                    </h3>
                    <p className="mt-1 text-sm text-morga-muted">{item.subtitle}</p>
                    <p className="mt-3 text-sm leading-6 text-morga-muted">{item.dueLabel}</p>
                  </div>

                  <div className="flex flex-wrap gap-2 md:justify-end">
                    <Badge tone={item.priority === "critical" ? "danger" : "warning"}>
                      {formatTaskPriority(item.priority)}
                    </Badge>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-[26px] border border-morga-line bg-[#fbf7f0] px-5 py-5">
          <div className="border-b border-morga-line/70 pb-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-morga-muted">
              Atencion
            </p>
            <h2 className="mt-2 font-display text-[1.9rem] font-semibold leading-none text-morga-text">
              Alertas importantes
            </h2>
          </div>

          {alerts.length === 0 ? (
            <div className="pt-4">
              <EmptyState
                title="Sin alertas criticas"
                description="Cuando haya vencimientos, bloqueos o tareas fuera de foco, aparecen aca."
              />
            </div>
          ) : (
            <div className="space-y-3 pt-4">
              {alerts.map((alert) => {
                const tone = getAlertStyles(alert.severity);

                return (
                  <article
                    key={alert.id}
                    className={`rounded-[20px] bg-white/80 px-4 py-4 ${tone.border}`}
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={`mt-2 h-2.5 w-2.5 shrink-0 rounded-full ${tone.dot}`}
                        aria-hidden="true"
                      />
                      <div>
                        <p className={`text-sm font-semibold ${tone.text}`}>{alert.title}</p>
                        <p className="mt-1 text-sm leading-6 text-morga-muted">
                          {alert.description}
                        </p>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-8 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
        <div className="rounded-[26px] border border-morga-line bg-white px-5 py-5">
          <div className="border-b border-morga-line/70 pb-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-morga-muted">
              Agenda
            </p>
            <h2 className="mt-2 font-display text-[1.9rem] font-semibold leading-none text-morga-text">
              Proximos vencimientos
            </h2>
          </div>

          {upcomingDeadlines.length === 0 ? (
            <div className="pt-4">
              <EmptyState
                title="No hay vencimientos proximos"
                description="Define fechas limite en tareas para tener una semana mas clara."
              />
            </div>
          ) : (
            <div className="divide-y divide-morga-line pt-2">
              {upcomingDeadlines.map((item) => (
                <article
                  key={item.id}
                  className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-morga-text">{item.title}</p>
                      <span className="text-xs uppercase tracking-[0.16em] text-morga-muted">
                        Tarea
                      </span>
                    </div>
                    <p className="mt-1 text-sm leading-6 text-morga-muted">{item.subtitle}</p>
                  </div>

                  <div className="shrink-0 text-left sm:text-right">
                    <p className="text-sm font-semibold text-morga-text">
                      {formatDate(item.date)}
                    </p>
                    <p className="mt-1 text-xs uppercase tracking-[0.16em] text-morga-muted">
                      fecha marcada
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="border-b border-morga-line/70 pb-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-morga-muted">
              Contexto
            </p>
            <h2 className="mt-2 font-display text-[1.9rem] font-semibold leading-none text-morga-text">
              Presion actual
            </h2>
          </div>

          <div className="rounded-[26px] border border-morga-line bg-white px-5 py-5">
            <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
              <article className="border-b border-morga-line pb-4 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-5">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-morga-muted">
                  Proyectos activos
                </p>
                <p className="mt-3 font-display text-5xl font-semibold leading-none tracking-[-0.05em] text-morga-text">
                  {activeProjects.length}
                </p>
                <p className="mt-3 text-sm leading-6 text-morga-muted">
                  {highPressureProjects.length} con prioridad critica o alta.
                </p>
              </article>

              <article>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-morga-muted">
                  Compras pendientes
                </p>
                <p className="mt-3 font-display text-5xl font-semibold leading-none tracking-[-0.05em] text-morga-text">
                  {activeDecisions.length}
                </p>
                <p className="mt-3 text-sm leading-6 text-morga-muted">
                  {urgentDecision
                    ? `La mas urgente hoy es ${urgentDecision.name}.`
                    : `${formatMoney(finances.upcomingPayments)} comprometidos en los proximos 30 dias.`}
                </p>
              </article>
            </div>

            <div className="mt-5 border-t border-morga-line pt-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-morga-muted">
                Proximo movimiento relevante
              </p>
              {approvedDecision ? (
                <div className="mt-2 flex flex-col gap-1">
                  <p className="text-lg font-semibold text-morga-text">
                    {approvedDecision.name}
                  </p>
                  <p className="text-sm text-morga-muted">
                    Decision aprobada por {formatMoney(approvedDecision.totalAmount)}
                  </p>
                  <p className="text-sm text-morga-muted">
                    Fecha objetivo: {formatDate(approvedDecision.desiredDate)}
                  </p>
                </div>
              ) : finances.upcomingCardEvents[0] ? (
                <div className="mt-2 flex flex-col gap-1">
                  <p className="text-lg font-semibold text-morga-text">
                    {finances.upcomingCardEvents[0].cardName}
                  </p>
                  <p className="text-sm text-morga-muted">
                    Cierre: {finances.upcomingCardEvents[0].closeLabel}
                  </p>
                  <p className="text-sm text-morga-muted">
                    Vencimiento: {finances.upcomingCardEvents[0].dueLabel}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-morga-muted">
                  Todavia no hay tarjetas activas registradas.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
