import { useState, useEffect } from 'react';
import { User, LogIn, LogOut, Settings, Heart, Bell, Star, Shield } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';

interface UserData {
  id: string;
  email: string;
  name: string;
  isAdmin?: boolean;
}

export function UserAuth() {
  const [user, setUser] = useState<UserData | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    // Check for existing session
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (session && session.access_token) {
        // Fetch user details from backend
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
          setUser(userData);
        }
      }
    } catch (err) {
      console.error('Error checking session:', err);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      console.log('Attempting login with email:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error);
        throw error;
      }

      console.log('Login successful, session:', data.session);

      if (data.session) {
        // Fetch user details
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/user/profile`,
          {
            headers: {
              'Authorization': `Bearer ${data.session.access_token}`,
            },
          }
        );

        if (response.ok) {
          const userData = await response.json();
          console.log('User profile fetched:', userData);
          setUser(userData);
          setShowAuthModal(false);
          setEmail('');
          setPassword('');
        } else {
          const errorText = await response.text();
          console.error('Failed to fetch user profile:', errorText);
          throw new Error('Failed to fetch user profile');
        }
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      console.log('Attempting signup with email:', email);
      
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/user/signup`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, password, name }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Signup error:', errorData);
        throw new Error(errorData.error || 'Failed to sign up');
      }

      const data = await response.json();
      console.log('Signup successful:', data);

      // Show success message
      setSuccessMessage('Account created successfully! Logging you in...');

      // Wait a moment to show the message
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Now login with the new account
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (loginError) {
        console.error('Auto-login error:', loginError);
        throw loginError;
      }

      if (loginData.session) {
        // Fetch user profile
        const profileResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/user/profile`,
          {
            headers: {
              'Authorization': `Bearer ${loginData.session.access_token}`,
            },
          }
        );

        if (profileResponse.ok) {
          const userData = await profileResponse.json();
          setUser(userData);
        }
        
        setShowAuthModal(false);
        setEmail('');
        setPassword('');
        setName('');
        setSuccessMessage(null);
      }
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setShowDropdown(false);
    } catch (err) {
      console.error('Error logging out:', err);
    }
  };

  const navigateTo = (path: string) => {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
    setShowDropdown(false);
  };

  if (user) {
    return (
      <div className="relative">
        <button
          onClick={() => setShowDropdown(!showDropdown)}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
        >
          <User className="w-5 h-5" />
          <span>{user.name}</span>
        </button>

        {showDropdown && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
            <div className="px-4 py-3 border-b border-gray-200">
              <p className="text-sm text-gray-900">{user.name}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>

            <div className="py-2">
              <button
                onClick={() => navigateTo('/favorites')}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <Heart className="w-4 h-4" />
                <span>My Favorites</span>
              </button>

              <button
                onClick={() => navigateTo('/alerts')}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <Bell className="w-4 h-4" />
                <span>Alerts</span>
              </button>

              <button
                onClick={() => navigateTo('/ratings')}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <Star className="w-4 h-4" />
                <span>My Ratings</span>
              </button>

              <button
                onClick={() => navigateTo('/settings')}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-gray-700 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>

              {user.isAdmin && (
                <button
                  onClick={() => navigateTo('/admin')}
                  className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-purple-700 transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  <span>Admin Panel</span>
                </button>
              )}
            </div>

            <div className="border-t border-gray-200 pt-2">
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 px-4 py-2 hover:bg-gray-50 text-red-600 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => {
          setAuthMode('login');
          setShowAuthModal(true);
        }}
        className="flex items-center gap-2 px-4 py-2 bg-white text-green-700 rounded-lg hover:bg-green-50 transition-colors"
      >
        <LogIn className="w-5 h-5" />
        <span>Login</span>
      </button>

      {showAuthModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-gray-900">
                {authMode === 'login' ? 'Login' : 'Sign Up'}
              </h2>
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  setError(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                {error}
              </div>
            )}

            {successMessage && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                {successMessage}
              </div>
            )}

            <form onSubmit={authMode === 'login' ? handleLogin : handleSignup}>
              {authMode === 'signup' && (
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm mb-2">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
                    placeholder="Your name"
                  />
                </div>
              )}

              <div className="mb-4">
                <label className="block text-gray-700 text-sm mb-2">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
                  placeholder="you@example.com"
                />
              </div>

              <div className="mb-6">
                <label className="block text-gray-700 text-sm mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-gray-900 bg-white"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Please wait...' : authMode === 'login' ? 'Login' : 'Sign Up'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'signup' : 'login');
                  setError(null);
                }}
                className="text-green-600 hover:text-green-700 text-sm"
              >
                {authMode === 'login'
                  ? "Don't have an account? Sign up"
                  : 'Already have an account? Login'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}