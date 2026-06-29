# ReplyKaro — Instagram Comment-to-DM Automation

A production-ready SaaS MVP that automatically sends Instagram DMs when someone comments a trigger keyword on your post.

## Architecture Overview

```
Browser → Next.js 15 App → PostgreSQL
                      ↓
               BullMQ (Redis) → DM Worker → Meta Graph API
```

**Flow:** Follower comments → Meta webhook → BullMQ queue → Worker sends DM → Logged

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 App Router |
| Language | TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| ORM | Prisma 7 (pg adapter) |
| Database | PostgreSQL 16 |
| Queue | BullMQ + Redis 7 |
| Auth | NextAuth v5 (Facebook OAuth) |

## Quick Start

```bash
# 1. Install
npm install

# 2. Configure
cp .env.example .env.local
# Edit .env.local with your values

# 3. Start infra
docker compose up postgres redis -d

# 4. Migrate DB
npm run db:push

# 5. Start app
npm run dev

# 6. Start worker (separate terminal)
npm run dev:worker

# 7. Expose webhook (ngrok)
npx ngrok http 3000
```

## Meta Developer Setup

1. Create app at developers.facebook.com (Business type)
2. Add Facebook Login product — request permissions:
   `email, public_profile, pages_show_list, pages_read_engagement, instagram_basic, instagram_manage_comments, instagram_manage_messages, pages_manage_metadata`
3. Add Webhooks product → Instagram object → subscribe to `comments` field
4. Webhook URL: `https://yourdomain.com/api/webhook/instagram`
5. Verify Token: value of `META_WEBHOOK_VERIFY_TOKEN` in your env

## Environment Variables

| Variable | Description |
|---|---|
| `NEXTAUTH_URL` | Full URL of your deployment |
| `NEXTAUTH_SECRET` | 32+ char random secret |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `FACEBOOK_CLIENT_ID` | Facebook App ID |
| `FACEBOOK_CLIENT_SECRET` | Facebook App Secret |
| `META_APP_ID` | Same as App ID |
| `META_APP_SECRET` | Same as App Secret |
| `META_WEBHOOK_VERIFY_TOKEN` | Random string matching Meta dashboard |
| `ENCRYPTION_KEY` | 32+ char key for token encryption |

## Docker

```bash
cp .env.example .env.local  # fill values
docker compose up --build -d
docker compose exec web npx prisma migrate deploy
```

Services: `web:3000`, `worker`, `postgres:5432`, `redis:6379`

## Project Structure

```
app/api/          # Route handlers (auth, webhook, automations, posts, logs)
app/dashboard/    # Dashboard pages (posts, automations, logs, settings)
components/       # UI components (sidebar, posts grid, automation modal)
lib/              # Core logic (auth, prisma, meta API, queue, services)
prisma/           # Schema + config
workers/          # BullMQ DM worker
```

## Security

- Webhook HMAC-SHA256 signature verification
- AES-encrypted access token storage
- Zod validation on all API routes
- BullMQ jobId deduplication (no double DMs)
- Idempotent worker (checks commentId before sending)
