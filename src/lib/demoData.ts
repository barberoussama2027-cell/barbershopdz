import type { Expense, Profile, SalonSettings, Service, Transaction } from '../types';

export const DEMO_SALON_SETTINGS: SalonSettings = {
  id: 1,
  salon_name: "L'Atelier Barber DZ",
  currency: 'DZD',
  updated_at: new Date().toISOString(),
};

export const DEMO_PROFILES: Profile[] = [
  {
    id: 'demo-gerant-1',
    full_name: 'Amine Benali',
    email: 'gerant@barbershop.dz',
    role: 'gerant',
    commission_rate: 100,
    station_name: 'Direction',
    is_active: true,
    created_at: new Date(Date.now() - 90 * 86400000).toISOString(),
  },
  {
    id: 'demo-coiffeur-1',
    full_name: 'Karim Mansouri',
    email: 'karim@barbershop.dz',
    role: 'coiffeur',
    commission_rate: 55,
    station_name: 'Poste 1',
    is_active: true,
    created_at: new Date(Date.now() - 60 * 86400000).toISOString(),
  },
  {
    id: 'demo-coiffeur-2',
    full_name: 'Yacine Boudiaf',
    email: 'yacine@barbershop.dz',
    role: 'coiffeur',
    commission_rate: 50,
    station_name: 'Poste 2',
    is_active: true,
    created_at: new Date(Date.now() - 45 * 86400000).toISOString(),
  },
  {
    id: 'demo-coiffeur-3',
    full_name: 'Sofiane Khelifi',
    email: 'sofiane@barbershop.dz',
    role: 'coiffeur',
    commission_rate: 60,
    station_name: 'Poste 3 (VIP)',
    is_active: true,
    created_at: new Date(Date.now() - 30 * 86400000).toISOString(),
  },
];

export const DEMO_SERVICES: Service[] = [
  {
    id: 'srv-1',
    name_fr: 'Coupe Standard',
    name_ar: 'حلاقة عادية',
    price: 500,
    duration_min: 25,
    category: 'coupe',
    is_active: true,
    sort_order: 1,
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv-2',
    name_fr: 'Coupe + Dégradé',
    name_ar: 'حلاقة وتدريج',
    price: 700,
    duration_min: 35,
    category: 'coupe',
    is_active: true,
    sort_order: 2,
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv-3',
    name_fr: 'Barbe & Traçage',
    name_ar: 'تحديد اللحية',
    price: 300,
    duration_min: 15,
    category: 'barbe',
    is_active: true,
    sort_order: 3,
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv-4',
    name_fr: 'Coupe + Barbe Complet',
    name_ar: 'حلاقة + لحية كاملة',
    price: 900,
    duration_min: 45,
    category: 'pack',
    is_active: true,
    sort_order: 4,
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv-5',
    name_fr: 'Soin Visage Express',
    name_ar: 'تنظيف البشرة',
    price: 1200,
    duration_min: 30,
    category: 'soin',
    is_active: true,
    sort_order: 5,
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv-6',
    name_fr: 'Kératine / Lissage',
    name_ar: 'كيراتين / تمليس',
    price: 2500,
    duration_min: 60,
    category: 'soin',
    is_active: true,
    sort_order: 6,
    created_at: new Date().toISOString(),
  },
  {
    id: 'srv-7',
    name_fr: 'Coupe Enfant',
    name_ar: 'حلاقة أطفال',
    price: 400,
    duration_min: 20,
    category: 'coupe',
    is_active: true,
    sort_order: 7,
    created_at: new Date().toISOString(),
  },
];

function makeDemoTransactions(): Transaction[] {
  const now = new Date();
  const list: Transaction[] = [];
  const barbers = DEMO_PROFILES.filter((p) => p.role === 'coiffeur');
  const hours = [10, 11, 13, 15, 16, 17, 18, 19, 20];

  // Génère des transactions réalistes sur les 30 derniers jours
  for (let dayOffset = 0; dayOffset < 28; dayOffset++) {
    const countForDay = dayOffset === 0 ? 7 : 5 + (dayOffset % 4);
    for (let i = 0; i < countForDay; i++) {
      const barber = barbers[(dayOffset + i) % barbers.length];
      const service = DEMO_SERVICES[(dayOffset * 3 + i) % DEMO_SERVICES.length];
      const d = new Date(now);
      d.setDate(now.getDate() - dayOffset);
      const hour = hours[(i + dayOffset) % hours.length];
      const clampedHour = dayOffset === 0 ? Math.min(hour, Math.max(9, now.getHours())) : hour;
      d.setHours(clampedHour, (i * 17) % 55, 0, 0);

      const barberShare = Math.round((service.price * barber.commission_rate) / 100);
      list.push({
        id: `tx-${dayOffset}-${i}`,
        barber_id: barber.id,
        service_id: service.id,
        service_name_fr: service.name_fr,
        service_name_ar: service.name_ar,
        amount: service.price,
        commission_rate: barber.commission_rate,
        barber_share: barberShare,
        salon_share: service.price - barberShare,
        payment_method: 'cash',
        notes: null,
        created_at: d.toISOString(),
      });
    }
  }
  return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
}

export const DEMO_TRANSACTIONS: Transaction[] = makeDemoTransactions();

function isoDateDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

export const DEMO_EXPENSES: Expense[] = [
  {
    id: 'exp-1',
    title: 'Loyer mensuel du local',
    category: 'loyer',
    expense_type: 'fixe',
    amount: 45000,
    expense_date: isoDateDaysAgo(5),
    notes: 'Hydra / Alger',
    created_at: new Date().toISOString(),
    created_by: 'demo-gerant-1',
  },
  {
    id: 'exp-2',
    title: 'Facture Sonelgaz (Électricité & Clim)',
    category: 'electricite',
    expense_type: 'fixe',
    amount: 8500,
    expense_date: isoDateDaysAgo(3),
    notes: null,
    created_at: new Date().toISOString(),
    created_by: 'demo-gerant-1',
  },
  {
    id: 'exp-3',
    title: 'Lot cire, gel & après-rasage',
    category: 'produits',
    expense_type: 'variable',
    amount: 6200,
    expense_date: isoDateDaysAgo(2),
    notes: null,
    created_at: new Date().toISOString(),
    created_by: 'demo-gerant-1',
  },
  {
    id: 'exp-4',
    title: 'Boîtes de lames Astra & papier cou',
    category: 'lames',
    expense_type: 'variable',
    amount: 2800,
    expense_date: isoDateDaysAgo(1),
    notes: null,
    created_at: new Date().toISOString(),
    created_by: 'demo-gerant-1',
  },
  {
    id: 'exp-5',
    title: 'Capsules café & bouteilles d’eau clients',
    category: 'cafe',
    expense_type: 'variable',
    amount: 1900,
    expense_date: isoDateDaysAgo(0),
    notes: null,
    created_at: new Date().toISOString(),
    created_by: 'demo-gerant-1',
  },
];
