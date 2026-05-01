-- Fix event registration attendee count triggers to use registered_count

CREATE OR REPLACE FUNCTION public.update_event_attendees_on_register()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.events
  SET registered_count = (
    SELECT COUNT(*) FROM public.event_registrations
    WHERE event_id = NEW.event_id AND status = 'registered'
  )
  WHERE id = NEW.event_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_event_attendees_on_register ON public.event_registrations;
CREATE TRIGGER trigger_update_event_attendees_on_register
AFTER INSERT ON public.event_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_event_attendees_on_register();

CREATE OR REPLACE FUNCTION public.update_event_attendees_on_unregister()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.events
  SET registered_count = (
    SELECT COUNT(*) FROM public.event_registrations
    WHERE event_id = OLD.event_id AND status = 'registered'
  )
  WHERE id = OLD.event_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_event_attendees_on_unregister ON public.event_registrations;
CREATE TRIGGER trigger_update_event_attendees_on_unregister
AFTER DELETE ON public.event_registrations
FOR EACH ROW
EXECUTE FUNCTION public.update_event_attendees_on_unregister();
