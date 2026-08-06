import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Check,
  ChevronDown,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
  Wallet
} from "lucide-react";
import { Badge } from "../components/ui/Badge";
import { EmptyState } from "../components/ui/EmptyState";
import { Modal } from "../components/ui/Modal";
import { SectionCard } from "../components/ui/SectionCard";
import {
  CommitmentFormModal,
  CreditCardFormModal,
  ExpenseFormModal,
  FinanceSettingsForm,
  IncomeFormModal,
  InstallmentPlanFormModal,
  ReserveFormModal
} from "../components/finance/FinanceModals";
import { QuickAddExpense, QuickAddIncome } from "../components/finance/QuickAdd";
import {
  filterFinanceHistory,
  FinanceHistoryDirection,
  FinanceHistoryOrigin,
  FinanceHistoryType,
  getAvailableHistoryMonths,
  getAvailableMonthlyPeriods,
  getFinanceHistory,
  getFinanceOverview,
  getFinancePeriod,
  getInstallmentDueDate,
  getMonthlyFinanceView,
  getMonthlyPendingWarnings,
  FinancePeriodMode
} from "../features/finance/financeCalculations";
import {
  FinanceMoreSection,
  financeTabs,
  FinanceMovementsView,
  FinanceTab,
  parseFinanceComposeTarget,
  parseFinanceMoreSection,
  parseFinanceMovementsView,
  parseFinanceTab
} from "../features/finance/financeNavigation";
import { resolveFinanceHistoryRecord } from "../features/finance/financeHistoryRelations";
import { usePlanning } from "../features/planning/usePlanning";
import {
  getCreditCardDeletionGuard,
  getReserveDeletionGuard
} from "../features/relations/entityIntegrity";
import {
  findDecisionByExpenseId,
  findDecisionByInstallmentPlanId,
  findDecisionByReserveId
} from "../features/relations/entityReferences";
import {
  Commitment,
  CreditCard,
  Expense,
  Income,
  InstallmentPlan,
  ManualAdjustmentFormValues,
  Reserve,
  SettlementFormValues
} from "../types/domain";
import { formatDate, formatRelativeDeadline } from "../utils/dates";
import {
  formatExpenseCategory,
  formatIncomeStatus,
  formatIncomeType,
  formatMoney,
  formatPaymentMethod,
  formatReservePriority,
  formatReserveStatus
} from "../utils/format";

type SettlementTarget =
  | {
      kind: "income";
      id: string;
      title: string;
      amount: number;
      date: string;
    }
  | {
      kind: "expense";
      id: string;
      title: string;
      amount: number;
      date: string;
    }
  | {
      kind: "commitment";
      id: string;
      title: string;
      amount: number;
      date: string;
    }
  | {
      kind: "installment";
      id: string;
      title: string;
      amount: number;
      date: string;
    };

const periods: Array<{ value: FinancePeriodMode; label: string }> = [
  { value: "7d", label: "7 días" },
  { value: "14d", label: "14 días" },
  { value: "30d", label: "30 días" },
  { value: "month", label: "Fin de mes" }
];

const historyTypeOptions: Array<{ value: FinanceHistoryType; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "income", label: "Ingresos" },
  { value: "expense", label: "Gastos" },
  { value: "installment", label: "Cuotas" },
  { value: "commitment", label: "Compromisos" },
  { value: "adjustment", label: "Ajustes" }
];

const historyDirectionOptions: Array<{ value: FinanceHistoryDirection; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "credit", label: "Entradas" },
  { value: "debit", label: "Salidas" }
];

const historyOriginOptions: Array<{ value: FinanceHistoryOrigin; label: string }> = [
  { value: "all", label: "Todos" },
  { value: "Ingreso", label: "Ingresos" },
  { value: "Gasto", label: "Gastos" },
  { value: "Cuota", label: "Cuotas" },
  { value: "Compromiso", label: "Compromisos" },
  { value: "Ajuste", label: "Ajustes" }
];

function ActionButton({
  children,
  onClick,
  tone = "default"
}: {
  children: React.ReactNode;
  onClick: () => void;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex min-h-[44px] items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent ${
        tone === "danger"
          ? "border border-red-200 text-red-700 hover:bg-red-50"
          : "border border-morga-line text-morga-text hover:bg-morga-surfaceAlt"
      }`}
    >
      {children}
    </button>
  );
}

function MetricCard({
  label,
  value,
  tone = "default"
}: {
  label: string;
  value: string;
  tone?: "default" | "warm";
}) {
  return (
    <article className="rounded-[22px] border border-morga-line bg-morga-surface p-4 shadow-soft">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
        {label}
      </p>
      <p
        className={`mt-3 text-3xl font-semibold tracking-[-0.04em] ${
          tone === "warm" ? "text-[#9f5f49]" : "text-morga-text"
        }`}
      >
        {value}
      </p>
    </article>
  );
}

function BreakdownList({
  title,
  items,
  emptyTitle,
  emptyDescription
}: {
  title: string;
  items: Array<{
    id: string;
    label: string;
    date: string;
    amount: number;
    signedAmount: number;
    originLabel: string;
    statusLabel?: string;
  }>;
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <SectionCard title={title}>
      {items.length === 0 ? (
        <EmptyState title={emptyTitle} description={emptyDescription} />
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-[18px] border border-morga-line bg-morga-surface p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-morga-text">{item.label}</p>
                    <Badge tone="muted">{item.originLabel}</Badge>
                    {item.statusLabel ? <Badge tone="info">{item.statusLabel}</Badge> : null}
                  </div>
                  <p className="mt-1 text-sm text-morga-muted">{formatDate(item.date)}</p>
                </div>
                <p
                  className={`text-sm font-semibold ${
                    item.signedAmount < 0 ? "text-[#9f5f49]" : "text-morga-text"
                  }`}
                >
                  {formatMoney(item.signedAmount)}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function SettlementModal({
  open,
  target,
  onClose,
  onConfirm
}: {
  open: boolean;
  target: SettlementTarget | null;
  onClose: () => void;
  onConfirm: (values: SettlementFormValues) => void;
}) {
  const [values, setValues] = useState<SettlementFormValues>({
    effectiveDate: "",
    effectiveAmount: ""
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open || !target) return;
    setValues({
      effectiveDate: target.date,
      effectiveAmount: String(target.amount)
    });
    setSubmitted(false);
  }, [open, target]);

  const hasDate = values.effectiveDate.trim().length > 0;
  const amount = Number(values.effectiveAmount);
  const hasAmount = Number.isFinite(amount) && amount > 0;

  return (
    <Modal
      open={open}
      title={
        target?.kind === "income"
          ? "Confirmar cobro"
          : target?.kind === "expense"
            ? "Confirmar pago"
            : target?.kind === "commitment"
              ? "Confirmar compromiso"
              : "Confirmar cuota"
      }
      description={target ? `Se va a registrar el impacto real de ${target.title}.` : ""}
      onClose={onClose}
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
          if (!hasDate || !hasAmount) return;
          onConfirm(values);
          onClose();
        }}
      >
        <label className="grid gap-2">
          <span className="text-sm font-semibold text-morga-text">Fecha efectiva</span>
          <input
            type="date"
            value={values.effectiveDate}
            onChange={(event) =>
              setValues((current) => ({ ...current, effectiveDate: event.target.value }))
            }
            className="h-11 rounded-2xl border border-morga-line bg-morga-surface px-4 text-sm text-morga-text outline-none transition focus:border-morga-accent"
          />
          {submitted && !hasDate ? (
            <span className="text-sm text-red-700">Definí una fecha válida.</span>
          ) : null}
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-morga-text">Importe efectivo</span>
          <input
            inputMode="numeric"
            value={values.effectiveAmount}
            onChange={(event) =>
              setValues((current) => ({ ...current, effectiveAmount: event.target.value }))
            }
            className="h-11 rounded-2xl border border-morga-line bg-morga-surface px-4 text-sm text-morga-text outline-none transition focus:border-morga-accent"
          />
          {submitted && !hasAmount ? (
            <span className="text-sm text-red-700">Ingresá un importe mayor a cero.</span>
          ) : null}
        </label>

        <div className="flex flex-col gap-3 border-t border-morga-line pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-morga-line px-5 py-3 text-sm font-semibold text-morga-muted"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-full bg-morga-dark px-5 py-3 text-sm font-semibold text-white"
          >
            Confirmar
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ManualAdjustmentModal({
  open,
  currentBalance,
  onClose,
  onConfirm
}: {
  open: boolean;
  currentBalance: number;
  onClose: () => void;
  onConfirm: (values: ManualAdjustmentFormValues) => void;
}) {
  const [mode, setMode] = useState<"replace" | "delta">("replace");
  const [targetBalance, setTargetBalance] = useState("");
  const [values, setValues] = useState<ManualAdjustmentFormValues>({
    amount: "",
    direction: "credit",
    effectiveDate: new Date().toISOString().slice(0, 10),
    reason: "correction",
    note: ""
  });
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setMode("replace");
    setTargetBalance("");
    setValues({
      amount: "",
      direction: "credit",
      effectiveDate: new Date().toISOString().slice(0, 10),
      reason: "bank-difference",
      note: ""
    });
    setSubmitted(false);
  }, [open]);

  const parsedTarget = Number(targetBalance);
  const hasTarget = targetBalance.trim().length > 0 && Number.isFinite(parsedTarget);
  const delta = hasTarget ? parsedTarget - currentBalance : 0;
  const replaceIsNoOp = hasTarget && delta === 0;

  const amount = Number(values.amount);
  const hasAmount = Number.isFinite(amount) && amount > 0;
  const hasDate = values.effectiveDate.trim().length > 0;

  const canSubmit = mode === "replace" ? hasTarget && !replaceIsNoOp && hasDate : hasAmount && hasDate;

  return (
    <Modal
      open={open}
      title="Ajustar saldo"
      description="Registra una correccion manual sin borrar el historial anterior."
      onClose={onClose}
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
          if (!canSubmit) return;

          if (mode === "replace") {
            onConfirm({
              ...values,
              amount: String(Math.abs(delta)),
              direction: delta > 0 ? "credit" : "debit"
            });
          } else {
            onConfirm(values);
          }
          onClose();
        }}
      >
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("replace")}
            className={`rounded-2xl border px-3 py-2.5 text-sm font-semibold transition ${
              mode === "replace"
                ? "border-morga-accent bg-morga-accentSoft text-morga-text"
                : "border-morga-line bg-morga-surface text-morga-muted hover:bg-morga-surfaceAlt"
            }`}
          >
            Poner el saldo real
          </button>
          <button
            type="button"
            onClick={() => setMode("delta")}
            className={`rounded-2xl border px-3 py-2.5 text-sm font-semibold transition ${
              mode === "delta"
                ? "border-morga-accent bg-morga-accentSoft text-morga-text"
                : "border-morga-line bg-morga-surface text-morga-muted hover:bg-morga-surfaceAlt"
            }`}
          >
            Sumar o restar un monto
          </button>
        </div>

        {mode === "replace" ? (
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-morga-text">Saldo real (según tu banco)</span>
            <input
              inputMode="numeric"
              placeholder={`Actual en Morga: ${formatMoney(currentBalance)}`}
              value={targetBalance}
              onChange={(event) => setTargetBalance(event.target.value)}
              className="h-11 rounded-2xl border border-morga-line bg-morga-surface px-4 text-sm text-morga-text outline-none transition focus:border-morga-accent"
            />
            {hasTarget && !replaceIsNoOp ? (
              <span className="text-sm text-morga-muted">
                Se va a {delta > 0 ? "sumar" : "restar"} {formatMoney(Math.abs(delta))} para que coincida.
              </span>
            ) : null}
            {submitted && !hasTarget ? (
              <span className="text-sm text-red-700">Ingresá el saldo que muestra tu banco.</span>
            ) : null}
            {submitted && replaceIsNoOp ? (
              <span className="text-sm text-red-700">Ese ya es el saldo actual, no hace falta ajustar.</span>
            ) : null}
          </label>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2">
              <span className="text-sm font-semibold text-morga-text">Importe</span>
              <input
                inputMode="numeric"
                value={values.amount}
                onChange={(event) =>
                  setValues((current) => ({ ...current, amount: event.target.value }))
                }
                className="h-11 rounded-2xl border border-morga-line bg-morga-surface px-4 text-sm text-morga-text outline-none transition focus:border-morga-accent"
              />
              {submitted && !hasAmount ? (
                <span className="text-sm text-red-700">Ingresá un importe mayor a cero.</span>
              ) : null}
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-semibold text-morga-text">Direccion</span>
              <select
                value={values.direction}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    direction: event.target.value as typeof current.direction
                  }))
                }
                className="h-11 rounded-2xl border border-morga-line bg-morga-surface px-4 text-sm text-morga-text outline-none transition focus:border-morga-accent"
              >
                <option value="credit">Suma saldo</option>
                <option value="debit">Resta saldo</option>
              </select>
            </label>
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-morga-text">Fecha</span>
            <input
              type="date"
              value={values.effectiveDate}
              onChange={(event) =>
                setValues((current) => ({ ...current, effectiveDate: event.target.value }))
              }
              className="h-11 rounded-2xl border border-morga-line bg-morga-surface px-4 text-sm text-morga-text outline-none transition focus:border-morga-accent"
            />
            {submitted && !hasDate ? (
              <span className="text-sm text-red-700">Definí una fecha válida.</span>
            ) : null}
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-morga-text">Motivo</span>
            <select
              value={values.reason}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  reason: event.target.value as typeof current.reason
                }))
              }
              className="h-11 rounded-2xl border border-morga-line bg-morga-surface px-4 text-sm text-morga-text outline-none transition focus:border-morga-accent"
            >
              <option value="correction">Correccion</option>
              <option value="cash-found">Efectivo encontrado</option>
              <option value="bank-difference">Diferencia bancaria</option>
              <option value="missing-expense">Gasto no registrado</option>
              <option value="missing-income">Ingreso no registrado</option>
              <option value="opening-balance">Saldo inicial</option>
              <option value="other">Otro</option>
            </select>
          </label>
        </div>

        <label className="grid gap-2">
          <span className="text-sm font-semibold text-morga-text">Nota opcional</span>
          <textarea
            value={values.note}
            onChange={(event) =>
              setValues((current) => ({ ...current, note: event.target.value }))
            }
            className="min-h-[104px] rounded-2xl border border-morga-line bg-morga-surface px-4 py-3 text-sm text-morga-text outline-none transition focus:border-morga-accent"
          />
        </label>

        <div className="flex flex-col gap-3 border-t border-morga-line pt-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-morga-line px-5 py-3 text-sm font-semibold text-morga-muted"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="rounded-full bg-morga-dark px-5 py-3 text-sm font-semibold text-white"
          >
            Registrar ajuste
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function FinancesPage() {
  const {
    store,
    finance,
    updateFinanceSettings,
    createCreditCard,
    updateCreditCard,
    deleteCreditCard,
    createIncome,
    updateIncome,
    markIncomeReceived,
    reopenIncome,
    deleteIncome,
    createExpense,
    updateExpense,
    markExpensePaid,
    reopenExpense,
    deleteExpense,
    createCommitment,
    updateCommitment,
    archiveCommitment,
    restoreCommitment,
    deleteCommitment,
    ensureCommitmentOccurrencesForMonth,
    payCommitmentOccurrence,
    reopenCommitmentOccurrence,
    createInstallmentPlan,
    updateInstallmentPlan,
    archiveInstallmentPlan,
    restoreInstallmentPlan,
    deleteInstallmentPlan,
    payInstallmentPlan,
    revertInstallmentPlan,
    createReserve,
    updateReserve,
    completeReserve,
    archiveReserve,
    restoreReserve,
    deleteReserve,
    createManualAdjustment,
    reverseManualAdjustment,
    closeMonthlyPeriod,
    reopenMonthlyPeriod
  } = usePlanning();
  const [searchParams, setSearchParams] = useSearchParams();
  const highlightRefs = useRef<Record<string, HTMLElement | null>>({});

  const [activeTab, setActiveTab] = useState<FinanceTab>(() => parseFinanceTab(searchParams.get("tab")));
  const [periodMode, setPeriodMode] = useState<FinancePeriodMode>("30d");
  const [editingIncome, setEditingIncome] = useState<Income | null>(null);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [editingCommitment, setEditingCommitment] = useState<Commitment | null>(null);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [editingPlan, setEditingPlan] = useState<InstallmentPlan | null>(null);
  const [editingReserve, setEditingReserve] = useState<Reserve | null>(null);
  const [incomeModalOpen, setIncomeModalOpen] = useState(false);
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [commitmentModalOpen, setCommitmentModalOpen] = useState(false);
  const [cardModalOpen, setCardModalOpen] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [reserveModalOpen, setReserveModalOpen] = useState(false);
  const [settlementTarget, setSettlementTarget] = useState<SettlementTarget | null>(null);
  const [adjustmentModalOpen, setAdjustmentModalOpen] = useState(false);
  const [quickExpenseOpen, setQuickExpenseOpen] = useState(false);
  const [quickIncomeOpen, setQuickIncomeOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [historyFilters, setHistoryFilters] = useState<{
    periodKey: string;
    type: FinanceHistoryType;
    direction: FinanceHistoryDirection;
    origin: FinanceHistoryOrigin;
  }>({
    periodKey: "all",
    type: "all",
    direction: "all",
    origin: "all"
  });
  const highlightId = searchParams.get("highlight") ?? "";
  const composeTarget = parseFinanceComposeTarget(searchParams.get("compose"));
  const moreSection = useMemo(
    () => parseFinanceMoreSection(searchParams.get("tab"), searchParams.get("section")),
    [searchParams]
  );
  const movementsView = useMemo(
    () => parseFinanceMovementsView(searchParams.get("tab"), searchParams.get("view")),
    [searchParams]
  );
  const [openMoreSections, setOpenMoreSections] = useState<Set<FinanceMoreSection>>(
    () => new Set([moreSection])
  );

  useEffect(() => {
    setOpenMoreSections((current) => {
      if (current.has(moreSection)) return current;
      const next = new Set(current);
      next.add(moreSection);
      return next;
    });
  }, [moreSection]);

  const toggleMoreSection = (sectionId: FinanceMoreSection, isOpen: boolean) => {
    setOpenMoreSections((current) => {
      const next = new Set(current);
      if (isOpen) {
        next.add(sectionId);
      } else {
        next.delete(sectionId);
      }
      return next;
    });
  };

  const period = useMemo(() => getFinancePeriod(periodMode), [periodMode]);
  const overview = useMemo(() => getFinanceOverview(finance, period), [finance, period]);
  const upcomingPreview = useMemo(() => {
    const items = [
      ...overview.pendingExpenses.map((expense) => ({
        id: expense.id,
        label: expense.name,
        date: expense.dueDate,
        amount: expense.amount,
        tone: "expense" as const
      })),
      ...overview.dueCommitments.map((commitment) => ({
        id: commitment.id,
        label: commitment.commitmentName,
        date: commitment.dueDate,
        amount: commitment.amount,
        tone: "commitment" as const
      })),
      ...overview.currentInstallments.map((installment) => ({
        id: `${installment.planId}-${installment.installmentNumber}`,
        label: installment.description,
        date: installment.dueDate,
        amount: installment.amount,
        tone: "installment" as const
      }))
    ];
    return items.sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
  }, [overview]);
  const activeCards = finance.creditCards.filter((card) => card.state === "active");
  const activePlans = finance.installmentPlans.filter((plan) => plan.status !== "archived");
  const monthOptions = useMemo(() => getAvailableMonthlyPeriods(finance), [finance]);
  const historyMonths = useMemo(() => getAvailableHistoryMonths(finance), [finance]);
  const [selectedMonth, setSelectedMonth] = useState(monthOptions[0] ?? new Date().toISOString().slice(0, 7));
  const monthView = useMemo(
    () => getMonthlyFinanceView(finance, selectedMonth),
    [finance, selectedMonth]
  );
  const monthWarnings = useMemo(
    () => getMonthlyPendingWarnings(finance, selectedMonth),
    [finance, selectedMonth]
  );
  const history = useMemo(() => getFinanceHistory(finance), [finance]);
  const filteredHistory = useMemo(
    () => filterFinanceHistory(history, historyFilters),
    [history, historyFilters]
  );
  const monthOccurrences = useMemo(
    () =>
      finance.commitmentOccurrences
        .filter((occurrence) => occurrence.periodKey === selectedMonth)
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
        .map((occurrence) => ({
          ...occurrence,
          commitmentName:
            finance.commitments.find((item) => item.id === occurrence.commitmentId)?.name ??
            "Compromiso"
        })),
    [finance.commitmentOccurrences, finance.commitments, selectedMonth]
  );

  useEffect(() => {
    if (monthOptions.length === 0) return;
    if (!monthOptions.includes(selectedMonth)) {
      setSelectedMonth(monthOptions[0]);
    }
  }, [monthOptions, selectedMonth]);

  useEffect(() => {
    if (selectedMonth) {
      ensureCommitmentOccurrencesForMonth(selectedMonth);
    }
    // ensureCommitmentOccurrencesForMonth is a new dispatch wrapper on every store
    // update, so including it here re-fires this effect on every render and loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth]);

  useEffect(() => {
    const requestedTab = parseFinanceTab(searchParams.get("tab"));
    if (requestedTab !== activeTab) {
      setActiveTab(requestedTab);
    }
  }, [activeTab, searchParams]);

  useEffect(() => {
    if (!composeTarget) return;

    if (composeTarget === "income") {
      setEditingIncome(null);
      setIncomeModalOpen(true);
      setActiveTab("movements");
      return;
    }

    if (composeTarget === "expense") {
      setEditingExpense(null);
      setExpenseModalOpen(true);
      setActiveTab("movements");
      return;
    }
  }, [composeTarget]);

  const updateFinanceSearchParams = (updates: Record<string, string | null>) => {
    const nextParams = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (!value) {
        nextParams.delete(key);
      } else {
        nextParams.set(key, value);
      }
    }
    setSearchParams(nextParams, { replace: true });
  };

  const setTab = (tab: FinanceTab) => {
    setActiveTab(tab);
    updateFinanceSearchParams({ tab, highlight: null });
  };

  const setMovementsView = (view: FinanceMovementsView) => {
    updateFinanceSearchParams({ tab: "movements", view: view === "list" ? null : view, highlight: null });
  };

  const clearCompose = () => {
    if (!composeTarget) return;
    updateFinanceSearchParams({ compose: null });
  };

  const setHighlightRef = (id: string) => (node: HTMLElement | null) => {
    highlightRefs.current[id] = node;
  };

  const setCardState = (card: CreditCard, state: CreditCard["state"]) => {
    updateCreditCard(card.id, {
      name: card.name,
      limit: card.limit === null ? "" : String(card.limit),
      closeDay: String(card.closeDay),
      dueDay: String(card.dueDay),
      state
    });
  };

  const openIncomeCreate = () => {
    setEditingIncome(null);
    setIncomeModalOpen(true);
  };

  const openExpenseCreate = () => {
    setEditingExpense(null);
    setExpenseModalOpen(true);
  };

  const openCommitmentCreate = () => {
    setEditingCommitment(null);
    setCommitmentModalOpen(true);
  };

  const openCardCreate = () => {
    setEditingCard(null);
    setCardModalOpen(true);
  };

  const openPlanCreate = () => {
    setEditingPlan(null);
    setPlanModalOpen(true);
  };

  const openReserveCreate = () => {
    setEditingReserve(null);
    setReserveModalOpen(true);
  };

  const handleSettlementConfirm = (values: SettlementFormValues) => {
    if (!settlementTarget) return;

    switch (settlementTarget.kind) {
      case "income":
        markIncomeReceived(settlementTarget.id, values);
        break;
      case "expense":
        markExpensePaid(settlementTarget.id, values);
        break;
      case "commitment":
        payCommitmentOccurrence(settlementTarget.id, values);
        break;
      case "installment":
        payInstallmentPlan(settlementTarget.id, values);
        break;
    }
  };

  const renderDecisionOrigin = (decisionId: string | null) => {
    if (!decisionId) return null;

    const decision = store.decisions.items.find((item) => item.id === decisionId) ?? null;
    if (!decision) {
      return <p className="mt-2 text-sm text-morga-muted">Referencia no disponible.</p>;
    }

    return (
      <p className="mt-2 text-sm text-morga-muted">
        Creado desde la decisión:{" "}
        <Link
          to={`/decisions/${decision.id}`}
          className="font-semibold text-morga-text underline-offset-4 hover:underline"
        >
          {decision.name}
        </Link>
      </p>
    );
  };

  useEffect(() => {
    if (!highlightId) return;

    const targetNode = highlightRefs.current[highlightId];
    if (!targetNode) return;

    targetNode.scrollIntoView({ behavior: "smooth", block: "center" });
    targetNode.focus();
  }, [
    activeTab,
    filteredHistory.length,
    finance.commitmentOccurrences.length,
    finance.expenses.length,
    finance.installmentPlans.length,
    finance.manualAdjustments.length,
    finance.reserves.length,
    highlightId
  ]);

  return (
    <div className="space-y-5">
      <section className="flex flex-col gap-4 rounded-panel border border-morga-line bg-morga-surface px-5 py-5 shadow-soft md:px-6 md:py-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-morga-muted">
            Finanzas
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-[-0.02em] text-morga-text md:text-[2rem]">
            Dinero disponible con contexto real
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {financeTabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setTab(tab.id)}
              className={`min-h-[44px] rounded-full px-4 py-2 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent ${
                activeTab === tab.id
                  ? "bg-morga-dark text-white"
                  : "border border-morga-line text-morga-text hover:bg-morga-surfaceAlt"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === "home" ? (
        <>
          <section className="rounded-panel border border-morga-line bg-morga-surface px-6 py-8 text-center shadow-soft md:py-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-morga-muted">
              Disponible para decidir
            </p>
            <p
              className={`mt-3 text-5xl font-semibold tracking-[-0.03em] md:text-6xl ${
                overview.availableToDecide < 0 ? "text-[#9f5f49]" : "text-morga-text"
              }`}
            >
              {formatMoney(overview.availableToDecide)}
            </p>
            <p className="mt-3 text-sm text-morga-muted">
              Saldo actual {formatMoney(overview.availableToday)} · Reservado{" "}
              {formatMoney(finance.settings.minimumReserve)}
            </p>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={() => setQuickExpenseOpen(true)}
                className="inline-flex h-14 min-w-[200px] items-center justify-center gap-2 rounded-full bg-morga-dark px-8 text-sm font-semibold text-white transition hover:translate-y-[-1px]"
              >
                <Plus className="h-4 w-4" />
                Agregar gasto
              </button>
              <button
                type="button"
                onClick={() => setQuickIncomeOpen(true)}
                className="inline-flex h-14 min-w-[200px] items-center justify-center gap-2 rounded-full border border-morga-line bg-morga-surface px-8 text-sm font-semibold text-morga-text transition hover:bg-morga-surfaceAlt"
              >
                <Plus className="h-4 w-4" />
                Agregar ingreso
              </button>
            </div>
          </section>

          <SectionCard title="Lo que se viene" description="Los próximos pagos y cobros del periodo, en orden.">
            {upcomingPreview.length === 0 ? (
              <EmptyState
                title="Sin movimientos cercanos"
                description="Cuando cargues gastos, compromisos o cuotas con vencimiento próximo, aparecen acá."
              />
            ) : (
              <div className="space-y-3">
                {upcomingPreview.map((item) => (
                  <article
                    key={`${item.tone}-${item.id}`}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-morga-line bg-morga-surface p-4"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-morga-text">{item.label}</p>
                        {item.tone === "commitment" ? <Badge tone="warning">Compromiso</Badge> : null}
                        {item.tone === "installment" ? <Badge tone="info">Cuota</Badge> : null}
                      </div>
                      <p className="mt-1 text-sm text-morga-muted">
                        {formatDate(item.date)} · {formatRelativeDeadline(item.date)}
                      </p>
                    </div>
                    <span className="font-semibold text-morga-text">{formatMoney(item.amount)}</span>
                  </article>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => setTab("movements")}
              className="mt-4 text-sm font-semibold text-morga-text underline-offset-4 hover:underline"
            >
              Ver todo en Movimientos →
            </button>
          </SectionCard>

          <details
            className="group rounded-panel border border-morga-line bg-morga-surface px-5 py-4 shadow-soft md:px-6"
            open={detailOpen}
            onToggle={(event) => setDetailOpen(event.currentTarget.open)}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-morga-text">
              Ver detalle completo del periodo
              <ChevronDown className="h-4 w-4 shrink-0 text-morga-muted transition group-open:rotate-180" />
            </summary>

            <div className="mt-5 space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
                <label className="grid gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
                    Periodo
                  </span>
                  <select
                    value={periodMode}
                    onChange={(event) => setPeriodMode(event.target.value as FinancePeriodMode)}
                    className="h-11 rounded-2xl border border-morga-line bg-morga-surface px-4 text-sm text-morga-text"
                  >
                    {periods.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <button
                  type="button"
                  onClick={() => setAdjustmentModalOpen(true)}
                  className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-full border border-morga-line px-5 py-3 text-sm font-semibold text-morga-text hover:bg-morga-surfaceAlt"
                >
                  <Plus className="h-4 w-4" />
                  Ajustar saldo
                </button>
              </div>

              <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                <MetricCard label="Saldo actual" value={formatMoney(overview.availableToday)} />
                <MetricCard
                  label="Proyeccion fin de mes"
                  value={formatMoney(overview.monthEndProjection)}
                  tone={overview.monthEndProjection < 0 ? "warm" : "default"}
                />
                <MetricCard label="Pagos próximos" value={formatMoney(overview.upcomingPayments)} />
                <MetricCard
                  label="Ingresos esperados"
                  value={formatMoney(overview.expectedIncomeInPeriod)}
                />
                <MetricCard
                  label="Deuda futura en cuotas"
                  value={formatMoney(overview.futureInstallmentDebt)}
                />
              </section>

              <section className="grid gap-5 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
            <SectionCard title="Pagos del periodo" description={`Periodo actual: ${period.label}.`}>
              <div className="space-y-4">
                {overview.pendingExpenses.length === 0 &&
                overview.dueCommitments.length === 0 &&
                overview.currentInstallments.length === 0 ? (
                  <EmptyState
                    title="Sin pagos cercanos"
                    description="Cuando cargues gastos, compromisos o cuotas dentro del periodo, aparecen acá."
                  />
                ) : (
                  <>
                    {overview.pendingExpenses.map((expense) => (
                      <article
                        key={expense.id}
                        className="flex flex-col gap-3 rounded-[20px] border border-morga-line bg-morga-surface p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-morga-text">{expense.name}</p>
                          <Badge tone="muted">{formatExpenseCategory(expense.category)}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-morga-muted">
                          <span>
                            {formatDate(expense.dueDate)} · {formatRelativeDeadline(expense.dueDate)}
                          </span>
                          <span className="font-semibold text-morga-text">
                            {formatMoney(expense.amount)}
                          </span>
                        </div>
                      </article>
                    ))}

                    {overview.dueCommitments.map((commitment) => (
                      <article
                        key={commitment.id}
                        className="flex flex-col gap-3 rounded-[20px] border border-morga-line bg-morga-surfaceAlt p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-morga-text">
                            {commitment.commitmentName}
                          </p>
                          <Badge tone="warning">Compromiso</Badge>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-morga-muted">
                          <span>
                            {formatDate(commitment.dueDate)} · {commitment.dueLabel}
                          </span>
                          <span className="font-semibold text-morga-text">
                            {formatMoney(commitment.amount)}
                          </span>
                        </div>
                      </article>
                    ))}

                    {overview.currentInstallments.map((installment) => (
                      <article
                        key={`${installment.planId}-${installment.installmentNumber}`}
                        className="flex flex-col gap-3 rounded-[20px] border border-morga-line bg-morga-surface p-4"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-semibold text-morga-text">
                            {installment.description}
                          </p>
                          <Badge tone="info">Cuota {installment.installmentNumber}</Badge>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-morga-muted">
                          <span>
                            {formatDate(installment.dueDate)} ·{" "}
                            {formatRelativeDeadline(installment.dueDate)}
                          </span>
                          <span className="font-semibold text-morga-text">
                            {formatMoney(installment.amount)}
                          </span>
                        </div>
                      </article>
                    ))}
                  </>
                )}
              </div>
            </SectionCard>

            <div className="space-y-5">
              <SectionCard title="Reservas activas">
                {overview.activeReserves.length === 0 ? (
                  <EmptyState
                    title="Sin reservas activas"
                    description="Carga una reserva para separar dinero importante del disponible."
                  />
                ) : (
                  <div className="space-y-3">
                    {overview.activeReserves.map((reserve) => (
                      <article
                        key={reserve.id}
                        className="rounded-[20px] border border-morga-line bg-morga-surface p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-morga-text">{reserve.name}</p>
                            <p className="mt-1 text-sm text-morga-muted">
                              {formatMoney(reserve.savedAmount)} de{" "}
                              {formatMoney(reserve.targetAmount)}
                            </p>
                          </div>
                          <Badge tone="muted">{formatReservePriority(reserve.priority)}</Badge>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Tarjetas">
                {overview.upcomingCardEvents.length === 0 ? (
                  <EmptyState
                    title="Sin tarjetas activas"
                    description="Agrega tarjetas para seguir cierres y vencimientos."
                  />
                ) : (
                  <div className="space-y-3">
                    {overview.upcomingCardEvents.map((event) => (
                      <article
                        key={event.id}
                        className="rounded-[20px] border border-morga-line bg-morga-surface p-4"
                      >
                        <p className="text-sm font-semibold text-morga-text">{event.cardName}</p>
                        <p className="mt-2 text-sm text-morga-muted">Cierre: {event.closeLabel}</p>
                        <p className="mt-1 text-sm text-morga-muted">
                          Vencimiento: {event.dueLabel}
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </SectionCard>
                </div>
              </section>
            </div>
          </details>
        </>
      ) : null}

      {activeTab === "movements" ? (
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMovementsView("list")}
              className={`min-h-[40px] rounded-full px-4 py-2 text-sm font-semibold transition ${
                movementsView === "list"
                  ? "bg-morga-dark text-white"
                  : "border border-morga-line text-morga-text hover:bg-morga-surfaceAlt"
              }`}
            >
              Ingresos y gastos
            </button>
            <button
              type="button"
              onClick={() => setMovementsView("history")}
              className={`min-h-[40px] rounded-full px-4 py-2 text-sm font-semibold transition ${
                movementsView === "history"
                  ? "bg-morga-dark text-white"
                  : "border border-morga-line text-morga-text hover:bg-morga-surfaceAlt"
              }`}
            >
              Historial confirmado
            </button>
          </div>

          {movementsView === "list" ? (
        <div className="space-y-5">
          <SectionCard
            title="Ingresos"
            description="Los cobros confirmados impactan el saldo solo una vez."
            action={
              <button
                type="button"
                onClick={openIncomeCreate}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-morga-dark px-4 py-2 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                Nuevo ingreso
              </button>
            }
          >
            {finance.incomes.length === 0 ? (
              <EmptyState title="Sin ingresos" description="Agrega sueldo, viatico o ingresos extra." />
            ) : (
              <div className="space-y-4">
                {finance.incomes.map((income) => (
                  <article key={income.id} className="rounded-[22px] border border-morga-line bg-morga-surface p-4 shadow-soft">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap gap-2">
                          <Badge tone={income.status === "received" ? "success" : "info"}>
                            {formatIncomeStatus(income.status)}
                          </Badge>
                          <Badge tone="muted">{formatIncomeType(income.type)}</Badge>
                        </div>
                        <p className="mt-3 text-lg font-semibold text-morga-text">{income.name}</p>
                        <p className="mt-1 text-sm text-morga-muted">
                          Esperado: {formatDate(income.expectedDate)}
                          {income.receivedDate
                            ? ` · Cobrado: ${formatDate(income.receivedDate)}`
                            : ""}
                        </p>
                        {income.notes ? (
                          <p className="mt-2 text-sm leading-6 text-morga-muted">{income.notes}</p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <span className="inline-flex items-center rounded-full bg-morga-surfaceAlt px-4 py-2 text-sm font-semibold text-morga-text">
                          {formatMoney(income.amount)}
                        </span>
                        {income.status === "expected" ? (
                          <ActionButton
                            onClick={() =>
                              setSettlementTarget({
                                kind: "income",
                                id: income.id,
                                title: income.name,
                                amount: income.amount,
                                date: income.expectedDate
                              })
                            }
                          >
                            <Check className="h-4 w-4" />
                            Marcar cobrado
                          </ActionButton>
                        ) : (
                          <ActionButton onClick={() => reopenIncome(income.id)}>
                            <RotateCcw className="h-4 w-4" />
                            Volver a esperado
                          </ActionButton>
                        )}
                        <ActionButton
                          onClick={() => {
                            setEditingIncome(income);
                            setIncomeModalOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </ActionButton>
                        <ActionButton
                          tone="danger"
                          onClick={() => {
                            if (window.confirm("Eliminar este ingreso?")) deleteIncome(income.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </ActionButton>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Gastos"
            description="Los pagos confirmados salen del saldo y quedan registrados en historial."
            action={
              <button
                type="button"
                onClick={openExpenseCreate}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-morga-dark px-4 py-2 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                Nuevo gasto
              </button>
            }
          >
            {finance.expenses.length === 0 ? (
              <EmptyState title="Sin gastos" description="Agrega combustible, servicios o compras." />
            ) : (
              <div className="space-y-4">
                {finance.expenses.map((expense) => (
                  <article
                    key={expense.id}
                    className={`rounded-[22px] border bg-morga-surface p-4 shadow-soft ${
                      highlightId === expense.id
                        ? "border-morga-accent ring-2 ring-morga-accent/25"
                        : "border-morga-line"
                    }`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap gap-2">
                          <Badge tone={expense.status === "paid" ? "success" : "warning"}>
                            {expense.status === "paid" ? "Pagado" : "Pendiente"}
                          </Badge>
                          <Badge tone="muted">{formatExpenseCategory(expense.category)}</Badge>
                          <Badge tone="muted">{formatPaymentMethod(expense.paymentMethod)}</Badge>
                        </div>
                        <p className="mt-3 text-lg font-semibold text-morga-text">{expense.name}</p>
                        <p className="mt-1 text-sm text-morga-muted">
                          Vence: {formatDate(expense.dueDate)} ·{" "}
                          {formatRelativeDeadline(expense.dueDate)}
                          {expense.paidDate ? ` · Pagado: ${formatDate(expense.paidDate)}` : ""}
                        </p>
                        {expense.notes ? (
                          <p className="mt-2 text-sm leading-6 text-morga-muted">{expense.notes}</p>
                        ) : null}
                        {renderDecisionOrigin(
                          expense.decisionId ?? findDecisionByExpenseId(store, expense.id)?.id ?? null
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <span className="inline-flex items-center rounded-full bg-morga-surfaceAlt px-4 py-2 text-sm font-semibold text-morga-text">
                          {formatMoney(expense.amount)}
                        </span>
                        {expense.status === "pending" ? (
                          <ActionButton
                            onClick={() =>
                              setSettlementTarget({
                                kind: "expense",
                                id: expense.id,
                                title: expense.name,
                                amount: expense.amount,
                                date: expense.dueDate
                              })
                            }
                          >
                            <Check className="h-4 w-4" />
                            Marcar pagado
                          </ActionButton>
                        ) : (
                          <ActionButton onClick={() => reopenExpense(expense.id)}>
                            <RotateCcw className="h-4 w-4" />
                            Reabrir
                          </ActionButton>
                        )}
                        <ActionButton
                          onClick={() => {
                            setEditingExpense(expense);
                            setExpenseModalOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </ActionButton>
                        <ActionButton
                          tone="danger"
                          onClick={() => {
                            if (window.confirm("Eliminar este gasto?")) deleteExpense(expense.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </ActionButton>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
          ) : (
            <SectionCard title="Historial confirmado" description="Movimientos que impactaron saldo con trazabilidad y reversiones.">
              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                <label className="grid gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
                    Mes
                  </span>
                  <select
                    value={historyFilters.periodKey}
                    onChange={(event) =>
                      setHistoryFilters((current) => ({
                        ...current,
                        periodKey: event.target.value
                      }))
                    }
                    className="h-11 rounded-2xl border border-morga-line bg-morga-surface px-4 text-sm text-morga-text"
                  >
                    <option value="all">Todos</option>
                    {historyMonths.map((month) => (
                      <option key={month} value={month}>
                        {new Date(`${month}-01T12:00:00`).toLocaleDateString("es-AR", {
                          month: "long",
                          year: "numeric"
                        })}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
                    Tipo
                  </span>
                  <select
                    value={historyFilters.type}
                    onChange={(event) =>
                      setHistoryFilters((current) => ({
                        ...current,
                        type: event.target.value as FinanceHistoryType
                      }))
                    }
                    className="h-11 rounded-2xl border border-morga-line bg-morga-surface px-4 text-sm text-morga-text"
                  >
                    {historyTypeOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
                    Efecto
                  </span>
                  <select
                    value={historyFilters.direction}
                    onChange={(event) =>
                      setHistoryFilters((current) => ({
                        ...current,
                        direction: event.target.value as FinanceHistoryDirection
                      }))
                    }
                    className="h-11 rounded-2xl border border-morga-line bg-morga-surface px-4 text-sm text-morga-text"
                  >
                    {historyDirectionOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
                    Origen
                  </span>
                  <select
                    value={historyFilters.origin}
                    onChange={(event) =>
                      setHistoryFilters((current) => ({
                        ...current,
                        origin: event.target.value as FinanceHistoryOrigin
                      }))
                    }
                    className="h-11 rounded-2xl border border-morga-line bg-morga-surface px-4 text-sm text-morga-text"
                  >
                    {historyOriginOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-4 space-y-3">
                {filteredHistory.length === 0 ? (
                  <EmptyState
                    title="Sin movimientos"
                    description="Todavia no hay registros confirmados para los filtros actuales."
                  />
                ) : (
                  filteredHistory.map((entry) => {
                    const resolution = resolveFinanceHistoryRecord(store, entry.record);

                    return (
                    <article
                      key={entry.id}
                      ref={setHighlightRef(entry.id)}
                      tabIndex={-1}
                      className={`rounded-[20px] border bg-morga-surface p-4 outline-none transition ${
                        highlightId === entry.id
                          ? "border-morga-accent ring-2 ring-morga-accent/25"
                          : "border-morga-line"
                      }`}
                    >
                      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap gap-2">
                            <Badge tone={entry.direction === "credit" ? "success" : "warning"}>
                              {entry.direction === "credit" ? "Entrada" : "Salida"}
                            </Badge>
                            <Badge tone="muted">{entry.originLabel}</Badge>
                            <Badge tone="info">{entry.statusLabel}</Badge>
                          </div>
                          <p className="mt-3 text-lg font-semibold text-morga-text">
                            {entry.concept}
                          </p>
                          <p className="mt-1 text-sm text-morga-muted">
                            {formatDate(entry.effectiveDate)} · {entry.typeLabel}
                            {entry.relatedTo ? " · ligado a una reversión" : ""}
                          </p>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {[resolution.primary, ...resolution.related].map((link) =>
                              link.to ? (
                                <Link
                                  key={`${entry.id}-${link.kind}-${link.label}`}
                                  to={link.to}
                                  className="inline-flex min-h-[36px] items-center rounded-full border border-morga-line px-3 py-2 text-sm text-morga-text underline-offset-4 hover:bg-morga-surfaceAlt hover:underline"
                                >
                                  {link.label}
                                  {link.state === "archived" ? " (archivada)" : ""}
                                </Link>
                              ) : (
                                <span
                                  key={`${entry.id}-${link.kind}-${link.label}`}
                                  className="inline-flex min-h-[36px] items-center rounded-full border border-morga-line border-dashed px-3 py-2 text-sm text-morga-muted"
                                >
                                  {link.label}
                                </span>
                              )
                            )}
                          </div>
                          {resolution.reversedFrom ? (
                            <p className="mt-3 text-sm text-morga-muted">
                              {resolution.reversedFrom.to ? (
                                <Link
                                  to={resolution.reversedFrom.to}
                                  className="font-semibold text-morga-text underline-offset-4 hover:underline"
                                >
                                  {resolution.reversedFrom.label}
                                </Link>
                              ) : (
                                resolution.reversedFrom.label
                              )}
                            </p>
                          ) : null}
                          {resolution.reversedBy ? (
                            <p className="mt-2 text-sm text-morga-muted">
                              {resolution.reversedBy.to ? (
                                <Link
                                  to={resolution.reversedBy.to}
                                  className="font-semibold text-morga-text underline-offset-4 hover:underline"
                                >
                                  {resolution.reversedBy.label}
                                </Link>
                              ) : (
                                resolution.reversedBy.label
                              )}
                            </p>
                          ) : null}
                        </div>
                        <p
                          className={`text-sm font-semibold ${
                            entry.signedAmount < 0 ? "text-[#9f5f49]" : "text-morga-text"
                          }`}
                        >
                          {formatMoney(entry.signedAmount)}
                        </p>
                      </div>
                    </article>
                    );
                  })
                )}
              </div>
            </SectionCard>
          )}
        </div>
      ) : null}

      {activeTab === "more" ? (
        <div className="space-y-3">
          <details
            className="group rounded-panel border border-morga-line bg-morga-surface px-5 py-4 shadow-soft md:px-6"
            open={openMoreSections.has("month")}
            onToggle={(event) => toggleMoreSection("month", event.currentTarget.open)}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-morga-text">
              Cierre mensual
              <ChevronDown className="h-4 w-4 shrink-0 text-morga-muted transition group-open:rotate-180" />
            </summary>

            <div className="mt-5">
        <div className="space-y-5">
          <SectionCard
            title="Mes consolidado"
            description="Cada cifra sale del saldo actual, los registros confirmados y los pendientes del periodo."
            action={
              <div className="flex flex-col gap-3 sm:flex-row">
                <label className="grid gap-2">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
                    Periodo
                  </span>
                  <select
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                    className="h-11 rounded-2xl border border-morga-line bg-morga-surface px-4 text-sm text-morga-text"
                  >
                    {monthOptions.map((month) => (
                      <option key={month} value={month}>
                        {new Date(`${month}-01T12:00:00`).toLocaleDateString("es-AR", {
                          month: "long",
                          year: "numeric"
                        })}
                      </option>
                    ))}
                  </select>
                </label>

                {monthView.closure ? (
                  <ActionButton
                    onClick={() => {
                      if (window.confirm(`Reabrir el cierre de ${monthView.label}?`)) {
                        reopenMonthlyPeriod(selectedMonth);
                      }
                    }}
                  >
                    <RotateCcw className="h-4 w-4" />
                    Reabrir mes
                  </ActionButton>
                ) : (
                  <ActionButton
                    onClick={() => {
                      const warningText =
                        monthWarnings.length > 0
                          ? `\n\nAdvertencias:\n- ${monthWarnings.join("\n- ")}`
                          : "";
                      if (
                        window.confirm(
                          `Cerrar ${monthView.label} con saldo ${formatMoney(monthView.currentBalance)}?${warningText}`
                        )
                      ) {
                        closeMonthlyPeriod(selectedMonth);
                      }
                    }}
                  >
                    <Check className="h-4 w-4" />
                    Cerrar mes
                  </ActionButton>
                )}
              </div>
            }
          >
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard label="Saldo inicial" value={formatMoney(monthView.openingBalance)} />
              <MetricCard label="Ingresos cobrados" value={formatMoney(monthView.receivedIncome)} />
              <MetricCard label="Gastos pagados" value={formatMoney(monthView.paidExpenses)} />
              <MetricCard label="Cuotas pagadas" value={formatMoney(monthView.paidInstallments)} />
              <MetricCard
                label="Compromisos pagados"
                value={formatMoney(monthView.paidCommitments)}
              />
              <MetricCard
                label="Ajustes"
                value={formatMoney(monthView.adjustments)}
                tone={monthView.adjustments < 0 ? "warm" : "default"}
              />
              <MetricCard label="Saldo actual" value={formatMoney(monthView.currentBalance)} />
              <MetricCard
                label="Disponible para decidir"
                value={formatMoney(monthView.availableToDecide)}
                tone={monthView.availableToDecide < 0 ? "warm" : "default"}
              />
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <article className="rounded-[18px] border border-morga-line bg-morga-surfaceAlt/45 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
                  Ingresos esperados restantes
                </p>
                <p className="mt-2 text-lg font-semibold text-morga-text">
                  {formatMoney(monthView.expectedIncomeRemaining)}
                </p>
              </article>
              <article className="rounded-[18px] border border-morga-line bg-morga-surfaceAlt/45 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
                  Pagos pendientes restantes
                </p>
                <p className="mt-2 text-lg font-semibold text-morga-text">
                  {formatMoney(monthView.pendingPaymentsRemaining)}
                </p>
              </article>
              <article className="rounded-[18px] border border-morga-line bg-morga-surfaceAlt/45 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
                  Reservas activas
                </p>
                <p className="mt-2 text-lg font-semibold text-morga-text">
                  {formatMoney(monthView.activeReserveMoney)}
                </p>
              </article>
              <article className="rounded-[18px] border border-morga-line bg-morga-surfaceAlt/45 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-morga-muted">
                  Proyeccion de cierre
                </p>
                <p className="mt-2 text-lg font-semibold text-morga-text">
                  {formatMoney(monthView.monthEndProjection)}
                </p>
              </article>
            </div>

            {monthWarnings.length > 0 ? (
              <div className="mt-4 rounded-[18px] border border-[#d8c5b2] bg-morga-surfaceAlt px-4 py-3 text-sm text-morga-text">
                <p className="font-semibold">Advertencias antes del cierre</p>
                <ul className="mt-2 space-y-1 text-morga-muted">
                  {monthWarnings.map((warning) => (
                    <li key={warning}>• {warning}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {monthView.closure ? (
              <div className="mt-4 rounded-[18px] border border-morga-line bg-morga-surface px-4 py-3 text-sm text-morga-text">
                <p className="font-semibold">Mes cerrado</p>
                <p className="mt-1 text-morga-muted">
                  Se guardo un cierre con saldo final {formatMoney(monthView.closure.closingBalance)}.
                </p>
              </div>
            ) : null}
          </SectionCard>

          <div className="grid gap-5 xl:grid-cols-2">
            <BreakdownList
              title="Ingresos cobrados"
              items={monthView.breakdown.income}
              emptyTitle="Sin cobros confirmados"
              emptyDescription="Todavia no hay ingresos confirmados dentro del mes."
            />
            <BreakdownList
              title="Gastos pagados"
              items={monthView.breakdown.expenses}
              emptyTitle="Sin gastos confirmados"
              emptyDescription="Todavia no hay gastos pagados dentro del mes."
            />
            <BreakdownList
              title="Cuotas pagadas"
              items={monthView.breakdown.installments}
              emptyTitle="Sin cuotas confirmadas"
              emptyDescription="Todavia no hay cuotas confirmadas dentro del mes."
            />
            <BreakdownList
              title="Compromisos pagados"
              items={monthView.breakdown.commitments}
              emptyTitle="Sin compromisos confirmados"
              emptyDescription="Todavia no hay compromisos pagados dentro del mes."
            />
            <BreakdownList
              title="Ajustes manuales"
              items={monthView.breakdown.adjustments}
              emptyTitle="Sin ajustes"
              emptyDescription="No se registraron ajustes manuales en este periodo."
            />
            <BreakdownList
              title="Pendientes del periodo"
              items={[
                ...monthView.breakdown.expectedIncome,
                ...monthView.breakdown.pendingExpenses,
                ...monthView.breakdown.pendingCommitments,
                ...monthView.breakdown.pendingInstallments
              ]}
              emptyTitle="Mes al dia"
              emptyDescription="No quedan ingresos esperados ni pagos pendientes dentro del periodo."
            />
          </div>
        </div>
            </div>
          </details>

          <details
            className="group rounded-panel border border-morga-line bg-morga-surface px-5 py-4 shadow-soft md:px-6"
            open={openMoreSections.has("commitments")}
            onToggle={(event) => toggleMoreSection("commitments", event.currentTarget.open)}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-morga-text">
              Compromisos fijos
              <ChevronDown className="h-4 w-4 shrink-0 text-morga-muted transition group-open:rotate-180" />
            </summary>

            <div className="mt-5">
        <div className="space-y-5">
          <SectionCard
            title="Compromisos"
            description="Cada compromiso genera una ocurrencia mensual controlada para evitar duplicaciones."
            action={
              <button
                type="button"
                onClick={openCommitmentCreate}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-morga-dark px-4 py-2 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                Nuevo compromiso
              </button>
            }
          >
            {finance.commitments.length === 0 ? (
              <EmptyState title="Sin compromisos" description="Agrega pagos mensuales recurrentes." />
            ) : (
              <div className="space-y-4">
                {finance.commitments.map((commitment) => (
                  <article key={commitment.id} className="rounded-[22px] border border-morga-line bg-morga-surface p-4 shadow-soft">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap gap-2">
                          <Badge tone={commitment.state === "active" ? "warning" : "muted"}>
                            {commitment.state === "active" ? "Activo" : "Archivado"}
                          </Badge>
                          <Badge tone="muted">Mensual</Badge>
                        </div>
                        <p className="mt-3 text-lg font-semibold text-morga-text">{commitment.name}</p>
                        <p className="mt-1 text-sm text-morga-muted">
                          Proximo vencimiento: {formatDate(commitment.nextDueDate)} ·{" "}
                          {formatRelativeDeadline(commitment.nextDueDate)}
                        </p>
                        {commitment.currentInstallment && commitment.totalInstallments ? (
                          <p className="mt-1 text-sm text-morga-muted">
                            Cuota {commitment.currentInstallment} de {commitment.totalInstallments}
                          </p>
                        ) : null}
                      </div>
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <span className="inline-flex items-center rounded-full bg-morga-surfaceAlt px-4 py-2 text-sm font-semibold text-morga-text">
                          {formatMoney(commitment.amount)}
                        </span>
                        {commitment.state === "active" ? (
                          <ActionButton onClick={() => archiveCommitment(commitment.id)}>
                            <Wallet className="h-4 w-4" />
                            Archivar
                          </ActionButton>
                        ) : (
                          <ActionButton onClick={() => restoreCommitment(commitment.id)}>
                            <RotateCcw className="h-4 w-4" />
                            Restaurar
                          </ActionButton>
                        )}
                        <ActionButton
                          onClick={() => {
                            setEditingCommitment(commitment);
                            setCommitmentModalOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </ActionButton>
                        <ActionButton
                          tone="danger"
                          onClick={() => {
                            if (window.confirm("Eliminar este compromiso?")) {
                              deleteCommitment(commitment.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </ActionButton>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Ocurrencias del mes"
            description={`Periodo seleccionado: ${monthView.label}.`}
          >
            {monthOccurrences.length === 0 ? (
              <EmptyState
                title="Sin ocurrencias"
                description="Cuando un compromiso venza en este periodo, aparece acá una sola vez."
              />
            ) : (
              <div className="space-y-4">
                {monthOccurrences.map((occurrence) => (
                  <article
                    key={occurrence.id}
                    ref={setHighlightRef(occurrence.id)}
                    tabIndex={-1}
                    className={`rounded-[22px] border bg-morga-surface p-4 shadow-soft outline-none ${
                      highlightId === occurrence.id
                        ? "border-morga-accent ring-2 ring-morga-accent/25"
                        : "border-morga-line"
                    }`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap gap-2">
                          <Badge tone={occurrence.status === "paid" ? "success" : "warning"}>
                            {occurrence.status === "paid" ? "Pagado" : "Pendiente"}
                          </Badge>
                          <Badge tone="muted">{monthView.label}</Badge>
                        </div>
                        <p className="mt-3 text-lg font-semibold text-morga-text">
                          {occurrence.commitmentName}
                        </p>
                        <p className="mt-1 text-sm text-morga-muted">
                          Vence: {formatDate(occurrence.dueDate)} ·{" "}
                          {formatRelativeDeadline(occurrence.dueDate)}
                          {occurrence.paidDate
                            ? ` · Pagado: ${formatDate(occurrence.paidDate)}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <span className="inline-flex items-center rounded-full bg-morga-surfaceAlt px-4 py-2 text-sm font-semibold text-morga-text">
                          {formatMoney(occurrence.amount)}
                        </span>
                        {occurrence.status === "pending" ? (
                          <ActionButton
                            onClick={() =>
                              setSettlementTarget({
                                kind: "commitment",
                                id: occurrence.id,
                                title: occurrence.commitmentName,
                                amount: occurrence.amount,
                                date: occurrence.dueDate
                              })
                            }
                          >
                            <Check className="h-4 w-4" />
                            Marcar pagado
                          </ActionButton>
                        ) : (
                          <ActionButton onClick={() => reopenCommitmentOccurrence(occurrence.id)}>
                            <RotateCcw className="h-4 w-4" />
                            Reabrir
                          </ActionButton>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
            </div>
          </details>

          <details
            className="group rounded-panel border border-morga-line bg-morga-surface px-5 py-4 shadow-soft md:px-6"
            open={openMoreSections.has("cards")}
            onToggle={(event) => toggleMoreSection("cards", event.currentTarget.open)}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-morga-text">
              Tarjetas y cuotas
              <ChevronDown className="h-4 w-4 shrink-0 text-morga-muted transition group-open:rotate-180" />
            </summary>

            <div className="mt-5">
        <div className="space-y-5">
          <SectionCard
            title="Tarjetas"
            description="Cierres, vencimientos y limites opcionales."
            action={
              <button
                type="button"
                onClick={openCardCreate}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-morga-dark px-4 py-2 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                Nueva tarjeta
              </button>
            }
          >
            {finance.creditCards.length === 0 ? (
              <EmptyState title="Sin tarjetas" description="Agrega tarjetas activas para seguir cierres." />
            ) : (
              <div className="space-y-4">
                {finance.creditCards.map((card) => (
                  <article key={card.id} className="rounded-[22px] border border-morga-line bg-morga-surface p-4 shadow-soft">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap gap-2">
                          <Badge tone={card.state === "active" ? "info" : "muted"}>
                            {card.state === "active" ? "Activa" : "Archivada"}
                          </Badge>
                        </div>
                        <p className="mt-3 text-lg font-semibold text-morga-text">{card.name}</p>
                        <p className="mt-1 text-sm text-morga-muted">
                          Cierre: dia {card.closeDay} · Vencimiento: dia {card.dueDay}
                        </p>
                        <p className="mt-1 text-sm text-morga-muted">
                          Limite: {typeof card.limit === "number" ? formatMoney(card.limit) : "Sin definir"}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <ActionButton
                          onClick={() => {
                            setEditingCard(card);
                            setCardModalOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </ActionButton>
                        <ActionButton
                          tone="danger"
                          onClick={() => {
                            const guard = getCreditCardDeletionGuard(store, card.id);
                            if (!guard.allowed) {
                              window.alert(
                                `No se puede eliminar esta tarjeta porque tiene ${guard.reasons.join(", ")}. Puedes archivarla en su lugar.`
                              );
                              return;
                            }
                            if (window.confirm("Eliminar esta tarjeta?")) deleteCreditCard(card.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </ActionButton>
                        {card.state === "active" ? (
                          <ActionButton onClick={() => setCardState(card, "archived")}>
                            <Wallet className="h-4 w-4" />
                            Archivar
                          </ActionButton>
                        ) : (
                          <ActionButton onClick={() => setCardState(card, "active")}>
                            <RotateCcw className="h-4 w-4" />
                            Restaurar
                          </ActionButton>
                        )}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            title="Planes de cuotas"
            description="Cada pago descuenta solo la cuota actual y conserva historial."
            action={
              <button
                type="button"
                onClick={openPlanCreate}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-morga-dark px-4 py-2 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                Nuevo plan
              </button>
            }
          >
            {finance.installmentPlans.length === 0 ? (
              <EmptyState title="Sin cuotas" description="Agrega compras financiadas para proyectar mejor." />
            ) : (
              <div className="space-y-4">
                {finance.installmentPlans.map((plan) => (
                  <article
                    key={plan.id}
                    className={`rounded-[22px] border bg-morga-surface p-4 shadow-soft ${
                      highlightId === plan.id
                        ? "border-morga-accent ring-2 ring-morga-accent/25"
                        : "border-morga-line"
                    }`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap gap-2">
                          <Badge tone={plan.status === "active" ? "info" : plan.status === "completed" ? "success" : "muted"}>
                            {plan.status === "active" ? "Activo" : plan.status === "completed" ? "Completo" : "Archivado"}
                          </Badge>
                        </div>
                        <p className="mt-3 text-lg font-semibold text-morga-text">{plan.description}</p>
                        <p className="mt-1 text-sm text-morga-muted">
                          Cuota actual: {Math.min(plan.currentInstallment, plan.totalInstallments)} de {plan.totalInstallments}
                        </p>
                        <p className="mt-1 text-sm text-morga-muted">
                          Proximo vencimiento: {formatDate(getInstallmentDueDate(plan, Math.min(plan.currentInstallment, plan.totalInstallments)))}
                        </p>
                        {renderDecisionOrigin(
                          plan.decisionId ?? findDecisionByInstallmentPlanId(store, plan.id)?.id ?? null
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <span className="inline-flex items-center rounded-full bg-morga-surfaceAlt px-4 py-2 text-sm font-semibold text-morga-text">
                          {formatMoney(plan.installmentAmount)}
                        </span>
                        {plan.status === "active" ? (
                          <ActionButton
                            onClick={() =>
                              setSettlementTarget({
                                kind: "installment",
                                id: plan.id,
                                title: `${plan.description} · cuota ${plan.currentInstallment}`,
                                amount: plan.installmentAmount,
                                date: getInstallmentDueDate(plan, plan.currentInstallment)
                              })
                            }
                          >
                            <Check className="h-4 w-4" />
                            Pagar cuota
                          </ActionButton>
                        ) : null}
                        {plan.currentInstallment > 1 ? (
                          <ActionButton onClick={() => revertInstallmentPlan(plan.id)}>
                            <RotateCcw className="h-4 w-4" />
                            Revertir última
                          </ActionButton>
                        ) : null}
                        {plan.status === "archived" ? (
                          <ActionButton onClick={() => restoreInstallmentPlan(plan.id)}>
                            <RotateCcw className="h-4 w-4" />
                            Restaurar
                          </ActionButton>
                        ) : (
                          <ActionButton onClick={() => archiveInstallmentPlan(plan.id)}>
                            <Wallet className="h-4 w-4" />
                            Archivar
                          </ActionButton>
                        )}
                        <ActionButton
                          onClick={() => {
                            setEditingPlan(plan);
                            setPlanModalOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </ActionButton>
                        <ActionButton
                          tone="danger"
                          onClick={() => {
                            if (window.confirm("Eliminar este plan de cuotas?")) {
                              deleteInstallmentPlan(plan.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Eliminar
                        </ActionButton>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
            </div>
          </details>

          <details
            className="group rounded-panel border border-morga-line bg-morga-surface px-5 py-4 shadow-soft md:px-6"
            open={openMoreSections.has("reserves")}
            onToggle={(event) => toggleMoreSection("reserves", event.currentTarget.open)}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-morga-text">
              Reservas
              <ChevronDown className="h-4 w-4 shrink-0 text-morga-muted transition group-open:rotate-180" />
            </summary>

            <div className="mt-5">
        <SectionCard
          title="Reservas"
          description="Objetivos de dinero separados del disponible para decidir."
          action={
            <button
              type="button"
              onClick={openReserveCreate}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-morga-dark px-4 py-2 text-sm font-semibold text-white"
            >
              <Plus className="h-4 w-4" />
              Nueva reserva
            </button>
          }
        >
          {finance.reserves.length === 0 ? (
            <EmptyState title="Sin reservas" description="Agrega fondos para viaje, cubiertas o imprevistos." />
          ) : (
            <div className="space-y-4">
              {finance.reserves.map((reserve) => (
                <article
                  key={reserve.id}
                  className={`rounded-[22px] border bg-morga-surface p-4 shadow-soft ${
                    highlightId === reserve.id
                      ? "border-morga-accent ring-2 ring-morga-accent/25"
                      : "border-morga-line"
                  }`}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap gap-2">
                        <Badge tone={reserve.status === "active" ? "info" : reserve.status === "completed" ? "success" : "muted"}>
                          {formatReserveStatus(reserve.status)}
                        </Badge>
                        <Badge tone="muted">{formatReservePriority(reserve.priority)}</Badge>
                      </div>
                      <p className="mt-3 text-lg font-semibold text-morga-text">{reserve.name}</p>
                      <p className="mt-1 text-sm text-morga-muted">
                        {formatMoney(reserve.savedAmount)} de {formatMoney(reserve.targetAmount)}
                      </p>
                      {renderDecisionOrigin(
                        reserve.decisionId ?? findDecisionByReserveId(store, reserve.id)?.id ?? null
                      )}
                      {reserve.targetDate ? (
                        <p className="mt-1 text-sm text-morga-muted">
                          Objetivo: {formatDate(reserve.targetDate)} · {formatRelativeDeadline(reserve.targetDate)}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {reserve.status === "active" ? (
                        <>
                          <ActionButton onClick={() => completeReserve(reserve.id)}>
                            <Check className="h-4 w-4" />
                            Completar
                          </ActionButton>
                          <ActionButton onClick={() => archiveReserve(reserve.id)}>
                            <Wallet className="h-4 w-4" />
                            Archivar
                          </ActionButton>
                        </>
                      ) : (
                        <ActionButton onClick={() => restoreReserve(reserve.id)}>
                          <RotateCcw className="h-4 w-4" />
                          Restaurar
                        </ActionButton>
                      )}
                      <ActionButton
                        onClick={() => {
                          setEditingReserve(reserve);
                          setReserveModalOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </ActionButton>
                      <ActionButton
                        tone="danger"
                        onClick={() => {
                          const guard = getReserveDeletionGuard(store, reserve.id);
                          if (!guard.allowed) {
                            window.alert(
                              `No se puede eliminar esta reserva porque tiene ${guard.reasons.join(", ")}. Puedes archivarla en su lugar.`
                            );
                            return;
                          }
                          if (window.confirm("Eliminar esta reserva?")) deleteReserve(reserve.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar
                      </ActionButton>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </SectionCard>
            </div>
          </details>

          <details
            className="group rounded-panel border border-morga-line bg-morga-surface px-5 py-4 shadow-soft md:px-6"
            open={openMoreSections.has("settings")}
            onToggle={(event) => toggleMoreSection("settings", event.currentTarget.open)}
          >
            <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-morga-text">
              Configuración
              <ChevronDown className="h-4 w-4 shrink-0 text-morga-muted transition group-open:rotate-180" />
            </summary>

            <div className="mt-5">
        <div className="space-y-5">
          <SectionCard
            title="Configuración financiera"
            description="Saldo actual, reserva mínima y días estimados de cobro."
          >
            <FinanceSettingsForm settings={finance.settings} onSubmit={updateFinanceSettings} />
          </SectionCard>

          <SectionCard
            title="Ajustes manuales"
            description="Correcciones puntuales de saldo con posibilidad de reversión."
            action={
              <button
                type="button"
                onClick={() => setAdjustmentModalOpen(true)}
                className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-morga-dark px-4 py-2 text-sm font-semibold text-white"
              >
                <Plus className="h-4 w-4" />
                Nuevo ajuste
              </button>
            }
          >
            {finance.manualAdjustments.length === 0 ? (
              <EmptyState
                title="Sin ajustes manuales"
                description="Cuando registres una corrección de saldo, aparece acá."
              />
            ) : (
              <div className="space-y-4">
                {finance.manualAdjustments.map((adjustment) => (
                  <article
                    key={adjustment.id}
                    ref={setHighlightRef(adjustment.id)}
                    tabIndex={-1}
                    className={`rounded-[22px] border bg-morga-surface p-4 shadow-soft outline-none ${
                      highlightId === adjustment.id
                        ? "border-morga-accent ring-2 ring-morga-accent/25"
                        : "border-morga-line"
                    }`}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap gap-2">
                          <Badge tone={adjustment.direction === "credit" ? "success" : "warning"}>
                            {adjustment.direction === "credit" ? "Suma saldo" : "Resta saldo"}
                          </Badge>
                          <Badge tone="muted">{adjustment.reason}</Badge>
                          {adjustment.reversedAt ? <Badge tone="info">Revertido</Badge> : null}
                        </div>
                        <p className="mt-3 text-lg font-semibold text-morga-text">
                          {adjustment.note.trim() || "Ajuste manual"}
                        </p>
                        <p className="mt-1 text-sm text-morga-muted">
                          Fecha efectiva: {formatDate(adjustment.effectiveDate)}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2 lg:justify-end">
                        <span
                          className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold ${
                            adjustment.direction === "credit"
                              ? "bg-[#eef5ef] text-morga-text"
                              : "bg-morga-surfaceAlt text-morga-text"
                          }`}
                        >
                          {formatMoney(
                            adjustment.direction === "credit" ? adjustment.amount : -adjustment.amount
                          )}
                        </span>
                        {!adjustment.reversedAt ? (
                          <ActionButton onClick={() => reverseManualAdjustment(adjustment.id)}>
                            <RotateCcw className="h-4 w-4" />
                            Revertir
                          </ActionButton>
                        ) : null}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
            </div>
          </details>
        </div>
      ) : null}

      <QuickAddExpense open={quickExpenseOpen} onClose={() => setQuickExpenseOpen(false)} />
      <QuickAddIncome open={quickIncomeOpen} onClose={() => setQuickIncomeOpen(false)} />

      <IncomeFormModal
        open={incomeModalOpen}
        income={editingIncome}
        onClose={() => {
          setIncomeModalOpen(false);
          clearCompose();
        }}
        onSubmit={(incomeId, values) => {
          if (incomeId) {
            updateIncome(incomeId, values);
            return;
          }
          createIncome(values);
          clearCompose();
        }}
      />

      <ExpenseFormModal
        open={expenseModalOpen}
        expense={editingExpense}
        creditCards={activeCards}
        installmentPlans={activePlans}
        onClose={() => {
          setExpenseModalOpen(false);
          clearCompose();
        }}
        onSubmit={(expenseId, values) => {
          if (expenseId) {
            updateExpense(expenseId, values);
            return;
          }
          createExpense(values);
          clearCompose();
        }}
      />

      <CommitmentFormModal
        open={commitmentModalOpen}
        commitment={editingCommitment}
        onClose={() => setCommitmentModalOpen(false)}
        onSubmit={(commitmentId, values) => {
          if (commitmentId) {
            updateCommitment(commitmentId, values);
            return;
          }
          createCommitment(values);
        }}
      />

      <CreditCardFormModal
        open={cardModalOpen}
        card={editingCard}
        onClose={() => setCardModalOpen(false)}
        onSubmit={(cardId, values) => {
          if (cardId) {
            updateCreditCard(cardId, values);
            return;
          }
          createCreditCard(values);
        }}
      />

      <InstallmentPlanFormModal
        open={planModalOpen}
        plan={editingPlan}
        creditCards={activeCards}
        onClose={() => setPlanModalOpen(false)}
        onSubmit={(planId, values) => {
          if (planId) {
            updateInstallmentPlan(planId, values);
            return;
          }
          createInstallmentPlan(values);
        }}
      />

      <ReserveFormModal
        open={reserveModalOpen}
        reserve={editingReserve}
        onClose={() => setReserveModalOpen(false)}
        onSubmit={(reserveId, values) => {
          if (reserveId) {
            updateReserve(reserveId, values);
            return;
          }
          createReserve(values);
        }}
      />

      <SettlementModal
        open={Boolean(settlementTarget)}
        target={settlementTarget}
        onClose={() => setSettlementTarget(null)}
        onConfirm={handleSettlementConfirm}
      />

      <ManualAdjustmentModal
        open={adjustmentModalOpen}
        currentBalance={finance.settings.currentBalance}
        onClose={() => setAdjustmentModalOpen(false)}
        onConfirm={createManualAdjustment}
      />
    </div>
  );
}
