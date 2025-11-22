# LastMinuteCamps 🏕️

A mobile-optimized web application for discovering available campsites across the United States. Built with React, Supabase, and inspired by the Camply Python library.

## Features

### Core Functionality
- **Campground Discovery**: Search and filter campgrounds by name, state, provider, and proximity
- **Real-time Availability**: View recently canceled reservations and last-minute getaway opportunities
- **Location-Based Search**: Find campsites near your current location
- **Provider Coverage**: Support for multiple providers including Recreation.gov, Reserve California, and more

### User Features
- **Authentication**: Secure user login and signup system
- **Favorites**: Save and manage your favorite campgrounds
- **Ratings**: Rate campgrounds with a 5-star system
- **User Profile**: Track your favorites and reviews

### Admin Features
- **Admin Panel**: Manage Google AdSense and other advertisements
- **Ad Management**: Create, edit, activate/deactivate, and delete ad placements
- **Ad Positions**: Place ads in top, middle, bottom, or sidebar positions

### Monetization
- **Google AdSense Integration**: Built-in ad banner system with admin controls
- **Multiple Ad Positions**: Strategic ad placement throughout the app

## Technical Architecture

### Frontend
- **React** with TypeScript
- **Tailwind CSS** for styling
- **Lucide React** for icons
- Mobile-first responsive design

### Backend
- **Supabase** for authentication and database
- **Hono** web framework for serverless functions
- **Key-Value Store** for data persistence
- RESTful API endpoints

### API Endpoints

#### Public Endpoints
- `GET /providers` - List all campground providers
- `GET /campgrounds` - Search campgrounds with filters
- `GET /recently-canceled` - Get recently canceled reservations
- `GET /last-minute` - Get last-minute availabilities near location
- `GET /ads` - Get active advertisements by position
- `GET /ratings/:campgroundId` - Get ratings for a campground

#### Authenticated Endpoints
- `POST /signup` - Create a new user account
- `GET /profile` - Get user profile
- `POST /favorites` - Add campground to favorites
- `DELETE /favorites/:campgroundId` - Remove from favorites
- `GET /favorites` - Get user's favorite campgrounds
- `POST /ratings` - Submit or update a rating
- `POST /alerts` - Create availability alert
- `GET /alerts` - Get user's alerts

#### Admin Endpoints (Admin Only)
- `GET /admin/ads` - Get all ads
- `POST /admin/ads` - Create new ad
- `PUT /admin/ads/:adId` - Update ad
- `DELETE /admin/ads/:adId` - Delete ad
- `POST /admin/make-admin` - Make user an admin

## Getting Started

### First User Setup
1. Sign up for a new account
2. After logging in, scroll to the footer and click "Become First Admin"
3. Enter the bootstrap secret: `bootstrap-lastminutecamps-2024`
4. You'll now have access to the Admin panel
5. Use the Admin panel to set up advertisements and manage other admins

### Setting Up Google AdSense
1. Log in as an admin
2. Navigate to the Admin panel
3. Create new ad placements with your AdSense code
4. Choose position (top, middle, bottom, sidebar)
5. Activate ads to display them on the site

## Search Features

### Filters
- **Text Search**: Search by campground name or description
- **State Filter**: Filter by US state
- **Provider Filter**: Filter by reservation provider
- **Distance Filter**: Find campgrounds within X miles of your location

### Special Sections
- **Recently Canceled**: Shows reservations that were just canceled (perfect for last-minute planning)
- **Last-Minute Getaways**: Shows available sites within 7 days near your location

## Data Structure

### User Profile
```json
{
  "email": "user@example.com",
  "name": "User Name",
  "isAdmin": false,
  "favorites": ["campground-id-1", "campground-id-2"],
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Campground Data
```json
{
  "id": "rec-232447",
  "name": "Yosemite National Park",
  "providerId": "recreation_gov",
  "state": "CA",
  "latitude": 37.8651,
  "longitude": -119.5383,
  "description": "Iconic granite cliffs and waterfalls",
  "sites": 471
}
```

## Mobile Optimization

The app is built with mobile-first principles:
- Responsive grid layouts
- Touch-friendly buttons and controls
- Mobile-optimized navigation with hamburger menu
- Optimized for screens from 320px to 4K

## Future Enhancements

- Integration with real Camply Python library backend
- Real-time availability monitoring
- Email/SMS alerts for campground availability
- Advanced filtering (amenities, activities, site types)
- User reviews and photos
- Trip planning and itinerary builder
- Weather integration
- Booking integration

## Notes

This is a prototype/demo application. For production use:
- Implement proper security measures
- Connect to real campground availability APIs
- Set up proper email confirmation
- Implement rate limiting
- Add comprehensive error handling
- Set up proper monitoring and logging