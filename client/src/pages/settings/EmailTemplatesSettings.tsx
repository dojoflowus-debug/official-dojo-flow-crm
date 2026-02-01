import { useState, useEffect } from 'react';
import { trpc } from '../../lib/trpc';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { toast } from 'sonner';
import { Mail, Edit, Eye, RotateCcw, History, Save, X, AlertTriangle, Monitor, Smartphone } from 'lucide-react';
import { getSampleDataForTemplate } from '../../lib/emailTemplateSampleData';

/**
 * Email Templates Settings Page
 * 
 * Allows schools to:
 * - View all available email templates
 * - Customize templates with rich text editor
 * - Preview templates with sample data (inline split-screen)
 * - View revision history
 * - Revert to previous versions or defaults
 */

interface EmailTemplate {
  id: number;
  name: string;
  templateType: string;
  subject: string;
  bodyHtml: string;
  bodyText?: string;
  category: string;
  isDefault: number;
  isCustom: number;
  variables: string;
}

export default function EmailTemplatesSettings() {
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSubject, setEditedSubject] = useState('');
  const [editedBodyHtml, setEditedBodyHtml] = useState('');
  const [changeNote, setChangeNote] = useState('');
  const [previewMode, setPreviewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [renderedPreview, setRenderedPreview] = useState<{ subject: string; html: string; missingVariables: string[] } | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [showTestEmailDialog, setShowTestEmailDialog] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  
  // Fetch templates
  const { data: templates, refetch } = trpc.emailTemplates.list.useQuery();
  
  // Update template mutation
  const updateMutation = trpc.emailTemplates.update.useMutation({
    onSuccess: () => {
      toast.success('Template updated successfully');
      setIsEditing(false);
      setSelectedTemplate(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update template: ${error.message}`);
    },
  });
  
  // Preview mutation
  const previewMutation = trpc.emailTemplates.preview.useMutation({
    onSuccess: (data) => {
      setRenderedPreview(data);
      if (data.missingVariables.length > 0) {
        toast.warning(`Missing variables: ${data.missingVariables.join(', ')}`);
      }
    },
    onError: (error) => {
      toast.error(`Preview failed: ${error.message}`);
    },
  });
  
  // Send test email mutation
  const sendTestMutation = trpc.emailTemplates.sendTest.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setShowTestEmailDialog(false);
      setTestEmail('');
      console.log('[SendTest] Success:', data);
    },
    onError: (error) => {
      toast.error(`Failed to send test email: ${error.message}`);
    },
  });
  
  // Revert to default mutation
  const revertMutation = trpc.emailTemplates.revertToDefault.useMutation({
    onSuccess: () => {
      toast.success('Template reverted to default');
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to revert template: ${error.message}`);
    },
  });
  
  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditedSubject(template.subject);
    setEditedBodyHtml(template.bodyHtml);
    setChangeNote('');
    setIsEditing(true);
    setRenderedPreview(null); // Clear previous preview
  };
  
  const handleSaveTemplate = async () => {
    if (!selectedTemplate) return;
    
    await updateMutation.mutateAsync({
      id: selectedTemplate.id,
      subject: editedSubject,
      bodyHtml: editedBodyHtml,
      changeNote: changeNote || undefined,
    });
  };
  
  const handleGeneratePreview = () => {
    if (!selectedTemplate) return;
    
    const sampleData = getSampleDataForTemplate(selectedTemplate.templateType);
    
    previewMutation.mutate({
      subject: editedSubject,
      bodyHtml: editedBodyHtml,
      sampleData,
    });
  };
  
  // Workaround for React event delegation bug: attach direct DOM event listener to Send Test Email button
  useEffect(() => {
    if (!showTestEmailDialog) return;
    
    const timer = setTimeout(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const sendBtn = buttons.find(b => b.textContent?.includes('Send Test Email') && !b.textContent?.includes('Close'));
      
      if (sendBtn) {
        const handleClick = (e: Event) => {
          e.preventDefault();
          e.stopPropagation();
          
          if (!selectedTemplate || !testEmail) return;
          
          const sampleData = getSampleDataForTemplate(selectedTemplate.templateType);
          sendTestMutation.mutate({
            recipientEmail: testEmail,
            subject: editedSubject,
            bodyHtml: editedBodyHtml,
            sampleData,
          });
        };
        
        sendBtn.addEventListener('click', handleClick, { capture: true });
        
        return () => {
          sendBtn.removeEventListener('click', handleClick, { capture: true });
        };
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [showTestEmailDialog, selectedTemplate, testEmail, editedSubject, editedBodyHtml, sendTestMutation]);
  
  const handleRevertToDefault = async (template: EmailTemplate) => {
    if (!confirm('Are you sure you want to revert this template to its default version? This cannot be undone.')) {
      return;
    }
    
    await revertMutation.mutateAsync({
      id: template.id,
    });
  };
  
  // Group templates by category
  const groupedTemplates = templates?.reduce((acc, template) => {
    const category = template.category || 'custom';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, EmailTemplate[]>);
  
  const categoryNames: Record<string, string> = {
    onboarding: 'Onboarding',
    billing: 'Billing & Payments',
    scheduling: 'Scheduling & Reminders',
    achievements: 'Achievements',
    merchandise: 'Merchandise',
    account: 'Account Management',
    custom: 'Custom Templates',
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Email Templates</h1>
          <p className="text-muted-foreground">Customize email templates for your school</p>
        </div>
      </div>
      
      {groupedTemplates && Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
        <div key={category} className="space-y-4">
          <h2 className="text-2xl font-semibold">{categoryNames[category] || category}</h2>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {categoryTemplates.map((template) => (
              <Card key={template.id || template.templateType} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <CardDescription className="text-sm mt-1">{template.subject}</CardDescription>
                      </div>
                    </div>
                    {template.isDefault === 1 && (
                      <Badge variant="secondary">Default</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditTemplate(template)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    {template.isCustom === 1 && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedTemplate(template);
                            setHistoryOpen(true);
                          }}
                        >
                          <History className="h-4 w-4 mr-2" />
                          History
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevertToDefault(template)}
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Revert
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
      
      {/* Edit Dialog with Inline Split-Screen Preview */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-[95vw] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Template: {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Customize this email template. Use variables like {'{{studentName}}'} to personalize emails.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-4 flex-1 overflow-hidden min-h-0">
            {/* Editor Panel */}
            <div className="flex-1 space-y-4 overflow-y-auto pr-4">
              <div>
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={editedSubject}
                  onChange={(e) => setEditedSubject(e.target.value)}
                  placeholder="Email subject"
                />
              </div>
              
              <div>
                <Label htmlFor="bodyHtml">Email Body (HTML)</Label>
                <Textarea
                  id="bodyHtml"
                  value={editedBodyHtml}
                  onChange={(e) => setEditedBodyHtml(e.target.value)}
                  placeholder="Email body HTML"
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>
              
              <div>
                <Label htmlFor="changeNote">Change Note (Optional)</Label>
                <Input
                  id="changeNote"
                  value={changeNote}
                  onChange={(e) => setChangeNote(e.target.value)}
                  placeholder="Describe what you changed"
                />
              </div>
              
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Available Variables:</h4>
                <div className="text-sm text-muted-foreground space-y-1">
                  {selectedTemplate && JSON.parse(selectedTemplate.variables || '[]').map((variable: string) => (
                    <div key={variable} className="font-mono">
                      {'{{' + variable + '}}'}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Preview Panel */}
            <div className="flex-1 flex flex-col space-y-4 overflow-hidden">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Live Preview</h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    className={`inline-flex items-center justify-center h-8 px-3 text-sm font-medium rounded-md transition-colors ${previewMode === 'desktop' ? 'bg-primary text-primary-foreground' : 'border border-input bg-background hover:bg-accent'}`}
                    onClick={() => setPreviewMode('desktop')}
                  >
                    <Monitor className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className={`inline-flex items-center justify-center h-8 px-3 text-sm font-medium rounded-md transition-colors ${previewMode === 'mobile' ? 'bg-primary text-primary-foreground' : 'border border-input bg-background hover:bg-accent'}`}
                    onClick={() => setPreviewMode('mobile')}
                  >
                    <Smartphone className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="inline-flex items-center justify-center h-8 px-3 gap-2 text-sm font-medium rounded-md bg-muted text-muted-foreground cursor-not-allowed opacity-50"
                    disabled={true}
                    title="Preview temporarily unavailable. Use Send Test Email."
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={() => setShowTestEmailDialog(true)}
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Send Test Email
                  </Button>
                </div>
              </div>
              
              <div className={`flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4 ${previewMode === 'mobile' ? 'max-w-[375px] mx-auto' : ''}`}>
                {previewMutation.isPending ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : renderedPreview ? (
                  <div className="space-y-4">
                    {/* Missing Variables Warning */}
                    {renderedPreview.missingVariables.length > 0 && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Missing variables: {renderedPreview.missingVariables.join(', ')}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    {/* Preview Content in Sandboxed Iframe */}
                    <div className="bg-white rounded-lg shadow-sm">
                      <div className="border-b p-4 bg-gray-100">
                        <div className="text-xs text-muted-foreground mb-1">Subject:</div>
                        <div className="font-semibold">{renderedPreview.subject}</div>
                      </div>
                      <iframe
                        title="Email Preview"
                        sandbox="allow-same-origin"
                        srcDoc={`
                          <!DOCTYPE html>
                          <html>
                          <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <style>
                              body {
                                margin: 0;
                                padding: 20px;
                                font-family: Arial, sans-serif;
                              }
                            </style>
                          </head>
                          <body>
                            ${renderedPreview.html}
                          </body>
                          </html>
                        `}
                        className="w-full h-[500px] border-0"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    <div className="text-center">
                      <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Click "Preview" to see how your email will look</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditing(false)}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSaveTemplate} disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* History Dialog (Placeholder) */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revision History</DialogTitle>
            <DialogDescription>
              View previous versions of this template
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground">Revision history feature coming soon...</p>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Send Test Email Dialog */}
      <Dialog open={showTestEmailDialog} onOpenChange={setShowTestEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Send a test email with sample data to verify your template
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="testEmail">Recipient Email</Label>
              <Input
                id="testEmail"
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your@email.com"
              />
            </div>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This will send a real email with sample data. Rate limited to 3 emails per 10 minutes.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTestEmailDialog(false)}>
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (!selectedTemplate) return;
                const sampleData = getSampleDataForTemplate(selectedTemplate.templateType);
                sendTestMutation.mutate({
                  recipientEmail: testEmail,
                  subject: editedSubject,
                  bodyHtml: editedBodyHtml,
                  sampleData,
                });
              }} 
              disabled={!testEmail || sendTestMutation.isPending}
            >
              <Mail className="h-4 w-4 mr-2" />
              {sendTestMutation.isPending ? 'Sending...' : 'Send Test Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
