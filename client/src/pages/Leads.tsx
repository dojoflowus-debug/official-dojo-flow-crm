import { useState, useEffect, useMemo } from 'react'
import BottomNavLayout from '@/components/BottomNavLayout';
import { useTheme } from '@/contexts/ThemeContext';
import Breadcrumb from '@/components/Breadcrumb';
import SignatureStageRail from '../components/SignatureStageRail'
import SignatureLeadCard from '../components/SignatureLeadCard'
import LeadStatTiles from '../components/LeadStatTiles'
import LeadDrawer from '../components/LeadDrawer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { trpc } from '@/lib/trpc'
import {
  Search,
  Plus,
  Settings,
  Users,
  Inbox,
  Zap,
  Focus
} from 'lucide-react'
import LeadSourceSettings from '../components/LeadSourceSettings'

export default function Leads({ onLogout, theme, toggleTheme }) {
  const { theme: currentTheme } = useTheme()
  const isDarkMode = currentTheme === 'dark' || currentTheme === 'cinematic'
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStage, setSelectedStage] = useState('new_lead')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isResolveMode, setIsResolveMode] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'new' | 'aging' | 'value' | 'kai' | null>(null)
  const [newLead, setNewLead] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    source: 'Website',
    parent_of: '',
    tags: '',
    ai_summary: ''
  })

  // tRPC queries and mutations
  const { data: leads, isLoading, refetch } = trpc.leads.getByStatus.useQuery()
  const createLead = trpc.leads.create.useMutation({
    onSuccess: () => {
      refetch()
      setShowAddModal(false)
      setNewLead({
        first_name: '',
        last_name: '',
        email: '',
        phone: '',
        source: 'Website',
        parent_of: '',
        tags: '',
        ai_summary: ''
      })
    }
  })
  const updateStatus = trpc.leads.updateStatus.useMutation({
    onSuccess: () => refetch()
  })
  const deleteLead = trpc.leads.delete.useMutation({
    onSuccess: () => {
      refetch()
      setIsDrawerOpen(false)
      setSelectedLead(null)
    }
  })

  // Pipeline stages
  const stages = [
    { id: 'new_lead', label: 'New Lead' },
    { id: 'attempting_contact', label: 'Attempting Contact' },
    { id: 'contact_made', label: 'Contact Made' },
    { id: 'intro_scheduled', label: 'Intro Scheduled' },
    { id: 'offer_presented', label: 'Offer Presented' },
    { id: 'enrolled', label: 'Enrolled' },
    { id: 'nurture', label: 'Nurture' },
    { id: 'lost_winback', label: 'Lost / Winback' },
  ]

  // Calculate stats
  const stats = useMemo(() => {
    if (!leads) return { newToday: 0, aging: 0, pipelineValue: 0, kaiAlerts: 0 };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let newToday = 0;
    let aging = 0;
    let kaiAlerts = 0;
    
    // Count across all stages
    Object.values(leads).forEach((stageLeads: any[]) => {
      stageLeads.forEach((lead: any) => {
        const createdDate = new Date(lead.created_at || lead.updated_at);
        const ageDays = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // New today
        if (createdDate >= today) newToday++;
        
        // Aging (6+ days)
        if (ageDays >= 6) aging++;
        
        // Kai alerts (simulate - every 3rd aging lead)
        if (ageDays >= 6 && Math.random() > 0.7) kaiAlerts++;
      });
    });
    
    // Estimate pipeline value ($500 per lead average)
    const totalLeads = Object.values(leads).reduce((sum: number, arr: any[]) => sum + arr.length, 0);
    const pipelineValue = totalLeads * 500;
    
    return { newToday, aging, pipelineValue, kaiAlerts: Math.max(kaiAlerts, 1) };
  }, [leads]);

  // Calculate stage health
  const stageHealth = useMemo(() => {
    if (!leads) return {};
    
    const health: Record<string, 'green' | 'yellow' | 'red'> = {};
    
    stages.forEach(stage => {
      const stageLeads = leads[stage.id] || [];
      let redCount = 0;
      let yellowCount = 0;
      
      stageLeads.forEach((lead: any) => {
        const createdDate = new Date(lead.created_at || lead.updated_at);
        const ageDays = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        if (ageDays >= 11) redCount++;
        else if (ageDays >= 6) yellowCount++;
      });
      
      if (redCount > 0) health[stage.id] = 'red';
      else if (yellowCount > 0) health[stage.id] = 'yellow';
      else health[stage.id] = 'green';
    });
    
    return health;
  }, [leads]);

  // Handle Add Lead
  const handleAddLead = () => {
    createLead.mutate({
      firstName: newLead.first_name,
      lastName: newLead.last_name,
      email: newLead.email,
      phone: newLead.phone,
      source: newLead.source,
      notes: newLead.ai_summary,
    })
  }

  // Handle Delete Lead
  const handleDeleteLead = () => {
    if (!selectedLead) return
    if (!confirm('Are you sure you want to delete this lead?')) return
    deleteLead.mutate({ id: selectedLead.id })
  }

  // Handle move to stage
  const handleMoveToStage = (toStage: string) => {
    if (!selectedLead) return
    updateStatus.mutate({ id: selectedLead.id, status: toStage })
    setIsDrawerOpen(false)
    setSelectedLead(null)
  }

  // Handle filter click from stat tiles
  const handleFilterClick = (filter: 'new' | 'aging' | 'value' | 'kai' | null) => {
    setActiveFilter(filter);
    // Could also auto-select appropriate stage based on filter
  }

  // Filter leads based on search query and active filter
  const filterLeads = (leadsArray: any[]) => {
    let filtered = leadsArray;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(lead => {
        const fullName = `${lead.first_name} ${lead.last_name}`.toLowerCase()
        return (
          fullName.includes(query) ||
          lead.email?.toLowerCase().includes(query) ||
          lead.phone?.includes(query)
        )
      });
    }
    
    // Stat tile filters
    if (activeFilter === 'new') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      filtered = filtered.filter(lead => {
        const createdDate = new Date(lead.created_at || lead.updated_at);
        return createdDate >= today;
      });
    } else if (activeFilter === 'aging') {
      filtered = filtered.filter(lead => {
        const createdDate = new Date(lead.created_at || lead.updated_at);
        const ageDays = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        return ageDays >= 6;
      });
    }
    
    return filtered;
  }

  // Get leads for selected stage
  const getLeadsForStage = () => {
    if (!leads) return []
    const stageLeads = leads[selectedStage] || []
    return filterLeads(stageLeads)
  }

  // Calculate stage counts
  const getStageCounts = () => {
    if (!leads) return {}
    const counts: Record<string, number> = {}
    stages.forEach(stage => {
      counts[stage.id] = (leads[stage.id] || []).length
    })
    return counts
  }

  const stageLeads = getLeadsForStage()
  const stageCounts = getStageCounts()
  const currentStageLabel = stages.find(s => s.id === selectedStage)?.label || 'Leads'

  return (
    <BottomNavLayout>
      <div className={`min-h-screen transition-all duration-[180ms] ease-out ${isDarkMode ? 'bg-[#0F1115]' : 'bg-[#F6F7F9]'} ${isResolveMode ? (isDarkMode ? 'bg-[#0A0B0D]' : 'bg-[#E8E9EB]') : ''}`}>
        {/* Breadcrumb Navigation */}
        <div className={`border-b px-6 py-2 ${isDarkMode ? 'bg-[#18181A]/80 backdrop-blur-sm border-white/10' : 'bg-white/80 backdrop-blur-sm border-slate-200/50'}`}>
          <Breadcrumb
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Leads', href: '/leads' },
            ]}
          />
        </div>

        {/* Header */}
        <div className={`border-b ${isDarkMode ? 'bg-[#18181A] border-white/10' : 'bg-white border-slate-200/50'}`}>
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className={`text-3xl md:text-4xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  Leads
                </h1>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>
                  Your revenue radar • Command center
                </p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {/* Resolve Mode Toggle */}
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}>
                  <Focus className={`w-4 h-4 ${isResolveMode ? 'text-[#E53935]' : isDarkMode ? 'text-white/40' : 'text-slate-400'}`} />
                  <span className={`text-xs font-medium ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>Resolve</span>
                  <Switch
                    checked={isResolveMode}
                    onCheckedChange={setIsResolveMode}
                    className="data-[state=checked]:bg-[#E53935]"
                  />
                </div>
                
                <Button 
                  onClick={() => setShowSettings(true)} 
                  variant="outline" 
                  size="sm"
                  className={`${isDarkMode ? 'bg-white/5 border-white/20 text-white hover:bg-white/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  <Settings className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={() => setShowAddModal(true)} 
                  className="bg-[#E53935] hover:bg-[#C62828] text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Stat Tiles */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 px-4 md:px-6 py-4 max-w-7xl mx-auto">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            <LeadStatTiles
              newLeadsToday={stats.newToday}
              agingLeads={stats.aging}
              pipelineValue={stats.pipelineValue}
              kaiAlerts={stats.kaiAlerts}
              onFilterClick={handleFilterClick}
              activeFilter={activeFilter}
              isDarkMode={isDarkMode}
              isResolveMode={isResolveMode}
            />
          </div>
        )}

        {/* Stage Rail */}
        <div className={`${isDarkMode ? 'bg-[#18181A]/50' : 'bg-white/50'} backdrop-blur-sm`}>
          {isLoading ? (
            <div className="py-6 px-6">
              <Skeleton className="h-20 max-w-4xl mx-auto rounded-xl" />
            </div>
          ) : (
            <div className="max-w-7xl mx-auto">
              <SignatureStageRail
                selectedStage={selectedStage}
                onStageSelect={setSelectedStage}
                stageCounts={stageCounts}
                stageHealth={stageHealth}
                isDarkMode={isDarkMode}
                isResolveMode={isResolveMode}
              />
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="relative max-w-md">
            <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`} />
            <Input
              type="text"
              placeholder="Search leads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`pl-12 h-12 rounded-xl ${isDarkMode ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40' : 'bg-slate-100 border-0 text-slate-700 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#E53935]/20'}`}
            />
          </div>
        </div>

        {/* Lead Cards Grid */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 pb-8">
          {/* Stage Title */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                {currentStageLabel}
              </h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${isDarkMode ? 'bg-white/10 text-white/70' : 'bg-slate-100 text-slate-600'}`}>
                {stageLeads.length} leads
              </span>
              {activeFilter && (
                <button
                  onClick={() => setActiveFilter(null)}
                  className="px-3 py-1 rounded-full text-xs font-medium bg-[#E53935]/20 text-[#E53935] hover:bg-[#E53935]/30 transition-colors"
                >
                  Clear filter ×
                </button>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : stageLeads.length === 0 ? (
            /* Empty State */
            <div className={`rounded-2xl p-12 text-center ${isDarkMode ? 'bg-[#18181A] border border-white/10' : 'bg-white shadow-sm'}`}>
              <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${isDarkMode ? 'bg-white/10' : 'bg-slate-100'}`}>
                <Inbox className={`w-10 h-10 ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`} />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>
                {activeFilter ? 'No leads match this filter' : 'Your pipeline is clear'}
              </h3>
              <p className={`text-sm mb-6 ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>
                {activeFilter ? 'Try adjusting your filter or search criteria.' : "Let's bring in new leads to grow your dojo."}
              </p>
              {!activeFilter && (
                <Button 
                  onClick={() => setShowAddModal(true)}
                  className="bg-[#E53935] hover:bg-[#C62828] text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Lead
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {stageLeads.map((lead, index) => (
                <SignatureLeadCard
                  key={lead.id}
                  lead={lead}
                  hasKaiSuggestion={index < stats.kaiAlerts}
                  isDarkMode={isDarkMode}
                  isResolveMode={isResolveMode}
                  index={index}
                  onClick={() => {
                    setSelectedLead(lead)
                    setIsDrawerOpen(true)
                  }}
                  onCall={() => {
                    if (lead.phone) window.location.href = `tel:${lead.phone}`
                  }}
                  onText={() => {
                    if (lead.phone) window.location.href = `sms:${lead.phone}`
                  }}
                  onSchedule={() => {
                    setSelectedLead(lead)
                    setIsDrawerOpen(true)
                  }}
                  onMoveToStage={() => {
                    setSelectedLead(lead)
                    setIsDrawerOpen(true)
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Lead Drawer */}
        <LeadDrawer
          lead={selectedLead}
          isOpen={isDrawerOpen}
          onClose={() => {
            setIsDrawerOpen(false)
            setSelectedLead(null)
          }}
          onMoveToStage={handleMoveToStage}
          onDelete={handleDeleteLead}
          stages={stages}
          currentStage={selectedStage}
        />

        {/* Lead Source Settings Modal */}
        <LeadSourceSettings 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)} 
        />

        {/* Add Lead Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${isDarkMode ? 'bg-[#18181A]' : 'bg-white'}`}>
              <div className={`px-6 py-5 border-b ${isDarkMode ? 'border-white/10' : 'border-slate-100'}`}>
                <h2 className={`text-xl font-semibold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  Add New Lead
                </h2>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white/80' : 'text-slate-700'}`}>
                      First Name
                    </label>
                    <Input
                      value={newLead.first_name}
                      onChange={(e) => setNewLead({ ...newLead, first_name: e.target.value })}
                      placeholder="John"
                      className={isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white/80' : 'text-slate-700'}`}>
                      Last Name
                    </label>
                    <Input
                      value={newLead.last_name}
                      onChange={(e) => setNewLead({ ...newLead, last_name: e.target.value })}
                      placeholder="Doe"
                      className={isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white/80' : 'text-slate-700'}`}>
                    Email
                  </label>
                  <Input
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    placeholder="john@example.com"
                    className={isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white/80' : 'text-slate-700'}`}>
                    Phone
                  </label>
                  <Input
                    type="tel"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    className={isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white/80' : 'text-slate-700'}`}>
                    Source
                  </label>
                  <Input
                    value={newLead.source}
                    onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                    placeholder="Website, Referral, etc."
                    className={isDarkMode ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-white/80' : 'text-slate-700'}`}>
                    Notes
                  </label>
                  <textarea
                    value={newLead.ai_summary}
                    onChange={(e) => setNewLead({ ...newLead, ai_summary: e.target.value })}
                    placeholder="Additional notes about this lead..."
                    className={`w-full min-h-[100px] px-3 py-2 rounded-lg ${isDarkMode ? 'bg-white/5 border border-white/10 text-white' : 'bg-slate-50 border border-slate-200 text-slate-700'}`}
                  />
                </div>
              </div>

              <div className={`px-6 py-4 border-t flex gap-3 ${isDarkMode ? 'border-white/10' : 'border-slate-100 bg-slate-50'}`}>
                <Button
                  onClick={() => setShowAddModal(false)}
                  variant="outline"
                  className={`flex-1 ${isDarkMode ? 'bg-white/5 border-white/20 text-white hover:bg-white/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddLead}
                  disabled={!newLead.first_name || !newLead.last_name}
                  className="flex-1 bg-[#E53935] hover:bg-[#C62828] text-white"
                >
                  Add Lead
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </BottomNavLayout>
  )
}
