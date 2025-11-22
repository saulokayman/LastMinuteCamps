#!/bin/bash

# Test Snapshot Script
# Quick script to test your snapshot system

echo "🔍 CampFinder Snapshot Test Script"
echo "==================================="
echo ""

# Check if required variables are set
if [ -z "$SUPABASE_PROJECT_ID" ]; then
    echo "⚠️  Warning: SUPABASE_PROJECT_ID not set"
    read -p "Enter your Supabase Project ID: " SUPABASE_PROJECT_ID
fi

if [ -z "$CRON_SECRET" ]; then
    CRON_SECRET="campfinder-cron-2024"
    echo "ℹ️  Using default CRON_SECRET: $CRON_SECRET"
fi

echo ""
echo "Testing snapshot endpoint..."
echo ""

# Test the cron snapshot endpoint
RESPONSE=$(curl -s -w "\n%{http_code}" \
  "https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot" \
  -H "X-Cron-Secret: ${CRON_SECRET}")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" == "200" ]; then
    echo "✅ Success! Snapshot completed."
    echo ""
    echo "Response:"
    echo "$BODY" | jq '.' 2>/dev/null || echo "$BODY"
else
    echo "❌ Error: HTTP $HTTP_CODE"
    echo ""
    echo "Response:"
    echo "$BODY"
fi

echo ""
echo "==================================="
echo "Fetching newly available sites..."
echo ""

# Fetch newly available sites
SITES_RESPONSE=$(curl -s \
  "https://${SUPABASE_PROJECT_ID}.supabase.co/functions/v1/make-server-908ab15a/newly-available" \
  -H "Authorization: Bearer ${SUPABASE_ANON_KEY}")

SITE_COUNT=$(echo "$SITES_RESPONSE" | jq '. | length' 2>/dev/null || echo "0")

echo "📍 Newly available sites: $SITE_COUNT"
echo ""

if [ "$SITE_COUNT" -gt 0 ]; then
    echo "Recent sites:"
    echo "$SITES_RESPONSE" | jq '.[0:3]' 2>/dev/null || echo "$SITES_RESPONSE"
fi

echo ""
echo "==================================="
echo "✨ Test complete!"
