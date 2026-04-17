# Chip In — product spec

## Problem

Gift coordination for families and close groups happens across a tangle of WhatsApp threads: one for mum's birthday, one for dad's Christmas, one per sibling. There's no single place to suggest ideas, agree on one, track who's buying, and confirm that everyone's settled up. Splitwise exists but requires account creation, doesn't enforce payment confirmation, and is built for expense splitting — not gift coordination.

Chip In does one thing: keeps a group aligned on what they're getting someone, and makes sure everyone pays their share.

---

## Users

Family members and close friends, likely low-to-medium tech literacy. No one should need to create an account to participate — joining via a shared link is the entire onboarding flow. Anyone in a group can create a new occasion independently.

---

## Core concepts

### Occasion
The primary unit. An occasion represents a gift event (a birthday, Christmas, an anniversary). It has:
- A **recipient** (the person receiving the gift — not necessarily a member)
- A **group** (the contributors)
- A **date** (when the event occurs)
- A **recurrence setting** (one-off or recurring annually)
- One or more **instances** (one per year, if recurring)

Recipients are not modelled as members of their own occasion. The group simply doesn't invite them.

### Instance
A single year's version of a recurring occasion. Each instance has its own gift suggestions, decided gift, buyer, splits, and contribution state. Group membership is inherited from the parent occasion.

When a new annual instance is auto-created, the previous year's decided gift is shown as a **reference card** at the top of the suggestion thread — visible but not pre-populated as a new suggestion. The group starts fresh.

### Gift suggestion
Any member can add a gift suggestion: a title, a URL (optional), and a price. Members can add, edit, and delete their own suggestions. Members vote on suggestions they like with a **thumbs up** — they can vote on multiple. The vote count is visible to everyone.

Once the group has discussed (likely off-app via WhatsApp), the **buyer marks one suggestion as Decided**. This locks the gift. If no suggestions exist or the buyer already knows what they want, they can add a suggestion and mark it Decided in one step.

### Buyer
Any member can assign any other member (or themselves) as buyer at any point. The buyer is the person who will front the cost and manage contributions. The role can be reassigned by any member at any time.

When a buyer is assigned, the app immediately creates equal split rows for all contributors (all members except the buyer), calculated as gift price ÷ number of contributors. The buyer can then adjust individual amounts before marking as purchased.

### Splits
The cost distribution across contributors. Created automatically with equal amounts when a buyer is assigned. The buyer can adjust individual amounts. Locked permanently once the instance is marked as purchased. At least one split row must exist before the instance can move to purchased — enforced at the database level.

### Purchased
The buyer marks the instance as **Purchased** once they've bought the gift off-app. Before this is allowed, the database requires:
- A decided gift
- An assigned buyer
- Bank details entered
- At least one split row set

Marking as purchased:
- Locks the gift, price, and splits permanently
- Snapshots each split into an immutable contribution record
- Sends a notification email to all contributors with what they owe, who to pay, and the buyer's bank details

### Contributions
Once purchased, a contribution record exists per contributor showing their amount and whether they've paid. Either the contributor marks their own as made, or the buyer marks it on their behalf. The buyer can close and archive the instance at any time — they are not blocked by outstanding contributions.

---

## Instance status flow

```
Planning → Decided → Purchased → Done (archived)
```

| Status | What's happened | Who triggers it |
|---|---|---|
| Planning | Occasion created, suggestions open | Auto (on creation) |
| Decided | Buyer has marked one gift as the chosen one | Buyer |
| Purchased | Buyer has bought the gift; contributions created; notification sent | Buyer |
| Done | Buyer has closed the instance | Buyer |

The buyer can skip straight from Purchased to Done without waiting for all contributions to be confirmed.

The buyer can revert from Decided back to Planning if they change their mind before purchase.

---

## Data model

```
occasion
  id
  title                     -- e.g. "Mum's birthday"
  recipient_name
  recurrence                -- enum: one_off | annual
  recurrence_month          -- 1–12 (for annual)
  recurrence_day            -- 1–31 (for annual)
  invite_token              -- uuid, regeneratable
  created_by                -- member id
  created_at
  updated_at

occasion_instance
  id
  occasion_id
  year
  status                    -- enum: planning | decided | purchased | done
  decided_gift_id           -- nullable → gift_suggestion
  buyer_id                  -- nullable → member
  buyer_bank_details        -- text, nullable; entered by buyer before marking purchased
  archived_at               -- nullable; set automatically when status = done
  created_at
  updated_at

member
  id
  auth_id                   -- references auth.users
  name
  email
  phone                     -- optional, reserved for WhatsApp v2
  created_at
  updated_at

occasion_member
  occasion_id
  member_id
  joined_at
  -- hard delete on leave; member row preserved for contribution history

gift_suggestion
  id
  instance_id
  proposed_by               -- member id
  title
  url                       -- nullable
  price                     -- decimal
  is_decided                -- boolean; enforced unique per instance at db level
  created_at
  updated_at

gift_vote
  suggestion_id
  member_id                 -- voter
  voted_at
  -- composite PK; one vote per member per suggestion
  -- members can vote on multiple suggestions

split
  id
  instance_id
  member_id                 -- contributor (excludes buyer)
  amount                    -- decimal; buyer-set, locked on purchased
  created_at
  updated_at

contribution
  id
  instance_id
  contributor_id            -- member id
  amount                    -- snapshotted from split at time of purchase; immutable
  marked_made_by            -- member id (contributor self-serves, or buyer marks on behalf)
  made_at                   -- nullable; set when marked as made
  created_at
  updated_at
```

---

## Screens

### Home `/`
List of active occasions the member belongs to. Each shows: recipient name, next instance date, status pill. Done instances are not shown here — they're accessible from within the occasion view.

Status pills: Planning → Decided → Purchased → Done

Button to create a new occasion.

### Occasion `/occasion/[id]`
- Recipient name, recurrence label, next event date
- Member list with initials avatars
- Shareable invite link with copy button and regenerate option
- Active instance shown at top
- Instance history below — collapsed list of past instances (year, decided gift, status). Tap to expand. No separate tab.
- Any member can manually start a new instance

### Instance `/occasion/[id]/[year]`

**Planning**
- Reference card (recurring only): last year's decided gift, read-only
- Suggestion thread: title, URL, price per suggestion. Vote button (thumbs up) on each. Vote count visible. Members can add, edit, delete their own suggestions.
- Buyer assignment: any member can assign any member as buyer. Shown as a dropdown or member picker.
- Once a buyer is assigned: buyer sees "Mark as decided" on each suggestion

**Decided**
- Decided gift card shown prominently
- Buyer sees split editor: each contributor listed with their share. Equal default populated automatically. Buyer can adjust individual amounts.
- Buyer sees bank detail input field (for the notification email)
- "Mark as purchased" button — disabled until decided gift, buyer, bank details, and splits are all present (enforced at db level too)

**Purchased**
- Contribution overview visible to all members
- Each contributor shown with their amount and status: Unpaid / Made
- Contributor sees "I've paid" button on their own row
- Buyer sees "Mark as received" on any row
- Buyer sees "Close and archive" button at any point

**Done**
- Summary: decided gift, total, contribution breakdown
- Fully read-only; accessible from instance history

### Join `/join/[invite_token]`
- Shows occasion name and recipient
- Name + email input (phone optional)
- One tap to join — no account creation
- Redirects to occasion view

---

## Auth

No traditional auth. Members are identified by email. A Supabase magic link gives access to all occasions they belong to. Join links are public UUIDs — anyone with the link can join. Tokens are regeneratable to invalidate old links.

---

## Notifications (v1 — email via Resend)

| Trigger | Recipients |
|---|---|
| New gift suggestion added | All members |
| Gift marked as decided | All members |
| Buyer assigned | All members |
| Gift marked as purchased | All contributors — includes amount owed, buyer name, buyer bank details |
| Contribution marked as made | Buyer |
| Instance archived (done) | All members |
| New annual instance created | All members |

The purchased notification is the most important email in the product. It must clearly state: what was bought, what each contributor owes, who to pay, and the buyer's bank details.

### v2 — WhatsApp (planned, not v1)
Twilio WhatsApp Business API. Requires Meta Business Account approval. Members who provide a phone number can opt in. Do not block v1 on this.

---

## Permissions

All members:
- Add, edit, delete their own gift suggestions
- Vote on any suggestion (multiple allowed)
- Assign any member as buyer (or reassign at any time)
- Mark their own contribution as made
- Leave the occasion

Buyer only:
- Mark a suggestion as decided (or revert to planning)
- Edit splits
- Enter bank details
- Mark as purchased
- Mark any contribution as received
- Close and archive the instance

---

## Recurrence

Annual occasions auto-generate a new instance on 1 January each year via pg_cron. The new instance inherits group membership, starts in Planning, and stores a reference to the previous year's decided gift for the reference card.

When editing a recurring occasion (e.g. changing the recipient name or recurrence date), the member is presented with: **Edit this instance only** or **Edit this and all future instances**. Past instances are never modified.

Members can also trigger a new instance manually from the occasion view.

---

## Tech stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js (App Router) | Mobile-first SSR; consistent with other projects |
| Database | Supabase (Postgres + pg_cron) | Real-time for suggestion thread; magic link auth; cron for annual instances |
| Email | Resend | Simple transactional API; already in use |
| Hosting | Vercel | Zero-config Next.js deployment |
| Design system | Clean (typeui.sh skill) | Minimal, legible, low visual noise — right for a family-facing utility |
| WhatsApp (v2) | Twilio | Only viable path to WhatsApp Business API |

---

## MVP scope (v1)

**In:**
- Create occasion (one-off or annual)
- Join via invite link (no account creation)
- Add, edit, delete gift suggestions
- Vote on suggestions (thumbs up, multiple allowed)
- Assign buyer (auto-creates equal splits)
- Buyer marks gift as decided
- Buyer adjusts splits if needed
- Buyer enters bank details per occasion
- Buyer marks as purchased (locks everything, snapshots contributions, triggers notification)
- Contribution overview with self-serve and buyer-override marking
- Buyer closes and archives instance
- Email notifications via Resend
- Auto-instance creation for annual occasions (pg_cron)
- Reference card for previous year's gift
- Instance history inline on occasion view
- Invite token regeneration

**Out of scope for v1:**
- WhatsApp notifications
- Payment processing
- Native mobile app
- Per-member notification preferences
- Removing another member (leave only)

---

## Build order

1. Supabase schema + magic link auth
2. Join via invite link
3. Create occasion (one-off, then recurring)
4. Instance view — planning state (suggestions + votes + buyer assignment + equal split initialisation)
5. Decided state — buyer marks gift, adjusts splits, enters bank details
6. Purchased — lock data, snapshot contributions, send notification email (Resend)
7. Purchased view — contribution overview, self-serve + buyer-override marking
8. Close and archive (done state)
9. Instance history inline on occasion view
10. pg_cron annual instance creation + reference card
