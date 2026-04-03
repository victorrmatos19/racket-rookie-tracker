-- =============================================================================
-- RacketPro — Security Hardening Script
-- Execute no Supabase: SQL Editor → cole tudo → Run
--
-- O que este script faz:
--   1. Habilita Row Level Security (RLS) em todas as tabelas
--   2. Cria políticas de acesso por user_id
--   3. Adiciona coluna soft-delete (deleted_at) em students e expenses
--   4. Cria tabela de auditoria com triggers
--   5. Adiciona constraints de validação nos campos críticos
-- =============================================================================


-- =============================================================================
-- 1. ROW LEVEL SECURITY
-- =============================================================================

-- ── students ──────────────────────────────────────────────────────────────────
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_select" ON public.students;
DROP POLICY IF EXISTS "students_insert" ON public.students;
DROP POLICY IF EXISTS "students_update" ON public.students;
DROP POLICY IF EXISTS "students_delete" ON public.students;

CREATE POLICY "students_select"
  ON public.students FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "students_insert"
  ON public.students FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "students_update"
  ON public.students FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "students_delete"
  ON public.students FOR DELETE
  USING (auth.uid() = user_id);


-- ── expenses ──────────────────────────────────────────────────────────────────
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "expenses_select" ON public.expenses;
DROP POLICY IF EXISTS "expenses_insert" ON public.expenses;
DROP POLICY IF EXISTS "expenses_update" ON public.expenses;
DROP POLICY IF EXISTS "expenses_delete" ON public.expenses;

CREATE POLICY "expenses_select"
  ON public.expenses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "expenses_insert"
  ON public.expenses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "expenses_update"
  ON public.expenses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "expenses_delete"
  ON public.expenses FOR DELETE
  USING (auth.uid() = user_id);


-- ── student_payments ──────────────────────────────────────────────────────────
ALTER TABLE public.student_payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select" ON public.student_payments;
DROP POLICY IF EXISTS "payments_insert" ON public.student_payments;
DROP POLICY IF EXISTS "payments_update" ON public.student_payments;
DROP POLICY IF EXISTS "payments_delete" ON public.student_payments;

CREATE POLICY "payments_select"
  ON public.student_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "payments_insert"
  ON public.student_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Só pode atualizar pagamentos que são seus
CREATE POLICY "payments_update"
  ON public.student_payments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "payments_delete"
  ON public.student_payments FOR DELETE
  USING (auth.uid() = user_id);


-- ── profiles ──────────────────────────────────────────────────────────────────
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;

-- Cada usuário vê apenas seu próprio perfil
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Administradores veem todos os perfis (para a tela Sistema)
CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'administrador'
    )
  );

-- Cada usuário atualiza apenas seu próprio perfil
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);


-- ── user_roles ────────────────────────────────────────────────────────────────
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "roles_select_own" ON public.user_roles;
DROP POLICY IF EXISTS "roles_select_admin" ON public.user_roles;
DROP POLICY IF EXISTS "roles_manage_admin" ON public.user_roles;

-- Cada usuário vê seu próprio role
CREATE POLICY "roles_select_own"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Administradores veem todos os roles
CREATE POLICY "roles_select_admin"
  ON public.user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'administrador'
    )
  );

-- Apenas administradores podem criar/alterar roles
CREATE POLICY "roles_manage_admin"
  ON public.user_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'administrador'
    )
  );


-- =============================================================================
-- 2. SOFT DELETE — Adiciona deleted_at sem quebrar queries existentes
-- =============================================================================

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- Atualiza as políticas de SELECT para excluir registros soft-deleted
DROP POLICY IF EXISTS "students_select" ON public.students;
CREATE POLICY "students_select"
  ON public.students FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

DROP POLICY IF EXISTS "expenses_select" ON public.expenses;
CREATE POLICY "expenses_select"
  ON public.expenses FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- Índices para performance das queries com soft delete
CREATE INDEX IF NOT EXISTS idx_students_user_active
  ON public.students(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_user_active
  ON public.expenses(user_id) WHERE deleted_at IS NULL;


-- =============================================================================
-- 3. AUDITORIA — Registra todas as alterações em dados financeiros e de alunos
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.audit_log (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name  TEXT        NOT NULL,
  operation   TEXT        NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
  record_id   UUID        NOT NULL,
  old_values  JSONB,
  new_values  JSONB,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índices para consulta de auditoria
CREATE INDEX IF NOT EXISTS idx_audit_log_table ON public.audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_record ON public.audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created ON public.audit_log(created_at DESC);

-- RLS na tabela de auditoria: apenas admins podem ler; ninguém escreve diretamente
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_log_admin_select" ON public.audit_log;
CREATE POLICY "audit_log_admin_select"
  ON public.audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'administrador'
    )
  );

-- Função de trigger genérica para auditoria
CREATE OR REPLACE FUNCTION public.fn_audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.audit_log(table_name, operation, record_id, new_values, user_id)
    VALUES (TG_TABLE_NAME, TG_OP, NEW.id, to_jsonb(NEW), auth.uid());
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.audit_log(table_name, operation, record_id, old_values, new_values, user_id)
    VALUES (TG_TABLE_NAME, TG_OP, NEW.id, to_jsonb(OLD), to_jsonb(NEW), auth.uid());
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO public.audit_log(table_name, operation, record_id, old_values, user_id)
    VALUES (TG_TABLE_NAME, TG_OP, OLD.id, to_jsonb(OLD), auth.uid());
    RETURN OLD;
  END IF;
END;
$$;

-- Aplica triggers nas tabelas financeiras e de alunos
DROP TRIGGER IF EXISTS audit_students ON public.students;
CREATE TRIGGER audit_students
  AFTER INSERT OR UPDATE OR DELETE ON public.students
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS audit_expenses ON public.expenses;
CREATE TRIGGER audit_expenses
  AFTER INSERT OR UPDATE OR DELETE ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();

DROP TRIGGER IF EXISTS audit_payments ON public.student_payments;
CREATE TRIGGER audit_payments
  AFTER INSERT OR UPDATE OR DELETE ON public.student_payments
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_trigger();


-- =============================================================================
-- 4. CONSTRAINTS DE VALIDAÇÃO — Garante integridade no banco, independente do app
-- =============================================================================

-- students
ALTER TABLE public.students
  DROP CONSTRAINT IF EXISTS chk_students_name_length,
  DROP CONSTRAINT IF EXISTS chk_students_monthly_fee,
  DROP CONSTRAINT IF EXISTS chk_students_forehand,
  DROP CONSTRAINT IF EXISTS chk_students_backhand,
  DROP CONSTRAINT IF EXISTS chk_students_serve,
  DROP CONSTRAINT IF EXISTS chk_students_volley,
  DROP CONSTRAINT IF EXISTS chk_students_slice,
  DROP CONSTRAINT IF EXISTS chk_students_physical,
  DROP CONSTRAINT IF EXISTS chk_students_tactical;

ALTER TABLE public.students
  ADD CONSTRAINT chk_students_name_length
    CHECK (length(trim(name)) >= 2 AND length(trim(name)) <= 100),
  ADD CONSTRAINT chk_students_monthly_fee
    CHECK (monthly_fee >= 0 AND monthly_fee <= 99999),
  ADD CONSTRAINT chk_students_forehand
    CHECK (forehand_progress >= 0 AND forehand_progress <= 100),
  ADD CONSTRAINT chk_students_backhand
    CHECK (backhand_progress >= 0 AND backhand_progress <= 100),
  ADD CONSTRAINT chk_students_serve
    CHECK (serve_progress >= 0 AND serve_progress <= 100),
  ADD CONSTRAINT chk_students_volley
    CHECK (volley_progress >= 0 AND volley_progress <= 100),
  ADD CONSTRAINT chk_students_slice
    CHECK (slice_progress >= 0 AND slice_progress <= 100),
  ADD CONSTRAINT chk_students_physical
    CHECK (physical_progress >= 0 AND physical_progress <= 100),
  ADD CONSTRAINT chk_students_tactical
    CHECK (tactical_progress >= 0 AND tactical_progress <= 100);

-- expenses
ALTER TABLE public.expenses
  DROP CONSTRAINT IF EXISTS chk_expenses_amount,
  DROP CONSTRAINT IF EXISTS chk_expenses_description;

ALTER TABLE public.expenses
  ADD CONSTRAINT chk_expenses_amount
    CHECK (amount > 0 AND amount <= 999999),
  ADD CONSTRAINT chk_expenses_description
    CHECK (length(trim(description)) >= 2 AND length(trim(description)) <= 255);

-- student_payments
ALTER TABLE public.student_payments
  DROP CONSTRAINT IF EXISTS chk_payments_amount_expected,
  DROP CONSTRAINT IF EXISTS chk_payments_amount_paid,
  DROP CONSTRAINT IF EXISTS chk_payments_notes_length;

ALTER TABLE public.student_payments
  ADD CONSTRAINT chk_payments_amount_expected
    CHECK (amount_expected >= 0 AND amount_expected <= 99999),
  ADD CONSTRAINT chk_payments_amount_paid
    CHECK (amount_paid IS NULL OR (amount_paid >= 0 AND amount_paid <= 999999)),
  ADD CONSTRAINT chk_payments_notes_length
    CHECK (notes IS NULL OR length(notes) <= 500);


-- =============================================================================
-- 5. ÍNDICES DE PERFORMANCE
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_students_user_id
  ON public.students(user_id);

CREATE INDEX IF NOT EXISTS idx_students_status
  ON public.students(status) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_user_month
  ON public.expenses(user_id, expense_date);

CREATE INDEX IF NOT EXISTS idx_payments_user_month
  ON public.student_payments(user_id, reference_month);

CREATE INDEX IF NOT EXISTS idx_payments_student
  ON public.student_payments(student_id);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id
  ON public.user_roles(user_id);


-- =============================================================================
-- FIM DO SCRIPT
-- Após rodar, verifique em:
--   Authentication → Policies → confirme que todas as tabelas têm RLS ativo
--   Database → Tables → students/expenses → verifique coluna deleted_at
--   Database → Tables → audit_log → verifique que a tabela foi criada
-- =============================================================================
