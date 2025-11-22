# Automatic Snapshot System

## Overview

The CampFinder automatic snapshot system tracks campsite availability changes across Recreation.gov and ReserveCalifornia.com to identify newly available sites that were previously reserved.

## How It Works

### Detection Logic

1. **Multiple Daily Snapshots**: Takes snapshots 3 times per day at 8am, 12pm, and 8pm Pacific Time
2. **Historical Comparison**: Compares current availability with snapshots from 1-4 days ago
3. **Newly Available Detection**: A site is "newly available" when:
   - It is currently available
   - It was NOT in any snapshot from the past 1-4 days
   - This means it was reserved before and just became available

### Why 1-4 Days?

- **1 day ago**: Catches sites that were just released
- **2-4 days ago**: Catches cancellations and sites that cycled through reservations
- **Sites become available**: At 8am Pacific sharp on both platforms

### Data Storage

```
Key Format: snapshot_YYYY-MM-DD_HH
Example: snapshot_2024-11-22_15 (3pm UTC = 8am PT)

Data Structure:
{
  "date": "2024-11-22",
  "hour": 15,
  "sites": {
    "siteId1": {
      "facilityId": "12345",
      "facilityName": "Yosemite National Park",
      "siteName": "Upper Pines 101",
      "siteId": "siteId1",
      "date": "2024-11-22"
    },
    ...
  },
  "timestamp": "2024-11-22T15:00:00.000Z"
}
```

Newly available sites are stored separately:
```
Key: newly_available_YYYY-MM-DD
Value: Array of newly available sites with timestamps
```

### Retention Policy

- **Snapshots**: 5 days of history
- **Newly Available Lists**: 5 days of history
- **Automatic Cleanup**: Old data is automatically deleted

## API Endpoints

### For Cron Services

```
GET /make-server-908ab15a/cron/snapshot
Headers: X-Cron-Secret: campfinder-cron-2024

Returns:
{
  "success": true,
  "message": "Scheduled snapshot completed",
  "result": {
    "date": "2024-11-22",
    "hour": 15,
    "totalSitesAvailable": 234,
    "newlyAvailable": 12,
    "totalNewlyAvailableToday": 12
  }
}
```

### For Users (Public)

```
GET /make-server-908ab15a/newly-available

Returns: Array of newly available sites
[
  {
    "siteId": "123",
    "siteName": "Upper Pines 101",
    "facilityId": "456",
    "facilityName": "Yosemite National Park",
    "facilityState": "CA",
    "facilityCity": "Yosemite Valley",
    "becameAvailableAt": "2024-11-22T15:05:23.000Z",
    "date": "2024-11-22",
    "reservationUrl": "https://www.recreation.gov/camping/campsites/123"
  },
  ...
]
```

## Schedule

### Optimal Times (Pacific Time)

| Time | Reason | UTC Equivalent (PDT) |
|------|--------|---------------------|
| 8:00 AM | New sites release | 15:00 UTC |
| 12:00 PM | Midday cancellations | 19:00 UTC |
| 8:00 PM | Late-day cancellations | 03:00 UTC (next day) |

### Cron Expressions

```bash
# 8am PT = 3pm UTC (PDT)
0 15 * * *

# 12pm PT = 7pm UTC (PDT)
0 19 * * *

# 8pm PT = 3am UTC next day (PDT)
0 3 * * *
```

**Note**: Adjust for PST (add 1 hour to UTC times) during winter months.

## User Interface

### Main Site

The "Newly Available Sites" section automatically shows:
- Sites that became available within the last 24 hours
- Timestamp showing when each site was detected
- Direct booking links
- Facility information

### Admin Dashboard

The admin panel shows:
- **Snapshot Status Widget**
  - Last snapshot time
  - Number of newly available sites today
  - System health indicator (green/yellow/red)
  - Schedule information
  - Manual test button
- **Automatic Updates**: Checks status every minute

## Implementation Status

✅ **Completed**:
- Backend snapshot logic
- 1-4 day comparison algorithm
- Automatic data cleanup
- Hourly snapshot tracking (multiple per day)
- Public API endpoint for newly available sites
- Admin monitoring widget
- User-facing display component

⏳ **Requires Setup**:
- External cron service configuration (see CRON_SETUP.md)
- Set `CRON_SECRET` environment variable

## Testing

### Manual Test

From admin dashboard:
1. Go to admin panel
2. Look at "Automatic Snapshots" widget
3. Click "Test Now" button
4. View results

### Via Command Line

```bash
curl -X GET \
  "https://YOUR_PROJECT.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot" \
  -H "X-Cron-Secret: campfinder-cron-2024"
```

### Verify Results

```bash
curl "https://YOUR_PROJECT.supabase.co/functions/v1/make-server-908ab15a/newly-available" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Monitoring

### What to Watch

1. **Snapshot Frequency**: Should run 3x daily
2. **Detection Rate**: Typically 5-50 newly available sites per day
3. **Data Age**: Snapshots should be < 12 hours old
4. **Error Rates**: Check Supabase function logs

### Health Indicators

- **Green**: Recent snapshot (< 12 hours old), system running
- **Yellow**: Snapshot between 12-24 hours old, waiting for next run
- **Red**: No snapshot in 24+ hours, needs attention

## Troubleshooting

### No Newly Available Sites

**Possible Causes**:
- Cron jobs not running (check external service)
- API key issues (verify Recreation.gov API key)
- Timing issues (wait 24 hours for meaningful comparisons)
- Low season (fewer reservations = fewer cancellations)

**Solutions**:
1. Check admin dashboard snapshot status
2. Manually test cron endpoint
3. Verify cron service is active
4. Check Supabase function logs

### Too Many False Positives

**Possible Causes**:
- Not enough historical data yet
- Facilities with dynamic inventory

**Solutions**:
- Wait 4-5 days for system to stabilize
- Adjust comparison window if needed

## Performance

### Resource Usage

- **API Calls**: ~30 facilities × 3 times/day = 90 Recreation.gov API calls/day
- **Storage**: ~50-100 KB per snapshot × 5 days × 3/day = ~1 MB
- **Function Time**: ~30-60 seconds per snapshot
- **Cost**: Free tier sufficient for all operations

### Optimization

The system is optimized for:
- Minimal API calls (batch requests)
- Efficient storage (only changed sites)
- Fast queries (prefix-based lookups)
- Automatic cleanup (no manual maintenance)

## Future Enhancements

Potential improvements:
- [ ] Email notifications for specific parks
- [ ] SMS alerts for newly available sites
- [ ] Webhook support for integrations
- [ ] More granular filtering (by park, state, etc.)
- [ ] Historical trends and analytics
- [ ] Predictive availability modeling
