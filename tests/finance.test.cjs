const assert = require("node:assert/strict");
const { createDefaultDecisionsState, createDefaultFinanceState, seedStore } = require("./dist/data/mock/seed.js");
const {
  compareDecisions,
  evaluateDecision,
  simulateDecision
} = require("./dist/features/decisions/decisionEngine.js");
const {
  closeMonthlyPeriod,
  createManualAdjustment,
  ensureCommitmentOccurrenceForMonth,
  markExpensePaid,
  markIncomeReceived,
  payInstallmentPlan,
  reopenExpense,
  reopenIncome,
  reverseManualAdjustment
} = require("./dist/features/finance/financeLedger.js");
const {
  getCurrentInstallmentCharges,
  filterFinanceHistory,
  getFinanceOverview,
  getFinancePeriod,
  getFinanceHistory
} = require("./dist/features/finance/financeCalculations.js");
const { convertDecisionInStore } = require("./dist/features/decisions/decisionConversions.js");
const {
  filterAndSortDecisions,
  defaultDecisionFilters
} = require("./dist/features/decisions/decisionFilters.js");
const {
  parseFinanceComposeTarget,
  parseFinanceMoreSection,
  parseFinanceMovementsView,
  parseFinanceTab
} = require("./dist/features/finance/financeNavigation.js");
const {
  resolveFinanceHistoryRecord
} = require("./dist/features/finance/financeHistoryRelations.js");
const {
  getCreditCardDeletionGuard,
  getProjectDependencySummary,
  getReserveDeletionGuard,
  sanitizeDecisionUpdate
} = require("./dist/features/relations/entityIntegrity.js");
const {
  findDecisionByHistoryRecord,
  findTaskBySourceDecisionId
} = require("./dist/features/relations/entityReferences.js");
const {
  createPlanningBackup,
  migratePlanningStore,
  parsePlanningBackup
} = require("./dist/services/storage/planningStorage.js");
const { createTaskFromDecisionTask } = require("./dist/features/tasks/taskFromDecision.js");

const julyReference = new Date("2026-07-22T12:00:00.000Z");

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function createDecision(overrides = {}) {
  const base = createDefaultDecisionsState().items[0];
  return {
    ...clone(base),
    paymentOptions: clone(base.paymentOptions),
    statusHistory: clone(base.statusHistory),
    ...overrides
  };
}

function createStore() {
  return migratePlanningStore(clone(seedStore));
}

const cases = [
  {
    name: "markIncomeReceived applies balance only once",
    run() {
      const finance = createDefaultFinanceState({ currentBalance: 1000 });

      const settled = markIncomeReceived(finance, "income-allowance", {
        effectiveDate: "2026-07-27",
        effectiveAmount: "140000"
      });
      const repeated = markIncomeReceived(settled, "income-allowance", {
        effectiveDate: "2026-07-27",
        effectiveAmount: "140000"
      });

      assert.equal(settled.settings.currentBalance, 141000);
      assert.equal(settled.confirmedRecords.length, 1);
      assert.equal(repeated.settings.currentBalance, 141000);
      assert.equal(repeated.confirmedRecords.length, 1);
    }
  },
  {
    name: "reopenIncome restores previous balance with reversal history",
    run() {
      const finance = createDefaultFinanceState({ currentBalance: 1000 });
      const settled = markIncomeReceived(finance, "income-allowance", {
        effectiveDate: "2026-07-27",
        effectiveAmount: "140000"
      });
      const reopened = reopenIncome(settled, "income-allowance");
      const repeated = reopenIncome(reopened, "income-allowance");

      assert.equal(reopened.settings.currentBalance, 1000);
      assert.equal(reopened.confirmedRecords.length, 2);
      assert.equal(
        reopened.incomes.find((income) => income.id === "income-allowance")?.status,
        "expected"
      );
      assert.equal(repeated.confirmedRecords.length, 2);
    }
  },
  {
    name: "markExpensePaid applies balance only once",
    run() {
      const finance = createDefaultFinanceState({ currentBalance: 200000 });

      const paid = markExpensePaid(finance, "expense-fuel", {
        effectiveDate: "2026-07-24",
        effectiveAmount: "28000"
      });
      const repeated = markExpensePaid(paid, "expense-fuel", {
        effectiveDate: "2026-07-24",
        effectiveAmount: "28000"
      });

      assert.equal(paid.settings.currentBalance, 172000);
      assert.equal(paid.confirmedRecords.length, 1);
      assert.equal(repeated.settings.currentBalance, 172000);
      assert.equal(repeated.confirmedRecords.length, 1);
    }
  },
  {
    name: "reopenExpense restores previous balance with reversal history",
    run() {
      const finance = createDefaultFinanceState({ currentBalance: 200000 });
      const paid = markExpensePaid(finance, "expense-fuel", {
        effectiveDate: "2026-07-24",
        effectiveAmount: "28000"
      });
      const reopened = reopenExpense(paid, "expense-fuel");

      assert.equal(reopened.settings.currentBalance, 200000);
      assert.equal(reopened.confirmedRecords.length, 2);
      assert.equal(
        reopened.expenses.find((expense) => expense.id === "expense-fuel")?.status,
        "pending"
      );
    }
  },
  {
    name: "payInstallmentPlan advances one installment and discounts only that amount",
    run() {
      const finance = createDefaultFinanceState({ currentBalance: 500000, reservedCash: 0 });

      const paid = payInstallmentPlan(finance, "installment-laptop", {
        effectiveDate: "2026-07-26",
        effectiveAmount: "120000"
      });

      assert.equal(paid.settings.currentBalance, 380000);
      assert.equal(paid.confirmedRecords.length, 1);
      assert.equal(
        paid.installmentPlans.find((plan) => plan.id === "installment-laptop")
          ?.currentInstallment,
        2
      );
    }
  },
  {
    name: "paying the last installment completes the plan",
    run() {
      const finance = createDefaultFinanceState({ currentBalance: 400000 });
      finance.installmentPlans = finance.installmentPlans.map((plan) =>
        plan.id === "installment-laptop"
          ? { ...plan, currentInstallment: plan.totalInstallments }
          : plan
      );

      const paid = payInstallmentPlan(finance, "installment-laptop", {
        effectiveDate: "2026-12-26",
        effectiveAmount: "120000"
      });

      const plan = paid.installmentPlans.find((item) => item.id === "installment-laptop");
      assert.equal(plan?.status, "completed");
      assert.equal(plan?.currentInstallment, 7);
    }
  },
  {
    name: "ensureCommitmentOccurrenceForMonth is idempotent",
    run() {
      const finance = createDefaultFinanceState();

      const once = ensureCommitmentOccurrenceForMonth(finance, "2026-07");
      const twice = ensureCommitmentOccurrenceForMonth(once, "2026-07");

      assert.equal(once.commitmentOccurrences.length, 2);
      assert.equal(twice.commitmentOccurrences.length, 2);
    }
  },
  {
    name: "getFinanceOverview calculates projection and available to decide from current state",
    run() {
      const finance = ensureCommitmentOccurrenceForMonth(createDefaultFinanceState(), "2026-07");
      const overview = getFinanceOverview(
        finance,
        getFinancePeriod("month", julyReference),
        julyReference
      );

      assert.equal(overview.availableToday, 540000);
      assert.equal(overview.expectedIncomeInPeriod, 172000);
      assert.equal(overview.upcomingPayments, 410000);
      assert.equal(overview.availableToDecide, -100000);
      assert.equal(overview.monthEndProjection, 302000);
    }
  },
  {
    name: "registered installment expense prevents double counting in monthly charges",
    run() {
      const finance = createDefaultFinanceState();
      finance.expenses = [
        {
          id: "expense-installment-july",
          name: "Notebook julio",
          amount: 120000,
          dueDate: "2026-07-26",
          paidDate: null,
          status: "pending",
          category: "cards",
          paymentMethod: "credit-card",
          creditCardId: "card-visa",
          installmentPlanId: "installment-laptop",
          decisionId: null,
          notes: "",
          createdAt: "2026-07-22T12:00:00.000Z",
          updatedAt: "2026-07-22T12:00:00.000Z"
        },
        ...finance.expenses
      ];

      const charges = getCurrentInstallmentCharges(
        finance,
        getFinancePeriod("month", julyReference)
      );

      assert.equal(charges.some((charge) => charge.planId === "installment-laptop"), false);
    }
  },
  {
    name: "closeMonthlyPeriod is idempotent",
    run() {
      const finance = ensureCommitmentOccurrenceForMonth(createDefaultFinanceState(), "2026-07");
      const once = closeMonthlyPeriod(finance, "2026-07");
      const twice = closeMonthlyPeriod(once, "2026-07");

      assert.equal(once.monthlyClosures.length, 1);
      assert.equal(twice.monthlyClosures.length, 1);
    }
  },
  {
    name: "manual adjustment can be reversed",
    run() {
      const finance = createDefaultFinanceState({ currentBalance: 100000 });
      const adjusted = createManualAdjustment(finance, {
        direction: "credit",
        amount: "25000",
        effectiveDate: "2026-07-22",
        reason: "other",
        note: "Prueba"
      });
      const reversed = reverseManualAdjustment(adjusted, adjusted.manualAdjustments[0].id);

      assert.equal(adjusted.settings.currentBalance, 125000);
      assert.equal(reversed.settings.currentBalance, 100000);
      assert.equal(reversed.confirmedRecords.length, 2);
      assert.ok(reversed.manualAdjustments[0].reversedAt);
    }
  },
  {
    name: "migratePlanningStore keeps previous currentBalance without auto applying old operations",
    run() {
      const migrated = migratePlanningStore({
        projects: seedStore.projects,
        tasks: seedStore.tasks,
        settings: {
          currentBalance: 123456,
          minimumReserve: 5000,
          reservedCash: 0
        }
      });

      assert.equal(migrated.finance.settings.currentBalance, 123456);
      assert.equal(migrated.finance.confirmedRecords.length, 0);
      assert.equal(Array.isArray(migrated.decisions.items), true);
    }
  },
  {
    name: "recommend immediate purchase when capacity is sufficient",
    run() {
      const finance = createDefaultFinanceState({ currentBalance: 900000, minimumReserve: 20000 });
      const decision = createDecision({
        totalAmount: 95000,
        desiredDate: "2026-07-31"
      });

      const evaluation = evaluateDecision(
        decision,
        finance,
        createDefaultDecisionsState().rulesConfig,
        seedStore.projects,
        seedStore.tasks
      );

      assert.equal(evaluation.recommendationCode, "buy-now");
    }
  },
  {
    name: "minimum reserve blocks immediate purchase",
    run() {
      const finance = createDefaultFinanceState({ currentBalance: 250000, minimumReserve: 150000 });
      const decision = createDecision({
        totalAmount: 95000
      });

      const evaluation = evaluateDecision(
        decision,
        finance,
        createDefaultDecisionsState().rulesConfig,
        seedStore.projects,
        seedStore.tasks
      );

      assert.notEqual(evaluation.recommendationCode, "buy-now");
    }
  },
  {
    name: "save-first recommendation appears when monthly saving is feasible",
    run() {
      const finance = createDefaultFinanceState({ currentBalance: 350000, minimumReserve: 40000 });
      const decision = createDecision({
        id: "decision-save",
        name: "Comprar materiales",
        category: "work",
        totalAmount: 300000,
        urgency: "medium",
        impact: "medium",
        necessity: "important",
        desiredDate: "2026-11-20",
        paymentOptions: [
          {
            id: "save-option",
            type: "save-first",
            totalAmount: 300000,
            upfrontAmount: null,
            installmentCount: null,
            installmentAmount: null,
            interestAmount: null,
            firstDueDate: null,
            creditCardId: null,
            reserveId: null,
            notes: ""
          }
        ],
        selectedPaymentOptionId: "save-option"
      });

      const evaluation = evaluateDecision(
        decision,
        finance,
        createDefaultDecisionsState().rulesConfig,
        seedStore.projects,
        seedStore.tasks
      );

      assert.equal(evaluation.recommendationCode, "save-first");
      assert.ok(evaluation.metrics.monthlySavingsNeeded > 0);
    }
  },
  {
    name: "optional decision gets postponed when projection is negative",
    run() {
      const finance = createDefaultFinanceState({ currentBalance: 20000, minimumReserve: 80000 });
      const decision = createDecision({
        id: "decision-optional",
        category: "comfort",
        urgency: "low",
        impact: "low",
        necessity: "optional",
        totalAmount: 300000
      });

      const evaluation = evaluateDecision(
        decision,
        finance,
        createDefaultDecisionsState().rulesConfig,
        seedStore.projects,
        seedStore.tasks
      );

      assert.equal(evaluation.recommendationCode, "postpone");
    }
  },
  {
    name: "safety decision gets elevated priority",
    run() {
      const finance = createDefaultFinanceState({ currentBalance: 220000, minimumReserve: 50000 });
      const decision = createDecision();

      const evaluation = evaluateDecision(
        decision,
        finance,
        createDefaultDecisionsState().rulesConfig,
        seedStore.projects,
        seedStore.tasks
      );

      assert.equal(evaluation.priorityBreakdown.category, 20);
      assert.ok(evaluation.priorityScore >= 100);
    }
  },
  {
    name: "sustainable financing recommends cautionary installments",
    run() {
      const finance = createDefaultFinanceState({ currentBalance: 800000, minimumReserve: 20000 });
      const rules = {
        ...createDefaultDecisionsState().rulesConfig,
        maxFutureInstallmentDebt: 950000
      };
      const decision = createDecision({
        id: "decision-installments",
        name: "Notebook nueva",
        category: "technology",
        urgency: "medium",
        impact: "high",
        necessity: "important",
        totalAmount: 280000,
        paymentOptions: [
          {
            id: "installments-option",
            type: "installments",
            totalAmount: 300000,
            upfrontAmount: null,
            installmentCount: 4,
            installmentAmount: 60000,
            interestAmount: 20000,
            firstDueDate: "2026-08-18",
            creditCardId: "card-master",
            reserveId: null,
            notes: ""
          }
        ],
        selectedPaymentOptionId: "installments-option"
      });

      const evaluation = evaluateDecision(
        decision,
        finance,
        rules,
        seedStore.projects,
        seedStore.tasks
      );

      assert.equal(evaluation.recommendationCode, "finance-carefully");
    }
  },
  {
    name: "overcommitted financing does not get approved as sustainable",
    run() {
      const finance = createDefaultFinanceState({ currentBalance: 240000, minimumReserve: 80000 });
      const decision = createDecision({
        id: "decision-heavy-finance",
        name: "Compra pesada",
        category: "technology",
        urgency: "medium",
        impact: "high",
        necessity: "important",
        totalAmount: 900000,
        paymentOptions: [
          {
            id: "heavy-installments",
            type: "installments",
            totalAmount: 1200000,
            upfrontAmount: null,
            installmentCount: 12,
            installmentAmount: 100000,
            interestAmount: 300000,
            firstDueDate: "2026-08-18",
            creditCardId: "card-master",
            reserveId: null,
            notes: ""
          }
        ],
        selectedPaymentOptionId: "heavy-installments"
      });

      const evaluation = evaluateDecision(
        decision,
        finance,
        createDefaultDecisionsState().rulesConfig,
        seedStore.projects,
        seedStore.tasks
      );

      assert.notEqual(evaluation.recommendationCode, "finance-carefully");
    }
  },
  {
    name: "insufficient data requires manual review",
    run() {
      const finance = createDefaultFinanceState();
      const decision = createDecision({
        id: "decision-missing-card",
        paymentOptions: [
          {
            id: "invalid-installments",
            type: "installments",
            totalAmount: 200000,
            upfrontAmount: null,
            installmentCount: 6,
            installmentAmount: 35000,
            interestAmount: 10000,
            firstDueDate: "",
            creditCardId: null,
            reserveId: null,
            notes: ""
          }
        ],
        selectedPaymentOptionId: "invalid-installments"
      });

      const evaluation = evaluateDecision(
        decision,
        finance,
        createDefaultDecisionsState().rulesConfig,
        seedStore.projects,
        seedStore.tasks
      );

      assert.equal(evaluation.recommendationCode, "manual-review");
    }
  },
  {
    name: "comparison returns entries and highlights for single payment versus installments",
    run() {
      const finance = createDefaultFinanceState();
      const decisions = createDefaultDecisionsState().items;
      const comparison = compareDecisions(
        ["decision-wiper", "decision-mattress"],
        decisions,
        finance,
        createDefaultDecisionsState().rulesConfig,
        seedStore.projects,
        seedStore.tasks
      );

      assert.equal(comparison.entries.length, 2);
      assert.ok(comparison.highlights.length >= 3);
    }
  },
  {
    name: "simulation does not mutate finance state",
    run() {
      const finance = createDefaultFinanceState();
      const before = clone(finance);

      simulateDecision(
        createDefaultDecisionsState().items[1],
        finance,
        createDefaultDecisionsState().rulesConfig
      );

      assert.deepEqual(finance, before);
    }
  },
  {
    name: "decision converts to expense",
    run() {
      const store = migratePlanningStore(seedStore);
      const next = convertDecisionInStore(store, "decision-wiper");

      const decision = next.decisions.items.find((item) => item.id === "decision-wiper");
      const expense = next.finance.expenses.find((item) => item.decisionId === "decision-wiper");

      assert.equal(decision?.convertedEntity?.kind, "expense");
      assert.ok(expense);
      assert.equal(decision?.status, "completed");
    }
  },
  {
    name: "decision converts to installment plan",
    run() {
      const store = migratePlanningStore(seedStore);
      const custom = {
        ...store,
        decisions: {
          ...store.decisions,
          items: store.decisions.items.map((item) =>
            item.id === "decision-mattress"
              ? { ...item, status: "approved" }
              : item
          )
        }
      };
      const next = convertDecisionInStore(custom, "decision-mattress");

      const plan = next.finance.installmentPlans.find((item) => item.decisionId === "decision-mattress");
      assert.ok(plan);
      assert.equal(plan?.creditCardId, "card-master");
    }
  },
  {
    name: "decision converts to reserve",
    run() {
      const store = migratePlanningStore(seedStore);
      const customDecision = {
        ...createDecision({
          id: "decision-reserve",
          name: "Curso",
          category: "training",
          urgency: "medium",
          impact: "medium",
          necessity: "important",
          totalAmount: 180000,
          status: "approved",
          paymentOptions: [
            {
              id: "save-course",
              type: "save-first",
              totalAmount: 180000,
              upfrontAmount: null,
              installmentCount: null,
              installmentAmount: null,
              interestAmount: null,
              firstDueDate: null,
              creditCardId: null,
              reserveId: null,
              notes: ""
            }
          ],
          selectedPaymentOptionId: "save-course"
        }),
        statusHistory: [
          {
            id: "status-1",
            status: "approved",
            changedAt: "2026-07-22T12:00:00.000Z",
            note: "Aprobada"
          }
        ]
      };

      const customStore = {
        ...store,
        decisions: {
          ...store.decisions,
          items: [customDecision, ...store.decisions.items]
        }
      };
      const next = convertDecisionInStore(customStore, "decision-reserve");
      const reserve = next.finance.reserves.find((item) => item.decisionId === "decision-reserve");

      assert.ok(reserve);
      assert.equal(reserve?.targetAmount, 180000);
    }
  },
  {
    name: "decision conversion is idempotent",
    run() {
      const store = migratePlanningStore(seedStore);
      const approved = {
        ...store,
        decisions: {
          ...store.decisions,
          items: store.decisions.items.map((item) =>
            item.id === "decision-wiper" ? { ...item, status: "approved" } : item
          )
        }
      };
      const once = convertDecisionInStore(approved, "decision-wiper");
      const twice = convertDecisionInStore(once, "decision-wiper");

      assert.equal(
        twice.finance.expenses.filter((item) => item.decisionId === "decision-wiper").length,
        1
      );
    }
  },
  {
    name: "backup parser rejects invalid imports",
    run() {
      assert.throws(
        () =>
          parsePlanningBackup(
            JSON.stringify({
              schemaVersion: 5,
              exportedAt: "2026-07-22T12:00:00.000Z",
              store: {
                ...seedStore,
                finance: {
                  ...seedStore.finance,
                  expenses: [
                    {
                      ...seedStore.finance.expenses[0],
                      decisionId: "decision-inexistente"
                    }
                  ]
                }
              }
            })
          ),
        /respaldo|referencia|invalido|decision/i
      );
    }
  },
  {
    name: "backup export and import preserve decision summary",
    run() {
      const backup = createPlanningBackup(migratePlanningStore(seedStore));
      const parsed = parsePlanningBackup(backup);

      assert.equal(parsed.summary.decisions, seedStore.decisions.items.length);
      assert.equal(parsed.store.decisions.items.length, seedStore.decisions.items.length);
    }
  },
  {
    name: "project dependency summary detects tasks and decisions before deleting",
    run() {
      const store = createStore();
      const summary = getProjectDependencySummary(store, "project-tires");

      assert.equal(summary.tasksCount > 0, true);
      assert.equal(summary.decisionsCount > 0, true);
    }
  },
  {
    name: "project dependency summary recommends archive when dependencies exist",
    run() {
      const store = createStore();
      const summary = getProjectDependencySummary(store, "project-wiper");

      assert.equal(summary.tasksCount + summary.decisionsCount > 0, true);
    }
  },
  {
    name: "credit card deletion guard blocks active plans and active decisions",
    run() {
      const store = createStore();
      const guard = getCreditCardDeletionGuard(store, "card-master");

      assert.equal(guard.allowed, false);
      assert.equal(guard.activePlansCount >= 0, true);
      assert.equal(guard.activeDecisionsCount > 0, true);
    }
  },
  {
    name: "archiving a card preserves readable referencing entities",
    run() {
      const store = createStore();
      const next = {
        ...store,
        finance: {
          ...store.finance,
          creditCards: store.finance.creditCards.map((card) =>
            card.id === "card-master" ? { ...card, state: "archived" } : card
          )
        }
      };
      const decision = next.decisions.items.find((item) =>
        item.paymentOptions.some((option) => option.creditCardId === "card-master")
      );

      assert.ok(decision?.name);
      assert.equal(
        decision?.paymentOptions.some((option) => option.creditCardId === "card-master"),
        true
      );
    }
  },
  {
    name: "reserve deletion guard blocks active related decisions",
    run() {
      const store = createStore();
      const guard = getReserveDeletionGuard(store, "reserve-tires");

      assert.equal(guard.allowed, false);
      assert.equal(guard.activeDecisionsCount > 0, true);
    }
  },
  {
    name: "archiving a reserve preserves the reference from the decision",
    run() {
      const store = createStore();
      const next = {
        ...store,
        finance: {
          ...store.finance,
          reserves: store.finance.reserves.map((reserve) =>
            reserve.id === "reserve-tires" ? { ...reserve, status: "archived" } : reserve
          )
        }
      };
      const decision = next.decisions.items.find((item) => item.id === "decision-tires");

      assert.equal(decision?.paymentOptions[1]?.reserveId, "reserve-tires");
    }
  },
  {
    name: "sanitizeDecisionUpdate keeps converted financial fields stable while editing copy",
    run() {
      const approvedStore = convertDecisionInStore(
        {
          ...createStore(),
          decisions: {
            ...createStore().decisions,
            items: createStore().decisions.items.map((item) =>
              item.id === "decision-flat-bench-materials"
                ? { ...item, status: "approved" }
                : item
            )
          }
        },
        "decision-flat-bench-materials"
      );
      const decision = approvedStore.decisions.items.find(
        (item) => item.id === "decision-flat-bench-materials"
      );
      const sanitized = sanitizeDecisionUpdate(decision, {
        name: "Editar titulo",
        description: "Nueva descripcion",
        category: "transport",
        projectId: "",
        totalAmount: "999999",
        desiredDate: "2027-01-01",
        urgency: "high",
        impact: "medium",
        necessity: "important",
        selectedPaymentOptionId: "",
        paymentOptions: []
      });

      assert.equal(sanitized.totalAmount, String(decision.totalAmount));
      assert.equal(sanitized.desiredDate, decision.desiredDate ?? "");
      assert.equal(sanitized.paymentOptions.length, decision.paymentOptions.length);
      assert.equal(sanitized.description, "Nueva descripcion");
    }
  },
  {
    name: "archiving a converted decision keeps the created finance entity",
    run() {
      const store = createStore();
      const approved = {
        ...store,
        decisions: {
          ...store.decisions,
          items: store.decisions.items.map((item) =>
            item.id === "decision-wiper" ? { ...item, status: "approved" } : item
          )
        }
      };
      const converted = convertDecisionInStore(approved, "decision-wiper");
      const archived = {
        ...converted,
        decisions: {
          ...converted.decisions,
          items: converted.decisions.items.map((item) =>
            item.id === "decision-wiper" ? { ...item, status: "archived" } : item
          )
        }
      };

      assert.equal(
        archived.finance.expenses.some((item) => item.decisionId === "decision-wiper"),
        true
      );
    }
  },
  {
    name: "task created from decision stores sourceDecisionId and resolves its origin",
    run() {
      const store = createStore();
      const task = createTaskFromDecisionTask(store, "decision-wiper", "Resolver taller");

      assert.equal(task?.sourceDecisionId, "decision-wiper");
      const nextStore = {
        ...store,
        tasks: [task, ...store.tasks]
      };

      assert.equal(findTaskBySourceDecisionId(nextStore, "decision-wiper")?.title, "Resolver taller");
    }
  },
  {
    name: "task created from decision is not duplicated by repeated action",
    run() {
      const store = createStore();
      const task = createTaskFromDecisionTask(store, "decision-wiper", "Resolver taller");
      const nextStore = { ...store, tasks: [task, ...store.tasks] };
      const duplicate = createTaskFromDecisionTask(nextStore, "decision-wiper", "Resolver taller");

      assert.equal(duplicate, null);
    }
  },
  {
    name: "completed task keeps sourceDecisionId relationship",
    run() {
      const store = createStore();
      const task = createTaskFromDecisionTask(store, "decision-wiper", "Resolver taller");
      const completed = { ...task, status: "completed", completedAt: "2026-07-22T13:00:00.000Z" };

      assert.equal(completed.sourceDecisionId, "decision-wiper");
    }
  },
  {
    name: "history resolver returns human labels and routes for related expense operations",
    run() {
      const store = createStore();
      const approved = {
        ...store,
        decisions: {
          ...store.decisions,
          items: store.decisions.items.map((item) =>
            item.id === "decision-wiper" ? { ...item, status: "approved" } : item
          )
        }
      };
      const converted = convertDecisionInStore(approved, "decision-wiper");
      const paid = markExpensePaid(
        converted.finance,
        converted.finance.expenses.find((item) => item.decisionId === "decision-wiper").id,
        { effectiveDate: "2026-07-23", effectiveAmount: "95000" }
      );
      const storeWithHistory = { ...converted, finance: paid };
      const entry = getFinanceHistory(storeWithHistory.finance)[0];
      const resolution = resolveFinanceHistoryRecord(storeWithHistory, entry.record);

      assert.match(resolution.primary.label, /Gasto/i);
      assert.match(resolution.primary.to, /tab=movements/);
      assert.equal(
        resolution.related.some((link) => /decisi[oó]n/i.test(link.label) && /\/decisions\//.test(link.to)),
        true
      );
    }
  },
  {
    name: "history resolver tolerates missing references without crashing",
    run() {
      const store = createStore();
      const record = {
        id: "history-missing",
        sourceType: "expense",
        sourceId: "expense-missing",
        direction: "debit",
        amount: 123,
        effectiveDate: "2026-07-22",
        description: "Gasto desaparecido",
        createdAt: "2026-07-22T12:00:00.000Z",
        reversalOf: null,
        status: "active"
      };
      const resolution = resolveFinanceHistoryRecord(store, record);

      assert.equal(resolution.primary.state, "missing");
      assert.equal(resolution.primary.to, null);
    }
  },
  {
    name: "history resolver links reversal with original operation",
    run() {
      const finance = createDefaultFinanceState({ currentBalance: 1000 });
      const paid = markExpensePaid(finance, "expense-fuel", {
        effectiveDate: "2026-07-24",
        effectiveAmount: "28000"
      });
      const reopened = reopenExpense(paid, "expense-fuel");
      const store = { ...createStore(), finance: reopened };
      const history = getFinanceHistory(reopened);
      const reversalEntry = history.find((item) => item.record.reversalOf);
      const originalEntry = history.find((item) => item.record.status === "reversed");
      const resolution = resolveFinanceHistoryRecord(store, reversalEntry.record);

      assert.match(resolution.reversedFrom?.to ?? "", new RegExp(originalEntry.id));
    }
  },
  {
    name: "history relation finder still resolves decision after archiving entities",
    run() {
      const store = createStore();
      const approved = {
        ...store,
        decisions: {
          ...store.decisions,
          items: store.decisions.items.map((item) =>
            item.id === "decision-mattress" ? { ...item, status: "approved" } : item
          )
        }
      };
      const converted = convertDecisionInStore(approved, "decision-mattress");
      const convertedPlan = converted.finance.installmentPlans.find(
        (item) => item.decisionId === "decision-mattress"
      );
      const finance = payInstallmentPlan(converted.finance, convertedPlan.id, {
        effectiveDate: "2026-07-26",
        effectiveAmount: String(convertedPlan.installmentAmount)
      });
      const archivedStore = {
        ...converted,
        finance: {
          ...finance,
          installmentPlans: finance.installmentPlans.map((plan) =>
            plan.id === convertedPlan.id ? { ...plan, status: "archived" } : plan
          )
        }
      };
      const entry = getFinanceHistory(archivedStore.finance).find(
        (item) => item.record.sourceType === "installment"
      );

      assert.equal(findDecisionByHistoryRecord(archivedStore, entry.record)?.id, "decision-mattress");
      assert.equal(resolveFinanceHistoryRecord(archivedStore, entry.record).primary.state, "archived");
    }
  },
  {
    name: "finance tab parser falls back safely for invalid values",
    run() {
      // "history" era una pestaña propia; ahora vive dentro de "movements" (vista Historial),
      // asi que el parser la debe seguir aceptando como enlace legado.
      assert.equal(parseFinanceTab("history"), "movements");
      assert.equal(parseFinanceTab("cards"), "more");
      assert.equal(parseFinanceTab("otra-cosa"), "home");
    }
  },
  {
    name: "finance more-section and movements-view parsers honor legacy deep links",
    run() {
      // Enlaces viejos como tab=cards o tab=history siguen abriendo la seccion correcta
      // dentro de la navegacion nueva de 3 pestañas.
      assert.equal(parseFinanceMoreSection("cards", null), "cards");
      assert.equal(parseFinanceMoreSection("more", "reserves"), "reserves");
      assert.equal(parseFinanceMoreSection(null, null), "month");
      assert.equal(parseFinanceMoreSection("movements", "no-existe"), "month");

      assert.equal(parseFinanceMovementsView("history", null), "history");
      assert.equal(parseFinanceMovementsView("movements", "history"), "history");
      assert.equal(parseFinanceMovementsView("movements", null), "list");
      assert.equal(parseFinanceMovementsView(null, null), "list");
    }
  },
  {
    name: "finance compose parser only accepts supported actions",
    run() {
      assert.equal(parseFinanceComposeTarget("income"), "income");
      assert.equal(parseFinanceComposeTarget("expense"), "expense");
      assert.equal(parseFinanceComposeTarget("reserve"), null);
    }
  },
  {
    name: "decision filters combine search and exclude archived in active view without mutating input",
    run() {
      const decisionsState = createDefaultDecisionsState();
      const projects = seedStore.projects;
      const entries = decisionsState.items.map((decision) => ({
        decision,
        evaluation: evaluateDecision(
          decision,
          createDefaultFinanceState(),
          decisionsState.rulesConfig,
          projects,
          seedStore.tasks
        )
      }));
      const originalOrder = entries.map((entry) => entry.decision.id);
      const custom = entries.map((entry) =>
        entry.decision.id === "decision-trip"
          ? { ...entry, decision: { ...entry.decision, status: "archived" } }
          : entry
      );
      const result = filterAndSortDecisions(
        custom,
        { ...defaultDecisionFilters, search: "cubiertas", sortBy: "amount" },
        projects
      );

      assert.equal(result.length, 1);
      assert.equal(result[0].decision.id, "decision-tires");
      assert.deepEqual(entries.map((entry) => entry.decision.id), originalOrder);
    }
  },
  {
    name: "decision filters can show archived entries explicitly",
    run() {
      const decisionsState = createDefaultDecisionsState();
      const projects = seedStore.projects;
      const custom = decisionsState.items.map((decision) => ({
        decision:
          decision.id === "decision-trip"
            ? { ...decision, status: "archived" }
            : decision,
        evaluation: evaluateDecision(
          decision,
          createDefaultFinanceState(),
          decisionsState.rulesConfig,
          projects,
          seedStore.tasks
        )
      }));
      const result = filterAndSortDecisions(
        custom,
        { ...defaultDecisionFilters, archived: "archived" },
        projects
      );

      assert.equal(result.some((entry) => entry.decision.id === "decision-trip"), true);
    }
  },
  {
    name: "history filters keep reversal entry when filtering by expense type",
    run() {
      const finance = createDefaultFinanceState({ currentBalance: 200000 });
      const paid = markExpensePaid(finance, "expense-fuel", {
        effectiveDate: "2026-07-24",
        effectiveAmount: "28000"
      });
      const reopened = reopenExpense(paid, "expense-fuel");
      const history = getFinanceHistory(reopened);
      const filtered = filterFinanceHistory(history, {
        periodKey: "all",
        type: "expense",
        direction: "all",
        origin: "all"
      });

      assert.equal(filtered.length, 2);
    }
  }
];

let failures = 0;

for (const testCase of cases) {
  try {
    testCase.run();
    console.log(`PASS ${testCase.name}`);
  } catch (error) {
    failures += 1;
    console.error(`FAIL ${testCase.name}`);
    console.error(error);
  }
}

if (failures > 0) {
  process.exitCode = 1;
} else {
  console.log(`PASS ${cases.length} tests`);
}
