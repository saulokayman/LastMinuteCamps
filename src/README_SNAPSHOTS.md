# 📸 Automatic Campsite Snapshot System

> Automatically detect newly available campsites 3 times per day

## 🎯 What This Does

Tracks campsite availability across Recreation.gov and ReserveCalifornia.com to identify sites that were previously reserved but just became available due to cancellations or new releases.

## ⚡ Quick Setup

### For Netlify Users (Recommended)

```bash
# 1. Set environment variables in Netlify UI
SUPABASE_PROJECT_ID=your-project-id
CRON_SECRET=campfinder-cron-2024

# 2. Deploy
git push

# 3. Done! ✅
```

📖 **Full Guide:** [NETLIFY_QUICKSTART.md](NETLIFY_QUICKSTART.md)

### For Free Alternative

```bash
# 1. Sign up at cron-job.org (free)
# 2. Create 3 cron jobs
# 3. Point to your snapshot endpoint
```

📖 **Full Guide:** [CRON_SETUP.md](CRON_SETUP.md)

## 🕐 Schedule

| Time (PT) | Purpose | Why |
|-----------|---------|-----|
| 8:00 AM | New releases | Sites drop at 8am sharp |
| 12:00 PM | Cancellations | Lunch-time availability |
| 8:00 PM | Late changes | Evening cancellations |

## 🧠 How Detection Works

```
Day 1-4: Site #123 RESERVED ❌
Today:   Site #123 AVAILABLE ✅

Result: ⭐ Newly Available! (was reserved, now free)
```

The system compares today's availability with the past 1-4 days. If a site wasn't available before but is now, it's flagged as newly available.

## 📁 Files Overview

```
📦 Netlify Functions
├── netlify.toml                    # Netlify config
└── netlify/functions/
    ├── snapshot-morning.mts        # 8am snapshot
    ├── snapshot-noon.mts           # 12pm snapshot
    └── snapshot-evening.mts        # 8pm snapshot

📦 Backend (Supabase)
└── /supabase/functions/server/
    └── index.tsx                   # Snapshot logic & API

📦 Frontend Components
├── /components/NewlyAvailableSites.tsx   # User display
└── /components/admin/
    ├── AdminDashboard.tsx          # Admin panel
    └── SnapshotStatus.tsx          # Status widget

📚 Documentation
├── SETUP_COMPLETE.md               # 👈 Start here!
├── NETLIFY_QUICKSTART.md           # Netlify quick setup
├── NETLIFY_CRON_SETUP.md           # Netlify detailed guide
├── CRON_SETUP.md                   # Free alternatives
├── SNAPSHOT_SYSTEM.md              # Technical docs
└── README_SNAPSHOTS.md             # This file
```

## 🎨 User Experience

### Main Site
- "Newly Available Sites" section
- Shows sites with timestamps ("2h ago")
- Auto-refreshes every 5 minutes
- Direct booking links

### Admin Dashboard
- Real-time status monitoring
- Green/yellow/red health indicators
- Last snapshot time
- Manual test button
- Site count today

## 🔧 API Endpoints

### Trigger Snapshot (Cron)
```bash
GET /make-server-908ab15a/cron/snapshot
Headers: X-Cron-Secret: campfinder-cron-2024
```

### Get Newly Available (Public)
```bash
GET /make-server-908ab15a/newly-available
Returns: Array of newly available sites
```

## 📊 Data Storage

**Snapshots:**
- Key: `snapshot_YYYY-MM-DD_HH`
- Retention: 5 days
- Storage: Supabase KV

**Newly Available:**
- Key: `newly_available_YYYY-MM-DD`
- Retention: 5 days
- Updated 3x daily

## 🚦 Status Indicators

| Color | Meaning | Action |
|-------|---------|--------|
| 🟢 Green | Running | None needed |
| 🟡 Yellow | Waiting | Next run soon |
| 🔴 Red | Not configured | Set up cron |

## 🧪 Testing

### Quick Test
```bash
chmod +x test-snapshot.sh
./test-snapshot.sh
```

### Manual Test
```bash
curl "https://YOUR-PROJECT.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot" \
  -H "X-Cron-Secret: campfinder-cron-2024"
```

### Check Results
```bash
curl "https://YOUR-PROJECT.supabase.co/functions/v1/make-server-908ab15a/newly-available"
```

## 💰 Cost

### Netlify Scheduled Functions
- **Plan Required:** Pro ($19/month)
- **Invocations:** 3/day × 30 = 90/month
- **Well within limits**

### Free Alternative (cron-job.org)
- **Cost:** $0/month
- **Limits:** 10 free jobs
- **Usage:** 3 jobs needed

### Supabase
- **Free tier:** Sufficient
- **Edge Functions:** Free tier OK
- **KV Storage:** ~1 MB total

## 📈 Performance

- **API Calls:** ~90 Recreation.gov calls/day
- **Storage:** ~1 MB for 5 days
- **Function Time:** 30-60 seconds per snapshot
- **Efficiency:** Optimized for minimal resource use

## ⚙️ Configuration

### Required Environment Variables

**Netlify:**
```env
SUPABASE_PROJECT_ID=your-project-id
CRON_SECRET=campfinder-cron-2024
```

**Supabase:**
```env
RECREATION_GOV_API_KEY=your-api-key
CRON_SECRET=campfinder-cron-2024
```

### Optional Customization

**Change schedule:** Edit cron expressions in function files
**Change retention:** Modify cleanup logic in backend
**Add notifications:** Extend with email/SMS alerts

## 🎓 Learning Path

1. **Start:** [SETUP_COMPLETE.md](SETUP_COMPLETE.md)
2. **Quick Setup:** [NETLIFY_QUICKSTART.md](NETLIFY_QUICKSTART.md) or [CRON_SETUP.md](CRON_SETUP.md)
3. **Deep Dive:** [SNAPSHOT_SYSTEM.md](SNAPSHOT_SYSTEM.md)
4. **Admin Usage:** [ADMIN_GUIDE.md](ADMIN_GUIDE.md)

## ❓ FAQ

**Q: Why 3 times per day?**  
A: Catches the 8am release, midday cancellations, and evening changes.

**Q: Why compare with 1-4 days ago?**  
A: Catches sites that cycle through reservations, not just yesterday's.

**Q: How accurate is detection?**  
A: Very accurate. Sites must be unavailable in all past 4 days, then available now.

**Q: Does it work for ReserveCalifornia too?**  
A: Backend is ready. Currently focused on Recreation.gov, easy to extend.

**Q: Can I change the schedule?**  
A: Yes! Edit the cron expressions in function files.

**Q: What if I'm not on Netlify?**  
A: Use cron-job.org (free) or any cron service. See CRON_SETUP.md.

## 🐛 Common Issues

**Issue:** Functions not appearing  
**Fix:** Check Netlify Pro plan, verify netlify.toml

**Issue:** 401 Unauthorized  
**Fix:** Verify CRON_SECRET matches on both sides

**Issue:** No sites detected  
**Fix:** Wait 24-48 hours for meaningful comparisons

**Issue:** Wrong times  
**Fix:** Account for UTC timezone in cron expressions

## 🎉 Success Metrics

After setup, you should see:
- ✅ Green status in admin dashboard
- ✅ Snapshots running 3x daily
- ✅ Newly available sites appearing
- ✅ Users finding great campsites faster!

## 🚀 Next Level

Want to enhance? Consider:
- Email notifications for specific parks
- SMS alerts for newly available sites
- Historical trends and analytics
- Predictive availability modeling
- Multi-platform support (more than Recreation.gov)

## 📞 Support

- **Documentation:** Check all .md files in root
- **Test Script:** Run `./test-snapshot.sh`
- **Logs:** Netlify Functions or Supabase Edge Functions
- **Admin Panel:** `/admin.tsx` for real-time status

---

Built with ❤️ for campers who want the best sites!

**Ready to launch?** Start with [SETUP_COMPLETE.md](SETUP_COMPLETE.md)
