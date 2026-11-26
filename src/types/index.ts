export type UserRole = 'gerant' | 'coiffeur';

export type Language = 'fr' | 'ar';

export type PeriodFilter = 'day' | 'week' | 'month' | 'year';

export type ExpenseCategory =
  | 'loyer'
  | 'electricite'
  | 'produits'
  | 'lames'
  | 'cafe'
  | 'equipement'
  | 'autre';

export type ExpenseType = 'fixe' | 'variable';

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  commission_rate: number;
  station_name: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Service {
  id: string;
  name_fr: string;
  name_ar: string;
  price: number;
  duration_min: number;
  category: string;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  barber_id: string;
  service_id: string | null;
  service_name_fr: string;
  service_name_ar: string;
  amount: number;
  commission_rate: number;
  barber_share: number;
  salon_share: number;
  payment_method: string;
  notes: string | null;
  created_at: string;
  barber?: Pick<Profile, 'id' | 'full_name' | 'station_name'>;
}

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  expense_type: ExpenseType;
  amount: number;
  expense_date: string;
  notes: string | null;
  created_at: string;
  created_by: string | null;
}

export interface SalonSettings {
  id: number;
  salon_name: string;
  currency: string;
  updated_at: string;
}
