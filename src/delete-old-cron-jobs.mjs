#!/usr/bin/env node

/**
 * Delete Old Cron Jobs Script
 * 
 * This script deletes your existing cron jobs so you can recreate them
 * with the correct URL including the authentication secret.
 * 
 * Usage:
 *   node delete-old-cron-jobs.mjs YOUR_API_KEY_HERE
 */

const CRON_JOB_API = 'https://api.cron-job.org/jobs';

const apiKey = process.argv[2];

if (!apiKey) {
  console.error('❌ Error: API key required!');
  console.log('');
  console.log('Usage:');
  console.log('  node delete-old-cron-jobs.mjs YOUR_API_KEY_HERE');
  process.exit(1);
}

async function listJobs() {
  const response = await fetch(CRON_JOB_API, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${apiKey}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to list jobs: ${response.status}`);
  }

  const data = await response.json();
  return data.jobs || [];
}

async function deleteJob(jobId, title) {
  try {
    const response = await fetch(`${CRON_JOB_API}/${jobId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${apiKey}`
      }
    });

    if (response.ok) {
      console.log(`   ✅ Deleted: ${title} (ID: ${jobId})`);
      return true;
    } else {
      console.log(`   ❌ Failed to delete: ${title} (ID: ${jobId})`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Error deleting ${title}: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🗑️  Delete Old Cron Jobs');
  console.log('========================\n');

  console.log('📋 Fetching your existing jobs...\n');
  
  const jobs = await listJobs();
  
  if (jobs.length === 0) {
    console.log('✅ No jobs found - nothing to delete!');
    return;
  }

  console.log(`Found ${jobs.length} job(s):\n`);
  
  // Show all jobs
  jobs.forEach(job => {
    console.log(`   📌 ${job.title || 'Untitled'} (ID: ${job.jobId})`);
    console.log(`      URL: ${job.url}`);
    console.log('');
  });

  // Ask for confirmation (in Node.js we can't easily prompt, so just delete campsite-related ones)
  console.log('🔍 Looking for campsite snapshot jobs...\n');
  
  const campsiteJobs = jobs.filter(job => 
    job.title && job.title.toLowerCase().includes('campsite')
  );

  if (campsiteJobs.length === 0) {
    console.log('ℹ️  No campsite-related jobs found.');
    console.log('   If you want to delete other jobs, do so manually at https://cron-job.org\n');
    return;
  }

  console.log(`Found ${campsiteJobs.length} campsite job(s) to delete:\n`);
  
  for (const job of campsiteJobs) {
    await deleteJob(job.jobId, job.title);
    // Wait 1 second between deletions
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('\n✅ Cleanup complete!');
  console.log('\n📋 Next step:');
  console.log('   Run: node setup-cron-jobs-download.mjs YOUR_API_KEY');
  console.log('   This will create fresh jobs with correct authentication\n');
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
