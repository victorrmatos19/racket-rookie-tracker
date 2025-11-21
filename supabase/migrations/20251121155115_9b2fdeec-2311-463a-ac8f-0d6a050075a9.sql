-- Habilitar extensão de criptografia
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Criar função para criptografar documentos (usando uma chave derivada do user_id)
CREATE OR REPLACE FUNCTION public.encrypt_documento(documento text, user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Usar o user_id como parte da chave de criptografia
  RETURN encode(
    pgp_sym_encrypt(
      documento,
      encode(digest(user_id::text || current_setting('app.settings.encryption_key', true), 'sha256'), 'hex')
    ),
    'base64'
  );
END;
$$;

-- Criar função para descriptografar documentos
CREATE OR REPLACE FUNCTION public.decrypt_documento(encrypted_documento text, user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Usar o mesmo user_id para descriptografar
  RETURN pgp_sym_decrypt(
    decode(encrypted_documento, 'base64'),
    encode(digest(user_id::text || current_setting('app.settings.encryption_key', true), 'sha256'), 'hex')
  );
EXCEPTION WHEN OTHERS THEN
  -- Se falhar a descriptografia, retornar vazio
  RETURN '';
END;
$$;

-- Adicionar política RLS para administradores visualizarem todos os perfis
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'administrador')
  OR auth.uid() = id
);

-- Remover a política antiga que era muito restritiva
DROP POLICY IF EXISTS "Authenticated users can view own profile" ON public.profiles;