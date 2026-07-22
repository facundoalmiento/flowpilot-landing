import { DecisionsState, FinanceState, PlanningStore } from "../../types/domain";

export function createDefaultFinanceState(
  overrides?: Partial<FinanceState["settings"]> & { reservedCash?: number; cardCloseDate?: string }
): FinanceState {
  const now = "2026-07-22T12:00:00.000Z";
  const closeDayFromLegacy = overrides?.cardCloseDate
    ? Number(overrides.cardCloseDate.slice(-2))
    : 24;
  const reservedCash = overrides?.reservedCash ?? 0;

  return {
    settings: {
      currency: "ARS",
      currentBalance: overrides?.currentBalance ?? 540000,
      minimumReserve: overrides?.minimumReserve ?? 80000,
      salaryPayday: overrides?.salaryPayday ?? 5,
      allowancePayday: overrides?.allowancePayday ?? 20
    },
    creditCards: [
      {
        id: "card-visa",
        name: "Visa",
        limit: 1200000,
        closeDay: closeDayFromLegacy || 24,
        dueDay: 2,
        state: "active",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "card-master",
        name: "Mastercard",
        limit: 950000,
        closeDay: 11,
        dueDay: 18,
        state: "active",
        createdAt: now,
        updatedAt: now
      }
    ],
    incomes: [
      {
        id: "income-salary",
        type: "salary",
        name: "Sueldo mensual",
        amount: 820000,
        expectedDate: "2026-08-05",
        receivedDate: null,
        status: "expected",
        recurrence: "monthly",
        notes: "Dato mock editable para pruebas.",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "income-allowance",
        type: "allowance",
        name: "Viatico",
        amount: 140000,
        expectedDate: "2026-07-27",
        receivedDate: null,
        status: "expected",
        recurrence: "monthly",
        notes: "Dato mock editable para pruebas.",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "income-refund",
        type: "refund",
        name: "Reintegro de compra",
        amount: 32000,
        expectedDate: "2026-07-30",
        receivedDate: null,
        status: "expected",
        recurrence: null,
        notes: "Dato mock editable para pruebas.",
        createdAt: now,
        updatedAt: now
      }
    ],
    expenses: [
      {
        id: "expense-fuel",
        name: "Combustible",
        amount: 28000,
        dueDate: "2026-07-24",
        paidDate: null,
        status: "pending",
        category: "transport",
        paymentMethod: "debit",
        creditCardId: null,
        installmentPlanId: null,
        decisionId: null,
        notes: "Dato mock editable para pruebas.",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "expense-insurance",
        name: "Seguro del auto",
        amount: 52000,
        dueDate: "2026-07-29",
        paidDate: null,
        status: "pending",
        category: "transport",
        paymentMethod: "bank-transfer",
        creditCardId: null,
        installmentPlanId: null,
        decisionId: null,
        notes: "Dato mock editable para pruebas.",
        createdAt: now,
        updatedAt: now
      }
    ],
    commitments: [
      {
        id: "commitment-loan",
        name: "Prestamo personal",
        amount: 165000,
        frequency: "monthly",
        nextDueDate: "2026-07-28",
        startDate: "2026-03-10",
        endDate: "2027-02-10",
        totalInstallments: 12,
        currentInstallment: 5,
        state: "active",
        notes: "Dato mock editable para pruebas.",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "commitment-therapy",
        name: "Psicologo",
        amount: 45000,
        frequency: "monthly",
        nextDueDate: "2026-07-25",
        startDate: "2026-01-05",
        endDate: null,
        totalInstallments: null,
        currentInstallment: null,
        state: "active",
        notes: "Dato mock editable para pruebas.",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "commitment-gym",
        name: "Gimnasio",
        amount: 30000,
        frequency: "monthly",
        nextDueDate: "2026-08-01",
        startDate: "2026-02-01",
        endDate: null,
        totalInstallments: null,
        currentInstallment: null,
        state: "active",
        notes: "Dato mock editable para pruebas.",
        createdAt: now,
        updatedAt: now
      }
    ],
    installmentPlans: [
      {
        id: "installment-laptop",
        description: "Notebook en 6 cuotas",
        creditCardId: "card-visa",
        totalAmount: 720000,
        totalInstallments: 6,
        installmentAmount: 120000,
        firstDueDate: "2026-07-26",
        currentInstallment: 1,
        decisionId: null,
        status: "active",
        createdAt: now,
        updatedAt: now
      }
    ],
    reserves: [
      {
        id: "reserve-trip",
        name: "Reserva para viaje",
        targetAmount: 250000,
        savedAmount: 90000,
        targetDate: "2026-11-10",
        priority: "medium",
        status: "active",
        decisionId: null,
        notes: "Dato mock editable para pruebas.",
        createdAt: now,
        updatedAt: now
      },
      {
        id: "reserve-tires",
        name: "Reserva para cubiertas",
        targetAmount: 420000,
        savedAmount: 60000,
        targetDate: "2026-08-20",
        priority: "high",
        status: "active",
        decisionId: null,
        notes: "Dato mock editable para pruebas.",
        createdAt: now,
        updatedAt: now
      },
      ...(reservedCash > 0
        ? [
            {
              id: "reserve-legacy-cash",
              name: "Reserva migrada",
              targetAmount: reservedCash,
              savedAmount: reservedCash,
              targetDate: null,
              priority: "high" as const,
              status: "active" as const,
              decisionId: null,
              notes: "Reserva creada a partir del estado anterior.",
              createdAt: now,
              updatedAt: now
            }
          ]
        : [])
    ],
    confirmedRecords: [],
    commitmentOccurrences: [],
    manualAdjustments: [],
    monthlyClosures: []
  };
}

export function createDefaultDecisionsState(): DecisionsState {
  const now = "2026-07-22T12:00:00.000Z";
  return {
    rulesConfig: {
      minimumPostPurchaseMargin: 40000,
      maxNewInstallmentIncomeRatio: 0.18,
      maxFutureInstallmentDebt: 900000,
      longFinancingMonths: 9,
      safetyHealthPriorityBoost: 20
    },
    comparisons: [],
    items: [
      {
        id: "decision-wiper",
        name: "Arreglar limpiaparabrisas",
        description: "Resolver el problema antes de volver a usar el auto con lluvia.",
        category: "safety",
        projectId: "project-wiper",
        totalAmount: 95000,
        desiredDate: "2026-07-31",
        urgency: "critical",
        impact: "high",
        necessity: "essential",
        paymentOptions: [
          {
            id: "decision-wiper-cash",
            type: "one-time",
            totalAmount: 95000,
            upfrontAmount: 95000,
            installmentCount: null,
            installmentAmount: null,
            interestAmount: null,
            firstDueDate: "2026-07-31",
            creditCardId: null,
            reserveId: null,
            notes: "Pago unico con taller."
          }
        ],
        selectedPaymentOptionId: "decision-wiper-cash",
        status: "evaluating",
        recommendation: null,
        recommendationReasons: [],
        evaluation: null,
        createdAt: now,
        updatedAt: now,
        resolvedAt: null,
        convertedEntity: null,
        statusHistory: [
          {
            id: "decision-wiper-history-1",
            status: "evaluating",
            changedAt: now,
            note: "Decision creada."
          }
        ]
      },
      {
        id: "decision-tires",
        name: "Comprar cuatro cubiertas",
        description: "Comparar contado, reserva o financiacion corta.",
        category: "transport",
        projectId: "project-tires",
        totalAmount: 420000,
        desiredDate: "2026-08-12",
        urgency: "high",
        impact: "high",
        necessity: "important",
        paymentOptions: [
          {
            id: "decision-tires-cash",
            type: "one-time",
            totalAmount: 420000,
            upfrontAmount: 420000,
            installmentCount: null,
            installmentAmount: null,
            interestAmount: null,
            firstDueDate: "2026-08-12",
            creditCardId: null,
            reserveId: null,
            notes: ""
          },
          {
            id: "decision-tires-save",
            type: "save-first",
            totalAmount: 420000,
            upfrontAmount: null,
            installmentCount: null,
            installmentAmount: null,
            interestAmount: null,
            firstDueDate: null,
            creditCardId: null,
            reserveId: "reserve-tires",
            notes: "Usar reserva existente y completar faltante."
          }
        ],
        selectedPaymentOptionId: "decision-tires-save",
        status: "evaluating",
        recommendation: null,
        recommendationReasons: [],
        evaluation: null,
        createdAt: now,
        updatedAt: now,
        resolvedAt: null,
        convertedEntity: null,
        statusHistory: [
          {
            id: "decision-tires-history-1",
            status: "evaluating",
            changedAt: now,
            note: "Decision creada."
          }
        ]
      },
      {
        id: "decision-mattress",
        name: "Comprar colchon super king",
        description: "Evaluar si conviene ahorrar o financiar.",
        category: "comfort",
        projectId: null,
        totalAmount: 780000,
        desiredDate: "2026-10-15",
        urgency: "medium",
        impact: "high",
        necessity: "important",
        paymentOptions: [
          {
            id: "decision-mattress-installments",
            type: "installments",
            totalAmount: 860000,
            upfrontAmount: null,
            installmentCount: 12,
            installmentAmount: 71667,
            interestAmount: 80000,
            firstDueDate: "2026-08-18",
            creditCardId: "card-master",
            reserveId: null,
            notes: "Financiacion de comercio."
          }
        ],
        selectedPaymentOptionId: "decision-mattress-installments",
        status: "planned",
        recommendation: null,
        recommendationReasons: [],
        evaluation: null,
        createdAt: now,
        updatedAt: now,
        resolvedAt: null,
        convertedEntity: null,
        statusHistory: [
          {
            id: "decision-mattress-history-1",
            status: "planned",
            changedAt: now,
            note: "Decision creada."
          }
        ]
      },
      {
        id: "decision-workbench",
        name: "Construir banco de trabajo",
        description: "Definir si conviene arrancar con compra total o por etapas.",
        category: "personal-project",
        projectId: "project-workbench",
        totalAmount: 90000,
        desiredDate: "2026-08-18",
        urgency: "medium",
        impact: "medium",
        necessity: "important",
        paymentOptions: [
          {
            id: "decision-workbench-cash",
            type: "one-time",
            totalAmount: 90000,
            upfrontAmount: 90000,
            installmentCount: null,
            installmentAmount: null,
            interestAmount: null,
            firstDueDate: "2026-08-03",
            creditCardId: null,
            reserveId: null,
            notes: ""
          }
        ],
        selectedPaymentOptionId: "decision-workbench-cash",
        status: "evaluating",
        recommendation: null,
        recommendationReasons: [],
        evaluation: null,
        createdAt: now,
        updatedAt: now,
        resolvedAt: null,
        convertedEntity: null,
        statusHistory: [
          {
            id: "decision-workbench-history-1",
            status: "evaluating",
            changedAt: now,
            note: "Decision creada."
          }
        ]
      },
      {
        id: "decision-rack-floor",
        name: "Hacer contrapiso para el rack",
        description: "Calcular si conviene fondearlo ahora o separar dinero primero.",
        category: "personal-project",
        projectId: "project-rack-floor",
        totalAmount: 60000,
        desiredDate: "2026-08-09",
        urgency: "medium",
        impact: "medium",
        necessity: "important",
        paymentOptions: [
          {
            id: "decision-rack-floor-cash",
            type: "one-time",
            totalAmount: 60000,
            upfrontAmount: 60000,
            installmentCount: null,
            installmentAmount: null,
            interestAmount: null,
            firstDueDate: "2026-08-01",
            creditCardId: null,
            reserveId: null,
            notes: ""
          }
        ],
        selectedPaymentOptionId: "decision-rack-floor-cash",
        status: "saving",
        recommendation: null,
        recommendationReasons: [],
        evaluation: null,
        createdAt: now,
        updatedAt: now,
        resolvedAt: null,
        convertedEntity: null,
        statusHistory: [
          {
            id: "decision-rack-floor-history-1",
            status: "saving",
            changedAt: now,
            note: "Decision creada."
          }
        ]
      },
      {
        id: "decision-flat-bench-materials",
        name: "Comprar materiales para banco plano",
        description: "Materiales puntuales para cerrar el proyecto de entrenamiento.",
        category: "training",
        projectId: "project-flat-bench",
        totalAmount: 45000,
        desiredDate: "2026-07-30",
        urgency: "high",
        impact: "medium",
        necessity: "important",
        paymentOptions: [
          {
            id: "decision-flat-bench-materials-cash",
            type: "one-time",
            totalAmount: 45000,
            upfrontAmount: 45000,
            installmentCount: null,
            installmentAmount: null,
            interestAmount: null,
            firstDueDate: "2026-07-30",
            creditCardId: null,
            reserveId: null,
            notes: ""
          }
        ],
        selectedPaymentOptionId: "decision-flat-bench-materials-cash",
        status: "approved",
        recommendation: null,
        recommendationReasons: [],
        evaluation: null,
        createdAt: now,
        updatedAt: now,
        resolvedAt: null,
        convertedEntity: null,
        statusHistory: [
          {
            id: "decision-flat-bench-materials-history-1",
            status: "approved",
            changedAt: now,
            note: "Decision creada."
          }
        ]
      },
      {
        id: "decision-trip",
        name: "Viaje planificado",
        description: "Evaluar si la reserva actual alcanza o si conviene seguir ahorrando.",
        category: "travel",
        projectId: null,
        totalAmount: 250000,
        desiredDate: "2026-11-10",
        urgency: "low",
        impact: "medium",
        necessity: "optional",
        paymentOptions: [
          {
            id: "decision-trip-reserve",
            type: "use-reserve",
            totalAmount: 250000,
            upfrontAmount: null,
            installmentCount: null,
            installmentAmount: null,
            interestAmount: null,
            firstDueDate: null,
            creditCardId: null,
            reserveId: "reserve-trip",
            notes: ""
          }
        ],
        selectedPaymentOptionId: "decision-trip-reserve",
        status: "saving",
        recommendation: null,
        recommendationReasons: [],
        evaluation: null,
        createdAt: now,
        updatedAt: now,
        resolvedAt: null,
        convertedEntity: null,
        statusHistory: [
          {
            id: "decision-trip-history-1",
            status: "saving",
            changedAt: now,
            note: "Decision creada."
          }
        ]
      }
    ]
  };
}

export const seedStore: PlanningStore = {
  finance: createDefaultFinanceState(),
  decisions: createDefaultDecisionsState(),
  projects: [
    {
      id: "project-morga",
      name: "Terminar Morga",
      category: "Carrera IT",
      description:
        "Convertir Morga en una web app util, prolija y fuerte para portfolio frontend.",
      status: "En progreso",
      priority: "Critica",
      targetDate: "2026-07-31",
      costEstimated: 0,
      progress: 0,
      nextAction: "Cerrar el detalle de proyecto y el CRUD de tareas.",
      blockedReason: "",
      updatedAt: "2026-07-21T21:15:00.000Z",
      createdAt: "2026-07-02T14:00:00.000Z"
    },
    {
      id: "project-cuatris-responsive",
      name: "Corregir responsive de Locos por los Cuatris",
      category: "Carrera IT",
      description:
        "Ajustar layouts, evitar cortes y dejar la experiencia bien resuelta en movil.",
      status: "Pendiente",
      priority: "Alta",
      targetDate: "2026-07-29",
      costEstimated: 0,
      progress: 0,
      nextAction: "Revisar breakpoints 390, 768 y 1024 con capturas lado a lado.",
      blockedReason: "",
      updatedAt: "2026-07-18T19:00:00.000Z",
      createdAt: "2026-07-10T10:00:00.000Z"
    },
    {
      id: "project-portfolio",
      name: "Actualizar portfolio y CV",
      category: "Carrera IT",
      description:
        "Ordenar proyectos, mejorar copy personal y dejar portfolio mas convincente para buscar trabajo.",
      status: "Pendiente",
      priority: "Alta",
      targetDate: "2026-08-05",
      costEstimated: 0,
      progress: 0,
      nextAction: "Escribir version corta del perfil junior y reorganizar secciones.",
      blockedReason: "",
      updatedAt: "2026-07-16T18:30:00.000Z",
      createdAt: "2026-07-08T15:30:00.000Z"
    },
    {
      id: "project-wiper",
      name: "Arreglar limpiaparabrisas",
      category: "Auto",
      description:
        "Resolver el problema del limpiaparabrisas antes de seguir usando el auto con lluvia.",
      status: "Bloqueado",
      priority: "Alta",
      targetDate: "2026-07-24",
      costEstimated: 35000,
      progress: 0,
      nextAction: "",
      blockedReason: "Falta confirmar si conviene cambiar motor o brazo completo.",
      updatedAt: "2026-07-11T12:15:00.000Z",
      createdAt: "2026-07-03T11:15:00.000Z"
    },
    {
      id: "project-tires",
      name: "Evaluar la compra de cubiertas",
      category: "Auto",
      description:
        "Comparar costo, urgencia y posibilidad real de compra para las cuatro cubiertas.",
      status: "Pendiente",
      priority: "Critica",
      targetDate: "2026-08-12",
      costEstimated: 420000,
      progress: 0,
      nextAction: "Anotar tres presupuestos y revisar si entra con la reserva actual.",
      blockedReason: "",
      updatedAt: "2026-07-19T16:20:00.000Z",
      createdAt: "2026-07-05T16:20:00.000Z"
    },
    {
      id: "project-flat-bench",
      name: "Terminar el banco plano",
      category: "Entrenamiento",
      description: "Completar el banco plano para entrenar mejor en casa.",
      status: "En progreso",
      priority: "Media",
      targetDate: "2026-08-02",
      costEstimated: 45000,
      progress: 0,
      nextAction: "Comprar tornillos faltantes y ajustar el respaldo.",
      blockedReason: "",
      updatedAt: "2026-07-17T14:10:00.000Z",
      createdAt: "2026-06-28T09:00:00.000Z"
    },
    {
      id: "project-rack-floor",
      name: "Hacer el contrapiso del rack",
      category: "Muebles y proyectos DIY",
      description: "Dejar lista la base para avanzar con el rack del taller.",
      status: "Pendiente",
      priority: "Media",
      targetDate: "2026-08-09",
      costEstimated: 60000,
      progress: 0,
      nextAction: "Definir materiales y medir superficie exacta.",
      blockedReason: "",
      updatedAt: "2026-07-09T11:50:00.000Z",
      createdAt: "2026-07-01T11:50:00.000Z"
    },
    {
      id: "project-workbench",
      name: "Construir el banco de trabajo",
      category: "Muebles y proyectos DIY",
      description:
        "Armar un banco de trabajo firme para organizar mejor herramientas y proyectos.",
      status: "Pendiente",
      priority: "Media",
      targetDate: "2026-08-18",
      costEstimated: 90000,
      progress: 0,
      nextAction: "Cerrar medidas finales y cotizar madera y perfil.",
      blockedReason: "",
      updatedAt: "2026-07-13T13:10:00.000Z",
      createdAt: "2026-07-04T13:10:00.000Z"
    }
  ],
  tasks: [
    {
      id: "task-morga-dashboard",
      title: "Conectar dashboard a tareas reales",
      description: "Actualizar prioridades, vencimientos y alertas desde tareas persistidas.",
      projectId: "project-morga",
      sourceDecisionId: null,
      priority: "critical",
      status: "in-progress",
      dueDate: "2026-07-23",
      estimatedCost: null,
      isNextAction: true,
      createdAt: "2026-07-18T09:00:00.000Z",
      updatedAt: "2026-07-21T21:05:00.000Z",
      completedAt: null
    },
    {
      id: "task-morga-task-crud",
      title: "Crear CRUD de tareas de Morga",
      description: "Dejar alta, edicion, eliminacion y cambios de estado funcionando.",
      projectId: "project-morga",
      sourceDecisionId: null,
      priority: "high",
      status: "pending",
      dueDate: "2026-07-24",
      estimatedCost: null,
      isNextAction: false,
      createdAt: "2026-07-18T09:10:00.000Z",
      updatedAt: "2026-07-20T20:40:00.000Z",
      completedAt: null
    },
    {
      id: "task-morga-project-detail",
      title: "Armar detalle de proyecto",
      description: "Mostrar datos del proyecto, acciones y tareas asociadas en una ruta propia.",
      projectId: "project-morga",
      sourceDecisionId: null,
      priority: "high",
      status: "completed",
      dueDate: "2026-07-21",
      estimatedCost: null,
      isNextAction: false,
      createdAt: "2026-07-17T12:00:00.000Z",
      updatedAt: "2026-07-21T18:30:00.000Z",
      completedAt: "2026-07-21T18:30:00.000Z"
    },
    {
      id: "task-cuatris-mobile",
      title: "Revisar responsive mobile de Locos por los Cuatris",
      description: "Verificar hero, cards y botones en 390 px.",
      projectId: "project-cuatris-responsive",
      sourceDecisionId: null,
      priority: "high",
      status: "pending",
      dueDate: "2026-07-26",
      estimatedCost: null,
      isNextAction: true,
      createdAt: "2026-07-15T10:00:00.000Z",
      updatedAt: "2026-07-18T19:00:00.000Z",
      completedAt: null
    },
    {
      id: "task-cuatris-desktop",
      title: "Corregir espacios en pantallas grandes",
      description: "Ajustar separacion y ancho util en 1440 y 1920 px.",
      projectId: "project-cuatris-responsive",
      sourceDecisionId: null,
      priority: "medium",
      status: "pending",
      dueDate: "2026-07-28",
      estimatedCost: null,
      isNextAction: false,
      createdAt: "2026-07-15T10:30:00.000Z",
      updatedAt: "2026-07-18T19:10:00.000Z",
      completedAt: null
    },
    {
      id: "task-portfolio-copy",
      title: "Preparar CV para una postulacion Frontend",
      description: "Actualizar perfil, stack y experiencia para una version breve y clara.",
      projectId: "project-portfolio",
      sourceDecisionId: null,
      priority: "high",
      status: "pending",
      dueDate: "2026-07-28",
      estimatedCost: null,
      isNextAction: true,
      createdAt: "2026-07-12T09:00:00.000Z",
      updatedAt: "2026-07-16T18:30:00.000Z",
      completedAt: null
    },
    {
      id: "task-portfolio-projects",
      title: "Actualizar proyectos destacados del portfolio",
      description: "Reordenar trabajos, mejorar capturas y simplificar copy.",
      projectId: "project-portfolio",
      sourceDecisionId: null,
      priority: "medium",
      status: "in-progress",
      dueDate: "2026-08-01",
      estimatedCost: null,
      isNextAction: false,
      createdAt: "2026-07-12T10:00:00.000Z",
      updatedAt: "2026-07-16T18:45:00.000Z",
      completedAt: null
    },
    {
      id: "task-wiper-diagnosis",
      title: "Pedir presupuesto del limpiaparabrisas",
      description: "Confirmar si el problema esta en motor, brazo o instalacion.",
      projectId: "project-wiper",
      sourceDecisionId: null,
      priority: "high",
      status: "pending",
      dueDate: "2026-07-22",
      estimatedCost: 35000,
      isNextAction: false,
      createdAt: "2026-07-05T14:00:00.000Z",
      updatedAt: "2026-07-11T12:15:00.000Z",
      completedAt: null
    },
    {
      id: "task-tires-budget",
      title: "Comparar precios de cubiertas",
      description: "Comparar al menos tres opciones para las cuatro cubiertas.",
      projectId: "project-tires",
      sourceDecisionId: null,
      priority: "critical",
      status: "pending",
      dueDate: "2026-07-27",
      estimatedCost: 420000,
      isNextAction: true,
      createdAt: "2026-07-07T18:00:00.000Z",
      updatedAt: "2026-07-19T16:20:00.000Z",
      completedAt: null
    },
    {
      id: "task-tires-financing",
      title: "Revisar si las cubiertas entran sin romper la reserva",
      description: "Cruzar presupuestos con saldo actual y prioridad real.",
      projectId: "project-tires",
      sourceDecisionId: null,
      priority: "high",
      status: "pending",
      dueDate: "2026-07-29",
      estimatedCost: null,
      isNextAction: false,
      createdAt: "2026-07-08T11:30:00.000Z",
      updatedAt: "2026-07-19T16:25:00.000Z",
      completedAt: null
    },
    {
      id: "task-bench-hardware",
      title: "Comprar tornillos y arandelas",
      description: "Cerrar los faltantes para terminar el banco plano.",
      projectId: "project-flat-bench",
      sourceDecisionId: null,
      priority: "medium",
      status: "completed",
      dueDate: "2026-07-20",
      estimatedCost: 12000,
      isNextAction: false,
      createdAt: "2026-07-12T17:00:00.000Z",
      updatedAt: "2026-07-20T19:00:00.000Z",
      completedAt: "2026-07-20T19:00:00.000Z"
    },
    {
      id: "task-bench-backrest",
      title: "Ajustar respaldo del banco plano",
      description: "Probar inclinacion final y reforzar union.",
      projectId: "project-flat-bench",
      sourceDecisionId: null,
      priority: "medium",
      status: "in-progress",
      dueDate: "2026-07-30",
      estimatedCost: null,
      isNextAction: true,
      createdAt: "2026-07-13T17:00:00.000Z",
      updatedAt: "2026-07-17T14:10:00.000Z",
      completedAt: null
    },
    {
      id: "task-rack-floor",
      title: "Hacer contrapiso para el rack",
      description: "Preparar la base y dejarla nivelada para avanzar con el taller.",
      projectId: "project-rack-floor",
      sourceDecisionId: null,
      priority: "medium",
      status: "pending",
      dueDate: "2026-08-01",
      estimatedCost: 60000,
      isNextAction: true,
      createdAt: "2026-07-09T12:10:00.000Z",
      updatedAt: "2026-07-09T12:10:00.000Z",
      completedAt: null
    },
    {
      id: "task-rack-measure",
      title: "Medir materiales del banco plano",
      description: "Tomar medidas finales de madera y herrajes para no comprar de mas.",
      projectId: "project-rack-floor",
      sourceDecisionId: null,
      priority: "low",
      status: "pending",
      dueDate: null,
      estimatedCost: null,
      isNextAction: false,
      createdAt: "2026-07-09T12:30:00.000Z",
      updatedAt: "2026-07-09T12:30:00.000Z",
      completedAt: null
    },
    {
      id: "task-workbench-quote",
      title: "Cotizar madera para banco de trabajo",
      description: "Pedir precios de materiales principales y herrajes.",
      projectId: "project-workbench",
      sourceDecisionId: null,
      priority: "medium",
      status: "pending",
      dueDate: "2026-08-03",
      estimatedCost: 90000,
      isNextAction: true,
      createdAt: "2026-07-08T18:00:00.000Z",
      updatedAt: "2026-07-13T13:10:00.000Z",
      completedAt: null
    }
  ]
};
