-- Modify Opportunities and Learn Resources tables to allow admin posts
-- Dropping strict user foreign keys and making them nullable

-- 1. Modify Opportunities Table
ALTER TABLE public.opportunities 
DROP CONSTRAINT IF EXISTS opportunities_user_id_fkey;

ALTER TABLE public.opportunities 
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.opportunities 
ADD COLUMN IF NOT EXISTS admin_id uuid REFERENCES public.admins(id) ON DELETE SET NULL;

-- 2. Modify Learn Resources Table
ALTER TABLE public.learn_resources 
DROP CONSTRAINT IF EXISTS learn_resources_user_id_fkey;

ALTER TABLE public.learn_resources 
ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.learn_resources 
ADD COLUMN IF NOT EXISTS admin_id uuid REFERENCES public.admins(id) ON DELETE SET NULL;

-- Optional: Re-add user foreign key as nullable with CASCADE
ALTER TABLE public.opportunities 
ADD CONSTRAINT opportunities_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE public.learn_resources 
ADD CONSTRAINT learn_resources_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
