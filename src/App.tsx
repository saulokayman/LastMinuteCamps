import { useState, useEffect } from 'react';
import { SearchFilters } from './components/SearchFilters';
import { CampsiteList } from './components/CampsiteList';
import { NewlyAvailableSites } from './components/NewlyAvailableSites';
import { PopularSites } from './components/PopularSites';
import { FeaturedParks } from './components/FeaturedParks';
import { CampsiteMap } from './components/CampsiteMap';
import { AdUnit } from './components/AdUnit';
import { ApiTest } from './components/ApiTest';
import { ApiDebugger } from './components/ApiDebugger';
import { UserAuth } from './components/UserAuth';
import { UserFavorites } from './components/UserFavorites';
import { UserAlerts } from './components/UserAlerts';
import { UserRatings } from './components/UserRatings';
import { UserSettings } from './components/UserSettings';
import { AdminPanel } from './components/AdminPanel';
import { PromoteAdmin } from './components/PromoteAdmin';
import { projectId, publicAnonKey } from './utils/supabase/info';

export interface Campsite {
  CampsiteID?: string;
  FacilityID?: string;
  CampsiteName?: string;
  CampsiteType?: string;
  TypeOfUse?: string;
  Loop?: string;
  CampsiteAccessible?: boolean;
  CampsiteReservable?: boolean;
  CampsiteLatitude?: number;
  CampsiteLongitude?: number;
  ATTRIBUTES?: Array<{
    AttributeName?: string;
    AttributeValue?: string;
  }>;
  PERMITTEDEQUIPMENT?: Array<{
    EquipmentName?: string;
    MaxLength?: number;
  }>;
  becameAvailableAt?: string;
  source?: 'recreation.gov' | 'reservecalifornia.com';
  facilityName?: string;
  state?: string;
  pricePerNight?: number;
  availableDays?: number;
  hasPhotos?: boolean;
  photoCount?: number;
  reviews?: Array<{
    rating: number;
    text: string;
    source: string;
  }>;
}

export interface SearchFilters {
  query: string;
  state: string;
  activityType: string;
  source: 'all' | 'recreation.gov' | 'reservecalifornia.com';
  startDate: string;
  endDate: string;
  accessible?: boolean;
}

export default function App() {
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [campsites, setCampsites] = useState<Campsite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    state: '',
    activityType: '',
    source: 'all',
    startDate: '',
    endDate: '',
  });

  // Listen for URL changes
  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Detect user location on mount (only for homepage)
  useEffect(() => {
    if (currentPath === '/') {
      detectUserLocation();
      trackPageView();
    }
  }, [currentPath]);

  const trackPageView = async () => {
    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/track-pageview`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          page: window.location.pathname,
          referrer: document.referrer || 'direct',
          userAgent: navigator.userAgent,
        }),
      });
    } catch (err) {
      console.error('Error tracking pageview:', err);
    }
  };

  const detectUserLocation = async () => {
    if ('geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: false,
          });
        });

        const { latitude, longitude } = position.coords;

        // Use reverse geocoding to get state
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`,
          {
            headers: {
              'User-Agent': 'CampFinder-App',
            },
          }
        );

        if (response.ok) {
          const data = await response.json();
          const stateCode = data.address?.['ISO3166-2-lvl4']?.split('-')[1] || data.address?.state_code;
          
          if (stateCode) {
            setFilters(prev => ({ ...prev, state: stateCode }));
            console.log('User location detected:', stateCode);
          }
        }
      } catch (error) {
        console.log('Geolocation not available or denied:', error);
        // Silently fail - user can manually select state
      }
    }
  };

  const searchCampsites = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (filters.query) params.append('query', filters.query);
      if (filters.state) params.append('state', filters.state);
      if (filters.activityType) params.append('activityType', filters.activityType);
      params.append('source', filters.source);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.accessible) params.append('accessible', 'true');

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/search?${params}`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setCampsites(data.campsites || []);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to search campsites');
        console.error('Search error:', errorData);
      }
    } catch (err) {
      setError('An error occurred while searching');
      console.error('Search error:', err);
    } finally {
      setLoading(false);
    }
  };

  const trackSiteView = async (site: Campsite) => {
    try {
      await fetch(`https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/track-view`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          siteId: site.CampsiteID,
          siteName: site.CampsiteName,
        }),
      });
    } catch (err) {
      console.error('Error tracking view:', err);
    }
  };

  // Route handling - render different pages based on path
  if (currentPath === '/favorites') {
    return <UserFavorites />;
  }
  if (currentPath === '/alerts') {
    return <UserAlerts />;
  }
  if (currentPath === '/ratings') {
    return <UserRatings />;
  }
  if (currentPath === '/settings') {
    return <UserSettings />;
  }
  if (currentPath === '/admin') {
    return <AdminPanel />;
  }
  if (currentPath === '/promote-admin') {
    return <PromoteAdmin />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-green-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-white">CampFinder</h1>
              <p className="text-green-100">Find and book your perfect campsite</p>
            </div>
            <UserAuth />
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Top Ad Unit */}
        <AdUnit type="google" format="horizontal" className="mb-8" />

        {/* API Connection Test */}
        <div className="mb-8">
          <ApiTest />
        </div>

        {/* API Debugger */}
        <div className="mb-8">
          <ApiDebugger />
        </div>

        {/* Search Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <SearchFilters
            filters={filters}
            onFiltersChange={setFilters}
            onSearch={searchCampsites}
            loading={loading}
          />
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-8">
            <p>{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Featured Parks */}
            <FeaturedParks onParkView={(park) => console.log('Viewing park:', park)} />

            {/* Newly Available Sites */}
            <NewlyAvailableSites onSiteView={trackSiteView} />

            {/* Popular Sites */}
            <PopularSites onSiteView={trackSiteView} />

            {/* Search Results */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="mb-4 text-gray-900">Search Results</h2>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
                </div>
              ) : (
                <CampsiteList
                  campsites={campsites}
                  onSiteView={trackSiteView}
                />
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Map */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="mb-4 text-gray-900">Available Sites Map</h3>
              <CampsiteMap campsites={campsites} />
            </div>

            {/* Sidebar Ads */}
            <AdUnit type="amazon" format="vertical" />
            <AdUnit type="google" format="vertical" />
          </div>
        </div>

        {/* Bottom Ad Unit */}
        <AdUnit type="google" format="horizontal" className="mt-8" />
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="mb-4 text-white">About CampFinder</h3>
              <p className="text-gray-300">
                Aggregating campsite availability from Recreation.gov and ReserveCalifornia.com to help you find your perfect camping spot.
              </p>
            </div>
            <div>
              <h3 className="mb-4 text-white">Data Sources</h3>
              <ul className="space-y-2 text-gray-300">
                <li>
                  <a href="https://www.recreation.gov" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                    Recreation.gov
                  </a>
                </li>
                <li>
                  <a href="https://www.reservecalifornia.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                    ReserveCalifornia.com
                  </a>
                </li>
                <li>
                  <a href="https://www.campsitephotos.com" target="_blank" rel="noopener noreferrer" className="hover:text-white">
                    CampsitePhotos.com
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-white">Disclaimer</h3>
              <p className="text-gray-300 text-sm">
                Please verify all information on the official booking sites. Availability is subject to change.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}