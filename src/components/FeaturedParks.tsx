import { useState, useEffect } from 'react';
import { Trees, MapPin, Tent, ExternalLink, Phone, Globe } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface Park {
  FacilityID: string;
  FacilityName: string;
  FacilityDescription?: string;
  FacilityPhone?: string;
  FacilityEmail?: string;
  FacilityReservationURL?: string;
  FacilityTypeDescription?: string;
  FacilityState?: string;
  FacilityCity?: string;
  FacilityLatitude?: number;
  FacilityLongitude?: number;
  availableSitesCount: number;
  views: number;
  MEDIA?: Array<{
    URL: string;
    Title?: string;
  }>;
}

interface FeaturedParksProps {
  onParkView: (park: Park) => void;
}

export function FeaturedParks({ onParkView }: FeaturedParksProps) {
  const [parks, setParks] = useState<Park[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFeaturedParks();
    // Refresh every 10 minutes
    const interval = setInterval(fetchFeaturedParks, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchFeaturedParks = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/featured-parks`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setParks(data);
      } else {
        const errorData = await response.json();
        console.error('Error fetching featured parks:', errorData);
      }
    } catch (error) {
      console.error('Error fetching featured parks:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackParkView = async (park: Park) => {
    onParkView(park);
    
    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/track-facility-view`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          facilityId: park.FacilityID,
          facilityName: park.FacilityName,
        }),
      });
    } catch (err) {
      console.error('Error tracking park view:', err);
    }
  };

  const getParkUrl = (park: Park) => {
    return park.FacilityReservationURL || `https://www.recreation.gov/camping/campgrounds/${park.FacilityID}`;
  };

  // Helper function to strip HTML tags and clean up description
  const cleanDescription = (description?: string) => {
    if (!description) return '';
    
    // Remove HTML tags
    const stripped = description.replace(/<[^>]*>/g, ' ');
    
    // Remove extra whitespace
    const cleaned = stripped.replace(/\s+/g, ' ').trim();
    
    // Remove common prefixes like "Overview" if they appear at the start
    const withoutPrefix = cleaned.replace(/^(Overview|Description)\s*/i, '');
    
    return withoutPrefix;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="mb-4 text-gray-900 flex items-center gap-2">
          <Trees className="w-6 h-6 text-green-600" />
          Featured Parks with Availability
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
        </div>
      </div>
    );
  }

  if (parks.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="mb-4 text-gray-900 flex items-center gap-2">
          <Trees className="w-6 h-6 text-green-600" />
          Featured Parks with Availability
        </h2>
        <p className="text-gray-500 text-center py-8">
          No featured parks available at the moment. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-gray-900 flex items-center gap-2">
          <Trees className="w-6 h-6 text-green-600" />
          Featured Parks with Availability
        </h2>
        <button
          onClick={fetchFeaturedParks}
          className="text-green-600 hover:text-green-700 text-sm"
        >
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {parks.map((park) => {
          // Get the first image from MEDIA array
          const firstImage = park.MEDIA && park.MEDIA.length > 0 ? park.MEDIA[0] : null;
          const imageUrl = firstImage?.URL || null;
          const parkUrl = getParkUrl(park);

          return (
            <a
              key={park.FacilityID}
              href={parkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow block"
              onClick={() => trackParkView(park)}
            >
              {/* Park Image */}
              {imageUrl && (
                <div className="relative h-48 overflow-hidden">
                  <ImageWithFallback
                    src={imageUrl}
                    alt={park.FacilityName}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Park Header */}
              <div className="bg-gradient-to-br from-green-600 to-green-700 p-4 text-white">
                <h3 className="text-white mb-1">{park.FacilityName}</h3>
                {park.FacilityState && park.FacilityCity && (
                  <div className="flex items-center gap-1 text-green-100 text-sm">
                    <MapPin className="w-4 h-4" />
                    <span>{park.FacilityCity}, {park.FacilityState}</span>
                  </div>
                )}
              </div>

              {/* Park Details */}
              <div className="p-4">
                {park.FacilityDescription && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {cleanDescription(park.FacilityDescription)}
                  </p>
                )}

                {/* Availability Badge */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center gap-1 px-3 py-2 bg-green-100 text-green-800 rounded-lg flex-1">
                    <Tent className="w-5 h-5" />
                    <div>
                      <p className="text-xs text-green-600">Available Sites</p>
                      <p className="text-green-900">{park.availableSitesCount}</p>
                    </div>
                  </div>
                </div>

                {/* Park Type */}
                {park.FacilityTypeDescription && (
                  <div className="mb-3">
                    <span className="inline-block px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {park.FacilityTypeDescription}
                    </span>
                  </div>
                )}

                {/* Contact Info */}
                {park.FacilityPhone && (
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="w-4 h-4" />
                      <span>{park.FacilityPhone}</span>
                    </div>
                  </div>
                )}
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}