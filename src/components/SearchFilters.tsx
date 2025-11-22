import { Search } from 'lucide-react';
import { SearchFilters as SearchFiltersType } from '../App';

interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
  onSearch: () => void;
  loading: boolean;
}

export function SearchFilters({ filters, onFiltersChange, onSearch, loading }: SearchFiltersProps) {
  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  const activityTypes = [
    'Camping',
    'RV Camping',
    'Tent Camping',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Search Query */}
        <div className="lg:col-span-3">
          <label htmlFor="query" className="block text-gray-700 mb-2">
            Search Campgrounds
          </label>
          <div className="relative">
            <input
              id="query"
              type="text"
              placeholder="Enter park name, location, or keyword..."
              value={filters.query}
              onChange={(e) => onFiltersChange({ ...filters, query: e.target.value })}
              className="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          </div>
        </div>

        {/* State Filter */}
        <div>
          <label htmlFor="state" className="block text-gray-700 mb-2">
            State
          </label>
          <select
            id="state"
            value={filters.state}
            onChange={(e) => onFiltersChange({ ...filters, state: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All States</option>
            {states.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>

        {/* Activity Type */}
        <div>
          <label htmlFor="activityType" className="block text-gray-700 mb-2">
            Activity Type
          </label>
          <select
            id="activityType"
            value={filters.activityType}
            onChange={(e) => onFiltersChange({ ...filters, activityType: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Activities</option>
            {activityTypes.map(activity => (
              <option key={activity} value={activity}>{activity}</option>
            ))}
          </select>
        </div>

        {/* Source Filter */}
        <div>
          <label htmlFor="source" className="block text-gray-700 mb-2">
            Data Source
          </label>
          <select
            id="source"
            value={filters.source}
            onChange={(e) => onFiltersChange({ ...filters, source: e.target.value as any })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="all">All Sources</option>
            <option value="recreation.gov">Recreation.gov</option>
            <option value="reservecalifornia.com">ReserveCalifornia.com</option>
          </select>
        </div>

        {/* Start Date */}
        <div>
          <label htmlFor="startDate" className="block text-gray-700 mb-2">
            Start Date
          </label>
          <input
            id="startDate"
            type="date"
            value={filters.startDate}
            onChange={(e) => onFiltersChange({ ...filters, startDate: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* End Date */}
        <div>
          <label htmlFor="endDate" className="block text-gray-700 mb-2">
            End Date
          </label>
          <input
            id="endDate"
            type="date"
            value={filters.endDate}
            onChange={(e) => onFiltersChange({ ...filters, endDate: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {/* Accessible */}
        <div className="flex items-end">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={filters.accessible || false}
              onChange={(e) => onFiltersChange({ ...filters, accessible: e.target.checked })}
              className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
            />
            <span className="text-gray-700">Accessible Sites Only</span>
          </label>
        </div>
      </div>

      {/* Search Button */}
      <div className="flex justify-center pt-4">
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
        >
          <Search className="w-5 h-5" />
          <span>{loading ? 'Searching...' : 'Search Campsites'}</span>
        </button>
      </div>
    </form>
  );
}