import { useState, useEffect } from 'react'
import BottomNavLayout from '@/components/BottomNavLayout';
import { useTheme } from '@/contexts/ThemeContext';
import Breadcrumb from '@/components/Breadcrumb';
import StageRail from '../components/StageRail'
import LeadCard from '../components/LeadCard'
import LeadDrawer from '../components/LeadDrawer'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc'
import {
  Search,
  Plus,
  Settings,
  Users,
  Inbox
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

  // Filter leads based on search query
  const filterLeads = (leadsArray: any[]) => {
    if (!searchQuery) return leadsArray
    
    return leadsArray.filter(lead => {
      const fullName = `${lead.first_name} ${lead.last_name}`.toLowerCase()
      const query = searchQuery.toLowerCase()
      return (
        fullName.includes(query) ||
        lead.email?.toLowerCase().includes(query) ||
        lead.phone?.includes(query)
      )
    })
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

  // For light mode, we'll use the new design
  // For dark mode, we'll keep compatibility but with light mode as primary
  const isLightMode = !isDarkMode

  return (
    <BottomNavLayout>
      <div className={`min-h-screen ${isLightMode ? 'bg-[#F6F7F9]' : 'bg-[#0F1115]'}`}>
        {/* Breadcrumb Navigation */}
        <div className={`border-b px-6 py-2 ${isLightMode ? 'bg-white/80 backdrop-blur-sm border-slate-200/50' : 'bg-[#18181A] border-white/10'}`}>
          <Breadcrumb
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Leads', href: '/leads' },
            ]}
          />
        </div>

        {/* Header - Apple-like minimal */}
        <div className={`border-b ${isLightMode ? 'bg-white border-slate-200/50' : 'bg-[#18181A] border-white/10'}`}>
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 md:py-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div>
                <h1 className={`text-3xl md:text-4xl font-bold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
                  Leads
                </h1>
                <p className={`text-sm mt-1 ${isLightMode ? 'text-slate-500' : 'text-white/60'}`}>
                  Track, convert, and nurture prospects
                </p>
              </div>
              <div className="flex gap-3 w-full sm:w-auto">
                <Button 
                  onClick={() => setShowSettings(true)} 
                  variant="outline" 
                  className={`flex-1 sm:flex-none ${isLightMode ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50' : ''}`}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Lead Sources
                </Button>
                <Button 
                  onClick={() => setShowAddModal(true)} 
                  className="flex-1 sm:flex-none bg-[#E53935] hover:bg-[#C62828] text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
              </div>
            </div>

            {/* Search Bar - Clean and minimal */}
            <div className="relative max-w-md">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 ${isLightMode ? 'text-slate-400' : 'text-white/40'}`} />
              <Input
                type="text"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-12 h-12 rounded-xl ${isLightMode ? 'bg-slate-100 border-0 text-slate-700 placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#E53935]/20' : ''}`}
              />
            </div>
          </div>
        </div>

        {/* Stage Rail - Innovative pill-style */}
        <div className={`${isLightMode ? 'bg-white/50' : 'bg-[#18181A]/50'} backdrop-blur-sm`}>
          {isLoading ? (
            <div className="py-8 px-6">
              <Skeleton className="h-12 max-w-4xl mx-auto rounded-full" />
            </div>
          ) : (
            <StageRail
              selectedStage={selectedStage}
              onStageSelect={setSelectedStage}
              stageCounts={stageCounts}
            />
          )}
        </div>

        {/* Lead Cards Grid */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
          {/* Stage Title */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h2 className={`text-2xl font-bold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
                {currentStageLabel}
              </h2>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${isLightMode ? 'bg-slate-100 text-slate-600' : 'bg-white/10 text-white/70'}`}>
                {stageLeads.length} leads
              </span>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} className="h-64 rounded-2xl" />
              ))}
            </div>
          ) : stageLeads.length === 0 ? (
            /* Empty State - Friendly illustration */
            <div className={`rounded-2xl p-12 text-center ${isLightMode ? 'bg-white shadow-sm' : 'bg-[#18181A] border border-white/10'}`}>
              <div className={`w-20 h-20 rounded-full mx-auto mb-6 flex items-center justify-center ${isLightMode ? 'bg-slate-100' : 'bg-white/10'}`}>
                <Inbox className={`w-10 h-10 ${isLightMode ? 'text-slate-400' : 'text-white/40'}`} />
              </div>
              <h3 className={`text-xl font-semibold mb-2 ${isLightMode ? 'text-slate-700' : 'text-white'}`}>
                Your pipeline is clear
              </h3>
              <p className={`text-sm mb-6 ${isLightMode ? 'text-slate-500' : 'text-white/60'}`}>
                Let's bring in new leads to grow your dojo.
              </p>
              <Button 
                onClick={() => setShowAddModal(true)}
                className="bg-[#E53935] hover:bg-[#C62828] text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Lead
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {stageLeads.map((lead, index) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  hasKaiSuggestion={index === 0} // First lead gets Kai suggestion for demo
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

        {/* Add Lead Modal - Apple-like clean design */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${isLightMode ? 'bg-white' : 'bg-[#18181A]'}`}>
              <div className={`px-6 py-5 border-b ${isLightMode ? 'border-slate-100' : 'border-white/10'}`}>
                <h2 className={`text-xl font-semibold ${isLightMode ? 'text-slate-800' : 'text-white'}`}>
                  Add New Lead
                </h2>
              </div>
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isLightMode ? 'text-slate-700' : 'text-white/80'}`}>
                      First Name
                    </label>
                    <Input
                      value={newLead.first_name}
                      onChange={(e) => setNewLead({ ...newLead, first_name: e.target.value })}
                      placeholder="John"
                      className={isLightMode ? 'bg-slate-50 border-slate-200' : ''}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isLightMode ? 'text-slate-700' : 'text-white/80'}`}>
                      Last Name
                    </label>
                    <Input
                      value={newLead.last_name}
                      onChange={(e) => setNewLead({ ...newLead, last_name: e.target.value })}
                      placeholder="Doe"
                      className={isLightMode ? 'bg-slate-50 border-slate-200' : ''}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isLightMode ? 'text-slate-700' : 'text-white/80'}`}>
                    Email
                  </label>
                  <Input
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    placeholder="john@example.com"
                    className={isLightMode ? 'bg-slate-50 border-slate-200' : ''}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isLightMode ? 'text-slate-700' : 'text-white/80'}`}>
                    Phone
                  </label>
                  <Input
                    type="tel"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                    className={isLightMode ? 'bg-slate-50 border-slate-200' : ''}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isLightMode ? 'text-slate-700' : 'text-white/80'}`}>
                    Source
                  </label>
                  <Input
                    value={newLead.source}
                    onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                    placeholder="Website, Referral, etc."
                    className={isLightMode ? 'bg-slate-50 border-slate-200' : ''}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isLightMode ? 'text-slate-700' : 'text-white/80'}`}>
                    Parent Of (Optional)
                  </label>
                  <Input
                    value={newLead.parent_of}
                    onChange={(e) => setNewLead({ ...newLead, parent_of: e.target.value })}
                    placeholder="Child's name"
                    className={isLightMode ? 'bg-slate-50 border-slate-200' : ''}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isLightMode ? 'text-slate-700' : 'text-white/80'}`}>
                    Notes
                  </label>
                  <textarea
                    value={newLead.ai_summary}
                    onChange={(e) => setNewLead({ ...newLead, ai_summary: e.target.value })}
                    placeholder="Additional notes about this lead..."
                    className={`w-full min-h-[100px] px-3 py-2 rounded-lg ${isLightMode ? 'bg-slate-50 border border-slate-200 text-slate-700' : 'bg-background border border-input'}`}
                  />
                </div>
              </div>

              <div className={`px-6 py-4 border-t flex gap-3 ${isLightMode ? 'border-slate-100 bg-slate-50' : 'border-white/10'}`}>
                <Button
                  onClick={() => setShowAddModal(false)}
                  variant="outline"
                  className={`flex-1 ${isLightMode ? 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100' : ''}`}
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
