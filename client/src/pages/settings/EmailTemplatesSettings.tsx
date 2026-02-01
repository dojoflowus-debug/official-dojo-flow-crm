import { useState } from 'react';
import { trpc } from '../../lib/trpc';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { toast } from 'sonner';
import { Mail, Edit, Eye, RotateCcw, History, Save, X } from 'lucide-react';

/**
 * Email Templates Settings Page
 * 
 * Allows schools to:
 * - View all available email templates
 * - Customize templates with rich text editor
 * - Preview templates with sample data
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
  const [previewOpen, setPreviewOpen] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  
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
  
  // Revert to default mutation
  const revertMutation = trpc.emailTemplates.revertToDefault.useMutation({
    onSuccess: () => {
      toast.success('Template reverted to default');
      setSelectedTemplate(null);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to revert template: ${error.message}`);
    },
  });
  
  // Preview mutation
  const previewMutation = trpc.emailTemplates.preview.useMutation();
  
  // Get revisions query
  const { data: revisions } = trpc.emailTemplates.getRevisions.useQuery(
    { templateId: selectedTemplate?.id || 0 },
    { enabled: historyOpen && !!selectedTemplate && selectedTemplate.id > 0 }
  );
  
  const handleEditTemplate = (template: EmailTemplate) => {
    setSelectedTemplate(template);
    setEditedSubject(template.subject);
    setEditedBodyHtml(template.bodyHtml);
    setChangeNote('');
    setIsEditing(true);
  };
  
  const handleSaveTemplate = () => {
    if (!selectedTemplate) return;
    
    updateMutation.mutate({
      id: selectedTemplate.id > 0 ? selectedTemplate.id : undefined,
      templateType: selectedTemplate.templateType,
      name: selectedTemplate.name,
      subject: editedSubject,
      bodyHtml: editedBodyHtml,
      category: selectedTemplate.category,
      changeNote,
    });
  };
  
  const handleRevertToDefault = (template: EmailTemplate) => {
    if (confirm('Are you sure you want to revert this template to the default? This cannot be undone.')) {
      revertMutation.mutate({
        templateType: template.templateType,
      });
    }
  };
  
  const handlePreview = async (template: EmailTemplate) => {
    // Sample data for preview
    const sampleData = {
      studentName: 'John Doe',
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      phone: '(555) 123-4567',
      beltRank: 'Blue Belt',
      membershipType: 'Monthly',
      dojoName: 'Your Dojo Name',
      schoolName: 'Your Dojo Name',
      dojoAddress: '123 Main St, City, State 12345',
      dojoPhone: '(555) 987-6543',
      dojoEmail: 'info@yourdojo.com',
      dojoWebsite: 'https://yourdojo.com',
      amount: '$99.00',
      currency: 'USD',
      paymentMethod: 'Visa ending in 1234',
      transactionId: 'TXN123456789',
      invoiceUrl: 'https://yourdojo.com/invoice/123',
      receiptUrl: 'https://yourdojo.com/receipt/123',
      className: 'Advanced Karate',
      classDate: 'Monday, January 15, 2026',
      classTime: '6:00 PM - 7:00 PM',
      classLocation: 'Main Dojo',
      instructorName: 'Sensei Smith',
      itemName: 'Gi (Uniform)',
      itemSize: ' (Size: Medium)',
      quantity: '1',
      confirmationUrl: 'https://yourdojo.com/confirm/123',
      currentDate: new Date().toLocaleDateString(),
      currentYear: new Date().getFullYear().toString(),
      resetPasswordUrl: 'https://yourdojo.com/reset-password/token123',
      loginUrl: 'https://yourdojo.com/login',
    };
    
    try {
      const result = await previewMutation.mutateAsync({
        subject: isEditing ? editedSubject : template.subject,
        bodyHtml: isEditing ? editedBodyHtml : template.bodyHtml,
        sampleData,
      });
      
      // Open preview dialog
      setPreviewOpen(true);
      
      // Show preview in a new window or modal
      const previewWindow = window.open('', 'Email Preview', 'width=800,height=600');
      if (previewWindow) {
        previewWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>${result.subject}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
              .email-container { max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
              .subject { font-size: 18px; font-weight: bold; margin-bottom: 20px; padding-bottom: 10px; border-bottom: 2px solid #E53935; }
            </style>
          </head>
          <body>
            <div class="email-container">
              <div class="subject">Subject: ${result.subject}</div>
              ${result.bodyHtml}
            </div>
          </body>
          </html>
        `);
        previewWindow.document.close();
      }
      
      if (result.missingVariables.length > 0) {
        toast.warning(`Missing variables: ${result.missingVariables.join(', ')}`);
      }
    } catch (error: any) {
      toast.error(`Preview failed: ${error.message}`);
    }
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
                    <Mail className="h-8 w-8 text-primary" />
                    <div className="flex gap-2">
                      {template.isDefault === 1 && (
                        <Badge variant="outline">Default</Badge>
                      )}
                      {template.isCustom === 1 && (
                        <Badge variant="secondary">Customized</Badge>
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription className="line-clamp-1">{template.subject}</CardDescription>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreview(template)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
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
      
      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Template: {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              Customize this email template. Use variables like {'{'}{'{'} studentName {'}'}{'}'}  to personalize emails.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
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
          
          <DialogFooter>
            <Button variant="outline" onClick={() => handlePreview(selectedTemplate!)}>
              <Eye className="h-4 w-4 mr-2" />
              Preview
            </Button>
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
      
      {/* History Dialog */}
      <Dialog open={historyOpen} onOpenChange={setHistoryOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Revision History: {selectedTemplate?.name}</DialogTitle>
            <DialogDescription>
              View all changes made to this template
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {revisions?.map((revision) => (
              <Card key={revision.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">Version {revision.version}</CardTitle>
                    <Badge>{new Date(revision.createdAt).toLocaleDateString()}</Badge>
                  </div>
                  {revision.changeNote && (
                    <CardDescription>{revision.changeNote}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="text-sm space-y-2">
                    <div>
                      <strong>Subject:</strong> {revision.subject}
                    </div>
                    <div className="text-muted-foreground">
                      Created by User #{revision.createdBy} on {new Date(revision.createdAt).toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
