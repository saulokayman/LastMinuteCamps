import { useState } from 'react'
import { X, MapPin, Heart, Star, Settings } from 'lucide-react'

export function WelcomeBanner() {
  const [show, setShow] = useState(() => {
    return !localStorage.getItem('lastminutecamps-welcome-dismissed')
  })

  const handleDismiss = () => {
    localStorage.setItem('lastminutecamps-welcome-dismissed', 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg p-6 mb-6">
      <button
        onClick={handleDismiss}
        className="float-right p-1 hover:bg-white/50 rounded"
      >
        <X className="w-4 h-4 text-gray-500" />
      </button>

      <h3 className="mb-3 text-green-800">Welcome to LastMinuteCamps! 🏕️</h3>
      
      <p className="text-sm text-gray-700 mb-4">
        Find available campsites across the United States with real-time updates on cancellations and last-minute availability.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
        <div className="flex gap-2">
          <MapPin className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-gray-900">Search by location</p>
            <p className="text-xs text-gray-600">Find campsites near you or any state</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Heart className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-gray-900">Save favorites</p>
            <p className="text-xs text-gray-600">Keep track of your preferred sites</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Star className="w-4 h-4 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-gray-900">Rate campgrounds</p>
            <p className="text-xs text-gray-600">Share your experiences</p>
          </div>
        </div>

        <div className="flex gap-2">
          <Settings className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-gray-900">Admin features</p>
            <p className="text-xs text-gray-600">Manage ads and monetization</p>
          </div>
        </div>
      </div>
    </div>
  )
}