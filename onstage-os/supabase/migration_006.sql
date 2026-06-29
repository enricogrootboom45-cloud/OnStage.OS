-- ============================================================
-- OnStage OS — Migration 006 (Equipment split + ePOS)
-- Run AFTER migration_005.sql
-- ============================================================

-- 1. Split equipment into gear (hardware assets) and consumables
--    Gear: physical assets that leave and return (speakers, mics, lights)
--    Consumable: stock that gets used up (beer, spirits, ice, cups)

alter table public.equipment
  add column if not exists equipment_type  text not null default 'consumable',  -- gear | consumable
  add column if not exists serial_number   text,
  add column if not exists condition       text default 'good',  -- excellent | good | fair | poor
  add column if not exists last_maintained timestamptz,
  add column if not exists purchase_value  numeric(10,2),
  add column if not exists reorder_point   int default 5,
  add column if not exists pos_sku         text,    -- Lightspeed / ePOS SKU for auto-sync
  add column if not exists pos_product_id  text,    -- Lightspeed product ID
  add column if not exists supplier        text,
  add column if not exists cost_per_unit   numeric(10,2);

-- Gear checkout tracking (separate from equipment_logs)
create table if not exists public.gear_assignments (
  id              uuid primary key default gen_random_uuid(),
  equipment_id    uuid not null references public.equipment(id) on delete cascade,
  event_id        uuid not null references public.events(id) on delete cascade,
  assigned_by     uuid references auth.users(id),
  checked_out_at  timestamptz not null default now(),
  expected_return timestamptz,
  checked_in_at   timestamptz,
  condition_out   text default 'good',
  condition_in    text,
  notes           text,
  created_at      timestamptz not null default now()
);
alter table public.gear_assignments enable row level security;
create policy "Org members manage gear assignments" on public.gear_assignments
  for all using (
    exists (
      select 1 from public.equipment e
      join public.profiles p on p.organization_id = e.organization_id
      where e.id = gear_assignments.equipment_id and p.id = auth.uid()
    )
  );
create index if not exists idx_gear_event    on public.gear_assignments(event_id);
create index if not exists idx_gear_equip    on public.gear_assignments(equipment_id);
alter publication supabase_realtime add table public.gear_assignments;

-- 2. ePOS sync log (records every Lightspeed sale that hits our webhook)
create table if not exists public.pos_sync_log (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid references public.organizations(id),
  equipment_id    uuid references public.equipment(id),
  event_id        uuid references public.events(id),
  pos_transaction_id text,
  pos_sku         text,
  qty_sold        int not null default 1,
  sale_price      numeric(10,2),
  synced_at       timestamptz not null default now(),
  raw_payload     jsonb
);
alter table public.pos_sync_log enable row level security;
create policy "Org members read pos log" on public.pos_sync_log for select
  using (organisation_id = current_org_id());

-- 3. ePOS integration config per organisation
create table if not exists public.pos_integrations (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organizations(id) on delete cascade unique,
  provider        text not null default 'lightspeed_k',  -- lightspeed_k | square | toast | custom
  webhook_secret  text,        -- HMAC secret for verifying webhook calls
  api_key         text,        -- encrypted in application layer before storing
  location_id     text,        -- Lightspeed location ID
  is_active       boolean not null default true,
  last_sync_at    timestamptz,
  created_at      timestamptz not null default now()
);
alter table public.pos_integrations enable row level security;
create policy "Org owners manage pos integration" on public.pos_integrations for all
  using (organisation_id = current_org_id());

-- Done.
