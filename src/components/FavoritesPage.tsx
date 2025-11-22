import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { CampgroundCard } from './CampgroundCard'
import { AdBanner } from './AdBanner'
import { projectId, publicAnonKey } from '../utils/supabase/info.tsx'

interface FavoritesPageProps {
  accessToken: string
}

export function FavoritesPage({ accessToken }: FavoritesPageProps) {
  const [favorites, setFavorites] = useState<any[]>([])
  const [ratings, setRatings] = useState<{ [key: string]: any }>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadFavorites()
  }, [])

  const loadFavorites = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2b623195/favorites`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setFavorites(data.favorites)
        
        // Load ratings for each favorite
        for (const camp of data.favorites) {
          await loadRating(camp.id)
        }
      }
    } catch (error) {
      console.error('Error loading favorites:', error)
    } finally {
      setLoading(false)
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

  const handleRemoveFavorite = async (campgroundId: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2b623195/favorites/${campgroundId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        setFavorites(favorites.filter(f => f.id !== campgroundId))
      }
    } catch (error) {
      console.error('Error removing favorite:', error)
    }
  }

  const handleRate = async (campgroundId: string, rating: number) => {
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

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="text-center py-12">Loading your favorites...</div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="mb-6 flex items-center gap-2">
        <Heart className="w-6 h-6 fill-red-500 text-red-500" />
        My Favorite Campgrounds
      </h1>

      <AdBanner position="top" />

      <div className="mt-6">
        {favorites.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 mb-2">No favorites yet</p>
            <p className="text-sm text-gray-400">
              Start exploring and save your favorite campgrounds!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {favorites.map((campground) => {
              const ratingData = ratings[campground.id]
              return (
                <CampgroundCard
                  key={campground.id}
                  campground={campground}
                  isFavorite={true}
                  onFavoriteToggle={handleRemoveFavorite}
                  onRate={handleRate}
                  averageRating={ratingData?.aggregate?.averageRating}
                  totalRatings={ratingData?.aggregate?.totalRatings}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
