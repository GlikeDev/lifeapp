import { create } from 'zustand';
import type { Transaction, Goal } from '../types';

interface BudgetState {
  transactions: Transaction[];
  goals: Goal[];
  monthlyBudget: number;

  setTransactions: (tx: Transaction[]) => void;
  addTransaction: (tx: Transaction) => void;
  setGoals: (goals: Goal[]) => void;
  addGoal: (goal: Goal) => void;
  updateGoal: (id: string, patch: Partial<Goal>) => void;
  setMonthlyBudget: (amount: number) => void;

  // Derived selectors
  getTotalSpent: () => number;
  getRemaining: () => number;
  getSpentByCategory: () => Record<string, number>;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  transactions: [],
  goals: [],
  monthlyBudget: 0,

  setTransactions: (transactions) => set({ transactions }),
  addTransaction: (tx) => set((s) => ({ transactions: [tx, ...s.transactions] })),
  setGoals: (goals) => set({ goals }),
  addGoal: (goal) => set((s) => ({ goals: [...s.goals, goal] })),
  updateGoal: (id, patch) =>
    set((s) => ({
      goals: s.goals.map((g) => (g.id === id ? { ...g, ...patch } : g)),
    })),
  setMonthlyBudget: (monthlyBudget) => set({ monthlyBudget }),

  getTotalSpent: () => get().transactions.reduce((sum, t) => sum + t.amount, 0),
  getRemaining: () => get().monthlyBudget - get().getTotalSpent(),
  getSpentByCategory: () => {
    const result: Record<string, number> = {};
    for (const tx of get().transactions) {
      result[tx.category] = (result[tx.category] ?? 0) + tx.amount;
    }
    return result;
  },
}));
