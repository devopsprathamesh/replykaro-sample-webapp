# ReplyKaro — Day-to-Day Operations Guide

This guide covers everything you need to manage, maintain, deploy, and troubleshoot ReplyKaro in production.

---

## Table of Contents

1. [Daily Operations](#daily-operations)
2. [Deployment](#deployment)
3. [Database Management](#database-management)
4. [Worker Management](#worker-management)
5. [Token Refresh](#token-refresh)
6. [Monitoring](#monitoring)
7. [Troubleshooting](#troubleshooting)
8. [Scaling](#scaling)
9. [Backup & Recovery](#backup--recovery)

---

## Daily Operations

### Check System Health

```bash
# Are all containers up?
docker compose ps

# Any errors in the last hour?
docker compose logs --since 1h web worker | grep -i error

# How many jobs are in the queue?
docker compose exec redis redis-cli llen bull:instagram-dm:wait
```

### Check Today's DMs

```bash
# Count DMs sent today via psql
docker compose exec postgres psql -U replykaro -d replykaro -c \
  "SELECT COUNT(*) FROM automation_logs WHERE dm_sent = true AND created_at > NOW() - INTERVAL '24 hours';"
```

### Monitor the Queue

```bash
# Waiting jobs
docker compose exec redis redis-cli llen bull:instagram-dm:wait

# Active (processing) jobs
docker compose exec redis redis-cli llen bull:instagram-dm:active

# Failed jobs
docker compose exec redis redis-cli llen bull:instagram-dm:failed
```

---

## Deployment

### Option A: Docker Compose (VPS / Coolify / self-hosted)

```bash
# First deploy
git clone <repo>
cd replykaro-sample-webapp
cp .env.example .env.local
# Fill all env values in .env.local
docker compose up --build -d
docker compose exec web npx prisma migrate deploy

# Update (zero-downtime approach)
git pull
docker compose build web worker
docker compose up -d --no-deps web worker
docker compose exec web npx prisma migrate deploy
```

### Option B: Railway

1. Push repo to GitHub
2. Create new Railway project → "Deploy from GitHub repo"
3. Add **PostgreSQL** plugin → copy `DATABASE_URL` to env vars
4. Add **Redis** plugin → copy `REDIS_URL` to env vars
5. Set all env vars from `.env.example`
6. Set **Custom Start Command**: `npx prisma migrate deploy && node .next/standalone/server.js`
7. Add a second service (same repo) for the worker:
   - Start Command: `npx tsx workers/start.ts`
   - Same env vars
8. Set `NEXTAUTH_URL` to your Railway domain

### Option C: Render

1. Create **Web Service** from repo
2. Build Command: `npm install && npm run build && npx prisma generate`
3. Start Command: `npx prisma migrate deploy && node .next/standalone/server.js`
4. Add **PostgreSQL** database → copy connection string
5. Add **Redis** (Upstash or Render Redis) → copy URL
6. Create second **Background Worker** service for `npx tsx workers/start.ts`

### Option D: Coolify (self-hosted PaaS)

1. Add new resource → Docker Compose
2. Paste your `docker-compose.yml`
3. Set environment variables in Coolify UI
4. Deploy → Coolify handles routing + SSL

---

## Database Management

### Run Migrations

```bash
# Development (creates migration file)
npm run db:migrate

# Production (applies pending migrations)
npm run db:migrate:deploy

# Or inside Docker
docker compose exec web npx prisma migrate deploy
```

### Open Prisma Studio (DB GUI)

```bash
npm run db:studio
# Opens at http://localhost:5555
```

### Useful Queries

```sql
-- All active automation rules
SELECT u.email, ia.instagram_username, ar.trigger_keyword, ar.status
FROM automation_rules ar
JOIN users u ON ar.user_id = u.id
JOIN instagram_accounts ia ON ar.instagram_account_id = ia.id
WHERE ar.status = 'ACTIVE';

-- DM success rate last 7 days
SELECT
  DATE(created_at) as day,
  COUNT(*) FILTER (WHERE status = 'SUCCESS') as success,
  COUNT(*) FILTER (WHERE status = 'FAILED') as failed,
  COUNT(*) FILTER (WHERE status = 'SKIPPED') as skipped
FROM automation_logs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY 1 ORDER BY 1 DESC;

-- Tokens expiring in 7 days
SELECT instagram_username, token_expires_at
FROM instagram_accounts
WHERE token_expires_at < NOW() + INTERVAL '7 days'
  AND is_connected = true;
```

### Reset Database (⚠️ destructive)

```bash
docker compose exec postgres psql -U replykaro -d replykaro -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"
npm run db:migrate:deploy
```

---

## Worker Management

### View Worker Logs

```bash
docker compose logs -f worker
```

### Restart Worker

```bash
docker compose restart worker
```

### Clear Failed Jobs

```bash
# Via redis-cli
docker compose exec redis redis-cli del bull:instagram-dm:failed

# Or retry all failed jobs (BullMQ CLI)
npx bullmq retry-jobs instagram-dm --redis redis://localhost:6379
```

### Scale Workers (multiple instances)

In `docker-compose.yml`:
```yaml
worker:
  deploy:
    replicas: 3
```
Or run multiple worker containers with different names.

---

## Token Refresh

Facebook long-lived tokens expire after **60 days**. You need to prompt users to reconnect.

### Manual Check

```bash
# Find users with tokens expiring in 14 days
docker compose exec postgres psql -U replykaro -d replykaro -c \
  "SELECT u.email, ia.instagram_username, ia.token_expires_at
   FROM instagram_accounts ia JOIN users u ON ia.user_id = u.id
   WHERE ia.token_expires_at < NOW() + INTERVAL '14 days' AND ia.is_connected = true;"
```

### Automated Approach (add to cron)

Create `scripts/refresh-tokens.ts`:

```typescript
// Query accounts expiring in 7 days
// For each: fetch new long-lived token using current token
// Update DB with new token and expiry
// If refresh fails: set is_connected = false, email user
```

Run daily: `0 9 * * * npx tsx scripts/refresh-tokens.ts`

---

## Monitoring

### Key Metrics to Watch

| Metric | Normal | Alert |
|---|---|---|
| Queue depth (`wait`) | 0–50 | > 500 |
| Failed jobs | 0–5/day | > 50/day |
| Worker restarts | 0 | > 3/hour |
| DB connections | < 20 | > 80 |
| API 4xx errors | low | spike |
| Token expiry | > 14 days | < 7 days |

### View Application Logs

```bash
# All logs
docker compose logs -f

# Only errors
docker compose logs web worker 2>&1 | grep -i "error\|failed\|exception"

# Worker job failures
docker compose logs worker | grep "\[Worker\] Job failed"
```

### Simple Uptime Check

Add this to your monitoring service (UptimeRobot, BetterUptime):

- URL: `https://yourdomain.com/api/webhook/instagram?hub.mode=check`
- Expected: 403 (means the server is up and responding)

---

## Troubleshooting

### "No Instagram Business account found"

**Cause:** User's Facebook account is not linked to any page with an Instagram Business/Creator account.

**Fix:**
1. Ask user to connect Instagram to a Facebook Page in Meta Business Suite
2. Ensure the Instagram account type is "Business" or "Creator" (not Personal)
3. Re-authenticate

### Webhook not receiving events

**Checklist:**
1. Is `META_WEBHOOK_VERIFY_TOKEN` correct in both `.env.local` and Meta dashboard?
2. Is your server publicly accessible? (Use ngrok for local dev)
3. Is the webhook subscription active? Check Meta Developer Console → Webhooks
4. Did you subscribe to the `comments` field?
5. Check webhook delivery logs in Meta Developer Console

```bash
# Test webhook verification manually
curl "https://yourdomain.com/api/webhook/instagram?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test123"
# Should return: test123
```

### DMs not being sent

**Checklist:**
1. Check worker logs: `docker compose logs worker | grep "FAILED\|error"`
2. Check automation rule is `ACTIVE`
3. Check keyword matching — is it case-insensitive? Does comment contain the keyword?
4. Is the Instagram account still connected? Check Settings page
5. Is the token expired?
6. Meta permission issue: does your app have `instagram_manage_messages`?

```bash
# Check failed jobs
docker compose logs worker | grep "Job failed"

# Check automation logs in DB
docker compose exec postgres psql -U replykaro -d replykaro -c \
  "SELECT * FROM automation_logs WHERE status = 'FAILED' ORDER BY created_at DESC LIMIT 10;"
```

### "Module not found" on deploy

```bash
npm install
npm run db:generate
npm run build
```

### Database connection refused

```bash
# Is postgres running?
docker compose ps postgres

# Check logs
docker compose logs postgres

# Test connection
docker compose exec postgres pg_isready -U replykaro
```

### Redis connection issues

```bash
# Is redis running?
docker compose ps redis

# Ping test
docker compose exec redis redis-cli ping
# Should return: PONG
```

### NextAuth session issues

- Ensure `NEXTAUTH_URL` matches your actual deployment URL exactly (including https)
- Ensure `NEXTAUTH_SECRET` is at least 32 characters
- Clear cookies and try again
- In production, ensure `NEXTAUTH_URL` is set to the canonical domain (not a redirect)

### Build fails with TypeScript errors

```bash
npx tsc --noEmit 2>&1 | head -40
```

### Prisma migration fails

```bash
# Check migration status
npx prisma migrate status

# Reset if broken (dev only, destroys data)
npx prisma migrate reset

# Production: check which migration failed and fix manually
```

---

## Scaling

### Vertical Scaling

Increase Docker container resources in `docker-compose.yml`:

```yaml
worker:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 1G
```

### Horizontal Scaling (multiple workers)

Workers are stateless — you can run multiple instances. BullMQ handles distribution:

```bash
# Run 3 worker instances
docker compose up --scale worker=3 -d
```

### Database Connection Pooling

For high traffic, add PgBouncer in front of PostgreSQL:

```yaml
# Add to docker-compose.yml
pgbouncer:
  image: bitnami/pgbouncer:latest
  environment:
    POSTGRESQL_HOST: postgres
    POSTGRESQL_PORT: 5432
    PGBOUNCER_POOL_MODE: transaction
    PGBOUNCER_MAX_CLIENT_CONN: 200
```

### Rate Limiting

The worker has built-in rate limiting via BullMQ `limiter` (10 jobs/second). Adjust in `workers/dmWorker.ts`:

```typescript
limiter: {
  max: 10,     // max jobs
  duration: 1000, // per millisecond window
},
```

---

## Backup & Recovery

### Backup Database

```bash
# Full backup
docker compose exec postgres pg_dump -U replykaro replykaro > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore
docker compose exec -T postgres psql -U replykaro replykaro < backup_20240101_120000.sql
```

### Automated Daily Backup (cron)

```bash
# Add to crontab (crontab -e)
0 3 * * * cd /path/to/app && docker compose exec -T postgres pg_dump -U replykaro replykaro > /backups/db_$(date +\%Y\%m\%d).sql
```

### Backup Redis (optional — queue data only)

```bash
docker compose exec redis redis-cli BGSAVE
docker compose exec redis cat /data/dump.rdb > redis_backup.rdb
```

---

## Maintenance Checklist

### Weekly
- [ ] Check token expiry dates (< 14 days → notify users)
- [ ] Review failed jobs in queue
- [ ] Check disk space on server
- [ ] Review error logs

### Monthly
- [ ] Review and rotate `ENCRYPTION_KEY` if needed (requires re-encrypting all tokens)
- [ ] Update dependencies: `npm outdated`
- [ ] Check Meta Graph API version — deprecations
- [ ] Database backup test — restore and verify
- [ ] Review automation rule performance (match rates)

### After Code Deploy
- [ ] `npx prisma migrate deploy`
- [ ] Restart worker: `docker compose restart worker`
- [ ] Verify webhook is still responding
- [ ] Test one automation end-to-end

---

## Useful Commands Reference

```bash
# Start everything
docker compose up -d

# Stop everything
docker compose down

# Rebuild after code change
docker compose up --build -d web worker

# View all logs
docker compose logs -f

# Open DB shell
docker compose exec postgres psql -U replykaro -d replykaro

# Open Redis shell
docker compose exec redis redis-cli

# Run migration
docker compose exec web npx prisma migrate deploy

# Open Prisma Studio
npm run db:studio

# Check queue depth
docker compose exec redis redis-cli llen bull:instagram-dm:wait

# Restart worker
docker compose restart worker
```
