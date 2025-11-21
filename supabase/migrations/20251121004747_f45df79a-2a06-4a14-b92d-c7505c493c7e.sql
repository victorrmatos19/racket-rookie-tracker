-- Fix RLS policies for profiles table to prevent anonymous access
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;

-- Recreate policies with explicit authentication requirement
CREATE POLICY "Authenticated users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Authenticated users can insert own profile" 
ON public.profiles 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Authenticated users can update own profile" 
ON public.profiles 
FOR UPDATE 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Authenticated users can delete own profile" 
ON public.profiles 
FOR DELETE 
TO authenticated
USING (auth.uid() = id);

-- Fix RLS policies for students table to prevent anonymous access
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own students" ON public.students;
DROP POLICY IF EXISTS "Users can insert own students" ON public.students;
DROP POLICY IF EXISTS "Users can update own students" ON public.students;
DROP POLICY IF EXISTS "Users can delete own students" ON public.students;

-- Recreate policies with explicit authentication requirement
CREATE POLICY "Authenticated users can view own students" 
ON public.students 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can insert own students" 
ON public.students 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Authenticated users can update own students" 
ON public.students 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can delete own students" 
ON public.students 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);