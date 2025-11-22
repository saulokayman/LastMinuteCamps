import { useState, useEffect } from 'react';
import { Heart, Bell, Star } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';

interface SiteActionsProps {
  siteId: string;
  siteName: string;
  facilityId: string;
  facilityName: string;
  source: string;
}

export function SiteActions({ siteId, siteName, facilityId, facilityName, source }: SiteActionsProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [hasAlert, setHasAlert] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session);
    
    if (session) {
      checkFavoriteStatus(session.access_token);
      checkAlertStatus(session.access_token);
    }
  };

  const checkFavoriteStatus = async (accessToken: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/user/favorites`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setIsFavorited(data.favorites.some((f: any) => f.siteId === siteId));
      }
    } catch (err) {
      console.error('Error checking favorite status:', err);
    }
  };

  const checkAlertStatus = async (accessToken: string) => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/user/alerts`,
        {
          headers: { 'Authorization': `Bearer ${accessToken}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setHasAlert(data.alerts.some((a: any) => a.siteId === siteId && a.active));
      }
    } catch (err) {
      console.error('Error checking alert status:', err);
    }
  };

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isLoggedIn) {
      alert('Please sign in to save favorites');
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      if (isFavorited) {
        // Remove favorite
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/user/favorites/${siteId}`,
          {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          }
        );

        if (response.ok) {
          setIsFavorited(false);
        }
      } else {
        // Add favorite
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/user/favorites`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ siteId, siteName, facilityId, facilityName, source }),
          }
        );

        if (response.ok) {
          setIsFavorited(true);
        }
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
    }
  };

  const handleAlert = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!isLoggedIn) {
      alert('Please sign in to create alerts');
      return;
    }

    // Navigate to alerts page with pre-filled data
    const params = new URLSearchParams({
      siteId,
      siteName,
      facilityId,
      facilityName,
      source,
    });
    window.location.href = `/alerts?${params.toString()}`;
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleFavorite}
        className={`p-2 rounded-lg transition-colors ${
          isFavorited
            ? 'text-red-500 bg-red-50 hover:bg-red-100'
            : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
        }`}
        title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      >
        <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
      </button>

      <button
        onClick={handleAlert}
        className={`p-2 rounded-lg transition-colors ${
          hasAlert
            ? 'text-blue-500 bg-blue-50 hover:bg-blue-100'
            : 'text-gray-400 hover:text-blue-500 hover:bg-blue-50'
        }`}
        title={hasAlert ? 'Manage alerts' : 'Create alert'}
      >
        <Bell className={`w-5 h-5 ${hasAlert ? 'fill-current' : ''}`} />
      </button>
    </div>
  );
}