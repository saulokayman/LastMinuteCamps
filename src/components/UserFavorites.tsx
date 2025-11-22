import { useState, useEffect } from 'react';
import { Heart, ExternalLink, Trash2, MapPin, DollarSign } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';

interface Favorite {
  siteId: string;
  siteName: string;
  facilityId: string;
  facilityName: string;
  source: string;
  addedAt: string;
}

export function UserFavorites() {
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        window.location.href = '/';
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/user/favorites`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setFavorites(data.favorites || []);
      } else {
        setError('Failed to load favorites');
      }
    } catch (err) {
      console.error('Error fetching favorites:', err);
      setError('Failed to load favorites');
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (siteId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/user/favorites/${siteId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        setFavorites(favorites.filter(f => f.siteId !== siteId));
      } else {
        alert('Failed to remove favorite');
      }
    } catch (err) {
      console.error('Error removing favorite:', err);
      alert('Failed to remove favorite');
    }
  };

  const getReservationUrl = (favorite: Favorite) => {
    if (favorite.source === 'recreation.gov') {
      return `https://www.recreation.gov/camping/campsites/${favorite.siteId}`;
    } else {
      return `https://www.reservecalifornia.com/CalendarAvailability.aspx?facilityid=${favorite.facilityId}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-700 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <a href="/" className="text-white hover:underline">← Back to Home</a>
            <div>
              <h1 className="text-white">My Favorite Sites</h1>
              <p className="text-green-100">Save your favorite campsites for quick access</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {favorites.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-gray-900 mb-2">No favorites yet</h2>
            <p className="text-gray-600 mb-6">
              Start adding your favorite campsites to keep track of the places you love!
            </p>
            <a
              href="/"
              className="inline-block px-6 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
            >
              Browse Campsites
            </a>
          </div>
        ) : (
          <div className="grid gap-6">
            {favorites.map((favorite) => (
              <div
                key={favorite.siteId}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-2">
                      <Heart className="w-6 h-6 text-red-500 fill-red-500 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-gray-900 mb-1">{favorite.siteName}</h3>
                        <div className="flex items-center gap-2 text-gray-600 mb-2">
                          <MapPin className="w-4 h-4" />
                          <span>{favorite.facilityName}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                            {favorite.source}
                          </span>
                          <span>Added {new Date(favorite.addedAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <a
                      href={getReservationUrl(favorite)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                      title="View on reservation site"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                    <button
                      onClick={() => removeFavorite(favorite.siteId)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove from favorites"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}