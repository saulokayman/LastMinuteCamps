import { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, DollarSign } from 'lucide-react';
import { projectId } from '../../utils/supabase/info';

interface AdConfigurationProps {
  accessToken: string;
}

export function AdConfiguration({ accessToken }: AdConfigurationProps) {
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/admin/ad-config`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (error) {
      console.error('Error fetching ad config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/admin/ad-config`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(config),
        }
      );

      if (response.ok) {
        setMessage({ type: 'success', text: 'Ad configuration saved successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.error || 'Failed to save configuration' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save configuration' });
      console.error('Error saving ad config:', error);
    } finally {
      setSaving(false);
    }
  };

  const updateConfig = (path: string[], value: any) => {
    setConfig((prev: any) => {
      const newConfig = { ...prev };
      let current = newConfig;
      
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {};
        }
        current = current[path[i]];
      }
      
      current[path[path.length - 1]] = value;
      return newConfig;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load ad configuration</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-gray-900">Ad Configuration</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {/* Message */}
      {message && (
        <div
          className={`flex items-center gap-2 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <CheckCircle className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Google AdSense */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <DollarSign className="w-5 h-5 text-blue-600" />
          </div>
          <h3 className="text-gray-900">Google AdSense</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="adsense-enabled"
              checked={config.googleAdSense?.enabled || false}
              onChange={(e) => updateConfig(['googleAdSense', 'enabled'], e.target.checked)}
              className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
            />
            <label htmlFor="adsense-enabled" className="text-gray-700">
              Enable Google AdSense
            </label>
          </div>

          {config.googleAdSense?.enabled && (
            <>
              <div>
                <label className="block text-gray-700 text-sm mb-2">
                  AdSense Client ID (Publisher ID)
                </label>
                <input
                  type="text"
                  value={config.googleAdSense?.clientId || ''}
                  onChange={(e) => updateConfig(['googleAdSense', 'clientId'], e.target.value)}
                  placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Find this in your AdSense account under Account > Settings
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-700 text-sm mb-2">
                    Header Banner Slot ID
                  </label>
                  <input
                    type="text"
                    value={config.googleAdSense?.slots?.headerBanner || ''}
                    onChange={(e) => updateConfig(['googleAdSense', 'slots', 'headerBanner'], e.target.value)}
                    placeholder="1234567890"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm mb-2">
                    Footer Banner Slot ID
                  </label>
                  <input
                    type="text"
                    value={config.googleAdSense?.slots?.footerBanner || ''}
                    onChange={(e) => updateConfig(['googleAdSense', 'slots', 'footerBanner'], e.target.value)}
                    placeholder="1234567890"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm mb-2">
                    Sidebar Top Slot ID
                  </label>
                  <input
                    type="text"
                    value={config.googleAdSense?.slots?.sidebarTop || ''}
                    onChange={(e) => updateConfig(['googleAdSense', 'slots', 'sidebarTop'], e.target.value)}
                    placeholder="1234567890"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-gray-700 text-sm mb-2">
                    Sidebar Bottom Slot ID
                  </label>
                  <input
                    type="text"
                    value={config.googleAdSense?.slots?.sidebarBottom || ''}
                    onChange={(e) => updateConfig(['googleAdSense', 'slots', 'sidebarBottom'], e.target.value)}
                    placeholder="1234567890"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Google Ad Manager */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <DollarSign className="w-5 h-5 text-green-600" />
          </div>
          <h3 className="text-gray-900">Google Ad Manager (DFP)</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="admanager-enabled"
              checked={config.googleAdManager?.enabled || false}
              onChange={(e) => updateConfig(['googleAdManager', 'enabled'], e.target.checked)}
              className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
            />
            <label htmlFor="admanager-enabled" className="text-gray-700">
              Enable Google Ad Manager
            </label>
          </div>

          {config.googleAdManager?.enabled && (
            <>
              <div>
                <label className="block text-gray-700 text-sm mb-2">
                  Network Code
                </label>
                <input
                  type="text"
                  value={config.googleAdManager?.networkCode || ''}
                  onChange={(e) => updateConfig(['googleAdManager', 'networkCode'], e.target.value)}
                  placeholder="/12345678"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
                <p className="text-gray-500 text-xs mt-1">
                  Find this in your Google Ad Manager account settings
                </p>
              </div>

              <div>
                <label className="block text-gray-700 text-sm mb-2">
                  Ad Unit Configuration (JSON)
                </label>
                <textarea
                  value={JSON.stringify(config.googleAdManager?.adUnits || {}, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      updateConfig(['googleAdManager', 'adUnits'], parsed);
                    } catch (err) {
                      // Invalid JSON, ignore
                    }
                  }}
                  placeholder={'{\n  "header": "/12345678/header-banner",\n  "sidebar": "/12345678/sidebar-ad"\n}'}
                  rows={6}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent font-mono text-sm"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Amazon Associates */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-orange-100 rounded-lg">
            <DollarSign className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="text-gray-900">Amazon Associates</h3>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="amazon-enabled"
              checked={config.amazonAssociates?.enabled || false}
              onChange={(e) => updateConfig(['amazonAssociates', 'enabled'], e.target.checked)}
              className="w-4 h-4 text-green-600 rounded focus:ring-2 focus:ring-green-500"
            />
            <label htmlFor="amazon-enabled" className="text-gray-700">
              Enable Amazon Associates
            </label>
          </div>

          {config.amazonAssociates?.enabled && (
            <div>
              <label className="block text-gray-700 text-sm mb-2">
                Tracking ID
              </label>
              <input
                type="text"
                value={config.amazonAssociates?.trackingId || ''}
                onChange={(e) => updateConfig(['amazonAssociates', 'trackingId'], e.target.value)}
                placeholder="yoursite-20"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-gray-500 text-xs mt-1">
                Find this in your Amazon Associates account
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Implementation Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-gray-900 mb-3">Implementation Guide</h3>
        <div className="space-y-2 text-sm text-gray-700">
          <p><strong>Google AdSense:</strong> After saving, add the AdSense script to your site's header. The ads will automatically display in configured positions.</p>
          <p><strong>Google Ad Manager:</strong> Configure your ad units in GAM, then add the network code and unit paths here.</p>
          <p><strong>Amazon Associates:</strong> Use your tracking ID to generate affiliate links for camping gear recommendations.</p>
        </div>
      </div>
    </div>
  );
}
