import { useState } from "react";
import {
  Settings,
  Bell,
  Shield,
  Database,
  Globe,
  Mail,
  Key,
  Users,
  Palette,
  Save,
  RefreshCw,
} from "lucide-react";
import { MasterDashboardLayout } from "@/components/MasterDashboardLayout";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

export default function MasterSettings() {
  const [activeTab, setActiveTab] = useState("general");

  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <MasterDashboardLayout
      title="System Settings"
      subtitle="Configure platform-wide settings and preferences"
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Settings Navigation */}
        <div className="md-glass-card p-4">
          <nav className="space-y-1">
            {[
              { id: "general", label: "General", icon: Settings },
              { id: "notifications", label: "Notifications", icon: Bell },
              { id: "security", label: "Security", icon: Shield },
              { id: "database", label: "Database", icon: Database },
              { id: "integrations", label: "Integrations", icon: Globe },
              { id: "email", label: "Email", icon: Mail },
              { id: "api", label: "API Keys", icon: Key },
              { id: "team", label: "Team", icon: Users },
              { id: "appearance", label: "Appearance", icon: Palette },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all",
                    activeTab === item.id
                      ? "bg-red-500/20 text-red-400"
                      : "text-white/60 hover:text-white hover:bg-white/5"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Settings Content */}
        <div className="lg:col-span-3 md-glass-card p-6">
          {activeTab === "general" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">General Settings</h3>
                <p className="text-sm text-white/50 mb-6">
                  Configure basic platform settings and preferences.
                </p>
              </div>

              <div className="space-y-4">
                <div className="grid gap-2">
                  <Label className="text-white/70">Platform Name</Label>
                  <Input
                    defaultValue="DojoFlow"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-white/70">Support Email</Label>
                  <Input
                    defaultValue="support@dojoflow.com"
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div className="grid gap-2">
                  <Label className="text-white/70">Default Timezone</Label>
                  <Select defaultValue="america_los_angeles">
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1d] border-white/10">
                      <SelectItem value="america_los_angeles" className="text-white">
                        America/Los_Angeles (PST)
                      </SelectItem>
                      <SelectItem value="america_new_york" className="text-white">
                        America/New_York (EST)
                      </SelectItem>
                      <SelectItem value="utc" className="text-white">
                        UTC
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div>
                    <p className="text-white font-medium">Maintenance Mode</p>
                    <p className="text-sm text-white/50">
                      Temporarily disable access for non-admin users
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Notification Settings</h3>
                <p className="text-sm text-white/50 mb-6">
                  Configure how and when you receive notifications.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { label: "New school signups", description: "Get notified when a new school joins" },
                  { label: "Failed payments", description: "Alert when a payment fails" },
                  { label: "Support tickets", description: "New high-priority support tickets" },
                  { label: "System alerts", description: "Critical system notifications" },
                  { label: "Weekly reports", description: "Receive weekly performance summaries" },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 rounded-xl bg-white/5"
                  >
                    <div>
                      <p className="text-white font-medium">{item.label}</p>
                      <p className="text-sm text-white/50">{item.description}</p>
                    </div>
                    <Switch defaultChecked={i < 3} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Security Settings</h3>
                <p className="text-sm text-white/50 mb-6">
                  Manage security and access control settings.
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div>
                    <p className="text-white font-medium">Two-Factor Authentication</p>
                    <p className="text-sm text-white/50">
                      Require 2FA for all admin accounts
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div>
                    <p className="text-white font-medium">Session Timeout</p>
                    <p className="text-sm text-white/50">
                      Auto-logout after inactivity
                    </p>
                  </div>
                  <Select defaultValue="30">
                    <SelectTrigger className="w-32 bg-white/5 border-white/10 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a1a1d] border-white/10">
                      <SelectItem value="15" className="text-white">15 minutes</SelectItem>
                      <SelectItem value="30" className="text-white">30 minutes</SelectItem>
                      <SelectItem value="60" className="text-white">1 hour</SelectItem>
                      <SelectItem value="never" className="text-white">Never</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
                  <div>
                    <p className="text-white font-medium">IP Whitelist</p>
                    <p className="text-sm text-white/50">
                      Restrict admin access to specific IPs
                    </p>
                  </div>
                  <Switch />
                </div>
              </div>
            </div>
          )}

          {activeTab === "database" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">Database Settings</h3>
                <p className="text-sm text-white/50 mb-6">
                  Monitor and manage database operations.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-sm text-white/50">Database Size</p>
                  <p className="text-2xl font-bold text-white">2.4 GB</p>
                </div>
                <div className="p-4 rounded-xl bg-white/5">
                  <p className="text-sm text-white/50">Total Records</p>
                  <p className="text-2xl font-bold text-white">1.2M</p>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  <RefreshCw className="w-4 h-4 mr-3" />
                  Run Database Optimization
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start bg-white/5 border-white/10 text-white hover:bg-white/10"
                >
                  <Database className="w-4 h-4 mr-3" />
                  Create Backup
                </Button>
              </div>
            </div>
          )}

          {/* Default content for other tabs */}
          {!["general", "notifications", "security", "database"].includes(activeTab) && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Settings className="w-8 h-8 text-white/30" />
              </div>
              <h3 className="text-lg font-medium text-white mb-2">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Settings
              </h3>
              <p className="text-white/50 max-w-sm">
                This settings section is coming soon. Configure {activeTab} options here.
              </p>
            </div>
          )}

          {/* Save Button */}
          <div className="flex justify-end pt-6 mt-6 border-t border-white/10">
            <Button
              onClick={handleSave}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </MasterDashboardLayout>
  );
}
