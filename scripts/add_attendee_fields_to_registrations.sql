-- Add missing attendee fields to event_registrations table
-- This will allow manual payments to store attendee information properly

-- Add attendee_name column
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS attendee_name character varying;

-- Add attendee_email column  
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS attendee_email character varying;

-- Add barcode column
ALTER TABLE public.event_registrations 
ADD COLUMN IF NOT EXISTS barcode character varying;

-- Add unique constraint on barcode (optional, but good for data integrity)
ALTER TABLE public.event_registrations 
ADD CONSTRAINT event_registrations_barcode_key UNIQUE (barcode);

-- Create index on barcode for faster lookups
CREATE INDEX IF NOT EXISTS idx_event_registrations_barcode 
ON public.event_registrations USING btree (barcode);

-- Create index on payment_reference for faster lookups
CREATE INDEX IF NOT EXISTS idx_event_registrations_payment_reference 
ON public.event_registrations USING btree (payment_reference);