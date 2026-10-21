# HotelFlexi Channel Manager — Deployment & Infrastructure Guide

---

## 1. Cloudflare Workers API Deployment
The API is deployed as a serverless Cloudflare Worker with Cloudflare D1 database binding:
- **Deploy Command**: `npm --workspace=@hotelflexi/api run deploy`
- **Wrangler Configuration**: `apps/api/wrangler.toml`
- **Database**: `hotelflexi-db` (`f742f4f6-b0c8-436f-9331-9cac7566e495`)
- **Remote Migrations**: `npx wrangler d1 migrations apply hotelflexi-db --remote`

---

## 2. Cron Reconciliation Job
A scheduled Cron trigger is configured in `wrangler.toml`:
```toml
[triggers]
crons = ["0 2 * * *"]
```
The scheduled handler runs every night at 02:00 UTC:
1. Recalculates physical room inventory vs. channel restrictions.
2. Identifies stale or failed sync jobs older than 6 hours and flags them.
3. Cleans up resolved reconciliation records older than 90 days.

---

## 3. Webhook Endpoints
Inbound OTA webhooks are served under:
`POST https://hotelflexi.divyansh-shukla.workers.dev/api/channel-manager/webhooks/:channelCode`
Example:
- `/api/channel-manager/webhooks/booking_com`
- `/api/channel-manager/webhooks/agoda`
- `/api/channel-manager/webhooks/expedia`
- `/api/channel-manager/webhooks/makemytrip`
