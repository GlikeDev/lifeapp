// SaveSmart — Global TypeScript types

// ─── Auth ───────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url?: string;
  level: number;
  xp: number;
  currency: string;
  monthly_budget: number;
  is_pro: boolean;
  created_at: string;
  // Onboarding fields
  age?: number;
  gender?: 'male' | 'female' | 'other' | 'prefer_not';
  country?: string;
  main_goal?: string;
  dietary?: string;
  onboarding_done: boolean;
}

// ─── Transactions ────────────────────────────────────────────────────────────

export type TransactionCategory =
  | 'food' | 'cafe' | 'transport' | 'home' | 'health' | 'entertainment' | 'shopping'
  | 'education' | 'sport' | 'beauty' | 'travel' | 'pets'
  | 'salary' | 'freelance' | 'transfer' | 'gift' | 'cashback'
  | 'investment' | 'rental' | 'business' | 'bonus' | 'other';

export type TransactionType = 'expense' | 'income';

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  category: TransactionCategory;
  store: string;
  note?: string;
  receipt_url?: string;
  date: string;
  created_at: string;
  payment_method?: 'cash' | 'card';
}

// ─── Goals ───────────────────────────────────────────────────────────────────

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  emoji: string;
  target_amount: number;
  current_amount: number;
  monthly_contribution: number;
  created_at: string;
}

// ─── Fridge ──────────────────────────────────────────────────────────────────

export interface FridgeItem {
  id: string;
  user_id: string;
  product_id?: string;
  name: string;
  quantity: number;
  unit: string;
  expires_at: string;
  added_at: string;
}

// ─── Products ────────────────────────────────────────────────────────────────

export interface Product {
  id: string;
  barcode?: string;
  name: string;
  brand?: string;
  calories_per_100g?: number;
  protein_per_100g?: number;
  fat_per_100g?: number;
  carbs_per_100g?: number;
  image_url?: string;
}

export interface StorePrice {
  store_name: string;
  store_distance_km: number;
  price: number;
  updated_at: string;
}

// ─── Nutrition ───────────────────────────────────────────────────────────────

export type NutrientStatus = 'deficit' | 'warning' | 'normal';

export interface NutrientEntry {
  name: string;
  current: number;
  target: number;
  unit: string;
  status: NutrientStatus;
}

export interface DailyNutrition {
  date: string;
  calories: number;
  calories_target: number;
  protein_g: number;
  protein_target_g: number;
  fat_g: number;
  fat_target_g: number;
  carbs_g: number;
  carbs_target_g: number;
  nutrients: NutrientEntry[];
}

// ─── Subscriptions ───────────────────────────────────────────────────────────

export type SubscriptionCycle = 'weekly' | 'monthly' | 'yearly';
export type SubscriptionCategory = 'streaming' | 'entertainment' | 'cloud' | 'ai' | 'hosting' | 'music' | 'fitness' | 'software' | 'finance' | 'other';

export interface Subscription {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  amount: number;
  currency: string;
  cycle: SubscriptionCycle;
  next_billing: string;
  category: SubscriptionCategory;
  is_active: boolean;
  created_at: string;
}

// ─── Debts ───────────────────────────────────────────────────────────────────

export type DebtDirection = 'owe' | 'owed'; // owe = я должен, owed = мне должны

export interface Debt {
  id: string;
  user_id: string;
  person: string;
  amount: number;
  currency: string;
  note?: string;
  direction: DebtDirection;
  created_at: string;
}

// ─── Achievements ────────────────────────────────────────────────────────────

export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'legend';
export type AchievementCategory = 'budget' | 'savings' | 'food' | 'nutrition' | 'activity' | 'special';

export interface Achievement {
  id: string;
  key: string;
  title: string;
  description: string;
  tier: AchievementTier;
  category: AchievementCategory;
  xp_reward: number;
  earned_at?: string;
}

// ─── Navigation ──────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  FinanceDetail: undefined;
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  Onboarding: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Scan: { txType?: 'expense' | 'income'; mode?: 'manual' } | undefined;
  Nutrition: undefined;
  More: undefined;
};

export type MoreStackParamList = {
  MoreMenu: undefined;
  SmartShop: undefined;
  Goals: undefined;
  Profile: undefined;
  Achievements: undefined;
  Subscriptions: undefined;
  Debts: undefined;
  Fridge: undefined;
};
