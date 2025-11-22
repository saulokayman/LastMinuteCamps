# 🏗️ Snapshot System Architecture

Visual guide to how the automatic snapshot system works.

---

## 🔄 How It Works (Simple View)

```
┌─────────────────┐
│  cron-job.org   │  ← Free cron service
│  3x daily       │
└────────┬────────┘
         │
         │ HTTP GET with X-Cron-Secret header
         │
         ▼
┌─────────────────────────────────────────────┐
│ Supabase Backend (Edge Function)           │
│ https://fsrxwrjvjkmywnvlpecn.supabase.co  │
│ /functions/v1/make-server-908ab15a/        │
│ cron/snapshot                               │
└────────┬────────────────────────────────────┘
         │
         │ 1. Fetch current availability
         │
         ▼
┌─────────────────┐
│ Recreation.gov  │  ← Real API data
│ + ReserveCal    │
└─────────────────┘
         │
         │ 2. Save snapshot
         │
         ▼
┌─────────────────┐
│ Supabase DB     │  ← KV store (snapshots)
│ (Storage)       │
└────────┬────────┘
         │
         │ 3. Compare with yesterday
         │
         ▼
┌─────────────────┐
│ Newly Available │  ← Sites that just opened up!
│ Sites           │
└─────────────────┘
         │
         │ 4. Display to users
         │
         ▼
┌─────────────────┐
│ Your Website    │  ← Users see the magic!
│ (Frontend)      │
└─────────────────┘
```

**That's it! Direct and simple.**

---

## 📅 Timeline Example

### Day 1 - Monday 8:00 AM
```
Snapshot #1: Take picture of all campsites
├─ Yosemite Site A: Reserved ❌
├─ Yosemite Site B: Available ✅
└─ Yellowstone Site C: Reserved ❌

Result: Baseline created, no comparisons yet
```

### Day 1 - Monday 12:00 PM
```
Snapshot #2: Take another picture
├─ Yosemite Site A: Reserved ❌
├─ Yosemite Site B: Available ✅
└─ Yellowstone Site C: Available ✅ ← CHANGED!

Compare with 8am:
└─ Yellowstone Site C was reserved, now available!
   → ADD TO "Newly Available" list 🎉
```

### Day 1 - Monday 8:00 PM
```
Snapshot #3: Evening check
├─ Yosemite Site A: Available ✅ ← CHANGED!
├─ Yosemite Site B: Available ✅
└─ Yellowstone Site C: Available ✅

Compare with 12pm AND 8am:
└─ Yosemite Site A just became available!
   → ADD TO "Newly Available" list 🎉
```

### Day 2 - Tuesday 8:00 AM
```
Now we have 24 hours of data!
Can compare with yesterday's snapshots.
More accurate cancellation detection.
```

---

## 🔐 Security Flow

```
┌─────────────────────────────────────────────────┐
│              cron-job.org Request               │
│  GET /cron/snapshot                             │
│  Header: X-Cron-Secret: campfinder-cron-2024   │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│         Supabase Backend (Security Check)       │
│                                                 │
│  1. Check X-Cron-Secret header                  │
│  2. If wrong → Return 401 Unauthorized ❌       │
│  3. If correct → Execute snapshot ✅            │
└─────────────┬───────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────────┐
│           Fetch Data from APIs                  │
│  - Recreation.gov                               │
│  - ReserveCalifornia                            │
└─────────────────────────────────────────────────┘

Protected! Can't be triggered without the secret.
```

---

## 💾 Data Storage Structure

### Snapshot Key Format
```
snapshot:YYYY-MM-DD:HH
```

**Examples:**
```
snapshot:2024-11-22:08  ← Monday 8am snapshot
snapshot:2024-11-22:12  ← Monday 12pm snapshot
snapshot:2024-11-22:20  ← Monday 8pm snapshot (20:00)
```

### Snapshot Value (JSON)
```json
{
  "date": "2024-11-22",
  "hour": "08",
  "timestamp": "2024-11-22T08:00:15.123Z",
  "sites": [
    {
      "id": "rec-123456",
      "name": "Yosemite Site A",
      "park": "Yosemite National Park",
      "available": false,
      "price": 35
    },
    {
      "id": "rec-789012",
      "name": "Yellowstone Site B",
      "park": "Yellowstone",
      "available": true,
      "price": 25
    }
  ],
  "stats": {
    "total_sites": 150,
    "available": 45,
    "reserved": 105
  }
}
```

### Newly Available Sites Key
```
newly-available-sites
```

### Newly Available Sites Value (JSON)
```json
{
  "lastUpdated": "2024-11-22T12:05:23.456Z",
  "sites": [
    {
      "id": "rec-789012",
      "name": "Yellowstone Site B",
      "park": "Yellowstone",
      "detectedAt": "2024-11-22T12:05:23.456Z",
      "previousState": "reserved",
      "currentState": "available",
      "bookingUrl": "https://recreation.gov/...",
      "price": 25
    }
  ]
}
```

---

## 🔄 Comparison Algorithm

### Step 1: Get Current Availability
```javascript
const currentSites = await fetchFromAPIs()
// Example: [A: reserved, B: available, C: available]
```

### Step 2: Load Previous Snapshots
```javascript
const yesterday = await getSnapshot('2024-11-21:08')
const fourHoursAgo = await getSnapshot('2024-11-22:04')
// Compare against 1-4 days ago (whichever exists)
```

### Step 3: Find Changes
```javascript
for (site in currentSites) {
  if (site.available === true) {
    // Check if it was reserved before
    if (wasReservedBefore(site, previousSnapshots)) {
      // 🎉 This is a newly available site!
      newlyAvailable.push(site)
    }
  }
}
```

### Step 4: Store Results
```javascript
await saveSnapshot(currentSites)
await saveNewlyAvailable(newlyAvailable)
```

---

## 📊 Data Retention

### Snapshot Retention: 5 Days
```
Day 1: snapshot:2024-11-22:08,12,20  ✅ Keep
Day 2: snapshot:2024-11-23:08,12,20  ✅ Keep
Day 3: snapshot:2024-11-24:08,12,20  ✅ Keep
Day 4: snapshot:2024-11-25:08,12,20  ✅ Keep
Day 5: snapshot:2024-11-26:08,12,20  ✅ Keep
Day 6: snapshot:2024-11-27:08,12,20  ✅ Keep (old ones auto-delete)
```

### Why 5 Days?
- **Memory efficient**: Don't store forever
- **Comparison window**: Can look back 4 days
- **Automatic cleanup**: Old snapshots deleted
- **Storage cost**: Minimal KV storage usage

---

## 🕐 Cron Schedule (Pacific Time)

### Schedule Breakdown

| Time | UTC (Standard) | UTC (Daylight) | Purpose |
|------|---------------|----------------|---------|
| 8:00 AM PT | 4:00 PM | 3:00 PM | Morning releases |
| 12:00 PM PT | 8:00 PM | 7:00 PM | Midday cancellations |
| 8:00 PM PT | 4:00 AM+1 | 3:00 AM+1 | Evening changes |

### Why These Times?

**8:00 AM Pacific:**
- Recreation.gov releases new inventory
- Catch fresh site availability
- Beat the morning rush

**12:00 PM Pacific:**
- Lunch hour cancellations
- Mid-day changes
- Weekend trip cancellations

**8:00 PM Pacific:**
- Evening cancellations
- After-work booking changes
- Plans falling through

---

## 🚀 Performance Characteristics

### cron-job.org Request
```
HTTP GET Request: ~50-200ms
└─ DNS lookup: 20ms
└─ TLS handshake: 30ms
└─ Request sent: 10ms
└─ Waiting for response: 10-30s
```

### Backend Processing Time
```
Backend Snapshot: ~10-30 seconds
├─ Fetch Recreation.gov: 3-8s
├─ Fetch ReserveCalifornia: 3-8s
├─ Process data: 1-2s
├─ Load previous snapshots: 500ms
├─ Compare & detect new: 1-2s
├─ Save snapshot: 1-2s
└─ Save newly available: 500ms
```

### Database Operations
```
KV Store Performance:
├─ Get single key: ~50ms
├─ Set single key: ~100ms
├─ Get by prefix: ~200ms (3-15 keys)
└─ Total overhead: <1s
```

---

## 💰 Cost Analysis

### Free Tier Usage

**cron-job.org:**
- Cost: $0/month
- Jobs: 3 of 100 (3% used)
- Invocations: 90/month (unlimited)

**Supabase Edge Functions:**
- Cost: $0/month (if under limits)
- Invocations: 90/month
- Limit: 500,000/month
- Usage: 0.018% of quota

**Supabase Database (KV Store):**
- Storage: ~5-10 MB (5 days of snapshots)
- Free tier: 500 MB
- Usage: ~2% of quota

**Total Monthly Cost: $0** 🎉

---

## 🔍 Monitoring & Debugging

### Where to Check Logs

**1. cron-job.org Dashboard**
```
History Tab:
└─ Execution time: 2024-11-22 08:00:00 PT
└─ Status: 200 OK ✅
└─ Duration: 12.4s
└─ Response: {"success":true,"stats":{...}}
```

**2. Supabase Edge Function Logs**
```
Edge Functions → make-server-908ab15a → Logs:
└─ 08:00:15 - Starting snapshot at 2024-11-22T15:00:15Z
└─ 08:00:17 - Fetching Recreation.gov... 156 sites found
└─ 08:00:20 - Fetching ReserveCalifornia... 89 sites found
└─ 08:00:22 - Comparing with snapshot:2024-11-21:08
└─ 08:00:25 - Found 12 newly available sites
└─ 08:00:27 - Snapshot saved successfully
```

**3. Your Website Admin Panel**
```
Admin Panel → Snapshot Status Widget:
└─ Status: 🟢 Healthy
└─ Last Run: 2 hours ago
└─ Newly Available: 12 sites
└─ Next Run: In 2 hours
```

---

## 🎯 Success Indicators

After 24 hours, you should see:

- ✅ **3 successful cron executions per day**
- ✅ **Status 200 OK in cron-job.org history**
- ✅ **Snapshot keys in database** (snapshot:YYYY-MM-DD:HH)
- ✅ **Green status in admin dashboard** (if implemented)
- ✅ **Newly available sites showing up** (when sites become available)
- ✅ **No 401 or 500 errors**

---

## 🐛 Common Issues & Solutions

### Issue: 401 Unauthorized
**Cause:** `X-Cron-Secret` header mismatch  
**Fix:** 
1. Check cron-job.org header: `X-Cron-Secret: campfinder-cron-2024`
2. Check backend expects same value
3. Case-sensitive!

### Issue: 404 Not Found
**Cause:** Wrong URL  
**Fix:**
1. Verify URL is exactly: `https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot`
2. Check for typos
3. Ensure `https://` not `http://`

### Issue: No newly available sites
**Cause:** Not necessarily an error!  
**Reasons:**
- No sites actually became available (normal)
- Not enough snapshot history yet (wait 24-48h)
- All sites stayed in same state

**Verify it's working:**
```bash
curl -H "X-Cron-Secret: campfinder-cron-2024" \
  "https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot"
```
Should return `{"success":true,...}`

---

## 📚 Related Documentation

- **Setup Guide:** `CRON_SETUP.md` (full setup instructions)
- **Quick Start:** `QUICK_START.md` (5-minute version)
- **Checklist:** `CRON_CHECKLIST.md` (step-by-step)
- **Troubleshooting:** `TROUBLESHOOTING.md` (fix issues)

---

**Last Updated:** November 22, 2024  
**System Version:** 3.0 (Direct cron-job.org → Supabase)  
**Cost:** $0/month forever
