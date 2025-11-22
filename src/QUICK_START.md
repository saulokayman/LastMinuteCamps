# ⚡ Quick Start: 5-Minute Setup

Set up automatic campsite scans in 5 minutes. Zero cost.

---

## What You're Setting Up

**3 automatic scans per day** calling your Supabase backend directly (no Netlify needed).

---

## Step 1: Create cron-job.org Account (1 min)

1. Go to: https://cron-job.org/en/signup/
2. Enter email + password
3. Verify email
4. ✅ Done

---

## Step 2: Create 3 Cron Jobs (3 min)

For **each** of these 3 jobs, click **"Create cronjob"**:

### Job 1: Morning (8am PT)
```
Title: Morning Snapshot
URL: https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot
Schedule: Every day, 8:00 AM
Timezone: Pacific Time (GMT-8)
Request method: GET
Headers: X-Cron-Secret = campfinder-cron-2024
Notifications: On failure only
```

### Job 2: Noon (12pm PT)
```
Title: Noon Snapshot
URL: https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot
Schedule: Every day, 12:00 PM
Timezone: Pacific Time (GMT-8)
Request method: GET
Headers: X-Cron-Secret = campfinder-cron-2024
Notifications: On failure only
```

### Job 3: Evening (8pm PT)
```
Title: Evening Snapshot
URL: https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot
Schedule: Every day, 8:00 PM (20:00)
Timezone: Pacific Time (GMT-8)
Request method: GET
Headers: X-Cron-Secret = campfinder-cron-2024
Notifications: On failure only
```

---

## Step 3: Test (1 min)

In cron-job.org, click **▶️ Play button** next to any job.

**Expected result:** Green checkmark + status `200 OK`

---

## ✅ Done!

You now have:
- ✅ Automatic scans 3x daily
- ✅ Newly available sites detection
- ✅ Zero monthly cost
- ✅ Email alerts if something breaks

---

## 🚨 Troubleshooting

**401 Unauthorized?**
- Check header: `X-Cron-Secret: campfinder-cron-2024`

**404 Not Found?**
- Check URL is exactly: `https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot`

**Still stuck?**
- Read full guide: `CRON_SETUP.md`
- Or troubleshooting: `TROUBLESHOOTING.md`

---

**Cost:** $0/month  
**Time:** 5 minutes  
**Maintenance:** None!
