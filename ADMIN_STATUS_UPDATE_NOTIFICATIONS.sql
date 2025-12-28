-- SQL Triggers for Admin Status Updates to Marketplace Products and Events
-- These triggers notify users when their pending products or events are approved or rejected

-- Trigger for marketplace product status updates
create or replace function notify_product_status_update()
returns trigger as $$
declare
  v_notification_message text;
  v_action_url text;
begin
  -- Only trigger if status has changed
  if old.status != new.status then
    -- Determine the notification message and action based on new status
    if new.status = 'active' then
      v_notification_message := 'Your product "' || new.title || '" has been approved and is now live!';
      v_action_url := '/dashboard/marketplace/manage?tab=my-products&product=' || new.id;
    elsif new.status = 'inactive' then
      v_notification_message := 'Your product "' || new.title || '" has been deactivated.';
      v_action_url := '/dashboard/marketplace/manage?tab=my-products&product=' || new.id;
    elsif new.status = 'rejected' then
      v_notification_message := 'Your product "' || new.title || '" was rejected. Please review and resubmit.';
      v_action_url := '/dashboard/marketplace/manage?tab=my-products&product=' || new.id;
    end if;

    -- Create notification for the product owner
    insert into notifications (
      user_id,
      type,
      title,
      message,
      reference_id,
      reference_type,
      action_url,
      created_at
    ) values (
      new.user_id,
      'product_status_updated',
      'Product Status Updated',
      v_notification_message,
      new.id,
      'marketplace_product',
      v_action_url,
      now()
    );
  end if;

  return new;
end;
$$ language plpgsql;

-- Create trigger for product status updates
drop trigger if exists product_status_update_trigger on marketplace_products;
create trigger product_status_update_trigger
after update on marketplace_products
for each row
execute function notify_product_status_update();

-- Trigger for event status updates
create or replace function notify_event_status_update()
returns trigger as $$
declare
  v_notification_message text;
  v_action_url text;
begin
  -- Only trigger if status has changed
  if old.status != new.status then
    -- Determine the notification message and action based on new status
    if new.status = 'upcoming' then
      v_notification_message := 'Your event "' || new.title || '" has been approved and is now live!';
      v_action_url := '/dashboard/events/manage?tab=my-events&event=' || new.id;
    elsif new.status = 'cancelled' then
      v_notification_message := 'Your event "' || new.title || '" has been cancelled.';
      v_action_url := '/dashboard/events/manage?tab=my-events&event=' || new.id;
    elsif new.status = 'rejected' then
      v_notification_message := 'Your event "' || new.title || '" was rejected. Please review and resubmit.';
      v_action_url := '/dashboard/events/manage?tab=my-events&event=' || new.id;
    end if;

    -- Create notification for the event creator
    insert into notifications (
      user_id,
      type,
      title,
      message,
      reference_id,
      reference_type,
      action_url,
      created_at
    ) values (
      new.created_by,
      'event_status_updated',
      'Event Status Updated',
      v_notification_message,
      new.id,
      'event',
      v_action_url,
      now()
    );
  end if;

  return new;
end;
$$ language plpgsql;

-- Create trigger for event status updates
drop trigger if exists event_status_update_trigger on events;
create trigger event_status_update_trigger
after update on events
for each row
execute function notify_event_status_update();
