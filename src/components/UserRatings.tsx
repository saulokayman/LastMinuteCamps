import { useState, useEffect } from 'react';
import { Star, MapPin, Calendar, ExternalLink } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';

interface UserRating {
  siteId: string;
  userId: string;
  userName: string;
  rating: number;
  review: string;
  createdAt: string;
}

export function UserRatings() {
  const [ratings, setRatings] = useState<UserRating[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchRatings();
  }, []);

  const fetchRatings = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        window.location.href = '/';
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/user/ratings`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRatings(data.ratings || []);
      } else {
        setError('Failed to load ratings');
      }
    } catch (err) {
      console.error('Error fetching ratings:', err);
      setError('Failed to load ratings');
    } finally {
      setLoading(false);
    }
  };

  const getAverageRating = () => {
    if (ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, r) => acc + r.rating, 0);
    return (sum / ratings.length).toFixed(1);
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
              <h1 className="text-white">My Ratings & Reviews</h1>
              <p className="text-green-100">Your campsite reviews and ratings</p>
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

        {/* Stats Summary */}
        {ratings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-2">
                <Star className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{getAverageRating()}</p>
                  <p className="text-sm text-gray-600">Average Rating</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-2">
                <Star className="w-8 h-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{ratings.length}</p>
                  <p className="text-sm text-gray-600">Total Reviews</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-2">
                <Star className="w-8 h-8 text-green-600 fill-green-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {ratings.filter(r => r.rating === 5).length}
                  </p>
                  <p className="text-sm text-gray-600">5-Star Ratings</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Ratings List */}
        {ratings.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-gray-900 mb-2">No ratings yet</h2>
            <p className="text-gray-600 mb-6">
              Start rating campsites to share your experience with other campers!
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
            {ratings.map((rating, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-6 h-6 ${
                            star <= rating.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-lg font-semibold text-gray-900 ml-2">
                        {rating.rating}.0
                      </span>
                    </div>

                    <p className="text-gray-900 mb-3">Site ID: {rating.siteId}</p>

                    {rating.review && (
                      <div className="bg-gray-50 rounded-lg p-4 mb-3">
                        <p className="text-gray-700">{rating.review}</p>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Calendar className="w-4 h-4" />
                      <span>Reviewed on {new Date(rating.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <a
                    href={`https://www.recreation.gov/camping/campsites/${rating.siteId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                    title="View site"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-blue-900 mb-2">💡 Tip</h3>
          <p className="text-blue-800 text-sm">
            Your ratings and reviews help other campers make informed decisions. 
            Be honest and detailed in your reviews to provide the most value!
          </p>
        </div>
      </div>
    </div>
  );
}