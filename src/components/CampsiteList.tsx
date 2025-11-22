import { MapPin, DollarSign, Calendar, Maximize, Star, Camera, ExternalLink } from 'lucide-react';
import { Campsite } from '../App';
import { SiteActions } from './SiteActions';
import { SiteRating } from './SiteRating';

interface CampsiteListProps {
  campsites: Campsite[];
  onSiteView: (site: Campsite) => void;
}

export function CampsiteList({ campsites, onSiteView }: CampsiteListProps) {
  if (campsites.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p>No campsites found. Try adjusting your search filters.</p>
      </div>
    );
  }

  const getSiteUrl = (site: Campsite) => {
    if (site.source === 'recreation.gov') {
      return `https://www.recreation.gov/camping/campgrounds/${site.FacilityID}`;
    } else if (site.source === 'reservecalifornia.com') {
      return `https://www.reservecalifornia.com/`;
    }
    return '#';
  };

  const getCampsitePhotosUrl = (siteName: string) => {
    return `https://www.campsitephotos.com/search?q=${encodeURIComponent(siteName)}`;
  };

  const getSiteDimensions = (site: Campsite) => {
    const dims = site.ATTRIBUTES?.find(attr => 
      attr.AttributeName?.toLowerCase().includes('length') || 
      attr.AttributeName?.toLowerCase().includes('pad')
    );
    return dims?.AttributeValue || null;
  };

  const getMaxVehicleLength = (site: Campsite) => {
    const maxLength = site.PERMITTEDEQUIPMENT?.reduce((max, eq) => {
      return eq.MaxLength && eq.MaxLength > max ? eq.MaxLength : max;
    }, 0);
    return maxLength && maxLength > 0 ? `${maxLength} ft` : null;
  };

  return (
    <div className="space-y-4">
      {campsites.map((site, index) => {
        const dimensions = getSiteDimensions(site);
        const maxVehicle = getMaxVehicleLength(site);
        const siteUrl = getSiteUrl(site);
        
        return (
          <div
            key={site.CampsiteID || index}
            className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
            onClick={() => onSiteView(site)}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-gray-900">{site.CampsiteName || 'Unnamed Site'}</h3>
                  {site.hasPhotos && (
                    <a
                      href={getCampsitePhotosUrl(site.CampsiteName || '')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm hover:bg-blue-200"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Camera className="w-4 h-4" />
                      <span>{site.photoCount || 0} photos</span>
                    </a>
                  )}
                </div>
                <p className="text-gray-600">{site.facilityName}</p>
                {site.state && (
                  <div className="flex items-center gap-1 text-gray-500 mt-1">
                    <MapPin className="w-4 h-4" />
                    <span>{site.state}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <SiteActions
                  siteId={site.CampsiteID || `${index}`}
                  siteName={site.CampsiteName || 'Unnamed Site'}
                  facilityId={site.FacilityID || ''}
                  facilityName={site.facilityName || ''}
                  source={site.source || 'recreation.gov'}
                />
                <a
                  href={siteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span>Book Now</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              {site.CampsiteType && (
                <div>
                  <p className="text-gray-500 text-sm">Type</p>
                  <p className="text-gray-900">{site.CampsiteType}</p>
                </div>
              )}
              
              {site.pricePerNight && (
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4 text-green-600" />
                  <div>
                    <p className="text-gray-500 text-sm">Per Night</p>
                    <p className="text-gray-900">${site.pricePerNight}</p>
                  </div>
                </div>
              )}
              
              {site.availableDays && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-gray-500 text-sm">Available Days</p>
                    <p className="text-gray-900">{site.availableDays}</p>
                  </div>
                </div>
              )}
              
              {(dimensions || maxVehicle) && (
                <div className="flex items-center gap-1">
                  <Maximize className="w-4 h-4 text-orange-600" />
                  <div>
                    <p className="text-gray-500 text-sm">Dimensions</p>
                    <p className="text-gray-900">{dimensions || maxVehicle}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Additional Attributes */}
            {site.ATTRIBUTES && site.ATTRIBUTES.length > 0 && (
              <div className="mb-4">
                <p className="text-gray-700 mb-2">Features:</p>
                <div className="flex flex-wrap gap-2">
                  {site.ATTRIBUTES.slice(0, 6).map((attr, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                    >
                      {attr.AttributeName}: {attr.AttributeValue}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {site.reviews && site.reviews.length > 0 && (
              <div className="border-t pt-4 mt-4">
                <p className="text-gray-700 mb-2">Reviews:</p>
                <div className="space-y-2">
                  {site.reviews.slice(0, 2).map((review, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-gray-500 text-sm">via {review.source}</span>
                      </div>
                      <p className="text-gray-700 text-sm">{review.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Source Badge */}
            <div className="flex items-center gap-2 mt-4">
              <span className="text-gray-500 text-sm">Source:</span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                {site.source || 'recreation.gov'}
              </span>
              {site.CampsiteAccessible && (
                <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                  Accessible
                </span>
              )}
            </div>

            {/* User Ratings */}
            <SiteRating
              siteId={site.CampsiteID || `${index}`}
              siteName={site.CampsiteName || 'Unnamed Site'}
            />
          </div>
        );
      })}
    </div>
  );
}