-- =============================================================================
-- RacketPro — Fix: RLS circular reference em user_roles
--
-- Problema: as políticas "roles_select_admin" e "roles_manage_admin"
-- fazem SELECT na própria tabela user_roles dentro da cláusula USING,
-- causando recursão infinita. O PostgreSQL retorna erro e o hook
-- useUserRole() recebe null → isAdmin = false para todos.
--
-- Solução: criar uma função SECURITY DEFINER que lê roles sem RLS
-- e usar essa função nas políticas que precisam checar o role do caller.
-- =============================================================================


-- 1. Função auxiliar: retorna o role do usuário atual sem passar pelo RLS
--    SECURITY DEFINER = roda com os privilégios do owner (postgres), bypass de RLS
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT role::text FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;


-- 2. Corrige as políticas de user_roles (remove a recursão)
DROP POLICY IF EXISTS "roles_select_own"    ON public.user_roles;
DROP POLICY IF EXISTS "roles_select_admin"  ON public.user_roles;
DROP POLICY IF EXISTS "roles_manage_admin"  ON public.user_roles;

-- Cada usuário lê seu próprio role (necessário para useUserRole funcionar)
CREATE POLICY "roles_select_own"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

-- Admins leem todos os roles (tela Sistema) — usa a função, sem recursão
CREATE POLICY "roles_select_admin"
  ON public.user_roles FOR SELECT
  USING (public.get_my_role() = 'administrador');

-- Apenas admins gerenciam roles de outros usuários
CREATE POLICY "roles_insert_admin"
  ON public.user_roles FOR INSERT
  WITH CHECK (public.get_my_role() = 'administrador');

CREATE POLICY "roles_update_admin"
  ON public.user_roles FOR UPDATE
  USING (public.get_my_role() = 'administrador');

CREATE POLICY "roles_delete_admin"
  ON public.user_roles FOR DELETE
  USING (public.get_my_role() = 'administrador');


-- 3. Corrige a política de profiles que também referenciava user_roles
--    (mesmo problema potencial)
DROP POLICY IF EXISTS "profiles_select_admin" ON public.profiles;

CREATE POLICY "profiles_select_admin"
  ON public.profiles FOR SELECT
  USING (public.get_my_role() = 'administrador');


-- 4. Verifica — deve retornar o seu role sem erro
-- SELECT public.get_my_role();
