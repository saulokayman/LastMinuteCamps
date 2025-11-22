import { useState } from 'react'
import { Shield, AlertCircle } from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info.tsx'

interface AdminBootstrapProps {
  userEmail: string
  onSuccess: () => void
}

export function AdminBootstrap({ userEmail, onSuccess }: AdminBootstrapProps) {
  const [secret, setSecret] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleBootstrap = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2b623195/bootstrap/make-admin`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            email: userEmail,
            secret,
          }),
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to make admin')
      }

      setSuccess(true)
      setTimeout(() => {
        onSuccess()
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto p-4 mt-8">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Shield className="w-6 h-6 text-blue-600" />
          <h2>Become First Admin</h2>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-900">
              <p className="mb-2">
                This is a bootstrap function to make the first user an admin. You'll need the
                bootstrap secret.
              </p>
              <p className="text-xs text-blue-700">
                Secret: <code className="bg-blue-100 px-1 py-0.5 rounded">bootstrap-lastminutecamps-2024</code>
              </p>
            </div>
          </div>
        </div>

        {success ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
            <p className="text-green-900 mb-2">Successfully made admin!</p>
            <p className="text-sm text-green-700">Refreshing page...</p>
          </div>
        ) : (
          <form onSubmit={handleBootstrap} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Your Email</label>
              <input
                type="email"
                value={userEmail}
                disabled
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">Bootstrap Secret</label>
              <input
                type="text"
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter bootstrap secret"
                required
              />
            </div>

            {error && (
              <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-3">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Make Me Admin'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}