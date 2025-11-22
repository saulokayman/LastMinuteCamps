import { useState, useEffect } from 'react'
import { MapPin, Sparkles, Clock, RefreshCw, Calendar as CalendarIcon } from 'lucide-react'
import { SearchFilters } from './SearchFilters'
import { CampgroundCard } from './CampgroundCard'
import { AdBanner } from './AdBanner'
import { WelcomeBanner } from './WelcomeBanner'
import { Calendar } from './ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { projectId, publicAnonKey } from '../utils/supabase/info.tsx'

interface HomePageProps {
  accessToken: string | null
  userProfile: any
}

export function HomePage({ accessToken, userProfile }: HomePageProps) {
  const [providers, setProviders] = useState<any[]>([])
  const [campgrounds, setCampgrounds] = useState<any[]>([])
  const [allCampgrounds, setAllCampgrounds] = useState<any[]>([])
  const [recentlyCanceled, setRecentlyCanceled] = useState<any[]>([])
  const [lastMinute, setLastMinute] = useState<any[]>([])
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [loading, setLoading] = useState(false)
  const [ratings, setRatings] = useState<{ [key: string]: any }>({})
  const [activeTab, setActiveTab] = useState<'canceled' | 'lastminute'>('canceled')
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [endDate, setEndDate] = useState<Date>(new Date())
  const [lastMinuteWithDates, setLastMinuteWithDates] = useState<any[]>([])

  useEffect(() => {
    loadProviders()
    loadRecentlyCanceled()
    loadAllCampgrounds()
    getUserLocation()
  }, [])

  useEffect(() => {
    if (userLocation) {
      loadLastMinute()
      loadLastMinuteWithDates()
    }
  }, [userLocation, startDate, endDate])

  const getUserLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          })
        },
        (error) => {
          console.log('Location access denied:', error)
          // Default to a central US location if denied
          setUserLocation({ lat: 39.8283, lon: -98.5795 })
        }
      )
    } else {
      // Default location
      setUserLocation({ lat: 39.8283, lon: -98.5795 })
    }
  }

  const loadProviders = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2b623195/providers`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setProviders(data.providers)
      }
    } catch (error) {
      console.error('Error loading providers:', error)
    }
  }

  const loadRecentlyCanceled = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2b623195/recently-canceled`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setRecentlyCanceled(data.canceled)
      }
    } catch (error) {
      console.error('Error loading recently canceled:', error)
    }
  }

  const loadAllCampgrounds = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2b623195/campgrounds`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setAllCampgrounds(data.campgrounds)
        
        // Load ratings for all campgrounds
        for (const camp of data.campgrounds) {
          await loadRating(camp.id)
        }
      }
    } catch (error) {
      console.error('Error loading all campgrounds:', error)
    }
  }

  const loadLastMinute = async () => {
    if (!userLocation) return

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2b623195/last-minute?lat=${userLocation.lat}&lon=${userLocation.lon}&maxDistance=50`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setLastMinute(data.availabilities)
      }
    } catch (error) {
      console.error('Error loading last minute:', error)
    }
  }

  const loadLastMinuteWithDates = async () => {
    if (!userLocation) return

    try {
      const start = startDate.toISOString().split('T')[0]
      const end = endDate.toISOString().split('T')[0]
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2b623195/last-minute?lat=${userLocation.lat}&lon=${userLocation.lon}&maxDistance=50&startDate=${start}&endDate=${end}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setLastMinuteWithDates(data.availabilities)
        
        // Load ratings for last minute results
        for (const camp of data.availabilities.slice(0, 10)) {
          await loadRating(camp.id)
        }
      }
    } catch (error) {
      console.error('Error loading last minute with dates:', error)
    }
  }

  const loadRating = async (campgroundId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2b623195/ratings/${campgroundId}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setRatings(prev => ({
          ...prev,
          [campgroundId]: data
        }))
      }
    } catch (error) {
      console.error('Error loading rating:', error)
    }
  }

  const handleSearch = async (filters: any) => {
    setLoading(true)
    setCampgrounds([]) // Clear previous results
    try {
      const params = new URLSearchParams()
      
      // Add all filter parameters
      if (filters.q) params.append('q', filters.q)
      if (filters.state) params.append('state', filters.state)
      if (filters.provider) params.append('provider', filters.provider)
      if (filters.lat) params.append('lat', filters.lat.toString())
      if (filters.lon) params.append('lon', filters.lon.toString())
      if (filters.maxDistance) params.append('maxDistance', filters.maxDistance.toString())
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2b623195/campgrounds?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        console.log('Search results:', data.campgrounds)
        setCampgrounds(data.campgrounds)
        
        // Load ratings for search results
        for (const camp of data.campgrounds.slice(0, 20)) {
          await loadRating(camp.id)
        }
      } else {
        console.error('Search failed:', await response.text())
      }
    } catch (error) {
      console.error('Error searching campgrounds:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFavoriteToggle = async (campgroundId: string) => {
    if (!accessToken) {
      alert('Please log in to save favorites')
      return
    }

    try {
      const isFavorite = userProfile?.favorites?.includes(campgroundId)
      
      if (isFavorite) {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2b623195/favorites/${campgroundId}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        )
      } else {
        await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2b623195/favorites`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ campgroundId }),
          }
        )
      }
      
      // Reload profile to update favorites
      window.location.reload()
    } catch (error) {
      console.error('Error toggling favorite:', error)
    }
  }

  const handleRate = async (campgroundId: string, rating: number) => {
    if (!accessToken) {
      alert('Please log in to rate campgrounds')
      return
    }

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2b623195/ratings`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ campgroundId, rating, review: '' }),
        }
      )

      if (response.ok) {
        await loadRating(campgroundId)
      }
    } catch (error) {
      console.error('Error rating campground:', error)
    }
  }

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-8">
      {/* Hero Section */}
      <div className="text-center py-8">
        <h1 className="mb-2">Find Your Perfect Campsite</h1>
        <p className="text-gray-600">
          Discover available campsites across the United States with real-time updates
        </p>
      </div>

      {/* Welcome Banner */}
      <WelcomeBanner />

      {/* Top Ad */}
      <AdBanner position="top" />

      {/* Search Section */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <SearchFilters
          onSearch={handleSearch}
          providers={providers}
          userLocation={userLocation}
          campgrounds={allCampgrounds}
        />
      </div>

      {/* Search Results */}
      {loading && (
        <section>
          <h2 className="mb-4">Search Results</h2>
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-green-600" />
            <p className="text-gray-500">Searching campgrounds...</p>
          </div>
        </section>
      )}
      
      {!loading && campgrounds.length > 0 && (
        <section>
          <h2 className="mb-4">Search Results ({campgrounds.length} found)</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campgrounds.map((campground) => {
              const ratingData = ratings[campground.id]
              return (
                <CampgroundCard
                  key={campground.id}
                  campground={campground}
                  isFavorite={userProfile?.favorites?.includes(campground.id)}
                  onFavoriteToggle={accessToken ? handleFavoriteToggle : undefined}
                  onRate={accessToken ? handleRate : undefined}
                  averageRating={ratingData?.aggregate?.averageRating}
                  totalRatings={ratingData?.aggregate?.totalRatings}
                  showDistance={!!userLocation}
                />
              )
            })}
          </div>
        </section>
      )}

      {/* Middle Ad */}
      <AdBanner position="middle" />

      {/* Tabbed Section: Recently Canceled & Last Minute Camps */}
      <section>
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('canceled')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
              activeTab === 'canceled'
                ? 'border-orange-600 text-orange-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            <span>Recently Canceled Reservations</span>
          </button>
          <button
            onClick={() => setActiveTab('lastminute')}
            className={`flex items-center gap-2 px-6 py-3 border-b-2 transition-colors ${
              activeTab === 'lastminute'
                ? 'border-green-600 text-green-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span>Last Minute Camps</span>
          </button>
        </div>

        {/* Recently Canceled Tab Content */}
        {activeTab === 'canceled' && (
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Grab these spots before someone else does!
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recentlyCanceled.map((campground) => {
                const ratingData = ratings[campground.id]
                return (
                  <CampgroundCard
                    key={`${campground.id}-${campground.canceledAt}`}
                    campground={campground}
                    isFavorite={userProfile?.favorites?.includes(campground.id)}
                    onFavoriteToggle={accessToken ? handleFavoriteToggle : undefined}
                    onRate={accessToken ? handleRate : undefined}
                    averageRating={ratingData?.aggregate?.averageRating}
                    totalRatings={ratingData?.aggregate?.totalRatings}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* Last Minute Camps Tab Content */}
        {activeTab === 'lastminute' && userLocation && (
          <div>
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2 text-sm text-gray-700">
                  <MapPin className="w-4 h-4" />
                  <span>Within 50 miles • Sorted by proximity</span>
                </div>
                <div className="flex items-center gap-3">
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        <CalendarIcon className="w-4 h-4" />
                        <span className="text-sm">
                          {startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => date && setStartDate(date)}
                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </PopoverContent>
                  </Popover>
                  <span className="text-gray-400">to</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                        <CalendarIcon className="w-4 h-4" />
                        <span className="text-sm">
                          {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => date && setEndDate(date)}
                        disabled={(date) => date < startDate}
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lastMinuteWithDates.map((campground) => {
                const ratingData = ratings[campground.id]
                return (
                  <CampgroundCard
                    key={`${campground.id}-${campground.availableDate}`}
                    campground={campground}
                    isFavorite={userProfile?.favorites?.includes(campground.id)}
                    onFavoriteToggle={accessToken ? handleFavoriteToggle : undefined}
                    onRate={accessToken ? handleRate : undefined}
                    averageRating={ratingData?.aggregate?.averageRating}
                    totalRatings={ratingData?.aggregate?.totalRatings}
                    showDistance={true}
                  />
                )
              })}
            </div>
          </div>
        )}
      </section>

      {/* Bottom Ad */}
      <AdBanner position="bottom" />
    </div>
  )
}