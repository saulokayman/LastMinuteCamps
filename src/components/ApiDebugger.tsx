import { useState } from 'react';
import { CheckCircle, XCircle, Loader } from 'lucide-react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

export function ApiDebugger() {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const testApis = async () => {
    setTesting(true);
    const testResults: any = {
      timestamp: new Date().toISOString(),
      tests: [],
    };

    try {
      // Test 1: Check if RECREATION_GOV_API_KEY is configured
      console.log('Testing Recreation.gov API key...');
      const searchResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/search?query=yosemite&state=CA&source=recreation.gov`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const searchData = await searchResponse.json();
      testResults.tests.push({
        name: 'Recreation.gov Search (Yosemite, CA)',
        status: searchResponse.ok ? 'success' : 'error',
        statusCode: searchResponse.status,
        data: searchData,
        error: !searchResponse.ok ? searchData.error || searchData.details : null,
      });

      // Test 2: Featured Parks
      console.log('Testing Featured Parks...');
      const featuredResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/featured-parks`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const featuredData = await featuredResponse.json();
      testResults.tests.push({
        name: 'Featured Parks',
        status: featuredResponse.ok ? 'success' : 'error',
        statusCode: featuredResponse.status,
        data: featuredData,
        error: !featuredResponse.ok ? featuredData.error || featuredData.details : null,
      });

      // Test 3: Newly Available Sites
      console.log('Testing Newly Available Sites...');
      const newlyAvailableResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/newly-available`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const newlyAvailableData = await newlyAvailableResponse.json();
      testResults.tests.push({
        name: 'Newly Available Sites',
        status: newlyAvailableResponse.ok ? 'success' : 'error',
        statusCode: newlyAvailableResponse.status,
        data: newlyAvailableData,
        error: !newlyAvailableResponse.ok ? newlyAvailableData.error || newlyAvailableData.details : null,
      });

      // Test 4: Popular Sites
      console.log('Testing Popular Sites...');
      const popularResponse = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/popular-sites`,
        {
          headers: {
            'Authorization': `Bearer ${publicAnonKey}`,
          },
        }
      );

      const popularData = await popularResponse.json();
      testResults.tests.push({
        name: 'Popular Sites',
        status: popularResponse.ok ? 'success' : 'error',
        statusCode: popularResponse.status,
        data: popularData,
        error: !popularResponse.ok ? popularData.error || popularData.details : null,
      });

      // Test 5: Test direct Recreation.gov RIDB API
      console.log('Testing direct Recreation.gov RIDB API...');
      try {
        const ridbTestResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/test-ridb`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );

        const ridbTestData = await ridbTestResponse.json();
        testResults.tests.push({
          name: 'Direct RIDB API Test',
          status: ridbTestResponse.ok ? 'success' : 'error',
          statusCode: ridbTestResponse.status,
          data: ridbTestData,
          error: !ridbTestResponse.ok ? ridbTestData.error || ridbTestData.details : null,
        });
      } catch (err) {
        testResults.tests.push({
          name: 'Direct RIDB API Test',
          status: 'error',
          error: String(err),
        });
      }

      // Test 6: Test direct ReserveCalifornia API
      console.log('Testing direct ReserveCalifornia API...');
      try {
        const reserveCalTestResponse = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-908ab15a/test-reservecalifornia`,
          {
            headers: {
              'Authorization': `Bearer ${publicAnonKey}`,
            },
          }
        );

        const reserveCalTestData = await reserveCalTestResponse.json();
        testResults.tests.push({
          name: 'Direct ReserveCalifornia API Test',
          status: reserveCalTestResponse.ok ? 'success' : 'error',
          statusCode: reserveCalTestResponse.status,
          data: reserveCalTestData,
          error: !reserveCalTestResponse.ok ? reserveCalTestData.error || reserveCalTestData.details : null,
        });
      } catch (err) {
        testResults.tests.push({
          name: 'Direct ReserveCalifornia API Test',
          status: 'error',
          error: String(err),
        });
      }

    } catch (error) {
      testResults.error = String(error);
    }

    setResults(testResults);
    setTesting(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-gray-900">API Debugger</h2>
        <button
          onClick={testApis}
          disabled={testing}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          {testing ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Testing...
            </>
          ) : (
            'Run API Tests'
          )}
        </button>
      </div>

      {results && (
        <div className="space-y-4">
          <div className="text-sm text-gray-600">
            Test run at: {new Date(results.timestamp).toLocaleString()}
          </div>

          {results.tests.map((test: any, index: number) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${
                test.status === 'success' ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {test.status === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <h3 className={test.status === 'success' ? 'text-green-900' : 'text-red-900'}>
                  {test.name}
                </h3>
                {test.statusCode && (
                  <span className="ml-auto text-sm text-gray-600">
                    Status: {test.statusCode}
                  </span>
                )}
              </div>

              {test.error && (
                <div className="bg-red-100 border border-red-300 rounded p-3 mb-3">
                  <p className="text-red-900 text-sm font-semibold mb-1">Error:</p>
                  <pre className="text-red-800 text-xs whitespace-pre-wrap break-words">
                    {JSON.stringify(test.error, null, 2)}
                  </pre>
                </div>
              )}

              {test.data && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm text-gray-700 hover:text-gray-900">
                    View Response Data
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 rounded text-xs overflow-x-auto">
                    {JSON.stringify(test.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}

          {results.error && (
            <div className="bg-red-100 border border-red-300 rounded p-4">
              <p className="text-red-900 font-semibold">General Error:</p>
              <p className="text-red-800 text-sm mt-1">{results.error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}