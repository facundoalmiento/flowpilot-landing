import {
  DecisionFormValues,
  DecisionPaymentOptionFormValues,
  DecisionRulesConfig,
  DecisionRulesConfigFormValues
} from "../../types/domain";

export const emptyDecisionPaymentOption: DecisionPaymentOptionFormValues = {
  type: "one-time",
  totalAmount: "",
  upfrontAmount: "",
  installmentCount: "",
  installmentAmount: "",
  interestAmount: "",
  firstDueDate: "",
  creditCardId: "",
  reserveId: "",
  notes: ""
};

export const emptyDecisionForm: DecisionFormValues = {
  name: "",
  description: "",
  category: "other",
  projectId: "",
  totalAmount: "",
  desiredDate: "",
  urgency: "medium",
  impact: "medium",
  necessity: "important",
  status: "evaluating",
  selectedPaymentOptionId: "",
  paymentOptions: [{ ...emptyDecisionPaymentOption }]
};

export function decisionRulesToFormValues(
  rules: DecisionRulesConfig
): DecisionRulesConfigFormValues {
  return {
    minimumPostPurchaseMargin: String(rules.minimumPostPurchaseMargin),
    maxNewInstallmentIncomeRatio: String(rules.maxNewInstallmentIncomeRatio),
    maxFutureInstallmentDebt: String(rules.maxFutureInstallmentDebt),
    longFinancingMonths: String(rules.longFinancingMonths),
    safetyHealthPriorityBoost: String(rules.safetyHealthPriorityBoost)
  };
}

function toNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function isValidDate(value: string) {
  if (!value.trim()) return false;
  return !Number.isNaN(new Date(value).getTime());
}

export function validateDecision(values: DecisionFormValues) {
  const errors: Record<string, string> = {};

  if (!values.name.trim()) {
    errors.name = "Escribí un nombre claro para la decisión.";
  }

  const totalAmount = toNumber(values.totalAmount);
  if (totalAmount === null || totalAmount <= 0) {
    errors.totalAmount = "Ingresá un importe total mayor a cero.";
  }

  if (values.desiredDate.trim() && !isValidDate(values.desiredDate)) {
    errors.desiredDate = "La fecha objetivo no es válida.";
  }

  if (values.paymentOptions.length === 0) {
    errors.paymentOptions = "Agregá al menos una opción de pago.";
  }

  values.paymentOptions.forEach((option, index) => {
    const optionTotal = toNumber(option.totalAmount);
    if (optionTotal === null || optionTotal < 0) {
      errors[`paymentOptions.${index}.totalAmount`] = "El total de la opción no es válido.";
    }

    const upfrontAmount = toNumber(option.upfrontAmount);
    const installmentCount = toNumber(option.installmentCount);
    const installmentAmount = toNumber(option.installmentAmount);
    const interestAmount = toNumber(option.interestAmount);

    if (upfrontAmount !== null && upfrontAmount < 0) {
      errors[`paymentOptions.${index}.upfrontAmount`] = "El anticipo no puede ser negativo.";
    }

    if (interestAmount !== null && interestAmount < 0) {
      errors[`paymentOptions.${index}.interestAmount`] = "El interés no puede ser negativo.";
    }

    if (
      (option.type === "installments" || option.type === "mixed") &&
      (!option.creditCardId.trim() || !option.firstDueDate.trim())
    ) {
      errors[`paymentOptions.${index}.creditCardId`] =
        "Seleccioná tarjeta y primer vencimiento para esta financiación.";
    }

    if (
      (option.type === "installments" || option.type === "mixed") &&
      (!installmentCount || installmentCount <= 0)
    ) {
      errors[`paymentOptions.${index}.installmentCount`] =
        "La cantidad de cuotas debe ser mayor a cero.";
    }

    if (
      (option.type === "installments" || option.type === "mixed") &&
      (!installmentAmount || installmentAmount <= 0)
    ) {
      errors[`paymentOptions.${index}.installmentAmount`] =
        "La cuota debe ser mayor a cero.";
    }

    if (option.firstDueDate.trim() && !isValidDate(option.firstDueDate)) {
      errors[`paymentOptions.${index}.firstDueDate`] = "La fecha del primer vencimiento no es válida.";
    }

    if (option.type === "use-reserve" && !option.reserveId.trim()) {
      errors[`paymentOptions.${index}.reserveId`] = "Seleccioná la reserva a utilizar.";
    }

    if (
      option.type === "mixed" &&
      typeof upfrontAmount === "number" &&
      typeof optionTotal === "number" &&
      upfrontAmount > optionTotal
    ) {
      errors[`paymentOptions.${index}.upfrontAmount`] =
        "El anticipo no puede superar el total.";
    }

    if (
      option.type === "mixed" &&
      typeof upfrontAmount === "number" &&
      typeof installmentCount === "number" &&
      typeof installmentAmount === "number" &&
      typeof optionTotal === "number"
    ) {
      const financed = installmentCount * installmentAmount;
      if (Math.abs(upfrontAmount + financed - optionTotal) > 1) {
        errors[`paymentOptions.${index}.installmentAmount`] =
          "Anticipo y financiación no coinciden con el total informado.";
      }
    }
  });

  return errors;
}
