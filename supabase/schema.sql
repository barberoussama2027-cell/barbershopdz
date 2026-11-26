-- ============================================================================
-- BarberShop DZ - Schéma Complet PostgreSQL & Sécurité RLS (Supabase)
-- Monnaie : Dinar Algérien (DZD)
-- Rôles : 'gerant' (accès total) | 'coiffeur' (accès strictement personnel)
-- ============================================================================

-- Extensions requises
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 1. TABLES PRINCIPALES
-- ============================================================================

-- Paramètres du salon (1 seule ligne)
CREATE TABLE IF NOT EXISTS public.salon_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  salon_name TEXT NOT NULL DEFAULT 'L''Atelier Barber DZ',
  currency TEXT NOT NULL DEFAULT 'DZD',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.salon_settings (id, salon_name, currency)
VALUES (1, 'L''Atelier Barber DZ', 'DZD')
ON CONFLICT (id) DO NOTHING;

-- Profils utilisateurs liés à auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'coiffeur' CHECK (role IN ('gerant', 'coiffeur')),
  commission_rate NUMERIC(5,2) NOT NULL DEFAULT 50.00 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  station_name TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Catalogue des prestations
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_fr TEXT NOT NULL,
  name_ar TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  duration_min INTEGER NOT NULL DEFAULT 30 CHECK (duration_min > 0),
  category TEXT NOT NULL DEFAULT 'coupe',
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Transactions / Prestations encaissées
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  service_name_fr TEXT NOT NULL,
  service_name_ar TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  commission_rate NUMERIC(5,2) NOT NULL CHECK (commission_rate >= 0 AND commission_rate <= 100),
  barber_share NUMERIC(10,2) NOT NULL CHECK (barber_share >= 0),
  salon_share NUMERIC(10,2) NOT NULL CHECK (salon_share >= 0),
  payment_method TEXT NOT NULL DEFAULT 'cash',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Dépenses du salon (charges fixes & variables)
CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('loyer', 'electricite', 'produits', 'lames', 'cafe', 'equipement', 'autre')),
  expense_type TEXT NOT NULL DEFAULT 'variable' CHECK (expense_type IN ('fixe', 'variable')),
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  notes TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour des requêtes rapides par date et par coiffeur
CREATE INDEX IF NOT EXISTS idx_transactions_barber_created ON public.transactions (barber_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON public.transactions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses (expense_date DESC);

-- ============================================================================
-- 2. FONCTIONS & TRIGGERS DE SÉCURITÉ
-- ============================================================================

-- Vérifie si l'utilisateur connecté est un Gérant actif (SECURITY DEFINER évite la récursion RLS)
CREATE OR REPLACE FUNCTION public.is_gerant()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid()
      AND role = 'gerant'
      AND is_active = true
  );
$$;

-- Trigger 1 : Création automatique du profil lors de l'inscription dans auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role TEXT;
  v_commission NUMERIC(5,2);
  v_full_name TEXT;
  v_station TEXT;
BEGIN
  v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'coiffeur');
  IF v_role NOT IN ('gerant', 'coiffeur') THEN
    v_role := 'coiffeur';
  END IF;

  v_commission := COALESCE((NEW.raw_user_meta_data->>'commission_rate')::NUMERIC, 50.00);
  IF v_commission < 0 OR v_commission > 100 THEN
    v_commission := 50.00;
  END IF;

  v_full_name := COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'full_name'), ''), split_part(NEW.email, '@', 1));
  v_station := NULLIF(TRIM(NEW.raw_user_meta_data->>'station_name'), '');

  INSERT INTO public.profiles (id, full_name, email, role, commission_rate, station_name, is_active)
  VALUES (NEW.id, v_full_name, NEW.email, v_role, v_commission, v_station, true)
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Trigger 2 : Calcul inviolable des parts côté serveur avant insertion de transaction
-- Empêche un coiffeur de falsifier son taux de commission ou sa part depuis le frontend
CREATE OR REPLACE FUNCTION public.compute_transaction_shares()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rate NUMERIC(5,2);
  v_service_price NUMERIC(10,2);
  v_service_fr TEXT;
  v_service_ar TEXT;
BEGIN
  -- Récupérer le taux de commission officiel du coiffeur
  SELECT commission_rate INTO v_rate
  FROM public.profiles
  WHERE id = NEW.barber_id AND is_active = true;

  IF v_rate IS NULL THEN
    RAISE EXCEPTION 'Coiffeur introuvable ou compte désactivé';
  END IF;

  -- Si un service_id est fourni, utiliser le tarif officiel du catalogue si non-gérant
  IF NEW.service_id IS NOT NULL THEN
    SELECT price, name_fr, name_ar
    INTO v_service_price, v_service_fr, v_service_ar
    FROM public.services
    WHERE id = NEW.service_id;

    IF v_service_price IS NOT NULL THEN
      NEW.amount := v_service_price;
      NEW.service_name_fr := v_service_fr;
      NEW.service_name_ar := v_service_ar;
    END IF;
  END IF;

  NEW.commission_rate := v_rate;
  NEW.barber_share := ROUND((NEW.amount * v_rate) / 100.0, 2);
  NEW.salon_share := NEW.amount - NEW.barber_share;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_compute_transaction_shares ON public.transactions;
CREATE TRIGGER trg_compute_transaction_shares
  BEFORE INSERT ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.compute_transaction_shares();

-- ============================================================================
-- 3. ACTIVATION & POLITIQUES RLS (ROW LEVEL SECURITY)
-- ============================================================================

ALTER TABLE public.salon_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- ---- salon_settings ----
DROP POLICY IF EXISTS "salon_settings_select_authenticated" ON public.salon_settings;
CREATE POLICY "salon_settings_select_authenticated"
  ON public.salon_settings FOR SELECT
  TO authenticated
  USING (true);

DROP POLICY IF EXISTS "salon_settings_update_gerant" ON public.salon_settings;
CREATE POLICY "salon_settings_update_gerant"
  ON public.salon_settings FOR UPDATE
  TO authenticated
  USING (public.is_gerant())
  WITH CHECK (public.is_gerant());

-- ---- profiles ----
-- Le gérant voit tous les profils ; le coiffeur ne voit QUE son propre profil
DROP POLICY IF EXISTS "profiles_select_policy" ON public.profiles;
CREATE POLICY "profiles_select_policy"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_gerant());

-- Seul le gérant peut créer/modifier/supprimer des profils
DROP POLICY IF EXISTS "profiles_insert_gerant" ON public.profiles;
CREATE POLICY "profiles_insert_gerant"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (public.is_gerant());

DROP POLICY IF EXISTS "profiles_update_gerant" ON public.profiles;
CREATE POLICY "profiles_update_gerant"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.is_gerant())
  WITH CHECK (public.is_gerant());

DROP POLICY IF EXISTS "profiles_delete_gerant" ON public.profiles;
CREATE POLICY "profiles_delete_gerant"
  ON public.profiles FOR DELETE
  TO authenticated
  USING (public.is_gerant() AND id <> auth.uid());

-- ---- services ----
-- Tous les utilisateurs authentifiés peuvent lire les prestations actives (le gérant voit tout)
DROP POLICY IF EXISTS "services_select_policy" ON public.services;
CREATE POLICY "services_select_policy"
  ON public.services FOR SELECT
  TO authenticated
  USING (is_active = true OR public.is_gerant());

DROP POLICY IF EXISTS "services_insert_gerant" ON public.services;
CREATE POLICY "services_insert_gerant"
  ON public.services FOR INSERT
  TO authenticated
  WITH CHECK (public.is_gerant());

DROP POLICY IF EXISTS "services_update_gerant" ON public.services;
CREATE POLICY "services_update_gerant"
  ON public.services FOR UPDATE
  TO authenticated
  USING (public.is_gerant())
  WITH CHECK (public.is_gerant());

DROP POLICY IF EXISTS "services_delete_gerant" ON public.services;
CREATE POLICY "services_delete_gerant"
  ON public.services FOR DELETE
  TO authenticated
  USING (public.is_gerant());

-- ---- transactions ----
-- Le gérant voit toutes les transactions ; le coiffeur ne voit QUE les siennes
DROP POLICY IF EXISTS "transactions_select_policy" ON public.transactions;
CREATE POLICY "transactions_select_policy"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (barber_id = auth.uid() OR public.is_gerant());

-- Un coiffeur ne peut insérer que pour lui-même ; le gérant peut insérer pour n'importe quel poste
DROP POLICY IF EXISTS "transactions_insert_policy" ON public.transactions;
CREATE POLICY "transactions_insert_policy"
  ON public.transactions FOR INSERT
  TO authenticated
  WITH CHECK (barber_id = auth.uid() OR public.is_gerant());

-- Seul le gérant peut modifier ou supprimer une transaction
DROP POLICY IF EXISTS "transactions_update_gerant" ON public.transactions;
CREATE POLICY "transactions_update_gerant"
  ON public.transactions FOR UPDATE
  TO authenticated
  USING (public.is_gerant())
  WITH CHECK (public.is_gerant());

DROP POLICY IF EXISTS "transactions_delete_gerant" ON public.transactions;
CREATE POLICY "transactions_delete_gerant"
  ON public.transactions FOR DELETE
  TO authenticated
  USING (public.is_gerant());

-- ---- expenses ----
-- Accès STRICTEMENT réservé au gérant (les coiffeurs n'ont aucun accès)
DROP POLICY IF EXISTS "expenses_gerant_only_select" ON public.expenses;
CREATE POLICY "expenses_gerant_only_select"
  ON public.expenses FOR SELECT
  TO authenticated
  USING (public.is_gerant());

DROP POLICY IF EXISTS "expenses_gerant_only_insert" ON public.expenses;
CREATE POLICY "expenses_gerant_only_insert"
  ON public.expenses FOR INSERT
  TO authenticated
  WITH CHECK (public.is_gerant());

DROP POLICY IF EXISTS "expenses_gerant_only_update" ON public.expenses;
CREATE POLICY "expenses_gerant_only_update"
  ON public.expenses FOR UPDATE
  TO authenticated
  USING (public.is_gerant())
  WITH CHECK (public.is_gerant());

DROP POLICY IF EXISTS "expenses_gerant_only_delete" ON public.expenses;
CREATE POLICY "expenses_gerant_only_delete"
  ON public.expenses FOR DELETE
  TO authenticated
  USING (public.is_gerant());

-- ============================================================================
-- 4. DONNÉES INITIALES (PRESTATIONS PAR DÉFAUT EN DZD)
-- ============================================================================

INSERT INTO public.services (name_fr, name_ar, price, duration_min, category, sort_order)
SELECT * FROM (
  VALUES
    ('Coupe Standard', 'حلاقة عادية', 500, 25, 'coupe', 1),
    ('Coupe + Dégradé', 'حلاقة وتدريج', 700, 35, 'coupe', 2),
    ('Barbe & Traçage', 'تحديد اللحية', 300, 15, 'barbe', 3),
    ('Coupe + Barbe Complet', 'حلاقة + لحية كاملة', 900, 45, 'pack', 4),
    ('Soin Visage Express', 'تنظيف البشرة', 1200, 30, 'soin', 5),
    ('Kératine / Lissage', 'كيراتين / تمليس', 2500, 60, 'soin', 6),
    ('Coupe Enfant', 'حلاقة أطفال', 400, 20, 'coupe', 7)
) AS v(name_fr, name_ar, price, duration_min, category, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.services LIMIT 1);

-- ============================================================================
-- 5. PERMISSIONS (GRANTS)
-- ============================================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated, service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO anon, authenticated, service_role;

