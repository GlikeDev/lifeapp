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
}

// ─── Transactions ────────────────────────────────────────────────────────────

export type TransactionCategory = 'food' | 'transport' | 'home' | 'health' | 'other';

export interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  category: TransactionCategory;
  store: string;
  note?: string;
  receipt_url?: string;
  date: string;
  created_at: string;
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
};

export type AuthStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  OnboardingProfile: undefined;
  OnboardingBudget: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Scan: undefined;
  Shop: undefined;
  Nutrition: undefined;
  More: undefined;
};

export type MoreStackParamList = {
  MoreMenu: undefined;
  Goals: undefined;
  Fridge: undefined;
  Profile: undefined;
  Achievements: undefined;
};
