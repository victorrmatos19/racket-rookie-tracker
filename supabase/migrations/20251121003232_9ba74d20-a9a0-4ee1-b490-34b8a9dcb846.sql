-- Add individual progress fields for tennis skills
ALTER TABLE public.students 
ADD COLUMN forehand_progress integer NOT NULL DEFAULT 0 CHECK (forehand_progress >= 0 AND forehand_progress <= 100),
ADD COLUMN backhand_progress integer NOT NULL DEFAULT 0 CHECK (backhand_progress >= 0 AND backhand_progress <= 100),
ADD COLUMN serve_progress integer NOT NULL DEFAULT 0 CHECK (serve_progress >= 0 AND serve_progress <= 100),
ADD COLUMN volley_progress integer NOT NULL DEFAULT 0 CHECK (volley_progress >= 0 AND volley_progress <= 100),
ADD COLUMN slice_progress integer NOT NULL DEFAULT 0 CHECK (slice_progress >= 0 AND slice_progress <= 100),
ADD COLUMN physical_progress integer NOT NULL DEFAULT 0 CHECK (physical_progress >= 0 AND physical_progress <= 100),
ADD COLUMN tactical_progress integer NOT NULL DEFAULT 0 CHECK (tactical_progress >= 0 AND tactical_progress <= 100);