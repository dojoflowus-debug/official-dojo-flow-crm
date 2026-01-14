import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Bell, Mail, MessageSquare, Clock, AlertCircle, TestTube } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export default function AlertSettings() {
  // Using sonner toast
  const { data: settings, isLoading, refetch } = trpc.merchandise.getAlertSettings.useQuery();
  const updateSettingsMutation = trpc.merchandise.updateAlertSettings.useMutation({
    onSuccess: () => {
      toast.success("Settings saved", {
        description: "Alert settings have been updated successfully.",
      });
      refetch();
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  const triggerTestMutation = trpc.merchandise.triggerStockAlertCheck.useMutation({
    onSuccess: (result) => {
      toast.success("Test completed", {
        description: `Checked ${result.checked} items. Created ${result.alertsCreated} alerts. Sent ${result.emailsSent} emails and ${result.smsSent} SMS.`,
      });
    },
    onError: (error) => {
      toast.error("Test failed", {
        description: error.message,
      });
    },
  });

  const [formData, setFormData] = useState({
    isEnabled: true,
    notifyEmail: true,
    notifySMS: false,
    checkIntervalMinutes: 360,
    recipientEmails: "",
    recipientPhones: "",
    alertCooldownHours: 24,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        isEnabled: settings.isEnabled === 1,
        notifyEmail: settings.notifyEmail === 1,
        notifySMS: settings.notifySMS === 1,
        checkIntervalMinutes: settings.checkIntervalMinutes,
        recipientEmails: settings.recipientEmails || "",
        recipientPhones: settings.recipientPhones || "",
        alertCooldownHours: settings.alertCooldownHours,
      });
    }
  }, [settings]);

  const handleSave = () => {
    updateSettingsMutation.mutate({
      isEnabled: formData.isEnabled ? 1 : 0,
      notifyEmail: formData.notifyEmail ? 1 : 0,
      notifySMS: formData.notifySMS ? 1 : 0,
      checkIntervalMinutes: formData.checkIntervalMinutes,
      recipientEmails: formData.recipientEmails || undefined,
      recipientPhones: formData.recipientPhones || undefined,
      alertCooldownHours: formData.alertCooldownHours,
    });
  };

  const handleTestAlert = () => {
    triggerTestMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Stock Alert Settings</h1>
          <p className="text-muted-foreground mb-8">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">Stock Alert Settings</h1>
          <p className="text-muted-foreground">
            Configure automatic notifications for low stock items
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alert System
            </CardTitle>
            <CardDescription>
              Enable or disable the automatic stock monitoring system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="isEnabled">Enable Stock Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Automatically check inventory levels and send notifications
                </p>
              </div>
              <Switch
                id="isEnabled"
                checked={formData.isEnabled}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isEnabled: checked })
                }
              />
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <Label>Check Interval</Label>
              </div>
              <Select
                value={formData.checkIntervalMinutes.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, checkIntervalMinutes: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="60">Every hour</SelectItem>
                  <SelectItem value="180">Every 3 hours</SelectItem>
                  <SelectItem value="360">Every 6 hours</SelectItem>
                  <SelectItem value="720">Every 12 hours</SelectItem>
                  <SelectItem value="1440">Once daily</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                How often the system should check for low stock items
              </p>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <Label>Alert Cooldown</Label>
              </div>
              <Select
                value={formData.alertCooldownHours.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, alertCooldownHours: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">6 hours</SelectItem>
                  <SelectItem value="12">12 hours</SelectItem>
                  <SelectItem value="24">24 hours</SelectItem>
                  <SelectItem value="48">48 hours</SelectItem>
                  <SelectItem value="168">1 week</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Minimum time between repeat alerts for the same item
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Email Notifications
            </CardTitle>
            <CardDescription>
              Send email alerts when stock falls below threshold
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifyEmail">Enable Email Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Send notifications via email
                </p>
              </div>
              <Switch
                id="notifyEmail"
                checked={formData.notifyEmail}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, notifyEmail: checked })
                }
              />
            </div>

            {formData.notifyEmail && (
              <div className="space-y-2">
                <Label htmlFor="recipientEmails">Recipient Email Addresses</Label>
                <Input
                  id="recipientEmails"
                  type="text"
                  placeholder="email1@example.com, email2@example.com"
                  value={formData.recipientEmails}
                  onChange={(e) =>
                    setFormData({ ...formData, recipientEmails: e.target.value })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Comma-separated list of email addresses to notify
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              SMS Notifications
            </CardTitle>
            <CardDescription>
              Send text message alerts when stock falls below threshold
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="notifySMS">Enable SMS Alerts</Label>
                <p className="text-sm text-muted-foreground">
                  Send notifications via text message
                </p>
              </div>
              <Switch
                id="notifySMS"
                checked={formData.notifySMS}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, notifySMS: checked })
                }
              />
            </div>

            {formData.notifySMS && (
              <div className="space-y-2">
                <Label htmlFor="recipientPhones">Recipient Phone Numbers</Label>
                <Input
                  id="recipientPhones"
                  type="text"
                  placeholder="+1234567890, +0987654321"
                  value={formData.recipientPhones}
                  onChange={(e) =>
                    setFormData({ ...formData, recipientPhones: e.target.value })
                  }
                />
                <p className="text-sm text-muted-foreground">
                  Comma-separated list of phone numbers (include country code)
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Testing
            </CardTitle>
            <CardDescription>
              Manually trigger a stock check to test your configuration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={handleTestAlert}
              disabled={triggerTestMutation.isPending}
            >
              {triggerTestMutation.isPending ? "Running..." : "Run Test Check"}
            </Button>
            <p className="text-sm text-muted-foreground mt-2">
              This will immediately check all items and send notifications if any are below threshold
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            Reset
          </Button>
          <Button
            onClick={handleSave}
            disabled={updateSettingsMutation.isPending}
          >
            {updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
