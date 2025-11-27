-- Criar tabela de pagamentos dos alunos
CREATE TABLE public.student_payments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    reference_month text NOT NULL, -- formato 'YYYY-MM' ex: '2025-01'
    payment_status text NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'overdue'
    amount_expected numeric NOT NULL DEFAULT 0,
    amount_paid numeric DEFAULT 0,
    payment_date date,
    payment_method text, -- 'manual', 'pix', 'transferencia', 'stripe' (futuro)
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    
    UNIQUE(student_id, reference_month)
);

-- Habilitar RLS
ALTER TABLE public.student_payments ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view own student payments"
ON public.student_payments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own student payments"
ON public.student_payments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own student payments"
ON public.student_payments FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own student payments"
ON public.student_payments FOR DELETE
USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_student_payments_updated_at
    BEFORE UPDATE ON public.student_payments
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();