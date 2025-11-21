-- Add unique constraint to documento
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_documento_unique UNIQUE (documento);

-- Add not null constraint to documento
ALTER TABLE public.profiles 
ALTER COLUMN documento SET NOT NULL;