-- Create event_tickets table
CREATE TABLE IF NOT EXISTS public.event_tickets (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  attendee_name character varying NOT NULL,
  attendee_email character varying NOT NULL,
  attendee_phone character varying,
  attendee_address text,
  amount_paid numeric NOT NULL,
  platform_fee numeric NOT NULL, -- 3% of total
  payout_amount numeric NOT NULL, -- 97% of total
  status character varying DEFAULT 'paid'::character varying,
  barcode character varying NOT NULL UNIQUE,
  payment_reference character varying,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT event_tickets_pkey PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.event_tickets ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own tickets
CREATE POLICY "Users can view their own tickets" ON public.event_tickets
  FOR SELECT USING (auth.uid() = user_id OR attendee_email = (SELECT email FROM public.users WHERE id = auth.uid()));

-- Policy: Event creators can view tickets for their events
CREATE POLICY "Event creators can view tickets for their events" ON public.event_tickets
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = event_tickets.event_id
      AND events.created_by = auth.uid()
    )
  );

-- Trigger function for notification
CREATE OR REPLACE FUNCTION public.notify_event_ticket_purchase()
RETURNS TRIGGER AS $$
DECLARE
  event_creator_id uuid;
  event_title text;
BEGIN
  -- Get the event creator ID and title
  SELECT created_by, title INTO event_creator_id, event_title
  FROM public.events
  WHERE id = NEW.event_id;

  -- Insert notification for the event creator
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    actor_id,
    reference_id,
    reference_type,
    action_url
  ) VALUES (
    event_creator_id,
    'event_ticket_purchase',
    'New Ticket Purchased',
    NEW.attendee_name || ' just bought a ticket for your event: ' || event_title,
    NEW.user_id,
    NEW.id,
    'event_ticket',
    '/dashboard/events/manage'
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_event_ticket_purchase ON public.event_tickets;
CREATE TRIGGER on_event_ticket_purchase
  AFTER INSERT ON public.event_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_event_ticket_purchase();
