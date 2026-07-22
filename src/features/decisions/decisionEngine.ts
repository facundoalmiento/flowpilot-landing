import {
  DecisionCategory,
  DecisionComparison,
  DecisionEvaluation,
  DecisionFormValues,
  DecisionItem,
  DecisionPaymentOption,
  DecisionRecommendationCode,
  DecisionRulesConfig,
  FinanceState,
  Project,
  Task
} from "../../types/domain";
import { addMonths, daysUntil } from "../../utils/dates";
import { getFinanceOverview, getFinancePeriod } from "../finance/financeCalculations";

export interface DecisionSimulation {
  availableAfterDecision: number;
  projectedMonthEndAfterDecision: number;
  futureInstallmentDebtAfterDecision: number;
  monthlyCommitmentIncrease: number;
  reserveBalanceAfterUse: number | null;
  monthsToSave: number | null;
  monthlySavingsNeeded: number | null;
}

export interface DecisionComparisonEntry {
  decisionId: string;
  name: string;
  category: DecisionCategory;
  totalAmount: number;
  upfrontAmount: number;
  installmentAmount: number;
  installmentCount: number;
  urgency: DecisionItem["urgency"];
  impact: DecisionItem["impact"];
  necessity: DecisionItem["necessity"];
  effectOnAvailableToDecide: number;
  effectOnMonthProjection: number;
  futureDebtGenerated: number;
  possiblePurchaseDate: string | null;
  recommendationTitle: string;
  priorityScore: number;
}

export interface DecisionComparisonResult {
  entries: DecisionComparisonEntry[];
  highlights: string[];
}

const urgencyWeights: Record<DecisionItem["urgency"], number> = {
  low: 10,
  medium: 20,
  high: 30,
  critical: 40
};

const impactWeights: Record<DecisionItem["impact"], number> = {
  low: 8,
  medium: 16,
  high: 24
};

const necessityWeights: Record<DecisionItem["necessity"], number> = {
  optional: 5,
  important: 15,
  essential: 25
};

function getSelectedOption(decision: DecisionItem) {
  const explicit = decision.paymentOptions.find(
    (option) => option.id === decision.selectedPaymentOptionId
  );
  return explicit ?? decision.paymentOptions[0] ?? null;
}

function isSafetyOrHealth(category: DecisionCategory) {
  return category === "safety" || category === "health";
}

function hasIncompleteOption(option: DecisionPaymentOption | null) {
  if (!option) return true;
  if (option.totalAmount <= 0) return true;

  if (option.type === "installments") {
    return (
      !option.creditCardId ||
      !option.firstDueDate ||
      !option.installmentCount ||
      option.installmentCount <= 0 ||
      !option.installmentAmount ||
      option.installmentAmount <= 0
    );
  }

  if (option.type === "mixed") {
    return (
      !option.creditCardId ||
      !option.firstDueDate ||
      !option.installmentCount ||
      option.installmentCount <= 0 ||
      !option.installmentAmount ||
      option.installmentAmount <= 0 ||
      typeof option.upfrontAmount !== "number" ||
      option.upfrontAmount <= 0
    );
  }

  if (option.type === "use-reserve") {
    return !option.reserveId;
  }

  return false;
}

function getMonthlyInstallmentExposure(option: DecisionPaymentOption) {
  if (option.type === "installments" || option.type === "mixed") {
    return option.installmentAmount ?? 0;
  }
  return 0;
}

function getUpfrontAmount(option: DecisionPaymentOption) {
  switch (option.type) {
    case "one-time":
      return option.upfrontAmount ?? option.totalAmount;
    case "mixed":
      return option.upfrontAmount ?? 0;
    case "use-reserve":
      return 0;
    default:
      return 0;
  }
}

function getMonthlySavingsCapacity(finance: FinanceState) {
  const monthOverview = getFinanceOverview(finance, getFinancePeriod("month"), new Date("2026-07-22T12:00:00"));
  return Math.max(
    monthOverview.monthEndProjection - finance.settings.minimumReserve - monthOverview.activeReserveMoney,
    0
  );
}

function getMonthsUntilDate(date: string | null) {
  if (!date) return null;
  const days = daysUntil(date, new Date("2026-07-22T12:00:00"));
  if (days < 0) return 0;
  return Math.max(Math.ceil(days / 30), 1);
}

export function simulateDecision(
  decision: DecisionItem,
  finance: FinanceState,
  rules: DecisionRulesConfig
): DecisionSimulation {
  void rules;
  const overview = getFinanceOverview(finance, getFinancePeriod("month"), new Date("2026-07-22T12:00:00"));
  const option = getSelectedOption(decision);
  const upfrontAmount = option ? getUpfrontAmount(option) : 0;
  const monthlyInstallmentAmount = option ? getMonthlyInstallmentExposure(option) : 0;
  const reserve =
    option?.reserveId
      ? finance.reserves.find((item) => item.id === option.reserveId) ?? null
      : null;
  const reserveBalanceAfterUse =
    reserve && option
      ? Math.max(reserve.savedAmount - Math.min(reserve.savedAmount, option.totalAmount), 0)
      : null;
  const availableAfterDecision = overview.availableToDecide - upfrontAmount;
  const projectedMonthEndAfterDecision =
    overview.monthEndProjection - upfrontAmount - monthlyInstallmentAmount;
  const futureInstallmentDebtAfterDecision =
    overview.futureInstallmentDebt +
    Math.max((option?.installmentAmount ?? 0) * ((option?.installmentCount ?? 1) - 1), 0);

  if (option?.type !== "save-first") {
    return {
      availableAfterDecision,
      projectedMonthEndAfterDecision,
      futureInstallmentDebtAfterDecision,
      monthlyCommitmentIncrease: monthlyInstallmentAmount,
      reserveBalanceAfterUse,
      monthsToSave: null,
      monthlySavingsNeeded: null
    };
  }

  const monthlyCapacity = getMonthlySavingsCapacity(finance);
  const monthsUntilTarget = getMonthsUntilDate(decision.desiredDate);
  const amountMissing = Math.max(option.totalAmount - Math.max(overview.availableToDecide, 0), 0);
  const monthlySavingsNeeded =
    monthsUntilTarget && monthsUntilTarget > 0 ? amountMissing / monthsUntilTarget : amountMissing;
  const monthsToSave =
    monthlyCapacity > 0 ? Math.ceil(amountMissing / monthlyCapacity) : null;

  return {
    availableAfterDecision,
    projectedMonthEndAfterDecision,
    futureInstallmentDebtAfterDecision,
    monthlyCommitmentIncrease: 0,
    reserveBalanceAfterUse,
    monthsToSave,
    monthlySavingsNeeded: Number.isFinite(monthlySavingsNeeded) ? monthlySavingsNeeded : null
  };
}

function buildEvaluation(
  code: DecisionRecommendationCode,
  explanation: string,
  reasons: string[],
  warnings: string[],
  decision: DecisionItem,
  finance: FinanceState,
  rules: DecisionRulesConfig,
  projects: Project[],
  tasks: Task[],
  simulation: DecisionSimulation
): DecisionEvaluation {
  const option = getSelectedOption(decision);
  const overview = getFinanceOverview(finance, getFinancePeriod("month"), new Date("2026-07-22T12:00:00"));
  const linkedProject = decision.projectId
    ? projects.find((project) => project.id === decision.projectId) ?? null
    : null;
  const blockedProject = linkedProject?.status === "Bloqueado";
  const desiredDays = decision.desiredDate ? Math.max(daysUntil(decision.desiredDate, new Date("2026-07-22T12:00:00")), 0) : null;
  const viabilityScore =
    simulation.availableAfterDecision >= 0 && simulation.projectedMonthEndAfterDecision >= 0
      ? 10
      : simulation.projectedMonthEndAfterDecision >= 0
        ? 6
        : 2;
  const breakdown = {
    urgency: urgencyWeights[decision.urgency],
    impact: impactWeights[decision.impact],
    necessity: necessityWeights[decision.necessity],
    category: isSafetyOrHealth(decision.category) ? rules.safetyHealthPriorityBoost : 8,
    date:
      typeof desiredDays === "number"
        ? desiredDays <= 14
          ? 15
          : desiredDays <= 45
            ? 8
            : 4
        : 0,
    project: linkedProject ? 8 : 0,
    blocking: blockedProject ? 10 : 0,
    viability: viabilityScore
  };

  const completionSignals = [
    finance.settings.currentBalance > 0,
    finance.settings.minimumReserve >= 0,
    Boolean(option),
    !hasIncompleteOption(option),
    decision.totalAmount > 0
  ];
  const confidence = Math.round(
    (completionSignals.filter(Boolean).length / completionSignals.length) * 100
  );
  const confidenceLabel = confidence >= 90 ? "Alta" : confidence >= 70 ? "Media" : "Baja";

  return {
    recommendationCode: code,
    title: recommendationTitleMap[code],
    explanation,
    reasons,
    warnings,
    confidence,
    confidenceLabel,
    feasibleFromDate:
      code === "save-first" && simulation.monthsToSave
        ? addMonths("2026-07-22", simulation.monthsToSave)
        : decision.desiredDate,
    metrics: {
      currentBalance: finance.settings.currentBalance,
      availableAfterPayments: overview.availableAfterPayments,
      availableToDecide: overview.availableToDecide,
      monthEndProjection: overview.monthEndProjection,
      futureInstallmentDebt: overview.futureInstallmentDebt,
      activeReserveMoney: overview.activeReserveMoney,
      minimumReserve: finance.settings.minimumReserve,
      pendingPayments: overview.upcomingPayments,
      expectedIncomeInPeriod: overview.expectedIncomeInPeriod,
      totalAmount: decision.totalAmount,
      upfrontAmount: option ? getUpfrontAmount(option) : 0,
      monthlyInstallmentAmount: option ? getMonthlyInstallmentExposure(option) : 0,
      installmentCount: option?.installmentCount ?? 0,
      totalInstallmentExposure:
        (option?.installmentAmount ?? 0) * (option?.installmentCount ?? 0),
      desiredMonthsUntilTarget: getMonthsUntilDate(decision.desiredDate),
      monthlySavingsNeeded: simulation.monthlySavingsNeeded,
      projectedReserveAfterUse: simulation.reserveBalanceAfterUse
    },
    priorityScore: Object.values(breakdown).reduce((total, value) => total + value, 0),
    priorityBreakdown: breakdown
  };
}

const recommendationTitleMap: Record<DecisionRecommendationCode, string> = {
  "buy-now": "Comprar ahora",
  "buy-next-income": "Comprar al proximo ingreso",
  "finance-carefully": "Financiar con precaucion",
  "save-first": "Ahorrar primero",
  "create-reserve": "Crear una reserva",
  "wait-next-month": "Esperar al proximo mes",
  postpone: "Posponer",
  "manual-review": "Requiere revision manual"
};

export function evaluateDecision(
  decision: DecisionItem,
  finance: FinanceState,
  rules: DecisionRulesConfig,
  projects: Project[],
  tasks: Task[]
): DecisionEvaluation {
  const option = getSelectedOption(decision);
  const overview = getFinanceOverview(finance, getFinancePeriod("month"), new Date("2026-07-22T12:00:00"));
  const simulation = simulateDecision(decision, finance, rules);
  const reasons: string[] = [];
  const warnings: string[] = [];

  if (!option || hasIncompleteOption(option)) {
    return buildEvaluation(
      "manual-review",
      "Faltan datos clave para emitir una recomendacion confiable.",
      ["La opcion de pago seleccionada esta incompleta o todavia no existe."],
      ["Completa tarjeta, fechas, cuotas o reserva antes de decidir."],
      decision,
      finance,
      rules,
      projects,
      tasks,
      simulation
    );
  }

  const monthlyIncomeBase = finance.incomes
    .filter((income) => income.recurrence === "monthly")
    .reduce((total, income) => total + income.amount, 0);
  const maxInstallmentCapacity = monthlyIncomeBase * rules.maxNewInstallmentIncomeRatio;
  const minimumPostPurchase = rules.minimumPostPurchaseMargin;
  const reserveProtected =
    simulation.availableAfterDecision >= minimumPostPurchase &&
    simulation.projectedMonthEndAfterDecision >= 0;
  const installmentsSustainable =
    simulation.monthlyCommitmentIncrease <= maxInstallmentCapacity &&
    simulation.projectedMonthEndAfterDecision >= 0 &&
    simulation.futureInstallmentDebtAfterDecision <= rules.maxFutureInstallmentDebt;

  if (isSafetyOrHealth(decision.category) && decision.necessity === "essential" &&
      (decision.urgency === "high" || decision.urgency === "critical") &&
      decision.impact === "high") {
    reasons.push("La decision combina categoria sensible, urgencia alta y necesidad esencial.");
    if (reserveProtected) {
      reasons.push("La compra no rompe la reserva minima ni deja negativa la proyeccion.");
      return buildEvaluation(
        "buy-now",
        "Conviene resolverla ahora porque es prioritaria y la caja actual la soporta.",
        reasons,
        warnings,
        decision,
        finance,
        rules,
        projects,
        tasks,
        simulation
      );
    }
    if (installmentsSustainable) {
      warnings.push("La liquidez actual es ajustada, pero la cuota proyectada sigue siendo sostenible.");
      return buildEvaluation(
        "finance-carefully",
        "La prioridad es alta y, aunque el contado aprieta la liquidez, una financiacion prudente la vuelve viable.",
        reasons,
        warnings,
        decision,
        finance,
        rules,
        projects,
        tasks,
        simulation
      );
    }
    warnings.push("La prioridad es alta pero hoy no hay capacidad clara para cubrirla sin tension.");
    return buildEvaluation(
      "manual-review",
      "La necesidad es urgente, pero hace falta revisar una alternativa minima o una fuente concreta de fondos.",
      reasons,
      warnings,
      decision,
      finance,
      rules,
      projects,
      tasks,
      simulation
    );
  }

  if (option.type === "one-time" || option.type === "use-reserve" || option.type === "mixed") {
    if (reserveProtected) {
      reasons.push("El pago inicial entra dentro del disponible para decidir.");
      reasons.push("La proyeccion del mes sigue no negativa despues de simular la compra.");
      return buildEvaluation(
        simulation.availableAfterDecision >= 0 ? "buy-now" : "buy-next-income",
        simulation.availableAfterDecision >= 0
          ? "El costo entra hoy sin comprometer el margen minimo."
          : "Conviene moverla al proximo ingreso para no ajustar demasiado la caja de hoy.",
        reasons,
        warnings,
        decision,
        finance,
        rules,
        projects,
        tasks,
        simulation
      );
    }
  }

  if (option.type === "installments" || option.type === "mixed") {
    reasons.push("La decision propone repartir el impacto en varios meses.");
    if (installmentsSustainable) {
      if ((option.installmentCount ?? 0) > rules.longFinancingMonths) {
        warnings.push("La financiacion es larga y te deja comprometido durante varios meses.");
      }
      if ((option.interestAmount ?? 0) > option.totalAmount * 0.2) {
        warnings.push("El costo financiero es significativo respecto del valor base.");
      }
      return buildEvaluation(
        "finance-carefully",
        "La cuota entra dentro de la capacidad mensual y no excede el techo de deuda futura definido.",
        reasons,
        warnings,
        decision,
        finance,
        rules,
        projects,
        tasks,
        simulation
      );
    }
    warnings.push("La cuota o la deuda total exceden el umbral configurado para nuevas financiaciones.");
  }

  if (option.type === "save-first") {
    const monthlyCapacity = getMonthlySavingsCapacity(finance);
    reasons.push("La opcion prioriza acumular fondos antes de convertirla en gasto real.");
    if (
      simulation.monthlySavingsNeeded !== null &&
      monthlyCapacity > 0 &&
      simulation.monthlySavingsNeeded <= monthlyCapacity
    ) {
      return buildEvaluation(
        option.reserveId ? "create-reserve" : "save-first",
        option.reserveId
          ? "Conviene sostener o completar una reserva antes de ejecutar la compra."
          : "Hoy no conviene pagarla de golpe; ahorrar primero la vuelve alcanzable.",
        [
          ...reasons,
          `Con un ahorro mensual aproximado de ${Math.round(simulation.monthlySavingsNeeded)} podrias llegar a tiempo.`
        ],
        warnings,
        decision,
        finance,
        rules,
        projects,
        tasks,
        simulation
      );
    }
    warnings.push("El ahorro mensual necesario hoy supera la capacidad estimada del mes.");
  }

  if (decision.necessity === "optional" && overview.monthEndProjection < 0) {
    return buildEvaluation(
      "postpone",
      "No conviene avanzar ahora porque la necesidad es opcional y el mes ya viene tensionado.",
      [
        "La proyeccion mensual ya es negativa o demasiado ajustada.",
        "Existen pagos mas importantes por delante."
      ],
      warnings,
      decision,
      finance,
      rules,
      projects,
      tasks,
      simulation
    );
  }

  if (overview.monthEndProjection < 0 || simulation.projectedMonthEndAfterDecision < 0) {
    return buildEvaluation(
      "wait-next-month",
      "Conviene esperar al proximo mes para no empeorar la liquidez actual.",
      [
        "La compra vuelve negativa o demasiado ajustada la proyeccion del periodo actual."
      ],
      warnings,
      decision,
      finance,
      rules,
      projects,
      tasks,
      simulation
    );
  }

  return buildEvaluation(
    "manual-review",
    "La decision necesita una revision manual porque las reglas no encuentran un camino claro sin tension.",
    ["La combinacion de monto, plazos y liquidez actual no deja una recomendacion simple."],
    warnings,
    decision,
    finance,
    rules,
    projects,
    tasks,
    simulation
  );
}

export function evaluateDecisionList(
  decisions: DecisionItem[],
  finance: FinanceState,
  rules: DecisionRulesConfig,
  projects: Project[],
  tasks: Task[]
) {
  return decisions.map((decision) => {
    const evaluation = evaluateDecision(decision, finance, rules, projects, tasks);
    return {
      ...decision,
      recommendation: evaluation.recommendationCode,
      recommendationReasons: evaluation.reasons,
      evaluation
    };
  });
}

export function compareDecisions(
  decisionIds: string[],
  decisions: DecisionItem[],
  finance: FinanceState,
  rules: DecisionRulesConfig,
  projects: Project[],
  tasks: Task[]
): DecisionComparisonResult {
  const selected = decisions.filter((decision) => decisionIds.includes(decision.id)).slice(0, 4);
  const entries = selected.map((decision) => {
    const evaluation = decision.evaluation ?? evaluateDecision(decision, finance, rules, projects, tasks);
    const option = getSelectedOption(decision);
    const simulation = simulateDecision(decision, finance, rules);
    return {
      decisionId: decision.id,
      name: decision.name,
      category: decision.category,
      totalAmount: option?.totalAmount ?? decision.totalAmount,
      upfrontAmount: option ? getUpfrontAmount(option) : 0,
      installmentAmount: option?.installmentAmount ?? 0,
      installmentCount: option?.installmentCount ?? 0,
      urgency: decision.urgency,
      impact: decision.impact,
      necessity: decision.necessity,
      effectOnAvailableToDecide: simulation.availableAfterDecision,
      effectOnMonthProjection: simulation.projectedMonthEndAfterDecision,
      futureDebtGenerated: simulation.futureInstallmentDebtAfterDecision,
      possiblePurchaseDate: evaluation.feasibleFromDate,
      recommendationTitle: evaluation.title,
      priorityScore: evaluation.priorityScore
    };
  });

  if (entries.length < 2) {
    return { entries, highlights: [] };
  }

  const bestViability = [...entries].sort(
    (a, b) => b.effectOnMonthProjection - a.effectOnMonthProjection
  )[0];
  const highestPriority = [...entries].sort((a, b) => b.priorityScore - a.priorityScore)[0];
  const lowestCost = [...entries].sort((a, b) => a.totalAmount - b.totalAmount)[0];
  const lowestMonthlyImpact = [...entries].sort(
    (a, b) => a.installmentAmount - b.installmentAmount
  )[0];

  return {
    entries,
    highlights: [
      `${bestViability.name} muestra la mejor viabilidad financiera en el corto plazo.`,
      `${highestPriority.name} tiene la prioridad personal mas alta segun urgencia, impacto y necesidad.`,
      `${lowestCost.name} es la opcion de menor costo total.`,
      `${lowestMonthlyImpact.name} tiene el menor impacto mensual comprometido.`
    ]
  };
}

export function createComparison(decisionIds: string[]): DecisionComparison {
  return {
    id: crypto.randomUUID(),
    decisionIds: decisionIds.slice(0, 4),
    createdAt: new Date().toISOString()
  };
}

export function decisionToFormValues(decision: DecisionItem): DecisionFormValues {
  return {
    name: decision.name,
    description: decision.description,
    category: decision.category,
    projectId: decision.projectId ?? "",
    totalAmount: String(decision.totalAmount),
    desiredDate: decision.desiredDate ?? "",
    urgency: decision.urgency,
    impact: decision.impact,
    necessity: decision.necessity,
    status: decision.status,
    selectedPaymentOptionId: decision.selectedPaymentOptionId ?? "",
    paymentOptions: decision.paymentOptions.map((option) => ({
      id: option.id,
      type: option.type,
      totalAmount: String(option.totalAmount),
      upfrontAmount: option.upfrontAmount === null ? "" : String(option.upfrontAmount),
      installmentCount: option.installmentCount === null ? "" : String(option.installmentCount),
      installmentAmount:
        option.installmentAmount === null ? "" : String(option.installmentAmount),
      interestAmount: option.interestAmount === null ? "" : String(option.interestAmount),
      firstDueDate: option.firstDueDate ?? "",
      creditCardId: option.creditCardId ?? "",
      reserveId: option.reserveId ?? "",
      notes: option.notes
    }))
  };
}
