#!/usr/bin/env node

/**
 * Check Current Cron Jobs Script
 * 
 * This script lists all your current cron jobs and shows their URLs.
 * 
 * Usage:
 *   node check-cron-jobs.mjs YOUR_API_KEY_HERE
 */

const CRON_JOB_API = 'https://api.cron-job.org/jobs';

const apiKey = process.argv[2];

if (!apiKey) {
  console.error('❌ Error: API key required!');
  console.log('');
  console.log('Usage:');
  console.log('  node check-cron-jobs.mjs YOUR_API_KEY_HERE');
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

async function main() {
  console.log('📋 Your Current Cron Jobs');
  console.log('========================\n');

  const jobs = await listJobs();
  
  if (jobs.length === 0) {
    console.log('No jobs found!');
    return;
  }

  console.log(`Found ${jobs.length} job(s):\n`);
  
  jobs.forEach((job, index) => {
    console.log(`${index + 1}. ${job.title || 'Untitled'}`);
    console.log(`   ID: ${job.jobId}`);
    console.log(`   URL: ${job.url}`);
    console.log(`   Enabled: ${job.enabled ? '✅ Yes' : '❌ No'}`);
    console.log(`   Schedule: ${JSON.stringify(job.schedule)}`);
    console.log('');
  });

  console.log('🔍 Checking for authentication secret in URLs...\n');
  
  jobs.forEach(job => {
    if (job.url && job.url.includes('snapshot')) {
      const hasSecret = job.url.includes('?secret=') || job.url.includes('&secret=');
      if (hasSecret) {
        console.log(`✅ ${job.title}: Has secret in URL`);
      } else {
        console.log(`❌ ${job.title}: Missing secret in URL!`);
        console.log(`   Current URL: ${job.url}`);
        console.log(`   Should be: ${job.url}?secret=campfinder-cron-2024`);
      }
    }
  });
}

main().catch(error => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
