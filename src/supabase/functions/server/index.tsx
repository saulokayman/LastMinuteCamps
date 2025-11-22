import { Hono } from 'npm:hono'
import { cors } from 'npm:hono/cors'
import { logger } from 'npm:hono/logger'
import { createClient } from 'jsr:@supabase/supabase-js@2'
import * as kv from './kv_store.tsx'
import { makeFirstAdmin } from './make-first-admin.tsx'

const app = new Hono()

app.use('*', cors())
app.use('*', logger(console.log))

// Health check endpoint
app.get('/', (c) => {
  return c.json({ status: 'ok', message: 'LastMinuteCamps API is running' })
})

app.get('/make-server-2b623195', (c) => {
  return c.json({ status: 'ok', message: 'LastMinuteCamps API is running' })
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
)

// Python availability service URL
const PYTHON_SERVICE_URL = Deno.env.get('PYTHON_AVAILABILITY_SERVICE_URL')

// Helper function to call Python service
async function callPythonService(endpoint: string, options: RequestInit = {}) {
  if (!PYTHON_SERVICE_URL) {
    console.warn('PYTHON_AVAILABILITY_SERVICE_URL not configured')
    return null
  }
  
  try {
    const response = await fetch(`${PYTHON_SERVICE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })
    
    if (!response.ok) {
      console.error(`Python service error: ${response.status}`)
      return null
    }
    
    return await response.json()
  } catch (error) {
    console.error(`Error calling Python service: ${error}`)
    return null
  }
}

// Camply providers data
const PROVIDERS = [
  { id: 'recreation_gov', name: 'Recreation.gov', description: 'Federal recreation areas', website: 'https://www.recreation.gov' },
  { id: 'recreation_gov_ticket', name: 'Recreation.gov Tickets', description: 'Timed entry and tickets', website: 'https://www.recreation.gov' },
  { id: 'reserve_california', name: 'Reserve California', description: 'California state parks', website: 'https://www.reservecalifornia.com' },
  { id: 'yellowstone', name: 'Yellowstone', description: 'Yellowstone National Park lodging', website: 'https://www.yellowstonenationalparklodges.com' },
  { id: 'going_to_the_sun', name: 'Going-to-the-Sun', description: 'Glacier National Park vehicle reservations', website: 'https://www.recreation.gov' },
]

// Sample campgrounds (in production, this would be fetched from external API)
const CAMPGROUNDS = [
  // Yosemite National Park Campgrounds
  { id: '232450', name: 'Upper Pines Campground', providerId: 'recreation_gov', state: 'CA', latitude: 37.7368, longitude: -119.5579, description: 'Located in Yosemite Valley near Half Dome', sites: 238, providerUrl: 'https://www.recreation.gov/camping/campgrounds/232450' },
  { id: '232449', name: 'Lower Pines Campground', providerId: 'recreation_gov', state: 'CA', latitude: 37.7397, longitude: -119.5588, description: 'Family campground along Merced River', sites: 60, providerUrl: 'https://www.recreation.gov/camping/campgrounds/232449' },
  { id: '232447', name: 'North Pines Campground', providerId: 'recreation_gov', state: 'CA', latitude: 37.7426, longitude: -119.5574, description: 'Scenic Yosemite Valley location', sites: 81, providerUrl: 'https://www.recreation.gov/camping/campgrounds/232447' },
  
  // Grand Canyon National Park Campgrounds
  { id: '232266', name: 'Mather Campground', providerId: 'recreation_gov', state: 'AZ', latitude: 36.0544, longitude: -112.1401, description: 'South Rim campground near visitor center', sites: 327, providerUrl: 'https://www.recreation.gov/camping/campgrounds/232266' },
  { id: '258825', name: 'Desert View Campground', providerId: 'recreation_gov', state: 'AZ', latitude: 35.9947, longitude: -111.8264, description: 'East Rim location with canyon views', sites: 50, providerUrl: 'https://www.recreation.gov/camping/campgrounds/258825' },
  
  // Yellowstone National Park Campgrounds
  { id: '232462', name: 'Madison Campground', providerId: 'recreation_gov', state: 'WY', latitude: 44.6550, longitude: -110.8588, description: 'Near Madison River and geysers', sites: 278, providerUrl: 'https://www.recreation.gov/camping/campgrounds/232462' },
  { id: '251869', name: 'Bridge Bay Campground', providerId: 'recreation_gov', state: 'WY', latitude: 44.5563, longitude: -110.4116, description: 'Largest campground on Yellowstone Lake', sites: 432, providerUrl: 'https://www.recreation.gov/camping/campgrounds/251869' },
  
  // Joshua Tree National Park Campgrounds
  { id: '70925', name: 'Jumbo Rocks Campground', providerId: 'recreation_gov', state: 'CA', latitude: 34.0186, longitude: -116.0726, description: 'Popular rock climbing area', sites: 124, providerUrl: 'https://www.recreation.gov/camping/campgrounds/70925' },
  { id: '232381', name: 'Indian Cove Campground', providerId: 'recreation_gov', state: 'CA', latitude: 34.0867, longitude: -116.1638, description: 'Desert camping with unique rock formations', sites: 101, providerUrl: 'https://www.recreation.gov/camping/campgrounds/232381' },
  
  // Zion National Park Campgrounds
  { id: '232490', name: 'Watchman Campground', providerId: 'recreation_gov', state: 'UT', latitude: 37.1997, longitude: -112.9872, description: 'Near Zion Canyon Visitor Center', sites: 176, providerUrl: 'https://www.recreation.gov/camping/campgrounds/232490' },
  { id: '251889', name: 'South Campground', providerId: 'recreation_gov', state: 'UT', latitude: 37.2029, longitude: -112.9893, description: 'Along Virgin River in Zion Canyon', sites: 117, providerUrl: 'https://www.recreation.gov/camping/campgrounds/251889' },
  
  // California State Parks
  { id: '805', name: 'Pfeiffer Big Sur State Park', providerId: 'reserve_california', state: 'CA', latitude: 36.2461, longitude: -121.7826, description: 'Redwood groves and Big Sur River', sites: 189, providerUrl: 'https://www.reservecalifornia.com/CaliforniaWebHome/Facilities/SearchViewUnitAvailabity.aspx?facilityId=805' },
  { id: '668', name: 'Crystal Cove State Park', providerId: 'reserve_california', state: 'CA', latitude: 33.5713, longitude: -117.8416, description: 'Coastal camping overlooking Pacific', sites: 32, providerUrl: 'https://www.reservecalifornia.com/CaliforniaWebHome/Facilities/SearchViewUnitAvailabity.aspx?facilityId=668' },
  
  // Rocky Mountain National Park Campgrounds
  { id: '232493', name: 'Moraine Park Campground', providerId: 'recreation_gov', state: 'CO', latitude: 40.3596, longitude: -105.5864, description: 'Large meadow with mountain views', sites: 244, providerUrl: 'https://www.recreation.gov/camping/campgrounds/232493' },
  { id: '251870', name: 'Glacier Basin Campground', providerId: 'recreation_gov', state: 'CO', latitude: 40.3212, longitude: -105.5893, description: 'Near Bear Lake trailhead', sites: 150, providerUrl: 'https://www.recreation.gov/camping/campgrounds/251870' },
  
  // Acadia National Park Campgrounds
  { id: '232487', name: 'Blackwoods Campground', providerId: 'recreation_gov', state: 'ME', latitude: 44.3108, longitude: -68.2058, description: 'Wooded sites near ocean', sites: 281, providerUrl: 'https://www.recreation.gov/camping/campgrounds/232487' },
  { id: '232488', name: 'Seawall Campground', providerId: 'recreation_gov', state: 'ME', latitude: 44.2371, longitude: -68.3281, description: 'Quieter western side of Mount Desert Island', sites: 214, providerUrl: 'https://www.recreation.gov/camping/campgrounds/232488' },
  
  // Great Smoky Mountains Campgrounds
  { id: '232478', name: 'Cades Cove Campground', providerId: 'recreation_gov', state: 'TN', latitude: 35.5938, longitude: -83.7869, description: 'Historic valley with wildlife viewing', sites: 159, providerUrl: 'https://www.recreation.gov/camping/campgrounds/232478' },
  { id: '232477', name: 'Elkmont Campground', providerId: 'recreation_gov', state: 'TN', latitude: 35.6566, longitude: -83.5820, description: 'Along Little River near hiking trails', sites: 220, providerUrl: 'https://www.recreation.gov/camping/campgrounds/232477' },
  
  // Olympic National Park Campgrounds
  { id: '232465', name: 'Kalaloch Campground', providerId: 'recreation_gov', state: 'WA', latitude: 47.6095, longitude: -124.3748, description: 'Oceanfront camping on Pacific coast', sites: 170, providerUrl: 'https://www.recreation.gov/camping/campgrounds/232465' },
  { id: '232466', name: 'Sol Duc Hot Springs Campground', providerId: 'recreation_gov', state: 'WA', latitude: 47.9505, longitude: -123.8356, description: 'Near hot springs and rainforest trails', sites: 82, providerUrl: 'https://www.recreation.gov/camping/campgrounds/232466' },
]

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959 // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

// Auth helper
async function getUserFromToken(request: Request) {
  const accessToken = request.headers.get('Authorization')?.split(' ')[1]
  if (!accessToken) return null
  const { data: { user }, error } = await supabase.auth.getUser(accessToken)
  if (error || !user) return null
  return user
}

// User signup
app.post('/make-server-2b623195/signup', async (c) => {
  try {
    const { email, password, name } = await c.req.json()
    
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      user_metadata: { name },
      // Automatically confirm the user's email since an email server hasn't been configured.
      email_confirm: true
    })
    
    if (error) {
      console.log('Signup error:', error)
      return c.json({ error: error.message }, 400)
    }
    
    // Create user profile in KV store
    await kv.set(`user:${data.user.id}`, {
      email,
      name,
      isAdmin: false,
      favorites: [],
      createdAt: new Date().toISOString()
    })
    
    return c.json({ user: data.user })
  } catch (error) {
    console.log('Signup error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Get user profile
app.get('/make-server-2b623195/profile', async (c) => {
  try {
    const user = await getUserFromToken(c.req.raw)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    
    const profile = await kv.get(`user:${user.id}`)
    
    if (!profile) {
      // Create default profile if it doesn't exist
      const defaultProfile = {
        email: user.email,
        name: user.user_metadata?.name || user.email,
        isAdmin: false,
        favorites: [],
        createdAt: new Date().toISOString()
      }
      await kv.set(`user:${user.id}`, defaultProfile)
      return c.json({ profile: defaultProfile })
    }
    
    return c.json({ profile })
  } catch (error) {
    console.log('Profile error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Get providers
app.get('/make-server-2b623195/providers', (c) => {
  return c.json({ providers: PROVIDERS })
})

// Search campgrounds
app.get('/make-server-2b623195/campgrounds', (c) => {
  const q = c.req.query('q')
  const providerId = c.req.query('provider')
  const state = c.req.query('state')
  const lat = c.req.query('lat') ? Number(c.req.query('lat')) : null
  const lon = c.req.query('lon') ? Number(c.req.query('lon')) : null
  const maxDistance = Number(c.req.query('maxDistance')) || 100
  
  let results = [...CAMPGROUNDS]
  
  // Filter by search query
  if (q) {
    const queryLower = q.toLowerCase()
    results = results.filter(camp => 
      camp.name.toLowerCase().includes(queryLower) ||
      camp.description?.toLowerCase().includes(queryLower) ||
      camp.state.toLowerCase().includes(queryLower)
    )
  }
  
  // Filter by provider
  if (providerId && providerId !== 'all') {
    results = results.filter(camp => camp.providerId === providerId)
  }
  
  // Filter by state
  if (state && state !== 'all') {
    results = results.filter(camp => camp.state === state)
  }
  
  // Filter by distance if location provided
  if (lat && lon) {
    results = results.map(camp => ({
      ...camp,
      distance: calculateDistance(lat, lon, camp.latitude, camp.longitude)
    })).filter(camp => camp.distance <= maxDistance)
    .sort((a, b) => a.distance - b.distance)
  }
  
  return c.json({ campgrounds: results })
})

// Get recently canceled reservations
app.get('/make-server-2b623195/recently-canceled', async (c) => {
  try {
    // In production, this would fetch from a real-time monitoring system
    // Show nationwide canceled reservations from past 7 days
    const now = Date.now()
    const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000)
    
    // Increased from 5 to 12 campgrounds for nationwide coverage
    const canceled = CAMPGROUNDS.slice(0, 12).map((camp, idx) => {
      const siteNumber = Math.floor(Math.random() * 100) + 1
      return {
        ...camp,
        siteNumber,
        siteName: `Site ${siteNumber}`,
        canceledAt: new Date(sevenDaysAgo + Math.random() * (now - sevenDaysAgo)).toISOString(),
        availableDate: new Date(now + Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        nights: Math.floor(Math.random() * 7) + 1
      }
    })
    
    // Only return sites canceled in the past 7 days
    const recentlyCanceled = canceled.filter(camp => {
      const canceledTime = new Date(camp.canceledAt).getTime()
      return canceledTime >= sevenDaysAgo
    })
    
    return c.json({ canceled: recentlyCanceled.sort((a, b) => 
      new Date(b.canceledAt).getTime() - new Date(a.canceledAt).getTime()
    ) })
  } catch (error) {
    console.log('Recently canceled error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Get last-minute availabilities near location
app.get('/make-server-2b623195/last-minute', (c) => {
  const lat = Number(c.req.query('lat'))
  const lon = Number(c.req.query('lon'))
  const maxDistance = Number(c.req.query('maxDistance')) || 50
  const startDate = c.req.query('startDate')
  const endDate = c.req.query('endDate')
  
  if (!lat || !lon) {
    return c.json({ error: 'Location required' }, 400)
  }
  
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  
  // Find nearby campgrounds sorted by distance
  const nearbyCamps = CAMPGROUNDS.map(camp => ({
    ...camp,
    distance: calculateDistance(lat, lon, camp.latitude, camp.longitude)
  })).filter(camp => camp.distance <= maxDistance)
  .sort((a, b) => a.distance - b.distance)
  
  // Generate availabilities based on date range or default to today
  const useStartDate = startDate || today
  const useEndDate = endDate || today
  
  // Return all nearby camps with availability info, not just first 8
  const availabilities = nearbyCamps.map(camp => {
    const availableSiteCount = Math.floor(Math.random() * 8) + 1
    return {
      ...camp,
      siteName: `Site ${Math.floor(Math.random() * 100) + 1}`,
      availableDate: useStartDate,
      checkInDate: useStartDate,
      checkOutDate: useEndDate,
      nights: Math.floor((new Date(useEndDate).getTime() - new Date(useStartDate).getTime()) / (1000 * 60 * 60 * 24)) || 1,
      availableSites: availableSiteCount
    }
  })
  
  return c.json({ availabilities })
})

// Favorites - Add
app.post('/make-server-2b623195/favorites', async (c) => {
  try {
    const user = await getUserFromToken(c.req.raw)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    
    const { campgroundId } = await c.req.json()
    const profile = await kv.get(`user:${user.id}`) || { favorites: [] }
    
    if (!profile.favorites.includes(campgroundId)) {
      profile.favorites.push(campgroundId)
      await kv.set(`user:${user.id}`, profile)
    }
    
    return c.json({ success: true, favorites: profile.favorites })
  } catch (error) {
    console.log('Add favorite error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Favorites - Remove
app.delete('/make-server-2b623195/favorites/:campgroundId', async (c) => {
  try {
    const user = await getUserFromToken(c.req.raw)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    
    const campgroundId = c.req.param('campgroundId')
    const profile = await kv.get(`user:${user.id}`) || { favorites: [] }
    
    profile.favorites = profile.favorites.filter((id: string) => id !== campgroundId)
    await kv.set(`user:${user.id}`, profile)
    
    return c.json({ success: true, favorites: profile.favorites })
  } catch (error) {
    console.log('Remove favorite error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Favorites - Get user's favorites
app.get('/make-server-2b623195/favorites', async (c) => {
  try {
    const user = await getUserFromToken(c.req.raw)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    
    const profile = await kv.get(`user:${user.id}`) || { favorites: [] }
    const favoriteCampgrounds = CAMPGROUNDS.filter(camp => 
      profile.favorites.includes(camp.id)
    )
    
    return c.json({ favorites: favoriteCampgrounds })
  } catch (error) {
    console.log('Get favorites error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Ratings - Submit or update
app.post('/make-server-2b623195/ratings', async (c) => {
  try {
    const user = await getUserFromToken(c.req.raw)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    
    const { campgroundId, rating, review } = await c.req.json()
    
    if (rating < 1 || rating > 5) {
      return c.json({ error: 'Rating must be between 1 and 5' }, 400)
    }
    
    // Store user's rating
    await kv.set(`rating:${campgroundId}:${user.id}`, {
      rating,
      review,
      timestamp: new Date().toISOString()
    })
    
    // Update aggregate ratings
    const allRatings = await kv.getByPrefix(`rating:${campgroundId}:`)
    const totalRatings = allRatings.length
    const averageRating = allRatings.reduce((sum: number, r: any) => sum + r.rating, 0) / totalRatings
    
    await kv.set(`campsite-ratings:${campgroundId}`, {
      averageRating,
      totalRatings
    })
    
    return c.json({ success: true, averageRating, totalRatings })
  } catch (error) {
    console.log('Rating error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Ratings - Get campground ratings
app.get('/make-server-2b623195/ratings/:campgroundId', async (c) => {
  try {
    const campgroundId = c.req.param('campgroundId')
    const aggregate = await kv.get(`campsite-ratings:${campgroundId}`) || { averageRating: 0, totalRatings: 0 }
    
    return c.json({ aggregate })
  } catch (error) {
    console.log('Get ratings error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Admin - Get all ads
app.get('/make-server-2b623195/admin/ads', async (c) => {
  try {
    const user = await getUserFromToken(c.req.raw)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    
    const profile = await kv.get(`user:${user.id}`)
    if (!profile?.isAdmin) return c.json({ error: 'Admin access required' }, 403)
    
    const ads = await kv.getByPrefix('ad:')
    return c.json({ ads })
  } catch (error) {
    console.log('Get ads error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Admin - Create or update ad
app.post('/make-server-2b623195/admin/ads', async (c) => {
  try {
    const user = await getUserFromToken(c.req.raw)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    
    const profile = await kv.get(`user:${user.id}`)
    if (!profile?.isAdmin) return c.json({ error: 'Admin access required' }, 403)
    
    const { position, slot, enabled, content } = await c.req.json()
    const adId = `ad:${position}:${slot}`
    
    await kv.set(adId, {
      position,
      slot,
      enabled,
      content,
      updatedAt: new Date().toISOString()
    })
    
    return c.json({ success: true })
  } catch (error) {
    console.log('Save ad error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Admin - Delete ad
app.delete('/make-server-2b623195/admin/ads/:position/:slot', async (c) => {
  try {
    const user = await getUserFromToken(c.req.raw)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    
    const profile = await kv.get(`user:${user.id}`)
    if (!profile?.isAdmin) return c.json({ error: 'Admin access required' }, 403)
    
    const position = c.req.param('position')
    const slot = c.req.param('slot')
    const adId = `ad:${position}:${slot}`
    
    await kv.del(adId)
    
    return c.json({ success: true })
  } catch (error) {
    console.log('Delete ad error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Get ads for a specific position
app.get('/make-server-2b623195/ads/:position', async (c) => {
  try {
    const position = c.req.param('position')
    const allAds = await kv.getByPrefix(`ad:${position}:`)
    const enabledAds = allAds.filter((ad: any) => ad.enabled)
    
    // Randomly select an ad if multiple are enabled
    if (enabledAds.length > 0) {
      const randomAd = enabledAds[Math.floor(Math.random() * enabledAds.length)]
      return c.json({ ad: randomAd })
    }
    
    return c.json({ ad: null })
  } catch (error) {
    console.log('Get ad error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Get ads with query parameter (alternative endpoint)
app.get('/make-server-2b623195/ads', async (c) => {
  try {
    const position = c.req.query('position')
    if (!position) {
      return c.json({ error: 'Position parameter required' }, 400)
    }
    
    const allAds = await kv.getByPrefix(`ad:${position}:`)
    const enabledAds = allAds.filter((ad: any) => ad.enabled)
    
    // Randomly select an ad if multiple are enabled
    if (enabledAds.length > 0) {
      const randomAd = enabledAds[Math.floor(Math.random() * enabledAds.length)]
      return c.json({ ad: randomAd })
    }
    
    return c.json({ ad: null })
  } catch (error) {
    console.log('Get ad error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Bootstrap first admin
app.post('/make-server-2b623195/bootstrap-admin', async (c) => {
  try {
    const user = await getUserFromToken(c.req.raw)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    
    const { secret } = await c.req.json()
    const result = await makeFirstAdmin(user.id, secret)
    
    return c.json(result)
  } catch (error) {
    console.log('Bootstrap admin error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Python Service Integration Endpoints

// Search campgrounds via Camply Python service
app.post('/make-server-2b623195/camply/search', async (c) => {
  try {
    const { search_query, state } = await c.req.json()
    
    const result = await callPythonService('/campgrounds/search', {
      method: 'POST',
      body: JSON.stringify({ search_query, state })
    })
    
    if (!result) {
      return c.json({ error: 'Python service unavailable' }, 503)
    }
    
    return c.json(result)
  } catch (error) {
    console.log('Camply search error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Get real availability from Camply Python service
app.post('/make-server-2b623195/camply/availability', async (c) => {
  try {
    const { campground_id, start_date, end_date, nights } = await c.req.json()
    
    const result = await callPythonService('/availability/search', {
      method: 'POST',
      body: JSON.stringify({ campground_id, start_date, end_date, nights })
    })
    
    if (!result) {
      return c.json({ error: 'Python service unavailable' }, 503)
    }
    
    return c.json(result)
  } catch (error) {
    console.log('Camply availability error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Get recently canceled from Camply Python service
app.post('/make-server-2b623195/camply/recently-canceled', async (c) => {
  try {
    const { campground_ids, start_date, end_date } = await c.req.json()
    
    const result = await callPythonService('/availability/recently-canceled', {
      method: 'POST',
      body: JSON.stringify({ campground_ids, start_date, end_date })
    })
    
    if (!result) {
      return c.json({ error: 'Python service unavailable' }, 503)
    }
    
    return c.json(result)
  } catch (error) {
    console.log('Camply recently canceled error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Create alert via Camply Python service
app.post('/make-server-2b623195/camply/alerts', async (c) => {
  try {
    const user = await getUserFromToken(c.req.raw)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    
    const alertData = await c.req.json()
    
    const result = await callPythonService('/alerts/create', {
      method: 'POST',
      body: JSON.stringify(alertData)
    })
    
    if (!result) {
      return c.json({ error: 'Python service unavailable' }, 503)
    }
    
    // Store alert in KV store for user
    const alertId = result.alert?.alert_id
    if (alertId) {
      await kv.set(`alert:${user.id}:${alertId}`, {
        ...result.alert,
        userId: user.id
      })
    }
    
    return c.json(result)
  } catch (error) {
    console.log('Camply create alert error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

// Get user's alerts
app.get('/make-server-2b623195/camply/alerts', async (c) => {
  try {
    const user = await getUserFromToken(c.req.raw)
    if (!user) return c.json({ error: 'Unauthorized' }, 401)
    
    const alerts = await kv.getByPrefix(`alert:${user.id}:`)
    
    return c.json({ alerts })
  } catch (error) {
    console.log('Get alerts error:', error)
    return c.json({ error: String(error) }, 500)
  }
})

Deno.serve(app.fetch)