import { MapPin, Users, Heart, Star, ExternalLink } from 'lucide-react'
import { useState } from 'react'

interface CampgroundCardProps {
  campground: any
  isFavorite?: boolean
  onFavoriteToggle?: (id: string) => void
  onRate?: (id: string, rating: number) => void
  userRating?: number
  averageRating?: number
  totalRatings?: number
  showDistance?: boolean
}

export function CampgroundCard({ 
  campground, 
  isFavorite, 
  onFavoriteToggle,
  onRate,
  userRating,
  averageRating = 0,
  totalRatings = 0,
  showDistance = false
}: CampgroundCardProps) {
  const [hoveredStar, setHoveredStar] = useState(0)

  const handleStarClick = (rating: number) => {
    if (onRate) {
      onRate(campground.id, rating)
    }
  }

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button, a')) {
      return
    }
    
    // Open provider URL if available
    if (campground.providerUrl) {
      window.open(campground.providerUrl, '_blank')
    }
  }

  const formatCanceledDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const diffTime = Math.abs(today.getTime() - date.getTime())
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60))
    
    if (diffHours < 1) {
      const diffMinutes = Math.floor(diffTime / (1000 * 60))
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
    } else {
      const diffDays = Math.floor(diffHours / 24)
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
    }
  }

  return (
    <div 
      className={`bg-white rounded-lg border border-gray-200 p-4 transition-all ${
        campground.providerUrl ? 'cursor-pointer hover:shadow-lg hover:border-green-300' : 'hover:shadow-md'
      }`}
      onClick={handleCardClick}
    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3 className="text-lg mb-1">{campground.name}</h3>
            {campground.providerUrl && (
              <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <MapPin className="w-4 h-4" />
            <span>{campground.state}</span>
            {showDistance && campground.distance && (
              <span className="text-green-600">• {Math.round(campground.distance)} mi</span>
            )}
          </div>
        </div>
        
        {onFavoriteToggle && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onFavoriteToggle(campground.id)
            }}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <Heart
              className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'}`}
            />
          </button>
        )}
      </div>

      <p className="text-sm text-gray-600 mb-3">{campground.description}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="w-4 h-4" />
          <span>{campground.sites} sites</span>
        </div>

        <div className="flex flex-col items-end gap-1">
          {/* Average Rating Display */}
          {averageRating > 0 && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{averageRating.toFixed(1)}</span>
              <span className="text-gray-500">({totalRatings})</span>
            </div>
          )}

          {/* User Rating Input */}
          {onRate && (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleStarClick(star)
                  }}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(0)}
                  className="p-0.5"
                >
                  <Star
                    className={`w-4 h-4 ${
                      star <= (hoveredStar || userRating || 0)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {campground.siteName && (
        <div className="mt-3 pt-3 border-t border-gray-200">
          <div className="text-sm">
            <span className="text-gray-600">Available: </span>
            <span className="font-medium">{campground.siteName}</span>
            {campground.availableDate && (
              <span className="text-gray-600"> • {campground.availableDate}</span>
            )}
            {campground.nights && (
              <span className="text-gray-600"> • {campground.nights} night(s)</span>
            )}
            {campground.availableSites && (
              <span className="text-green-600 ml-2">• {campground.availableSites} site(s) available</span>
            )}
          </div>
        </div>
      )}

      {campground.canceledAt && (
        <div className="mt-2 pt-2 border-t border-orange-200 bg-orange-50 -mx-4 -mb-4 px-4 py-2 rounded-b-lg">
          <div className="text-sm text-orange-700">
            <span className="font-medium">Recently canceled</span> • {formatCanceledDate(campground.canceledAt)}
          </div>
        </div>
      )}
    </div>
  )
}