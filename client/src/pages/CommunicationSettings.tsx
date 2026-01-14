import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Mail, Bell, Save, TestTube2 } from "lucide-react";
import { toast } from "sonner";

export default function CommunicationSettings() {
  const [loading, setLoading] = useState(false);
  
  // SMS Settings
  const [twilioSid, setTwilioSid] = useState("");
  const [twilioToken, setTwilioToken] = useState("");
  const [twilioPhone, setTwilioPhone] = useState("");
  const [smsEnabled, setSmsEnabled] = useState(false);
  
  // Email Settings
  const [emailProvider, setEmailProvider] = useState<"sendgrid" | "smtp">("sendgrid");
  const [senderEmail, setSenderEmail] = useState("");
  const [sendgridKey, setSendgridKey] = useState("");
  const [emailEnabled, setEmailEnabled] = useState(false);
  
  // Staff Notification Settings
  const [notifyStaff, setNotifyStaff] = useState(true);
  const [staffMethod, setStaffMethod] = useState<"sms" | "email" | "both">("both");
  const [staffPhone, setStaffPhone] = useState("");
  const [staffEmail, setStaffEmail] = useState("");
  
  // Lead Automation Settings
  const [autoSendSms, setAutoSendSms] = useState(true);
  const [autoSendEmail, setAutoSendEmail] = useState(true);
  const [bookingLink, setBookingLink] = useState("");
  
  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Implement save via tRPC
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };
  
  const handleTestSms = async () => {
    toast.info("Sending test SMS...");
    // TODO: Implement test SMS
  };
  
  const handleTestEmail = async () => {
    toast.info("Sending test email...");
    // TODO: Implement test email
  };
  
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Communication Settings</h1>
          <p className="text-gray-400">Configure how Kai communicates with leads and staff</p>
        </div>
        
        <Tabs defaultValue="sms" className="space-y-6">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="sms" className="data-[state=active]:bg-red-600">
              <MessageSquare className="w-4 h-4 mr-2" />
              SMS Settings
            </TabsTrigger>
            <TabsTrigger value="email" className="data-[state=active]:bg-red-600">
              <Mail className="w-4 h-4 mr-2" />
              Email Settings
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-red-600">
              <Bell className="w-4 h-4 mr-2" />
              Staff Notifications
            </TabsTrigger>
          </TabsList>
          
          {/* SMS Settings Tab */}
          <TabsContent value="sms" className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">SMS Messaging Setup (Twilio)</CardTitle>
                <CardDescription>
                  Connect your Twilio account to allow Kai to send automated text messages to leads, members, and staff.
                  SMS is the fastest method of converting new leads.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="twilio-sid">Twilio Account SID</Label>
                  <Input
                    id="twilio-sid"
                    type="text"
                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={twilioSid}
                    onChange={(e) => setTwilioSid(e.target.value)}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="twilio-token">Twilio Auth Token</Label>
                  <Input
                    id="twilio-token"
                    type="password"
                    placeholder="••••••••••••••••••••••••••••••••"
                    value={twilioToken}
                    onChange={(e) => setTwilioToken(e.target.value)}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="twilio-phone">Twilio Phone Number (From Number)</Label>
                  <Input
                    id="twilio-phone"
                    type="tel"
                    placeholder="+1234567890"
                    value={twilioPhone}
                    onChange={(e) => setTwilioPhone(e.target.value)}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  <div className="space-y-0.5">
                    <Label htmlFor="sms-enabled">Enable SMS for Leads</Label>
                    <p className="text-sm text-gray-400">Automatically send SMS to new leads</p>
                  </div>
                  <Switch
                    id="sms-enabled"
                    checked={smsEnabled}
                    onCheckedChange={setSmsEnabled}
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleTestSms} variant="outline" className="border-zinc-700">
                    <TestTube2 className="w-4 h-4 mr-2" />
                    Send Test SMS to Myself
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Email Settings Tab */}
          <TabsContent value="email" className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Email Setup</CardTitle>
                <CardDescription>
                  Connect your email provider so Kai can send automated welcome emails, reminders, and member communication.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email-provider">Email Provider</Label>
                  <Select value={emailProvider} onValueChange={(v: any) => setEmailProvider(v)}>
                    <SelectTrigger className="bg-zinc-800 border-zinc-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sendgrid">SendGrid</SelectItem>
                      <SelectItem value="smtp">SMTP (Coming Soon)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="sender-email">Sender Email (From Address)</Label>
                  <Input
                    id="sender-email"
                    type="email"
                    placeholder="kai@yourdojo.com"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                
                {emailProvider === "sendgrid" && (
                  <div className="space-y-2">
                    <Label htmlFor="sendgrid-key">SendGrid API Key</Label>
                    <Input
                      id="sendgrid-key"
                      type="password"
                      placeholder="SG.••••••••••••••••••••••••••••••••"
                      value={sendgridKey}
                      onChange={(e) => setSendgridKey(e.target.value)}
                      className="bg-zinc-800 border-zinc-700"
                    />
                  </div>
                )}
                
                <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                  <div className="space-y-0.5">
                    <Label htmlFor="email-enabled">Enable Email for Leads</Label>
                    <p className="text-sm text-gray-400">Automatically send welcome emails to new leads</p>
                  </div>
                  <Switch
                    id="email-enabled"
                    checked={emailEnabled}
                    onCheckedChange={setEmailEnabled}
                  />
                </div>
                
                <div className="flex gap-2 pt-4">
                  <Button onClick={handleTestEmail} variant="outline" className="border-zinc-700">
                    <TestTube2 className="w-4 h-4 mr-2" />
                    Send Test Email to Myself
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Staff Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Staff Notifications</CardTitle>
                <CardDescription>
                  Choose how each team member receives notifications for new leads and important updates.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                  <div className="space-y-0.5">
                    <Label htmlFor="notify-staff">New Lead Alerts</Label>
                    <p className="text-sm text-gray-400">Notify staff when new leads arrive</p>
                  </div>
                  <Switch
                    id="notify-staff"
                    checked={notifyStaff}
                    onCheckedChange={setNotifyStaff}
                  />
                </div>
                
                {notifyStaff && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="staff-method">Notification Method</Label>
                      <Select value={staffMethod} onValueChange={(v: any) => setStaffMethod(v)}>
                        <SelectTrigger className="bg-zinc-800 border-zinc-700">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sms">SMS Only</SelectItem>
                          <SelectItem value="email">Email Only</SelectItem>
                          <SelectItem value="both">Both SMS & Email</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {(staffMethod === "sms" || staffMethod === "both") && (
                      <div className="space-y-2">
                        <Label htmlFor="staff-phone">Staff Phone Number</Label>
                        <Input
                          id="staff-phone"
                          type="tel"
                          placeholder="+1234567890"
                          value={staffPhone}
                          onChange={(e) => setStaffPhone(e.target.value)}
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>
                    )}
                    
                    {(staffMethod === "email" || staffMethod === "both") && (
                      <div className="space-y-2">
                        <Label htmlFor="staff-email">Staff Email Address</Label>
                        <Input
                          id="staff-email"
                          type="email"
                          placeholder="owner@yourdojo.com"
                          value={staffEmail}
                          onChange={(e) => setStaffEmail(e.target.value)}
                          className="bg-zinc-800 border-zinc-700"
                        />
                      </div>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
            
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Lead Automations</CardTitle>
                <CardDescription>
                  Customize how Kai responds to new leads and moves them through your pipeline.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-sms">Auto-send SMS to New Lead</Label>
                    <p className="text-sm text-gray-400">Send welcome SMS automatically</p>
                  </div>
                  <Switch
                    id="auto-sms"
                    checked={autoSendSms}
                    onCheckedChange={setAutoSendSms}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-email">Auto-send Welcome Email</Label>
                    <p className="text-sm text-gray-400">Send welcome email automatically</p>
                  </div>
                  <Switch
                    id="auto-email"
                    checked={autoSendEmail}
                    onCheckedChange={setAutoSendEmail}
                  />
                </div>
                
                <div className="space-y-2 pt-4 border-t border-zinc-800">
                  <Label htmlFor="booking-link">Booking Link</Label>
                  <Input
                    id="booking-link"
                    type="url"
                    placeholder="https://yourdojo.com/book"
                    value={bookingLink}
                    onChange={(e) => setBookingLink(e.target.value)}
                    className="bg-zinc-800 border-zinc-700"
                  />
                  <p className="text-sm text-gray-400">This link will be included in SMS and email messages to leads</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {loading ? "Saving..." : "Save All Settings"}
          </Button>
        </div>
      </div>
    </div>
  );
}
