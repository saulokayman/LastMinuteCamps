import { useState, useEffect } from 'react';
import { TrendingUp, Eye, ExternalLink, Camera } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface PopularSite {
  siteId: string;
  siteName: string;
  views: number;
  lastViewed: string;
}

interface PopularSitesProps {
  onSiteView: (site: any) => void;
}

export function PopularSites({ onSiteView }: PopularSitesProps) {
  const [sites, setSites] = useState<PopularSite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPopularSites();
  }, []);

  const fetchPopularSites = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/popular-sites`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setSites(data.slice(0, 8)); // Show top 8
      }
    } catch (error) {
      console.error('Error fetching popular sites:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="mb-4 text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-orange-500" />
          Most Popular Available Sites
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
          <TrendingUp className="w-6 h-6 text-orange-500" />
          Most Popular Available Sites
        </h2>
        <p className="text-gray-500 text-center py-8">
          No popular sites data available yet. Start exploring to see trending campsites!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-900 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-orange-500" />
          Most Popular Available Sites
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sites.map((site, index) => (
          <div
            key={site.siteId}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => onSiteView(site)}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="flex items-center justify-center w-6 h-6 bg-orange-100 text-orange-600 rounded-full text-sm">
                    {index + 1}
                  </span>
                  <h4 className="text-gray-900">{site.siteName}</h4>
                </div>
                <div className="flex items-center gap-1 text-gray-500 text-sm">
                  <Eye className="w-4 h-4" />
                  <span>{site.views} views</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
