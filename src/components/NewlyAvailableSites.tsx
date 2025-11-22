import { useState, useEffect } from 'react';
import { Clock, DollarSign, Calendar, Maximize, Camera, ExternalLink, Sparkles } from 'lucide-react';
import { Campsite } from '../App';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface NewlyAvailableSitesProps {
  onSiteView: (site: Campsite) => void;
}

export function NewlyAvailableSites({ onSiteView }: NewlyAvailableSitesProps) {
  const [sites, setSites] = useState<Campsite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNewlyAvailable();
    // Refresh every 5 minutes
    const interval = setInterval(fetchNewlyAvailable, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchNewlyAvailable = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/newly-available`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSites(data.slice(0, 10)); // Show top 10
      }
    } catch (error) {
      console.error('Error fetching newly available sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return 'Just now';
  };

  const getSiteUrl = (site: Campsite) => {
    if (site.source === 'recreation.gov') {
      return `https://www.recreation.gov/camping/campgrounds/${site.FacilityID}`;
    }
    return 'https://www.reservecalifornia.com/';
  };

  const getCampsitePhotosUrl = (siteName: string) => {
    return `https://www.campsitephotos.com/search?q=${encodeURIComponent(siteName)}`;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="mb-4 text-gray-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-yellow-500" />
          Newly Available Sites
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-700"></div>
        </div>
      </div>
    );
  }

  if (sites.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="mb-4 text-gray-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-yellow-500" />
          Newly Available Sites
        </h2>
        <div className="text-center py-8">
          <p className="text-gray-500 mb-2">
            No newly available sites at the moment.
          </p>
          <p className="text-gray-400 text-sm">
            Automatic snapshots run 3x daily at 8am, 12pm, and 8pm Pacific time
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-yellow-500" />
          Newly Available Sites
        </h2>
        <button
          onClick={fetchNewlyAvailable}
          className="text-green-600 hover:text-green-700 text-sm"
        >
          Refresh
        </button>
      </div>

      <div className="space-y-4">
        {sites.map((site, index) => (
          <div
            key={site.CampsiteID || index}
            className="border border-yellow-200 bg-yellow-50 rounded-lg p-4 hover:shadow-md transition-shadow"
            onClick={() => onSiteView(site)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-gray-900">{site.CampsiteName}</h3>
                  {site.hasPhotos && (
                    <a
                      href={getCampsitePhotosUrl(site.CampsiteName || '')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Camera className="w-3 h-3" />
                      <span className="text-xs">{site.photoCount || 0}</span>
                    </a>
                  )}
                </div>
                <p className="text-gray-600 text-sm">{site.facilityName}</p>
                {site.becameAvailableAt && (
                  <div className="flex items-center gap-1 text-yellow-700 mt-1">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">Available {getTimeAgo(site.becameAvailableAt)}</span>
                  </div>
                )}
              </div>
              <a
                href={getSiteUrl(site)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors text-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <span>Book</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="grid grid-cols-3 gap-3">
              {site.availableDays && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-gray-500 text-xs">Days Available</p>
                    <p className="text-gray-900 text-sm">{site.availableDays}</p>
                  </div>
                </div>
              )}

              {site.pricePerNight && (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-gray-500 text-xs">Per Night</p>
                    <p className="text-gray-900 text-sm">${site.pricePerNight}</p>
                  </div>
                </div>
              )}

              {site.PERMITTEDEQUIPMENT && site.PERMITTEDEQUIPMENT.length > 0 && (
                <div className="flex items-center gap-1">
                  <Maximize className="w-4 h-4 text-orange-600" />
                  <div>
                    <p className="text-gray-500 text-xs">Max Length</p>
                    <p className="text-gray-900 text-sm">
                      {site.PERMITTEDEQUIPMENT[0].MaxLength}ft
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Site Features */}
            {site.ATTRIBUTES && site.ATTRIBUTES.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {site.ATTRIBUTES.slice(0, 4).map((attr, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 bg-white text-gray-700 rounded text-xs"
                  >
                    {attr.AttributeName}: {attr.AttributeValue}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}