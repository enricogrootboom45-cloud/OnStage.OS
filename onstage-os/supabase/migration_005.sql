-- ============================================================
-- OnStage — Migration 005 (Phase 4: Community)
-- Run in: Supabase Dashboard → SQL Editor
-- ============================================================

-- 1. Fan profiles (customer-facing, separate from org profiles)
create table if not exists public.fan_profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  username        text unique,
  display_name    text,
  bio             text,
  avatar_url      text,
  location        text,
  website         text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table public.fan_profiles enable row level security;
create policy "Public can read fan profiles"         on public.fan_profiles for select using (true);
create policy "Users manage their own fan profile"   on public.fan_profiles for all  using (id = auth.uid());

-- Auto-create fan profile on signup
create or replace function public.handle_new_fan_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.fan_profiles(id) values(new.id) on conflict do nothing;
  return new;
end;
$$;
drop trigger if exists on_fan_profile_created on auth.users;
create trigger on_fan_profile_created
  after insert on auth.users
  for each row execute function public.handle_new_fan_profile();

-- 2. Organisation branding (logo, banner, theme colours)
alter table public.organizations
  add column if not exists logo_url         text,
  add column if not exists banner_url       text,
  add column if not exists primary_color    text default '#E8893A',
  add column if not exists secondary_color  text default '#5C7C93',
  add column if not exists theme            text default 'default',
  add column if not exists tagline          text,
  add column if not exists website          text,
  add column if not exists instagram_handle text,
  add column if not exists description      text;

-- 3. Event extra fields for the consumer app
alter table public.events
  add column if not exists cover_url        text,
  add column if not exists genre            text,
  add column if not exists min_age          int,
  add column if not exists dress_code       text,
  add column if not exists lineup           text,
  add column if not exists featured         boolean default false;

-- 4. Follows (fan → organisation)
create table if not exists public.follows (
  follower_id     uuid not null references auth.users(id) on delete cascade,
  organisation_id uuid not null references public.organizations(id) on delete cascade,
  created_at      timestamptz not null default now(),
  primary key (follower_id, organisation_id)
);
alter table public.follows enable row level security;
create policy "Users manage their own follows" on public.follows for all using (follower_id = auth.uid());
create policy "Public can read follows"        on public.follows for select using (true);
create index if not exists idx_follows_org on public.follows(organisation_id);

-- 5. Posts (event walls, organiser feed, community)
create table if not exists public.posts (
  id              uuid primary key default gen_random_uuid(),
  author_id       uuid references auth.users(id) on delete set null,
  organisation_id uuid references public.organizations(id) on delete cascade,
  event_id        uuid references public.events(id) on delete cascade,
  group_id        uuid,
  body            text,
  is_verified_attendee boolean default false,
  like_count      int not null default 0,
  comment_count   int not null default 0,
  created_at      timestamptz not null default now()
);
alter table public.posts enable row level security;
create policy "Public can read posts"   on public.posts for select using (true);
create policy "Auth users create posts" on public.posts for insert with check (auth.uid() = author_id);
create policy "Authors delete own posts" on public.posts for delete using (auth.uid() = author_id);
create index if not exists idx_posts_event  on public.posts(event_id,  created_at desc);
create index if not exists idx_posts_org    on public.posts(organisation_id, created_at desc);
alter publication supabase_realtime add table public.posts;

-- 6. Post media (photos + video links)
create table if not exists public.post_media (
  id           uuid primary key default gen_random_uuid(),
  post_id      uuid not null references public.posts(id) on delete cascade,
  url          text not null,
  media_type   text not null default 'image',  -- image | video_link | reel_link
  aspect_ratio text default '1:1',             -- 1:1 | 4:5 | 16:9 | 9:16
  thumbnail_url text,
  display_order int default 0,
  created_at   timestamptz not null default now()
);
alter table public.post_media enable row level security;
create policy "Public can read post media" on public.post_media for select using (true);
create policy "Post authors manage media"  on public.post_media for all
  using (exists (select 1 from public.posts p where p.id = post_media.post_id and p.author_id = auth.uid()));

-- 7. Post likes
create table if not exists public.post_likes (
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
alter table public.post_likes enable row level security;
create policy "Users manage own likes" on public.post_likes for all using (user_id = auth.uid());
create policy "Public read likes"      on public.post_likes for select using (true);

-- Auto-update like_count
create or replace function public.update_like_count() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set like_count = like_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set like_count = greatest(0, like_count - 1) where id = old.post_id;
  end if;
  return coalesce(new, old);
end;
$$;
drop trigger if exists on_like_change on public.post_likes;
create trigger on_like_change after insert or delete on public.post_likes
  for each row execute function public.update_like_count();

-- 8. Post comments
create table if not exists public.post_comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references public.posts(id) on delete cascade,
  author_id  uuid references auth.users(id) on delete set null,
  body       text not null,
  created_at timestamptz not null default now()
);
alter table public.post_comments enable row level security;
create policy "Public read comments"     on public.post_comments for select using (true);
create policy "Auth users post comments" on public.post_comments for insert with check (auth.uid() = author_id);
create policy "Authors delete comments"  on public.post_comments for delete using (auth.uid() = author_id);

create or replace function public.update_comment_count() returns trigger language plpgsql as $$
begin
  if tg_op = 'INSERT' then
    update public.posts set comment_count = comment_count + 1 where id = new.post_id;
  elsif tg_op = 'DELETE' then
    update public.posts set comment_count = greatest(0, comment_count - 1) where id = old.post_id;
  end if;
  return coalesce(new, old);
end;
$$;
drop trigger if exists on_comment_change on public.post_comments;
create trigger on_comment_change after insert or delete on public.post_comments
  for each row execute function public.update_comment_count();

-- 9. Community groups
create table if not exists public.groups (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  description     text,
  cover_url       text,
  organisation_id uuid references public.organizations(id) on delete cascade,
  creator_id      uuid references auth.users(id) on delete set null,
  is_private      boolean not null default false,
  member_count    int not null default 0,
  genre           text,
  created_at      timestamptz not null default now()
);
alter table public.groups enable row level security;
create policy "Public read public groups"     on public.groups for select using (not is_private or exists(select 1 from public.group_members gm where gm.group_id = groups.id and gm.user_id = auth.uid()));
create policy "Auth users create groups"      on public.groups for insert with check (auth.uid() = creator_id);

create table if not exists public.group_members (
  group_id   uuid not null references public.groups(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null default 'member',
  joined_at  timestamptz not null default now(),
  primary key (group_id, user_id)
);
alter table public.group_members enable row level security;
create policy "Members read group membership" on public.group_members for select using (true);
create policy "Users manage own membership"   on public.group_members for all  using (user_id = auth.uid());

-- 10. Conversations (DM + event chat + group chat)
create table if not exists public.conversations (
  id          uuid primary key default gen_random_uuid(),
  type        text not null default 'dm',   -- dm | event_chat | group_chat
  event_id    uuid references public.events(id) on delete cascade,
  name        text,
  created_at  timestamptz not null default now()
);
alter table public.conversations enable row level security;
create policy "Members read conversations" on public.conversations for select
  using (exists(select 1 from public.conversation_members cm where cm.conversation_id = conversations.id and cm.user_id = auth.uid()));

create table if not exists public.conversation_members (
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  last_read_at    timestamptz,
  joined_at       timestamptz not null default now(),
  primary key (conversation_id, user_id)
);
alter table public.conversation_members enable row level security;
create policy "Users read own memberships"   on public.conversation_members for select using (user_id = auth.uid());
create policy "Users update own memberships" on public.conversation_members for update using (user_id = auth.uid());

-- 11. Messages
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  author_id       uuid references auth.users(id) on delete set null,
  body            text,
  media_url       text,
  created_at      timestamptz not null default now()
);
alter table public.messages enable row level security;
create policy "Members read messages" on public.messages for select
  using (exists(select 1 from public.conversation_members cm where cm.conversation_id = messages.conversation_id and cm.user_id = auth.uid()));
create policy "Members send messages" on public.messages for insert
  with check (auth.uid() = author_id and exists(select 1 from public.conversation_members cm where cm.conversation_id = messages.conversation_id and cm.user_id = auth.uid()));
alter publication supabase_realtime add table public.messages;

-- 12. Boost campaigns (in-platform ads)
create table if not exists public.boost_campaigns (
  id              uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organizations(id) on delete cascade,
  event_id        uuid references public.events(id) on delete cascade,
  post_id         uuid references public.posts(id) on delete cascade,
  status          text not null default 'draft',  -- draft | active | paused | completed
  daily_budget    numeric(10,2) not null default 50,
  total_budget    numeric(10,2),
  spent           numeric(10,2) not null default 0,
  impressions     int not null default 0,
  clicks          int not null default 0,
  target_genres   text[],
  target_age_min  int default 18,
  target_age_max  int,
  target_location text,
  starts_at       timestamptz,
  ends_at         timestamptz,
  created_at      timestamptz not null default now()
);
alter table public.boost_campaigns enable row level security;
create policy "Org members manage campaigns" on public.boost_campaigns for all
  using (organisation_id = current_org_id());

create index if not exists idx_boost_active on public.boost_campaigns(status, starts_at, ends_at)
  where status = 'active';

-- Done — run migration_006.sql next.
