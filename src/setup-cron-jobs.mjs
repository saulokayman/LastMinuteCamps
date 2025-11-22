#!/usr/bin/env node

/**
 * Automatic cron-job.org Setup Script
 * 
 * This script automatically creates 3 cron jobs on cron-job.org
 * to call your Supabase backend at 8am, 12pm, and 8pm Pacific Time.
 * 
 * Usage:
 *   node setup-cron-jobs.mjs YOUR_API_KEY_HERE
 * 
 * Get your API key:
 *   1. Sign up at https://cron-job.org
 *   2. Go to Settings → API
 *   3. Copy your API key
 */

const CRON_JOB_API = 'https://api.cron-job.org/jobs';
const SUPABASE_PROJECT_ID = 'fsrxwrjvjkmywnvlpecn';
const CRON_SECRET = 'campfinder-cron-2024';

// Get API key from command line
const apiKey = process.argv[2];

if (!apiKey) {
  console.error('❌ Error: API key required!');
  console.log('');
  console.log('Usage:');
  console.log('  node setup-cron-jobs.mjs YOUR_API_KEY_HERE');
  console.log('');
  console.log('Get your API key:');
  console.log('  1. Sign up at https://cron-job.org');
  console.log('  2. Go to Settings → API');
  console.log('  3. Copy your API key');
  console.log('  4. Run: node setup-cron-jobs.mjs YOUR_KEY');
  process.exit(1);
}

// The 3 cron jobs to create
const jobs = [
  {
    title: 'Campsite Morning Snapshot (8am PT)',
    url: `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot`,
    schedule: {
      timezone: 'America/Los_Angeles',
      hours: [8],
      minutes: [0]
    },
    description: 'Morning scan at 8am Pacific Time - catches new site releases'
  },
  {
    title: 'Campsite Noon Snapshot (12pm PT)',
    url: `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot`,
    schedule: {
      timezone: 'America/Los_Angeles',
      hours: [12],
      minutes: [0]
    },
    description: 'Noon scan at 12pm Pacific Time - catches midday cancellations'
  },
  {
    title: 'Campsite Evening Snapshot (8pm PT)',
    url: `https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot`,
    schedule: {
      timezone: 'America/Los_Angeles',
      hours: [20],
      minutes: [0]
    },
    description: 'Evening scan at 8pm Pacific Time - catches evening changes'
  }
];

async function createCronJob(job) {
  const payload = {
    job: {
      enabled: true,
      title: job.title,
      saveResponses: true,
      url: job.url,
      auth: {
        enable: false
      },
      notification: {
        onFailure: true,
        onSuccess: false,
        onDisable: false
      },
      extendedData: {
        headers: [
          {
            key: 'X-Cron-Secret',
            value: CRON_SECRET
          }
        ]
      },
      requestMethod: 1, // GET
      schedule: {
        timezone: job.schedule.timezone,
        expiresAt: 0,
        hours: job.schedule.hours,
        mdays: [-1], // Every day
        minutes: job.schedule.minutes,
        months: [-1], // Every month
        wdays: [-1] // Every weekday
      }
    }
  };

  try {
    const response = await fetch(CRON_JOB_API, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.ok && data.jobId) {
      console.log(`✅ Created: ${job.title}`);
      console.log(`   Job ID: ${data.jobId}`);
      return { success: true, jobId: data.jobId, title: job.title };
    } else {
      console.error(`❌ Failed: ${job.title}`);
      console.error(`   Error: ${data.error?.message || JSON.stringify(data)}`);
      return { success: false, title: job.title, error: data };
    }
  } catch (error) {
    console.error(`❌ Failed: ${job.title}`);
    console.error(`   Error: ${error.message}`);
    return { success: false, title: job.title, error: error.message };
  }
}

async function testCronJobAPI(apiKey) {
  try {
    const response = await fetch(CRON_JOB_API, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (response.ok) {
      return true;
    } else {
      const data = await response.json();
      console.error('❌ API key test failed!');
      console.error(`   Status: ${response.status}`);
      console.error(`   Error: ${data.error?.message || 'Invalid API key'}`);
      return false;
    }
  } catch (error) {
    console.error('❌ Connection error!');
    console.error(`   ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 cron-job.org Automatic Setup');
  console.log('================================\n');

  // Test API key
  console.log('🔑 Testing API key...');
  const isValid = await testCronJobAPI(apiKey);
  
  if (!isValid) {
    console.log('\n📝 Make sure you:');
    console.log('   1. Created an account at https://cron-job.org');
    console.log('   2. Went to Settings → API');
    console.log('   3. Copied the correct API key');
    process.exit(1);
  }
  
  console.log('✅ API key is valid!\n');

  // Create the 3 cron jobs
  console.log('📅 Creating 3 cron jobs...\n');
  
  const results = [];
  for (const job of jobs) {
    const result = await createCronJob(job);
    results.push(result);
    
    // Wait a bit between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Setup Summary');
  console.log('='.repeat(50) + '\n');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successfully created: ${successful.length}/3 jobs`);
  
  if (failed.length > 0) {
    console.log(`❌ Failed: ${failed.length}/3 jobs`);
    console.log('\nFailed jobs:');
    failed.forEach(f => console.log(`   - ${f.title}`));
  }

  if (successful.length === 3) {
    console.log('\n🎉 All done! Your cron jobs are set up and running!');
    console.log('\n📋 Next steps:');
    console.log('   1. Go to https://cron-job.org');
    console.log('   2. Check your dashboard to see the 3 jobs');
    console.log('   3. Click ▶️ to test one manually');
    console.log('   4. Wait for 8am, 12pm, or 8pm PT for first automatic run');
    console.log('\n✨ Snapshots will now run automatically 3x daily!');
  } else if (successful.length > 0) {
    console.log('\n⚠️  Partial success - some jobs created, some failed');
    console.log('   You may need to create the failed jobs manually');
  } else {
    console.log('\n❌ Setup failed - no jobs were created');
    console.log('   Please check the errors above and try again');
  }

  console.log('\n📖 Documentation: See CRON_SETUP.md for manual setup');
  console.log('🔧 Troubleshooting: See TROUBLESHOOTING.md for help\n');
}

main().catch(error => {
  console.error('💥 Unexpected error:', error);
  process.exit(1);
});
