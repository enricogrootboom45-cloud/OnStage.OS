-- migration_008: per-post visibility for organiser posts (ticket_holders / followers / public).
--
-- Default is 'public' — this preserves *exact* current behavior for every existing
-- post (fan UGC has always been visible in the global Community feed; this migration
-- must not silently hide any of it). The OS create-post UI defaults its own form
-- state to 'followers' for *new* organiser posts, as a safer default for that
-- specific feature — but that's a UI choice, not this column's default.

alter table public.posts
  add column if not exists visibility text not null default 'public';

alter table public.posts
  drop constraint if exists posts_visibility_check;

alter table public.posts
  add constraint posts_visibility_check
  check (visibility in ('public', 'followers', 'ticket_holders'));

-- A ticket-holders-only post is meaningless without an event to gate against.
alter table public.posts
  drop constraint if exists posts_ticket_holders_requires_event;

alter table public.posts
  add constraint posts_ticket_holders_requires_event
  check (visibility != 'ticket_holders' or event_id is not null);

-- Explicit backfill, belt-and-suspenders alongside the column default above.
update public.posts set visibility = 'public' where visibility is null;