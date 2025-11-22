import { useState, useEffect } from 'react';
import { Sparkles, MapPin, ExternalLink, Calendar } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface NewlySite {
  siteId: string;
  siteName: string;
  facilityId: string;
  facilityName: string;
  facilityState: string;
  facilityCity: string;
  reservationUrl: string;
  becameAvailableAt: string;
  date: string;
}

export function NewlyAvailable() {
  const [sites, setSites] = useState<NewlySite[]>([]);
  const [loading, setLoading] = useState(true);
  const [takingSnapshot, setTakingSnapshot] = useState(false);

  useEffect(() => {
    fetchNewlyAvailable();
  }, []);

  const fetchNewlyAvailable = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/newly-available`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSites(data);
      } else {
        console.error('Error fetching newly available sites');
      }
    } catch (error) {
      console.error('Error fetching newly available sites:', error);
    } finally {
      setLoading(false);
    }
  };

  const takeSnapshot = async () => {
    try {
      setTakingSnapshot(true);
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/take-snapshot`,
        {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        console.log('Snapshot taken:', data);
        // Refresh the newly available list
        await fetchNewlyAvailable();
      } else {
        const errorData = await response.json();
        console.error('Error taking snapshot:', errorData);
      }
    } catch (error) {
      console.error('Error taking snapshot:', error);
    } finally {
      setTakingSnapshot(false);
    }
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date().getTime();
    const then = new Date(timestamp).getTime();
    const diff = now - then;

    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="mb-4 text-gray-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-yellow-600" />
          Newly Available Sites
        </h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-700"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-gray-900 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-yellow-600" />
          Newly Available Sites
        </h2>
        <div className="flex gap-2">
          <button
            onClick={fetchNewlyAvailable}
            className="text-yellow-600 hover:text-yellow-700 text-sm"
          >
            Refresh
          </button>
          <button
            onClick={takeSnapshot}
            disabled={takingSnapshot}
            className="px-3 py-1 bg-yellow-600 text-white rounded hover:bg-yellow-700 text-sm disabled:opacity-50"
          >
            {takingSnapshot ? 'Taking Snapshot...' : 'Take Snapshot'}
          </button>
        </div>
      </div>

      {sites.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">
            No newly available sites yet. Take a daily snapshot to track changes!
          </p>
          <button
            onClick={takeSnapshot}
            disabled={takingSnapshot}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
          >
            {takingSnapshot ? 'Taking Snapshot...' : 'Take First Snapshot'}
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sites.map((site) => (
            <a
              key={`${site.siteId}-${site.becameAvailableAt}`}
              href={site.reservationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow hover:border-yellow-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-gray-900">{site.siteName}</h3>
                    <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-xs">
                      New
                    </span>
                  </div>
                  
                  <p className="text-gray-700 text-sm mb-2">{site.facilityName}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    {site.facilityCity && site.facilityState && (
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{site.facilityCity}, {site.facilityState}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>Available: {site.date}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2">
                  <span className="text-xs text-gray-500">
                    {formatTimeAgo(site.becameAvailableAt)}
                  </span>
                  <ExternalLink className="w-5 h-5 text-yellow-600" />
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
