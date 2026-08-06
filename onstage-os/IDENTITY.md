# OnStage Identity

This is the reference doc for Phase 1 of the design overhaul. It exists so
decisions don't have to be re-argued screen by screen. If a design choice
isn't covered here, ask: *does this match the vision below?* — not *does
this look nice in isolation?*

Applies to both repos (`onstage-app` and `OnStage.OS`) — one product, one
identity, even though it's two codebases.

---

## Vision

**OnStage is the nerve center for a live show — not a database for one.**

Every ticketing/event-ops tool on the market was built by people who've
never stood backstage during doors. They built spreadsheets with a UI.
OnStage is built around what actually happens the night of a show: crew
checking in late, a DJ running over, a bar running low on ice, a fan
posting a photo mid-set. The product should feel like it understands that
rhythm — because the whole design language (blackout, riser, cue lights,
standby) is a literal lighting console. That's not a skin. That's the
premise.

## Personality

**Calm competence under pressure.**

Not playful, not corporate, not shouting "fun startup" at you. Think of
the person calling the show from the booth who never raises their voice
because they were already three steps ahead. Every interaction — copy,
motion, error states — should sound like *that person's* tools, not like
generic software.

What that rules out: exclamation marks in system copy, cutesy empty-state
illustrations, apologetic error messages. What it calls for instead:
direct, unhurried, slightly dry when it needs to be. An error is
"Something's off" — stated, not apologized for — followed by exactly what
to do next.

## Terminology

Generic SaaS language creates generic SaaS feelings. Use the OnStage term
everywhere it applies — in nav, in copy, in code comments where it helps
future contributors think the right way.

| Generic | OnStage | Notes |
|---|---|---|
| Dashboard | Mission Control | The one screen that answers "can tonight happen?" |
| Events | Productions | An event is a calendar entry; a production is something you run |
| Users / Staff | Crew | Already partly in code (`StaffRoster`, "crew member") |
| Customers | Audience | You're building a fanbase, not managing accounts |
| Reports | Insights | Folded into Mission Control, not a separate destination |
| Equipment | Production Assets | Reframes storage as "what makes the show happen" |
| Save / Submit | Confirm / Lock in | Matches the finality of a live-show decision |
| Loading... | Warming up | One word swap, consistent everywhere |
| Error | Something's off | No apology, no blame, just the fact and the fix |

Don't rename things that are already concrete and correct — **Venues**,
**Settings**, and **Staff-on-shift** status labels stay as-is. Renaming
everything is its own tell.

## Typography

Display font (Space Grotesk) is under-used relative to its own personality
— it's a confident, geometric face and most of the app has it doing the
job of a much quieter font. The fix isn't a new typeface, it's *scale
discipline*: numbers that matter get to be big. See the `display-*` and
`stat` tokens added to both `tailwind.config.js` files — use these instead
of ad hoc `text-2xl` / `text-[11px]` bracket values, so "how big should
this be" stops being a per-screen judgment call.

Mono (IBM Plex Mono) isn't just for labels — use it for anything that
should read as *data on a console*: timestamps, money, hours worked,
IDs, status labels. If it's a number or a system-state word, it's
probably mono.

## Spacing

One scale, no exceptions: **4 · 8 · 12 · 16 · 24 · 32 · 48 · 64** (px).
Concretely:
- Card interior padding: `p-5` (20px) — not `p-4`, not `p-6`, pick one
- Page container padding: `p-6` desktop, `p-4` mobile
- Gap between stacked sections: `space-y-6`
- Gap between related inline items (icon + label): `gap-2`

If a screen needs a spacing value outside this list, that's a sign to
reconsider the layout, not to add a ninth value to the scale.

## Icon weight

Lucide icons, `strokeWidth` is the discipline:
- **1.8** — default, passive, inactive state
- **2.4–2.6** — active, emphasized, or a primary action's icon

Don't let this drift per-file. An inactive nav icon and an active one
should always differ by the same fixed amount, everywhere.

## Animation principles

Detailed in the Phase 5 build, but the rule that governs all of it:

**Nothing snaps. Everything fades, slides, or breathes.**
- Page/route changes: fade + 4px slide-up, ~150ms
- Numbers that update (revenue, counts): count up, don't jump
- Anything "live": reuse `cue-pulse` — the app's one signature animation,
  not a new one invented per screen
- Lists: stagger-fade rows in on load, capped so long lists don't take
  visibly long to finish animating

## Colour philosophy

Already codified as the comment block at the top of both `tailwind.config.js`
files — this doc doesn't repeat it, it just points there as the source of
truth. Read it before touching any color in either repo.

## Component library

Existing, real, and load-bearing — extend these, don't reinvent them per
screen: `Button`, `StatCard`, `CueLight`, `Modal` (+ `Field`/`inputClass`),
`EmptyState`, `Avatar`.

Missing, and worth building as Phase 6/8 lands: skeleton loaders (matching
each page's real layout, not generic shimmer blocks), a toast/inline-alert
primitive, a command palette.

---

**The test for all of the above:** if you removed the OnStage wordmark
from a screenshot, would someone still recognize it as OnStage? Right now,
mostly no — that's the gap every later phase closes.