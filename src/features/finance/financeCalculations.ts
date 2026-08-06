import {
  CommitmentOccurrence,
  ConfirmedFinancialRecord,
  CreditCard,
  Expense,
  FinanceState,
  InstallmentPlan,
  MonthlyClosure,
  Reserve
} from "../../types/domain";
import {
  endOfMonth,
  formatDate,
  formatRelativeDeadline,
  getMonthKey,
  startOfMonth,
  startOfToday
} from "../../utils/dates";

export type FinancePeriodMode = "7d" | "14d" | "30d" | "month";
export type FinanceHistoryType =
  | "all"
  | "income"
  | "expense"
  | "installment"
  | "commitment"
  | "adjustment";
export type FinanceHistoryDirection = "all" | "credit" | "debit";
export type FinanceHistoryOrigin =
  | "all"
  | "Ingreso"
  | "Gasto"
  | "Cuota"
  | "Compromiso"
  | "Ajuste";

export interface FinancePeriod {
  label: string;
  start: Date;
  end: Date;
}

export interface DerivedInstallmentCharge {
  planId: string;
  description: string;
  amount: number;
  dueDate: string;
  creditCardId: string;
  installmentNumber: number;
}

export interface FinanceOverview {
  availableToday: number;
  upcomingPayments: number;
  availableAfterPayments: number;
  availableToDecide: number;
  monthEndProjection: number;
  futureInstallmentDebt: number;
  expectedIncomeInPeriod: number;
  activeReserveMoney: number;
  activeReserves: Reserve[];
  upcomingCardEvents: Array<{
    id: string;
    cardName: string;
    closeDate: string;
    dueDate: string;
    closeLabel: string;
    dueLabel: string;
  }>;
  pendingExpenses: Expense[];
  expectedIncomes: FinanceState["incomes"];
  dueCommitments: Array<CommitmentOccurrence & { commitmentName: string; dueLabel: string }>;
  currentInstallments: DerivedInstallmentCharge[];
}

export interface FinanceHistoryEntry {
  id: string;
  effectiveDate: string;
  concept: string;
  typeLabel: string;
  originLabel: FinanceHistoryOrigin;
  direction: "credit" | "debit";
  amount: number;
  signedAmount: number;
  statusLabel: string;
  isReversal: boolean;
  relatedTo: string | null;
  record: ConfirmedFinancialRecord;
}

export interface MonthlyBreakdownItem {
  id: string;
  label: string;
  date: string;
  amount: number;
  signedAmount: number;
  originLabel: string;
  statusLabel?: string;
}

export interface MonthlyFinanceView {
  periodKey: string;
  label: string;
  openingBalance: number;
  receivedIncome: number;
  paidExpenses: number;
  paidInstallments: number;
  paidCommitments: number;
  adjustments: number;
  currentBalance: number;
  expectedIncomeRemaining: number;
  pendingPaymentsRemaining: number;
  activeReserveMoney: number;
  monthEndProjection: number;
  availableToDecide: number;
  monthRecords: FinanceHistoryEntry[];
  breakdown: {
    income: MonthlyBreakdownItem[];
    expenses: MonthlyBreakdownItem[];
    installments: MonthlyBreakdownItem[];
    commitments: MonthlyBreakdownItem[];
    adjustments: MonthlyBreakdownItem[];
    expectedIncome: MonthlyBreakdownItem[];
    pendingExpenses: MonthlyBreakdownItem[];
    pendingCommitments: MonthlyBreakdownItem[];
    pendingInstallments: MonthlyBreakdownItem[];
    reserves: MonthlyBreakdownItem[];
  };
  closure: MonthlyClosure | null;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function toIsoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function signedAmount(direction: "credit" | "debit", amount: number) {
  return direction === "credit" ? amount : -amount;
}

function absNetByType(
  records: ConfirmedFinancialRecord[],
  sourceType: ConfirmedFinancialRecord["sourceType"]
) {
  return Math.abs(
    records
      .filter((record) => record.sourceType === sourceType)
      .reduce((total, record) => total + signedAmount(record.direction, record.amount), 0)
  );
}

function netByType(
  records: ConfirmedFinancialRecord[],
  sourceType: ConfirmedFinancialRecord["sourceType"]
) {
  return records
    .filter((record) => record.sourceType === sourceType)
    .reduce((total, record) => total + signedAmount(record.direction, record.amount), 0);
}

function isWithinRange(dateString: string, period: FinancePeriod) {
  const date = startOfToday(new Date(dateString));
  return date.getTime() >= period.start.getTime() && date.getTime() <= period.end.getTime();
}

function isAfterRange(dateString: string, period: FinancePeriod) {
  const date = startOfToday(new Date(dateString));
  return date.getTime() > period.end.getTime();
}

function isCardActive(card: CreditCard) {
  return card.state === "active";
}

function isReserveActive(reserve: Reserve) {
  return reserve.status === "active";
}

function getCreditCardEventDates(card: CreditCard, reference: Date) {
  const year = reference.getFullYear();
  const month = reference.getMonth();
  const closeDate = new Date(year, month, card.closeDay);
  const dueDate = new Date(year, month, card.dueDay);

  if (closeDate.getTime() < reference.getTime()) {
    closeDate.setMonth(closeDate.getMonth() + 1);
  }

  if (dueDate.getTime() < reference.getTime()) {
    dueDate.setMonth(dueDate.getMonth() + 1);
  }

  return {
    closeDate: toIsoDate(closeDate),
    dueDate: toIsoDate(dueDate)
  };
}

function getRemainingInstallmentCount(plan: InstallmentPlan) {
  return Math.max(plan.totalInstallments - plan.currentInstallment + 1, 0);
}

function isInstallmentExpenseRegistered(
  plan: InstallmentPlan,
  dueDate: string,
  expenses: Expense[]
) {
  return expenses.some(
    (expense) =>
      expense.installmentPlanId === plan.id &&
      expense.dueDate.slice(0, 7) === dueDate.slice(0, 7)
  );
}

function getRecordOriginLabel(
  sourceType: ConfirmedFinancialRecord["sourceType"]
): FinanceHistoryOrigin {
  switch (sourceType) {
    case "income":
      return "Ingreso";
    case "expense":
      return "Gasto";
    case "installment":
      return "Cuota";
    case "commitment-occurrence":
      return "Compromiso";
    default:
      return "Ajuste";
  }
}

function getRecordTypeLabel(sourceType: ConfirmedFinancialRecord["sourceType"]) {
  switch (sourceType) {
    case "income":
      return "Ingreso confirmado";
    case "expense":
      return "Gasto pagado";
    case "installment":
      return "Cuota pagada";
    case "commitment-occurrence":
      return "Compromiso pagado";
    default:
      return "Ajuste manual";
  }
}

function getRecordStatusLabel(record: ConfirmedFinancialRecord) {
  if (record.reversalOf) return "Reversion";
  return record.status === "reversed" ? "Revertido" : "Confirmado";
}

function getMonthStartKey(periodKey: string) {
  return `${periodKey}-01`;
}

function getBalanceBeforeDate(finance: FinanceState, date: string) {
  return (
    finance.settings.currentBalance -
    finance.confirmedRecords
      .filter((record) => record.effectiveDate >= date)
      .reduce((total, record) => total + signedAmount(record.direction, record.amount), 0)
  );
}

function getMonthDate(periodKey: string) {
  return new Date(`${periodKey}-01T12:00:00`);
}

function mapHistoryRecord(record: ConfirmedFinancialRecord): FinanceHistoryEntry {
  return {
    id: record.id,
    effectiveDate: record.effectiveDate,
    concept: record.description,
    typeLabel: getRecordTypeLabel(record.sourceType),
    originLabel: getRecordOriginLabel(record.sourceType),
    direction: record.direction,
    amount: record.amount,
    signedAmount: signedAmount(record.direction, record.amount),
    statusLabel: getRecordStatusLabel(record),
    isReversal: Boolean(record.reversalOf),
    relatedTo: record.reversalOf,
    record
  };
}

function createMonthItem(
  id: string,
  label: string,
  date: string,
  amount: number,
  signed: number,
  originLabel: string,
  statusLabel?: string
): MonthlyBreakdownItem {
  return { id, label, date, amount, signedAmount: signed, originLabel, statusLabel };
}

export function getFinancePeriod(mode: FinancePeriodMode, reference = new Date()): FinancePeriod {
  const start = startOfToday(reference);

  if (mode === "month") {
    return {
      label: "Hasta fin de mes",
      start,
      end: endOfMonth(reference)
    };
  }

  const days = mode === "7d" ? 7 : mode === "14d" ? 14 : 30;
  const end = new Date(start);
  end.setDate(end.getDate() + days);

  return {
    label: `Próximos ${days} días`,
    start,
    end
  };
}

export function getInstallmentDueDate(plan: InstallmentPlan, installmentNumber: number) {
  const firstDueDate = startOfToday(new Date(plan.firstDueDate));
  return toIsoDate(addMonths(firstDueDate, installmentNumber - 1));
}

export function getCurrentInstallmentCharges(
  finance: FinanceState,
  period: FinancePeriod
): DerivedInstallmentCharge[] {
  return finance.installmentPlans
    .filter((plan) => plan.status === "active")
    .flatMap((plan) => {
      const dueDate = getInstallmentDueDate(plan, plan.currentInstallment);
      const remainingCount = getRemainingInstallmentCount(plan);

      if (remainingCount === 0) return [];
      if (!isWithinRange(dueDate, period)) return [];
      if (isInstallmentExpenseRegistered(plan, dueDate, finance.expenses)) return [];

      return [
        {
          planId: plan.id,
          description: plan.description,
          amount: plan.installmentAmount,
          dueDate,
          creditCardId: plan.creditCardId,
          installmentNumber: plan.currentInstallment
        }
      ];
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function getFutureInstallmentDebt(finance: FinanceState, period: FinancePeriod) {
  return finance.installmentPlans
    .filter((plan) => plan.status === "active")
    .reduce((total, plan) => {
      let pending = 0;

      for (
        let installmentNumber = plan.currentInstallment;
        installmentNumber <= plan.totalInstallments;
        installmentNumber += 1
      ) {
        const dueDate = getInstallmentDueDate(plan, installmentNumber);
        if (!isAfterRange(dueDate, period)) continue;
        pending += plan.installmentAmount;
      }

      return total + pending;
    }, 0);
}

export function getCommitmentsDueInPeriod(finance: FinanceState, period: FinancePeriod) {
  return finance.commitmentOccurrences
    .filter((occurrence) => occurrence.status === "pending")
    .filter((occurrence) => occurrence.dueDate && isWithinRange(occurrence.dueDate, period))
    .map((occurrence) => {
      const commitment = finance.commitments.find((item) => item.id === occurrence.commitmentId);
      return {
        ...occurrence,
        commitmentName: commitment?.name ?? "Compromiso",
        dueLabel: formatRelativeDeadline(occurrence.dueDate)
      };
    })
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function getExpectedIncomesInPeriod(finance: FinanceState, period: FinancePeriod) {
  return finance.incomes
    .filter((income) => income.status === "expected")
    .filter((income) => isWithinRange(income.expectedDate, period))
    .sort((a, b) => a.expectedDate.localeCompare(b.expectedDate));
}

export function getPendingExpensesInPeriod(finance: FinanceState, period: FinancePeriod) {
  return finance.expenses
    .filter((expense) => expense.status === "pending")
    .filter((expense) => isWithinRange(expense.dueDate, period))
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export function getActiveReserveMoney(finance: FinanceState) {
  return finance.reserves
    .filter(isReserveActive)
    .reduce((total, reserve) => total + reserve.savedAmount, 0);
}

export function getUpcomingCardEvents(finance: FinanceState, reference = new Date()) {
  return finance.creditCards
    .filter(isCardActive)
    .map((card) => {
      const { closeDate, dueDate } = getCreditCardEventDates(card, reference);

      return {
        id: card.id,
        cardName: card.name,
        closeDate,
        dueDate,
        closeLabel: `${formatDate(closeDate)} · ${formatRelativeDeadline(closeDate)}`,
        dueLabel: `${formatDate(dueDate)} · ${formatRelativeDeadline(dueDate)}`
      };
    })
    .sort((a, b) => a.closeDate.localeCompare(b.closeDate));
}

export function getFinanceOverview(
  finance: FinanceState,
  period: FinancePeriod,
  reference = new Date()
): FinanceOverview {
  const pendingExpenses = getPendingExpensesInPeriod(finance, period);
  const expectedIncomes = getExpectedIncomesInPeriod(finance, period);
  const dueCommitments = getCommitmentsDueInPeriod(finance, period);
  const currentInstallments = getCurrentInstallmentCharges(finance, period);
  const activeReserveMoney = getActiveReserveMoney(finance);

  const expenseTotal = pendingExpenses.reduce((total, expense) => total + expense.amount, 0);
  const commitmentTotal = dueCommitments.reduce((total, commitment) => total + commitment.amount, 0);
  const installmentTotal = currentInstallments.reduce(
    (total, installment) => total + installment.amount,
    0
  );
  const expectedIncomeTotal = expectedIncomes.reduce((total, income) => total + income.amount, 0);
  const upcomingPayments = expenseTotal + commitmentTotal + installmentTotal;
  const availableToday = finance.settings.currentBalance;
  const availableAfterPayments = availableToday - upcomingPayments;
  const availableToDecide =
    availableToday - upcomingPayments - activeReserveMoney - finance.settings.minimumReserve;

  const monthPeriod = getFinancePeriod("month", reference);
  const monthExpectedIncomes = getExpectedIncomesInPeriod(finance, monthPeriod).reduce(
    (total, income) => total + income.amount,
    0
  );
  const monthExpenses = getPendingExpensesInPeriod(finance, monthPeriod).reduce(
    (total, expense) => total + expense.amount,
    0
  );
  const monthCommitments = getCommitmentsDueInPeriod(finance, monthPeriod).reduce(
    (total, commitment) => total + commitment.amount,
    0
  );
  const monthInstallments = getCurrentInstallmentCharges(finance, monthPeriod).reduce(
    (total, installment) => total + installment.amount,
    0
  );

  return {
    availableToday,
    upcomingPayments,
    availableAfterPayments,
    availableToDecide,
    monthEndProjection:
      availableToday + monthExpectedIncomes - monthExpenses - monthCommitments - monthInstallments,
    futureInstallmentDebt: getFutureInstallmentDebt(finance, period),
    expectedIncomeInPeriod: expectedIncomeTotal,
    activeReserveMoney,
    activeReserves: finance.reserves.filter(isReserveActive),
    upcomingCardEvents: getUpcomingCardEvents(finance, reference),
    pendingExpenses,
    expectedIncomes,
    dueCommitments,
    currentInstallments
  };
}

export function getFinanceHistory(finance: FinanceState) {
  return finance.confirmedRecords
    .slice()
    .sort((a, b) => {
      const dateDiff = b.effectiveDate.localeCompare(a.effectiveDate);
      if (dateDiff !== 0) return dateDiff;
      return b.createdAt.localeCompare(a.createdAt);
    })
    .map(mapHistoryRecord);
}

export function filterFinanceHistory(
  history: FinanceHistoryEntry[],
  filters: {
    periodKey: string;
    type: FinanceHistoryType;
    direction: FinanceHistoryDirection;
    origin: FinanceHistoryOrigin;
  }
) {
  return history.filter((entry) => {
    if (filters.periodKey !== "all" && getMonthKey(entry.effectiveDate) !== filters.periodKey) {
      return false;
    }

    if (filters.direction !== "all" && entry.direction !== filters.direction) {
      return false;
    }

    if (filters.origin !== "all" && entry.originLabel !== filters.origin) {
      return false;
    }

    if (filters.type === "all") return true;
    if (filters.type === "commitment") return entry.record.sourceType === "commitment-occurrence";
    return entry.record.sourceType === filters.type;
  });
}

export function getAvailableHistoryMonths(finance: FinanceState) {
  return Array.from(new Set(finance.confirmedRecords.map((record) => getMonthKey(record.effectiveDate))))
    .sort((a, b) => b.localeCompare(a));
}

export function getMonthlyFinanceView(finance: FinanceState, periodKey: string): MonthlyFinanceView {
  const periodDate = getMonthDate(periodKey);
  const period = getFinancePeriod("month", periodDate);
  const monthStart = startOfMonth(getMonthStartKey(periodKey)).toISOString().slice(0, 10);
  const monthRecords = getFinanceHistory(finance).filter(
    (entry) => getMonthKey(entry.effectiveDate) === periodKey
  );
  const expectedIncomes = getExpectedIncomesInPeriod(finance, period);
  const pendingExpenses = getPendingExpensesInPeriod(finance, period);
  const pendingCommitments = getCommitmentsDueInPeriod(finance, period);
  const pendingInstallments = getCurrentInstallmentCharges(finance, period).filter(
    (installment) => getMonthKey(installment.dueDate) === periodKey
  );
  const reserves = finance.reserves.filter(isReserveActive);

  const openingBalance = getBalanceBeforeDate(finance, monthStart);
  const receivedIncome = Math.max(netByType(monthRecords.map((entry) => entry.record), "income"), 0);
  const paidExpenses = absNetByType(monthRecords.map((entry) => entry.record), "expense");
  const paidInstallments = absNetByType(monthRecords.map((entry) => entry.record), "installment");
  const paidCommitments = absNetByType(
    monthRecords.map((entry) => entry.record),
    "commitment-occurrence"
  );
  const adjustments = netByType(monthRecords.map((entry) => entry.record), "manual-adjustment");

  const expectedIncomeRemaining = expectedIncomes.reduce((total, item) => total + item.amount, 0);
  const pendingPaymentsRemaining =
    pendingExpenses.reduce((total, item) => total + item.amount, 0) +
    pendingCommitments.reduce((total, item) => total + item.amount, 0) +
    pendingInstallments.reduce((total, item) => total + item.amount, 0);
  const activeReserveMoney = getActiveReserveMoney(finance);
  const monthEndProjection =
    finance.settings.currentBalance + expectedIncomeRemaining - pendingPaymentsRemaining;
  const availableToDecide =
    finance.settings.currentBalance -
    pendingPaymentsRemaining -
    activeReserveMoney -
    finance.settings.minimumReserve;

  return {
    periodKey,
    label: periodDate.toLocaleDateString("es-AR", {
      month: "long",
      year: "numeric"
    }),
    openingBalance,
    receivedIncome,
    paidExpenses,
    paidInstallments,
    paidCommitments,
    adjustments,
    currentBalance: finance.settings.currentBalance,
    expectedIncomeRemaining,
    pendingPaymentsRemaining,
    activeReserveMoney,
    monthEndProjection,
    availableToDecide,
    monthRecords,
    breakdown: {
      income: monthRecords
        .filter((entry) => entry.record.sourceType === "income")
        .map((entry) =>
          createMonthItem(
            entry.id,
            entry.concept,
            entry.effectiveDate,
            entry.amount,
            entry.signedAmount,
            entry.originLabel,
            entry.statusLabel
          )
        ),
      expenses: monthRecords
        .filter((entry) => entry.record.sourceType === "expense")
        .map((entry) =>
          createMonthItem(
            entry.id,
            entry.concept,
            entry.effectiveDate,
            entry.amount,
            entry.signedAmount,
            entry.originLabel,
            entry.statusLabel
          )
        ),
      installments: monthRecords
        .filter((entry) => entry.record.sourceType === "installment")
        .map((entry) =>
          createMonthItem(
            entry.id,
            entry.concept,
            entry.effectiveDate,
            entry.amount,
            entry.signedAmount,
            entry.originLabel,
            entry.statusLabel
          )
        ),
      commitments: monthRecords
        .filter((entry) => entry.record.sourceType === "commitment-occurrence")
        .map((entry) =>
          createMonthItem(
            entry.id,
            entry.concept,
            entry.effectiveDate,
            entry.amount,
            entry.signedAmount,
            entry.originLabel,
            entry.statusLabel
          )
        ),
      adjustments: monthRecords
        .filter((entry) => entry.record.sourceType === "manual-adjustment")
        .map((entry) =>
          createMonthItem(
            entry.id,
            entry.concept,
            entry.effectiveDate,
            entry.amount,
            entry.signedAmount,
            entry.originLabel,
            entry.statusLabel
          )
        ),
      expectedIncome: expectedIncomes.map((income) =>
        createMonthItem(
          income.id,
          income.name,
          income.expectedDate,
          income.amount,
          income.amount,
          "Ingreso esperado"
        )
      ),
      pendingExpenses: pendingExpenses.map((expense) =>
        createMonthItem(
          expense.id,
          expense.name,
          expense.dueDate,
          expense.amount,
          -expense.amount,
          "Pago pendiente"
        )
      ),
      pendingCommitments: pendingCommitments.map((occurrence) =>
        createMonthItem(
          occurrence.id,
          occurrence.commitmentName,
          occurrence.dueDate,
          occurrence.amount,
          -occurrence.amount,
          "Compromiso pendiente"
        )
      ),
      pendingInstallments: pendingInstallments.map((installment) =>
        createMonthItem(
          `${installment.planId}-${installment.installmentNumber}`,
          `${installment.description} · cuota ${installment.installmentNumber}`,
          installment.dueDate,
          installment.amount,
          -installment.amount,
          "Cuota pendiente"
        )
      ),
      reserves: reserves.map((reserve) =>
        createMonthItem(
          reserve.id,
          reserve.name,
          reserve.targetDate ?? monthStart,
          reserve.savedAmount,
          -reserve.savedAmount,
          "Reserva activa"
        )
      )
    },
    closure: finance.monthlyClosures.find((item) => item.periodKey === periodKey) ?? null
  };
}

export function getAvailableMonthlyPeriods(finance: FinanceState, reference = new Date()) {
  const months = new Set<string>([getMonthKey(reference.toISOString().slice(0, 10))]);

  finance.confirmedRecords.forEach((record) => months.add(getMonthKey(record.effectiveDate)));
  finance.incomes.forEach((income) => months.add(getMonthKey(income.expectedDate)));
  finance.expenses.forEach((expense) => months.add(getMonthKey(expense.dueDate)));
  finance.commitmentOccurrences.forEach((occurrence) => months.add(occurrence.periodKey));
  finance.installmentPlans.forEach((plan) =>
    months.add(getMonthKey(getInstallmentDueDate(plan, plan.currentInstallment)))
  );
  finance.monthlyClosures.forEach((closure) => months.add(closure.periodKey));

  return Array.from(months).sort((a, b) => b.localeCompare(a));
}

export function getMonthlyPendingWarnings(finance: FinanceState, periodKey: string) {
  const monthView = getMonthlyFinanceView(finance, periodKey);
  const warnings: string[] = [];

  if (monthView.breakdown.expectedIncome.length > 0) {
    warnings.push("Hay ingresos esperados todavia sin cobrar.");
  }
  if (monthView.breakdown.pendingExpenses.length > 0) {
    warnings.push("Hay gastos pendientes dentro del periodo.");
  }
  if (monthView.breakdown.pendingCommitments.length > 0) {
    warnings.push("Hay compromisos pendientes dentro del periodo.");
  }
  if (monthView.breakdown.pendingInstallments.length > 0) {
    warnings.push("Hay cuotas pendientes dentro del periodo.");
  }

  return warnings;
}
