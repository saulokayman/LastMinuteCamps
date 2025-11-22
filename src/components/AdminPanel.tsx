import { useState, useEffect } from 'react';
import { AdminDashboard } from './admin/AdminDashboard';
import { supabase } from '../utils/supabase/client';
import { projectId } from '../utils/supabase/info';

export function AdminPanel() {
  const [loading, setLoading] = useState(true);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [admin, setAdmin] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setError('Please log in to access the admin panel');
        setLoading(false);
        return;
      }

      // Fetch user profile to check admin status
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/user/profile`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const userData = await response.json();
        
        if (userData.isAdmin) {
          setAccessToken(session.access_token);
          setAdmin(userData);
        } else {
          setError('You do not have admin access');
        }
      } else {
        setError('Failed to verify admin access');
      }
    } catch (err) {
      console.error('Error checking admin access:', err);
      setError('An error occurred while checking admin access');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.history.pushState({}, '', '/');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying admin access...</p>
        </div>
      </div>
    );
  }

  if (error || !accessToken || !admin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-green-700 text-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <h1 className="text-white">Admin Panel</h1>
          </div>
        </header>
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-white rounded-lg shadow-md p-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
              <h2 className="text-red-900 mb-2">Access Denied</h2>
              <p className="text-red-800">{error || 'You do not have permission to access the admin panel.'}</p>
            </div>
            <button
              onClick={() => {
                window.history.pushState({}, '', '/');
                window.dispatchEvent(new PopStateEvent('popstate'));
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              ← Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <AdminDashboard accessToken={accessToken} admin={admin} onLogout={handleLogout} />;
}