# 👋 START HERE - Free Cron Setup

Welcome! You're about to set up **automatic campsite scanning** for $0/month using cron-job.org.

---

## ⚡ Choose Your Setup Method

### 🤖 Option 1: AUTOMATED (1 Minute) ⭐ RECOMMENDED

**Let a script do it for you!**

1. Create cron-job.org account (30 sec)
2. Get API key (30 sec)
3. Run: `node setup-cron-jobs.mjs YOUR_API_KEY` (10 sec)
4. Done! ✅

👉 **Follow: `AUTOMATED_SETUP.md`**

---

### 👨‍💻 Option 2: Manual (10 Minutes)

**Click through the website yourself.**

1. Create cron-job.org account
2. Manually create 3 cron jobs
3. Configure each one with URL, headers, timezone
4. Done! ✅

👉 **Follow: `QUICK_START.md` or `CRON_SETUP.md`**

---

## 🎯 What Both Methods Do

Same result - 3 cron jobs calling your Supabase backend:
- ✅ Scans 3 times per day automatically
- ✅ Detects newly available campsites
- ✅ Shows cancellations to users
- ✅ Updates every 5 minutes
- ✅ Zero maintenance required

### Zero Cost
- ✅ cron-job.org Free plan (100 jobs, unlimited runs)
- ✅ Supabase Free tier (500K function calls)
- ✅ No credit card needed anywhere
- ✅ **Total: $0/month forever**

---

## 🏗️ Simple Architecture

```
cron-job.org (free)
    ↓
    Calls your Supabase backend 3x daily
    ↓
Supabase fetches Recreation.gov & ReserveCalifornia
    ↓
Compares with yesterday's snapshot
    ↓
Shows newly available sites on your website
```

**No Netlify. No complex setup. Just works.**

---

## 🔧 Already Set Up? Quick Test

```bash
curl -H "X-Cron-Secret: campfinder-cron-2024" \
  "https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot"
```

Should return: `{"success": true, ...}`

---

## 📖 All Available Guides

| Document | Purpose | Time |
|----------|---------|------|
| **START_HERE.md** | You are here! Overview | 2 min read |
| **AUTOMATED_SETUP.md** | Automated setup script | 1 min setup |
| **QUICK_START.md** | Fast setup, minimal explanation | 5 min setup |
| **CRON_SETUP.md** | Complete step-by-step guide | 10 min setup |
| **CRON_CHECKLIST.md** | Printable checklist | 10 min setup |
| **TROUBLESHOOTING.md** | Fix common issues | As needed |
| **ARCHITECTURE.md** | How it all works (diagrams) | 10 min read |
| **README_CRON_FREE.md** | Complete reference | 15 min read |

---

## 🚀 Ready to Start?

**Pick your setup style:**

1. **Fast** → `AUTOMATED_SETUP.md` → 1 minute
2. **Fast** → `QUICK_START.md` → 5 minutes
3. **Guided** → `CRON_SETUP.md` → 10 minutes  
4. **Checklist** → `CRON_CHECKLIST.md` → 10 minutes

**Having issues?** → `TROUBLESHOOTING.md`

**Want to learn more?** → `ARCHITECTURE.md` or `README_CRON_FREE.md`

---

## ✅ Pre-Flight Checklist

Before you start, make sure you have:

- [ ] Supabase project is set up and running
- [ ] Recreation.gov API key configured
- [ ] Backend snapshot endpoint working
- [ ] 5-10 minutes of free time
- [ ] Coffee ☕ (optional but recommended)

**All set?** Pick a guide above and let's go! 🚀

---

## 🎉 What Happens After Setup

1. **cron-job.org calls your backend** 3x daily (8am, 12pm, 8pm PT)
2. **Backend scans** Recreation.gov & ReserveCalifornia
3. **Compares** with yesterday's snapshot
4. **Detects** newly available sites
5. **Your website shows** the magic to users!

---

**System:** Free Automatic Snapshot System  
**Cost:** $0/month  
**Setup Time:** 5-10 minutes  
**Maintenance:** Zero (set it and forget it!)

**Let's build your campsite finder! 🏕️**