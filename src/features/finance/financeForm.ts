import {
  ArchiveState,
  Commitment,
  CommitmentFormValues,
  CreditCard,
  CreditCardFormValues,
  Expense,
  ExpenseCategory,
  ExpenseFormValues,
  FinanceSettings,
  FinanceSettingsFormValues,
  Income,
  IncomeFormValues,
  InstallmentPlan,
  InstallmentPlanFormValues,
  PaymentMethod,
  Reserve,
  ReserveFormValues
} from "../../types/domain";

type FormErrors<T> = Partial<Record<keyof T, string>>;

export const incomeTypeOptions = [
  { value: "salary", label: "Sueldo" },
  { value: "allowance", label: "Viático" },
  { value: "bonus", label: "Aguinaldo" },
  { value: "refund", label: "Reintegro" },
  { value: "extra", label: "Ingreso extra" },
  { value: "other", label: "Otro" }
] as const;

export const expenseCategoryOptions: Array<{ value: ExpenseCategory; label: string }> = [
  { value: "housing", label: "Vivienda" },
  { value: "transport", label: "Transporte" },
  { value: "health", label: "Salud" },
  { value: "training", label: "Entrenamiento" },
  { value: "food", label: "Alimentación" },
  { value: "cards", label: "Tarjetas" },
  { value: "loan", label: "Préstamo" },
  { value: "travel", label: "Viajes" },
  { value: "shopping", label: "Compras" },
  { value: "projects", label: "Proyectos" },
  { value: "other", label: "Otro" }
];

export const paymentMethodOptions: Array<{ value: PaymentMethod; label: string }> = [
  { value: "cash", label: "Efectivo" },
  { value: "debit", label: "Débito" },
  { value: "bank-transfer", label: "Transferencia" },
  { value: "credit-card", label: "Tarjeta" },
  { value: "other", label: "Otro" }
];

export const archiveStateOptions: Array<{ value: ArchiveState; label: string }> = [
  { value: "active", label: "Activa" },
  { value: "archived", label: "Archivada" }
];

function parseOptionalNumber(value: string) {
  if (!value.trim()) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : Number.NaN;
}

function hasValidDate(value: string) {
  if (!value.trim()) return false;
  return !Number.isNaN(new Date(value).getTime());
}

function isValidDay(value: string) {
  const day = Number(value);
  return Number.isInteger(day) && day >= 1 && day <= 31;
}

export const emptyFinanceSettingsForm: FinanceSettingsFormValues = {
  currency: "ARS",
  currentBalance: "",
  minimumReserve: "",
  salaryPayday: "5",
  allowancePayday: "20"
};

export function financeSettingsToFormValues(settings: FinanceSettings): FinanceSettingsFormValues {
  return {
    currency: settings.currency,
    currentBalance: String(settings.currentBalance),
    minimumReserve: String(settings.minimumReserve),
    salaryPayday: String(settings.salaryPayday),
    allowancePayday: String(settings.allowancePayday)
  };
}

export function validateFinanceSettings(values: FinanceSettingsFormValues) {
  const errors: FormErrors<FinanceSettingsFormValues> = {};

  if (!values.currentBalance.trim() || Number(values.currentBalance) < 0) {
    errors.currentBalance = "Ingresá un saldo válido.";
  }

  if (!values.minimumReserve.trim() || Number(values.minimumReserve) < 0) {
    errors.minimumReserve = "Ingresá una reserva mínima válida.";
  }

  if (!isValidDay(values.salaryPayday)) {
    errors.salaryPayday = "El día debe estar entre 1 y 31.";
  }

  if (!isValidDay(values.allowancePayday)) {
    errors.allowancePayday = "El día debe estar entre 1 y 31.";
  }

  return errors;
}

export const emptyCreditCardForm: CreditCardFormValues = {
  name: "",
  limit: "",
  closeDay: "",
  dueDay: "",
  state: "active"
};

export function creditCardToFormValues(card: CreditCard): CreditCardFormValues {
  return {
    name: card.name,
    limit: typeof card.limit === "number" ? String(card.limit) : "",
    closeDay: String(card.closeDay),
    dueDay: String(card.dueDay),
    state: card.state
  };
}

export function validateCreditCard(values: CreditCardFormValues) {
  const errors: FormErrors<CreditCardFormValues> = {};

  if (!values.name.trim()) errors.name = "La tarjeta necesita un nombre.";
  if (values.limit.trim() && Number(values.limit) < 0) errors.limit = "Ingresá un límite válido.";
  if (!isValidDay(values.closeDay)) errors.closeDay = "El cierre debe estar entre 1 y 31.";
  if (!isValidDay(values.dueDay)) errors.dueDay = "El vencimiento debe estar entre 1 y 31.";

  return errors;
}

export const emptyIncomeForm: IncomeFormValues = {
  type: "salary",
  name: "",
  amount: "",
  expectedDate: "",
  receivedDate: "",
  status: "expected",
  recurrence: "monthly",
  notes: ""
};

export function incomeToFormValues(income: Income): IncomeFormValues {
  return {
    type: income.type,
    name: income.name,
    amount: String(income.amount),
    expectedDate: income.expectedDate,
    receivedDate: income.receivedDate ?? "",
    status: income.status,
    recurrence: income.recurrence ?? "",
    notes: income.notes
  };
}

export function validateIncome(values: IncomeFormValues) {
  const errors: FormErrors<IncomeFormValues> = {};

  if (!values.name.trim()) errors.name = "El ingreso necesita un nombre.";
  if (!values.amount.trim() || Number(values.amount) < 0) errors.amount = "Ingresá un importe válido.";
  if (!hasValidDate(values.expectedDate)) errors.expectedDate = "Definí una fecha esperada válida.";
  if (values.status === "received" && values.receivedDate && !hasValidDate(values.receivedDate)) {
    errors.receivedDate = "La fecha de cobro no es válida.";
  }

  return errors;
}

export const emptyExpenseForm: ExpenseFormValues = {
  name: "",
  amount: "",
  dueDate: "",
  paidDate: "",
  status: "pending",
  category: "other",
  paymentMethod: "debit",
  creditCardId: "",
  installmentPlanId: "",
  notes: ""
};

export function expenseToFormValues(expense: Expense): ExpenseFormValues {
  return {
    name: expense.name,
    amount: String(expense.amount),
    dueDate: expense.dueDate,
    paidDate: expense.paidDate ?? "",
    status: expense.status,
    category: expense.category,
    paymentMethod: expense.paymentMethod,
    creditCardId: expense.creditCardId ?? "",
    installmentPlanId: expense.installmentPlanId ?? "",
    notes: expense.notes
  };
}

export function validateExpense(
  values: ExpenseFormValues,
  validCardIds: string[],
  validPlanIds: string[]
) {
  const errors: FormErrors<ExpenseFormValues> = {};

  if (!values.name.trim()) errors.name = "El gasto necesita un nombre.";
  if (!values.amount.trim() || Number(values.amount) < 0) errors.amount = "Ingresá un importe válido.";
  if (!hasValidDate(values.dueDate)) errors.dueDate = "Definí una fecha de vencimiento válida.";
  if (values.paidDate && !hasValidDate(values.paidDate)) errors.paidDate = "La fecha de pago no es válida.";
  if (values.creditCardId && !validCardIds.includes(values.creditCardId)) {
    errors.creditCardId = "Seleccioná una tarjeta válida.";
  }
  if (values.installmentPlanId && !validPlanIds.includes(values.installmentPlanId)) {
    errors.installmentPlanId = "Seleccioná un plan de cuotas válido.";
  }

  return errors;
}

export const emptyCommitmentForm: CommitmentFormValues = {
  name: "",
  amount: "",
  frequency: "monthly",
  nextDueDate: "",
  startDate: "",
  endDate: "",
  totalInstallments: "",
  currentInstallment: "",
  state: "active",
  notes: ""
};

export function commitmentToFormValues(commitment: Commitment): CommitmentFormValues {
  return {
    name: commitment.name,
    amount: String(commitment.amount),
    frequency: commitment.frequency,
    nextDueDate: commitment.nextDueDate,
    startDate: commitment.startDate,
    endDate: commitment.endDate ?? "",
    totalInstallments: commitment.totalInstallments ? String(commitment.totalInstallments) : "",
    currentInstallment: commitment.currentInstallment ? String(commitment.currentInstallment) : "",
    state: commitment.state,
    notes: commitment.notes
  };
}

export function validateCommitment(values: CommitmentFormValues) {
  const errors: FormErrors<CommitmentFormValues> = {};
  const totalInstallments = parseOptionalNumber(values.totalInstallments);
  const currentInstallment = parseOptionalNumber(values.currentInstallment);

  if (!values.name.trim()) errors.name = "El compromiso necesita un nombre.";
  if (!values.amount.trim() || Number(values.amount) < 0) errors.amount = "Ingresá un importe válido.";
  if (!hasValidDate(values.nextDueDate)) errors.nextDueDate = "Definí un próximo vencimiento válido.";
  if (!hasValidDate(values.startDate)) errors.startDate = "Definí una fecha de inicio válida.";
  if (values.endDate && !hasValidDate(values.endDate)) errors.endDate = "La fecha final no es válida.";
  if (values.totalInstallments && (!Number.isFinite(totalInstallments) || totalInstallments! < 0)) {
    errors.totalInstallments = "La cantidad total de cuotas no es válida.";
  }
  if (values.currentInstallment && (!Number.isFinite(currentInstallment) || currentInstallment! < 0)) {
    errors.currentInstallment = "La cuota actual no es válida.";
  }
  if (
    Number.isFinite(totalInstallments) &&
    Number.isFinite(currentInstallment) &&
    currentInstallment! > totalInstallments!
  ) {
    errors.currentInstallment = "La cuota actual no puede superar el total.";
  }

  return errors;
}

export const emptyInstallmentPlanForm: InstallmentPlanFormValues = {
  description: "",
  creditCardId: "",
  totalAmount: "",
  totalInstallments: "",
  installmentAmount: "",
  firstDueDate: "",
  currentInstallment: "1",
  status: "active"
};

export function installmentPlanToFormValues(plan: InstallmentPlan): InstallmentPlanFormValues {
  return {
    description: plan.description,
    creditCardId: plan.creditCardId,
    totalAmount: String(plan.totalAmount),
    totalInstallments: String(plan.totalInstallments),
    installmentAmount: String(plan.installmentAmount),
    firstDueDate: plan.firstDueDate,
    currentInstallment: String(plan.currentInstallment),
    status: plan.status
  };
}

export function validateInstallmentPlan(
  values: InstallmentPlanFormValues,
  validCardIds: string[]
) {
  const errors: FormErrors<InstallmentPlanFormValues> = {};
  const totalAmount = Number(values.totalAmount);
  const totalInstallments = Number(values.totalInstallments);
  const installmentAmount = Number(values.installmentAmount);
  const currentInstallment = Number(values.currentInstallment);

  if (!values.description.trim()) errors.description = "El plan necesita una descripción.";
  if (!validCardIds.includes(values.creditCardId)) errors.creditCardId = "Seleccioná una tarjeta válida.";
  if (!values.totalAmount.trim() || totalAmount < 0) errors.totalAmount = "Ingresá un importe total válido.";
  if (!Number.isInteger(totalInstallments) || totalInstallments <= 0) {
    errors.totalInstallments = "La cantidad total de cuotas debe ser mayor a cero.";
  }
  if (!values.installmentAmount.trim() || installmentAmount < 0) {
    errors.installmentAmount = "Ingresá un valor de cuota válido.";
  }
  if (!hasValidDate(values.firstDueDate)) errors.firstDueDate = "Definí una primera fecha válida.";
  if (!Number.isInteger(currentInstallment) || currentInstallment <= 0) {
    errors.currentInstallment = "La cuota actual debe ser mayor a cero.";
  }
  if (Number.isInteger(currentInstallment) && Number.isInteger(totalInstallments) && currentInstallment > totalInstallments) {
    errors.currentInstallment = "La cuota actual no puede superar el total.";
  }
  if (
    Number.isFinite(totalAmount) &&
    Number.isFinite(totalInstallments) &&
    Number.isFinite(installmentAmount) &&
    Math.abs(totalInstallments * installmentAmount - totalAmount) > totalInstallments
  ) {
    errors.installmentAmount = "Revisá el valor de cuota para que sea coherente con el total.";
  }

  return errors;
}

export const emptyReserveForm: ReserveFormValues = {
  name: "",
  targetAmount: "",
  savedAmount: "",
  targetDate: "",
  priority: "medium",
  status: "active",
  notes: ""
};

export function reserveToFormValues(reserve: Reserve): ReserveFormValues {
  return {
    name: reserve.name,
    targetAmount: String(reserve.targetAmount),
    savedAmount: String(reserve.savedAmount),
    targetDate: reserve.targetDate ?? "",
    priority: reserve.priority,
    status: reserve.status,
    notes: reserve.notes
  };
}

export function validateReserve(values: ReserveFormValues) {
  const errors: FormErrors<ReserveFormValues> = {};

  if (!values.name.trim()) errors.name = "La reserva necesita un nombre.";
  if (!values.targetAmount.trim() || Number(values.targetAmount) < 0) {
    errors.targetAmount = "Ingresá un objetivo válido.";
  }
  if (!values.savedAmount.trim() || Number(values.savedAmount) < 0) {
    errors.savedAmount = "El monto reservado no puede ser negativo.";
  }
  if (values.targetDate && !hasValidDate(values.targetDate)) {
    errors.targetDate = "La fecha objetivo no es válida.";
  }

  return errors;
}
