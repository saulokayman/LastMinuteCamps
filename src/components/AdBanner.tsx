import { useEffect, useState } from 'react'
import { projectId, publicAnonKey } from '../utils/supabase/info.tsx'

interface AdBannerProps {
  position: 'top' | 'middle' | 'bottom' | 'sidebar'
}

export function AdBanner({ position }: AdBannerProps) {
  const [ad, setAd] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAds()
  }, [position])

  const loadAds = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2b623195/ads?position=${position}`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setAd(data.ad)
      }
    } catch (error) {
      console.error('Error loading ads:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !ad) {
    return (
      <div className="bg-gray-100 rounded-lg p-4 text-center text-sm text-gray-500">
        Advertisement Space
      </div>
    )
  }

  return (
    <div 
      className="bg-gray-50 rounded-lg p-4 border border-gray-200"
      dangerouslySetInnerHTML={{ __html: ad.content }}
    />
  )
}