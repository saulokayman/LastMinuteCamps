#!/bin/bash

# Test cron endpoint authentication
echo "Testing cron endpoint authentication..."
echo ""

# Test 1: With query parameter
echo "Test 1: Query parameter (?secret=campfinder-cron-2024)"
curl -v "https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot?secret=campfinder-cron-2024" 2>&1 | grep -A 5 "< HTTP"
echo ""
echo ""

# Test 2: With header
echo "Test 2: Header (X-Cron-Secret: campfinder-cron-2024)"
curl -v -H "X-Cron-Secret: campfinder-cron-2024" "https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot" 2>&1 | grep -A 5 "< HTTP"
echo ""
echo ""

# Test 3: Both methods
echo "Test 3: Both methods (should work)"
curl -v -H "X-Cron-Secret: campfinder-cron-2024" "https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot?secret=campfinder-cron-2024" 2>&1 | grep -A 5 "< HTTP"
echo ""
echo ""

# Test 4: Wrong secret
echo "Test 4: Wrong secret (should fail)"
curl -v "https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot?secret=wrong-secret" 2>&1 | grep -A 5 "< HTTP"
echo ""
