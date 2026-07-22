import { createContext } from "react";
import {
  CommitmentFormValues,
  CreditCardFormValues,
  DecisionFormValues,
  DecisionRulesConfigFormValues,
  ExpenseFormValues,
  FinanceSettingsFormValues,
  IncomeFormValues,
  InstallmentPlanFormValues,
  ManualAdjustmentFormValues,
  PlanningStore,
  Project,
  ProjectFormValues,
  ReserveFormValues,
  SettlementFormValues,
  Task,
  TaskFormValues
} from "../../types/domain";

export interface PlanningContextValue {
  store: PlanningStore;
  projects: Project[];
  tasks: Task[];
  finance: PlanningStore["finance"];
  decisions: PlanningStore["decisions"];
  createProject: (values: ProjectFormValues) => void;
  updateProject: (projectId: string, values: ProjectFormValues) => void;
  archiveProject: (projectId: string) => void;
  restoreProject: (projectId: string) => void;
  deleteProject: (projectId: string) => void;
  createTask: (values: TaskFormValues) => void;
  updateTask: (taskId: string, values: TaskFormValues) => void;
  deleteTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  reopenTask: (taskId: string) => void;
  toggleTaskNextAction: (taskId: string) => void;
  updateFinanceSettings: (values: FinanceSettingsFormValues) => void;
  createCreditCard: (values: CreditCardFormValues) => void;
  updateCreditCard: (cardId: string, values: CreditCardFormValues) => void;
  deleteCreditCard: (cardId: string) => void;
  createIncome: (values: IncomeFormValues) => void;
  updateIncome: (incomeId: string, values: IncomeFormValues) => void;
  markIncomeReceived: (incomeId: string, values: SettlementFormValues) => void;
  reopenIncome: (incomeId: string) => void;
  deleteIncome: (incomeId: string) => void;
  createExpense: (values: ExpenseFormValues) => void;
  updateExpense: (expenseId: string, values: ExpenseFormValues) => void;
  markExpensePaid: (expenseId: string, values: SettlementFormValues) => void;
  reopenExpense: (expenseId: string) => void;
  deleteExpense: (expenseId: string) => void;
  createCommitment: (values: CommitmentFormValues) => void;
  updateCommitment: (commitmentId: string, values: CommitmentFormValues) => void;
  archiveCommitment: (commitmentId: string) => void;
  restoreCommitment: (commitmentId: string) => void;
  deleteCommitment: (commitmentId: string) => void;
  ensureCommitmentOccurrencesForMonth: (periodKey: string) => void;
  payCommitmentOccurrence: (occurrenceId: string, values: SettlementFormValues) => void;
  reopenCommitmentOccurrence: (occurrenceId: string) => void;
  createInstallmentPlan: (values: InstallmentPlanFormValues) => void;
  updateInstallmentPlan: (planId: string, values: InstallmentPlanFormValues) => void;
  archiveInstallmentPlan: (planId: string) => void;
  restoreInstallmentPlan: (planId: string) => void;
  deleteInstallmentPlan: (planId: string) => void;
  payInstallmentPlan: (planId: string, values: SettlementFormValues) => void;
  revertInstallmentPlan: (planId: string) => void;
  createReserve: (values: ReserveFormValues) => void;
  updateReserve: (reserveId: string, values: ReserveFormValues) => void;
  completeReserve: (reserveId: string) => void;
  archiveReserve: (reserveId: string) => void;
  restoreReserve: (reserveId: string) => void;
  deleteReserve: (reserveId: string) => void;
  createManualAdjustment: (values: ManualAdjustmentFormValues) => void;
  reverseManualAdjustment: (adjustmentId: string) => void;
  closeMonthlyPeriod: (periodKey: string) => void;
  reopenMonthlyPeriod: (periodKey: string) => void;
  createDecision: (values: DecisionFormValues) => void;
  updateDecision: (decisionId: string, values: DecisionFormValues) => void;
  deleteDecision: (decisionId: string) => void;
  archiveDecision: (decisionId: string) => void;
  restoreDecision: (decisionId: string) => void;
  setDecisionStatus: (
    decisionId: string,
    status: PlanningStore["decisions"]["items"][number]["status"]
  ) => void;
  evaluateDecision: (decisionId: string) => void;
  evaluateAllDecisions: () => void;
  updateDecisionRulesConfig: (values: DecisionRulesConfigFormValues) => void;
  saveDecisionComparison: (decisionIds: string[]) => void;
  removeDecisionComparison: (comparisonId: string) => void;
  convertDecision: (decisionId: string) => void;
  createTaskFromDecision: (decisionId: string, title: string) => void;
  replaceStore: (nextStore: PlanningStore) => void;
  resetStore: () => void;
}

export const PlanningContext = createContext<PlanningContextValue | null>(null);
