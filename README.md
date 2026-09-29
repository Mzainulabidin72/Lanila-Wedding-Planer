# Lanila Wedding Planner

> **Auth terintegrasi dengan Lanila Buku Kas** — lihat `AUTH.md`.
> Login/Register memakai project Supabase yang sama.

---


A working front-end prototype of the Lanila Wedding Planner product: Next.js
(App Router) + TypeScript + Tailwind, with a mock in-memory/localStorage data
layer standing in for the real backend so the whole product can be clicked
through end-to-end before Supabase/auth is wired in.

**This is a prototype, not a finished backend integration.** No real
authentication, database, or file storage is connected yet — see "Connecting
it for real" below for exactly where to plug those in.

## Running it

```bash
npm install
npm run dev
```

Then open `http://localhost:3000` — it redirects into a seeded demo
workspace ("Ayu & Angga") at `/w/wk_ayu_angga/dashboard`.

There's also `/onboarding`, a standalone 4-step wizard (couple name, wedding
date, target budget, event type) that currently just redirects into the same
demo workspace — wire its "Buat Workspace" button to a real insert once the
backend exists.

## What's implemented

| Module | Route | Notes |
|---|---|---|
| Dashboard | `/w/[id]/dashboard` | Countdown, overall + per-category progress, budget summary, upcoming tasks, wedding health panel, activity feed — all computed from data, nothing hardcoded |
| Peta Persiapan | `/w/[id]/peta-persiapan` | Visual stage journey + per-stage checklist, status is click-to-cycle |
| Alur Pernikahan | `/w/[id]/alur-pernikahan` | Content-driven guide (see `lib/content/alur-pernikahan.ts`), explicitly labeled as general guidance vs. official requirement |
| Timeline | `/w/[id]/timeline` | Kanban-style task board by status |
| Budget | `/w/[id]/budget` | Grouped by category, per-item payment recording |
| Vendor | `/w/[id]/vendor` | Card grid with status control |
| Daftar Tamu | `/w/[id]/tamu` | RSVP stats + table |
| Seserahan | `/w/[id]/seserahan` | Checklist with computed planned/actual/remaining |
| Hadiah Diterima | `/w/[id]/hadiah` | Empty by default (privacy-sensitive; no seeded data) |
| Akad & Resepsi | `/w/[id]/acara` | Static event detail view |
| Dokumen | `/w/[id]/dokumen` | Empty state only — real uploads need Supabase Storage |
| Settings | `/w/[id]/settings`, `/settings/account` | Workspace info, members, and the auth-integration touchpoint |

## Architecture

```
app/
  onboarding/                  4-step workspace creation wizard
  w/[workspaceId]/             everything inside a wedding workspace
    layout.tsx                 sidebar + topbar + mobile nav shell
    dashboard/ peta-persiapan/ alur-pernikahan/ timeline/ budget/
    vendor/ tamu/ seserahan/ hadiah/ acara/ dokumen/ settings/

components/
  ui/                          Button, Card, Badge, ProgressBar, StatusBadge,
                                EmptyState, Modal — the shared design system
  wedding/                     Sidebar, Topbar, MobileNav, CountdownWidget,
                                WeddingHealthPanel, ActivityFeed

lib/
  types.ts                     domain types, mirrors supabase/schema.sql
  mock-data.ts                 seed data for the demo workspace
  store.tsx                    React context + localStorage — THE SWAP POINT
  derive.ts                    all derived-stat math (progress %, totals,
                                countdown) lives here, not in components
  content/alur-pernikahan.ts   structured guide content, not hardcoded JSX

supabase/
  schema.sql                   proposed tables + RLS policies
```

Every page reads/writes through `useStore()` (`lib/store.tsx`), never through
`mock-data.ts` directly. That's the one file that needs to change to go from
mock to real data — component code shouldn't need to change.

## Connecting it for real

This zip deliberately stops short of wiring a live backend, since you said
you'll handle connections yourself. Here's exactly where each piece plugs in:

1. **Auth** — Install `@supabase/ssr` and `@supabase/supabase-js`, point them
   at your existing (or new) Lanila Supabase project via the vars in
   `.env.example`. If Buku Kas already has an identity table, make sure it's
   the one referenced by `wedding_workspaces.created_by` and
   `wedding_members.profile_id` in `supabase/schema.sql` — rename the FK
   target there if it isn't called `profiles`.
2. **Database** — Run `supabase/schema.sql` against your project (adjust the
   `profiles` table creation if it already exists). Enable RLS on every
   workspace-scoped table using the pattern shown for `wedding_tasks`.
3. **Data layer** — Replace the body of `lib/store.tsx` with Supabase queries
   /mutations (e.g. `supabase.from('wedding_tasks').select()` inside a
   `useEffect`, and `.update()`/`.insert()` inside the mutator functions).
   Keep the same `StoreContextValue` shape so no page needs to change.
4. **Documents** — Wire the `dokumen` page and `preparation_items.document_id`
   to a private Supabase Storage bucket; generate signed URLs server-side
   after checking `wedding_members` membership.
5. **Buku Kas integration** — When a budget payment is recorded
   (`recordBudgetPayment` in `lib/store.tsx`), also insert a row into
   `financial_transactions` with `source_app = 'wedding_planner'` and
   `related_budget_item_id` set, so it's traceable back to its origin without
   duplicating the transaction.
6. **Notifications** — The `notifications` table exists in the schema but has
   no UI yet; the "Wedding Health" panel's logic (`components/wedding/
   WeddingHealthPanel.tsx`) is a good starting point for what should trigger
   a reminder (payment due soon, tasks piling up, etc.).

## Design tokens

- **Brand chrome** (logo, sidebar, focus rings): Lanila's own indigo/purple
  (`#6366F1` / `#8B5CF6`), matching the existing brand guide.
- **Wedding-domain accent**: a muted blush/rose (`#B85C4C` family), used for
  progress bars, primary actions, and active nav state — keeps the app
  recognizably wedding-flavored without going all-pink (per the brief).
- **Type**: Plus Jakarta Sans throughout.
- Full token list in `tailwind.config.ts`.

## Known gaps (by design, not oversight)

- No AI assistant, vendor marketplace, payment gateway, or public wedding
  site — explicitly out of scope for MVP per the brief.
- No dark mode yet, but color tokens are centralized in `tailwind.config.ts`
  so a `dark:` variant pass is straightforward later.
- No pagination yet on guests/vendors tables — fine at prototype scale, add
  before either list can grow past ~50–100 rows.
