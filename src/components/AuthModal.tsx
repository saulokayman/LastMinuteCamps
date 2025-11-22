import { useState } from 'react'
import { X } from 'lucide-react'
import { getSupabaseClient } from '../utils/supabase/client.tsx'
import { projectId, publicAnonKey } from '../utils/supabase/info.tsx'

interface AuthModalProps {
  onClose: () => void
  onSuccess: (user: any) => void
  mode: 'signin' | 'signup'
  setMode: (mode: 'signin' | 'signup') => void
}

export function AuthModal({ onClose, onSuccess, mode, setMode }: AuthModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const supabase = getSupabaseClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (mode === 'signin') {
        // Login
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) throw error
        onSuccess(data.user)
      } else {
        // Signup
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2b623195/signup`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${publicAnonKey}`,
            },
            body: JSON.stringify({ email, password, name }),
          }
        )

        const data = await response.json()
        if (!response.ok) throw new Error(data.error)

        // Auto-login after signup
        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (loginError) throw loginError
        onSuccess(loginData.user)
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="mb-6">{mode === 'signin' ? 'Log In' : 'Sign Up'}</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!mode && (
            <div>
              <label className="block text-sm text-gray-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                required={!mode}
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>

          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
            {loading ? 'Loading...' : mode === 'signin' ? 'Log In' : 'Sign Up'}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="w-full mt-4 text-sm text-green-600 hover:underline"
        >
          {mode === 'signin' ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        </button>
      </div>
    </div>
  )
}