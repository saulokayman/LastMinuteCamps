# Cron Proxy Solution for Free Tier

## Problem
Supabase Edge Functions require an `Authorization` header with the anon key. However, **cron-job.org's free tier does NOT support custom headers**. This causes 401 errors when cron jobs try to trigger snapshots.

## Solution
Use a **proxy HTML page** that runs in the browser and adds the Authorization header for you!

## How It Works
```
cron-job.org → Your Site (/cron-proxy.html) → Supabase (with Authorization header)
```

The proxy page:
1. Gets called by cron-job.org (no auth needed - it's just a public webpage)
2. Runs JavaScript in the browser
3. Adds the Authorization header
4. Calls Supabase
5. Returns success! ✅

## Quick Setup

### Step 1: Test the Proxy Page Right Now

Open this URL in your browser (replace with YOUR actual site URL):
```
https://YOUR-SITE-URL.com/cron-proxy.html?secret=campfinder-cron-2024
```

You should see: **"✅ Snapshot completed successfully!"**

### Step 2: Update Your Cron Jobs

**Manual Method:**
1. Go to https://cron-job.org
2. Delete your existing 3 broken jobs
3. Create 3 new jobs with these settings:

**Job 1 - Morning:**
```
Title: Campsite Morning Snapshot (8am PT)
URL: https://YOUR-SITE-URL.com/cron-proxy.html?secret=campfinder-cron-2024
Schedule: Every day at 8:00 AM (Pacific Time / America/Los_Angeles)
```

**Job 2 - Noon:**
```
Title: Campsite Noon Snapshot (12pm PT)
URL: https://YOUR-SITE-URL.com/cron-proxy.html?secret=campfinder-cron-2024
Schedule: Every day at 12:00 PM (Pacific Time / America/Los_Angeles)
```

**Job 3 - Evening:**
```
Title: Campsite Evening Snapshot (8pm PT)
URL: https://YOUR-SITE-URL.com/cron-proxy.html?secret=campfinder-cron-2024
Schedule: Every day at 8:00 PM (Pacific Time / America/Los_Angeles)
```

**Automated Method (Easier):**
1. Edit `setup-cron-jobs-download.mjs`
2. Change line 24 from:
   ```javascript
   const YOUR_SITE_URL = 'https://YOUR-SITE-URL-HERE.com';
   ```
   to your actual site URL:
   ```javascript
   const YOUR_SITE_URL = 'https://my-campsite-finder.netlify.app';
   ```
3. Run: `node setup-cron-jobs-download.mjs YOUR_CRON_JOB_ORG_API_KEY`

### Step 3: Verify It Works

1. Go to https://cron-job.org
2. Click on one of your new jobs
3. Click the "▶️ Execute now" button
4. Wait a few seconds
5. Check the execution history - should show HTTP 200 ✅

## Testing

**Test in Browser:**
```
https://YOUR-SITE-URL.com/cron-proxy.html?secret=campfinder-cron-2024
```
Should show success message with JSON response.

**Test from Command Line:**
```bash
curl "https://YOUR-SITE-URL.com/cron-proxy.html?secret=campfinder-cron-2024"
```

**Check Results:**
```bash
curl "https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/newly-available" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzcnh3cmp2amtteXdudmxwZWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5NjI3NTAsImV4cCI6MjA0NzUzODc1MH0.YsRX-OefD5CAr8VfK6nU-O_SljpP7lOkUR-ejkbuZXo"
```

## Security

The proxy page is secure because:
- ✅ It requires the secret parameter to work
- ✅ The anon key is already public (it's meant to be exposed)
- ✅ Your backend still validates the secret
- ✅ Supabase's Row Level Security protects your database

## Why This Works

The 401 error was happening because:
1. Supabase Edge Functions **require** an Authorization header
2. cron-job.org free tier **doesn't support** custom headers
3. The request was blocked **before** reaching your code

The proxy page solves this by:
1. cron-job.org can access ANY public webpage (no headers needed)
2. The HTML page runs JavaScript in a browser environment
3. JavaScript **can** add headers to fetch requests
4. Problem solved! 🎉

## Alternatives

If you don't want to use the proxy page, you can:

**Option 1: Upgrade cron-job.org** (€3.90/month)
- Paid tier supports custom headers
- No proxy needed

**Option 2: Use Supabase Cron** (if available)
- Some Supabase plans include built-in cron
- Check your plan details

**Option 3: Use GitHub Actions** (free)
- Create a workflow that runs on schedule
- GitHub Actions can add headers

## Files

- `/public/cron-proxy.html` - The proxy page
- `/setup-cron-jobs-download.mjs` - Automated setup script (updated)
- `/CRON_PROXY_SOLUTION.md` - This file

## Troubleshooting

**"❌ Error: Invalid secret"**
- Check that the URL includes `?secret=campfinder-cron-2024`

**"❌ Network error"**
- Check browser console for CORS errors
- Verify your Supabase project ID is correct

**Cron job returns 200 but no data**
- Open the proxy URL in your browser to see the actual error
- Check Supabase Edge Function logs

**"Snapshot already taken this hour"**
- This is normal! Snapshots are rate-limited to once per hour
- Try again in the next hour

## Success!

Once set up, you should see:
- ✅ Cron jobs execute successfully (HTTP 200)
- ✅ Supabase logs show the snapshot requests
- ✅ Newly available sites appear in your app
- ✅ Everything runs automatically 3x daily

🎉 **Your campsite finder is now fully automated!**
