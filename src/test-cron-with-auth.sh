#!/bin/bash

# Test cron endpoint with proper Authorization header

echo "Testing cron endpoint with Authorization header..."
echo ""

curl -v \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZzcnh3cmp2amtteXdudmxwZWNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE5NjI3NTAsImV4cCI6MjA0NzUzODc1MH0.YsRX-OefD5CAr8VfK6nU-O_SljpP7lOkUR-ejkbuZXo" \
  "https://fsrxwrjvjkmywnvlpecn.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot?secret=campfinder-cron-2024"

echo ""
echo ""
echo "If you see 'success: true', it worked!"
