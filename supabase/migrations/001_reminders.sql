-- ===================================================
-- MIGRATION 001 : REMINDERS (step 2, additive)
-- The old table "annonces" is NOT touched here.
-- It is dropped later, in migration 004.
-- ===================================================

-- 1. TYPES
DO $$ BEGIN
    CREATE TYPE reminder_type AS ENUM ('WORK', 'ADD', 'RETRAIT', 'OTHER');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE TYPE reminder_status AS ENUM ('PENDING', 'DONE');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. TABLE REMINDERS
CREATE TABLE IF NOT EXISTS public.reminders (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    type           reminder_type NOT NULL,
    statut         reminder_status NOT NULL DEFAULT 'PENDING',

    titre          TEXT NULL,            -- OTHER
    description    TEXT NULL,            -- ADD (source), RETRAIT (reason), OTHER
    lieu           TEXT NULL,            -- WORK
    client         TEXT NULL,            -- WORK
    heure_travail  TIME NULL,            -- WORK (optional)
    date_prevue    DATE NULL,            -- WORK (date of work), ADD (expected date)
    somme          NUMERIC(15, 2) NULL,  -- ADD, RETRAIT (expected amount)
    devise         currency_code NULL,   -- ADD, RETRAIT
    date_limite    DATE NULL,            -- RETRAIT

    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at   TIMESTAMPTZ NULL,
    transaction_id UUID NULL REFERENCES public.transactions(id) ON DELETE SET NULL,

    CONSTRAINT reminders_somme_positive CHECK (somme IS NULL OR somme > 0),

    -- Which fields are required / forbidden for each type
    CONSTRAINT reminders_fields_by_type CHECK (
        CASE type
            WHEN 'WORK' THEN
                lieu IS NOT NULL AND btrim(lieu) <> ''
                AND client IS NOT NULL AND btrim(client) <> ''
                AND date_prevue IS NOT NULL
                AND titre IS NULL AND description IS NULL
                AND somme IS NULL AND devise IS NULL AND date_limite IS NULL
            WHEN 'ADD' THEN
                somme IS NOT NULL AND devise IS NOT NULL
                AND description IS NOT NULL AND btrim(description) <> ''
                AND date_prevue IS NOT NULL
                AND titre IS NULL AND lieu IS NULL AND client IS NULL
                AND heure_travail IS NULL AND date_limite IS NULL
            WHEN 'RETRAIT' THEN
                somme IS NOT NULL AND devise IS NOT NULL
                AND description IS NOT NULL AND btrim(description) <> ''
                AND date_limite IS NOT NULL
                AND titre IS NULL AND lieu IS NULL AND client IS NULL
                AND heure_travail IS NULL AND date_prevue IS NULL
            WHEN 'OTHER' THEN
                titre IS NOT NULL AND btrim(titre) <> ''
                AND description IS NOT NULL AND btrim(description) <> ''
                AND lieu IS NULL AND client IS NULL AND heure_travail IS NULL
                AND date_prevue IS NULL AND somme IS NULL AND devise IS NULL
                AND date_limite IS NULL
            ELSE FALSE
        END
    ),

    -- PENDING = nothing completed yet, DONE = completed with a date
    CONSTRAINT reminders_state_consistent CHECK (
        (statut = 'PENDING' AND completed_at IS NULL AND transaction_id IS NULL)
        OR (statut = 'DONE' AND completed_at IS NOT NULL)
    ),

    -- OTHER never creates a transaction
    CONSTRAINT reminders_other_no_transaction CHECK (type <> 'OTHER' OR transaction_id IS NULL)
);

-- One transaction belongs to at most one reminder
CREATE UNIQUE INDEX IF NOT EXISTS reminders_transaction_id_key
    ON public.reminders (transaction_id) WHERE transaction_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS reminders_user_created_idx
    ON public.reminders (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS reminders_user_date_prevue_idx
    ON public.reminders (user_id, date_prevue) WHERE type IN ('WORK', 'ADD');

-- 3. TRIGGERS
-- created_at is always the database clock, never a value sent by the browser
CREATE OR REPLACE FUNCTION public.reminders_set_created_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reminders_force_created_at ON public.reminders;
CREATE TRIGGER reminders_force_created_at
    BEFORE INSERT ON public.reminders
    FOR EACH ROW EXECUTE FUNCTION public.reminders_set_created_at();

-- A DONE reminder is read-only
CREATE OR REPLACE FUNCTION public.reminders_protect_done()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.statut = 'DONE' THEN
        RAISE EXCEPTION 'A completed reminder cannot be modified.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reminders_block_done_update ON public.reminders;
CREATE TRIGGER reminders_block_done_update
    BEFORE UPDATE ON public.reminders
    FOR EACH ROW EXECUTE FUNCTION public.reminders_protect_done();

-- 4. SECURITY (RLS)
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own reminders" ON public.reminders;
CREATE POLICY "Users can view own reminders" ON public.reminders
    FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- A new reminder always starts PENDING and empty of completion data
DROP POLICY IF EXISTS "Users can insert own pending reminders" ON public.reminders;
CREATE POLICY "Users can insert own pending reminders" ON public.reminders
    FOR INSERT WITH CHECK (
        (SELECT auth.uid()) = user_id
        AND statut = 'PENDING'
        AND completed_at IS NULL
        AND transaction_id IS NULL
    );

-- Cancel = delete, only while PENDING
DROP POLICY IF EXISTS "Users can delete own pending reminders" ON public.reminders;
CREATE POLICY "Users can delete own pending reminders" ON public.reminders
    FOR DELETE USING ((SELECT auth.uid()) = user_id AND statut = 'PENDING');

-- No UPDATE policy on purpose: reminders change only through the functions below
REVOKE ALL ON public.reminders FROM anon;
REVOKE UPDATE ON public.reminders FROM authenticated;

-- 5. INTERNAL HELPERS (not callable from the app)
CREATE OR REPLACE FUNCTION public._balance_of(p_user_id UUID, p_devise currency_code)
RETURNS NUMERIC
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT COALESCE(SUM(CASE type WHEN 'AJOUT' THEN somme ELSE -somme END), 0)
    FROM public.transactions
    WHERE user_id = p_user_id AND devise = p_devise;
$$;

-- The one and only withdrawal routine: lock, check balance, insert RETRAIT
CREATE OR REPLACE FUNCTION public._withdraw(
    p_user_id UUID, p_somme NUMERIC, p_devise currency_code, p_motif TEXT
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_somme NUMERIC := ROUND(p_somme, 2);
    v_id UUID;
BEGIN
    IF v_somme IS NULL OR v_somme <= 0 THEN
        RAISE EXCEPTION 'The amount must be greater than zero.';
    END IF;

    -- Two withdrawals of the same user wait for each other
    PERFORM pg_advisory_xact_lock(hashtextextended(p_user_id::TEXT, 0));

    IF public._balance_of(p_user_id, p_devise) < v_somme THEN
        RAISE EXCEPTION 'Insufficient balance: the amount is not available in the % cash register.', p_devise;
    END IF;

    INSERT INTO public.transactions (user_id, type, somme, devise, motif)
    VALUES (p_user_id, 'RETRAIT', v_somme, p_devise, p_motif)
    RETURNING id INTO v_id;

    RETURN v_id;
END;
$$;

-- Load a reminder of this user, lock it, and check type + PENDING
CREATE OR REPLACE FUNCTION public._get_pending_reminder(
    p_user_id UUID, p_reminder_id UUID, p_type reminder_type
)
RETURNS public.reminders
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_reminder public.reminders;
BEGIN
    SELECT * INTO v_reminder
    FROM public.reminders
    WHERE id = p_reminder_id AND user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reminder not found.';
    END IF;
    IF v_reminder.type <> p_type THEN
        RAISE EXCEPTION 'This action does not match the reminder type.';
    END IF;
    IF v_reminder.statut <> 'PENDING' THEN
        RAISE EXCEPTION 'This reminder is already completed.';
    END IF;

    RETURN v_reminder;
END;
$$;

CREATE OR REPLACE FUNCTION public._complete_reminder(p_reminder_id UUID, p_transaction_id UUID)
RETURNS VOID
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
    UPDATE public.reminders
    SET statut = 'DONE', completed_at = NOW(), transaction_id = p_transaction_id
    WHERE id = p_reminder_id;
$$;

REVOKE ALL ON FUNCTION public._balance_of(UUID, currency_code) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._withdraw(UUID, NUMERIC, currency_code, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._get_pending_reminder(UUID, UUID, reminder_type) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public._complete_reminder(UUID, UUID) FROM PUBLIC, anon, authenticated;

-- 6. FUNCTIONS CALLED BY THE APP (always use auth.uid(), never a user id sent by the browser)

-- Withdraw page: immediate withdrawal (no reminder)
CREATE OR REPLACE FUNCTION public.withdraw_funds(p_somme NUMERIC, p_devise currency_code, p_motif TEXT)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user UUID := auth.uid();
BEGIN
    IF v_user IS NULL THEN
        RAISE EXCEPTION 'Not authenticated.';
    END IF;
    IF btrim(COALESCE(p_motif, '')) = '' THEN
        RAISE EXCEPTION 'The reason is required.';
    END IF;
    RETURN public._withdraw(v_user, p_somme, p_devise, btrim(p_motif));
END;
$$;

-- WORK: "Get Paid"
CREATE OR REPLACE FUNCTION public.confirm_reminder_work(
    p_reminder_id UUID, p_somme NUMERIC, p_devise currency_code
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user UUID := auth.uid();
    v_somme NUMERIC := ROUND(p_somme, 2);
    v_reminder public.reminders;
    v_tx UUID;
BEGIN
    IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated.'; END IF;
    IF v_somme IS NULL OR v_somme <= 0 THEN
        RAISE EXCEPTION 'The amount must be greater than zero.';
    END IF;

    v_reminder := public._get_pending_reminder(v_user, p_reminder_id, 'WORK');

    INSERT INTO public.transactions (user_id, type, somme, devise, motif)
    VALUES (
        v_user, 'AJOUT', v_somme, p_devise,
        format('Work for %s, %s, %s', v_reminder.client, v_reminder.lieu,
               to_char(v_reminder.date_prevue, 'DD/MM/YYYY'))
    )
    RETURNING id INTO v_tx;

    PERFORM public._complete_reminder(v_reminder.id, v_tx);
    RETURN v_tx;
END;
$$;

-- ADD: "Add" (the real amount can differ from the expected one)
CREATE OR REPLACE FUNCTION public.confirm_reminder_add(
    p_reminder_id UUID, p_somme NUMERIC, p_devise currency_code
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user UUID := auth.uid();
    v_somme NUMERIC := ROUND(p_somme, 2);
    v_reminder public.reminders;
    v_tx UUID;
BEGIN
    IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated.'; END IF;
    IF v_somme IS NULL OR v_somme <= 0 THEN
        RAISE EXCEPTION 'The amount must be greater than zero.';
    END IF;

    v_reminder := public._get_pending_reminder(v_user, p_reminder_id, 'ADD');

    INSERT INTO public.transactions (user_id, type, somme, devise, motif)
    VALUES (
        v_user, 'AJOUT', v_somme, p_devise,
        format('%s (expected %s)', v_reminder.description,
               to_char(v_reminder.date_prevue, 'DD/MM/YYYY'))
    )
    RETURNING id INTO v_tx;

    PERFORM public._complete_reminder(v_reminder.id, v_tx);
    RETURN v_tx;
END;
$$;

-- RETRAIT: "Withdraw" (checks the balance first, nothing is created if it is too low)
CREATE OR REPLACE FUNCTION public.confirm_reminder_withdraw(p_reminder_id UUID)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user UUID := auth.uid();
    v_reminder public.reminders;
    v_tx UUID;
BEGIN
    IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated.'; END IF;

    v_reminder := public._get_pending_reminder(v_user, p_reminder_id, 'RETRAIT');

    v_tx := public._withdraw(
        v_user, v_reminder.somme, v_reminder.devise,
        format('%s (deadline %s)', v_reminder.description,
               to_char(v_reminder.date_limite, 'DD/MM/YYYY'))
    );

    PERFORM public._complete_reminder(v_reminder.id, v_tx);
    RETURN v_tx;
END;
$$;

-- OTHER: "Confirm" (no transaction)
CREATE OR REPLACE FUNCTION public.confirm_reminder_other(p_reminder_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user UUID := auth.uid();
    v_reminder public.reminders;
BEGIN
    IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated.'; END IF;

    v_reminder := public._get_pending_reminder(v_user, p_reminder_id, 'OTHER');
    PERFORM public._complete_reminder(v_reminder.id, NULL);
END;
$$;

-- Cancel: deletes the reminder, only while PENDING
CREATE OR REPLACE FUNCTION public.cancel_reminder(p_reminder_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_user UUID := auth.uid();
    v_status reminder_status;
BEGIN
    IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated.'; END IF;

    SELECT statut INTO v_status
    FROM public.reminders
    WHERE id = p_reminder_id AND user_id = v_user
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reminder not found.';
    END IF;
    IF v_status <> 'PENDING' THEN
        RAISE EXCEPTION 'A completed reminder cannot be deleted.';
    END IF;

    DELETE FROM public.reminders WHERE id = p_reminder_id;
END;
$$;

REVOKE ALL ON FUNCTION public.withdraw_funds(NUMERIC, currency_code, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.confirm_reminder_work(UUID, NUMERIC, currency_code) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.confirm_reminder_add(UUID, NUMERIC, currency_code) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.confirm_reminder_withdraw(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.confirm_reminder_other(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.cancel_reminder(UUID) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.withdraw_funds(NUMERIC, currency_code, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_reminder_work(UUID, NUMERIC, currency_code) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_reminder_add(UUID, NUMERIC, currency_code) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_reminder_withdraw(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_reminder_other(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cancel_reminder(UUID) TO authenticated;