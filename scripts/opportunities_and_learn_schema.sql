-- ============================================================
-- OPPORTUNITIES SYSTEM
-- ============================================================

-- OPPORTUNITIES TABLE
CREATE TABLE IF NOT EXISTS public.opportunities (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  title character varying(255) NOT NULL,
  description text NOT NULL,
  content text,
  image_url text,
  link_url text,
  category character varying(50) NOT NULL,
  location character varying(100),
  status character varying(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  approved_by uuid,
  approved_at timestamp with time zone,
  rejection_reason text,
  views_count integer DEFAULT 0,
  bookmarks_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT opportunities_pkey PRIMARY KEY (id),
  CONSTRAINT opportunities_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT opportunities_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.admins(id) ON DELETE SET NULL,
  CONSTRAINT opportunities_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
) tablespace pg_default;

CREATE INDEX IF NOT EXISTS idx_opportunities_user_id ON public.opportunities (user_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON public.opportunities (status);
CREATE INDEX IF NOT EXISTS idx_opportunities_category ON public.opportunities (category);
CREATE INDEX IF NOT EXISTS idx_opportunities_created_at ON public.opportunities (created_at DESC);

-- OPPORTUNITY BOOKMARKS
CREATE TABLE IF NOT EXISTS public.opportunity_bookmarks (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  opportunity_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT opportunity_bookmarks_pkey PRIMARY KEY (id),
  CONSTRAINT opportunity_bookmarks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT opportunity_bookmarks_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id) ON DELETE CASCADE,
  CONSTRAINT opportunity_bookmarks_unique UNIQUE(user_id, opportunity_id)
) tablespace pg_default;

-- OPPORTUNITY VIEWS
CREATE TABLE IF NOT EXISTS public.opportunity_views (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid, -- Nullable for public views
  opportunity_id uuid NOT NULL,
  viewer_ip character varying(45),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT opportunity_views_pkey PRIMARY KEY (id),
  CONSTRAINT opportunity_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL,
  CONSTRAINT opportunity_views_opportunity_id_fkey FOREIGN KEY (opportunity_id) REFERENCES public.opportunities(id) ON DELETE CASCADE
) tablespace pg_default;

-- ============================================================
-- LEARN & GROW SYSTEM
-- ============================================================

-- LEARN RESOURCES TABLE
CREATE TABLE IF NOT EXISTS public.learn_resources (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  title character varying(255) NOT NULL,
  description text NOT NULL,
  content text,
  image_url text,
  link_url text,
  category character varying(50) NOT NULL,
  status character varying(20) NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  approved_by uuid,
  approved_at timestamp with time zone,
  rejection_reason text,
  views_count integer DEFAULT 0,
  saves_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT learn_resources_pkey PRIMARY KEY (id),
  CONSTRAINT learn_resources_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT learn_resources_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.admins(id) ON DELETE SET NULL,
  CONSTRAINT learn_resources_status_check CHECK (status IN ('pending', 'approved', 'rejected'))
) tablespace pg_default;

CREATE INDEX IF NOT EXISTS idx_learn_resources_user_id ON public.learn_resources (user_id);
CREATE INDEX IF NOT EXISTS idx_learn_resources_status ON public.learn_resources (status);
CREATE INDEX IF NOT EXISTS idx_learn_resources_category ON public.learn_resources (category);
CREATE INDEX IF NOT EXISTS idx_learn_resources_created_at ON public.learn_resources (created_at DESC);

-- LEARN RESOURCE SAVES
CREATE TABLE IF NOT EXISTS public.learn_resource_saves (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  resource_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT learn_resource_saves_pkey PRIMARY KEY (id),
  CONSTRAINT learn_resource_saves_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE,
  CONSTRAINT learn_resource_saves_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.learn_resources(id) ON DELETE CASCADE,
  CONSTRAINT learn_resource_saves_unique UNIQUE(user_id, resource_id)
) tablespace pg_default;

-- LEARN RESOURCE VIEWS
CREATE TABLE IF NOT EXISTS public.learn_resource_views (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid,
  resource_id uuid NOT NULL,
  viewer_ip character varying(45),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT learn_resource_views_pkey PRIMARY KEY (id),
  CONSTRAINT learn_resource_views_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL,
  CONSTRAINT learn_resource_views_resource_id_fkey FOREIGN KEY (resource_id) REFERENCES public.learn_resources(id) ON DELETE CASCADE
) tablespace pg_default;


-- ============================================================
-- TRIGGERS & FUNCTIONS
-- ============================================================

-- 1. NOTIFICATIONS FOR OPPORTUNITIES
CREATE OR REPLACE FUNCTION public.on_opportunity_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify all admins
  INSERT INTO public.admin_notifications (admin_id, type, title, message, related_type, related_id)
  SELECT id, 'new_opportunity', 'New Opportunity Pending', 'A new opportunity "' || NEW.title || '" has been created and needs approval.', 'opportunity', NEW.id
  FROM public.admins WHERE is_active = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_opportunity_created
AFTER INSERT ON public.opportunities
FOR EACH ROW EXECUTE FUNCTION public.on_opportunity_created();

CREATE OR REPLACE FUNCTION public.on_opportunity_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.status = 'pending' AND NEW.status = 'approved') THEN
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (NEW.user_id, 'opportunity_approved', 'Opportunity Approved', 'Your opportunity "' || NEW.title || '" has been approved and is now live.', NEW.id, 'opportunity');
  ELSIF (OLD.status = 'pending' AND NEW.status = 'rejected') THEN
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (NEW.user_id, 'opportunity_rejected', 'Opportunity Rejected', 'Your opportunity "' || NEW.title || '" was not approved. Reason: ' || COALESCE(NEW.rejection_reason, 'No reason provided'), NEW.id, 'opportunity');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_opportunity_status_change
AFTER UPDATE OF status ON public.opportunities
FOR EACH ROW EXECUTE FUNCTION public.on_opportunity_status_change();

CREATE OR REPLACE FUNCTION public.on_opportunity_bookmark()
RETURNS TRIGGER AS $$
DECLARE
  creator_id uuid;
  opp_title text;
BEGIN
  SELECT user_id, title INTO creator_id, opp_title FROM public.opportunities WHERE id = NEW.opportunity_id;
  
  -- Update count
  UPDATE public.opportunities SET bookmarks_count = bookmarks_count + 1 WHERE id = NEW.opportunity_id;
  
  -- Notify creator
  IF creator_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, title, message, actor_id, reference_id, reference_type)
    VALUES (creator_id, 'opportunity_bookmark', 'New Bookmark', 'Someone bookmarked your opportunity: ' || opp_title, NEW.user_id, NEW.opportunity_id, 'opportunity');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_opportunity_bookmark
AFTER INSERT ON public.opportunity_bookmarks
FOR EACH ROW EXECUTE FUNCTION public.on_opportunity_bookmark();

-- Handle Bookmark removal
CREATE OR REPLACE FUNCTION public.on_opportunity_bookmark_removed()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.opportunities SET bookmarks_count = GREATEST(0, bookmarks_count - 1) WHERE id = OLD.opportunity_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_opportunity_bookmark_removed
AFTER DELETE ON public.opportunity_bookmarks
FOR EACH ROW EXECUTE FUNCTION public.on_opportunity_bookmark_removed();


-- 2. NOTIFICATIONS FOR LEARN RESOURCES
CREATE OR REPLACE FUNCTION public.on_learn_resource_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_notifications (admin_id, type, title, message, related_type, related_id)
  SELECT id, 'new_learn_resource', 'New Learn Resource Pending', 'A new resource "' || NEW.title || '" has been created and needs approval.', 'learn_resource', NEW.id
  FROM public.admins WHERE is_active = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_learn_resource_created
AFTER INSERT ON public.learn_resources
FOR EACH ROW EXECUTE FUNCTION public.on_learn_resource_created();

CREATE OR REPLACE FUNCTION public.on_learn_resource_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.status = 'pending' AND NEW.status = 'approved') THEN
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (NEW.user_id, 'learn_resource_approved', 'Resource Approved', 'Your learn resource "' || NEW.title || '" has been approved.', NEW.id, 'learn_resource');
  ELSIF (OLD.status = 'pending' AND NEW.status = 'rejected') THEN
    INSERT INTO public.notifications (user_id, type, title, message, reference_id, reference_type)
    VALUES (NEW.user_id, 'learn_resource_rejected', 'Resource Rejected', 'Your learn resource "' || NEW.title || '" was not approved.', NEW.id, 'learn_resource');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_learn_resource_status_change
AFTER UPDATE OF status ON public.learn_resources
FOR EACH ROW EXECUTE FUNCTION public.on_learn_resource_status_change();

CREATE OR REPLACE FUNCTION public.on_learn_resource_save()
RETURNS TRIGGER AS $$
DECLARE
  creator_id uuid;
  res_title text;
BEGIN
  SELECT user_id, title INTO creator_id, res_title FROM public.learn_resources WHERE id = NEW.resource_id;
  
  UPDATE public.learn_resources SET saves_count = saves_count + 1 WHERE id = NEW.resource_id;
  
  IF creator_id != NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, title, message, actor_id, reference_id, reference_type)
    VALUES (creator_id, 'learn_resource_save', 'New Save', 'Someone saved your resource: ' || res_title, NEW.user_id, NEW.resource_id, 'learn_resource');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_learn_resource_save
AFTER INSERT ON public.learn_resource_saves
FOR EACH ROW EXECUTE FUNCTION public.on_learn_resource_save();

CREATE OR REPLACE FUNCTION public.on_learn_resource_save_removed()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.learn_resources SET saves_count = GREATEST(0, saves_count - 1) WHERE id = OLD.resource_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_learn_resource_save_removed
AFTER DELETE ON public.learn_resource_saves
FOR EACH ROW EXECUTE FUNCTION public.on_learn_resource_save_removed();
