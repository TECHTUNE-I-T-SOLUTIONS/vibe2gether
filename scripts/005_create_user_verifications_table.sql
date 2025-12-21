-- Create user_verifications table
CREATE TABLE IF NOT EXISTS public.user_verifications (
  id uuid NOT NULL DEFAULT extensions.uuid_generate_v4(),
  user_id uuid NOT NULL,
  id_type character varying(50) NOT NULL,
  id_number character varying(100),
  id_document_url character varying(500),
  selfie_url character varying(500),
  status character varying(50) NOT NULL DEFAULT 'pending', -- pending | verifying | verified | rejected
  decision_reason text NULL,
  reviewed_by uuid NULL,
  reviewed_at timestamp with time zone NULL,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  constraint user_verifications_pkey primary key (id),
  constraint user_verifications_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE
) TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_user_verifications_user_id ON public.user_verifications USING btree (user_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_user_verifications_status ON public.user_verifications USING btree (status) TABLESPACE pg_default;

-- Trigger function to update users.is_verified flag
CREATE OR REPLACE FUNCTION public.set_user_verified()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF (TG_OP = 'INSERT' OR TG_OP = 'UPDATE') THEN
    IF (NEW.status = 'verified') THEN
      UPDATE users SET is_verified = true, updated_at = now() WHERE id = NEW.user_id;
    ELSIF (OLD IS NOT NULL AND OLD.status = 'verified' AND NEW.status <> 'verified') THEN
      UPDATE users SET is_verified = false, updated_at = now() WHERE id = NEW.user_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER user_verification_status_trigger
AFTER INSERT OR UPDATE ON public.user_verifications
FOR EACH ROW
EXECUTE FUNCTION public.set_user_verified();

-- Notification trigger for verification submissions and status changes
CREATE OR REPLACE FUNCTION public.create_verification_notification()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  -- On new submission, notify the user that their verification is pending
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO notifications (
      user_id,
      type,
      title,
      message,
      actor_id,
      reference_id,
      reference_type,
      action_url,
      created_at
    ) VALUES (
      NEW.user_id,
      'verification',
      'Verification submitted',
      'Your verification request has been received and is pending review.',
      NEW.user_id,
      NEW.id,
      'verification',
      '/dashboard/verification',
      now()
    );
  ELSIF (TG_OP = 'UPDATE') THEN
    -- Only notify when status changes
    IF (NEW.status IS DISTINCT FROM OLD.status) THEN
      IF (NEW.status = 'verified') THEN
        INSERT INTO notifications (
          user_id, type, title, message, actor_id, reference_id, reference_type, action_url, created_at
        ) VALUES (
          NEW.user_id,
          'verification',
          'Profile verified',
          'Congratulations — your profile has been verified.',
          COALESCE(NEW.reviewed_by, NULL),
          NEW.id,
          'verification',
          '/profile/' || NEW.user_id,
          now()
        );
      ELSIF (NEW.status = 'rejected') THEN
        INSERT INTO notifications (
          user_id, type, title, message, actor_id, reference_id, reference_type, action_url, created_at
        ) VALUES (
          NEW.user_id,
          'verification',
          'Verification rejected',
          COALESCE(NEW.decision_reason, 'Your verification was not approved.'),
          COALESCE(NEW.reviewed_by, NULL),
          NEW.id,
          'verification',
          '/dashboard/verification',
          now()
        );
      ELSE
        -- Other status updates (e.g., verifying)
        INSERT INTO notifications (
          user_id, type, title, message, actor_id, reference_id, reference_type, action_url, created_at
        ) VALUES (
          NEW.user_id,
          'verification',
          'Verification updated',
          'Your verification status is now: ' || NEW.status,
          COALESCE(NEW.reviewed_by, NULL),
          NEW.id,
          'verification',
          '/dashboard/verification',
          now()
        );
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS verification_notification_trigger ON public.user_verifications;
CREATE TRIGGER verification_notification_trigger
AFTER INSERT OR UPDATE ON public.user_verifications
FOR EACH ROW
EXECUTE FUNCTION public.create_verification_notification();


-- Add tags column to posts
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS tags text[] NULL DEFAULT '{}'::text[];

CREATE INDEX IF NOT EXISTS idx_posts_tags ON public.posts USING gin (tags) TABLESPACE pg_default;
