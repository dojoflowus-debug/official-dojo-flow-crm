import { useState, useEffect, useMemo } from 'react'
import BottomNavLayout from '@/components/BottomNavLayout';
import StudentMap from '../components/StudentMap'
import KaiRecommendationsPanel from '../components/KaiRecommendationsPanel'
import MarketingScoreCard from '../components/MarketingScoreCard'
import CampaignBuilder from '../components/CampaignBuilder'
import CompetitorMap from '../components/CompetitorMap'
import DemographicsDeepDive from '../components/DemographicsDeepDive'
import AdHeatmap from '../components/AdHeatmap'
import SpendEfficiencyTracker from '../components/SpendEfficiencyTracker'

import { trpc } from "@/lib/trpc"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
  MapPin, TrendingUp, Users, DollarSign, Plus, Send, Calendar, 
  CheckCircle2, XCircle, Eye, Play, Pause, Settings, MessageSquare, 
  User, Clock, Sparkles 
} from 'lucide-react'
import AutomationTemplateLibrary from '@/components/AutomationTemplateLibrary'
import { useNavigate } from "react-router-dom"
import { format } from "date-fns"
import { toast } from "sonner"

export default function Marketing({ onLogout, theme, toggleTheme }) {
  const navigate = useNavigate()
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [selectedZip, setSelectedZip] = useState('77377')
  const [stats, setStats] = useState({
    total_students: 0,
    zip_codes: 0,
    avg_students_per_zip: 0
  })

  // Campaigns state
  const [campaignTab, setCampaignTab] = useState<"all" | "draft" | "scheduled" | "sent">("all")
  const { data: campaigns, isLoading: campaignsLoading } = trpc.campaigns.getAll.useQuery()
  const { data: campaignStats } = trpc.campaigns.getStats.useQuery()

  // Automation state
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false)
  const { data: sequences, isLoading: sequencesLoading, refetch: refetchSequences } = trpc.automation.getAll.useQuery()
  const { data: automationStats, refetch: refetchAutomationStats } = trpc.automation.getStats.useQuery()
  const updateSequenceMutation = trpc.automation.update.useMutation()

  // Conversations state
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null)
  const [messageText, setMessageText] = useState("")
  
  // Stabilize query input to prevent infinite re-renders
  const conversationQueryInput = useMemo(() => ({ status: "open" as const }), [])
  const { data: conversations, isLoading: conversationsLoading } = trpc.conversations.getAll.useQuery(conversationQueryInput)
  const { data: conversationStats } = trpc.conversations.getStats.useQuery()
  
  // Stabilize selectedConversation query input
  const selectedConversationInput = useMemo(
    () => ({ id: selectedConversationId! }),
    [selectedConversationId]
  )
  const selectedConversation = trpc.conversations.getById.useQuery(
    selectedConversationInput,
    { enabled: selectedConversationId !== null }
  )
  const sendMessageMutation = trpc.conversations.sendMessage.useMutation({
    onSuccess: () => {
      setMessageText("")
      selectedConversation.refetch()
      toast.success("Message sent!")
    },
    onError: (error) => {
      toast.error(`Failed to send: ${error.message}`)
    },
  })
  const markAsReadMutation = trpc.conversations.markAsRead.useMutation()

  useEffect(() => {
    fetchStudents()
  }, [])

  const fetchStudents = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/students')
      if (response.ok) {
        const data = await response.json()
        setStudents(data)
        
        // Calculate stats
        const zipCodes = new Set(data.filter(s => s.zip_code).map(s => s.zip_code))
        setStats({
          total_students: data.length,
          zip_codes: zipCodes.size,
          avg_students_per_zip: zipCodes.size > 0 ? (data.filter(s => s.zip_code).length / zipCodes.size).toFixed(1) : 0
        })
      }
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  // Campaign helpers
  const filteredCampaigns = campaigns?.filter(campaign => {
    if (campaignTab === "all") return true
    return campaign.status === campaignTab
  })

  const getCampaignStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Draft</Badge>
      case "scheduled":
        return <Badge variant="default">Scheduled</Badge>
      case "sending":
        return <Badge variant="default" className="bg-blue-500">Sending</Badge>
      case "sent":
        return <Badge variant="default" className="bg-green-600">Sent</Badge>
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    return type === "sms" ? (
      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
        SMS
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        Email
      </Badge>
    )
  }

  // Automation helpers
  const handleToggleActive = (id: number, currentStatus: number) => {
    updateSequenceMutation.mutate({
      id,
      isActive: currentStatus === 1 ? false : true,
    })
  }

  const getTriggerLabel = (trigger: string) => {
    const labels: Record<string, string> = {
      new_lead: "New Lead",
      trial_scheduled: "Trial Scheduled",
      trial_completed: "Trial Completed",
      trial_no_show: "Trial No-Show",
      enrollment: "Enrollment",
      missed_class: "Missed Class",
      inactive_student: "Inactive Student",
      renewal_due: "Renewal Due",
      custom: "Custom",
    }
    return labels[trigger] || trigger
  }

  // Conversations helpers
  const handleSelectConversation = (id: number) => {
    setSelectedConversationId(id)
    markAsReadMutation.mutate({ conversationId: id })
  }

  const handleSendMessage = () => {
    if (!messageText.trim() || !selectedConversationId) return
    
    sendMessageMutation.mutate({
      conversationId: selectedConversationId,
      content: messageText,
      senderType: "staff",
    })
  }

  return (
    <BottomNavLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="px-2 md:px-0">
          <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-red-500 via-orange-500 to-red-600 bg-clip-text text-transparent">
            Marketing Hub
          </h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Analytics, campaigns, automation, and conversations in one place
          </p>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-4xl grid-cols-2 md:grid-cols-4 gap-1">
            <TabsTrigger value="overview" className="text-xs md:text-sm px-2 md:px-4">Overview</TabsTrigger>
            <TabsTrigger value="campaigns" className="text-xs md:text-sm px-2 md:px-4">Campaigns</TabsTrigger>
            <TabsTrigger value="automation" className="text-xs md:text-sm px-2 md:px-4">Automation</TabsTrigger>
            <TabsTrigger value="conversations" className="text-xs md:text-sm px-2 md:px-4">Conversations</TabsTrigger>
          </TabsList>

          {/* OVERVIEW TAB */}
          <TabsContent value="overview" className="space-y-6 mt-6">
            {/* Sub-tabs for Analytics sections */}
            <Tabs defaultValue="analytics" className="w-full">
              <TabsList className="inline-flex h-auto md:h-10 items-center justify-start rounded-md bg-muted p-1 text-muted-foreground w-full overflow-x-auto flex-wrap md:flex-nowrap gap-1">
                <TabsTrigger value="analytics" className="text-xs md:text-sm px-2 md:px-3 py-1.5 md:py-2 whitespace-nowrap">Analytics</TabsTrigger>
                <TabsTrigger value="campaign-builder" className="text-xs md:text-sm px-2 md:px-3 py-1.5 md:py-2 whitespace-nowrap">Builder</TabsTrigger>
                <TabsTrigger value="competitors" className="text-xs md:text-sm px-2 md:px-3 py-1.5 md:py-2 whitespace-nowrap">Competitors</TabsTrigger>
                <TabsTrigger value="demographics" className="text-xs md:text-sm px-2 md:px-3 py-1.5 md:py-2 whitespace-nowrap">Demographics</TabsTrigger>
                <TabsTrigger value="heatmap" className="text-xs md:text-sm px-2 md:px-3 py-1.5 md:py-2 whitespace-nowrap">Heatmap</TabsTrigger>
                <TabsTrigger value="automation" className="text-xs md:text-sm px-2 md:px-3 py-1.5 md:py-2 whitespace-nowrap">Automation</TabsTrigger>
              </TabsList>

              {/* Analytics Sub-Tab */}
              <TabsContent value="analytics" className="space-y-6 mt-6">
                {/* Kai Recommendations */}
                <KaiRecommendationsPanel />

                {/* Marketing Score */}
                <MarketingScoreCard />

                {/* Spend Efficiency Tracker */}
                <SpendEfficiencyTracker />

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Total Students</p>
                          <p className="text-2xl font-bold">{stats.total_students}</p>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <Users className="h-6 w-6 text-primary" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Zip Codes Covered</p>
                          <p className="text-2xl font-bold">{stats.zip_codes}</p>
                        </div>
                        <div className="p-3 bg-blue-500/10 rounded-lg">
                          <MapPin className="h-6 w-6 text-blue-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-border/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Avg Students/Zip</p>
                          <p className="text-2xl font-bold">{stats.avg_students_per_zip}</p>
                        </div>
                        <div className="p-3 bg-green-500/10 rounded-lg">
                          <TrendingUp className="h-6 w-6 text-green-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Marketing Insights */}
                <Card className="border-primary/20 bg-gradient-to-br from-background via-primary/5 to-background">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      Marketing Strategy Insights
                    </CardTitle>
                    <CardDescription>
                      Data-driven recommendations to grow your dojo
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-semibold text-sm mb-1">🎯 Target High-Value Areas</p>
                      <p className="text-sm text-muted-foreground">
                        Focus advertising on zip codes with high average income but low student count. 
                        These areas represent untapped market potential.
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-semibold text-sm mb-1">💬 Leverage Referrals</p>
                      <p className="text-sm text-muted-foreground">
                        In zip codes with high student concentration, implement referral programs. 
                        Existing students can bring in neighbors and friends.
                      </p>
                    </div>
                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="font-semibold text-sm mb-1">📍 Local Partnerships</p>
                      <p className="text-sm text-muted-foreground">
                        Partner with schools, community centers, and businesses in areas where you have students. 
                        Local presence builds trust and credibility.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Geographic Map */}
                {loading ? (
                  <Card>
                    <CardContent className="p-8 text-center">
                      <p className="text-muted-foreground">Loading map data...</p>
                    </CardContent>
                  </Card>
                ) : (
                  <StudentMap students={students} />
                )}
              </TabsContent>

              {/* Campaign Builder Sub-Tab */}
              <TabsContent value="campaign-builder" className="mt-6">
                <CampaignBuilder />
              </TabsContent>

              {/* Competitors Sub-Tab */}
              <TabsContent value="competitors" className="mt-6">
                <CompetitorMap />
              </TabsContent>

              {/* Ad Heatmap Sub-Tab */}
              <TabsContent value="heatmap" className="mt-6">
                <AdHeatmap />
              </TabsContent>

              {/* Demographics Sub-Tab */}
              <TabsContent value="demographics" className="mt-6">
                <DemographicsDeepDive zipCode={selectedZip} />
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Select ZIP Code</CardTitle>
                    <CardDescription>Choose a ZIP code to view detailed demographics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <select 
                      value={selectedZip} 
                      onChange={(e) => setSelectedZip(e.target.value)}
                      className="w-full p-2 border rounded"
                    >
                      <option value="77377">77377 - Tomball</option>
                      <option value="77429">77429 - Cypress</option>
                      <option value="77373">77373 - Spring</option>
                      <option value="77433">77433 - Cypress</option>
                      <option value="77070">77070 - Houston NW</option>
                      <option value="77389">77389 - Spring</option>
                      <option value="77450">77450 - Katy</option>
                      <option value="77380">77380 - The Woodlands</option>
                    </select>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Automation Sub-Tab */}
              <TabsContent value="automation" className="mt-6">
                <div className="space-y-6">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold">Automation Sequences</h2>
                      <p className="text-muted-foreground">Set up automated follow-up sequences triggered by events</p>
                    </div>
                    <Button
                      onClick={() => setShowTemplateLibrary(true)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      ✨ Template Library
                    </Button>
                  </div>

                  {/* Stats Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Active Sequences</p>
                            <p className="text-2xl font-bold">{automationStats?.active || 0}</p>
                          </div>
                          <Play className="h-6 w-6 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Enrollments</p>
                            <p className="text-2xl font-bold">{automationStats?.totalEnrollments || 0}</p>
                          </div>
                          <Users className="h-6 w-6 text-blue-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Messages Sent</p>
                            <p className="text-2xl font-bold">{automationStats?.messagesSent || 0}</p>
                          </div>
                          <Send className="h-6 w-6 text-purple-500" />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Completion Rate</p>
                            <p className="text-2xl font-bold">{automationStats?.completionRate || 0}%</p>
                          </div>
                          <CheckCircle2 className="h-6 w-6 text-green-500" />
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Sequences List */}
                  {sequencesLoading ? (
                    <Card>
                      <CardContent className="p-8 text-center">
                        <p className="text-muted-foreground">Loading sequences...</p>
                      </CardContent>
                    </Card>
                  ) : sequences && sequences.length > 0 ? (
                    <div className="grid gap-4">
                      {sequences.map((seq: any) => (
                        <Card key={seq.id} className="hover:shadow-lg transition-shadow">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <h3 className="text-lg font-semibold">{seq.name}</h3>
                                  <Badge variant={seq.is_active ? "default" : "secondary"}>
                                    {seq.is_active ? "Active" : "Paused"}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">{seq.description}</p>
                                <div className="flex items-center gap-4 text-sm">
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>Trigger: {seq.trigger_event}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                    <span>{seq._count?.enrollments || 0} enrolled</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={async () => {
                                    try {
                                      await updateSequenceMutation.mutateAsync({
                                        id: seq.id,
                                        is_active: !seq.is_active
                                      })
                                      refetchSequences()
                                      refetchAutomationStats()
                                      toast.success(seq.is_active ? "Sequence paused" : "Sequence activated")
                                    } catch (error: any) {
                                      toast.error(`Failed: ${error.message}`)
                                    }
                                  }}
                                >
                                  {seq.is_active ? (
                                    <><Pause className="h-4 w-4 mr-1" /> Pause</>
                                  ) : (
                                    <><Play className="h-4 w-4 mr-1" /> Activate</>
                                  )}
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => navigate(`/automation/${seq.id}`)}
                                >
                                  <Settings className="h-4 w-4 mr-1" />
                                  Edit
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <Card className="border-dashed">
                      <CardContent className="p-12 text-center">
                        <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Automation Sequences Yet</h3>
                        <p className="text-muted-foreground mb-4">
                          Get started with pre-built templates designed for martial arts schools
                        </p>
                        <Button
                          onClick={() => setShowTemplateLibrary(true)}
                          className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Browse Template Library
                        </Button>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* CAMPAIGNS TAB */}
          <TabsContent value="campaigns" className="mt-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Campaigns</h2>
                  <p className="text-muted-foreground">Send bulk SMS and Email campaigns to your audience</p>
                </div>
                <Button
                  onClick={() => navigate("/campaigns/create")}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Campaign
                </Button>
              </div>

              {/* Stats Cards */}
              {campaignStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Campaigns</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{campaignStats.total}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Recipients</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{campaignStats.totalRecipients}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Sent</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-500">{campaignStats.totalSent}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Delivered</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-500">{campaignStats.totalDelivered}</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Filter Tabs */}
              <div className="flex gap-2">
                {[
                  { key: "all", label: "All" },
                  { key: "draft", label: "Drafts" },
                  { key: "scheduled", label: "Scheduled" },
                  { key: "sent", label: "Sent" },
                ].map((tab) => (
                  <Button
                    key={tab.key}
                    variant={campaignTab === tab.key ? "default" : "ghost"}
                    onClick={() => setCampaignTab(tab.key as any)}
                  >
                    {tab.label}
                  </Button>
                ))}
              </div>

              {/* Campaigns List */}
              {campaignsLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading campaigns...</div>
              ) : filteredCampaigns && filteredCampaigns.length > 0 ? (
                <div className="space-y-4">
                  {filteredCampaigns.map((campaign) => (
                    <Card
                      key={campaign.id}
                      className="hover:border-primary/50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/campaigns/${campaign.id}`)}
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <CardTitle className="text-xl">{campaign.name}</CardTitle>
                              {getTypeBadge(campaign.type)}
                              {getCampaignStatusBadge(campaign.status)}
                            </div>
                            {campaign.subject && (
                              <CardDescription className="mb-2">
                                {campaign.subject}
                              </CardDescription>
                            )}
                            <CardDescription className="line-clamp-2">
                              {campaign.message}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{campaign.recipientCount} recipients</span>
                          </div>
                          
                          {campaign.sentCount > 0 && (
                            <div className="flex items-center gap-2 text-green-500">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>{campaign.sentCount} sent</span>
                            </div>
                          )}
                          
                          {campaign.failedCount > 0 && (
                            <div className="flex items-center gap-2 text-red-500">
                              <XCircle className="w-4 h-4" />
                              <span>{campaign.failedCount} failed</span>
                            </div>
                          )}
                          
                          {campaign.scheduledAt && (
                            <div className="flex items-center gap-2">
                              <Calendar className="w-4 h-4" />
                              <span>Scheduled for {format(new Date(campaign.scheduledAt), "MMM d, yyyy 'at' h:mm a")}</span>
                            </div>
                          )}
                          
                          {campaign.sentAt && (
                            <div className="flex items-center gap-2">
                              <Send className="w-4 h-4" />
                              <span>Sent {format(new Date(campaign.sentAt), "MMM d, yyyy 'at' h:mm a")}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <Send className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first campaign to start reaching your audience
                      </p>
                      <Button
                        onClick={() => navigate("/campaigns/create")}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Campaign
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* AUTOMATION TAB */}
          <TabsContent value="automation" className="mt-6">
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Automation Sequences</h2>
                  <p className="text-muted-foreground">Automated follow-up workflows triggered by events</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowTemplateLibrary(true)}
                    variant="outline"
                    className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Template Library
                  </Button>
                  <Button
                    onClick={() => navigate("/automation/create")}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Sequence
                  </Button>
                </div>
              </div>

              {/* Stats Cards */}
              {automationStats && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Sequences</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">{automationStats.totalSequences}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Active</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-green-500">{automationStats.activeSequences}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Enrollments</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-blue-500">{automationStats.totalEnrollments}</div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-purple-500">{automationStats.completedEnrollments}</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* Sequences List */}
              {sequencesLoading ? (
                <div className="text-center py-12 text-muted-foreground">Loading sequences...</div>
              ) : sequences && sequences.length > 0 ? (
                <div className="space-y-4">
                  {sequences.map((sequence) => (
                    <Card
                      key={sequence.id}
                      className="hover:border-primary/50 transition-colors"
                    >
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <CardTitle className="text-xl">{sequence.name}</CardTitle>
                              {sequence.isActive === 1 ? (
                                <Badge variant="default" className="bg-green-600">
                                  <Play className="w-3 h-3 mr-1" />
                                  Active
                                </Badge>
                              ) : (
                                <Badge variant="secondary">
                                  <Pause className="w-3 h-3 mr-1" />
                                  Paused
                                </Badge>
                              )}
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {getTriggerLabel(sequence.trigger)}
                              </Badge>
                            </div>
                            {sequence.description && (
                              <CardDescription>
                                {sequence.description}
                              </CardDescription>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleActive(sequence.id, sequence.isActive)}
                              disabled={updateSequenceMutation.isPending}
                            >
                              {sequence.isActive === 1 ? (
                                <>
                                  <Pause className="w-4 h-4 mr-2" />
                                  Pause
                                </>
                              ) : (
                                <>
                                  <Play className="w-4 h-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/automation/${sequence.id}`)}
                            >
                              <Settings className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-6 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            <span>{sequence.enrollmentCount || 0} enrolled</span>
                          </div>
                          <div className="flex items-center gap-2 text-green-500">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{sequence.completedCount || 0} completed</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <Play className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No automation sequences yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Create your first automation sequence to follow up with leads and students automatically
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button
                          onClick={() => setShowTemplateLibrary(true)}
                          variant="outline"
                          className="border-yellow-500 text-yellow-600 hover:bg-yellow-50"
                        >
                          <Sparkles className="w-4 h-4 mr-2" />
                          Browse Templates
                        </Button>
                        <Button
                          onClick={() => navigate("/automation/create")}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Create Sequence
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Template Library Modal */}
            <AutomationTemplateLibrary
              open={showTemplateLibrary}
              onClose={() => setShowTemplateLibrary(false)}
              onInstalled={() => {
                refetchSequences()
                refetchAutomationStats()
              }}
            />
          </TabsContent>

          {/* CONVERSATIONS TAB */}
          <TabsContent value="conversations" className="mt-6">
            <div className="flex h-[calc(100vh-16rem)] gap-4">
              {/* Sidebar - Conversations List */}
              <div className="w-96 border rounded-lg flex flex-col">
                <div className="p-4 border-b">
                  <h2 className="text-xl font-bold mb-1">Messages</h2>
                  <p className="text-sm text-muted-foreground">Two-way SMS conversations</p>
                </div>

                {/* Stats */}
                {conversationStats && (
                  <div className="p-3 border-b grid grid-cols-2 gap-2">
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Open</div>
                      <div className="text-xl font-bold text-green-500">{conversationStats.openConversations}</div>
                    </div>
                    <div className="bg-muted p-3 rounded-lg">
                      <div className="text-xs text-muted-foreground mb-1">Unread</div>
                      <div className="text-xl font-bold text-red-500">{conversationStats.unreadCount}</div>
                    </div>
                  </div>
                )}

                {/* Conversations List */}
                <div className="flex-1 overflow-y-auto">
                  {conversationsLoading ? (
                    <div className="p-6 text-center text-muted-foreground">Loading...</div>
                  ) : conversations && conversations.length > 0 ? (
                    <div className="divide-y">
                      {conversations.map((conversation) => (
                        <div
                          key={conversation.id}
                          onClick={() => handleSelectConversation(conversation.id)}
                          className={`p-4 cursor-pointer hover:bg-muted transition-colors ${
                            selectedConversationId === conversation.id ? "bg-muted" : ""
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center text-white">
                                <User className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="font-semibold">{conversation.participantName}</div>
                                <div className="text-xs text-muted-foreground">{conversation.participantPhone}</div>
                              </div>
                            </div>
                            {conversation.unreadCount > 0 && (
                              <Badge variant="destructive" className="bg-red-600">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground line-clamp-2 mb-1">
                            {conversation.lastMessagePreview || "No messages yet"}
                          </div>
                          {conversation.lastMessageAt && (
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(conversation.lastMessageAt), "MMM d, h:mm a")}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-6 text-center">
                      <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No conversations yet</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Main - Conversation Thread */}
              <div className="flex-1 border rounded-lg flex flex-col">
                {selectedConversationId && selectedConversation.data ? (
                  <>
                    {/* Thread Header */}
                    <div className="p-4 border-b">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center text-white">
                          <User className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">{selectedConversation.data.participantName}</h3>
                          <p className="text-sm text-muted-foreground">
                            {selectedConversation.data.participantPhone} • {selectedConversation.data.participantType}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      {selectedConversation.data.messages?.map((message: any) => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderType === "staff" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 ${
                              message.senderType === "staff"
                                ? "bg-red-600 text-white"
                                : "bg-muted"
                            }`}
                          >
                            <p className="text-sm">{message.content}</p>
                            <div className={`flex items-center gap-1 mt-1 text-xs ${
                              message.senderType === "staff" ? "text-red-100" : "text-muted-foreground"
                            }`}>
                              <Clock className="w-3 h-3" />
                              <span>{format(new Date(message.sentAt), "h:mm a")}</span>
                              {message.status === "delivered" && message.senderType === "staff" && (
                                <CheckCircle2 className="w-3 h-3 ml-1" />
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Message Input */}
                    <div className="p-4 border-t">
                      <div className="flex gap-2">
                        <Textarea
                          value={messageText}
                          onChange={(e) => setMessageText(e.target.value)}
                          placeholder="Type your message..."
                          className="flex-1 min-h-[60px] max-h-[120px]"
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault()
                              handleSendMessage()
                            }
                          }}
                        />
                        <Button
                          onClick={handleSendMessage}
                          disabled={!messageText.trim() || sendMessageMutation.isPending}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Send className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Select a conversation</h3>
                      <p className="text-muted-foreground">
                        Choose a conversation from the list to view messages
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </BottomNavLayout>
  )
}
