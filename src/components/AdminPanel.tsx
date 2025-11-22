import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import { projectId, publicAnonKey } from '../utils/supabase/info.tsx'

interface AdminPanelProps {
  accessToken: string
}

export function AdminPanel({ accessToken }: AdminPanelProps) {
  const [ads, setAds] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingAd, setEditingAd] = useState<any>(null)

  const [formData, setFormData] = useState({
    position: 'top',
    adCode: '',
    active: true,
  })

  useEffect(() => {
    loadAds()
  }, [])

  const loadAds = async () => {
    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2b623195/admin/ads`,
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        const data = await response.json()
        setAds(data.ads)
      }
    } catch (error) {
      console.error('Error loading ads:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingAd) {
        // Update existing ad
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2b623195/admin/ads/${editingAd.key.split(':')[1]}`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify(formData),
          }
        )

        if (response.ok) {
          await loadAds()
          setEditingAd(null)
          resetForm()
        }
      } else {
        // Create new ad
        const response = await fetch(
          `https://${projectId}.supabase.co/functions/v1/make-server-2b623195/admin/ads`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify(formData),
          }
        )

        if (response.ok) {
          await loadAds()
          setShowAddForm(false)
          resetForm()
        }
      }
    } catch (error) {
      console.error('Error saving ad:', error)
    }
  }

  const handleDelete = async (adId: string) => {
    if (!confirm('Are you sure you want to delete this ad?')) return

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2b623195/admin/ads/${adId}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        }
      )

      if (response.ok) {
        await loadAds()
      }
    } catch (error) {
      console.error('Error deleting ad:', error)
    }
  }

  const handleToggleActive = async (ad: any) => {
    try {
      const adId = ad.key.split(':')[1]
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-2b623195/admin/ads/${adId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ ...ad, active: !ad.active }),
        }
      )

      if (response.ok) {
        await loadAds()
      }
    } catch (error) {
      console.error('Error toggling ad:', error)
    }
  }

  const resetForm = () => {
    setFormData({
      position: 'top',
      adCode: '',
      active: true,
    })
  }

  const startEdit = (ad: any) => {
    setEditingAd(ad)
    setFormData({
      position: ad.position,
      adCode: ad.adCode,
      active: ad.active,
    })
    setShowAddForm(true)
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1>Ad Management</h1>
        <button
          onClick={() => {
            setShowAddForm(!showAddForm)
            setEditingAd(null)
            resetForm()
          }}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          <Plus className="w-4 h-4" />
          Add Ad
        </button>
      </div>

      {showAddForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="mb-4">{editingAd ? 'Edit Ad' : 'New Ad'}</h2>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700 mb-1">Position</label>
              <select
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                <option value="top">Top</option>
                <option value="middle">Middle</option>
                <option value="bottom">Bottom</option>
                <option value="sidebar">Sidebar</option>
              </select>
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1">
                Ad Code (HTML)
              </label>
              <textarea
                value={formData.adCode}
                onChange={(e) => setFormData({ ...formData, adCode: e.target.value })}
                rows={6}
                placeholder='<ins class="adsbygoogle" ...></ins>'
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 font-mono text-sm"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Paste your Google AdSense or other ad code here
              </p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="active"
                checked={formData.active}
                onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
                className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
              />
              <label htmlFor="active" className="text-sm text-gray-700">
                Active (show on site)
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
              >
                {editingAd ? 'Update' : 'Create'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false)
                  setEditingAd(null)
                  resetForm()
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {ads.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <p className="text-gray-500">No ads created yet</p>
          </div>
        ) : (
          ads.map((ad) => {
            const adId = ad.key.split(':')[1]
            return (
              <div
                key={ad.key}
                className="bg-white border border-gray-200 rounded-lg p-4"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                        {ad.position}
                      </span>
                      <span className={`px-2 py-1 text-xs rounded ${
                        ad.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {ad.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(ad.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleActive(ad)}
                      className="p-2 hover:bg-gray-100 rounded"
                      title={ad.active ? 'Deactivate' : 'Activate'}
                    >
                      {ad.active ? (
                        <ToggleRight className="w-5 h-5 text-green-600" />
                      ) : (
                        <ToggleLeft className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    <button
                      onClick={() => startEdit(ad)}
                      className="p-2 hover:bg-gray-100 rounded"
                    >
                      <Edit2 className="w-4 h-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleDelete(adId)}
                      className="p-2 hover:bg-gray-100 rounded"
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </button>
                  </div>
                </div>

                <div className="bg-gray-50 rounded p-3 mt-3">
                  <p className="text-xs text-gray-500 mb-1">Ad Code Preview:</p>
                  <pre className="text-xs text-gray-700 overflow-x-auto">
                    {ad.adCode.substring(0, 150)}
                    {ad.adCode.length > 150 && '...'}
                  </pre>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
