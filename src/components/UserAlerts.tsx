import { useState, useEffect } from 'react';
import { Bell, Plus, Trash2, MapPin, Calendar, Mail, ExternalLink } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';
import { supabase } from '../utils/supabase/client';

interface Alert {
  alertId: string;
  siteId: string;
  siteName: string;
  facilityId: string;
  facilityName: string;
  source: string;
  startDate: string;
  endDate: string;
  email: string;
  active: boolean;
  createdAt: string;
  lastChecked: string | null;
  triggeredAt: string | null;
}

export function UserAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    siteId: '',
    siteName: '',
    facilityId: '',
    facilityName: '',
    source: 'recreation.gov',
    startDate: '',
    endDate: '',
    email: '',
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchAlerts();
    loadUserEmail();
  }, []);

  const loadUserEmail = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.email) {
      setFormData(prev => ({ ...prev, email: session.user.email! }));
    }
  };

  const fetchAlerts = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        window.location.href = '/';
        return;
      }

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/user/alerts`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
      } else {
        setError('Failed to load alerts');
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
      setError('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  const createAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/user/alerts`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setAlerts(data.alerts || []);
        setShowCreateForm(false);
        setFormData({
          siteId: '',
          siteName: '',
          facilityId: '',
          facilityName: '',
          source: 'recreation.gov',
          startDate: '',
          endDate: '',
          email: formData.email,
        });
      } else {
        alert('Failed to create alert');
      }
    } catch (err) {
      console.error('Error creating alert:', err);
      alert('Failed to create alert');
    } finally {
      setCreating(false);
    }
  };

  const deleteAlert = async (alertId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) return;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/user/alerts/${alertId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        }
      );

      if (response.ok) {
        setAlerts(alerts.filter(a => a.alertId !== alertId));
      } else {
        alert('Failed to delete alert');
      }
    } catch (err) {
      console.error('Error deleting alert:', err);
      alert('Failed to delete alert');
    }
  };

  const getReservationUrl = (alert: Alert) => {
    if (alert.source === 'recreation.gov') {
      return `https://www.recreation.gov/camping/campsites/${alert.siteId}`;
    } else {
      return `https://www.reservecalifornia.com/CalendarAvailability.aspx?facilityid=${alert.facilityId}`;
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/" className="text-white hover:underline">← Back to Home</a>
              <div>
                <h1 className="text-white">My Availability Alerts</h1>
                <p className="text-green-100">Get notified when sites become available</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white text-green-700 rounded-lg hover:bg-green-50 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Create Alert</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-lg p-4 mb-6">
            {error}
          </div>
        )}

        {/* Create Alert Form */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-gray-900 mb-6">Create Availability Alert</h2>

              <form onSubmit={createAlert}>
                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Site ID</label>
                  <input
                    type="text"
                    value={formData.siteId}
                    onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                    placeholder="e.g., 10101"
                  />
                  <p className="text-xs text-gray-500 mt-1">Find this in the site's URL</p>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Site Name</label>
                  <input
                    type="text"
                    value={formData.siteName}
                    onChange={(e) => setFormData({ ...formData, siteName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Facility Name</label>
                  <input
                    type="text"
                    value={formData.facilityName}
                    onChange={(e) => setFormData({ ...formData, facilityName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="recreation.gov">Recreation.gov</option>
                    <option value="reservecalifornia.com">ReserveCalifornia</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-gray-700 mb-2">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="mb-6">
                  <label className="block text-gray-700 mb-2">Email for Notifications</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={creating}
                    className="flex-1 bg-green-700 text-white py-2 rounded-lg hover:bg-green-800 transition-colors disabled:opacity-50"
                  >
                    {creating ? 'Creating...' : 'Create Alert'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Alerts List */}
        {alerts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <Bell className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-gray-900 mb-2">No alerts yet</h2>
            <p className="text-gray-600 mb-6">
              Create alerts to get notified when your desired campsites become available!
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-green-700 text-white rounded-lg hover:bg-green-800 transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Alert</span>
            </button>
          </div>
        ) : (
          <div className="grid gap-6">
            {alerts.map((alert) => (
              <div
                key={alert.alertId}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <Bell className={`w-6 h-6 flex-shrink-0 mt-1 ${alert.active ? 'text-green-600' : 'text-gray-400'}`} />
                      <div>
                        <h3 className="text-gray-900 mb-1">{alert.siteName}</h3>
                        <div className="flex items-center gap-2 text-gray-600 mb-2">
                          <MapPin className="w-4 h-4" />
                          <span>{alert.facilityName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 mb-2">
                          <Calendar className="w-4 h-4" />
                          <span>
                            {new Date(alert.startDate).toLocaleDateString()} - {new Date(alert.endDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-600 mb-2">
                          <Mail className="w-4 h-4" />
                          <span>{alert.email}</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                            {alert.source}
                          </span>
                          <span className={`px-2 py-1 rounded ${alert.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                            {alert.active ? 'Active' : 'Inactive'}
                          </span>
                          <span>Created {new Date(alert.createdAt).toLocaleDateString()}</span>
                        </div>
                        {alert.triggeredAt && (
                          <p className="text-sm text-green-600 mt-2">
                            ✓ Alert triggered on {new Date(alert.triggeredAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    <a
                      href={getReservationUrl(alert)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                      title="View on reservation site"
                    >
                      <ExternalLink className="w-5 h-5" />
                    </a>
                    <button
                      onClick={() => deleteAlert(alert.alertId)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete alert"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-blue-900 mb-2">ℹ️ About Alerts</h3>
          <p className="text-blue-800 text-sm">
            Alerts check for availability 3 times daily (8am, 12pm, 8pm PT). When your requested dates become available, 
            you'll receive an email notification. Note: Email notifications require additional setup.
          </p>
        </div>
      </div>
    </div>
  );
}