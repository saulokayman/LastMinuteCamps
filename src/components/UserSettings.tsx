import { useState, useEffect } from 'react';
import { User, Mail, Shield, Save, AlertCircle } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';

export function UserSettings() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [weeklyDigest, setWeeklyDigest] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        window.location.href = '/';
        return;
      }

      setUser(session.user);
      setName(session.user.user_metadata?.name || '');
      setEmail(session.user.email || '');
    } catch (err) {
      console.error('Error loading user data:', err);
      setError('Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { 
          name,
          emailNotifications,
          weeklyDigest,
        }
      });

      if (updateError) throw updateError;

      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err: any) {
      console.error('Error saving settings:', err);
      setError(err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordReset = async () => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });

      if (error) throw error;

      alert('Password reset email sent! Check your inbox.');
    } catch (err: any) {
      console.error('Error sending password reset:', err);
      alert(err.message || 'Failed to send password reset email');
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
              <h1 className="text-white">Account Settings</h1>
              <p className="text-green-100">Manage your profile and preferences</p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        {message && (
          <div className="bg-green-50 border border-green-200 text-green-800 rounded-lg p-4 mb-6 flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {/* Profile Information */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <User className="w-6 h-6 text-green-700" />
            <h2 className="text-gray-900">Profile Information</h2>
          </div>

          <form onSubmit={handleSave}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Your name"
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed. Contact support if you need to update it.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-gray-700 mb-2">User ID</label>
              <input
                type="text"
                value={user?.id || ''}
                disabled
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed text-sm font-mono"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </form>
        </div>

        {/* Email Preferences */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Mail className="w-6 h-6 text-green-700" />
            <h2 className="text-gray-900">Email Preferences</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="w-5 h-5 text-green-700 rounded focus:ring-2 focus:ring-green-500"
              />
              <div>
                <p className="text-gray-900">Alert Notifications</p>
                <p className="text-sm text-gray-600">
                  Receive emails when your availability alerts are triggered
                </p>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={weeklyDigest}
                onChange={(e) => setWeeklyDigest(e.target.checked)}
                className="w-5 h-5 text-green-700 rounded focus:ring-2 focus:ring-green-500"
              />
              <div>
                <p className="text-gray-900">Weekly Digest</p>
                <p className="text-sm text-gray-600">
                  Get a weekly summary of newly available campsites
                </p>
              </div>
            </label>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-6 flex items-center gap-2 px-6 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors disabled:opacity-50"
          >
            <Save className="w-5 h-5" />
            <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
          </button>
        </div>

        {/* Security */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="w-6 h-6 text-green-700" />
            <h2 className="text-gray-900">Security</h2>
          </div>

          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Password</label>
            <div className="flex gap-3">
              <input
                type="password"
                value="••••••••"
                disabled
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 cursor-not-allowed"
              />
              <button
                onClick={handlePasswordReset}
                className="px-6 py-2 border border-green-700 text-green-700 rounded-lg hover:bg-green-50 transition-colors"
              >
                Reset Password
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Click "Reset Password" to receive a password reset link via email
            </p>
          </div>
        </div>

        {/* Account Stats */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-gray-900 mb-4">Account Statistics</h2>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">-</p>
              <p className="text-sm text-gray-600">Favorites</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">-</p>
              <p className="text-sm text-gray-600">Alerts</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">-</p>
              <p className="text-sm text-gray-600">Ratings</p>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Member since: {user ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
            </p>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="mt-8 bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-red-900 mb-2">⚠️ Danger Zone</h2>
          <p className="text-red-800 text-sm mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <button
            onClick={() => alert('Account deletion requires contacting support')}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Delete Account
          </button>
        </div>
      </div>
    </div>
  );
}