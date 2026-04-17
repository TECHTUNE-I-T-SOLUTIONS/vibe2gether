-- Create marketplace_purchases table for tracking product purchases
create table public.marketplace_purchases (
  id uuid not null default extensions.uuid_generate_v4 (),
  product_id uuid not null,
  buyer_id uuid not null,
  seller_id uuid not null,
  quantity integer not null default 1,
  unit_price numeric(10, 2) not null,
  total_amount numeric(10, 2) not null,
  transaction_id uuid null,
  status character varying(50) null default 'pending'::character varying,
  delivery_status character varying(50) null default 'pending'::character varying,
  delivery_address text null,
  notes text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint marketplace_purchases_pkey primary key (id),
  constraint marketplace_purchases_product_id_fkey foreign KEY (product_id) references marketplace_products (id) on delete CASCADE,
  constraint marketplace_purchases_buyer_id_fkey foreign KEY (buyer_id) references users (id) on delete CASCADE,
  constraint marketplace_purchases_seller_id_fkey foreign KEY (seller_id) references users (id) on delete CASCADE,
  constraint marketplace_purchases_transaction_id_fkey foreign KEY (transaction_id) references transactions (id) on delete set null
) TABLESPACE pg_default;

-- Create indexes for better query performance
create index IF not exists idx_marketplace_purchases_product_id on public.marketplace_purchases using btree (product_id) TABLESPACE pg_default;

create index IF not exists idx_marketplace_purchases_buyer_id on public.marketplace_purchases using btree (buyer_id) TABLESPACE pg_default;

create index IF not exists idx_marketplace_purchases_seller_id on public.marketplace_purchases using btree (seller_id) TABLESPACE pg_default;

create index IF not exists idx_marketplace_purchases_transaction_id on public.marketplace_purchases using btree (transaction_id) TABLESPACE pg_default;

create index IF not exists idx_marketplace_purchases_status on public.marketplace_purchases using btree (status) TABLESPACE pg_default;

create index IF not exists idx_marketplace_purchases_delivery_status on public.marketplace_purchases using btree (delivery_status) TABLESPACE pg_default;

create index IF not exists idx_marketplace_purchases_created_at on public.marketplace_purchases using btree (created_at desc) TABLESPACE pg_default;

create index IF not exists idx_marketplace_purchases_buyer_created_at on public.marketplace_purchases using btree (buyer_id, created_at desc) TABLESPACE pg_default;

-- Function to create a notification when a purchase is made
create or replace function create_purchase_notification()
returns trigger as $$
declare
  v_admin_id uuid;
  v_cursor cursor for select id from admins where is_active = true;
begin
  -- Notify the seller about the purchase
  insert into notifications (
    user_id,
    type,
    title,
    message,
    actor_id,
    reference_id,
    reference_type,
    action_url
  ) values (
    new.seller_id,
    'purchase',
    'New Product Purchase',
    'Someone purchased your product',
    new.buyer_id,
    new.product_id,
    'marketplace_product',
    '/dashboard/marketplace?tab=sales&purchase=' || new.id
  );

  -- Notify all active admins about the new purchase
  open v_cursor;
  loop
    fetch v_cursor into v_admin_id;
    exit when not found;
    
    insert into admin_notifications (
      admin_id,
      type,
      title,
      message,
      related_type,
      related_id,
      action_url
    ) values (
      v_admin_id,
      'purchase',
      'New Marketplace Purchase',
      'A new product purchase has been completed',
      'marketplace_purchase',
      new.id,
      '/admin/dashboard/marketplace/purchases?purchase=' || new.id
    );
  end loop;
  close v_cursor;

  return new;
end;
$$ language plpgsql;

-- Trigger to create notification on purchase
create trigger trigger_purchase_notification
after insert on marketplace_purchases for each row
execute function create_purchase_notification();

-- Function to update product availability based on purchases (if stock is tracked)
create or replace function update_product_on_purchase()
returns trigger as $$
begin
  -- This can be extended if you implement stock tracking
  -- For now, products remain available unless manually marked otherwise
  return new;
end;
$$ language plpgsql;

-- Trigger to handle post-purchase logic
create trigger trigger_update_product_on_purchase
after insert on marketplace_purchases for each row
execute function update_product_on_purchase();
