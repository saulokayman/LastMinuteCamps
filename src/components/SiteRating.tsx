import { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';

interface SiteRatingProps {
  siteId: string;
  siteName: string;
}

interface Rating {
  userId: string;
  userName: string;
  rating: number;
  review: string;
  createdAt: string;
}

export function SiteRating({ siteId, siteName }: SiteRatingProps) {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [average, setAverage] = useState(0);
  const [count, setCount] = useState(0);
  const [userRating, setUserRating] = useState(0);
  const [userReview, setUserReview] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchRatings();
  }, [siteId]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setIsLoggedIn(!!session);
  };

  const fetchRatings = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/ratings/${siteId}`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setRatings(data.ratings || []);
        setAverage(data.average || 0);
        setCount(data.count || 0);
      }
    } catch (err) {
      console.error('Error fetching ratings:', err);
    }
  };

  const handleSubmitRating = async () => {
    if (!isLoggedIn || userRating === 0) return;

    setSubmitting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/ratings/${siteId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session!.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            rating: userRating,
            review: userReview,
          }),
        }
      );

      if (response.ok) {
        await fetchRatings();
        setShowRatingForm(false);
        setUserRating(0);
        setUserReview('');
      }
    } catch (err) {
      console.error('Error submitting rating:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-5 h-5 ${
                  star <= Math.round(average)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">
            {average > 0 ? average.toFixed(1) : 'No ratings'} ({count} {count === 1 ? 'rating' : 'ratings'})
          </span>
        </div>

        {isLoggedIn && (
          <button
            onClick={() => setShowRatingForm(!showRatingForm)}
            className="text-sm text-green-700 hover:underline"
          >
            {showRatingForm ? 'Cancel' : 'Rate this site'}
          </button>
        )}
      </div>

      {showRatingForm && (
        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <p className="text-sm text-gray-700 mb-2">Your rating:</p>
          <div className="flex gap-2 mb-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setUserRating(star)}
                className="transition-transform hover:scale-110"
              >
                <Star
                  className={`w-8 h-8 ${
                    star <= userRating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>

          <textarea
            value={userReview}
            onChange={(e) => setUserReview(e.target.value)}
            placeholder="Write a review (optional)"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm mb-3"
            rows={3}
          />

          <button
            onClick={handleSubmitRating}
            disabled={submitting || userRating === 0}
            className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors disabled:opacity-50 text-sm"
          >
            {submitting ? 'Submitting...' : 'Submit Rating'}
          </button>
        </div>
      )}

      {ratings.length > 0 && (
        <div className="space-y-3">
          {ratings.slice(0, 3).map((rating, index) => (
            <div key={index} className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900">{rating.userName}</span>
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= rating.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {rating.review && (
                <p className="text-sm text-gray-600">{rating.review}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {new Date(rating.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}