# ⚡ Automated Setup (1 Minute!)

Use this automated script to set up all 3 cron jobs instantly!

---

## 🎯 Super Quick Setup

### Step 1: Create cron-job.org Account (30 seconds)

1. Go to https://cron-job.org
2. Click **"Sign up"**
3. Enter email + password
4. Verify email
5. ✅ Done!

---

### Step 2: Get Your API Key (30 seconds)

1. Log in to https://cron-job.org
2. Click your profile picture (top right)
3. Click **"Settings"**
4. Click **"API"** in the left sidebar
5. Copy your **API Key** (long string)

**It looks like:** `abc123def456ghi789jkl012mno345pqr678`

---

### Step 3: Run the Setup Script (10 seconds)

Open your terminal and run:

```bash
node setup-cron-jobs.mjs YOUR_API_KEY_HERE
```

**Replace `YOUR_API_KEY_HERE`** with the key you copied!

**Example:**
```bash
node setup-cron-jobs.mjs abc123def456ghi789jkl012mno345pqr678
```

---

## ✨ What Happens

The script will:
1. ✅ Test your API key
2. ✅ Create morning job (8am PT)
3. ✅ Create noon job (12pm PT)
4. ✅ Create evening job (8pm PT)
5. ✅ Configure headers & timezone
6. ✅ Enable all jobs

**Total time: ~10 seconds**

---

## 📊 Expected Output

```
🚀 cron-job.org Automatic Setup
================================

🔑 Testing API key...
✅ API key is valid!

📅 Creating 3 cron jobs...

✅ Created: Campsite Morning Snapshot (8am PT)
   Job ID: 12345678
✅ Created: Campsite Noon Snapshot (12pm PT)
   Job ID: 12345679
✅ Created: Campsite Evening Snapshot (8pm PT)
   Job ID: 12345680

==================================================
📊 Setup Summary
==================================================

✅ Successfully created: 3/3 jobs

🎉 All done! Your cron jobs are set up and running!

📋 Next steps:
   1. Go to https://cron-job.org
   2. Check your dashboard to see the 3 jobs
   3. Click ▶️ to test one manually
   4. Wait for 8am, 12pm, or 8pm PT for first automatic run

✨ Snapshots will now run automatically 3x daily!
```

---

## 🎉 You're Done!

That's it! Your entire system is now set up and will run automatically.

**What happens next:**
- Cron jobs will trigger at 8am, 12pm, and 8pm Pacific Time
- Your Supabase backend will scan Recreation.gov & ReserveCalifornia
- Newly available sites will appear on your website
- Zero maintenance required!

---

## 🔍 Verify It Worked

1. Go to https://cron-job.org
2. You should see 3 jobs in your dashboard:
   - Campsite Morning Snapshot (8am PT)
   - Campsite Noon Snapshot (12pm PT)
   - Campsite Evening Snapshot (8pm PT)
3. All should be **Enabled** (green)
4. Click ▶️ on one to test manually
5. Should see "200 OK" response

---

## 🚨 Troubleshooting

### "Invalid API key" Error

**Fix:**
1. Go to https://cron-job.org → Settings → API
2. Make sure you copied the correct key
3. The key is case-sensitive
4. Try copying it again

---

### "Authorization failed" Error

**Fix:**
1. Make sure you're logged into cron-job.org
2. Check your account is verified (check email)
3. Try logging out and back in
4. Regenerate API key if needed

---

### Script Not Found

**Fix:**
```bash
# Make sure you're in the right directory
ls setup-cron-jobs.mjs

# If missing, you're in the wrong folder
cd /path/to/your/project
```

---

### Node.js Not Installed

**Fix:**

**Mac/Linux:**
```bash
# Install Node.js using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install node
```

**Or download from:** https://nodejs.org

---

## 🔄 Alternative: Manual Setup

Don't want to use the script? No problem!

Follow **`CRON_SETUP.md`** for manual setup (takes 10 minutes).

---

## 📝 What the Script Creates

### Job 1: Morning
```
Title: Campsite Morning Snapshot (8am PT)
URL: https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot
Schedule: Every day at 8:00 AM Pacific Time
Method: GET
Headers: X-Cron-Secret: campfinder-cron-2024
Notifications: On failure only
Status: Enabled
```

### Job 2: Noon
```
Title: Campsite Noon Snapshot (12pm PT)
URL: https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot
Schedule: Every day at 12:00 PM Pacific Time
Method: GET
Headers: X-Cron-Secret: campfinder-cron-2024
Notifications: On failure only
Status: Enabled
```

### Job 3: Evening
```
Title: Campsite Evening Snapshot (8pm PT)
URL: https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot
Schedule: Every day at 8:00 PM Pacific Time
Method: GET
Headers: X-Cron-Secret: campfinder-cron-2024
Notifications: On failure only
Status: Enabled
```

---

## 💰 Cost

**Everything is free:**
- ✅ cron-job.org: $0/month
- ✅ Supabase: $0/month
- ✅ This script: Free
- ✅ **Total: $0/month forever!**

---

## 🎯 Next Steps

After running the script:

1. **Test immediately:**
   - Go to cron-job.org
   - Click ▶️ next to a job
   - Check for "200 OK" response

2. **Wait for first scheduled run:**
   - Check back at 8am, 12pm, or 8pm PT
   - View execution history
   - Verify snapshots are running

3. **Check your website:**
   - Visit the newly available sites section
   - Should populate within 24-48 hours

---

## 📞 Need Help?

- **Script issues:** Check error messages above
- **API key problems:** Regenerate in cron-job.org settings
- **Setup questions:** See `CRON_SETUP.md` for manual setup
- **General issues:** See `TROUBLESHOOTING.md`

---

**Setup Time:** 1 minute  
**Monthly Cost:** $0  
**Difficulty:** Super easy! ⭐☆☆☆☆

**Let's automate it! 🚀**
