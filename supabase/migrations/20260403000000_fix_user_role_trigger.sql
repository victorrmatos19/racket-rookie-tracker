-- =============================================================================
-- Fix: Trigger de role respeitando a seleção do formulário de cadastro
--
-- Problema: handle_new_user_role() sempre inseria 'aluno', ignorando o campo
-- "Tipo de Usuário" selecionado no formulário de cadastro.
--
-- Solução: ler o role de raw_user_meta_data->>'role' e validar antes de inserir.
-- Se o valor não for 'professor' ou 'aluno', usa 'aluno' como fallback.
-- Administradores só podem ser criados manualmente por outros admins.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role text;
BEGIN
  -- Lê o role enviado no options.data durante o signUp
  requested_role := NEW.raw_user_meta_data->>'role';

  -- Valida: só aceita 'professor' ou 'aluno' via auto-cadastro
  -- 'administrador' nunca pode ser definido pelo próprio usuário
  IF requested_role NOT IN ('professor', 'aluno') THEN
    requested_role := 'aluno';
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, requested_role::app_role);

  RETURN NEW;
END;
$$;
