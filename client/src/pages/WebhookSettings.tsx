import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Copy, RefreshCw, Code, Globe, TestTube2, CheckCircle2,
  XCircle, Loader2, Zap, Link2, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function WebhookSettings() {
  const [testStatus, setTestStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [testResult, setTestResult] = useState<string>("");
  const [isRegenerating, setIsRegenerating] = useState(false);

  const baseUrl = window.location.origin;
  const webhookUrl = `${baseUrl}/api/webhooks/mydojo/lead`;
  const appointmentWebhookUrl = `${baseUrl}/api/webhooks/mydojo`;

  // Fetch the widget API key (used as the MyDojo webhook auth key)
  const { data: widgetKeyData, isLoading: keyLoading, refetch: refetchKey } =
    trpc.settings.getWidgetKey.useQuery(undefined, { retry: false });

  const regenerateKeyMutation = trpc.settings.regenerateWidgetKey.useMutation({
    onSuccess: () => {
      refetchKey();
      toast.success("API key regenerated successfully");
      setIsRegenerating(false);
    },
    onError: (err) => {
      toast.error(err.message || "Failed to regenerate key");
      setIsRegenerating(false);
    },
  });

  const apiKey = widgetKeyData?.widgetApiKey || "";

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const handleRegenerateKey = () => {
    if (!confirm("Regenerate API key? Your existing MyDojo integration will need to be updated with the new key.")) return;
    setIsRegenerating(true);
    regenerateKeyMutation.mutate();
  };

  const handleTestWebhook = async () => {
    if (!apiKey) {
      toast.error("No API key found. Please generate one first.");
      return;
    }
    setTestStatus("loading");
    setTestResult("");
    try {
      const response = await fetch("/api/webhooks/mydojo/lead", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify({
          firstName: "Test",
          lastName: "Lead",
          email: `test-${Date.now()}@mydojo-test.com`,
          phone: "5551234567",
          source: "MyDojo Website (Test)",
          program: "Martial Arts",
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setTestStatus("success");
        setTestResult(`✓ Lead created successfully (ID: ${data.lead_id})`);
        toast.success("Test lead created in your pipeline!");
      } else {
        setTestStatus("error");
        setTestResult(data.error || "Unknown error");
        toast.error("Test failed: " + (data.error || "Unknown error"));
      }
    } catch (err: any) {
      setTestStatus("error");
      setTestResult(err.message || "Network error");
      toast.error("Test failed: " + err.message);
    }
  };

  const htmlFormSnippet = `<!-- MyDojo Lead Form — paste on your landing page -->
<form id="dojo-lead-form">
  <input type="text" name="firstName" placeholder="First Name" required />
  <input type="text" name="lastName" placeholder="Last Name" />
  <input type="email" name="email" placeholder="Email" required />
  <input type="tel" name="phone" placeholder="Phone" />
  <select name="program">
    <option value="">Select Program</option>
    <option value="Martial Arts">Martial Arts</option>
    <option value="Kids Karate">Kids Karate</option>
    <option value="Adult BJJ">Adult BJJ</option>
  </select>
  <button type="submit">Book Free Intro</button>
</form>

<script>
document.getElementById('dojo-lead-form').addEventListener('submit', async function(e) {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(this));
  data.source = 'MyDojo Website';
  const res = await fetch('${webhookUrl}', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': '${apiKey || "YOUR_API_KEY_HERE"}'
    },
    body: JSON.stringify(data)
  });
  const result = await res.json();
  if (result.success) {
    alert('Thanks! We will contact you shortly.');
    this.reset();
  }
});
</script>`;

  const fetchSnippet = `// JavaScript — send a lead from any page
async function sendLeadToDojoFlow(leadData) {
  const response = await fetch('${webhookUrl}', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': '${apiKey || "YOUR_API_KEY_HERE"}'
    },
    body: JSON.stringify({
      firstName: leadData.firstName,
      lastName: leadData.lastName,
      email: leadData.email,
      phone: leadData.phone,
      program: leadData.program,
      source: 'MyDojo Website'
    })
  });
  return response.json();
}`;

  const zapierSnippet = `// Zapier Webhook Action (or Make.com HTTP Module)
// URL: ${webhookUrl}
// Method: POST
// Headers:
//   Content-Type: application/json
//   x-api-key: ${apiKey || "YOUR_API_KEY_HERE"}
// Body (JSON):
{
  "firstName": "{{First Name}}",
  "lastName": "{{Last Name}}",
  "email": "{{Email}}",
  "phone": "{{Phone}}",
  "program": "{{Program}}",
  "source": "MyDojo Website"
}`;

  return (
    <div className="min-h-full bg-black text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">MyDojo Lead Sync</h1>
            <p className="text-gray-400">
              Automatically capture leads from your MyDojo website and landing pages into DojoFlow's pipeline.
            </p>
          </div>
          <Badge className="bg-green-600 text-white flex items-center gap-1.5 px-3 py-1.5">
            <Zap className="w-3.5 h-3.5" />
            Live
          </Badge>
        </div>

        <Tabs defaultValue="setup" className="space-y-6">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="setup" className="data-[state=active]:bg-red-600">
              <Link2 className="w-4 h-4 mr-2" />
              Setup & Keys
            </TabsTrigger>
            <TabsTrigger value="code" className="data-[state=active]:bg-red-600">
              <Code className="w-4 h-4 mr-2" />
              Code Snippets
            </TabsTrigger>
            <TabsTrigger value="test" className="data-[state=active]:bg-red-600">
              <TestTube2 className="w-4 h-4 mr-2" />
              Test Connection
            </TabsTrigger>
          </TabsList>

          {/* Setup Tab */}
          <TabsContent value="setup" className="space-y-5">
            {/* Step 1: Webhook URL */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Globe className="w-5 h-5 text-red-500" />
                  Step 1 — Webhook Endpoint URL
                </CardTitle>
                <CardDescription>
                  Use this URL in your MyDojo form, landing page, or Zapier/Make.com automation.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Lead Form Submissions (recommended)</p>
                  <div className="flex gap-2">
                    <Input
                      value={webhookUrl}
                      readOnly
                      className="bg-zinc-800 border-zinc-700 font-mono text-sm text-green-400"
                    />
                    <Button
                      onClick={() => handleCopy(webhookUrl, "Webhook URL")}
                      variant="outline"
                      size="sm"
                      className="border-zinc-700 shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Intro Appointment Events</p>
                  <div className="flex gap-2">
                    <Input
                      value={appointmentWebhookUrl}
                      readOnly
                      className="bg-zinc-800 border-zinc-700 font-mono text-sm text-blue-400"
                    />
                    <Button
                      onClick={() => handleCopy(appointmentWebhookUrl, "Appointment URL")}
                      variant="outline"
                      size="sm"
                      className="border-zinc-700 shrink-0"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="bg-zinc-800 rounded-lg p-3 text-sm text-gray-400">
                  <span className="text-green-400 font-mono font-semibold">POST</span>
                  {" "}· Content-Type: <span className="font-mono text-gray-300">application/json</span>
                </div>
              </CardContent>
            </Card>

            {/* Step 2: API Key */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-500" />
                  Step 2 — Your API Key
                </CardTitle>
                <CardDescription>
                  Include this key in every request as the <code className="text-yellow-400">x-api-key</code> header.
                  DojoFlow uses it to authenticate requests and route leads to your account.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {keyLoading ? (
                  <div className="flex items-center gap-2 text-gray-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Loading API key...
                  </div>
                ) : apiKey ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={apiKey}
                        readOnly
                        className="bg-zinc-800 border-zinc-700 font-mono text-sm text-yellow-400"
                      />
                      <Button
                        onClick={() => handleCopy(apiKey, "API Key")}
                        variant="outline"
                        size="sm"
                        className="border-zinc-700 shrink-0"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button
                      onClick={handleRegenerateKey}
                      variant="outline"
                      size="sm"
                      className="border-zinc-700 text-gray-400"
                      disabled={isRegenerating}
                    >
                      {isRegenerating ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Regenerate Key
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-400">No API key generated yet.</p>
                    <Button
                      onClick={handleRegenerateKey}
                      className="bg-red-600 hover:bg-red-700"
                      disabled={isRegenerating}
                    >
                      {isRegenerating ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                      )}
                      Generate API Key
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 3: Payload Fields */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Step 3 — Required Payload Fields</CardTitle>
                <CardDescription>
                  Send these fields in the JSON body of your POST request.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-zinc-700">
                        <th className="text-left py-2 pr-4 text-gray-400 font-medium">Field</th>
                        <th className="text-left py-2 pr-4 text-gray-400 font-medium">Required</th>
                        <th className="text-left py-2 text-gray-400 font-medium">Description</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                      {[
                        { field: "firstName", req: "Yes", desc: "Lead's first name" },
                        { field: "lastName", req: "No", desc: "Lead's last name" },
                        { field: "name", req: "Alt", desc: "Full name (used if firstName not provided)" },
                        { field: "email", req: "Yes*", desc: "Email address (*required if no phone)" },
                        { field: "phone", req: "Yes*", desc: "Phone number (*required if no email)" },
                        { field: "program", req: "No", desc: "Interested program (e.g. 'Kids Karate')" },
                        { field: "source", req: "No", desc: "Lead source label (default: 'MyDojo Website')" },
                        { field: "notes", req: "No", desc: "Additional notes or message from the form" },
                      ].map(({ field, req, desc }) => (
                        <tr key={field}>
                          <td className="py-2 pr-4 font-mono text-green-400">{field}</td>
                          <td className="py-2 pr-4">
                            <Badge
                              variant="outline"
                              className={req.startsWith("Yes") ? "border-red-600 text-red-400" : "border-zinc-600 text-gray-400"}
                            >
                              {req}
                            </Badge>
                          </td>
                          <td className="py-2 text-gray-400">{desc}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Code Snippets Tab */}
          <TabsContent value="code" className="space-y-5">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">HTML Form + JavaScript</CardTitle>
                <CardDescription>Paste this into any HTML page on your MyDojo website.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="bg-zinc-950 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed max-h-80 overflow-y-auto">
                    {htmlFormSnippet}
                  </pre>
                  <Button
                    onClick={() => handleCopy(htmlFormSnippet, "HTML snippet")}
                    variant="outline"
                    size="sm"
                    className="absolute top-3 right-3 border-zinc-700 bg-zinc-900"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">JavaScript Fetch</CardTitle>
                <CardDescription>Use this in React, Vue, or any JavaScript framework.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="bg-zinc-950 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                    {fetchSnippet}
                  </pre>
                  <Button
                    onClick={() => handleCopy(fetchSnippet, "Fetch snippet")}
                    variant="outline"
                    size="sm"
                    className="absolute top-3 right-3 border-zinc-700 bg-zinc-900"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Zapier / Make.com</CardTitle>
                <CardDescription>Configure a Webhook action in Zapier or an HTTP module in Make.com.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <pre className="bg-zinc-950 rounded-lg p-4 text-xs text-gray-300 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
                    {zapierSnippet}
                  </pre>
                  <Button
                    onClick={() => handleCopy(zapierSnippet, "Zapier snippet")}
                    variant="outline"
                    size="sm"
                    className="absolute top-3 right-3 border-zinc-700 bg-zinc-900"
                  >
                    <Copy className="w-3.5 h-3.5 mr-1.5" />
                    Copy
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Test Tab */}
          <TabsContent value="test" className="space-y-5">
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <TestTube2 className="w-5 h-5 text-blue-400" />
                  Live Connection Test
                </CardTitle>
                <CardDescription>
                  Send a test lead to verify the webhook is working end-to-end. A test lead will appear in your pipeline.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {!apiKey && !keyLoading && (
                  <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-400/10 rounded-lg p-3">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Generate an API key in the Setup tab first.
                  </div>
                )}

                <Button
                  onClick={handleTestWebhook}
                  disabled={testStatus === "loading" || !apiKey}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {testStatus === "loading" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending test lead...
                    </>
                  ) : (
                    <>
                      <TestTube2 className="w-4 h-4 mr-2" />
                      Send Test Lead
                    </>
                  )}
                </Button>

                {testStatus === "success" && (
                  <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                    <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-green-400">Connection Successful!</p>
                      <p className="text-sm text-gray-400 mt-0.5">{testResult}</p>
                      <p className="text-xs text-gray-500 mt-1">Check your Leads pipeline — the test lead is now there.</p>
                    </div>
                  </div>
                )}

                {testStatus === "error" && (
                  <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                    <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-400">Test Failed</p>
                      <p className="text-sm text-gray-400 mt-0.5">{testResult}</p>
                    </div>
                  </div>
                )}

                <div className="bg-zinc-800 rounded-lg p-4 space-y-2 text-sm">
                  <p className="font-semibold text-white">What the test sends:</p>
                  <pre className="text-xs text-gray-400 font-mono">{JSON.stringify({
                    firstName: "Test",
                    lastName: "Lead",
                    email: "test-[timestamp]@mydojo-test.com",
                    phone: "5551234567",
                    source: "MyDojo Website (Test)",
                    program: "Martial Arts",
                  }, null, 2)}</pre>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
