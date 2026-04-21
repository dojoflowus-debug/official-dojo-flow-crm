import { useState, useMemo } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import ManagementLayout from '@/components/ManagementLayout';
import { useTheme } from '@/contexts/ThemeContext';
import Breadcrumb from '@/components/Breadcrumb';
import HeroPipelineStrip from '@/components/HeroPipelineStrip';
import PipelineCommandBar from '@/components/PipelineCommandBar';
import KanbanBoard from '@/components/KanbanBoard';
import LeadDrawer from '@/components/LeadDrawer'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { trpc } from '@/lib/trpc'
import {
  Search,
  Plus,
  Settings,
  Focus,
  Sparkles,
  RefreshCw,
  UserCheck
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import LeadSourceSettings from '@/components/LeadSourceSettings'
import { KaiLeadCaptureSection } from '@/components/KaiLeadCaptureSection'
import MyDojoSyncModal from '@/components/MyDojoSyncModal'
// ScheduleAppointmentModal replaced by full-page ScheduleAppointmentPage

// Stage mapping from old to new
const stageMapping: Record<string, string> = {
  'new_lead': 'new_lead',
  'attempting_contact': 'contacted',
  'contact_made': 'contacted',
  'intro_scheduled': 'intro_scheduled',
  'offer_presented': 'trial_presented',
  'enrolled': 'trial_presented',
  'nurture': 'contacted',
  'lost_winback': 'lost_winback',
};

// New stage definitions
const newStages = [
  { id: 'new_lead', label: 'New Leads' },
  { id: 'contacted', label: 'Contacted' },
  { id: 'intro_scheduled', label: 'Intro Scheduled' },
  { id: 'trial_presented', label: 'Trial Presented' },
  { id: 'lost_winback', label: 'Lost / Winback' },
];

// Old stages for drawer compatibility
const oldStages = [
  { id: 'new_lead', label: 'New Lead' },
  { id: 'attempting_contact', label: 'Attempting Contact' },
  { id: 'contact_made', label: 'Contact Made' },
  { id: 'intro_scheduled', label: 'Intro Scheduled' },
  { id: 'offer_presented', label: 'Offer Presented' },
  { id: 'enrolled', label: 'Enrolled' },
  { id: 'nurture', label: 'Nurture' },
  { id: 'lost_winback', label: 'Lost / Winback' },
];

export default function Leads({ onLogout, theme, toggleTheme }: { onLogout: () => void; theme: string; toggleTheme: () => void }) {
  const [searchParams] = useSearchParams()
  const { theme: currentTheme } = useTheme()
  const isDarkMode = currentTheme === 'dark' || currentTheme === 'cinematic'
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStage, setSelectedStage] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showMyDojoSync, setShowMyDojoSync] = useState(false)
  const [selectedLead, setSelectedLead] = useState<any>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const navigate = useNavigate()
  const [scheduleModalLead, setScheduleModalLead] = useState<any>(null)
  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [isResolveMode, setIsResolveMode] = useState(false)
  const [activeFilter, setActiveFilter] = useState<'new' | 'aging' | 'value' | 'alerts' | null>(null)
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
  const { toast } = useToast()
  const syncStudents = trpc.leads.syncEnrolledFromStudents.useMutation({
    onSuccess: (data) => {
      refetch()
      toast({
        title: 'Sync complete',
        description: data.convertedCount > 0
          ? `${data.convertedCount} lead${data.convertedCount === 1 ? '' : 's'} moved to Enrolled — they are already students.`
          : 'All leads are up to date. No duplicates found.',
      })
    },
    onError: (err) => {
      toast({ title: 'Sync failed', description: err.message, variant: 'destructive' })
    }
  })

  // Calculate stats for command bar
  const stats = useMemo(() => {
    if (!leads) return { newLeads: 0, aging: 0, pipelineValue: 0, alerts: 0 };
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let newLeads = 0;
    let aging = 0;
    let alerts = 0;
    let totalValue = 0;
    
    Object.values(leads).forEach((stageLeads: any[]) => {
      stageLeads.forEach((lead: any) => {
        const createdDate = new Date(lead.created_at || lead.updated_at);
        const ageDays = Math.floor((Date.now() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (createdDate >= today) newLeads++;
        if (ageDays >= 6) aging++;
        if (ageDays >= 10) alerts++;
        
        totalValue += lead.pipeline_value || 500;
      });
    });
    
    return { newLeads, aging, pipelineValue: totalValue, alerts: Math.max(alerts, 0) };
  }, [leads]);

  // Get organization ID from context or props
  const orgId = searchParams.get('org') ? parseInt(searchParams.get('org')!) : 120001;

  // Calculate stage counts and values for hero pipeline
  const { stageCounts, stageValues } = useMemo(() => {
    if (!leads) return { stageCounts: {}, stageValues: {} };
    
    const counts: Record<string, number> = {};
    const values: Record<string, number> = {};
    
    // Initialize
    newStages.forEach(stage => {
      counts[stage.id] = 0;
      values[stage.id] = 0;
    });
    
    // Aggregate from old stages to new stages
    Object.entries(leads).forEach(([oldStageId, stageLeads]: [string, any[]]) => {
      const newStageId = stageMapping[oldStageId] || oldStageId;
      if (counts[newStageId] !== undefined) {
        counts[newStageId] += stageLeads.length;
        stageLeads.forEach(lead => {
          values[newStageId] += lead.pipeline_value || 500;
        });
      }
    });
    
    return { stageCounts: counts, stageValues: values };
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

  // Handle stage selection from hero pipeline
  const handleStageSelect = (stageId: string) => {
    setSelectedStage(selectedStage === stageId ? null : stageId);
  }

  // Handle filter click from command bar
  const handleFilterClick = (filter: 'new' | 'aging' | 'value' | 'alerts' | null) => {
    setActiveFilter(activeFilter === filter ? null : filter);
  }

  return (
    <ManagementLayout>
      <div className={`min-h-full overflow-y-auto transition-all duration-[180ms] ease-out ${isDarkMode ? 'bg-[#0A0A0A]' : 'bg-[#F6F7F9]'}`}>
        {/* Breadcrumb Navigation */}
        <div className={`border-b px-6 py-2 ${isDarkMode ? 'bg-[#111111]/80 backdrop-blur-sm border-white/10' : 'bg-white/80 backdrop-blur-sm border-slate-200/50'}`}>
          <Breadcrumb
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Leads', href: '/leads' },
            ]}
          />
        </div>

        {/* Header */}
        <div className={`border-b ${isDarkMode ? 'bg-[#111111] border-white/10' : 'bg-white border-slate-200/50'}`}>
          <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className={`text-2xl md:text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-800'}`}>
                  Leads
                </h1>
                <p className={`text-sm mt-0.5 ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>
                  Your revenue funnel • Command center
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
                  onClick={() => syncStudents.mutate()}
                  disabled={syncStudents.isLoading}
                  variant="outline"
                  size="sm"
                  title="Auto-convert leads who are already students"
                  className={`${isDarkMode ? 'bg-white/5 border-white/20 text-white hover:bg-white/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  <UserCheck className="h-4 w-4 mr-1.5" />
                  <span className="text-xs">{syncStudents.isLoading ? 'Syncing…' : 'Sync Students'}</span>
                </Button>
                <Button
                  onClick={() => setShowMyDojoSync(true)}
                  variant="outline"
                  size="sm"
                  title="Manage integrations & external data sources"
                  className={`${isDarkMode ? 'bg-white/5 border-white/20 text-white hover:bg-white/10' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                >
                  <RefreshCw className="h-4 w-4 mr-1.5" />
                  <span className="text-xs">Integrations</span>
                </Button>
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
                  data-tutorial-id="add-lead-btn"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Lead
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* HERO: Pipeline Strip */}
        <div className={`${isDarkMode ? 'bg-gradient-to-b from-[#111111] to-[#0A0A0A]' : 'bg-gradient-to-b from-white to-slate-50'}`}>
          <div className="max-w-[1600px] mx-auto">
            {isLoading ? (
              <div className="px-6 py-6">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <Skeleton key={i} className="h-[120px] flex-1 rounded-lg" />
                  ))}
                </div>
              </div>
            ) : (
              <HeroPipelineStrip
                selectedStage={selectedStage}
                onStageSelect={handleStageSelect}
                stageCounts={stageCounts}
                stageValues={stageValues}
                isDarkMode={isDarkMode}
              />
            )}
          </div>
        </div>

        {/* Command Bar */}
        <div className="max-w-[1600px] mx-auto">
          {isLoading ? (
            <div className="px-6 py-3">
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          ) : (
            <PipelineCommandBar
              newLeads={stats.newLeads}
              agingLeads={stats.aging}
              pipelineValue={stats.pipelineValue}
              alerts={stats.alerts}
              isDarkMode={isDarkMode}
              onFilterClick={handleFilterClick}
              activeFilter={activeFilter}
            />
          )}
        </div>

        {/* Search Bar */}
        <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className={`absolute left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 ${isDarkMode ? 'text-white/40' : 'text-slate-400'}`} />
              <Input
                type="text"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`pl-11 h-10 rounded-xl ${isDarkMode ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40' : 'bg-white border-slate-200 text-slate-700 placeholder:text-slate-400'}`}
              />
            </div>

            {/* Stage filter info */}
            {selectedStage && (
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>
                  Filtering: <span className="font-medium">{newStages.find(s => s.id === selectedStage)?.label}</span>
                </span>
                <button
                  onClick={() => setSelectedStage(null)}
                  className="px-2 py-1 rounded-lg text-xs font-medium bg-[#E53935]/20 text-[#E53935] hover:bg-[#E53935]/30 transition-colors"
                >
                  Clear ×
                </button>
              </div>
            )}

            {activeFilter && (
              <div className="flex items-center gap-2">
                <span className={`text-sm ${isDarkMode ? 'text-white/60' : 'text-slate-500'}`}>
                  Filter: <span className="font-medium capitalize">{activeFilter}</span>
                </span>
                <button
                  onClick={() => setActiveFilter(null)}
                  className="px-2 py-1 rounded-lg text-xs font-medium bg-[#E53935]/20 text-[#E53935] hover:bg-[#E53935]/30 transition-colors"
                >
                  Clear ×
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Kai Insight Banner */}
        {stats.aging > 0 && (
          <div className="max-w-[1600px] mx-auto px-4 md:px-6 pb-4">
            <div className={`
              flex items-center gap-3 px-4 py-3 rounded-xl
              ${isDarkMode 
                ? 'bg-purple-500/10 border border-purple-500/20' 
                : 'bg-purple-50 border border-purple-200'
              }
            `}>
              <Sparkles className="w-5 h-5 text-purple-500 flex-shrink-0" />
              <p className={`text-sm ${isDarkMode ? 'text-purple-300' : 'text-purple-700'}`}>
                <span className="font-medium">{stats.aging} leads</span> are aging in the pipeline — consider SMS follow-up to re-engage.
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="ml-auto text-purple-500 hover:text-purple-600 hover:bg-purple-500/10"
              >
                Ask Kai
              </Button>
            </div>
          </div>
        )}

        {/* Kanban Board */}
        <div className="max-w-[1600px] mx-auto">
          {isLoading ? (
            <div className="px-6 pb-8">
              <div className="flex gap-4 overflow-x-auto">
                {[1, 2, 3, 4, 5].map(i => (
                  <div key={i} className="flex-shrink-0 w-[300px]">
                    <Skeleton className="h-12 w-full rounded-t-xl mb-0" />
                    <Skeleton className="h-[400px] w-full rounded-b-xl" />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <KanbanBoard
              leads={leads || {}}
              selectedStage={selectedStage}
              isDarkMode={isDarkMode}
              onLeadClick={(lead) => {
                setSelectedLead(lead)
                setIsDrawerOpen(true)
              }}
              onAddLead={() => setShowAddModal(true)}
              onCall={(lead) => {
                if (lead.phone) window.location.href = `tel:${lead.phone}`
              }}
              onText={(lead) => {
                if (lead.phone) window.location.href = `sms:${lead.phone}`
              }}
              onSchedule={(lead) => {
                navigate(`/leads/${lead.id}/schedule`)
              }}
              onStatusChange={(leadId, newStatus) => {
                updateStatus.mutate({ id: leadId, status: newStatus })
              }}
            />
          )}
        </div>

        {/* Kai Chat Lead Capture Section */}
        {!isLoading && leads && (
          <KaiLeadCaptureSection
            leads={Object.values(leads).flat()}
            organizationId={orgId}
            isDarkMode={isDarkMode}
          />
        )}

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
          stages={oldStages}
          currentStage={selectedLead?.status || 'new_lead'}
          onOpenScheduler={() => {
            if (selectedLead) navigate(`/leads/${selectedLead.id}/schedule`);
          }}
        />

        {/* Schedule Appointment Modal */}
        {/* Scheduler is now a full-page route: /leads/:leadId/schedule */}

        {/* Lead Source Settings Modal */}
        <LeadSourceSettings 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)} 
        />

        {/* Integrations Modal */}
        <MyDojoSyncModal
          isOpen={showMyDojoSync}
          onClose={() => setShowMyDojoSync(false)}
          onSyncComplete={() => {
            // Refetch leads after sync
            window.location.reload()
          }}
        />

        {/* Add Lead Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className={`w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden ${isDarkMode ? 'bg-[#1A1A1C]' : 'bg-white'}`}>
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
                      className={isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}
                      data-tutorial-id="lead-name-field"
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
                      className={isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}
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
                    className={isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}
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
                    className={isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}
                    data-tutorial-id="lead-source-field"
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
                    className={isDarkMode ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-50 border-slate-200'}
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
                  data-tutorial-id="lead-save-btn"
                >
                  Add Lead
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ManagementLayout>
  )
}
