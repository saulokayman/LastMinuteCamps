import { useState } from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function ApiTest() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testApi = async () => {
    setTesting(true);
    setResult(null);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/test-api`,
        {
          headers: { 'Authorization': `Bearer ${publicAnonKey}` },
        }
      );

      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({
        success: false,
        error: 'Failed to connect to server',
        details: String(error),
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-blue-900">API Connection Test</h3>
        <button
          onClick={testApi}
          disabled={testing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2"
        >
          {testing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Testing...
            </>
          ) : (
            'Test API Connection'
          )}
        </button>
      </div>

      {result && (
        <div className={`mt-4 p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <div className="flex items-start gap-3">
            {result.success ? (
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            )}
            <div className="flex-1">
              <p className={`mb-2 ${result.success ? 'text-green-900' : 'text-red-900'}`}>
                {result.message || result.error}
              </p>
              
              {result.success && (
                <div className="space-y-1 text-sm text-green-800">
                  <p>✓ API Key: Present ({result.apiKeyLength} characters)</p>
                  <p>✓ Sample Facility: {result.sampleFacility}</p>
                  <p>✓ Total Records Available: {result.totalRecords?.toLocaleString()}</p>
                </div>
              )}

              {!result.success && result.details && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-red-700 hover:text-red-800">
                    View Error Details
                  </summary>
                  <pre className="mt-2 p-2 bg-red-100 rounded text-xs overflow-auto">
                    {JSON.stringify(result.details, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
