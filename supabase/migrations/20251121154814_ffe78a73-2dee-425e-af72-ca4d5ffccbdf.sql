-- Criar função que insere role padrão "aluno" automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'aluno');
  RETURN NEW;
END;
$$;

-- Criar trigger que executa a função quando um usuário é criado
CREATE TRIGGER on_auth_user_created_role
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

-- Corrigir o usuário órfão existente (Victor Matos)
INSERT INTO public.user_roles (user_id, role)
VALUES ('cad5b153-cbbe-49e7-b6cb-7a485f17bdc6', 'professor')
ON CONFLICT (user_id, role) DO NOTHING;