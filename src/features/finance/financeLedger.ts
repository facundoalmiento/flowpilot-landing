import {
  Commitment,
  CommitmentOccurrence,
  ConfirmedFinancialRecord,
  ConfirmedRecordDirection,
  FinanceState,
  ManualAdjustmentFormValues,
  ManualBalanceAdjustment,
  MonthlyClosure,
  SettlementFormValues
} from "../../types/domain";
import { addMonths, getMonthKey, startOfMonth, startOfToday } from "../../utils/dates";
import {
  getActiveReserveMoney,
  getCurrentInstallmentCharges,
  getFinanceOverview,
  getFinancePeriod
} from "./financeCalculations";

function nowIso() {
  return new Date().toISOString();
}

function toIsoDate(value: string) {
  return startOfToday(new Date(value)).toISOString().slice(0, 10);
}

function parseAmount(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? amount : 0;
}

function signedAmount(direction: ConfirmedRecordDirection, amount: number) {
  return direction === "credit" ? amount : -amount;
}

function createConfirmedRecord(params: {
  sourceType: ConfirmedFinancialRecord["sourceType"];
  sourceId: string;
  direction: ConfirmedRecordDirection;
  amount: number;
  effectiveDate: string;
  description: string;
  reversalOf?: string | null;
  status?: ConfirmedFinancialRecord["status"];
}) {
  return {
    id: crypto.randomUUID(),
    sourceType: params.sourceType,
    sourceId: params.sourceId,
    direction: params.direction,
    amount: params.amount,
    effectiveDate: toIsoDate(params.effectiveDate),
    description: params.description,
    createdAt: nowIso(),
    reversalOf: params.reversalOf ?? null,
    status: params.status ?? "active"
  } satisfies ConfirmedFinancialRecord;
}

function findActiveSourceRecord(
  finance: FinanceState,
  sourceType: ConfirmedFinancialRecord["sourceType"],
  sourceId: string
) {
  return (
    finance.confirmedRecords.find(
      (record) =>
        record.sourceType === sourceType &&
        record.sourceId === sourceId &&
        record.reversalOf === null
    ) ?? null
  );
}

function hasReversal(finance: FinanceState, recordId: string) {
  return finance.confirmedRecords.some((record) => record.reversalOf === recordId);
}

function applyBalanceImpact(finance: FinanceState, direction: ConfirmedRecordDirection, amount: number) {
  return {
    ...finance,
    settings: {
      ...finance.settings,
      currentBalance: finance.settings.currentBalance + signedAmount(direction, amount)
    }
  };
}

function appendRecord(finance: FinanceState, record: ConfirmedFinancialRecord) {
  return {
    ...finance,
    confirmedRecords: [record, ...finance.confirmedRecords]
  };
}

function reverseRecord(
  finance: FinanceState,
  record: ConfirmedFinancialRecord,
  description: string
) {
  if (hasReversal(finance, record.id)) return finance;

  const reversalDirection: ConfirmedRecordDirection =
    record.direction === "credit" ? "debit" : "credit";
  const reversal = createConfirmedRecord({
    sourceType: record.sourceType,
    sourceId: record.sourceId,
    direction: reversalDirection,
    amount: record.amount,
    effectiveDate: nowIso(),
    description,
    reversalOf: record.id
  });

  const financeWithMarkedOriginal = {
    ...finance,
    confirmedRecords: finance.confirmedRecords.map((current) =>
      current.id === record.id ? { ...current, status: "reversed" as const } : current
    )
  };

  return appendRecord(
    applyBalanceImpact(financeWithMarkedOriginal, reversal.direction, reversal.amount),
    reversal
  );
}

function updateCommitmentProgress(commitment: Commitment) {
  const nextDueDate = addMonths(commitment.nextDueDate, 1);
  const hasInstallments =
    typeof commitment.totalInstallments === "number" &&
    typeof commitment.currentInstallment === "number";
  const nextInstallment = hasInstallments ? commitment.currentInstallment! + 1 : null;
  const completed =
    hasInstallments && nextInstallment !== null && nextInstallment > commitment.totalInstallments!;

  return {
    ...commitment,
    nextDueDate,
    currentInstallment:
      hasInstallments && !completed ? nextInstallment : commitment.currentInstallment,
    state:
      completed && commitment.state === "active" ? ("archived" as const) : commitment.state,
    updatedAt: nowIso()
  };
}

export function ensureCommitmentOccurrenceForMonth(finance: FinanceState, periodKey: string) {
  const newOccurrences: CommitmentOccurrence[] = [];

  for (const commitment of finance.commitments) {
    if (commitment.state !== "active") continue;
    const dueMonth = getMonthKey(commitment.nextDueDate);
    if (dueMonth !== periodKey) continue;
    if (commitment.endDate && commitment.endDate < `${periodKey}-01`) continue;

    const exists = finance.commitmentOccurrences.some(
      (occurrence) => occurrence.commitmentId === commitment.id && occurrence.periodKey === periodKey
    );

    if (exists) continue;

    const occurrence: CommitmentOccurrence = {
      id: crypto.randomUUID(),
      commitmentId: commitment.id,
      periodKey,
      dueDate: commitment.nextDueDate,
      amount: commitment.amount,
      status: "pending",
      createdAt: nowIso(),
      updatedAt: nowIso(),
      paidDate: null,
      settledRecordId: null
    };
    newOccurrences.push(occurrence);
  }

  if (newOccurrences.length === 0) return finance;
  return {
    ...finance,
    commitmentOccurrences: [...newOccurrences, ...finance.commitmentOccurrences]
  };
}

export function markIncomeReceived(
  finance: FinanceState,
  incomeId: string,
  settlement: SettlementFormValues
) {
  const income = finance.incomes.find((item) => item.id === incomeId);
  if (!income || income.status === "received") return finance;
  if (findActiveSourceRecord(finance, "income", income.id)) return finance;

  const amount = parseAmount(settlement.effectiveAmount || String(income.amount));
  const record = createConfirmedRecord({
    sourceType: "income",
    sourceId: income.id,
    direction: "credit",
    amount,
    effectiveDate: settlement.effectiveDate || income.expectedDate,
    description: income.name
  });

  const nextFinance = appendRecord(applyBalanceImpact(finance, "credit", amount), record);

  return {
    ...nextFinance,
    incomes: nextFinance.incomes.map((current) =>
      current.id === income.id
        ? {
            ...current,
            amount,
            status: "received" as const,
            receivedDate: toIsoDate(settlement.effectiveDate || income.expectedDate),
            updatedAt: nowIso()
          }
        : current
    )
  };
}

export function reopenIncome(finance: FinanceState, incomeId: string) {
  const income = finance.incomes.find((item) => item.id === incomeId);
  const record = findActiveSourceRecord(finance, "income", incomeId);
  if (!income || income.status !== "received" || !record) return finance;

  const reversed = reverseRecord(finance, record, `Reversion de ${income.name}`);

  return {
    ...reversed,
    incomes: reversed.incomes.map((current) =>
      current.id === incomeId
        ? { ...current, status: "expected" as const, receivedDate: null, updatedAt: nowIso() }
        : current
    )
  };
}

function advanceInstallmentPlan(finance: FinanceState, planId: string) {
  return {
    ...finance,
    installmentPlans: finance.installmentPlans.map((plan) => {
      if (plan.id !== planId) return plan;
      const nextInstallment = plan.currentInstallment + 1;
      return {
        ...plan,
        currentInstallment: nextInstallment,
        status:
          nextInstallment > plan.totalInstallments ? ("completed" as const) : plan.status,
        updatedAt: nowIso()
      };
    })
  };
}

export function markExpensePaid(
  finance: FinanceState,
  expenseId: string,
  settlement: SettlementFormValues
) {
  const expense = finance.expenses.find((item) => item.id === expenseId);
  if (!expense || expense.status === "paid") return finance;
  if (findActiveSourceRecord(finance, "expense", expense.id)) return finance;

  const amount = parseAmount(settlement.effectiveAmount || String(expense.amount));
  const record = createConfirmedRecord({
    sourceType: "expense",
    sourceId: expense.id,
    direction: "debit",
    amount,
    effectiveDate: settlement.effectiveDate || expense.dueDate,
    description: expense.name
  });

  let nextFinance = appendRecord(applyBalanceImpact(finance, "debit", amount), record);
  nextFinance = {
    ...nextFinance,
    expenses: nextFinance.expenses.map((current) =>
      current.id === expense.id
        ? {
            ...current,
            amount,
            status: "paid" as const,
            paidDate: toIsoDate(settlement.effectiveDate || expense.dueDate),
            updatedAt: nowIso()
          }
        : current
    )
  };

  if (expense.installmentPlanId) {
    const plan = nextFinance.installmentPlans.find((item) => item.id === expense.installmentPlanId);
    if (plan) {
      const currentDueDate = getCurrentInstallmentCharges(nextFinance, getFinancePeriod("month")).find(
        (charge) => charge.planId === plan.id
      )?.dueDate;
      const sameMonth =
        getMonthKey(expense.dueDate) === getMonthKey(currentDueDate ?? expense.dueDate);

      if (sameMonth) {
        nextFinance = advanceInstallmentPlan(nextFinance, plan.id);
      }
    }
  }

  return nextFinance;
}

export function reopenExpense(finance: FinanceState, expenseId: string) {
  const expense = finance.expenses.find((item) => item.id === expenseId);
  const record = findActiveSourceRecord(finance, "expense", expenseId);
  if (!expense || expense.status !== "paid" || !record) return finance;

  let reversed = reverseRecord(finance, record, `Reversion de ${expense.name}`);
  reversed = {
    ...reversed,
    expenses: reversed.expenses.map((current) =>
      current.id === expenseId
        ? { ...current, status: "pending" as const, paidDate: null, updatedAt: nowIso() }
        : current
    )
  };

  if (expense.installmentPlanId) {
    reversed = {
      ...reversed,
      installmentPlans: reversed.installmentPlans.map((plan) =>
        plan.id === expense.installmentPlanId
          ? {
              ...plan,
              currentInstallment: Math.max(plan.currentInstallment - 1, 1),
              status: "active" as const,
              updatedAt: nowIso()
            }
          : plan
      )
    };
  }

  return reversed;
}

export function payInstallmentPlan(
  finance: FinanceState,
  planId: string,
  settlement: SettlementFormValues
) {
  const plan = finance.installmentPlans.find((item) => item.id === planId);
  if (!plan || plan.status !== "active") return finance;

  const installmentSourceId = `${plan.id}:${plan.currentInstallment}`;
  if (findActiveSourceRecord(finance, "installment", installmentSourceId)) return finance;

  const dueDate = addMonths(plan.firstDueDate, plan.currentInstallment - 1);
  const matchingExpense = finance.expenses.find(
    (expense) =>
      expense.installmentPlanId === plan.id &&
      expense.status === "pending" &&
      getMonthKey(expense.dueDate) === getMonthKey(dueDate)
  );

  if (matchingExpense) {
    return markExpensePaid(finance, matchingExpense.id, settlement);
  }

  const amount = parseAmount(settlement.effectiveAmount || String(plan.installmentAmount));
  const record = createConfirmedRecord({
    sourceType: "installment",
    sourceId: installmentSourceId,
    direction: "debit",
    amount,
    effectiveDate: settlement.effectiveDate || dueDate,
    description: `${plan.description} · cuota ${plan.currentInstallment}`
  });

  const nextFinance = advanceInstallmentPlan(
    appendRecord(applyBalanceImpact(finance, "debit", amount), record),
    plan.id
  );

  return nextFinance;
}

export function revertInstallmentPlan(finance: FinanceState, planId: string) {
  const plan = finance.installmentPlans.find((item) => item.id === planId);
  if (!plan) return finance;

  const lastPaidInstallment = Math.max(plan.currentInstallment - 1, 1);
  const sourceId = `${plan.id}:${lastPaidInstallment}`;
  const record = findActiveSourceRecord(finance, "installment", sourceId);
  if (!record) return finance;

  const reversed = reverseRecord(
    finance,
    record,
    `Reversion de ${plan.description} · cuota ${lastPaidInstallment}`
  );

  return {
    ...reversed,
    installmentPlans: reversed.installmentPlans.map((current) =>
      current.id === planId
        ? {
            ...current,
            currentInstallment: Math.max(current.currentInstallment - 1, 1),
            status: "active" as const,
            updatedAt: nowIso()
          }
        : current
    )
  };
}

export function payCommitmentOccurrence(
  finance: FinanceState,
  occurrenceId: string,
  settlement: SettlementFormValues
) {
  const occurrence = finance.commitmentOccurrences.find((item) => item.id === occurrenceId);
  const commitment = occurrence
    ? finance.commitments.find((item) => item.id === occurrence.commitmentId)
    : null;
  if (!occurrence || !commitment || occurrence.status !== "pending") return finance;
  if (findActiveSourceRecord(finance, "commitment-occurrence", occurrence.id)) return finance;

  const amount = parseAmount(settlement.effectiveAmount || String(occurrence.amount));
  const record = createConfirmedRecord({
    sourceType: "commitment-occurrence",
    sourceId: occurrence.id,
    direction: "debit",
    amount,
    effectiveDate: settlement.effectiveDate || occurrence.dueDate,
    description: commitment.name
  });

  const nextFinance = appendRecord(applyBalanceImpact(finance, "debit", amount), record);

  return {
    ...nextFinance,
    commitmentOccurrences: nextFinance.commitmentOccurrences.map((current) =>
      current.id === occurrence.id
        ? {
            ...current,
            amount,
            status: "paid" as const,
            paidDate: toIsoDate(settlement.effectiveDate || occurrence.dueDate),
            settledRecordId: record.id,
            updatedAt: nowIso()
          }
        : current
    ),
    commitments: nextFinance.commitments.map((current) =>
      current.id === commitment.id ? updateCommitmentProgress(current) : current
    )
  };
}

export function reopenCommitmentOccurrence(finance: FinanceState, occurrenceId: string) {
  const occurrence = finance.commitmentOccurrences.find((item) => item.id === occurrenceId);
  const commitment = occurrence
    ? finance.commitments.find((item) => item.id === occurrence.commitmentId)
    : null;
  const record = occurrence?.settledRecordId
    ? finance.confirmedRecords.find((item) => item.id === occurrence.settledRecordId) ?? null
    : null;

  if (!occurrence || !commitment || occurrence.status !== "paid" || !record) return finance;

  const reversed = reverseRecord(finance, record, `Reversion de ${commitment.name}`);

  return {
    ...reversed,
    commitmentOccurrences: reversed.commitmentOccurrences.map((current) =>
      current.id === occurrence.id
        ? {
            ...current,
            status: "pending" as const,
            paidDate: null,
            settledRecordId: null,
            updatedAt: nowIso()
          }
        : current
    ),
    commitments: reversed.commitments.map((current) =>
      current.id === commitment.id
        ? {
            ...current,
            nextDueDate: occurrence.dueDate,
            currentInstallment:
              typeof current.currentInstallment === "number"
                ? Math.max(current.currentInstallment - 1, 1)
                : current.currentInstallment,
            state: "active" as const,
            updatedAt: nowIso()
          }
        : current
    )
  };
}

export function createManualAdjustment(finance: FinanceState, values: ManualAdjustmentFormValues) {
  const amount = parseAmount(values.amount);
  const record = createConfirmedRecord({
    sourceType: "manual-adjustment",
    sourceId: crypto.randomUUID(),
    direction: values.direction,
    amount,
    effectiveDate: values.effectiveDate,
    description: values.note.trim() || values.reason
  });

  const adjustment: ManualBalanceAdjustment = {
    id: record.sourceId,
    direction: values.direction,
    amount,
    effectiveDate: toIsoDate(values.effectiveDate),
    reason: values.reason,
    note: values.note.trim(),
    createdAt: nowIso(),
    reversedAt: null,
    recordId: record.id
  };

  const nextFinance = appendRecord(applyBalanceImpact(finance, values.direction, amount), record);
  return {
    ...nextFinance,
    manualAdjustments: [adjustment, ...nextFinance.manualAdjustments]
  };
}

export function reverseManualAdjustment(finance: FinanceState, adjustmentId: string) {
  const adjustment = finance.manualAdjustments.find((item) => item.id === adjustmentId);
  const record = adjustment?.recordId
    ? finance.confirmedRecords.find((item) => item.id === adjustment.recordId) ?? null
    : null;
  if (!adjustment || adjustment.reversedAt || !record) return finance;

  const reversed = reverseRecord(finance, record, `Reversion de ajuste`);
  return {
    ...reversed,
    manualAdjustments: reversed.manualAdjustments.map((current) =>
      current.id === adjustmentId ? { ...current, reversedAt: nowIso() } : current
    )
  };
}

function getRecordNet(record: ConfirmedFinancialRecord) {
  return signedAmount(record.direction, record.amount);
}

export function getBalanceAtDate(finance: FinanceState, date: string) {
  const target = toIsoDate(date);
  const recordsAfter = finance.confirmedRecords.filter(
    (record) => record.effectiveDate > target
  );
  const deltaAfter = recordsAfter.reduce((total, record) => total + getRecordNet(record), 0);
  return finance.settings.currentBalance - deltaAfter;
}

export function getMonthRecords(finance: FinanceState, periodKey: string) {
  return finance.confirmedRecords
    .filter((record) => getMonthKey(record.effectiveDate) === periodKey)
    .sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));
}

export function buildMonthlyWarnings(finance: FinanceState, periodKey: string) {
  const expectedIncomeRemaining = finance.incomes.filter(
    (income) => income.status === "expected" && getMonthKey(income.expectedDate) === periodKey
  );
  const pendingExpenses = finance.expenses.filter(
    (expense) => expense.status === "pending" && getMonthKey(expense.dueDate) === periodKey
  );
  const pendingCommitments = finance.commitmentOccurrences.filter(
    (occurrence) => occurrence.status === "pending" && occurrence.periodKey === periodKey
  );
  const pendingInstallments = getCurrentInstallmentCharges(
    finance,
    getFinancePeriod("month", new Date(`${periodKey}-01T12:00:00`))
  ).filter((charge) => getMonthKey(charge.dueDate) === periodKey);

  const warnings: string[] = [];
  if (expectedIncomeRemaining.length > 0) warnings.push("Hay ingresos esperados sin cobrar.");
  if (pendingExpenses.length > 0) warnings.push("Hay gastos pendientes en el periodo.");
  if (pendingCommitments.length > 0) warnings.push("Hay compromisos pendientes en el periodo.");
  if (pendingInstallments.length > 0) warnings.push("Hay cuotas pendientes en el periodo.");

  return warnings;
}

export function closeMonthlyPeriod(finance: FinanceState, periodKey: string) {
  if (finance.monthlyClosures.some((closure) => closure.periodKey === periodKey)) return finance;

  const monthDate = `${periodKey}-01`;
  const monthStart = startOfMonth(monthDate).toISOString().slice(0, 10);
  const openingBalance = getBalanceAtDate(finance, monthStart);
  const monthOverview = getFinanceOverview(
    finance,
    getFinancePeriod("month", new Date(`${periodKey}-01T12:00:00`))
  );
  const monthRecords = getMonthRecords(finance, periodKey);
  const closingBalance = openingBalance + monthRecords.reduce((total, record) => total + getRecordNet(record), 0);
  const pendingPaymentsRemaining =
    monthOverview.pendingExpenses.reduce((total, item) => total + item.amount, 0) +
    monthOverview.dueCommitments.reduce((total, item) => total + item.amount, 0) +
    monthOverview.currentInstallments.reduce((total, item) => total + item.amount, 0);

  const closure: MonthlyClosure = {
    id: crypto.randomUUID(),
    periodKey,
    openingBalance,
    closingBalance,
    expectedIncomeRemaining: monthOverview.expectedIncomes.reduce((total, item) => total + item.amount, 0),
    pendingPaymentsRemaining,
    reserveMoney: getActiveReserveMoney(finance),
    minimumReserve: finance.settings.minimumReserve,
    availableToDecide: monthOverview.availableToDecide,
    warnings: buildMonthlyWarnings(finance, periodKey),
    createdAt: nowIso()
  };

  return {
    ...finance,
    monthlyClosures: [closure, ...finance.monthlyClosures]
  };
}

export function reopenMonthlyPeriod(finance: FinanceState, periodKey: string) {
  return {
    ...finance,
    monthlyClosures: finance.monthlyClosures.filter((closure) => closure.periodKey !== periodKey)
  };
}
