# 🎯 Free Cron Setup Guide (cron-job.org)

This guide shows you how to set up **free, automatic snapshot scanning** using cron-job.org to call your Supabase backend directly.

## 📋 What You Need

- [ ] Your Supabase project already set up
- [ ] 5 minutes of time
- [ ] A free cron-job.org account (no credit card)

---

## 🏗️ Architecture (Simple!)

```
┌─────────────────┐
│  cron-job.org   │  ← Free cron service
│  3x daily       │
└────────┬────────┘
         │
         │ HTTP GET with X-Cron-Secret header
         │
         ▼
┌─────────────────────────────────────────────────┐
│ Supabase Backend                                │
│ https://fsrxwrjvjkmywnvlpecn.supabase.co       │
│ /functions/v1/make-server-908ab15a/cron/snapshot│
└─────────────────────────────────────────────────┘
         │
         │ Fetches availability & saves snapshots
         │
         ▼
┌─────────────────┐
│ Recreation.gov  │
│ + ReserveCal    │
└─────────────────┘
```

**That's it! No Netlify needed.**

---

## Part 1: Create cron-job.org Account (1 minute)

### Step 1: Sign Up

1. Go to https://cron-job.org
2. Click **"Sign up"** (top right)
3. Enter email and create password
4. Verify your email
5. ✅ You now have a free account!

**Cost: $0/month (no credit card needed)**

---

## Part 2: Create Cron Jobs (3 minutes each)

You'll create **3 separate cron jobs** - one for each scan time.

### Job #1: Morning Snapshot (8am PT)

1. Click **"Cronjobs"** in the top menu
2. Click **"Create cronjob"** button
3. Fill in the form:

**Title:**
```
Campsite Morning Snapshot (8am PT)
```

**Address (URL):**
```
https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot
```

**Schedule:**
- Click **"Every day"**
- Time: `8:00 AM` (or `08:00`)
- Timezone: `(GMT-8:00) Pacific Time (US & Canada)` ← **IMPORTANT!**

**Request Settings:**
- Request method: `GET`
- Click **"Headers"** section to expand
- Click **"Add header"**
- Add this header:
  ```
  Header name: X-Cron-Secret
  Header value: campfinder-cron-2024
  ```

**Notification Settings:**
- Execution notifications: Check **"On failure only"**
- Email: Your email (so you get alerted if something breaks)
- Uncheck "On success" (to avoid spam)

4. Click **"Create cronjob"**
5. ✅ Morning snapshot is now scheduled!

---

### Job #2: Noon Snapshot (12pm PT)

Repeat the same steps with these changes:

**Title:**
```
Campsite Noon Snapshot (12pm PT)
```

**Address (URL):**
```
https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot
```
*(Same URL as morning)*

**Schedule:**
- Every day
- Time: `12:00 PM` (or `12:00`)
- Timezone: `(GMT-8:00) Pacific Time (US & Canada)`

**Headers:**
```
X-Cron-Secret: campfinder-cron-2024
```
*(Same header as morning)*

**Notifications:** On failure only

Click **"Create cronjob"** ✅

---

### Job #3: Evening Snapshot (8pm PT)

Repeat one more time:

**Title:**
```
Campsite Evening Snapshot (8pm PT)
```

**Address (URL):**
```
https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot
```
*(Same URL)*

**Schedule:**
- Every day
- Time: `8:00 PM` (or `20:00`)
- Timezone: `(GMT-8:00) Pacific Time (US & Canada)`

**Headers:**
```
X-Cron-Secret: campfinder-cron-2024
```

**Notifications:** On failure only

Click **"Create cronjob"** ✅

---

## Part 3: Verify All Jobs Are Created

In your cron-job.org dashboard, you should now see:

| Title | Execution time | Status |
|-------|---------------|--------|
| Campsite Morning Snapshot (8am PT) | Every day at 8:00 AM PT | ✅ Enabled |
| Campsite Noon Snapshot (12pm PT) | Every day at 12:00 PM PT | ✅ Enabled |
| Campsite Evening Snapshot (8pm PT) | Every day at 8:00 PM PT | ✅ Enabled |

**All 3 jobs should be green/enabled!**

---

## Part 4: Test Your Setup (2 minutes)

### Option 1: Manual Test in cron-job.org (Easiest)

1. In cron-job.org, find **"Campsite Morning Snapshot (8am PT)"**
2. Click the **▶️ Play button** (run now)
3. Wait 10-30 seconds
4. Click the **"History"** tab
5. You should see:
   - Status: `200 OK` ✅ (green checkmark)
   - Response body contains `"success": true`

**Success!** Your cron job is working.

---

### Option 2: Test with curl

```bash
curl -X GET \
  "https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot" \
  -H "X-Cron-Secret: campfinder-cron-2024"
```

**Expected response:**
```json
{
  "success": true,
  "message": "Snapshot completed",
  "date": "2024-11-22",
  "hour": "15",
  "stats": {
    "totalSites": 245,
    "available": 67,
    "newlyAvailable": 12
  }
}
```

---

## 🔧 Troubleshooting

### Problem: "401 Unauthorized"

**Cause:** Cron secret doesn't match

**Fix:**
1. Check your Supabase backend code expects: `campfinder-cron-2024`
2. Check cron-job.org header is: `X-Cron-Secret: campfinder-cron-2024`
3. Make sure header name is exact (case-sensitive)

---

### Problem: "404 Not Found"

**Cause:** Wrong URL

**Fix:**
1. Verify URL is exactly:
   ```
   https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot
   ```
2. Check for typos
3. Make sure it's `https://` not `http://`

---

### Problem: "CORS error" or "Preflight failed"

**Cause:** cron-job.org needs GET request, not POST

**Fix:**
1. In cron-job.org, edit the job
2. Set Request method to: **GET**
3. Save

---

### Problem: "Execution failed" or timeout

**Cause:** Backend is taking too long (>30 seconds)

**What to check:**
1. Check Supabase logs for errors
2. Recreation.gov API might be slow
3. Try again - might be temporary

---

## 📊 Monitoring Your Cron Jobs

### In cron-job.org Dashboard

**History Tab:**
- See all executions (success/failure)
- Response codes and response bodies
- Execution duration

**What to look for:**
- ✅ Green checkmark = Success
- ❌ Red X = Failed
- Duration should be 5-30 seconds

**Logs Tab:**
- Detailed execution logs
- Error messages if something breaks

**Email Notifications:**
- Get automatic alerts on failure
- Daily/weekly summary emails (optional)

---

## 💰 Cost Breakdown

| Service | Plan | Cost | What You Get |
|---------|------|------|--------------|
| cron-job.org | Free | $0/month | 100 cron jobs, unlimited invocations |
| Supabase Functions | Free | $0/month | 500K invocations/month |
| **Total** | | **$0/month** | ✅ Full automation |

**Monthly usage:**
- 3 scans/day × 30 days = **90 invocations/month**
- Well within all free tier limits!

**No credit card required!**

---

## 🚀 What Happens Now

1. **Every day at 8am, 12pm, and 8pm Pacific:**
   - cron-job.org calls your Supabase backend
   - Backend queries Recreation.gov & ReserveCalifornia
   - Available sites are saved to database
   - Sites that were reserved but are now available are flagged as "new"

2. **On your website:**
   - "Newly Available Sites" section shows sites that just opened up
   - These are campsites that had been reserved but are now bookable
   - Perfect for finding cancellations!

3. **Users can book:**
   - Direct links to Recreation.gov or ReserveCalifornia
   - Fresh availability data updated 3x daily

---

## 🎉 Success Checklist

- [ ] cron-job.org account created (free)
- [ ] All 3 cron jobs created
- [ ] All jobs set to correct times (8am, 12pm, 8pm PT)
- [ ] Timezone set to Pacific Time
- [ ] Headers configured with `X-Cron-Secret`
- [ ] All jobs **Enabled** (green status)
- [ ] Manual test run successful (200 OK response)
- [ ] Email notifications configured (failure only)

**All checked?** 🎊 You're done! Your campsite scanner is running automatically, 3 times per day, completely free!

---

## 📝 Common Questions

**Q: Can I change the scan times?**  
A: Yes! Edit each job in cron-job.org and change the time. Popular options:
- Early bird: 6am (catch overnight cancellations)
- Lunch hour: 12pm (catch morning cancellations)
- Evening: 8pm (catch afternoon cancellations)

**Q: Can I scan more frequently?**  
A: Absolutely! Free plan allows down to 1-minute intervals. You could:
- Scan every hour (24 scans/day)
- Scan every 15 minutes (96 scans/day)
- Still completely free!

**Q: What if I hit the limits?**  
A: You won't! At 3 scans/day:
- You use 90 invocations/month
- Supabase free tier: 500,000/month
- You're using 0.018% of your quota! 🎉

**Q: How reliable is cron-job.org?**  
A: Very! Been around since 2007, used by thousands of developers worldwide.

**Q: Can I get alerts when scans fail?**  
A: Yes! That's what the "On failure only" email notification does. You'll get an email if something breaks.

**Q: Can I pause the scans?**  
A: Yes! In cron-job.org, click the job and toggle it to "Disabled". Re-enable anytime.

---

## 🔍 Viewing Results

### Check Newly Available Sites

**On your website:**
```
https://your-site.com/
```
Scroll to "Newly Available Sites" section

**Via API:**
```bash
curl https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/newly-available
```

**In admin panel:**
```
https://your-site.com/admin
```
Check "Snapshot Status" widget

---

## 🎯 Next Steps

**After 24 hours:**
- Check cron-job.org history (should show 3 successful executions)
- Visit your website to see newly available sites
- Check admin dashboard for system health

**After 48 hours:**
- System has enough data for accurate comparisons
- Newly available site detection is fully optimized

**Ongoing:**
- Monitor cron-job.org history occasionally
- Check email for failure notifications
- Otherwise, set it and forget it! ✅

---

## 📞 Need Help?

**Check execution history:**
- cron-job.org → History tab → Look for errors

**Check backend logs:**
- Supabase Dashboard → Edge Functions → Logs

**Test manually:**
```bash
curl -H "X-Cron-Secret: campfinder-cron-2024" \
  "https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot"
```

**Still stuck?**
- Read `TROUBLESHOOTING.md`
- Check Supabase backend code
- Verify CRON_SECRET matches in backend

---

**Last Updated:** November 22, 2024  
**Estimated Setup Time:** 10 minutes  
**Difficulty:** Beginner-friendly ⭐⭐☆☆☆  
**Cost:** $0/month forever! 💚
