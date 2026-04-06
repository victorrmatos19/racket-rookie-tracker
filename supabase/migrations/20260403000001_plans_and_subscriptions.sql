-- =============================================================================
-- RacketPro — Plans & Subscriptions
-- Tabelas para gerenciamento de planos e assinaturas via Stripe
-- =============================================================================

-- ── Tabela de planos ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.plans (
  id              TEXT PRIMARY KEY,              -- 'starter' | 'pro' | 'academy'
  name            TEXT        NOT NULL,
  price_brl       INTEGER     NOT NULL,          -- em centavos (ex: 4900 = R$49)
  stripe_price_id TEXT        NOT NULL,
  max_students    INTEGER,                       -- NULL = ilimitado
  features        JSONB       NOT NULL DEFAULT '[]'
);

-- Não precisa de RLS — planos são públicos (leitura)
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans_select_all"
  ON public.plans FOR SELECT
  USING (true);

-- Apenas admins gerenciam planos
CREATE POLICY "plans_manage_admin"
  ON public.plans FOR ALL
  USING (public.get_my_role() = 'administrador');


-- ── Dados iniciais dos planos ─────────────────────────────────────────────────
INSERT INTO public.plans (id, name, price_brl, stripe_price_id, max_students, features)
VALUES
  (
    'starter',
    'Starter',
    4900,
    'price_XXXX_starter',  -- substituir pelo Price ID real do Stripe Dashboard
    10,
    '["Até 10 alunos", "Controle financeiro básico", "Cronograma semanal", "Suporte por email"]'::jsonb
  ),
  (
    'pro',
    'Pro',
    9700,
    'price_XXXX_pro',      -- substituir pelo Price ID real do Stripe Dashboard
    NULL,
    '["Alunos ilimitados", "Controle financeiro completo", "Cronograma semanal", "Relatórios avançados", "Suporte prioritário"]'::jsonb
  ),
  (
    'academy',
    'Academy',
    19700,
    'price_XXXX_academy',  -- substituir pelo Price ID real do Stripe Dashboard
    NULL,
    '["Tudo do Pro", "Multi-professor", "Analytics avançado", "API de integração", "Suporte dedicado"]'::jsonb
  )
ON CONFLICT (id) DO NOTHING;


-- ── Tabela de assinaturas ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                 UUID        REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id                 TEXT        REFERENCES public.plans(id) NOT NULL,
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT        UNIQUE,
  status                  TEXT        NOT NULL DEFAULT 'trialing'
                            CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'incomplete')),
  trial_ends_at           TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at              TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE (user_id)        -- um professor tem apenas uma assinatura ativa
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id
  ON public.subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status
  ON public.subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_sub
  ON public.subscriptions(stripe_subscription_id);


-- ── RLS em subscriptions ──────────────────────────────────────────────────────
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Professor vê apenas a própria assinatura
CREATE POLICY "subscriptions_select_own"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- Administrador vê todas
CREATE POLICY "subscriptions_select_admin"
  ON public.subscriptions FOR SELECT
  USING (public.get_my_role() = 'administrador');

-- Apenas service_role (Edge Functions) pode inserir/atualizar
-- O app nunca escreve diretamente — tudo passa pelo webhook
CREATE POLICY "subscriptions_service_role"
  ON public.subscriptions FOR ALL
  USING (auth.role() = 'service_role');


-- ── Trigger: atualiza updated_at automaticamente ──────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
