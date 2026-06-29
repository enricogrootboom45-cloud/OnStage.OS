# OnStage Platform — Full Setup Guide

Two products, one Supabase backend.
- **OnStage OS** (`onstage-os/`) — organiser B2B dashboard
- **OnStage App** (`onstage-app/`) — consumer social app

---

## 1. Supabase — Run migrations in order

Go to: https://supabase.com/dashboard/project/kxwnrbajrrazhqklyseq/sql/new

Run each file from `onstage-os/supabase/`:

```
migration_002.sql   → Realtime + indexes + v_event_sales view
migration_003.sql   → Event slugs + ticket buyer fields + public RLS
migration_003b.sql  → increment_ticket_sold + unique constraint + staff RLS
migration_004.sql   → event_costs + notifications + invites + auto-triggers
migration_005.sql   → Community: fan_profiles, follows, posts, media, likes,
                      comments, groups, conversations, messages, boost_campaigns
migration_006.sql   → Equipment split (gear vs consumable) + ePOS tables
```

Run them IN ORDER — each depends on the previous.

---

## 2. Supabase Storage — Create buckets

Go to: https://supabase.com/dashboard/project/kxwnrbajrrazhqklyseq/storage/buckets

Create these buckets:

| Bucket name  | Public? | Used for                              |
|--------------|---------|---------------------------------------|
| `org-assets` | ✅ Yes  | Organisation logos and banner images  |
| `post-media` | ✅ Yes  | User-uploaded photos in posts         |

For each bucket → Policies → New policy → Allow public reads + authenticated writes:

```sql
-- Allow public read
CREATE POLICY "Public read" ON storage.objects FOR SELECT USING (bucket_id = 'org-assets');

-- Allow authenticated upload
CREATE POLICY "Auth upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'org-assets' AND auth.uid() IS NOT NULL);

-- Allow owner to update/delete their own files
CREATE POLICY "Owner manage" ON storage.objects FOR ALL
  USING (bucket_id = 'org-assets' AND auth.uid()::text = (storage.foldername(name))[2]);
```

Repeat the same for `post-media` (replace bucket name).

---

## 3. Deploy Supabase Edge Functions

Install Supabase CLI: https://supabase.com/docs/guides/cli

```bash
supabase login
supabase link --project-ref kxwnrbajrrazhqklyseq

# Deploy all functions
supabase functions deploy create-checkout
supabase functions deploy fulfill-order
supabase functions deploy lightspeed-webhook --no-verify-jwt
```

---

## 4. Edge Function Secrets

Go to: Supabase Dashboard → Edge Functions → Manage secrets

Add these:

### Stripe (get from https://dashboard.stripe.com/test/apikeys)
```
STRIPE_SECRET_KEY = sk_test_...
```

### Resend email (get from https://resend.com/api-keys)
```
RESEND_API_KEY = re_...
FROM_EMAIL     = tickets@yourdomain.com   # Must be verified in Resend
                                          # Use: onboarding@resend.dev for testing
```

### App URL
```
APP_URL = https://on-stage-os.vercel.app
```

---

## 5. Vercel Environment Variables

### OnStage OS (on-stage-os.vercel.app)
In Vercel → Project Settings → Environment Variables:
```
VITE_STRIPE_PUBLISHABLE_KEY = pk_test_...
VITE_APP_URL                = https://on-stage-os.vercel.app
```

### OnStage App (new Vercel project)
```
VITE_SUPABASE_URL              = https://kxwnrbajrrazhqklyseq.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY  = sb_publishable_0lj4MXTTnqt-K4MD6CUIAg_BtiUQ8Jj
VITE_STRIPE_PUBLISHABLE_KEY    = pk_test_...
```

---

## 6. Deploy OnStage App (consumer app)

Create a NEW GitHub repo for `onstage-app/` (separate from the OS repo).

Then in Vercel:
1. Add New Project → Import the new repo
2. Framework: **Vite**
3. Root Directory: `onstage-app` (if monorepo) or leave blank (if own repo)
4. Add environment variables above
5. Deploy

---

## 7. Lightspeed K Series — ePOS Integration

**In OnStage OS:**
1. Go to Settings → not yet exposed in UI, insert directly in Supabase for now:
```sql
INSERT INTO public.pos_integrations (organisation_id, provider, location_id, webhook_secret)
VALUES (
  'your-org-uuid',
  'lightspeed_k',
  'your-lightspeed-location-id',
  'your-random-webhook-secret-min-32-chars'
);
```

**In Lightspeed K Series:**
1. Dashboard → Settings → Webhooks → Add webhook
2. URL: `https://kxwnrbajrrazhqklyseq.supabase.co/functions/v1/lightspeed-webhook`
3. Events: `sale.completed`
4. Secret: same value as `webhook_secret` above

**Map SKUs to consumables:**
In OnStage OS → Equipment → Bar & Consumables → Add Item → fill in "Lightspeed SKU" field.
This must match exactly the SKU in Lightspeed for auto-sync to work.

---

## 8. Stripe Test Mode — End-to-End Test

1. Use test card: `4242 4242 4242 4242` / any future date / any CVC
2. Publish an event in OnStage OS
3. Open the public event page (`/e/event-slug`)
4. Buy a ticket — you'll be redirected to Stripe checkout
5. Complete payment
6. You'll land on the success page with a QR code
7. Email is sent to the buyer (if Resend configured)
8. In OnStage OS, the ticket shows up in the event's ticket count

---

## 9. Supabase Auth — Email confirmation

For test mode, disable email confirmation so you can sign up instantly:
Supabase Dashboard → Authentication → Providers → Email → Disable "Confirm email"

Re-enable this before going live.

---

## 10. Domain setup (when ready)

**OnStage OS:** Point `onstageos.com` → Vercel
**OnStage App:** Point `onstage.app` (or your domain) → new Vercel project

Both apps share the same Supabase backend — data flows between them automatically.

---

## What's live after setup

| Feature                          | Works? |
|----------------------------------|--------|
| Organiser sign-up + onboarding   | ✅     |
| Event creation + publishing      | ✅     |
| Ticket tiers + checkout (Stripe) | ✅ *   |
| QR code tickets + email          | ✅ *   |
| Door scanner (camera QR)         | ✅     |
| Staff clock-in / shift board     | ✅     |
| Realtime crew status             | ✅     |
| Equipment (gear + consumables)   | ✅     |
| Lightspeed ePOS stock sync       | ✅ *   |
| Customer CRM + CSV import        | ✅     |
| Event P&L tracker                | ✅     |
| Staff timesheet export           | ✅     |
| Notifications (bell)             | ✅     |
| Team invites + roles             | ✅     |
| Brand logo + banner + themes     | ✅ *   |
| Consumer app (discover)          | ✅     |
| Consumer app (social feed)       | ✅     |
| Consumer app (event wall)        | ✅     |
| Consumer app (messages)          | ✅     |
| Consumer app (profiles)          | ✅     |
| Organiser public pages           | ✅     |
| Photo upload to posts            | ✅ *   |
| Video link embeds (YT/Vimeo)     | ✅     |
| Boost campaigns (foundation)     | ✅ DB  |

`✅ *` = requires additional setup (Stripe keys / Resend / Storage buckets)
`✅ DB` = data model in place, UI coming in next phase
