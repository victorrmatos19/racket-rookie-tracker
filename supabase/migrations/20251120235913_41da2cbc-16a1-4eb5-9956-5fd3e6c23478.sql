-- Adicionar política INSERT para permitir que usuários criem seu próprio perfil
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Adicionar política DELETE para permitir que usuários deletem seu próprio perfil
-- (normalmente não é necessário, mas adiciono por segurança)
CREATE POLICY "Users can delete own profile"
  ON public.profiles
  FOR DELETE
  USING (auth.uid() = id);