# Office Restock

A mobile-first web app for reporting office consumables that are running low.

**Flow:** a person scans one QR poster → the phone's built-in camera opens the
form → they pick an item (or describe a new one) and tap send → the request is
saved and the office admin gets a direct message in Microsoft Teams → the admin
tracks and resolves requests in a dashboard.

No app install and no in-app camera scanner: the QR code simply encodes the URL
of the form page, which every modern phone camera opens automatically.

---

## Stack

- **Next.js (App Router)** — public form + admin dashboard + API route
- **Supabase (Postgres + Auth)** — data and admin login, with Row Level Security
- **Microsoft Teams via Power Automate** — direct message to the admin
- **node-qrcode** — generates the single QR poster

---

## 1. Install

```bash
npm install
cp .env.example .env.local   # then fill in the values (see below)
```

## 2. Supabase

1. Create a free project at [supabase.com](https://supabase.com).
2. **SQL Editor → New query** → paste the contents of
   [`supabase/schema.sql`](supabase/schema.sql) → **Run**. This creates the
   `items` and `requests` tables, RLS policies, and a few seed items.
3. **Settings → API** → copy the **Project URL** and **anon public** key into
   `.env.local`:

   ```ini
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```

4. Create the admin login: **Authentication → Users → Add user** (enter the
   manager's email + a password, and tick "Auto Confirm"). That's the account
   used to sign into `/dashboard`.

> The public form uses the **anon** role, which (per the RLS policies) can only
> read active items and insert requests — it can't read the request history or
> edit items. Only the signed-in admin can.

## 3. Microsoft Teams — direct message to the admin

> ⚠️ Don't use the old Teams "Incoming Webhook" connector — Microsoft is
> retiring Office 365 Connectors (progressively disabled **May 18–22, 2026**).
> Use a **Power Automate Workflow** instead.

1. In Teams, open the **Workflows** app (or [Power Automate](https://make.powerautomate.com)).
2. Create a flow from the template **"Post to a channel when a webhook request
   is received"** — but change the action so it posts a **direct message**:
   - **Trigger:** _When a Teams webhook request is received_ → choose **"Anyone"**
     can trigger. Save once to reveal the generated **HTTP POST URL**.
   - **Action:** _Post card in a chat or channel_
     - **Post as:** `Flow bot`
     - **Post in:** `Chat with Flow bot`
     - **Recipient:** the office admin's email address
     - **Adaptive Card:** set this to the trigger's body. The app already
       sends a complete Adaptive Card payload, so map the card to the
       incoming request body (use `attachments[0].content` from the trigger,
       or paste a passthrough expression — see [`lib/teams.ts`](lib/teams.ts)).
3. Copy the generated HTTP POST URL into `.env.local`:

   ```ini
   TEAMS_WORKFLOW_URL=https://prod-XX.logic.azure.com/.../invoke?...
   ```

   This is a **server-side secret** — note there is no `NEXT_PUBLIC_` prefix, so
   it never reaches the browser.

> If the admin would rather get messages in a **Teams channel** instead of a
> DM, keep the template's default _Post in a channel_ action and pick the
> channel — everything else is identical.

## 4. Run it

```bash
npm run dev
```

- Public form: <http://localhost:3000/request>
- Admin dashboard: <http://localhost:3000/dashboard> (sign in with the user from
  step 2.4)

## 5. Generate the QR poster

Set `NEXT_PUBLIC_BASE_URL` in `.env.local` to your deployed URL, then:

```bash
npm run qr
# or override: npm run qr -- https://restock.yourcompany.com
```

This writes `qr/office-restock.png` and `.svg`. Drop the image into a poster
("Need something? Scan me 👇"), print it, and put copies in the kitchen, supply
room, and print room. They all point to the same form.

## 6. Deploy

Deploy to [Vercel](https://vercel.com) (free hobby tier works):

```bash
npx vercel
```

Add the same environment variables (`NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_BASE_URL`, `TEAMS_WORKFLOW_URL`)
in the Vercel project settings, then redeploy. Regenerate the QR with the
production URL.

---

## How it fits together

```text
QR poster ──scan──▶ /request (public form)
                         │ submit
                         ▼
                  /api/requests  ──insert──▶ Supabase (requests table)
                         │
                         └─POST card─▶ Power Automate ─DM─▶ Teams admin

Admin ──login──▶ /dashboard  ◀──reads/resolves── Supabase
```

## Notes & options

- **Anonymous by default.** The "Your name" field is optional, so reporting
  stays frictionless but the admin can follow up when a name is given.
- **One message per request.** If that gets noisy, switch the Power Automate
  flow to a scheduled daily digest (query the Supabase REST API for open
  requests on a timer) instead of posting on every submission.
- **Abuse protection.** The API route has a light in-memory per-IP rate limit.
  For a public-facing internal tool that's usually enough; tighten it (signed
  links, network restriction, captcha) only if you see spam.
- **Low-stock thresholds / auto-alerts** are intentionally out of scope for v1
  (they require tracking actual quantities). The model leaves room to add them
  later.
