import { useState, useEffect } from 'react'
import BottomNavLayout from '@/components/BottomNavLayout';
import Breadcrumb from '@/components/Breadcrumb';
import HorizontalPipeline from '../components/HorizontalPipeline'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { trpc } from '@/lib/trpc'
import {
  Search,
  Plus,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  Star,
  Clock,
  User,
  MapPin,
  Trash2,
  MoveRight,
  Settings
} from 'lucide-react'
import LeadSourceSettings from '../components/LeadSourceSettings'

export default function Leads({ onLogout, theme, toggleTheme }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStage, setSelectedStage] = useState('new_lead')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [columnMenuOpen, setColumnMenuOpen] = useState(null)
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
    onSuccess: () => refetch()
  })

  // Pipeline stages
  const stages = [
    'new_lead',
    'attempting_contact',
    'contact_made',
    'intro_scheduled',
    'offer_presented',
    'enrolled',
    'nurture',
    'lost_winback'
  ]

  // Close column menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (columnMenuOpen && !e.target.closest('.column-menu-container')) {
        setColumnMenuOpen(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [columnMenuOpen])

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
  const handleDeleteLead = (leadId) => {
    if (!confirm('Are you sure you want to delete this lead?')) return
    deleteLead.mutate({ id: leadId })
  }

  // Handle move to stage
  const handleMoveToStage = (lead, toStage) => {
    updateStatus.mutate({ id: lead.id, status: toStage })
    setColumnMenuOpen(null)
  }

  // Filter leads based on search query
  const filterLeads = (leadsArray) => {
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
    const counts = {}
    stages.forEach(stage => {
      counts[stage] = (leads[stage] || []).length
    })
    return counts
  }

  // Render lead card
  const renderLeadCard = (lead) => {
    const fullName = `${lead.first_name} ${lead.last_name}`
    const tags = typeof lead.tags === 'string' ? lead.tags.split(',').filter(t => t) : (lead.tags || [])
    
    return (
      <Card key={lead.id} className="relative group hover:shadow-xl transition-all">
        <CardContent className="p-6">
          {/* Delete button */}
          <button
            onClick={() => handleDeleteLead(lead.id)}
            className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-destructive text-destructive-foreground rounded-full p-2 hover:bg-destructive/90"
          >
            <Trash2 className="h-4 w-4" />
          </button>

          <h4 className="font-semibold text-xl mb-2 pr-8">{fullName}</h4>
          
          {lead.parent_of && (
            <p className="text-sm text-muted-foreground mb-2">Parent of: {lead.parent_of}</p>
          )}

          <div className="flex items-center gap-1 mb-3">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-semibold">{lead.lead_score || 50}</span>
          </div>

          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>{lead.phone || 'No phone'}</span>
            </div>
            <div className="flex items-center gap-3 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span className="truncate">{lead.email || 'No email'}</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>{lead.source || 'Unknown'}</span>
            </div>
            {lead.assigned_to && (
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                <span>{lead.assigned_to}</span>
              </div>
            )}
          </div>

          {lead.updated_at && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
              <Clock className="h-3 w-3" />
              <span>{new Date(lead.updated_at).toLocaleDateString()}</span>
            </div>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-3">
              {tags.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full"
                >
                  {tag.trim()}
                </span>
              ))}
            </div>
          )}

          {lead.ai_summary && (
            <p className="text-sm text-muted-foreground italic mb-3">
              {lead.ai_summary}
            </p>
          )}

          <div className="flex gap-2 mb-3">
            <Button size="sm" variant="outline" className="flex-1">
              <Phone className="h-4 w-4 mr-1" />
              Call
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              <MessageSquare className="h-4 w-4 mr-1" />
              Text
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              <Calendar className="h-4 w-4 mr-1" />
              Schedule
            </Button>
          </div>

          {/* Move to Stage button */}
          <div className="relative column-menu-container">
            <Button
              onClick={() => setColumnMenuOpen(columnMenuOpen === lead.id ? null : lead.id)}
              variant="outline"
              className="w-full flex items-center justify-center gap-2"
            >
              <MoveRight className="h-4 w-4" />
              Move to Stage
            </Button>

            {/* Stage selection dropdown */}
            {columnMenuOpen === lead.id && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border-2 border-border rounded-lg shadow-xl z-50 overflow-hidden">
                {stages.map((stage) => {
                  const isCurrentStage = stage === selectedStage
                  const stageLabels = {
                    new_lead: 'New Lead',
                    attempting_contact: 'Attempting Contact',
                    contact_made: 'Contact Made',
                    intro_scheduled: 'Intro Scheduled',
                    offer_presented: 'Offer Presented',
                    enrolled: 'Enrolled',
                    nurture: 'Nurture',
                    lost_winback: 'Lost / Winback'
                  }
                  
                  return (
                    <button
                      key={stage}
                      onClick={() => !isCurrentStage && handleMoveToStage(lead, stage)}
                      disabled={isCurrentStage}
                      className={`
                        w-full px-4 py-3 text-left transition-colors
                        ${isCurrentStage 
                          ? 'bg-muted text-muted-foreground cursor-not-allowed' 
                          : 'hover:bg-accent hover:text-accent-foreground cursor-pointer'
                        }
                      `}
                    >
                      {stageLabels[stage]}
                      {isCurrentStage && ' (Current)'}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const stageLeads = getLeadsForStage()
  const stageCounts = getStageCounts()

  return (
    <BottomNavLayout>
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-red-950/20">
        {/* Breadcrumb Navigation */}
        <div className="bg-card/30 backdrop-blur-sm border-b border-border/30 px-6 py-2">
          <Breadcrumb
            items={[
              { label: 'Dashboard', href: '/dashboard' },
              { label: 'Leads', href: '/leads' },
            ]}
          />
        </div>

        {/* Header */}
        <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-3 md:px-6 py-4 md:py-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:gap-4 mb-4 md:mb-6">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold">Lead Pipeline</h1>
              <div className="flex gap-2 md:gap-3 w-full sm:w-auto">
                <Button onClick={() => setShowSettings(true)} size="sm" variant="outline" className="flex-1 sm:flex-none text-xs md:text-sm">
                  <Settings className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                  <span className="hidden sm:inline">Lead Sources</span>
                  <span className="sm:hidden">Sources</span>
                </Button>
                <Button onClick={() => setShowAddModal(true)} size="sm" className="md:size-lg flex-1 sm:flex-none text-xs md:text-sm">
                  <Plus className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
                  Add Lead
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search leads..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 md:pl-12 h-10 md:h-12 text-sm md:text-base"
              />
            </div>
          </div>
        </div>

        {/* Horizontal Pipeline */}
        {isLoading ? (
          <div className="py-12">
            <Skeleton className="h-40 max-w-7xl mx-auto" />
          </div>
        ) : (
          <HorizontalPipeline
            selectedStage={selectedStage}
            onStageSelect={setSelectedStage}
            stageCounts={stageCounts}
          />
        )}

        {/* Lead Cards for Selected Stage */}
        <div className="max-w-7xl mx-auto px-6 pb-12">
          <h2 className="text-2xl font-bold mb-6">
            {selectedStage.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
            <span className="text-muted-foreground ml-2">({stageLeads.length})</span>
          </h2>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Skeleton key={i} className="h-64" />
              ))}
            </div>
          ) : stageLeads.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">No leads in this stage</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {stageLeads.map(lead => renderLeadCard(lead))}
            </div>
          )}
        </div>

        {/* Lead Source Settings Modal */}
        <LeadSourceSettings 
          isOpen={showSettings} 
          onClose={() => setShowSettings(false)} 
        />

        {/* Add Lead Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <CardTitle className="text-2xl">Add New Lead</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">First Name</label>
                    <Input
                      value={newLead.first_name}
                      onChange={(e) => setNewLead({ ...newLead, first_name: e.target.value })}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Last Name</label>
                    <Input
                      value={newLead.last_name}
                      onChange={(e) => setNewLead({ ...newLead, last_name: e.target.value })}
                      placeholder="Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <Input
                    type="email"
                    value={newLead.email}
                    onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <Input
                    type="tel"
                    value={newLead.phone}
                    onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Source</label>
                  <Input
                    value={newLead.source}
                    onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                    placeholder="Website, Referral, etc."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Parent Of (Optional)</label>
                  <Input
                    value={newLead.parent_of}
                    onChange={(e) => setNewLead({ ...newLead, parent_of: e.target.value })}
                    placeholder="Child's name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
                  <Input
                    value={newLead.tags}
                    onChange={(e) => setNewLead({ ...newLead, tags: e.target.value })}
                    placeholder="hot, referral, interested"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Notes</label>
                  <textarea
                    value={newLead.ai_summary}
                    onChange={(e) => setNewLead({ ...newLead, ai_summary: e.target.value })}
                    placeholder="Additional notes about this lead..."
                    className="w-full min-h-[100px] px-3 py-2 border border-input rounded-md bg-background"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    onClick={handleAddLead}
                    disabled={!newLead.first_name || !newLead.last_name}
                    className="flex-1"
                  >
                    Add Lead
                  </Button>
                  <Button
                    onClick={() => setShowAddModal(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </BottomNavLayout>
  )
}
