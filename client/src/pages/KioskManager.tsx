import { useState } from 'react';
import { trpc } from '../lib/trpc';
import { ChevronRight, Plus, Settings, HelpCircle, Search, MoreVertical } from 'lucide-react';
import AddLocationModal from '../components/kiosk/AddLocationModal';
import KioskEditor from '../components/kiosk/KioskEditor';
import KioskPreview from '../components/kiosk/KioskPreview';

interface Location {
  id: number;
  name: string;
  address?: string;
  isActive: number;
  updatedAt: string;
}

export default function KioskManager() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch locations using TRPC
  const { data: locations = [], isLoading: locationsLoading, refetch: refetchLocations } = trpc.kioskManager.getLocations.useQuery();

  // Filter locations based on search
  const filteredLocations = (locations || []).filter(loc =>
    loc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.address?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  if (locationsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
          <p className="text-slate-400 mt-4">Loading kiosk locations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <div className="border-b border-white/10 bg-slate-900/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Kiosk Manager</h1>
              <p className="text-slate-400 mt-1">Manage and customize your dojo check-in kiosks</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus size={20} />
                Add Kiosk Location
              </button>
              <button className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                <HelpCircle size={20} className="text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel - Location List */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 h-full">
              {/* Search */}
              <div className="mb-6">
                <div className="relative">
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Search locations..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-slate-700/50 border border-white/10 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50 transition-colors"
                  />
                </div>
              </div>

              {/* Locations List */}
              <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                {filteredLocations.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-slate-400">No locations found</p>
                    <button
                      onClick={() => setShowAddModal(true)}
                      className="mt-4 text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                    >
                      Create your first location
                    </button>
                  </div>
                ) : (
                  filteredLocations.map((location) => (
                    <button
                      key={location.id}
                      onClick={() => setSelectedLocation(location)}
                      className={`w-full text-left p-4 rounded-lg border transition-all duration-200 group ${
                        selectedLocation?.id === location.id
                          ? 'bg-red-500/10 border-red-500/30 shadow-lg shadow-red-500/10'
                          : 'bg-slate-700/30 border-white/10 hover:bg-slate-700/50 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-white truncate">{location.name}</h3>
                          <p className="text-sm text-slate-400 truncate mt-1">{location.address || 'No address'}</p>
                          <p className="text-xs text-slate-500 mt-2">Modified {formatDate(location.updatedAt)}</p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            location.isActive
                              ? 'bg-green-500/20 text-green-300'
                              : 'bg-slate-600/30 text-slate-400'
                          }`}>
                            {location.isActive ? 'Active' : 'Inactive'}
                          </span>
                          <ChevronRight size={18} className="text-slate-500 group-hover:text-slate-400 transition-colors" />
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Panel - Editor and Preview */}
          <div className="lg:col-span-2">
            {selectedLocation ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Editor */}
                <KioskEditor location={selectedLocation} onLocationUpdated={() => refetchLocations()} />
                
                {/* Preview */}
                <KioskPreview location={selectedLocation} />
              </div>
            ) : (
              <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl p-12 text-center h-full flex items-center justify-center">
                <div>
                  <Settings size={48} className="text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Select a Location</h3>
                  <p className="text-slate-400">Choose a location from the list to customize its kiosk settings</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Location Modal */}
      {showAddModal && (
        <AddLocationModal
          onClose={() => setShowAddModal(false)}
          onLocationAdded={() => {
            setShowAddModal(false);
            refetchLocations();
          }}
        />
      )}
    </div>
  );
}
