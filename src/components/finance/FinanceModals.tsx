import { useEffect, useMemo, useState } from "react";
import { Modal } from "../ui/Modal";
import {
  Commitment,
  CreditCard,
  Expense,
  FinanceSettings,
  Income,
  InstallmentPlan,
  Reserve
} from "../../types/domain";
import {
  archiveStateOptions,
  commitmentToFormValues,
  creditCardToFormValues,
  emptyCommitmentForm,
  emptyCreditCardForm,
  emptyExpenseForm,
  emptyIncomeForm,
  emptyInstallmentPlanForm,
  emptyReserveForm,
  expenseCategoryOptions,
  expenseToFormValues,
  financeSettingsToFormValues,
  incomeToFormValues,
  incomeTypeOptions,
  installmentPlanToFormValues,
  paymentMethodOptions,
  reserveToFormValues,
  validateCommitment,
  validateCreditCard,
  validateExpense,
  validateFinanceSettings,
  validateIncome,
  validateInstallmentPlan,
  validateReserve
} from "../../features/finance/financeForm";

const inputClassName =
  "h-11 rounded-2xl border border-morga-line bg-white px-4 text-sm text-morga-text outline-none transition focus:border-morga-accent";
const textareaClassName =
  "min-h-[104px] rounded-2xl border border-morga-line bg-white px-4 py-3 text-sm text-morga-text outline-none transition focus:border-morga-accent";

function InputField({
  label,
  error,
  children
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-semibold text-morga-text">{label}</span>
      {children}
      {error ? <span className="text-sm text-red-700">{error}</span> : null}
    </label>
  );
}

export function FinanceSettingsForm({
  settings,
  onSubmit
}: {
  settings: FinanceSettings;
  onSubmit: (values: ReturnType<typeof financeSettingsToFormValues>) => void;
}) {
  const [values, setValues] = useState(financeSettingsToFormValues(settings));
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setValues(financeSettingsToFormValues(settings));
    setSubmitted(false);
  }, [settings]);

  const errors = useMemo(() => validateFinanceSettings(values), [values]);

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        setSubmitted(true);
        if (Object.keys(errors).length > 0) return;
        onSubmit(values);
      }}
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <InputField label="Moneda">
          <input value="ARS" disabled className={`${inputClassName} bg-morga-surfaceAlt/50`} />
        </InputField>
        <InputField label="Saldo actual" error={submitted ? errors.currentBalance : undefined}>
          <input
            inputMode="numeric"
            value={values.currentBalance}
            onChange={(event) =>
              setValues((current) => ({ ...current, currentBalance: event.target.value }))
            }
            className={inputClassName}
          />
        </InputField>
        <InputField label="Reserva minima" error={submitted ? errors.minimumReserve : undefined}>
          <input
            inputMode="numeric"
            value={values.minimumReserve}
            onChange={(event) =>
              setValues((current) => ({ ...current, minimumReserve: event.target.value }))
            }
            className={inputClassName}
          />
        </InputField>
        <InputField label="Dia de sueldo" error={submitted ? errors.salaryPayday : undefined}>
          <input
            inputMode="numeric"
            value={values.salaryPayday}
            onChange={(event) =>
              setValues((current) => ({ ...current, salaryPayday: event.target.value }))
            }
            className={inputClassName}
          />
        </InputField>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <InputField
          label="Dia de viatico"
          error={submitted ? errors.allowancePayday : undefined}
        >
          <input
            inputMode="numeric"
            value={values.allowancePayday}
            onChange={(event) =>
              setValues((current) => ({ ...current, allowancePayday: event.target.value }))
            }
            className={inputClassName}
          />
        </InputField>
      </div>

      <div className="flex justify-end border-t border-morga-line pt-4">
        <button
          type="submit"
          className="rounded-full bg-morga-dark px-5 py-3 text-sm font-semibold text-white transition hover:translate-y-[-1px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-morga-accent"
        >
          Guardar configuracion
        </button>
      </div>
    </form>
  );
}

export function CreditCardFormModal({
  open,
  card,
  onClose,
  onSubmit
}: {
  open: boolean;
  card?: CreditCard | null;
  onClose: () => void;
  onSubmit: (cardId: string | null, values: ReturnType<typeof creditCardToFormValues>) => void;
}) {
  const [values, setValues] = useState(emptyCreditCardForm);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(card ? creditCardToFormValues(card) : emptyCreditCardForm);
    setSubmitted(false);
  }, [open, card]);

  const errors = useMemo(() => validateCreditCard(values), [values]);

  return (
    <Modal
      open={open}
      title={card ? "Editar tarjeta" : "Nueva tarjeta"}
      description="Carga cierres y vencimientos para tener una vista mas clara del mes."
      onClose={onClose}
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
          if (Object.keys(errors).length > 0) return;
          onSubmit(card?.id ?? null, values);
          onClose();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <InputField label="Nombre" error={submitted ? errors.name : undefined}>
            <input
              value={values.name}
              onChange={(event) =>
                setValues((current) => ({ ...current, name: event.target.value }))
              }
              className={inputClassName}
            />
          </InputField>
          <InputField label="Limite opcional" error={submitted ? errors.limit : undefined}>
            <input
              inputMode="numeric"
              value={values.limit}
              onChange={(event) =>
                setValues((current) => ({ ...current, limit: event.target.value }))
              }
              className={inputClassName}
            />
          </InputField>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <InputField label="Dia de cierre" error={submitted ? errors.closeDay : undefined}>
            <input
              inputMode="numeric"
              value={values.closeDay}
              onChange={(event) =>
                setValues((current) => ({ ...current, closeDay: event.target.value }))
              }
              className={inputClassName}
            />
          </InputField>
          <InputField label="Dia de vencimiento" error={submitted ? errors.dueDay : undefined}>
            <input
              inputMode="numeric"
              value={values.dueDay}
              onChange={(event) =>
                setValues((current) => ({ ...current, dueDay: event.target.value }))
              }
              className={inputClassName}
            />
          </InputField>
          <InputField label="Estado">
            <select
              value={values.state}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  state: event.target.value as typeof current.state
                }))
              }
              className={inputClassName}
            >
              {archiveStateOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </InputField>
        </div>
        <div className="flex flex-col gap-3 border-t border-morga-line pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-full border border-morga-line px-5 py-3 text-sm font-semibold text-morga-muted">
            Cancelar
          </button>
          <button type="submit" className="rounded-full bg-morga-dark px-5 py-3 text-sm font-semibold text-white">
            Guardar tarjeta
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function IncomeFormModal({
  open,
  income,
  onClose,
  onSubmit
}: {
  open: boolean;
  income?: Income | null;
  onClose: () => void;
  onSubmit: (incomeId: string | null, values: ReturnType<typeof incomeToFormValues>) => void;
}) {
  const [values, setValues] = useState(emptyIncomeForm);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(income ? incomeToFormValues(income) : emptyIncomeForm);
    setSubmitted(false);
  }, [open, income]);

  const errors = useMemo(() => validateIncome(values), [values]);

  return (
    <Modal
      open={open}
      title={income ? "Editar ingreso" : "Nuevo ingreso"}
      description="Registra cobros esperados o ya recibidos sin mezclar datos bancarios sensibles."
      onClose={onClose}
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
          if (Object.keys(errors).length > 0) return;
          onSubmit(income?.id ?? null, values);
          onClose();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <InputField label="Tipo">
            <select
              value={values.type}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  type: event.target.value as typeof current.type
                }))
              }
              className={inputClassName}
            >
              {incomeTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </InputField>
          <InputField label="Estado">
            <select
              value={values.status}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  status: event.target.value as typeof current.status
                }))
              }
              className={inputClassName}
            >
              <option value="expected">Esperado</option>
              <option value="received">Cobrado</option>
            </select>
          </InputField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <InputField label="Nombre" error={submitted ? errors.name : undefined}>
            <input
              value={values.name}
              onChange={(event) =>
                setValues((current) => ({ ...current, name: event.target.value }))
              }
              className={inputClassName}
            />
          </InputField>
          <InputField label="Importe" error={submitted ? errors.amount : undefined}>
            <input
              inputMode="numeric"
              value={values.amount}
              onChange={(event) =>
                setValues((current) => ({ ...current, amount: event.target.value }))
              }
              className={inputClassName}
            />
          </InputField>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <InputField label="Fecha esperada" error={submitted ? errors.expectedDate : undefined}>
            <input
              type="date"
              value={values.expectedDate}
              onChange={(event) =>
                setValues((current) => ({ ...current, expectedDate: event.target.value }))
              }
              className={inputClassName}
            />
          </InputField>
          <InputField label="Fecha cobrada" error={submitted ? errors.receivedDate : undefined}>
            <input
              type="date"
              value={values.receivedDate}
              onChange={(event) =>
                setValues((current) => ({ ...current, receivedDate: event.target.value }))
              }
              className={inputClassName}
            />
          </InputField>
          <InputField label="Recurrencia">
            <select
              value={values.recurrence}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  recurrence: event.target.value as typeof current.recurrence
                }))
              }
              className={inputClassName}
            >
              <option value="">Sin recurrencia</option>
              <option value="monthly">Mensual</option>
              <option value="one-time">Una vez</option>
            </select>
          </InputField>
        </div>
        <InputField label="Notas">
          <textarea
            value={values.notes}
            onChange={(event) =>
              setValues((current) => ({ ...current, notes: event.target.value }))
            }
            className={textareaClassName}
          />
        </InputField>
        <div className="flex flex-col gap-3 border-t border-morga-line pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-full border border-morga-line px-5 py-3 text-sm font-semibold text-morga-muted">
            Cancelar
          </button>
          <button type="submit" className="rounded-full bg-morga-dark px-5 py-3 text-sm font-semibold text-white">
            Guardar ingreso
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function ExpenseFormModal({
  open,
  expense,
  creditCards,
  installmentPlans,
  onClose,
  onSubmit
}: {
  open: boolean;
  expense?: Expense | null;
  creditCards: CreditCard[];
  installmentPlans: InstallmentPlan[];
  onClose: () => void;
  onSubmit: (expenseId: string | null, values: ReturnType<typeof expenseToFormValues>) => void;
}) {
  const [values, setValues] = useState(emptyExpenseForm);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(expense ? expenseToFormValues(expense) : emptyExpenseForm);
    setSubmitted(false);
  }, [open, expense]);

  const errors = useMemo(
    () =>
      validateExpense(
        values,
        creditCards.map((card) => card.id),
        installmentPlans.map((plan) => plan.id)
      ),
    [creditCards, installmentPlans, values]
  );

  return (
    <Modal
      open={open}
      title={expense ? "Editar gasto" : "Nuevo gasto"}
      description="Carga pagos puntuales del mes y, si hace falta, vinculos con tarjeta o plan de cuotas."
      onClose={onClose}
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
          if (Object.keys(errors).length > 0) return;
          onSubmit(expense?.id ?? null, values);
          onClose();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <InputField label="Nombre" error={submitted ? errors.name : undefined}>
            <input
              value={values.name}
              onChange={(event) =>
                setValues((current) => ({ ...current, name: event.target.value }))
              }
              className={inputClassName}
            />
          </InputField>
          <InputField label="Importe" error={submitted ? errors.amount : undefined}>
            <input
              inputMode="numeric"
              value={values.amount}
              onChange={(event) =>
                setValues((current) => ({ ...current, amount: event.target.value }))
              }
              className={inputClassName}
            />
          </InputField>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InputField label="Vence" error={submitted ? errors.dueDate : undefined}>
            <input
              type="date"
              value={values.dueDate}
              onChange={(event) =>
                setValues((current) => ({ ...current, dueDate: event.target.value }))
              }
              className={inputClassName}
            />
          </InputField>
          <InputField label="Pagado">
            <input
              type="date"
              value={values.paidDate}
              onChange={(event) =>
                setValues((current) => ({ ...current, paidDate: event.target.value }))
              }
              className={inputClassName}
            />
          </InputField>
          <InputField label="Estado">
            <select
              value={values.status}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  status: event.target.value as typeof current.status
                }))
              }
              className={inputClassName}
            >
              <option value="pending">Pendiente</option>
              <option value="paid">Pagado</option>
            </select>
          </InputField>
          <InputField label="Categoria">
            <select
              value={values.category}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  category: event.target.value as typeof current.category
                }))
              }
              className={inputClassName}
            >
              {expenseCategoryOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </InputField>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <InputField label="Metodo de pago">
            <select
              value={values.paymentMethod}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  paymentMethod: event.target.value as typeof current.paymentMethod
                }))
              }
              className={inputClassName}
            >
              {paymentMethodOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </InputField>
          <InputField label="Tarjeta" error={submitted ? errors.creditCardId : undefined}>
            <select
              value={values.creditCardId}
              onChange={(event) =>
                setValues((current) => ({ ...current, creditCardId: event.target.value }))
              }
              className={inputClassName}
            >
              <option value="">Sin tarjeta</option>
              {creditCards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name}
                </option>
              ))}
            </select>
          </InputField>
          <InputField label="Plan de cuotas" error={submitted ? errors.installmentPlanId : undefined}>
            <select
              value={values.installmentPlanId}
              onChange={(event) =>
                setValues((current) => ({ ...current, installmentPlanId: event.target.value }))
              }
              className={inputClassName}
            >
              <option value="">Sin plan</option>
              {installmentPlans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.description}
                </option>
              ))}
            </select>
          </InputField>
        </div>
        <InputField label="Notas">
          <textarea
            value={values.notes}
            onChange={(event) =>
              setValues((current) => ({ ...current, notes: event.target.value }))
            }
            className={textareaClassName}
          />
        </InputField>
        <div className="flex flex-col gap-3 border-t border-morga-line pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-full border border-morga-line px-5 py-3 text-sm font-semibold text-morga-muted">
            Cancelar
          </button>
          <button type="submit" className="rounded-full bg-morga-dark px-5 py-3 text-sm font-semibold text-white">
            Guardar gasto
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function CommitmentFormModal({
  open,
  commitment,
  onClose,
  onSubmit
}: {
  open: boolean;
  commitment?: Commitment | null;
  onClose: () => void;
  onSubmit: (
    commitmentId: string | null,
    values: ReturnType<typeof commitmentToFormValues>
  ) => void;
}) {
  const [values, setValues] = useState(emptyCommitmentForm);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(commitment ? commitmentToFormValues(commitment) : emptyCommitmentForm);
    setSubmitted(false);
  }, [open, commitment]);

  const errors = useMemo(() => validateCommitment(values), [values]);

  return (
    <Modal
      open={open}
      title={commitment ? "Editar compromiso" : "Nuevo compromiso"}
      description="Usa compromisos para prestamos, servicios y otros pagos periodicos."
      onClose={onClose}
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
          if (Object.keys(errors).length > 0) return;
          onSubmit(commitment?.id ?? null, values);
          onClose();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <InputField label="Nombre" error={submitted ? errors.name : undefined}>
            <input
              value={values.name}
              onChange={(event) =>
                setValues((current) => ({ ...current, name: event.target.value }))
              }
              className={inputClassName}
            />
          </InputField>
          <InputField label="Importe" error={submitted ? errors.amount : undefined}>
            <input
              inputMode="numeric"
              value={values.amount}
              onChange={(event) =>
                setValues((current) => ({ ...current, amount: event.target.value }))
              }
              className={inputClassName}
            />
          </InputField>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InputField label="Frecuencia">
            <input value="Mensual" disabled className={`${inputClassName} bg-morga-surfaceAlt/50`} />
          </InputField>
          <InputField label="Proximo vencimiento" error={submitted ? errors.nextDueDate : undefined}>
            <input
              type="date"
              value={values.nextDueDate}
              onChange={(event) =>
                setValues((current) => ({ ...current, nextDueDate: event.target.value }))
              }
              className={inputClassName}
            />
          </InputField>
          <InputField label="Inicio" error={submitted ? errors.startDate : undefined}>
            <input
              type="date"
              value={values.startDate}
              onChange={(event) =>
                setValues((current) => ({ ...current, startDate: event.target.value }))
              }
              className={inputClassName}
            />
          </InputField>
          <InputField label="Fin" error={submitted ? errors.endDate : undefined}>
            <input
              type="date"
              value={values.endDate}
              onChange={(event) =>
                setValues((current) => ({ ...current, endDate: event.target.value }))
              }
              className={inputClassName}
            />
          </InputField>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <InputField
            label="Cantidad total de cuotas"
            error={submitted ? errors.totalInstallments : undefined}
          >
            <input
              inputMode="numeric"
              value={values.totalInstallments}
              onChange={(event) =>
                setValues((current) => ({ ...current, totalInstallments: event.target.value }))
              }
              className={inputClassName}
            />
          </InputField>
          <InputField label="Cuota actual" error={submitted ? errors.currentInstallment : undefined}>
            <input
              inputMode="numeric"
              value={values.currentInstallment}
              onChange={(event) =>
                setValues((current) => ({ ...current, currentInstallment: event.target.value }))
              }
              className={inputClassName}
            />
          </InputField>
          <InputField label="Estado">
            <select
              value={values.state}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  state: event.target.value as typeof current.state
                }))
              }
              className={inputClassName}
            >
              {archiveStateOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </InputField>
        </div>
        <InputField label="Notas">
          <textarea
            value={values.notes}
            onChange={(event) =>
              setValues((current) => ({ ...current, notes: event.target.value }))
            }
            className={textareaClassName}
          />
        </InputField>
        <div className="flex flex-col gap-3 border-t border-morga-line pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-full border border-morga-line px-5 py-3 text-sm font-semibold text-morga-muted">
            Cancelar
          </button>
          <button type="submit" className="rounded-full bg-morga-dark px-5 py-3 text-sm font-semibold text-white">
            Guardar compromiso
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function InstallmentPlanFormModal({
  open,
  plan,
  creditCards,
  onClose,
  onSubmit
}: {
  open: boolean;
  plan?: InstallmentPlan | null;
  creditCards: CreditCard[];
  onClose: () => void;
  onSubmit: (
    planId: string | null,
    values: ReturnType<typeof installmentPlanToFormValues>
  ) => void;
}) {
  const [values, setValues] = useState(emptyInstallmentPlanForm);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(plan ? installmentPlanToFormValues(plan) : emptyInstallmentPlanForm);
    setSubmitted(false);
  }, [open, plan]);

  const errors = useMemo(
    () => validateInstallmentPlan(values, creditCards.map((card) => card.id)),
    [creditCards, values]
  );

  return (
    <Modal
      open={open}
      title={plan ? "Editar plan de cuotas" : "Nuevo plan de cuotas"}
      description="Registra compras financiadas sin contarlas dos veces en el flujo mensual."
      onClose={onClose}
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
          if (Object.keys(errors).length > 0) return;
          onSubmit(plan?.id ?? null, values);
          onClose();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <InputField label="Descripcion" error={submitted ? errors.description : undefined}>
            <input
              value={values.description}
              onChange={(event) =>
                setValues((current) => ({ ...current, description: event.target.value }))
              }
              className={inputClassName}
            />
          </InputField>
          <InputField label="Tarjeta" error={submitted ? errors.creditCardId : undefined}>
            <select
              value={values.creditCardId}
              onChange={(event) =>
                setValues((current) => ({ ...current, creditCardId: event.target.value }))
              }
              className={inputClassName}
            >
              <option value="">Selecciona una tarjeta</option>
              {creditCards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.name}
                </option>
              ))}
            </select>
          </InputField>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InputField label="Importe total" error={submitted ? errors.totalAmount : undefined}>
            <input
              inputMode="numeric"
              value={values.totalAmount}
              onChange={(event) =>
                setValues((current) => ({ ...current, totalAmount: event.target.value }))
              }
              className={inputClassName}
            />
          </InputField>
          <InputField
            label="Cantidad de cuotas"
            error={submitted ? errors.totalInstallments : undefined}
          >
            <input
              inputMode="numeric"
              value={values.totalInstallments}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  totalInstallments: event.target.value
                }))
              }
              className={inputClassName}
            />
          </InputField>
          <InputField label="Valor de cuota" error={submitted ? errors.installmentAmount : undefined}>
            <input
              inputMode="numeric"
              value={values.installmentAmount}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  installmentAmount: event.target.value
                }))
              }
              className={inputClassName}
            />
          </InputField>
          <InputField label="Primera fecha" error={submitted ? errors.firstDueDate : undefined}>
            <input
              type="date"
              value={values.firstDueDate}
              onChange={(event) =>
                setValues((current) => ({ ...current, firstDueDate: event.target.value }))
              }
              className={inputClassName}
            />
          </InputField>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <InputField label="Cuota actual" error={submitted ? errors.currentInstallment : undefined}>
            <input
              inputMode="numeric"
              value={values.currentInstallment}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  currentInstallment: event.target.value
                }))
              }
              className={inputClassName}
            />
          </InputField>
          <InputField label="Estado">
            <select
              value={values.status}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  status: event.target.value as typeof current.status
                }))
              }
              className={inputClassName}
            >
              <option value="active">Activo</option>
              <option value="completed">Completo</option>
              <option value="archived">Archivado</option>
            </select>
          </InputField>
        </div>
        <div className="flex flex-col gap-3 border-t border-morga-line pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-full border border-morga-line px-5 py-3 text-sm font-semibold text-morga-muted">
            Cancelar
          </button>
          <button type="submit" className="rounded-full bg-morga-dark px-5 py-3 text-sm font-semibold text-white">
            Guardar plan
          </button>
        </div>
      </form>
    </Modal>
  );
}

export function ReserveFormModal({
  open,
  reserve,
  onClose,
  onSubmit
}: {
  open: boolean;
  reserve?: Reserve | null;
  onClose: () => void;
  onSubmit: (reserveId: string | null, values: ReturnType<typeof reserveToFormValues>) => void;
}) {
  const [values, setValues] = useState(emptyReserveForm);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(reserve ? reserveToFormValues(reserve) : emptyReserveForm);
    setSubmitted(false);
  }, [open, reserve]);

  const errors = useMemo(() => validateReserve(values), [values]);

  return (
    <Modal
      open={open}
      title={reserve ? "Editar reserva" : "Nueva reserva"}
      description="Las reservas restan del disponible para decidir, pero no del saldo bancario."
      onClose={onClose}
    >
      <form
        className="grid gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted(true);
          if (Object.keys(errors).length > 0) return;
          onSubmit(reserve?.id ?? null, values);
          onClose();
        }}
      >
        <div className="grid gap-4 md:grid-cols-2">
          <InputField label="Nombre" error={submitted ? errors.name : undefined}>
            <input
              value={values.name}
              onChange={(event) =>
                setValues((current) => ({ ...current, name: event.target.value }))
              }
              className={inputClassName}
            />
          </InputField>
          <InputField label="Objetivo" error={submitted ? errors.targetAmount : undefined}>
            <input
              inputMode="numeric"
              value={values.targetAmount}
              onChange={(event) =>
                setValues((current) => ({ ...current, targetAmount: event.target.value }))
              }
              className={inputClassName}
            />
          </InputField>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <InputField label="Guardado" error={submitted ? errors.savedAmount : undefined}>
            <input
              inputMode="numeric"
              value={values.savedAmount}
              onChange={(event) =>
                setValues((current) => ({ ...current, savedAmount: event.target.value }))
              }
              className={inputClassName}
            />
          </InputField>
          <InputField label="Fecha objetivo" error={submitted ? errors.targetDate : undefined}>
            <input
              type="date"
              value={values.targetDate}
              onChange={(event) =>
                setValues((current) => ({ ...current, targetDate: event.target.value }))
              }
              className={inputClassName}
            />
          </InputField>
          <InputField label="Prioridad">
            <select
              value={values.priority}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  priority: event.target.value as typeof current.priority
                }))
              }
              className={inputClassName}
            >
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baja</option>
            </select>
          </InputField>
          <InputField label="Estado">
            <select
              value={values.status}
              onChange={(event) =>
                setValues((current) => ({
                  ...current,
                  status: event.target.value as typeof current.status
                }))
              }
              className={inputClassName}
            >
              <option value="active">Activa</option>
              <option value="completed">Completa</option>
              <option value="archived">Archivada</option>
            </select>
          </InputField>
        </div>
        <InputField label="Notas">
          <textarea
            value={values.notes}
            onChange={(event) =>
              setValues((current) => ({ ...current, notes: event.target.value }))
            }
            className={textareaClassName}
          />
        </InputField>
        <div className="flex flex-col gap-3 border-t border-morga-line pt-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="rounded-full border border-morga-line px-5 py-3 text-sm font-semibold text-morga-muted">
            Cancelar
          </button>
          <button type="submit" className="rounded-full bg-morga-dark px-5 py-3 text-sm font-semibold text-white">
            Guardar reserva
          </button>
        </div>
      </form>
    </Modal>
  );
}
