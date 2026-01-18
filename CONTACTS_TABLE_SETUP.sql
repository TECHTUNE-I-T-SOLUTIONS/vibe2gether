-- Create contacts table for public contact form submissions
CREATE TABLE public.contacts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL,
  email character varying NOT NULL,
  phone character varying,
  subject character varying NOT NULL,
  category character varying,
  message text NOT NULL,
  status character varying DEFAULT 'new'::character varying CHECK (status::text = ANY (ARRAY['new'::character varying, 'read'::character varying, 'responded'::character varying, 'closed'::character varying]::text[])),
  priority character varying DEFAULT 'normal'::character varying CHECK (priority::text = ANY (ARRAY['low'::character varying, 'normal'::character varying, 'high'::character varying, 'urgent'::character varying]::text[])),
  assigned_to uuid,
  response_notes text,
  responded_at timestamp with time zone,
  closed_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT contacts_pkey PRIMARY KEY (id),
  CONSTRAINT contacts_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.admins(id)
);

-- Create indexes for better query performance
CREATE INDEX idx_contacts_status ON public.contacts(status);
CREATE INDEX idx_contacts_email ON public.contacts(email);
CREATE INDEX idx_contacts_created_at ON public.contacts(created_at DESC);
CREATE INDEX idx_contacts_priority ON public.contacts(priority);
CREATE INDEX idx_contacts_assigned_to ON public.contacts(assigned_to);

-- Create trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_contacts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_contacts_timestamp
BEFORE UPDATE ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION update_contacts_updated_at();

-- Create trigger to insert notification into admin_notifications when new contact is submitted
CREATE OR REPLACE FUNCTION insert_contact_notification()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_notifications (
    admin_id,
    type,
    title,
    message,
    related_type,
    related_id,
    action_url,
    is_read,
    created_at
  )
  SELECT 
    id,
    'contact_submission',
    'New Contact Submission: ' || NEW.subject,
    'From ' || NEW.name || ' (' || NEW.email || '): ' || SUBSTRING(NEW.message, 1, 100) || '...',
    'contact',
    NEW.id,
    '/admin/contacts/' || NEW.id,
    false,
    now()
  FROM public.admins
  WHERE role IN ('admin', 'moderator') AND is_active = true;
  
  RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER create_contact_notification
AFTER INSERT ON public.contacts
FOR EACH ROW
EXECUTE FUNCTION insert_contact_notification();
