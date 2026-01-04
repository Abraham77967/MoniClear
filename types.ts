
export type ExpenseCategory = 'Food' | 'Transport' | 'Rent' | 'Entertainment' | 'Shopping' | 'Utilities' | 'Other';

export interface IncomeHistory {
  id: string;
  amount: number;
  date: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  isPaid: boolean;
  isDeposit?: boolean;
}

export interface WishlistItem {
  id: string;
  name: string;
  price: number;
  priority: 'Low' | 'Medium' | 'High';
  isPinned?: boolean;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
}

export interface AppData {
  weeklyEstimate: number;
  incomeHistory: IncomeHistory[];
  bills: Bill[];
  wishlist: WishlistItem[];
  expenses: Expense[];
}

// Firebase Auth types
declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}
