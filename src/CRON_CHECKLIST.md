# ✅ Setup Checklist

Print this out or keep it open while you set up!

---

## Part 1: cron-job.org Account

- [ ] **Account Created**
  - Signed up at https://cron-job.org
  - Email verified
  - Logged in successfully

---

## Part 2: Cron Job Creation

### Job #1: Morning (8am PT)

- [ ] **Job Created**
  ```
  Title: Morning Snapshot (or similar)
  URL: https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot
  ```

- [ ] **Schedule Set**
  ```
  Frequency: Every day
  Time: 8:00 AM
  Timezone: Pacific Time (GMT-8)
  ```

- [ ] **Headers Configured**
  ```
  Header name: X-Cron-Secret
  Header value: campfinder-cron-2024
  ```

- [ ] **Request Method**
  ```
  Method: GET (not POST)
  ```

- [ ] **Notifications Set**
  ```
  ✓ On failure only
  ✗ On success (unchecked)
  Email: your-email@example.com
  ```

- [ ] **Job Enabled**
  ```
  Status: ✓ Enabled (green)
  ```

---

### Job #2: Noon (12pm PT)

- [ ] **Job Created**
  ```
  Title: Noon Snapshot (or similar)
  URL: https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot
  ```

- [ ] **Schedule Set**
  ```
  Frequency: Every day
  Time: 12:00 PM
  Timezone: Pacific Time (GMT-8)
  ```

- [ ] **Headers Configured**
  ```
  Header name: X-Cron-Secret
  Header value: campfinder-cron-2024
  ```

- [ ] **Request Method**
  ```
  Method: GET
  ```

- [ ] **Notifications Set**
  ```
  On failure only
  ```

- [ ] **Job Enabled**
  ```
  Status: ✓ Enabled
  ```

---

### Job #3: Evening (8pm PT)

- [ ] **Job Created**
  ```
  Title: Evening Snapshot (or similar)
  URL: https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot
  ```

- [ ] **Schedule Set**
  ```
  Frequency: Every day
  Time: 8:00 PM (20:00)
  Timezone: Pacific Time (GMT-8)
  ```

- [ ] **Headers Configured**
  ```
  Header name: X-Cron-Secret
  Header value: campfinder-cron-2024
  ```

- [ ] **Request Method**
  ```
  Method: GET
  ```

- [ ] **Notifications Set**
  ```
  On failure only
  ```

- [ ] **Job Enabled**
  ```
  Status: ✓ Enabled
  ```

---

## Part 3: Testing

- [ ] **Manual Test Run**
  - Clicked ▶️ Play button on one job
  - Got green checkmark
  - Status shows `200 OK`
  - Response body contains `"success": true`

- [ ] **Check History**
  - Execution appears in History tab
  - Duration is reasonable (<30 seconds)
  - No error messages

- [ ] **All 3 Jobs Listed**
  - See all 3 jobs in dashboard
  - All marked as "Enabled"
  - Correct times displayed

---

## Part 4: Verification

- [ ] **Backend Working**
  - Test URL with curl:
    ```bash
    curl -H "X-Cron-Secret: campfinder-cron-2024" \
      "https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot"
    ```
  - Returns `{"success": true}`

- [ ] **Check Newly Available Sites**
  ```bash
  curl "https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/newly-available"
  ```
  - Returns data (may be empty at first)

---

## Part 5: Monitoring (After 24 hours)

- [ ] **First Scheduled Run Executed**
  - Check at 8am, 12pm, or 8pm PT
  - Job executed automatically
  - No failure notifications received

- [ ] **Data Appears**
  - Check admin panel for snapshots
  - Newly available sites section updating

- [ ] **All 3 Jobs Running Daily**
  - History shows 3 executions per day
  - All executions successful

---

## 🎯 Success Metrics

After 24 hours, you should see:

- ✅ **3 successful cron executions per day**
- ✅ **Green checkmarks in cron-job.org history**
- ✅ **No error emails**
- ✅ **Snapshot data in admin panel**
- ✅ **Newly available sites detected** (when sites become available)

---

## 📝 Your Configuration

Fill this in for reference:

```
Supabase Project ID: fsrxwrjvjkmywnvlpecn

Snapshot URL:
https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot

Cron Secret: campfinder-cron-2024

Setup Date: _________
First Successful Run: _________

cron-job.org email: _________________________
```

---

## 🚨 Red Flags

If you see any of these, something needs fixing:

- ❌ **401 Unauthorized** → Header mismatch, check `X-Cron-Secret`
- ❌ **404 Not Found** → Wrong URL, check spelling
- ❌ **500 Server Error** → Backend issue, check Supabase logs
- ❌ **Job marked "Disabled"** → Enable it
- ❌ **Wrong timezone** → Should be Pacific Time (GMT-8)
- ❌ **No executions in history** → Job not running, check schedule

---

## 🎉 When Everything Works

You'll see:

- ✅ Green checkmarks in cron-job.org
- ✅ `200 OK` status codes
- ✅ Regular execution times (8am, 12pm, 8pm)
- ✅ No failure emails
- ✅ Data appearing on your site

**Congratulations! Your automated campsite scanner is live! 🏕️**

---

**Setup Time:** ~10 minutes  
**Monthly Cost:** $0  
**Maintenance:** None (set it and forget it)
