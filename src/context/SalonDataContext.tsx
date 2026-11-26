import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  Expense,
  ExpenseCategory,
  ExpenseType,
  Profile,
  SalonSettings,
  Service,
  Transaction,
} from '../types';
import { createEphemeralSupabaseClient, supabase } from '../lib/supabase/client';
import {
  DEMO_EXPENSES,
  DEMO_PROFILES,
  DEMO_SALON_SETTINGS,
  DEMO_SERVICES,
  DEMO_TRANSACTIONS,
} from '../lib/demoData';
import { useAuth } from './AuthContext';

interface CreateBarberInput {
  full_name: string;
  email: string;
  password: string;
  commission_rate: number;
  station_name: string;
}

interface UpdateBarberInput {
  id: string;
  full_name: string;
  commission_rate: number;
  station_name: string;
  is_active: boolean;
}

interface AddExpenseInput {
  title: string;
  category: ExpenseCategory;
  expense_type: ExpenseType;
  amount: number;
  expense_date: string;
  notes?: string;
}

interface SaveServiceInput {
  id?: string;
  name_fr: string;
  name_ar: string;
  price: number;
  duration_min: number;
  category: string;
  is_active: boolean;
}

interface SalonDataContextValue {
  salonSettings: SalonSettings;
  services: Service[];
  profiles: Profile[];
  transactions: Transaction[];
  expenses: Expense[];
  loadingData: boolean;
  reloadAll: () => Promise<void>;
  recordTransaction: (service: Service, barberId?: string) => Promise<{ error: string | null }>;
  createBarber: (input: CreateBarberInput) => Promise<{ error: string | null }>;
  updateBarber: (input: UpdateBarberInput) => Promise<{ error: string | null }>;
  deleteBarber: (id: string) => Promise<{ error: string | null }>;
  addExpense: (input: AddExpenseInput) => Promise<{ error: string | null }>;
  deleteExpense: (id: string) => Promise<{ error: string | null }>;
  updateSalonName: (salonName: string) => Promise<{ error: string | null }>;
  saveService: (input: SaveServiceInput) => Promise<{ error: string | null }>;
  deleteService: (id: string) => Promise<{ error: string | null }>;
}

const SalonDataContext = createContext<SalonDataContextValue | undefined>(undefined);

const LS_KEYS = {
  settings: 'barbershopdz_demo_settings',
  profiles: 'barbershopdz_demo_profiles',
  services: 'barbershopdz_demo_services',
  transactions: 'barbershopdz_demo_transactions',
  expenses: 'barbershopdz_demo_expenses',
};

function readLS<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export const SalonDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { profile, isDemoMode } = useAuth();

  const [salonSettings, setSalonSettings] = useState<SalonSettings>(DEMO_SALON_SETTINGS);
  const [services, setServices] = useState<Service[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const reloadAll = useCallback(async () => {
    if (!profile) {
      setTransactions([]);
      setExpenses([]);
      setProfiles([]);
      return;
    }

    setLoadingData(true);

    if (isDemoMode) {
      const settings = readLS(LS_KEYS.settings, DEMO_SALON_SETTINGS);
      const allProfiles = readLS(LS_KEYS.profiles, DEMO_PROFILES);
      const allServices = readLS(LS_KEYS.services, DEMO_SERVICES);
      const allTransactions = readLS(LS_KEYS.transactions, DEMO_TRANSACTIONS);
      const allExpenses = readLS(LS_KEYS.expenses, DEMO_EXPENSES);

      setSalonSettings(settings);
      setServices(allServices);

      // En mode démo, on applique exactement la même isolation stricte que la RLS Supabase
      if (profile.role === 'gerant') {
        setProfiles(allProfiles);
        setTransactions(allTransactions);
        setExpenses(allExpenses);
      } else {
        setProfiles([profile]);
        setTransactions(allTransactions.filter((t) => t.barber_id === profile.id));
        setExpenses([]);
      }
      setLoadingData(false);
      return;
    }

    if (!supabase) {
      setLoadingData(false);
      return;
    }

    try {
      const [settingsRes, servicesRes, profilesRes, txRes] = await Promise.all([
        supabase.from('salon_settings').select('*').eq('id', 1).single(),
        supabase.from('services').select('*').order('sort_order', { ascending: true }),
        supabase.from('profiles').select('*').order('created_at', { ascending: true }),
        supabase
          .from('transactions')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(2000),
      ]);

      if (settingsRes.data) setSalonSettings(settingsRes.data as SalonSettings);
      if (servicesRes.data) setServices(servicesRes.data as Service[]);
      if (profilesRes.data) setProfiles(profilesRes.data as Profile[]);
      if (txRes.data) setTransactions(txRes.data as Transaction[]);

      if (profile.role === 'gerant') {
        const expRes = await supabase
          .from('expenses')
          .select('*')
          .order('expense_date', { ascending: false });
        if (expRes.data) setExpenses(expRes.data as Expense[]);
      } else {
        setExpenses([]);
      }
    } finally {
      setLoadingData(false);
    }
  }, [isDemoMode, profile]);

  useEffect(() => {
    void reloadAll();
  }, [reloadAll]);

  const recordTransaction = useCallback(
    async (service: Service, barberId?: string): Promise<{ error: string | null }> => {
      if (!profile) return { error: 'Non connecté' };
      const targetBarberId = barberId ?? profile.id;

      if (isDemoMode) {
        const allProfiles = readLS(LS_KEYS.profiles, DEMO_PROFILES);
        const barber = allProfiles.find((p) => p.id === targetBarberId) ?? profile;
        const barberShare = Math.round((service.price * barber.commission_rate) / 100);
        const newTx: Transaction = {
          id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          barber_id: targetBarberId,
          service_id: service.id,
          service_name_fr: service.name_fr,
          service_name_ar: service.name_ar,
          amount: service.price,
          commission_rate: barber.commission_rate,
          barber_share: barberShare,
          salon_share: service.price - barberShare,
          payment_method: 'cash',
          notes: null,
          created_at: new Date().toISOString(),
        };
        const allTx = readLS(LS_KEYS.transactions, DEMO_TRANSACTIONS);
        const next = [newTx, ...allTx];
        localStorage.setItem(LS_KEYS.transactions, JSON.stringify(next));
        setTransactions(
          profile.role === 'gerant' ? next : next.filter((t) => t.barber_id === profile.id)
        );
        return { error: null };
      }

      if (!supabase) return { error: 'Supabase non configuré' };
      // Le trigger SQL compute_transaction_shares calcule automatiquement commission_rate, barber_share et salon_share
      const { error } = await supabase.from('transactions').insert({
        barber_id: targetBarberId,
        service_id: service.id,
        service_name_fr: service.name_fr,
        service_name_ar: service.name_ar,
        amount: service.price,
        commission_rate: profile.commission_rate,
        barber_share: 0,
        salon_share: 0,
        payment_method: 'cash',
      });

      if (error) return { error: error.message };
      await reloadAll();
      return { error: null };
    },
    [isDemoMode, profile, reloadAll]
  );

  const createBarber = useCallback(
    async (input: CreateBarberInput): Promise<{ error: string | null }> => {
      if (isDemoMode) {
        const allProfiles = readLS(LS_KEYS.profiles, DEMO_PROFILES);
        if (allProfiles.some((p) => p.email.toLowerCase() === input.email.trim().toLowerCase())) {
          return { error: 'Cet email existe déjà' };
        }
        const newBarber: Profile = {
          id: `demo-coiffeur-${Date.now()}`,
          full_name: input.full_name.trim(),
          email: input.email.trim().toLowerCase(),
          role: 'coiffeur',
          commission_rate: input.commission_rate,
          station_name: input.station_name.trim() || null,
          is_active: true,
          created_at: new Date().toISOString(),
        };
        const next = [...allProfiles, newBarber];
        localStorage.setItem(LS_KEYS.profiles, JSON.stringify(next));
        setProfiles(next);
        return { error: null };
      }

      const ephemeral = createEphemeralSupabaseClient();
      if (!ephemeral) return { error: 'Supabase non configuré' };

      const { error } = await ephemeral.auth.signUp({
        email: input.email.trim(),
        password: input.password,
        options: {
          data: {
            full_name: input.full_name.trim(),
            role: 'coiffeur',
            commission_rate: input.commission_rate,
            station_name: input.station_name.trim(),
          },
        },
      });
      if (error) return { error: error.message };
      await reloadAll();
      return { error: null };
    },
    [isDemoMode, reloadAll]
  );

  const updateBarber = useCallback(
    async (input: UpdateBarberInput): Promise<{ error: string | null }> => {
      if (isDemoMode) {
        const allProfiles = readLS(LS_KEYS.profiles, DEMO_PROFILES);
        const next = allProfiles.map((p) =>
          p.id === input.id
            ? {
                ...p,
                full_name: input.full_name.trim(),
                commission_rate: input.commission_rate,
                station_name: input.station_name.trim() || null,
                is_active: input.is_active,
              }
            : p
        );
        localStorage.setItem(LS_KEYS.profiles, JSON.stringify(next));
        setProfiles(next);
        return { error: null };
      }

      if (!supabase) return { error: 'Supabase non configuré' };
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: input.full_name.trim(),
          commission_rate: input.commission_rate,
          station_name: input.station_name.trim() || null,
          is_active: input.is_active,
        })
        .eq('id', input.id);
      if (error) return { error: error.message };
      await reloadAll();
      return { error: null };
    },
    [isDemoMode, reloadAll]
  );

  const deleteBarber = useCallback(
    async (id: string): Promise<{ error: string | null }> => {
      if (isDemoMode) {
        const allProfiles = readLS(LS_KEYS.profiles, DEMO_PROFILES);
        const next = allProfiles.filter((p) => p.id !== id);
        localStorage.setItem(LS_KEYS.profiles, JSON.stringify(next));
        setProfiles(next);
        return { error: null };
      }

      if (!supabase) return { error: 'Supabase non configuré' };
      const { error } = await supabase.from('profiles').delete().eq('id', id);
      if (error) {
        // Si le coiffeur a déjà des transactions (contrainte FK ON DELETE RESTRICT), on désactive le compte
        const { error: softErr } = await supabase
          .from('profiles')
          .update({ is_active: false })
          .eq('id', id);
        if (softErr) return { error: softErr.message };
      }
      await reloadAll();
      return { error: null };
    },
    [isDemoMode, reloadAll]
  );

  const addExpense = useCallback(
    async (input: AddExpenseInput): Promise<{ error: string | null }> => {
      if (!profile) return { error: 'Non connecté' };

      if (isDemoMode) {
        const newExp: Expense = {
          id: `exp-${Date.now()}`,
          title: input.title.trim(),
          category: input.category,
          expense_type: input.expense_type,
          amount: input.amount,
          expense_date: input.expense_date,
          notes: input.notes?.trim() || null,
          created_by: profile.id,
          created_at: new Date().toISOString(),
        };
        const allExp = readLS(LS_KEYS.expenses, DEMO_EXPENSES);
        const next = [newExp, ...allExp];
        localStorage.setItem(LS_KEYS.expenses, JSON.stringify(next));
        setExpenses(next);
        return { error: null };
      }

      if (!supabase) return { error: 'Supabase non configuré' };
      const { error } = await supabase.from('expenses').insert({
        title: input.title.trim(),
        category: input.category,
        expense_type: input.expense_type,
        amount: input.amount,
        expense_date: input.expense_date,
        notes: input.notes?.trim() || null,
        created_by: profile.id,
      });
      if (error) return { error: error.message };
      await reloadAll();
      return { error: null };
    },
    [isDemoMode, profile, reloadAll]
  );

  const deleteExpense = useCallback(
    async (id: string): Promise<{ error: string | null }> => {
      if (isDemoMode) {
        const allExp = readLS(LS_KEYS.expenses, DEMO_EXPENSES);
        const next = allExp.filter((e) => e.id !== id);
        localStorage.setItem(LS_KEYS.expenses, JSON.stringify(next));
        setExpenses(next);
        return { error: null };
      }

      if (!supabase) return { error: 'Supabase non configuré' };
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) return { error: error.message };
      await reloadAll();
      return { error: null };
    },
    [isDemoMode, reloadAll]
  );

  const updateSalonName = useCallback(
    async (salonName: string): Promise<{ error: string | null }> => {
      if (isDemoMode) {
        const updated: SalonSettings = {
          ...salonSettings,
          salon_name: salonName.trim(),
          updated_at: new Date().toISOString(),
        };
        localStorage.setItem(LS_KEYS.settings, JSON.stringify(updated));
        setSalonSettings(updated);
        return { error: null };
      }

      if (!supabase) return { error: 'Supabase non configuré' };
      const { error } = await supabase
        .from('salon_settings')
        .update({ salon_name: salonName.trim(), updated_at: new Date().toISOString() })
        .eq('id', 1);
      if (error) return { error: error.message };
      await reloadAll();
      return { error: null };
    },
    [isDemoMode, reloadAll, salonSettings]
  );

  const saveService = useCallback(
    async (input: SaveServiceInput): Promise<{ error: string | null }> => {
      if (isDemoMode) {
        const allServices = readLS(LS_KEYS.services, DEMO_SERVICES);
        let next: Service[];
        if (input.id) {
          next = allServices.map((s) =>
            s.id === input.id
              ? {
                  ...s,
                  name_fr: input.name_fr.trim(),
                  name_ar: input.name_ar.trim(),
                  price: input.price,
                  duration_min: input.duration_min,
                  category: input.category,
                  is_active: input.is_active,
                }
              : s
          );
        } else {
          const newSrv: Service = {
            id: `srv-${Date.now()}`,
            name_fr: input.name_fr.trim(),
            name_ar: input.name_ar.trim(),
            price: input.price,
            duration_min: input.duration_min,
            category: input.category,
            is_active: input.is_active,
            sort_order: allServices.length + 1,
            created_at: new Date().toISOString(),
          };
          next = [...allServices, newSrv];
        }
        localStorage.setItem(LS_KEYS.services, JSON.stringify(next));
        setServices(next);
        return { error: null };
      }

      if (!supabase) return { error: 'Supabase non configuré' };
      if (input.id) {
        const { error } = await supabase
          .from('services')
          .update({
            name_fr: input.name_fr.trim(),
            name_ar: input.name_ar.trim(),
            price: input.price,
            duration_min: input.duration_min,
            category: input.category,
            is_active: input.is_active,
          })
          .eq('id', input.id);
        if (error) return { error: error.message };
      } else {
        const { error } = await supabase.from('services').insert({
          name_fr: input.name_fr.trim(),
          name_ar: input.name_ar.trim(),
          price: input.price,
          duration_min: input.duration_min,
          category: input.category,
          is_active: input.is_active,
          sort_order: services.length + 1,
        });
        if (error) return { error: error.message };
      }
      await reloadAll();
      return { error: null };
    },
    [isDemoMode, reloadAll, services.length]
  );

  const deleteService = useCallback(
    async (id: string): Promise<{ error: string | null }> => {
      if (isDemoMode) {
        const allServices = readLS(LS_KEYS.services, DEMO_SERVICES);
        const next = allServices.filter((s) => s.id !== id);
        localStorage.setItem(LS_KEYS.services, JSON.stringify(next));
        setServices(next);
        return { error: null };
      }

      if (!supabase) return { error: 'Supabase non configuré' };
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) return { error: error.message };
      await reloadAll();
      return { error: null };
    },
    [isDemoMode, reloadAll]
  );

  return (
    <SalonDataContext.Provider
      value={{
        salonSettings,
        services,
        profiles,
        transactions,
        expenses,
        loadingData,
        reloadAll,
        recordTransaction,
        createBarber,
        updateBarber,
        deleteBarber,
        addExpense,
        deleteExpense,
        updateSalonName,
        saveService,
        deleteService,
      }}
    >
      {children}
    </SalonDataContext.Provider>
  );
};

export const useSalonData = (): SalonDataContextValue => {
  const ctx = useContext(SalonDataContext);
  if (!ctx) throw new Error('useSalonData must be used within a SalonDataProvider');
  return ctx;
};
