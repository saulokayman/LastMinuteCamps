# CampFinder Admin Panel Guide

## Accessing the Admin Panel

Navigate to `/admin.tsx` in your browser to access the admin panel.

## First Time Setup

### Creating Your Admin Account

1. Visit `/admin.tsx`
2. Click "First time? Create an account"
3. Enter your:
   - Full Name
   - Email Address
   - Password
4. Click "Create Account"

**Note:** The first admin account can be created without an invitation token. Subsequent admin accounts require an invitation token for security.

## Features

### 1. Analytics Dashboard

Track comprehensive website traffic statistics:

#### Overview Metrics
- **Total Page Views**: All-time page view count
- **Total Sessions**: Total user sessions
- **Tracking Start Date**: When analytics began

#### Time-Based Analytics
- **Time Range Selector**: View data for 7, 14, or 30 days
- **Page Views Over Time**: Line chart showing daily trends
- **Hourly Traffic Patterns**: Bar chart showing average traffic by hour
- **Top Pages**: Most visited pages with view counts
- **Top Referrers**: Traffic sources ranked by visits

#### Summary Statistics
- Total views for selected period
- Average daily views
- Peak day performance
- Number of unique pages visited

### 2. Ad Management

Configure monetization through multiple ad networks:

#### Google AdSense
1. Enable/disable AdSense ads
2. Enter your Publisher ID (ca-pub-XXXXXXXXXXXXXXXX)
3. Configure ad slots for different positions:
   - Header Banner
   - Footer Banner
   - Sidebar Top
   - Sidebar Bottom

**Setup Steps:**
1. Sign up for Google AdSense at https://www.google.com/adsense
2. Get your Publisher ID from AdSense account settings
3. Create ad units in AdSense dashboard
4. Copy the slot IDs to the admin panel
5. Save configuration

#### Google Ad Manager (DFP)
1. Enable/disable Ad Manager
2. Enter your Network Code
3. Configure ad unit paths (JSON format)

**Example Configuration:**
```json
{
  "header": "/12345678/header-banner",
  "sidebar": "/12345678/sidebar-ad",
  "footer": "/12345678/footer-banner"
}
```

#### Amazon Associates
1. Enable/disable Amazon Associates
2. Enter your Tracking ID (yoursite-20)

**Setup Steps:**
1. Sign up at https://affiliate-program.amazon.com
2. Get your tracking ID from Associates Central
3. Enter it in the admin panel
4. Use the tracking ID to generate affiliate links for camping gear

## Traffic Tracking

The system automatically tracks:
- Page views
- Unique visitors
- Referrer sources
- Hourly traffic patterns
- Most popular pages

Tracking happens automatically on every page load. No additional setup required.

## Security

### Admin Authentication
- Uses Supabase Auth for secure authentication
- Admin role verification on all protected routes
- Access tokens stored in localStorage
- Session persists until logout

### Admin Invitation
- First admin account requires no invitation
- Additional admin accounts require admin token: `ADMIN_INVITE_TOKEN_2024`
- Change this token in the backend code for production use

## API Endpoints

### Admin-Only Endpoints
All require `Authorization: Bearer <access_token>` header

- `POST /admin/signup` - Create new admin account
- `POST /admin/verify` - Verify admin access
- `GET /admin/analytics?days=7` - Get analytics data
- `GET /admin/ad-config` - Get full ad configuration
- `POST /admin/ad-config` - Save ad configuration

### Public Endpoints
- `GET /ad-config` - Get public ad configuration (for displaying ads)
- `POST /track-pageview` - Track page views

## Best Practices

### Ad Configuration
1. **Test Before Enabling**: Configure all settings before enabling ads
2. **Monitor Performance**: Use analytics to track ad impact on traffic
3. **Comply with Policies**: Follow Google AdSense and Ad Manager policies
4. **Update Regularly**: Keep ad configurations up to date

### Analytics
1. **Check Daily**: Review traffic patterns regularly
2. **Identify Trends**: Use time-based charts to spot trends
3. **Optimize Content**: Use top pages data to understand user interests
4. **Track Sources**: Monitor referrers to understand traffic sources

### Security
1. **Strong Passwords**: Use complex passwords for admin accounts
2. **Logout After Use**: Always logout when done
3. **Change Invite Token**: Update the admin invitation token for production
4. **Regular Backups**: Backend data is stored in Supabase KV store

## Troubleshooting

### Can't Login
- Verify email and password are correct
- Check browser console for errors
- Ensure Supabase is configured correctly

### Ads Not Showing
- Verify ads are enabled in admin panel
- Check that Client ID/Slot IDs are correct
- Ensure ad scripts are loaded (check browser console)
- AdSense may take 24-48 hours to approve new sites

### Analytics Not Tracking
- Check browser console for tracking errors
- Verify the backend is running
- Ensure Supabase connection is working

### No Access to Admin Panel
- Clear browser cache and localStorage
- Try incognito/private browsing mode
- Check network tab for API errors

## Support

For issues or questions:
1. Check browser console for error messages
2. Verify all API endpoints are accessible
3. Review Supabase logs for backend errors
4. Ensure all environment variables are set correctly
