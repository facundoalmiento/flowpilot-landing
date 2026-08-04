import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Modal } from "../ui/Modal";
import { usePlanning } from "../../features/planning/usePlanning";
import { IncomeType, PaymentMethod } from "../../types/domain";
import { formatMoney } from "../../utils/format";

function getRecent(values: string[], limit = 6): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const key = value.trim();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(key);
    if (result.length >= limit) break;
  }
  return result;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function UndoToast({
  label,
  onUndo
}: {
  label: string;
  onUndo: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-24 z-[60] flex justify-center px-4 lg:bottom-6">
      <div className="flex items-center gap-3 rounded-full border border-morga-line bg-morga-dark px-5 py-3 text-sm font-semibold text-white shadow-panel">
        <span className="max-w-[220px] truncate sm:max-w-none">{label}</span>
        <button
          type="button"
          onClick={onUndo}
          className="shrink-0 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/25"
        >
          Deshacer
        </button>
      </div>
    </div>
  );
}

const paymentMethods: Array<{ value: PaymentMethod; label: string }> = [
  { value: "debit", label: "Debito" },
  { value: "cash", label: "Efectivo" },
  { value: "bank-transfer", label: "Transferencia" },
  { value: "credit-card", label: "Tarjeta" }
];

export function QuickAddExpense({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { finance, createExpense, deleteExpense } = usePlanning();
  const [amount, setAmount] = useState("");
  const [concept, setConcept] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("debit");
  const [submitted, setSubmitted] = useState(false);
  const [pendingUndo, setPendingUndo] = useState<{ id: string; label: string } | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const creatingRef = useRef(false);

  const recentConcepts = useMemo(
    () => getRecent(finance.expenses.map((expense) => expense.name)),
    [finance.expenses]
  );

  useEffect(() => {
    if (!open) return;
    setAmount("");
    setConcept("");
    setMethod(finance.expenses[0]?.paymentMethod ?? "debit");
    setSubmitted(false);
    const timer = setTimeout(() => amountRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [open, finance.expenses]);

  useEffect(() => {
    if (!creatingRef.current) return;
    creatingRef.current = false;
    const created = finance.expenses[0];
    if (created) {
      setPendingUndo({ id: created.id, label: `Gasto agregado: ${created.name} · ${formatMoney(created.amount)}` });
    }
  }, [finance.expenses]);

  useEffect(() => {
    if (!pendingUndo) return;
    const timer = setTimeout(() => setPendingUndo(null), 5000);
    return () => clearTimeout(timer);
  }, [pendingUndo]);

  const numericAmount = Number(amount);
  const hasAmount = Number.isFinite(numericAmount) && numericAmount > 0;
  const hasConcept = concept.trim().length > 0;
  const canSave = hasAmount && hasConcept;

  const handleSave = () => {
    setSubmitted(true);
    if (!canSave) return;

    const today = todayIso();
    creatingRef.current = true;
    createExpense({
      name: concept.trim(),
      amount,
      dueDate: today,
      paidDate: today,
      status: "paid",
      category: "other",
      paymentMethod: method,
      creditCardId: "",
      installmentPlanId: "",
      notes: ""
    });
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSave();
    }
  };

  return (
    <>
      <Modal open={open} title="Agregar gasto" description="" onClose={onClose}>
        <div className="grid gap-5" onKeyDown={handleKeyDown}>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-morga-text">Monto</span>
            <input
              ref={amountRef}
              inputMode="decimal"
              placeholder="$ 0"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="h-16 rounded-2xl border border-morga-line bg-morga-surface px-5 text-3xl font-semibold text-morga-text outline-none transition focus:border-morga-accent"
            />
            {submitted && !hasAmount ? (
              <span className="text-sm text-red-600">Ingresa un monto mayor a cero.</span>
            ) : null}
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-morga-text">Concepto</span>
            <input
              placeholder="Ej: Nafta, Super, Uber"
              value={concept}
              onChange={(event) => setConcept(event.target.value)}
              className="h-12 rounded-2xl border border-morga-line bg-morga-surface px-4 text-sm text-morga-text outline-none transition focus:border-morga-accent"
            />
            {recentConcepts.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {recentConcepts.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setConcept(item)}
                    className="rounded-full border border-morga-line bg-morga-surfaceAlt px-3 py-1.5 text-xs font-medium text-morga-text transition hover:bg-morga-accentSoft"
                  >
                    {item}
                  </button>
                ))}
              </div>
            ) : null}
            {submitted && !hasConcept ? (
              <span className="text-sm text-red-600">Conta en pocas palabras en que fue.</span>
            ) : null}
          </label>

          <div className="grid gap-2">
            <span className="text-sm font-semibold text-morga-text">Medio de pago</span>
            <div className="grid grid-cols-4 gap-2">
              {paymentMethods.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMethod(option.value)}
                  className={`rounded-2xl border px-2 py-3 text-xs font-semibold transition ${
                    method === option.value
                      ? "border-morga-accent bg-morga-accentSoft text-morga-text"
                      : "border-morga-line bg-morga-surface text-morga-muted hover:bg-morga-surfaceAlt"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="h-14 rounded-full bg-morga-dark text-base font-semibold text-white transition disabled:opacity-40"
          >
            Agregar gasto
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/finances?tab=movements&compose=expense");
            }}
            className="text-center text-sm font-medium text-morga-muted underline-offset-4 hover:underline"
          >
            Cargar con mas detalle
          </button>
        </div>
      </Modal>

      {pendingUndo ? (
        <UndoToast
          label={pendingUndo.label}
          onUndo={() => {
            deleteExpense(pendingUndo.id);
            setPendingUndo(null);
          }}
        />
      ) : null}
    </>
  );
}

const incomeTypes: Array<{ value: IncomeType; label: string }> = [
  { value: "salary", label: "Sueldo" },
  { value: "extra", label: "Extra" },
  { value: "refund", label: "Reintegro" },
  { value: "other", label: "Otro" }
];

export function QuickAddIncome({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const { finance, createIncome, deleteIncome } = usePlanning();
  const [amount, setAmount] = useState("");
  const [concept, setConcept] = useState("");
  const [type, setType] = useState<IncomeType>("salary");
  const [submitted, setSubmitted] = useState(false);
  const [pendingUndo, setPendingUndo] = useState<{ id: string; label: string } | null>(null);
  const amountRef = useRef<HTMLInputElement>(null);
  const creatingRef = useRef(false);

  const recentConcepts = useMemo(
    () => getRecent(finance.incomes.map((income) => income.name)),
    [finance.incomes]
  );

  useEffect(() => {
    if (!open) return;
    setAmount("");
    setConcept("");
    setType(finance.incomes[0]?.type ?? "salary");
    setSubmitted(false);
    const timer = setTimeout(() => amountRef.current?.focus(), 50);
    return () => clearTimeout(timer);
  }, [open, finance.incomes]);

  useEffect(() => {
    if (!creatingRef.current) return;
    creatingRef.current = false;
    const created = finance.incomes[0];
    if (created) {
      setPendingUndo({ id: created.id, label: `Ingreso agregado: ${created.name} · ${formatMoney(created.amount)}` });
    }
  }, [finance.incomes]);

  useEffect(() => {
    if (!pendingUndo) return;
    const timer = setTimeout(() => setPendingUndo(null), 5000);
    return () => clearTimeout(timer);
  }, [pendingUndo]);

  const numericAmount = Number(amount);
  const hasAmount = Number.isFinite(numericAmount) && numericAmount > 0;
  const hasConcept = concept.trim().length > 0;
  const canSave = hasAmount && hasConcept;

  const handleSave = () => {
    setSubmitted(true);
    if (!canSave) return;

    const today = todayIso();
    creatingRef.current = true;
    createIncome({
      type,
      name: concept.trim(),
      amount,
      expectedDate: today,
      receivedDate: today,
      status: "received",
      recurrence: "",
      notes: ""
    });
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSave();
    }
  };

  return (
    <>
      <Modal open={open} title="Agregar ingreso" description="" onClose={onClose}>
        <div className="grid gap-5" onKeyDown={handleKeyDown}>
          <label className="grid gap-2">
            <span className="text-sm font-semibold text-morga-text">Monto</span>
            <input
              ref={amountRef}
              inputMode="decimal"
              placeholder="$ 0"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              className="h-16 rounded-2xl border border-morga-line bg-morga-surface px-5 text-3xl font-semibold text-morga-text outline-none transition focus:border-morga-accent"
            />
            {submitted && !hasAmount ? (
              <span className="text-sm text-red-600">Ingresa un monto mayor a cero.</span>
            ) : null}
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-semibold text-morga-text">Concepto</span>
            <input
              placeholder="Ej: Sueldo, Reintegro obra social"
              value={concept}
              onChange={(event) => setConcept(event.target.value)}
              className="h-12 rounded-2xl border border-morga-line bg-morga-surface px-4 text-sm text-morga-text outline-none transition focus:border-morga-accent"
            />
            {recentConcepts.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {recentConcepts.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setConcept(item)}
                    className="rounded-full border border-morga-line bg-morga-surfaceAlt px-3 py-1.5 text-xs font-medium text-morga-text transition hover:bg-morga-accentSoft"
                  >
                    {item}
                  </button>
                ))}
              </div>
            ) : null}
            {submitted && !hasConcept ? (
              <span className="text-sm text-red-600">Conta en pocas palabras de que ingreso se trata.</span>
            ) : null}
          </label>

          <div className="grid gap-2">
            <span className="text-sm font-semibold text-morga-text">Tipo</span>
            <div className="grid grid-cols-4 gap-2">
              {incomeTypes.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value)}
                  className={`rounded-2xl border px-2 py-3 text-xs font-semibold transition ${
                    type === option.value
                      ? "border-morga-accent bg-morga-accentSoft text-morga-text"
                      : "border-morga-line bg-morga-surface text-morga-muted hover:bg-morga-surfaceAlt"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="h-14 rounded-full bg-morga-dark text-base font-semibold text-white transition disabled:opacity-40"
          >
            Agregar ingreso
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              navigate("/finances?tab=movements&compose=income");
            }}
            className="text-center text-sm font-medium text-morga-muted underline-offset-4 hover:underline"
          >
            Cargar con mas detalle
          </button>
        </div>
      </Modal>

      {pendingUndo ? (
        <UndoToast
          label={pendingUndo.label}
          onUndo={() => {
            deleteIncome(pendingUndo.id);
            setPendingUndo(null);
          }}
        />
      ) : null}
    </>
  );
}
