import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Play, Pause, Users, CheckCircle2, Settings, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AutomationTemplateLibrary from "@/components/AutomationTemplateLibrary";
import SimpleLayout from "@/components/SimpleLayout";

export default function Automation() {
  const navigate = useNavigate();
  const [showTemplateLibrary, setShowTemplateLibrary] = useState(false);
  
  const { data: sequences, isLoading, refetch } = trpc.automation.getAll.useQuery();
  const { data: stats, refetch: refetchStats } = trpc.automation.getStats.useQuery();
  
  const updateMutation = trpc.automation.update.useMutation({
    onSuccess: () => {
      // Refetch sequences after update
    },
  });

  const handleToggleActive = (id: number, currentStatus: number) => {
    updateMutation.mutate({
      id,
      isActive: currentStatus === 1 ? false : true,
    });
  };

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
    };
    return labels[trigger] || trigger;
  };

  return (
    <SimpleLayout>
      <div className="min-h-screen bg-black text-white p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">Automation Sequences</h1>
              <p className="text-gray-400">Automated follow-up workflows triggered by events</p>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => setShowTemplateLibrary(true)}
                variant="outline"
                className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Template Library
              </Button>
              <Button
                onClick={() => navigate("/automation/create")}
                className="bg-red-600 hover:bg-red-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Custom
              </Button>
            </div>
          </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Total Sequences</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stats.totalSequences}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Active</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">{stats.activeSequences}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Enrollments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-500">{stats.totalEnrollments}</div>
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-500">{stats.completedEnrollments}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Sequences List */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Loading sequences...</div>
        ) : sequences && sequences.length > 0 ? (
          <div className="space-y-4">
            {sequences.map((sequence) => (
              <Card
                key={sequence.id}
                className="bg-zinc-900 border-zinc-800 hover:border-zinc-700 transition-colors"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-xl text-white">{sequence.name}</CardTitle>
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
                        <CardDescription className="text-gray-400">
                          {sequence.description}
                        </CardDescription>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(sequence.id, sequence.isActive)}
                        disabled={updateMutation.isPending}
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
                  <div className="flex items-center gap-6 text-sm text-gray-400">
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
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="py-12">
              <div className="text-center">
                <Play className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">No automation sequences yet</h3>
                <p className="text-gray-400 mb-4">
                  Create your first automation sequence to follow up with leads and students automatically
                </p>
                <div className="flex gap-3 justify-center">
                  <Button
                    onClick={() => setShowTemplateLibrary(true)}
                    variant="outline"
                    className="border-yellow-500 text-yellow-500 hover:bg-yellow-500 hover:text-black"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Browse Templates
                  </Button>
                  <Button
                    onClick={() => navigate("/automation/create")}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Custom
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Template Library Modal */}
        <AutomationTemplateLibrary
          open={showTemplateLibrary}
          onClose={() => setShowTemplateLibrary(false)}
          onInstalled={() => {
            refetch();
            refetchStats();
          }}
        />
        </div>
      </div>
    </SimpleLayout>
  );
}
