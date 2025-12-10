import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, Plus, Trash2, Key, Code, Globe, TestTube2 } from "lucide-react";
import { toast } from "sonner";

export default function WebhookSettings() {
  const [webhookKeys, setWebhookKeys] = useState([
    { id: 1, name: "Wix Website", apiKey: "wk_1234567890abcdef", isActive: 1, usageCount: 42, lastUsedAt: "2024-01-15" },
    { id: 2, name: "WordPress Form", apiKey: "wk_abcdef1234567890", isActive: 1, usageCount: 18, lastUsedAt: "2024-01-14" },
  ]);
  
  const [newKeyName, setNewKeyName] = useState("");
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  
  const webhookUrl = window.location.origin + "/api/webhook/leads/create";
  
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };
  
  const handleGenerateKey = () => {
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }
    
    const newKey = {
      id: Date.now(),
      name: newKeyName,
      apiKey: `wk_${Math.random().toString(36).substring(2, 18)}`,
      isActive: 1,
      usageCount: 0,
      lastUsedAt: null,
    };
    
    setWebhookKeys([...webhookKeys, newKey]);
    setNewKeyName("");
    setShowNewKeyDialog(false);
    toast.success("API key generated successfully!");
  };
  
  const handleDeleteKey = (id: number) => {
    setWebhookKeys(webhookKeys.filter(k => k.id !== id));
    toast.success("API key deleted");
  };
  
  const handleTestWebhook = async () => {
    toast.info("Sending test webhook...");
    // TODO: Implement test webhook
  };
  
  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold mb-2">Webhook Settings</h1>
          <p className="text-gray-400">Configure webhooks to capture leads from external forms and websites</p>
        </div>
        
        <Tabs defaultValue="endpoint" className="space-y-6">
          <TabsList className="bg-zinc-900 border border-zinc-800">
            <TabsTrigger value="endpoint" className="data-[state=active]:bg-red-600">
              <Globe className="w-4 h-4 mr-2" />
              Endpoint & Keys
            </TabsTrigger>
            <TabsTrigger value="examples" className="data-[state=active]:bg-red-600">
              <Code className="w-4 h-4 mr-2" />
              Integration Examples
            </TabsTrigger>
          </TabsList>
          
          {/* Endpoint & Keys Tab */}
          <TabsContent value="endpoint" className="space-y-6">
            {/* Webhook Endpoint */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Webhook Endpoint URL</CardTitle>
                <CardDescription>
                  Use this URL to send lead data from your website forms, landing pages, or third-party platforms.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={webhookUrl}
                    readOnly
                    className="bg-zinc-800 border-zinc-700 font-mono text-sm"
                  />
                  <Button
                    onClick={() => handleCopy(webhookUrl, "Webhook URL")}
                    variant="outline"
                    className="border-zinc-700"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4">
                  <p className="text-sm text-gray-400 mb-2">HTTP Method:</p>
                  <code className="text-green-400 font-mono">POST</code>
                  
                  <p className="text-sm text-gray-400 mt-4 mb-2">Content-Type:</p>
                  <code className="text-green-400 font-mono">application/json</code>
                </div>
                
                <Button onClick={handleTestWebhook} variant="outline" className="border-zinc-700">
                  <TestTube2 className="w-4 h-4 mr-2" />
                  Send Test Webhook
                </Button>
              </CardContent>
            </Card>
            
            {/* API Keys */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">API Keys</CardTitle>
                    <CardDescription>
                      Generate API keys for secure webhook authentication (optional but recommended)
                    </CardDescription>
                  </div>
                  <Button
                    onClick={() => setShowNewKeyDialog(true)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Generate New Key
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {showNewKeyDialog && (
                  <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="key-name">API Key Name</Label>
                      <Input
                        id="key-name"
                        placeholder="e.g., Wix Website, WordPress Form"
                        value={newKeyName}
                        onChange={(e) => setNewKeyName(e.target.value)}
                        className="bg-zinc-900 border-zinc-700"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleGenerateKey} className="bg-red-600 hover:bg-red-700">
                        Generate Key
                      </Button>
                      <Button
                        onClick={() => {
                          setShowNewKeyDialog(false);
                          setNewKeyName("");
                        }}
                        variant="outline"
                        className="border-zinc-700"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="space-y-3">
                  {webhookKeys.map((key) => (
                    <div
                      key={key.id}
                      className="bg-zinc-800 border border-zinc-700 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Key className="w-4 h-4 text-red-500" />
                          <span className="font-semibold">{key.name}</span>
                          {key.isActive ? (
                            <span className="text-xs bg-green-600 px-2 py-0.5 rounded">Active</span>
                          ) : (
                            <span className="text-xs bg-gray-600 px-2 py-0.5 rounded">Inactive</span>
                          )}
                        </div>
                        <code className="text-sm text-gray-400 font-mono">{key.apiKey}</code>
                        <div className="text-xs text-gray-500 mt-2">
                          Used {key.usageCount} times
                          {key.lastUsedAt && ` • Last used: ${key.lastUsedAt}`}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleCopy(key.apiKey, "API Key")}
                          variant="outline"
                          size="sm"
                          className="border-zinc-700"
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleDeleteKey(key.id)}
                          variant="outline"
                          size="sm"
                          className="border-zinc-700 text-red-500 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Integration Examples Tab */}
          <TabsContent value="examples" className="space-y-6">
            {/* cURL Example */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">cURL Example</CardTitle>
                <CardDescription>Test your webhook from the command line</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-green-400 font-mono">
{`curl -X POST ${webhookUrl} \\
  -H "Content-Type: application/json" \\
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "source": "Website Form",
    "message": "Interested in kids martial arts",
    "utm_source": "google",
    "utm_medium": "cpc",
    "utm_campaign": "summer_2024",
    "api_key": "your_api_key_here"
  }'`}
                  </pre>
                </div>
                <Button
                  onClick={() => handleCopy(`curl -X POST ${webhookUrl} -H "Content-Type: application/json" -d '{"name": "John Doe", "email": "john@example.com", "phone": "+1234567890", "source": "Website Form"}'`, "cURL command")}
                  variant="outline"
                  className="mt-4 border-zinc-700"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy cURL Command
                </Button>
              </CardContent>
            </Card>
            
            {/* JavaScript Example */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">JavaScript / Fetch Example</CardTitle>
                <CardDescription>Integrate with any JavaScript-based form</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4 overflow-x-auto">
                  <pre className="text-sm text-blue-400 font-mono">
{`fetch('${webhookUrl}', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    source: 'Website Form',
    message: 'Interested in kids martial arts',
    utm_source: 'google',
    utm_medium: 'cpc',
    utm_campaign: 'summer_2024',
    api_key: 'your_api_key_here'
  })
})
.then(response => response.json())
.then(data => console.log('Success:', data))
.catch(error => console.error('Error:', error));`}
                  </pre>
                </div>
              </CardContent>
            </Card>
            
            {/* Wix Integration */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Wix Integration</CardTitle>
                <CardDescription>Connect your Wix form to DojoFlow</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                  <li>Open your Wix site editor</li>
                  <li>Add a form element or select an existing form</li>
                  <li>Click on the form and select "Connect to Data"</li>
                  <li>Choose "Custom Code" or "HTTP Functions"</li>
                  <li>Add the webhook URL and configure field mapping</li>
                  <li>Map form fields to: name, email, phone, message</li>
                  <li>Add your API key in the request headers</li>
                </ol>
              </CardContent>
            </Card>
            
            {/* WordPress Integration */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">WordPress Integration</CardTitle>
                <CardDescription>Connect Contact Form 7, Gravity Forms, or WPForms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                  <li>Install a webhook plugin (e.g., "Webhooks for WP Forms")</li>
                  <li>Configure webhook URL: <code className="bg-zinc-800 px-2 py-1 rounded text-xs">{webhookUrl}</code></li>
                  <li>Map form fields to JSON payload</li>
                  <li>Add your API key as a custom header</li>
                  <li>Test the integration</li>
                </ol>
              </CardContent>
            </Card>
            
            {/* Webflow Integration */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Webflow Integration</CardTitle>
                <CardDescription>Connect your Webflow form submissions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                  <li>Use Webflow's native form or add custom code</li>
                  <li>Add JavaScript to capture form submission</li>
                  <li>Send POST request to webhook URL on form submit</li>
                  <li>Include API key in the request body</li>
                  <li>Use the JavaScript example above as reference</li>
                </ol>
              </CardContent>
            </Card>
            
            {/* Shopify Integration */}
            <Card className="bg-zinc-900 border-zinc-800">
              <CardHeader>
                <CardTitle className="text-white">Shopify Integration</CardTitle>
                <CardDescription>Capture leads from Shopify contact forms</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ol className="list-decimal list-inside space-y-2 text-sm text-gray-300">
                  <li>Install a webhook app from Shopify App Store</li>
                  <li>Or use Shopify's built-in webhook system</li>
                  <li>Configure webhook for "Customer Creation" events</li>
                  <li>Set webhook URL to: <code className="bg-zinc-800 px-2 py-1 rounded text-xs">{webhookUrl}</code></li>
                  <li>Add API key in webhook configuration</li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
