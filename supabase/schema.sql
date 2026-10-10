-- ===================================================
-- SCHEMA DATABASE SUPABASE FOR FINANCE APP
-- ===================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TYPE ENUMS
CREATE TYPE transaction_type AS ENUM ('AJOUT', 'RETRAIT');
CREATE TYPE currency_code AS ENUM ('USD', 'EUR', 'GBP', 'TRY');
CREATE TYPE annonce_status AS ENUM ('EN_ATTENTE', 'REALISE', 'ANNULE');

-- 2. TABLE USERS (PROFILES)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nom TEXT NOT NULL DEFAULT '',
    prenom TEXT NOT NULL DEFAULT '',
    email TEXT UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLE TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type transaction_type NOT NULL,
    somme NUMERIC(15, 2) NOT NULL CHECK (somme > 0),
    devise currency_code NOT NULL,
    motif TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. TABLE ANNONCES
CREATE TABLE IF NOT EXISTS public.annonces (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    titre TEXT NOT NULL,
    description TEXT DEFAULT '',
    due_date DATE NULL,
    statut annonce_status NOT NULL DEFAULT 'EN_ATTENTE',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TRIGGER FOR AUTOMATIC USER PROFILE CREATION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, nom, prenom, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nom', ''),
    COALESCE(NEW.raw_user_meta_data->>'prenom', ''),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. FUNCTION TO GET USER BALANCE BY CURRENCY
CREATE OR REPLACE FUNCTION public.get_balance(p_user_id UUID, p_devise currency_code)
RETURNS NUMERIC AS $$
DECLARE
    v_total_ajout NUMERIC;
    v_total_retrait NUMERIC;
BEGIN
    SELECT COALESCE(SUM(somme), 0) INTO v_total_ajout
    FROM public.transactions
    WHERE user_id = p_user_id AND devise = p_devise AND type = 'AJOUT';

    SELECT COALESCE(SUM(somme), 0) INTO v_total_retrait
    FROM public.transactions
    WHERE user_id = p_user_id AND devise = p_devise AND type = 'RETRAIT';

    RETURN v_total_ajout - v_total_retrait;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. FUNCTION FOR CURRENCY EXCHANGE (ATOMIC TRANSACTION)
CREATE OR REPLACE FUNCTION public.perform_currency_exchange(
    p_user_id UUID,
    p_somme_source NUMERIC,
    p_devise_source currency_code,
    p_rate NUMERIC,
    p_devise_cible currency_code
)
RETURNS VOID AS $$
DECLARE
    v_current_balance NUMERIC;
    v_montant_cible NUMERIC;
BEGIN
    IF p_somme_source <= 0 THEN
        RAISE EXCEPTION 'Le montant source doit être supérieur à zéro.';
    END IF;

    IF p_rate <= 0 THEN
        RAISE EXCEPTION 'Le taux de conversion doit être supérieur à zéro.';
    END IF;

    -- Check balance
    v_current_balance := public.get_balance(p_user_id, p_devise_source);
    IF v_current_balance < p_somme_source THEN
        RAISE EXCEPTION 'Solde insuffisant en % pour effectuer cet échange.', p_devise_source;
    END IF;

    v_montant_cible := ROUND(p_somme_source * p_rate, 2);

    -- Insert Withdrawal from source
    INSERT INTO public.transactions (user_id, type, somme, devise, motif, created_at)
    VALUES (
        p_user_id,
        'RETRAIT',
        p_somme_source,
        p_devise_source,
        'Échange de la somme de ' || p_somme_source || ' ' || p_devise_source || ' vers ' || p_devise_cible,
        NOW()
    );

    -- Insert Deposit to target
    INSERT INTO public.transactions (user_id, type, somme, devise, motif, created_at)
    VALUES (
        p_user_id,
        'AJOUT',
        v_montant_cible,
        p_devise_cible,
        'Réception de ' || v_montant_cible || ' ' || p_devise_cible || ' provenant de l''échange de ' || p_devise_source,
        NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annonces ENABLE ROW LEVEL SECURITY;

-- USERS POLICIES
CREATE POLICY "Users can view own profile" ON public.users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- TRANSACTIONS POLICIES (No DELETE or UPDATE allowed per immutability rule)
CREATE POLICY "Users can view own transactions" ON public.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON public.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ANNONCES POLICIES (No DELETE allowed)
CREATE POLICY "Users can view own annonces" ON public.annonces
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own annonces" ON public.annonces
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update status of own annonces" ON public.annonces
    FOR UPDATE USING (auth.uid() = user_id);
