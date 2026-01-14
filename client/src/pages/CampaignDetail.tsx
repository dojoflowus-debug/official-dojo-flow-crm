import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Send, Users, CheckCircle2, XCircle, Clock, Mail, MessageSquare } from "lucide-react";
import { useLocation, useParams } from "wouter";
import { format } from "date-fns";
import { toast } from "sonner";

export default function CampaignDetail() {
  const [, setLocation] = useLocation();
  const params = useParams();
  const campaignId = parseInt(params.id || "0");
  
  const { data: campaign, isLoading } = trpc.campaigns.getById.useQuery({ id: campaignId });
  const { data: recipients } = trpc.campaigns.getRecipients.useQuery({ campaignId });
  
  const sendMutation = trpc.campaigns.send.useMutation({
    onSuccess: (data) => {
      toast.success(`Campaign sent! ${data.sentCount} messages delivered, ${data.failedCount} failed`);
    },
    onError: (error) => {
      toast.error(`Failed to send campaign: ${error.message}`);
    },
  });

  const handleSend = () => {
    if (confirm("Are you sure you want to send this campaign now?")) {
      sendMutation.mutate({ id: campaignId });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12 text-gray-400">Loading campaign...</div>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-white mb-2">Campaign not found</h2>
            <Button onClick={() => setLocation("/campaigns")} className="bg-red-600 hover:bg-red-700 mt-4">
              Back to Campaigns
            </Button>
          </div>
        </div>
      </div>
    );
  }

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

  const deliveryRate = campaign.recipientCount > 0
    ? ((campaign.deliveredCount || 0) / campaign.recipientCount * 100).toFixed(1)
    : "0";

  const openRate = campaign.sentCount > 0
    ? ((campaign.openedCount || 0) / campaign.sentCount * 100).toFixed(1)
    : "0";

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/campaigns")}
            className="text-gray-400 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Campaigns
          </Button>
          
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-4xl font-bold">{campaign.name}</h1>
                {getStatusBadge(campaign.status)}
                <Badge variant="outline" className={campaign.type === "sms" ? "bg-purple-50 text-purple-700 border-purple-200" : "bg-blue-50 text-blue-700 border-blue-200"}>
                  {campaign.type.toUpperCase()}
                </Badge>
              </div>
              {campaign.subject && (
                <p className="text-gray-400 mb-2">{campaign.subject}</p>
              )}
              <p className="text-gray-500">{campaign.message}</p>
            </div>
            
            {campaign.status === "draft" && (
              <Button
                onClick={handleSend}
                disabled={sendMutation.isPending}
                className="bg-red-600 hover:bg-red-700"
              >
                <Send className="w-4 h-4 mr-2" />
                {sendMutation.isPending ? "Sending..." : "Send Now"}
              </Button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Users className="w-4 h-4" />
                Recipients
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{campaign.recipientCount}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Sent
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{campaign.sentCount || 0}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" />
                Delivered
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-500">{campaign.deliveredCount || 0}</div>
              <p className="text-sm text-gray-400 mt-1">{deliveryRate}% rate</p>
            </CardContent>
          </Card>
          
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Failed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">{campaign.failedCount || 0}</div>
            </CardContent>
          </Card>
        </div>

        {campaign.type === "email" && campaign.status === "sent" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Opened
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{campaign.openedCount || 0}</div>
                <p className="text-sm text-gray-400 mt-1">{openRate}% open rate</p>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Clicked
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{campaign.clickedCount || 0}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Timeline */}
        <Card className="bg-zinc-900 border-zinc-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Clock className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-white font-medium">Created</div>
                  <div className="text-sm text-gray-400">
                    {format(new Date(campaign.createdAt), "MMM d, yyyy 'at' h:mm a")}
                  </div>
                </div>
              </div>
              
              {campaign.scheduledAt && (
                <div className="flex items-center gap-4">
                  <Clock className="w-5 h-5 text-blue-500" />
                  <div>
                    <div className="text-white font-medium">Scheduled</div>
                    <div className="text-sm text-gray-400">
                      {format(new Date(campaign.scheduledAt), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                </div>
              )}
              
              {campaign.sentAt && (
                <div className="flex items-center gap-4">
                  <Send className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="text-white font-medium">Sent</div>
                    <div className="text-sm text-gray-400">
                      {format(new Date(campaign.sentAt), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                </div>
              )}
              
              {campaign.completedAt && (
                <div className="flex items-center gap-4">
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  <div>
                    <div className="text-white font-medium">Completed</div>
                    <div className="text-sm text-gray-400">
                      {format(new Date(campaign.completedAt), "MMM d, yyyy 'at' h:mm a")}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recipients List */}
        {recipients && recipients.length > 0 && (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-white">Recipients ({recipients.length})</CardTitle>
              <CardDescription className="text-gray-400">
                Delivery status for each recipient
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recipients.map((recipient) => (
                  <div
                    key={recipient.id}
                    className="flex items-center justify-between bg-zinc-800 p-3 rounded-lg"
                  >
                    <div className="flex-1">
                      <div className="text-white font-medium">{recipient.recipientName}</div>
                      <div className="text-sm text-gray-400">{recipient.recipientContact}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge
                        variant={
                          recipient.status === "delivered" ? "default" :
                          recipient.status === "failed" ? "destructive" :
                          "secondary"
                        }
                        className={
                          recipient.status === "delivered" ? "bg-green-600" :
                          recipient.status === "sent" ? "bg-blue-600" :
                          ""
                        }
                      >
                        {recipient.status}
                      </Badge>
                      {recipient.sentAt && (
                        <span className="text-sm text-gray-400">
                          {format(new Date(recipient.sentAt), "MMM d, h:mm a")}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
