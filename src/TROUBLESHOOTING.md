# 🔧 Troubleshooting Guide

Quick solutions to common issues with the cron-job.org snapshot system.

---

## 🚨 Quick Test

**Run this to test your setup:**

```bash
curl -H "X-Cron-Secret: campfinder-cron-2024" \
  "https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot"
```

### Expected Response (Good!)
```json
{
  "success": true,
  "message": "Snapshot completed",
  "date": "2024-11-22",
  "stats": {...}
}
```

### If you get an error, see below 👇

---

## ❌ Error: 401 Unauthorized

### What You See
```json
{
  "error": "Unauthorized"
}
```

### What It Means
The `X-Cron-Secret` header doesn't match.

### Fix #1: Check Your curl Command
Make sure you're sending the header correctly:

```bash
# ✅ CORRECT
curl -H "X-Cron-Secret: campfinder-cron-2024" \
  "https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot"

# ❌ WRONG (missing header)
curl "https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot"
```

### Fix #2: Check cron-job.org Header
1. Go to cron-job.org
2. Edit your cron job
3. Click **"Headers"** section
4. Should have exactly:
   ```
   Header name: X-Cron-Secret
   Header value: campfinder-cron-2024
   ```
5. Check for typos (case-sensitive!)
6. Save

### Fix #3: Check Backend Code
Your Supabase backend `/supabase/functions/server/snapshot.tsx` should expect:
```typescript
const cronSecret = Deno.env.get('CRON_SECRET') || 'campfinder-cron-2024';
```

---

## ❌ Error: 404 Not Found

### What You See
```
Page Not Found
```
or
```json
{
  "error": "Not Found"
}
```

### What It Means
The URL is wrong.

### Fix: Verify URL is Exactly This
```
https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot
```

**Common mistakes:**
- ❌ `http://` instead of `https://`
- ❌ Missing `/functions/v1/`
- ❌ Wrong project ID
- ❌ Typo in path

**In cron-job.org:**
1. Edit each job
2. Copy-paste the exact URL above
3. Save

---

## ❌ Error: 500 Server Error

### What You See
```json
{
  "error": "Internal Server Error"
}
```

### What It Means
Something went wrong in your Supabase backend.

### Fix: Check Supabase Logs
1. Go to Supabase Dashboard
2. **Edge Functions** → **make-server-908ab15a**
3. Click **Logs** tab
4. Look for red error messages

### Common 500 Causes

**Missing RECREATION_GOV_API_KEY:**
```
Error: RECREATION_GOV_API_KEY not configured
```
→ Add environment variable in Supabase

**API Timeout:**
```
Timeout waiting for Recreation.gov
```
→ Recreation.gov might be down, try again later

**Database Error:**
```
Error writing to KV store
```
→ Check Supabase database is running

---

## ⏰ Cron Jobs Not Running

### Issue
Jobs created but not executing on schedule.

### Fix #1: Check Job Status
In cron-job.org:
1. Go to **Cronjobs** tab
2. Each job should show:
   - ✅ **Enabled** (green)
   - Not "Disabled" (gray)

If disabled:
- Click the job
- Toggle to **Enable**
- Save

### Fix #2: Check Schedule
1. Edit job
2. Verify settings:
   - Morning: `8:00 AM`
   - Noon: `12:00 PM`
   - Evening: `8:00 PM` or `20:00`
3. Verify timezone: `Pacific Time (GMT-8)`
4. Save

### Fix #3: Test Manually
Click the **▶️ Play button** next to the job.

Should see:
- Status: `200 OK` (green checkmark)
- Response contains `"success": true`

If this works, the job is configured correctly and will run on schedule.

---

## 🕐 Jobs Run at Wrong Time

### Issue
Snapshots running at wrong time (e.g., 4am instead of 8am).

### Cause
Timezone is set to UTC instead of Pacific.

### Fix
1. Edit cron job in cron-job.org
2. Find **Timezone** dropdown
3. Select: `(GMT-8:00) Pacific Time (US & Canada)`
4. Save

**Note:** The system handles PST/PDT changes automatically!

---

## 📭 No Newly Available Sites Showing

### This Might Be Normal!

**Reason #1: Not Enough Time**
- System needs 24 hours to build baseline
- Comparisons start after second snapshot
- Wait 24-48 hours

**Reason #2: No Sites Became Available**
- If no campsites changed from reserved → available, nothing shows
- This is expected!
- Check back later or after next scan

**Reason #3: First Snapshot Still Running**
- Initial snapshot creates baseline only
- No comparisons yet
- Wait for second scan

### How to Verify It's Working

**Test 1: Manual Snapshot**
```bash
curl -H "X-Cron-Secret: campfinder-cron-2024" \
  "https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot"
```
Should return `{"success": true}`

**Test 2: Check History**
- Go to cron-job.org → History tab
- Should see successful executions
- Green checkmarks = working!

**Test 3: Check Newly Available Endpoint**
```bash
curl "https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/newly-available"
```
Returns current newly available sites (may be empty)

---

## 📧 Getting Too Many Emails

### Issue
cron-job.org sending emails for every execution.

### Fix
1. Edit each cron job
2. Find **Notifications** section
3. Settings should be:
   - ✓ **On failure only** (checked)
   - ✗ **On success** (unchecked)
4. Save

Now you only get emails when something breaks!

---

## 🔒 Security: Is My Endpoint Exposed?

### Issue
Worried about unauthorized people triggering snapshots.

### You're Already Protected! ✅

The backend requires the `X-Cron-Secret` header:
```typescript
if (request.headers.get('X-Cron-Secret') !== cronSecret) {
  return 401 Unauthorized
}
```

**Without the secret, all requests are rejected.**

### Extra Security (Optional)

Change the default secret:

1. Generate a random secret:
   ```bash
   openssl rand -base64 32
   ```

2. Update in Supabase environment variables:
   ```
   CRON_SECRET = your-new-secret-here
   ```

3. Update in cron-job.org (all 3 jobs):
   ```
   X-Cron-Secret = your-new-secret-here
   ```

4. Test again

---

## 🐌 Snapshots Taking Too Long

### Normal Execution Time
- Quick scans: 5-15 seconds
- Full scans: 15-30 seconds
- Maximum: 60 seconds

### If Taking >60 Seconds

**Possible causes:**
1. Recreation.gov API is slow
2. ReserveCalifornia timeout
3. Large amount of data to process

**Solutions:**
1. Check API status (not your problem if they're slow)
2. Try again later
3. Check Supabase logs for timeout errors

**In cron-job.org:**
- Increase timeout to 60 seconds
- Settings → Execution timeout → 60s

---

## 🆘 Still Stuck?

### Debugging Checklist

- [ ] cron-job.org account created
- [ ] All 3 cron jobs created
- [ ] All jobs are **Enabled** (not disabled)
- [ ] Timezone set to Pacific Time
- [ ] Request method is **GET**
- [ ] Header `X-Cron-Secret: campfinder-cron-2024` set
- [ ] Manual test returns 200 OK
- [ ] Waited at least 24 hours for data

### Get Detailed Logs

**Supabase Backend Logs:**
```
Supabase Dashboard → Edge Functions → make-server-908ab15a → Logs
```

**cron-job.org Execution History:**
```
cron-job.org → History tab
```

Look for:
- Error messages
- Response codes (should be 200)
- Execution duration
- Response body

---

## ✅ Health Check Commands

**Test Backend Directly:**
```bash
curl -H "X-Cron-Secret: campfinder-cron-2024" \
  "https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot"
```
Expected: `{"success": true}`

**Check Newly Available Sites:**
```bash
curl "https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/newly-available"
```
Expected: `{"lastUpdated": "...", "sites": [...]}`

**Verify Cron Job Status:**
- Go to cron-job.org
- Check History tab
- Should see green checkmarks

---

## Common Error Patterns

| Error | Diagnosis | Fix |
|-------|-----------|-----|
| 401 | Secret mismatch | Check `X-Cron-Secret` header |
| 404 | Wrong URL | Verify Supabase URL exactly |
| 500 | Backend error | Check Supabase logs |
| Timeout | API slow | Increase timeout, try later |
| No data | Too early | Wait 24-48 hours |
| Wrong time | Bad timezone | Set to Pacific Time |

---

## 📞 Need More Help?

1. **Re-read setup guide:** `CRON_SETUP.md`
2. **Check architecture:** `ARCHITECTURE.md` (how it works)
3. **Review checklist:** `CRON_CHECKLIST.md` (did you miss a step?)
4. **Test commands above:** Isolate the problem
5. **Check service logs:** Supabase + cron-job.org

---

**Last Updated:** November 22, 2024  
**Covers:** cron-job.org direct-to-Supabase setup
