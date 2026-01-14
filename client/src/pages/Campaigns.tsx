import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Send, Calendar, Users, CheckCircle2, XCircle, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

export default function Campaigns() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<"all" | "draft" | "scheduled" | "sent">("all");
  
  const { data: campaigns, isLoading } = trpc.campaigns.getAll.useQuery();
  const { data: stats } = trpc.campaigns.getStats.useQuery();
  
  const filteredCampaigns = campaigns?.filter(campaign => {
    if (selectedTab === "all") return true;
    return campaign.status === selectedTab;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "scheduled":
        return <Badge variant="default">Scheduled</Badge>;
      case "sending":
        return <Badge variant="default" className="bg-blue-500">Sending</Badge>;
      case "sent":
        return <Badge variant="default" className="bg-green-600">Sent</Badge>;
      case "cancelled":
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    return type === "sms" ? (
      <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
        SMS
      </Badge>
    ) : (
      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
        Email
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold mb-2">Campaigns</h1>
            <p className="text-gray-400">Send bulk SMS and Email campaigns to your audience</p>
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
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Total Campaigns</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stats.total}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Recipients</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stats.totalRecipients}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Sent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">{stats.totalSent}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Delivered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-500">{stats.totalDelivered}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: "all", label: "All" },
            { key: "draft", label: "Drafts" },
            { key: "scheduled", label: "Scheduled" },
            { key: "sent", label: "Sent" },
          ].map((tab) => (
            <Button
              key={tab.key}
              variant={selectedTab === tab.key ? "default" : "ghost"}
              onClick={() => setSelectedTab(tab.key as any)}
              className={selectedTab === tab.key ? "bg-red-600 hover:bg-red-700" : "text-gray-400 hover:text-white"}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Campaigns List */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading campaigns...</div>
        ) : filteredCampaigns && filteredCampaigns.length > 0 ? (
          <div className="space-y-4">
            {filteredCampaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors cursor-pointer"
                onClick={() => navigate(`/campaigns/${campaign.id}`)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl text-white">{campaign.name}</CardTitle>
                        {getTypeBadge(campaign.type)}
                        {getStatusBadge(campaign.status)}
                      </div>
                      {campaign.subject && (
                        <CardDescription className="text-gray-400 mb-2">
                          {campaign.subject}
                        </CardDescription>
                      )}
                      <CardDescription className="text-gray-500 line-clamp-2">
                        {campaign.message}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6 text-sm text-gray-400">
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
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="py-12">
              <div className="text-center">
                <Send className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No campaigns yet</h3>
                <p className="text-gray-400 mb-4">
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
    </div>
  );
}
