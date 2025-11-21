-- Adicionar coluna class_start_date na tabela students
ALTER TABLE public.students 
ADD COLUMN class_start_date date DEFAULT CURRENT_DATE NOT NULL;

COMMENT ON COLUMN public.students.class_start_date IS 'Data de início das aulas do aluno';