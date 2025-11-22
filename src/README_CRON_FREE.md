# 🏕️ Free Automatic Snapshot System - Complete Guide

**Zero-cost solution for automatic campsite availability scanning**

---

## 🎯 What This Does

Automatically scans Recreation.gov and ReserveCalifornia **3 times per day** to find campsites that just became available.

**Perfect for finding:**
- 🎟️ Cancellations (someone's cancelled trip = your opportunity!)
- 🆕 New sites released
- 📅 Last-minute availability

**Cost:** $0/month forever (no credit card needed!)

---

## 📚 Documentation Quick Links

| Document | When to Use |
|----------|-------------|
| **QUICK_START.md** | 5-minute express setup |
| **CRON_SETUP.md** | Detailed step-by-step guide |
| **CRON_CHECKLIST.md** | Printable setup checklist |
| **TROUBLESHOOTING.md** | Something not working? |
| **ARCHITECTURE.md** | How it all works (visual) |

---

## ⚡ Quick Start (Choose Your Speed)

### 🏃 Express (5 Minutes)
**I know what I'm doing, just tell me what to do:**

👉 Read: **QUICK_START.md**

### 🚶 Guided (10 Minutes)
**I want step-by-step instructions with explanations:**

👉 Read: **CRON_SETUP.md**

### 📋 Checklist (10 Minutes)
**I want to print something and check off boxes:**

👉 Read: **CRON_CHECKLIST.md**

---

## 🔧 What You'll Need

### Required (Free!)
- [ ] cron-job.org account (free, no credit card)
- [ ] Supabase project (already set up)
- [ ] 5-10 minutes

### Already Have
- [x] Supabase backend (already configured)
- [x] Recreation.gov API access (already set up)
- [x] Backend snapshot endpoint (already coded)

---

## 🎓 How It Works (Simple Version)

```
1. cron-job.org (free service)
   └─ Triggers your Supabase backend at 8am, 12pm, 8pm Pacific
   
2. Supabase Backend (free tier)
   └─ Fetches data from Recreation.gov & ReserveCalifornia
   └─ Compares with yesterday's snapshot
   └─ Finds sites that just became available
   
3. Your Website (free!)
   └─ Shows "Newly Available Sites" to users
   └─ Updates automatically every 5 minutes
```

**Total cost: $0** 🎉

---

## 🚀 Setup Overview

### Part 1: Create cron-job.org Account (1 min)
1. Sign up at https://cron-job.org
2. Verify email
3. Done!

### Part 2: Create 3 Cron Jobs (10 min)
1. Create morning job (8am PT)
2. Create noon job (12pm PT)
3. Create evening job (8pm PT)
4. Set headers & timezone
5. Enable all jobs

### Part 3: Test & Verify (1 min)
1. Trigger manual test
2. Check for 200 OK response
3. Done!

**Total: ~12 minutes** ⏱️

---

## 🎯 What Gets Configured

### 3 Cron Jobs in cron-job.org
```
Job 1: Morning (8am PT)
└─ URL: https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot
└─ Header: X-Cron-Secret: campfinder-cron-2024

Job 2: Noon (12pm PT)
└─ Same URL, same header, different time

Job 3: Evening (8pm PT)
└─ Same URL, same header, different time
```

**That's it! No other files or services needed.**

---

## 🔐 Security

### Protected by Secret Header

cron-job.org sends:
```
X-Cron-Secret: campfinder-cron-2024
```

Backend checks:
```typescript
if (request.headers.get('X-Cron-Secret') !== 'campfinder-cron-2024') {
  return 401 Unauthorized
}
```

**Result:** Nobody can trigger snapshots without your secret! 🔒

---

## 📊 Resource Usage

### cron-job.org (Free Tier)
```
Plan: Free Forever
Jobs: 3 of 100 (3% used)
Invocations: 90/month (unlimited)
Cost: $0
```

### Supabase (Free Tier)
```
Plan: Free
Edge Function Calls: 90/month
Limit: 500,000/month
Usage: 0.018%
Storage: ~10 MB
Limit: 500 MB
Cost: $0
```

**Total Monthly Cost: $0** 💰

---

## 📈 Scaling Up (Future)

Want more frequent scans?

### Option 1: Add More Cron Jobs (Free!)
```
Current: 3 scans/day
You could do: 24 scans/day (every hour)
Still free: 24 × 30 = 720/month (well within limits!)
```

### Option 2: Scan More Regions
```
Current: All regions (one scan)
You could: Separate scans per region
Still free: Under 500K invocations/month
```

**For 99% of users, free tier is perfect!**

---

## ✅ Success Checklist

After setup, you should see:

- [ ] 3 cron jobs showing in cron-job.org
- [ ] All 3 jobs marked as "Enabled"
- [ ] Timezone set to Pacific Time
- [ ] Manual test returns 200 OK
- [ ] Newly available sites appear (when sites become available)
- [ ] No 401 or 404 errors

**All checked? You're done!** 🎉

---

## 🐛 Common Issues & Quick Fixes

### "401 Unauthorized"
**Fix:** Check header is `X-Cron-Secret: campfinder-cron-2024`

### "404 Not Found"
**Fix:** Verify URL is exactly:
```
https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot
```

### "No newly available sites"
**Fix:** Wait 24-48 hours, this might be normal

### "Cron jobs not running"
**Fix:** Check jobs are Enabled, verify timezone is Pacific

**More help:** Read `TROUBLESHOOTING.md`

---

## 📞 Support Resources

### Self-Help (Recommended)
1. **TROUBLESHOOTING.md** - Most issues covered here
2. **CRON_SETUP.md** - Detailed setup guide
3. **ARCHITECTURE.md** - Understand how it works

### Service Documentation
- **cron-job.org:** https://cron-job.org/en/documentation/
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions

### Testing Tools
```bash
# Test your backend
curl -H "X-Cron-Secret: campfinder-cron-2024" \
  "https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot"

# Check newly available sites
curl "https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/newly-available"
```

---

## 🎯 Next Steps

### Ready to Set Up?

**Choose your path:**

1. **🏃 Fast track:** Open `QUICK_START.md`
2. **🚶 Guided:** Open `CRON_SETUP.md`
3. **📋 Checklist:** Open `CRON_CHECKLIST.md`

### Already Set Up?

**Check health:**

1. **cron-job.org History:** Check execution logs
2. **Test Endpoint:** Run curl command above
3. **Check Website:** Visit newly available sites section

### Want to Learn More?

**Deep dive:**

1. **ARCHITECTURE.md** - Visual diagrams & data flow
2. **Backend code** - `/supabase/functions/server/snapshot.tsx`

---

## 🌟 What Users Will See

### On Your Homepage

**"Newly Available Sites" Section:**
```
🏕️ Newly Available Sites

Found 12 campsites that just became available!

┌─────────────────────────────────────────────┐
│ Yosemite Valley - Site A-142               │
│ Yosemite National Park                     │
│ Just became available 2 hours ago          │
│ $35/night • Book Now →                     │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ Madison Campground - Site 89               │
│ Yellowstone National Park                 │
│ Just became available 4 hours ago          │
│ $25/night • Book Now →                     │
└─────────────────────────────────────────────┘

[More sites...]
```

### Auto-Refreshes
- Updates every 5 minutes
- No page reload needed
- Always shows latest cancellations

---

## 💬 FAQ

### How often do snapshots run?
**3 times per day:** 8am, 12pm, and 8pm Pacific Time

### How long until I see data?
**24-48 hours** for meaningful results (need comparison baseline)

### What if no sites show up?
**Normal!** Means no sites became available. Check back later.

### Can I change the schedule?
**Yes!** Edit cron jobs in cron-job.org to any time/frequency.

### Does this cost money?
**No!** Everything uses free tiers. $0/month forever.

### Is it reliable?
**Yes!** cron-job.org has been around since 2007. Very stable.

### Can I scan more often?
**Yes!** Free tier allows up to 1-minute intervals.

### What happens if Recreation.gov is down?
**Snapshot fails gracefully.** Next scheduled run will try again.

### How much data is stored?
**~10 MB total.** Old snapshots auto-delete after 5 days.

---

## 🏆 Why This System is Great

### For Campers
✅ Find cancellations instantly  
✅ Get notified of new availability  
✅ Book faster than competitors  
✅ Never miss an opening

### For You (Site Owner)
✅ Zero monthly cost  
✅ Fully automated  
✅ Minimal maintenance  
✅ Scales easily  
✅ Professional feature

### For Developers
✅ Well documented  
✅ Easy to modify  
✅ Clear architecture  
✅ Debugging tools included

---

## 📅 Timeline

### Day 0 (Today)
- [ ] Read documentation
- [ ] Set up cron jobs
- [ ] Test manually
- [ ] ✅ System running!

### Day 1
- First snapshots executing automatically
- Building baseline data

### Day 2
- Comparison algorithm active
- Detecting newly available sites
- Users seeing results!

### Day 7+
- Fully optimized
- 4-5 days of comparison data
- Maximum detection accuracy

---

## 🎉 You're Ready!

Everything is documented and ready. Choose your next step:

1. **⚡ Quick Setup** → Open `QUICK_START.md` (5 min)
2. **📖 Full Guide** → Open `CRON_SETUP.md` (10 min)
3. **✅ Checklist** → Open `CRON_CHECKLIST.md` (10 min)
4. **🔧 Having Issues?** → Open `TROUBLESHOOTING.md`
5. **🧠 Want to Learn?** → Open `ARCHITECTURE.md`

**Let's build your campsite finder! 🏕️**

---

**System Version:** 3.0 (Direct cron-job.org → Supabase)  
**Last Updated:** November 22, 2024  
**License:** Use freely for your campsite finder!  
**Cost:** $0/month forever 💚
