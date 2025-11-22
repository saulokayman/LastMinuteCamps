import { Search, MapPin, Filter } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'

interface SearchFiltersProps {
  onSearch: (filters: any) => void
  providers: any[]
  userLocation: { lat: number; lon: number } | null
  campgrounds?: any[]
}

const US_STATES = [
  'AK', 'AL', 'AR', 'AZ', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'IA', 'ID', 'IL', 'IN', 'KS', 'KY', 'LA', 'MA', 'MD',
  'ME', 'MI', 'MN', 'MO', 'MS', 'MT', 'NC', 'ND', 'NE', 'NH',
  'NJ', 'NM', 'NV', 'NY', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VA', 'VT', 'WA', 'WI', 'WV', 'WY'
]

export function SearchFilters({ onSearch, providers, userLocation, campgrounds = [] }: SearchFiltersProps) {
  const [query, setQuery] = useState('')
  const [state, setState] = useState('')
  const [provider, setProvider] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [maxDistance, setMaxDistance] = useState('100')
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (query.length > 1) {
      const filtered = campgrounds.filter(camp =>
        camp.name.toLowerCase().includes(query.toLowerCase()) ||
        camp.state.toLowerCase().includes(query.toLowerCase()) ||
        camp.description?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
      setSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
    setSelectedIndex(-1)
  }, [query, campgrounds])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setShowSuggestions(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSearch = () => {
    const filters: any = {}
    
    if (query) filters.q = query
    if (state) filters.state = state
    if (provider) filters.provider = provider
    if (userLocation) {
      filters.lat = userLocation.lat
      filters.lon = userLocation.lon
      filters.maxDistance = maxDistance
    }
    
    onSearch(filters)
    setShowSuggestions(false)
  }

  const handleSuggestionClick = (campground: any) => {
    setQuery(campground.name)
    setShowSuggestions(false)
    setTimeout(() => handleSearch(), 100)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) {
      if (e.key === 'Enter') handleSearch()
      return
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev))
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1))
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          handleSuggestionClick(suggestions[selectedIndex])
        } else {
          handleSearch()
        }
        break
      case 'Escape':
        setShowSuggestions(false)
        break
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1 relative" ref={suggestionsRef}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search campgrounds..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
              {suggestions.map((camp, idx) => (
                <button
                  key={camp.id}
                  onClick={() => handleSuggestionClick(camp)}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b last:border-b-0 ${
                    idx === selectedIndex ? 'bg-green-50' : ''
                  }`}
                >
                  <div className="font-medium">{camp.name}</div>
                  <div className="text-sm text-gray-600 mt-0.5">
                    {camp.state} • {camp.sites} sites
                  </div>
                  {camp.description && (
                    <div className="text-xs text-gray-500 mt-1 line-clamp-1">{camp.description}</div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <Filter className="w-4 h-4" />
        </button>
        
        <button
          onClick={handleSearch}
          className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Search
        </button>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 p-4 bg-gray-50 rounded-lg">
          <div>
            <label className="block text-sm text-gray-700 mb-1">State</label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All States</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-700 mb-1">Provider</label>
            <select
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="">All Providers</option>
              {providers.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          {userLocation && (
            <div>
              <label className="block text-sm text-gray-700 mb-1">
                <MapPin className="w-3 h-3 inline mr-1" />
                Max Distance (mi)
              </label>
              <input
                type="number"
                value={maxDistance}
                onChange={(e) => setMaxDistance(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                min="1"
                max="500"
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}