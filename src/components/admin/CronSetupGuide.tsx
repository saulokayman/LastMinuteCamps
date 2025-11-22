import { useState } from 'react';
import { Copy, Check, ExternalLink, Clock, Calendar, Settings } from 'lucide-react';

export function CronSetupGuide() {
  const [copiedItem, setCopiedItem] = useState<string | null>(null);

  const copyToClipboard = (text: string, item: string) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(item);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const cronUrl = `${window.location.origin}/cron-proxy.html`;
  const directApiUrl = 'https://zzhfymzaxxuvxemvxekg.supabase.co/functions/v1/make-server-908ab15a/cron/snapshot?secret=campfinder-cron-2024';

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-gray-900 mb-6 flex items-center gap-2">
        <Settings className="w-6 h-6" />
        Automated Snapshot Configuration
      </h2>

      {/* Overview */}
      <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-blue-900 mb-2">📋 What are Automated Snapshots?</h3>
        <p className="text-blue-800 text-sm mb-2">
          Automated snapshots run multiple times per day to check all campsite availability and detect newly available sites.
          This allows your users to see which sites just became available.
        </p>
        <p className="text-blue-700 text-sm">
          <strong>Recommended schedule:</strong> 3 times daily at 8am, 12pm, and 8pm Pacific Time
        </p>
      </div>

      {/* Step 1: Choose Cron Service */}
      <div className="mb-8">
        <h3 className="text-gray-900 mb-4 flex items-center gap-2">
          <span className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
          Choose a Cron Service
        </h3>
        
        <div className="space-y-3 ml-10">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-gray-800 mb-2 flex items-center justify-between">
              <span>🌟 cron-job.org (Recommended)</span>
              <a 
                href="https://console.cron-job.org/signup"
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-600 hover:text-green-700 text-sm flex items-center gap-1"
              >
                Sign Up <ExternalLink className="w-4 h-4" />
              </a>
            </h4>
            <p className="text-gray-600 text-sm">
              ✅ Free tier includes unlimited jobs<br />
              ✅ Reliable execution<br />
              ✅ Easy to configure<br />
              ✅ Email notifications on failures
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-gray-800 mb-2">⏰ EasyCron</h4>
            <p className="text-gray-600 text-sm">
              Alternative option with similar features
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="text-gray-800 mb-2">🔄 Uptime Robot</h4>
            <p className="text-gray-600 text-sm">
              Can be used for monitoring + scheduled checks
            </p>
          </div>
        </div>
      </div>

      {/* Step 2: Get Your URLs */}
      <div className="mb-8">
        <h3 className="text-gray-900 mb-4 flex items-center gap-2">
          <span className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
          Copy Your Cron URLs
        </h3>
        
        <div className="space-y-4 ml-10">
          <div>
            <h4 className="text-gray-800 mb-2 text-sm">Option A: Proxy Page (Recommended)</h4>
            <p className="text-gray-600 text-xs mb-2">
              Use this URL if your cron service has issues with direct API calls:
            </p>
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded border border-gray-200">
              <code className="flex-1 text-xs break-all">{cronUrl}</code>
              <button
                onClick={() => copyToClipboard(cronUrl, 'proxy')}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs flex items-center gap-1"
              >
                {copiedItem === 'proxy' ? (
                  <>
                    <Check className="w-3 h-3" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <div>
            <h4 className="text-gray-800 mb-2 text-sm">Option B: Direct API (Advanced)</h4>
            <p className="text-gray-600 text-xs mb-2">
              Direct call to the Supabase edge function:
            </p>
            <div className="flex items-center gap-2 bg-gray-50 p-3 rounded border border-gray-200">
              <code className="flex-1 text-xs break-all">{directApiUrl}</code>
              <button
                onClick={() => copyToClipboard(directApiUrl, 'api')}
                className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs flex items-center gap-1"
              >
                {copiedItem === 'api' ? (
                  <>
                    <Check className="w-3 h-3" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3: Create Cron Jobs */}
      <div className="mb-8">
        <h3 className="text-gray-900 mb-4 flex items-center gap-2">
          <span className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
          Create 3 Cron Jobs
        </h3>
        
        <div className="ml-10 space-y-4">
          <p className="text-gray-600 text-sm mb-4">
            Create three separate jobs with the following schedules:
          </p>

          {/* Job 1 */}
          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Job 1: Morning Snapshot
              </h4>
              <button
                onClick={() => copyToClipboard('0 8 * * *', 'cron1')}
                className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs flex items-center gap-1"
              >
                {copiedItem === 'cron1' ? (
                  <>
                    <Check className="w-3 h-3" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy
                  </>
                )}
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700"><strong>Schedule:</strong> Every day at 8:00 AM Pacific</p>
              <p className="text-gray-700"><strong>Cron Expression:</strong> <code className="bg-white px-2 py-1 rounded">0 8 * * *</code></p>
              <p className="text-gray-700"><strong>Timezone:</strong> America/Los_Angeles (Pacific Time)</p>
            </div>
          </div>

          {/* Job 2 */}
          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Job 2: Afternoon Snapshot
              </h4>
              <button
                onClick={() => copyToClipboard('0 12 * * *', 'cron2')}
                className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs flex items-center gap-1"
              >
                {copiedItem === 'cron2' ? (
                  <>
                    <Check className="w-3 h-3" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy
                  </>
                )}
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700"><strong>Schedule:</strong> Every day at 12:00 PM Pacific</p>
              <p className="text-gray-700"><strong>Cron Expression:</strong> <code className="bg-white px-2 py-1 rounded">0 12 * * *</code></p>
              <p className="text-gray-700"><strong>Timezone:</strong> America/Los_Angeles (Pacific Time)</p>
            </div>
          </div>

          {/* Job 3 */}
          <div className="border border-green-200 rounded-lg p-4 bg-green-50">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-gray-900 flex items-center gap-2">
                <Clock className="w-4 h-4" />
                Job 3: Evening Snapshot
              </h4>
              <button
                onClick={() => copyToClipboard('0 20 * * *', 'cron3')}
                className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-xs flex items-center gap-1"
              >
                {copiedItem === 'cron3' ? (
                  <>
                    <Check className="w-3 h-3" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" /> Copy
                  </>
                )}
              </button>
            </div>
            <div className="space-y-2 text-sm">
              <p className="text-gray-700"><strong>Schedule:</strong> Every day at 8:00 PM Pacific</p>
              <p className="text-gray-700"><strong>Cron Expression:</strong> <code className="bg-white px-2 py-1 rounded">0 20 * * *</code></p>
              <p className="text-gray-700"><strong>Timezone:</strong> America/Los_Angeles (Pacific Time)</p>
            </div>
          </div>
        </div>
      </div>

      {/* Step 4: Configuration Details (for cron-job.org) */}
      <div className="mb-8">
        <h3 className="text-gray-900 mb-4 flex items-center gap-2">
          <span className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">4</span>
          Configure on cron-job.org
        </h3>
        
        <div className="ml-10 space-y-3">
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <h4 className="text-gray-800 mb-3">For each job, enter:</h4>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <div>
                  <strong>Title:</strong> CampFinder Morning/Afternoon/Evening Snapshot
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <div>
                  <strong>URL:</strong> Paste the proxy URL or direct API URL from Step 2
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <div>
                  <strong>Method:</strong> GET
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <div>
                  <strong>Schedule:</strong> Use the cron expression from Step 3
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <div>
                  <strong>Timezone:</strong> America/Los_Angeles
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-1">✓</span>
                <div>
                  <strong>Enabled:</strong> Yes
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
            <h4 className="text-yellow-900 mb-2">⚠️ Optional but Recommended:</h4>
            <p className="text-yellow-800 text-sm">
              Enable "Send notification on failure" to get email alerts if a snapshot fails
            </p>
          </div>
        </div>
      </div>

      {/* Step 5: Verify */}
      <div className="mb-8">
        <h3 className="text-gray-900 mb-4 flex items-center gap-2">
          <span className="bg-green-600 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">5</span>
          Test & Verify
        </h3>
        
        <div className="ml-10 space-y-3">
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <h4 className="text-gray-800 mb-2">Testing Your Setup:</h4>
            <ol className="list-decimal ml-4 space-y-2 text-sm text-gray-700">
              <li>In cron-job.org, click "Execute now" on one of your jobs</li>
              <li>Check the execution history for a success status (200 OK)</li>
              <li>Go to the Admin Dashboard and check the "Snapshot Status" widget</li>
              <li>You should see a green indicator with the timestamp of your test</li>
            </ol>
          </div>

          <div className="bg-green-50 p-4 rounded border border-green-200">
            <h4 className="text-green-900 mb-2">✅ Success Indicators:</h4>
            <ul className="space-y-1 text-sm text-green-800">
              <li>• Cron-job.org shows "200 OK" response</li>
              <li>• Snapshot Status widget shows green</li>
              <li>• "Last snapshot" timestamp is recent</li>
              <li>• "Newly available sites" counter increases over time</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-900 mb-3">🔧 Troubleshooting</h3>
        <div className="space-y-2 text-sm text-red-800">
          <div>
            <strong>Problem:</strong> Getting 401 Unauthorized<br />
            <strong>Solution:</strong> Make sure you're using the URL with the secret parameter, or use the proxy page
          </div>
          <div>
            <strong>Problem:</strong> Cron job times out<br />
            <strong>Solution:</strong> The snapshot can take 30-60 seconds. Set timeout to 120 seconds in cron-job.org
          </div>
          <div>
            <strong>Problem:</strong> Jobs don't run at expected time<br />
            <strong>Solution:</strong> Verify timezone is set to America/Los_Angeles (Pacific Time)
          </div>
        </div>
      </div>

      {/* Quick Test Button */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-blue-900 text-sm mb-3">
          <strong>💡 Quick Test:</strong> You can also manually trigger a snapshot from the Snapshot Status widget above using the "Test Cron" button.
        </p>
      </div>
    </div>
  );
}
