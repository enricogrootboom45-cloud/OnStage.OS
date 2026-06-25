-- ============================================================
-- OnStage OS — Migration 004 (Phase 3)
-- Run in: Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- 1. Event cost line items (for P&L per event)
create table if not exists public.event_costs (
  id               uuid primary key default gen_random_uuid(),
  event_id         uuid not null references public.events(id) on delete cascade,
  description      text not null,
  amount           numeric(10,2) not null default 0,
  category         text,        -- venue, staff, equipment, marketing, other
  created_at       timestamptz not null default now()
);

alter table public.event_costs enable row level security;

create policy "Org members can manage event costs" on public.event_costs
  using (
    exists (
      select 1 from public.events e
      join public.profiles p on p.organization_id = e.organization_id
      where e.id = event_costs.event_id and p.id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.events e
      join public.profiles p on p.organization_id = e.organization_id
      where e.id = event_costs.event_id and p.id = auth.uid()
    )
  );

create index if not exists idx_event_costs_event on public.event_costs(event_id);

-- 2. In-app notifications
create table if not exists public.notifications (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  type             text not null,  -- low_stock | ticket_sale | crew_late | event_live | milestone
  title            text not null,
  body             text,
  entity_id        uuid,           -- optional link to related record
  entity_type      text,           -- event | equipment | staff | ticket
  read             boolean not null default false,
  created_at       timestamptz not null default now()
);

alter table public.notifications enable row level security;

create policy "Org members can read their notifications" on public.notifications
  for select using (organization_id = current_org_id());

create policy "Org members can mark notifications read" on public.notifications
  for update using (organization_id = current_org_id());

create index if not exists idx_notifications_org_unread
  on public.notifications(organization_id, read, created_at desc);

alter publication supabase_realtime add table public.notifications;

-- 3. Profile invites (for team management)
create table if not exists public.invites (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references public.organizations(id) on delete cascade,
  email            text not null,
  role             text not null default 'staff',
  invited_by       uuid references public.profiles(id),
  accepted         boolean not null default false,
  created_at       timestamptz not null default now(),
  unique(organization_id, email)
);

alter table public.invites enable row level security;

create policy "Org admins can manage invites" on public.invites
  using (organization_id = current_org_id());

create policy "Anyone can read invite by email" on public.invites
  for select using (true);

-- 4. Auto-notification trigger on low stock
create or replace function public.notify_low_stock()
returns trigger language plpgsql security definer as $$
begin
  if new.quantity_available <= new.low_stock_threshold
     and (old.quantity_available > old.low_stock_threshold or old.quantity_available is null)
  then
    insert into public.notifications(organization_id, type, title, body, entity_id, entity_type)
    values (
      new.organization_id,
      'low_stock',
      'Low stock: ' || new.name,
      new.quantity_available || ' ' || new.unit || ' remaining (threshold: ' || new.low_stock_threshold || ')',
      new.id,
      'equipment'
    )
    on conflict do nothing;
  end if;
  return new;
end;
$$;

drop trigger if exists on_equipment_low_stock on public.equipment;
create trigger on_equipment_low_stock
  after update on public.equipment
  for each row execute function public.notify_low_stock();

-- 5. Auto-notification on ticket sale milestones (every 10 tickets)
create or replace function public.notify_ticket_milestone()
returns trigger language plpgsql security definer as $$
declare
  v_event_name text;
  v_org_id     uuid;
  v_total      int;
begin
  if new.status = 'valid' and (old.status is null or old.status != 'valid') then
    select e.name, e.organization_id,
           (select count(*) from public.tickets t2
            join public.ticket_types tt2 on tt2.id = t2.ticket_type_id
            where tt2.event_id = tt.event_id and t2.status = 'valid')
    into v_event_name, v_org_id, v_total
    from public.ticket_types tt
    join public.events e on e.id = tt.event_id
    where tt.id = new.ticket_type_id;

    if v_total % 10 = 0 and v_total > 0 then
      insert into public.notifications(organization_id, type, title, body, entity_type)
      values (
        v_org_id,
        'milestone',
        v_total || ' tickets sold — ' || v_event_name,
        'Milestone reached for ' || v_event_name,
        'ticket'
      );
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists on_ticket_milestone on public.tickets;
create trigger on_ticket_milestone
  after insert or update on public.tickets
  for each row execute function public.notify_ticket_milestone();

-- 6. Accept invite RPC (called when a new user signs up with an invited email)
create or replace function public.accept_invite(p_email text)
returns void language plpgsql security definer set search_path = public as $$
declare
  v_invite record;
begin
  select * into v_invite
  from public.invites
  where email = lower(trim(p_email)) and accepted = false
  limit 1;

  if found then
    update public.profiles
    set organization_id = v_invite.organization_id,
        role = v_invite.role::text::public."Role"
    where id = auth.uid();

    update public.invites set accepted = true where id = v_invite.id;
  end if;
end;
$$;

grant execute on function public.accept_invite(text) to authenticated;

-- Done.
