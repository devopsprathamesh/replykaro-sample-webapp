# ReplyKaro — Instagram Comment-to-DM Automation

A production-ready SaaS MVP that automatically sends Instagram DMs when someone comments a trigger keyword on your post. Built with Next.js 16, Prisma 7, BullMQ, and Meta Graph API.

---

## How It Works

```
Follower comments "LINK" on your post
        ↓
Meta sends webhook → POST /api/webhook/instagram
        ↓
Signature verified → Job pushed to BullMQ (Redis)
        ↓
Next.js returns 200 immediately
        ↓
Worker picks up job → matches keyword → sends DM via Graph API
        ↓
Result logged to AutomationLog table
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 App Router |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| ORM | Prisma 7 (pg adapter) |
| Database | PostgreSQL 16 |
| Queue | BullMQ + Redis 7 |
| Auth | NextAuth v5 (Facebook OAuth / JWT) |
| State | TanStack Query v5 |
| Validation | Zod |
| Encryption | CryptoJS AES |
| Logger | Winston |
| Container | Docker + Docker Compose |

---

## Quick Start (Local)

### Prerequisites
- Node.js 20+
- Docker + Docker Compose
- A Meta Developer account (see [Meta Setup](#meta-developer-setup) below)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local` — minimum required values:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=<run: openssl rand -base64 32>
DATABASE_URL=postgresql://replykaro:replykaro@localhost:5432/replykaro
REDIS_URL=redis://localhost:6379
FACEBOOK_CLIENT_ID=<your Meta App ID>
FACEBOOK_CLIENT_SECRET=<your Meta App Secret>
META_APP_ID=<your Meta App ID>
META_APP_SECRET=<your Meta App Secret>
META_WEBHOOK_VERIFY_TOKEN=<any random string>
ENCRYPTION_KEY=<exactly 32 characters e.g. replykaro-32char-encrypt-key!!>
```

### 3. Start infrastructure

```bash
docker compose up postgres redis -d
```

### 4. Push database schema

```bash
npm run db:push
```

### 5. Start the web app

```bash
npm run dev
```

### 6. Start the worker (separate terminal)

```bash
npm run dev:worker
```

### 7. Expose webhook for local testing

```bash
npx ngrok http 3000
# Copy the https URL → use in Meta Developer Console
# Webhook URL: https://xxxx.ngrok.io/api/webhook/instagram
```

Open [http://localhost:3000](http://localhost:3000)

---

## Meta Developer Setup

> **What you need before starting:**
> - A personal Facebook account
> - An Instagram account switched to **Business** or **Creator** mode
> - That Instagram account linked to a **Facebook Page** you manage
>
> All three are required. Personal Instagram accounts cannot receive webhooks or send DMs via the API.

---

### PART A — Prepare Your Instagram Account

#### A1 — Switch Instagram to a Professional Account

Your Instagram account must be Business or Creator type (not Personal).

1. Open the **Instagram app** on your phone
2. Go to your **Profile** (bottom right)
3. Tap the **hamburger menu** (top right) → **Settings and privacy**
4. Scroll down → tap **"Account type and tools"**
5. Tap **"Switch to Professional Account"**
6. Choose **Creator** (for content creators, influencers) or **Business** (for brands, companies)
7. Select a category → tap **Done**

Your account is now a Professional account. This is required for the Instagram Graph API to work.

#### A2 — Create a Facebook Page (if you don't have one)

You need a Facebook Page to act as the bridge between Facebook Login and your Instagram account.

1. Open [facebook.com](https://facebook.com) in your browser
2. In the left sidebar click **"Pages"**
3. Click **"Create new Page"**
4. Enter a Page name (e.g. your brand name or your own name)
5. Choose a category (e.g. "Blogger", "Digital Creator", "Software")
6. Click **"Create Page"**

#### A3 — Connect Instagram to Your Facebook Page

This is the link that allows the Graph API to access your Instagram through Facebook.

1. Go to your **Facebook Page**
2. Click **"Settings"** (left sidebar or top right gear icon)
3. In the left menu click **"Linked accounts"** (or "Instagram" depending on your view)
4. Click **"Connect account"** under Instagram
5. Log in with your Instagram credentials
6. Confirm the connection

After this, your Instagram Business account is linked to your Facebook Page. The API will find it automatically when you log into ReplyKaro.

---

### PART B — Create a Meta Developer App

#### B1 — Log In to Meta for Developers

1. Open [developers.facebook.com](https://developers.facebook.com) in your browser
2. You will see the homepage with a **"Get Started"** button in the top-right corner
3. Click **"Get Started"**
4. Log in with your **personal Facebook account** (the same one that owns the Page above)
5. You may be asked to:
   - Verify your phone number
   - Accept the Meta Platform Policies — read and click **"Accept"**
   - Complete a short developer registration form
6. After completing registration, you will be taken back to the homepage
7. Now you will see **"My Apps"** in the top-right corner instead of "Get Started"
8. Click **"My Apps"**

#### B2 — Create a New App

1. On the My Apps page, click the **"Create App"** button (top right, blue button)
2. **Screen: "What do you want your app to do?"**
   - You will see options like: "Authenticate and request data from users", "Set up Facebook Login", "Access the Conversions API", "Other"
   - Select **"Other"**
   - Click **"Next"**
3. **Screen: "Select an app type"**
   - You will see: Consumer, Business, Gaming
   - Select **"Business"**
   - Click **"Next"**
4. **Screen: "Provide basic information"**
   - **App name:** Type `ReplyKaro` (or any name you prefer)
   - **App contact email:** Your email address (pre-filled from your Facebook account)
   - **Business portfolio:** Leave blank — click **"I don't want to connect a business portfolio yet"** link if it appears, or just leave the dropdown empty
   - Click **"Create App"**
5. Facebook will ask you to **re-enter your Facebook password** for security — enter it and confirm
6. You will now land on the **App Dashboard** — this is your app's control panel

#### B3 — Get Your App ID and App Secret

These two values are the credentials your ReplyKaro app uses to talk to Facebook.

1. In the **left sidebar** click **"Settings"** → then click **"Basic"**
2. At the very top of the Basic Settings page you will see:
   - **App ID** — a long number like `1234567890123456`
   - **App Secret** — shown as `••••••••••••` (hidden)
3. Copy the **App ID** — paste it in your `.env.local` as:
   ```
   FACEBOOK_CLIENT_ID=1234567890123456
   META_APP_ID=1234567890123456
   ```
4. To reveal the **App Secret**:
   - Click the **"Show"** button next to the masked secret
   - Facebook will ask you to enter your Facebook password again
   - The secret will appear — copy it immediately
   - Paste it in your `.env.local` as:
   ```
   FACEBOOK_CLIENT_SECRET=your_app_secret_here
   META_APP_SECRET=your_app_secret_here
   ```
5. While still on the Basic Settings page, scroll down and fill in:
   - **App Domains:** type `localhost` and press Enter
   - **Privacy Policy URL:** `http://localhost:3000` (for development)
   - **Terms of Service URL:** `http://localhost:3000` (for development)
6. Click **"Save Changes"** at the bottom

> **Security warning:** Never share your App Secret publicly. Never commit it to Git. It goes only in `.env.local` which is gitignored.

---

### PART C — Add Products to Your App

#### C1 — Add Facebook Login

Facebook Login is what allows users to click "Continue with Facebook" in your ReplyKaro app.

1. In the left sidebar scroll down to find **"Add Product"** and click it
2. You will see a grid of products — find **"Facebook Login"** and click **"Set Up"**
3. You will be asked "How are you using Facebook Login?"
   - Click **"Web"**
4. A Quickstart wizard appears:
   - **Site URL:** type `http://localhost:3000`
   - Click **"Save"**
   - Click **"Continue"** on each step — you can skip the code samples, we don't need them
5. Now in the left sidebar you will see **"Facebook Login"** expanded — click **"Settings"** under it
6. On the Facebook Login Settings page:
   - Find **"Valid OAuth Redirect URIs"**
   - Click the input field and type:
     ```
     http://localhost:3000/api/auth/callback/facebook
     ```
   - Press Enter or click outside the field to confirm the URI
   - When you go to production, you will add your production URL here too, e.g.:
     ```
     https://yourdomain.com/api/auth/callback/facebook
     ```
7. Make sure **"Client OAuth Login"** is toggled **ON**
8. Make sure **"Web OAuth Login"** is toggled **ON**
9. Click **"Save Changes"**

#### C2 — Add Instagram Product

This product is required to access the Instagram Graph API for reading posts, comments, and sending DMs.

1. In the left sidebar click **"Add Product"** again
2. Find **"Instagram"** in the product list and click **"Set Up"**
3. You will be taken to the Instagram API setup page
4. No additional configuration is needed here at this stage — adding the product is enough to unlock the Instagram permissions
5. You will now see **"Instagram"** in your left sidebar

#### C3 — Add Webhooks Product

Webhooks are how Instagram notifies your app in real-time when someone comments on your post.

1. In the left sidebar click **"Add Product"**
2. Find **"Webhooks"** and click **"Set Up"**
3. You will see a dropdown with various objects — we will configure this after getting a public URL (see Step D below)

---

### PART D — Configure Permissions

#### D1 — Understanding Permissions

Your app needs to request specific permissions from users when they log in. Here is what each one does:

| Permission | What it does | Required for |
|---|---|---|
| `email` | Read user's email address | Storing user in database |
| `public_profile` | Read name, profile picture | Showing user info in dashboard |
| `pages_show_list` | See which Facebook Pages the user manages | Finding their connected Instagram |
| `pages_read_engagement` | Read Page posts and activity | Syncing post data |
| `pages_manage_metadata` | Subscribe the Page to webhooks | Receiving comment events |
| `instagram_basic` | Read Instagram profile, media, and posts | Showing posts in dashboard |
| `instagram_manage_comments` | Read comments on posts | Detecting keyword triggers |
| `instagram_manage_messages` | **Send direct messages** | The core DM automation feature |

#### D2 — In Development Mode (for testing)

Good news: while your app is in **Development mode**, all permissions work automatically for:
- The Facebook account that created the app (you — the Admin)
- Anyone you add as a Tester or Developer in App Roles

You do NOT need Meta App Review to test all features with your own account. This means you can build and test the entire flow right now.

#### D3 — For Production (real users)

When you switch to **Live mode** so other people can use your app, Meta requires you to submit for App Review for advanced permissions. Specifically:
- `instagram_manage_messages` (sending DMs) requires App Review with a video demo
- Basic permissions like `email` and `public_profile` do NOT need review
- App Review typically takes 5-10 business days

---

### PART E — Add Test Users

Since your app is in Development mode, only specific users can log in to it.

#### E1 — You (the App Creator) Can Already Log In

The Facebook account that created the app is automatically an **Admin** — you can log in to ReplyKaro right away with no extra steps.

#### E2 — Add Other People as Testers

If you want other people to test your app before going Live:

1. In the left sidebar click **"App Roles"** → **"Roles"**
2. Scroll down to the **"Testers"** section
3. Click **"Add Testers"**
4. Type the Facebook name or email of the person you want to add
5. Click **"Submit"**
6. The invited person must:
   - Go to [developers.facebook.com](https://developers.facebook.com)
   - Click the bell/notification icon at the top
   - Accept the tester invitation

---

### PART F — Set Up Webhooks for Local Development

Webhooks require your app to be accessible from the internet. During local development, we use **ngrok** to create a temporary public URL that tunnels to your `localhost:3000`.

#### F1 — Start Your App

Make sure your ReplyKaro app is running:

```bash
# Terminal 1
npm run dev

# Terminal 2
npm run dev:worker
```

#### F2 — Install and Start ngrok

```bash
# Install ngrok (one time)
npm install -g ngrok
# OR download from https://ngrok.com/download

# Start tunnel
ngrok http 3000
```

You will see output like:
```
Forwarding  https://abc123def456.ngrok.io -> http://localhost:3000
```

Copy the `https://` URL (e.g. `https://abc123def456.ngrok.io`).

#### F3 — Configure Webhook in Meta Dashboard

1. In the left sidebar click **"Webhooks"**
2. In the dropdown at the top of the page, select **"Instagram"**
3. Click **"Subscribe to this object"**
4. A dialog will appear — fill in:
   - **Callback URL:**
     ```
     https://abc123def456.ngrok.io/api/webhook/instagram
     ```
     (replace with your actual ngrok URL)
   - **Verify Token:** Choose any random string, for example:
     ```
     replykaro-webhook-secret-2024
     ```
     Paste the same value in your `.env.local` as `META_WEBHOOK_VERIFY_TOKEN`
5. Click **"Verify and Save"**
   - Meta will send a GET request to your webhook URL
   - Your running app will respond with the challenge value
   - If it succeeds, the dialog will close and you'll see your webhook listed
   - If it fails: check your app is running, ngrok is running, and the URL is correct
6. After saving, you will see the Instagram object in the webhooks list
7. Click **"Add Subscriptions"** next to the Instagram entry
8. In the dialog that appears, check **`comments`**
9. Click **"Save"**

#### F4 — Subscribe Your Page to Your App

This final step links your specific Facebook Page (and therefore your Instagram) to receive webhook events from your app.

1. In your ReplyKaro app, go to **Settings** page
2. Click **"Connect Instagram via Facebook"**
3. Log in and authorize the permissions
4. After connecting, your app will automatically call the Facebook API to subscribe your Page to your app's webhooks

> **Important ngrok limitation:** The free ngrok URL changes every time you restart ngrok. Each time you restart, you must update the Callback URL in the Meta Webhooks dashboard. Consider using a fixed subdomain with a paid ngrok plan, or deploy to a server for more stable webhook testing.

---

### PART G — Test the Full Flow

Once everything is set up, here is how to verify it works end-to-end:

1. **Log in** to ReplyKaro at `http://localhost:3000`
2. Go to **Settings** → Connect your Instagram account
3. Go to **Posts** → click **"Sync Posts"** → your Instagram posts should appear
4. Click **"Configure"** on any post
5. Set **Trigger Keyword:** `TEST`
6. Set **Reply Message:** `Hello! This is an automated DM reply.`
7. Click **"Save & Enable"**
8. Now go to Instagram (on your phone or browser)
9. Find that same post and leave a comment: `TEST`
10. Within a few seconds, you should receive a DM from your own account

If the DM arrives — your entire automation pipeline is working correctly.

If the DM doesn't arrive, check:
- **Worker terminal** — look for job processing logs
- **Activity Logs** page in your dashboard — shows what happened
- **ngrok terminal** — shows if the webhook POST was received
- **Meta Webhooks** — check "Recent Deliveries" to see if Meta sent the event

---

### PART H — Going to Production

When you are ready to launch for real users:

#### H1 — Deploy Your App

Deploy ReplyKaro to a public URL (Railway, Render, VPS, etc.) — see [Docker Deployment](#docker-deployment) section.

#### H2 — Update Meta Dashboard Settings

1. **Settings → Basic:**
   - Update **App Domains** to your real domain
   - Update **Privacy Policy URL** to a real privacy policy page
   - Update **Terms of Service URL**

2. **Facebook Login → Settings:**
   - Add your production redirect URI:
     ```
     https://yourdomain.com/api/auth/callback/facebook
     ```

3. **Webhooks:**
   - Update Callback URL to:
     ```
     https://yourdomain.com/api/webhook/instagram
     ```
   - Re-verify

#### H3 — Submit for App Review

1. Left sidebar → **App Review → Permissions and Features**
2. For each permission you need for real users, click **"Request"**
3. For `instagram_manage_messages` you will need to provide:
   - A **detailed description** of how you use the permission
   - A **screencast video** showing the feature working (comment → DM flow)
   - Your **Privacy Policy URL**
4. Submit and wait 5–10 business days for Meta's review

#### H4 — Switch to Live Mode

1. At the top of the App Dashboard, find the **"App Mode"** toggle
2. Switch from **"Development"** to **"Live"**
3. Confirm the switch

Now any Facebook/Instagram user can log in and use ReplyKaro — not just your test users.

---

## Environment Variables

| Variable | Description | Example |
|---|---|---|
| `NEXTAUTH_URL` | Full URL of your deployment | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | 32+ char random secret for JWT signing | `openssl rand -base64 32` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host/db` |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379` |
| `FACEBOOK_CLIENT_ID` | Meta App ID | `123456789` |
| `FACEBOOK_CLIENT_SECRET` | Meta App Secret | `abc123...` |
| `META_APP_ID` | Same as App ID | `123456789` |
| `META_APP_SECRET` | Same as App Secret | `abc123...` |
| `META_WEBHOOK_VERIFY_TOKEN` | Any random string — must match Meta dashboard | `replykaro-webhook-secret-2024` |
| `ENCRYPTION_KEY` | Exactly 32 chars — used to AES-encrypt access tokens | `replykaro-32char-key-here!!!!!` |
| `META_GRAPH_API_VERSION` | Graph API version (default: v21.0) | `v21.0` |
| `WORKER_CONCURRENCY` | Parallel DM jobs (default: 5) | `5` |
| `QUEUE_MAX_RETRIES` | BullMQ retry count on failure (default: 3) | `3` |

---

## Available Scripts

```bash
npm run dev              # Start Next.js dev server
npm run dev:worker       # Start BullMQ DM worker (loads .env.local automatically)
npm run build            # Production build
npm run start            # Start production server
npm run db:push          # Push schema to DB (no migration file, good for dev)
npm run db:migrate       # Create + apply migration (dev)
npm run db:migrate:deploy # Apply migrations (production)
npm run db:studio        # Open Prisma Studio GUI at localhost:5555
npm run db:generate      # Regenerate Prisma client after schema changes
```

---

## Project Structure

```
.
├── app/
│   ├── api/
│   │   ├── auth/[...nextauth]/   # NextAuth route handlers
│   │   ├── automations/          # GET list, POST create
│   │   ├── automations/[id]/     # PATCH update, DELETE
│   │   ├── dashboard/            # GET stats
│   │   ├── logs/                 # GET activity logs (paginated)
│   │   ├── posts/                # GET posts (with optional sync)
│   │   ├── user/instagram/       # GET/POST/DELETE IG account
│   │   └── webhook/instagram/    # GET verify, POST receive
│   ├── dashboard/
│   │   ├── automations/          # Automations list + toggle
│   │   ├── logs/                 # Activity log table
│   │   ├── posts/                # Instagram posts grid
│   │   └── settings/             # Account & token status
│   └── login/                    # Facebook OAuth login page
├── components/
│   ├── automation/               # AutomationModal (keyword + reply config)
│   ├── dashboard/                # Sidebar, Topbar, DashboardOverview
│   ├── posts/                    # PostsGrid, PostCard
│   ├── shared/                   # Providers (QueryClient + Session), LoginCard
│   └── ui/                       # shadcn/ui components
├── lib/
│   ├── auth.ts                   # Full NextAuth config (with Prisma adapter)
│   ├── auth.config.ts            # Edge-safe NextAuth config (for proxy.ts)
│   ├── config.ts                 # Env validation with Zod
│   ├── logger.ts                 # Winston logger
│   ├── prisma.ts                 # Prisma client singleton (pg adapter)
│   ├── redis.ts                  # IORedis singleton
│   ├── meta/
│   │   ├── client.ts             # Base fetch wrapper for Graph API
│   │   └── instagram.ts          # Posts, DM, token exchange, webhooks
│   ├── queue/
│   │   └── dmQueue.ts            # BullMQ queue definition + enqueue helper
│   ├── security/
│   │   ├── encryption.ts         # AES encrypt/decrypt for access tokens
│   │   └── webhook.ts            # Meta HMAC-SHA256 signature verification
│   └── services/
│       ├── automationService.ts  # Business logic: rules CRUD + stats
│       └── instagramService.ts   # Connect, sync posts, disconnect IG
├── prisma/
│   └── schema.prisma             # DB schema (7 models)
├── prisma.config.ts              # Prisma 7 CLI config (loads .env.local)
├── types/
│   ├── index.ts                  # Shared TypeScript types
│   └── next-auth.d.ts            # Session type augmentation
├── workers/
│   ├── dmWorker.ts               # BullMQ processor: match keyword → send DM
│   └── start.ts                  # Worker entrypoint
├── proxy.ts                      # Route protection (Next.js 16 middleware)
├── Dockerfile                    # Web container
├── Dockerfile.worker             # Worker container
└── docker-compose.yml            # 4-service stack
```

---

## Docker Deployment

```bash
# Copy and fill env
cp .env.example .env.local

# Build and start all services
docker compose up --build -d

# Run DB migrations
docker compose exec web npx prisma migrate deploy

# View logs
docker compose logs -f web worker
```

| Service | Port | Description |
|---|---|---|
| `web` | 3000 | Next.js application |
| `worker` | — | BullMQ DM processor |
| `postgres` | 5432 | PostgreSQL database |
| `redis` | 6379 | Redis job queue |

---

## Deploy to Railway / Render

### Railway
1. Push to GitHub → New Railway project from repo
2. Add **PostgreSQL** plugin → copy `DATABASE_URL`
3. Add **Redis** plugin → copy `REDIS_URL`
4. Set all env vars from `.env.example`
5. Build command: `npm run build`
6. Start command: `npx prisma migrate deploy && node .next/standalone/server.js`
7. Add a second service (same repo) for the worker:
   - Start: `npx tsx workers/start.ts`
   - Same env vars

### Render
1. Create **Web Service** → Build: `npm install && npm run build`
2. Start: `npx prisma migrate deploy && node .next/standalone/server.js`
3. Add PostgreSQL + Redis add-ons
4. Create a **Background Worker** service for `npx tsx workers/start.ts`

---

## Security Features

- **Webhook signature** — HMAC-SHA256 verification on every incoming webhook
- **Token encryption** — Facebook access tokens stored AES-256 encrypted in DB
- **Input validation** — Zod schemas on all API routes and forms
- **Job deduplication** — BullMQ `jobId` prevents the same comment being processed twice
- **Idempotent worker** — Checks `commentId` in DB before sending DM
- **Route protection** — `proxy.ts` blocks unauthenticated access to all dashboard routes
- **JWT sessions** — Stateless sessions, no DB hit on every request

---

## Troubleshooting

**Login shows `ClientFetchError`**
→ `FACEBOOK_CLIENT_ID` or `FACEBOOK_CLIENT_SECRET` are still placeholder values in `.env.local`. Replace with real values from Meta dashboard → Settings → Basic. Restart `npm run dev`.

**`db:push` fails with "url property is required"**
→ `prisma.config.ts` must be in the project **root** (not inside `prisma/` folder). Also ensure `.env.local` exists with a valid `DATABASE_URL`.

**Worker fails with "DATABASE_URL is not set"**
→ Always use `npm run dev:worker` (passes `--env-file=.env.local` automatically). Do not run `npx tsx workers/start.ts` directly.

**Webhook verification fails in Meta dashboard**
→ Ensure `npm run dev` is running, ngrok is running and the URL matches, `META_WEBHOOK_VERIFY_TOKEN` in `.env.local` matches exactly what you typed in the Meta dashboard, and your app is on `localhost:3000`.

**DMs not being sent**
→ Check worker logs in the terminal. Check the **Activity Logs** page in the dashboard. Verify the automation rule is `ACTIVE`. Ensure your Meta app has `instagram_manage_messages` permission. In development mode, you can only DM accounts that are Admins/Testers of your Meta app.

**"No Instagram Business account found" error**
→ Your Instagram account must be Business or Creator type (not Personal), and it must be connected to a Facebook Page you manage. See Part A of the Meta Setup above.

**ngrok webhook stops working**
→ Free ngrok URLs expire or change. Restart ngrok, copy the new URL, and update the Webhook Callback URL in Meta Developer Console → Webhooks.

See [`daytodayreadme.md`](daytodayreadme.md) for full maintenance, scaling, and operations guide.
