# OnStage OS

The operating system for live events — organizers, venues, crew, and customers in one console.

## Stack

- React + TypeScript + Vite
- Tailwind CSS (custom "cue sheet / stage lighting" design tokens — see `tailwind.config.js`)
- Supabase (Postgres + Auth) — project `onstage-os`
- React Router

## Structure

```
src/
  core/        auth, supabase client, shared types, design system, layout
  reports/     dashboard — live KPIs across every module
  ticketing/   events
  staff-ops/   crew roster, shift board (clock-in/break/out), equipment & stock
  venues/      venue directory
  crm/         customer records
  pages/       login, first-run organization setup
```

Each module owns its own folder and queries Supabase directly, scoped by `organization_id`.
Row-level security is enabled on every table in Supabase — the anon/publishable key embedded
in `core/supabaseClient.ts` is safe to expose; access is enforced at the database layer.

## Local development

```bash
npm install
npm run dev
```

## What's built (v0.1)

- Auth (sign up / sign in) + first-run organization setup
- Reports dashboard: revenue, tickets sold, live event count, crew clocked in, low-stock alerts
- Events: create + list, status tracked via the CueLight indicator (draft → published → live → completed)
- Staff: roster + shift board — assign crew to an event, clock in, start/end break, clock out
- Equipment: stock tracking with low-stock alerts, quick use/restock logging
- Venues: directory with capacity and on-site contacts
- Customers: CRM record list, ready for lead import

## Next up

- Ticket types + checkout flow (customer-facing)
- CSV import for the 2,000+ lead list
- Per-role permissions (owner/admin/manager/staff already modeled in `profiles.role`)
- Equipment log history view
