# Cron Job Setup for Campsite Snapshots

## Overview

This system uses **cron-job.org** (free service) to automatically trigger snapshots 3 times daily at:
- **8:00 AM Pacific Time**
- **12:00 PM Pacific Time** 
- **8:00 PM Pacific Time**

## ✅ Automated Setup (RECOMMENDED - WORKING)

We've created a script that automatically sets up all 3 cron jobs via the cron-job.org API.

### Prerequisites
1. Create a free account at https://cron-job.org
2. Get your API key:
   - Go to https://console.cron-job.org/account
   - Scroll to "API" section
   - Copy your API key

### Run the Setup Script

**Option 1: Download the file and run locally**
```bash
# Download setup-cron-jobs.mjs from the project
# Then run:
node setup-cron-jobs.mjs YOUR_API_KEY_HERE
```

**Option 2: Use the "download" version (already in project)**
```bash
node setup-cron-jobs-download.mjs YOUR_API_KEY_HERE
```

The script will:
- ✅ Test your API key
- ✅ Create 3 cron jobs with proper schedules
- ✅ Add authentication secret as URL parameter
- ✅ Show you the job IDs and confirmation

### What the Script Does

1. Creates jobs with these URLs:
   ```
   https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot?secret=campfinder-cron-2024
   ```

2. Sets proper Pacific Time schedules
3. Enables the jobs immediately

---

## Manual Setup (Fallback Option)

If you prefer to set up manually or the script fails:

### Step 1: Sign Up
1. Go to https://cron-job.org
2. Create a free account

### Step 2: Create Jobs

Create **3 separate jobs** with these settings:

#### Job 1: Morning Snapshot
- **Title**: `Campsite Morning Snapshot (8am PT)`
- **URL**: `https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot?secret=campfinder-cron-2024`
- **Schedule**: 
  - Every day
  - At 8:00 (select hour 8, minute 0)
  - Timezone: `America/Los_Angeles` (Pacific Time)
- **Enabled**: ✅ Yes

#### Job 2: Noon Snapshot  
- **Title**: `Campsite Noon Snapshot (12pm PT)`
- **URL**: `https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot?secret=campfinder-cron-2024`
- **Schedule**:
  - Every day
  - At 12:00 (select hour 12, minute 0)
  - Timezone: `America/Los_Angeles` (Pacific Time)
- **Enabled**: ✅ Yes

#### Job 3: Evening Snapshot
- **Title**: `Campsite Evening Snapshot (8pm PT)`  
- **URL**: `https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot?secret=campfinder-cron-2024`
- **Schedule**:
  - Every day
  - At 20:00 (select hour 20, minute 0)
  - Timezone: `America/Los_Angeles` (Pacific Time)
- **Enabled**: ✅ Yes

### Important Notes for Manual Setup

- ⚠️ **Do NOT add custom headers** - The authentication secret is included in the URL as a query parameter (`?secret=campfinder-cron-2024`)
- ⚠️ Make sure to select **GET** request method (default)
- ⚠️ Set timezone to `America/Los_Angeles` for all 3 jobs

---

## Verify Setup

After setup (automated or manual):

1. **Check job status** at https://console.cron-job.org/jobs
2. **Manually trigger** one job to test it:
   - Click the job name
   - Click "Execute now"
   - Check the execution log - should show status 200
3. **View results** at `https://YOUR_SITE/admin`
   - Go to "Snapshot Status" tab
   - Should see successful snapshot data

---

## Troubleshooting

### "Unauthorized" Error (401)
- The secret is incorrect or missing
- Make sure the URL includes `?secret=campfinder-cron-2024`

### "API key not configured" Error (500)
- Recreation.gov API key not set in Supabase
- Add `RECREATION_GOV_API_KEY` to Supabase Edge Function secrets

### No jobs running
- Check job is **Enabled** in cron-job.org
- Verify timezone is `America/Los_Angeles`
- Check execution history for error details

### Need to change the secret?
1. Update in Supabase environment variables: `CRON_SECRET`
2. Re-run the automated setup script, OR
3. Manually update all 3 job URLs with the new secret

---

## Cost

**FREE** ✅
- cron-job.org free tier includes 50 job executions/day
- We only need 3 executions/day
- No credit card required