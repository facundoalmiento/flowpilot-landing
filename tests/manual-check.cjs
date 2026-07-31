const assert = require("node:assert/strict");
const { createEmptyFinanceState } = require("./dist/data/mock/seed.js");
const { markIncomeReceived, markExpensePaid } = require("./dist/features/finance/financeLedger.js");
const { getFinanceOverview, getFinancePeriod } = require("./dist/features/finance/financeCalculations.js");

function snapshot(label, finance) {
  const overview = getFinanceOverview(finance, getFinancePeriod("30d"));
  console.log(
    `${label} -> saldo actual: ${finance.settings.currentBalance} | disponible para decidir: ${overview.availableToDecide}`
  );
  return overview;
}

// Simula exactamente lo que hace ahora el reducer "create-income" con status "received":
// 1) el ingreso entra a la lista como "expected"
// 2) se llama a markIncomeReceived, que crea el registro confirmado y ajusta currentBalance
let finance = createEmptyFinanceState();
finance = { ...finance, settings: { ...finance.settings, currentBalance: 0, minimumReserve: 0 } };

snapshot("Antes de cargar el sueldo", finance);

const income = {
  id: "income-test-salario",
  type: "salary",
  name: "Sueldo de prueba",
  amount: 800000,
  expectedDate: "2026-07-31",
  receivedDate: null,
  status: "expected",
  recurrence: "monthly",
  notes: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

finance = { ...finance, incomes: [income, ...finance.incomes] };
finance = markIncomeReceived(finance, income.id, {
  effectiveDate: "2026-07-31",
  effectiveAmount: "800000"
});

const afterIncome = snapshot("Despues de cargar el sueldo (cobrado)", finance);
assert.equal(finance.settings.currentBalance, 800000, "El saldo deberia subir 800000");
assert.equal(afterIncome.availableToDecide, 800000, "Disponible para decidir deberia reflejar el sueldo");

const expense = {
  id: "expense-test-prestamo",
  name: "Cuota prestamo (prueba)",
  amount: 165000,
  dueDate: "2026-08-01",
  paidDate: null,
  status: "pending",
  category: "loan",
  paymentMethod: "bank-transfer",
  creditCardId: null,
  installmentPlanId: null,
  decisionId: null,
  notes: "",
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

finance = { ...finance, expenses: [expense, ...finance.expenses] };
finance = markExpensePaid(finance, expense.id, {
  effectiveDate: "2026-08-01",
  effectiveAmount: "165000"
});

const afterExpense = snapshot("Despues de pagar la cuota del prestamo", finance);
assert.equal(finance.settings.currentBalance, 800000 - 165000, "El saldo deberia bajar 165000");
assert.equal(
  afterExpense.availableToDecide,
  800000 - 165000,
  "Disponible para decidir deberia descontar el pago"
);

console.log("\nTODO OK: cargar el sueldo como cobrado y la cuota como pagada actualiza el saldo real y 'disponible para decidir'.");
