import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { 
  Mail, MessageSquare, Plus, Edit, Trash2, RotateCcw, Send, Eye, 
  Download, Clock, CheckCircle, XCircle 
} from 'lucide-react';

// Sample data for template variable substitution
const SAMPLE_DATA: Record<string, string> = {
  student_name: 'John Smith',
  student_first_name: 'John',
  student_last_name: 'Smith',
  new_belt: 'Blue Belt',
  current_belt: 'Green Belt',
  school_name: 'Dragon Martial Arts Academy',
  instructor_name: 'Master Chen',
  class_name: 'Advanced Karate',
  promotion_date: 'March 15, 2026',
  test_date: 'March 10, 2026',
  amount: '$150.00',
  due_date: 'February 15, 2026',
  parent_name: 'Sarah Smith',
  phone: '(555) 123-4567',
  email: 'john.smith@example.com',
};

// Utility function to substitute template variables
function substituteVariables(text: string | undefined | null, data: Record<string, string> = SAMPLE_DATA): string {
  if (!text) return '';
  return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
    const trimmedKey = key.trim();
    return data[trimmedKey] || match;
  });
}

export function DojoFlowMessagingTab() {
  const [activeTab, setActiveTab] = useState<'email' | 'sms'>('email');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showRawTemplate, setShowRawTemplate] = useState(false);

  // Email Templates
  const emailTemplatesQuery = trpc.dojoFlowMessaging.getEmailTemplates.useQuery();
  const createTemplateMutation = trpc.dojoFlowMessaging.createEmailTemplate.useMutation();
  const updateTemplateMutation = trpc.dojoFlowMessaging.updateEmailTemplate.useMutation();
  const deleteTemplateMutation = trpc.dojoFlowMessaging.deleteEmailTemplate.useMutation();
  const resetTemplateMutation = trpc.dojoFlowMessaging.resetToDefaultTemplate.useMutation();
  const installDefaultsMutation = trpc.dojoFlowMessaging.installDefaultTemplates.useMutation();

  // SMS Campaigns
  const smsCampaignsQuery = trpc.dojoFlowMessaging.getSMSCampaigns.useQuery();
  const createSMSMutation = trpc.dojoFlowMessaging.createSMSCampaign.useMutation();
  const sendSMSMutation = trpc.dojoFlowMessaging.sendSMSCampaign.useMutation();

  const handleInstallDefaults = async () => {
    try {
      const result = await installDefaultsMutation.mutateAsync();
      toast.success(result.message);
      emailTemplatesQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to install default templates');
    }
  };

  const handleSaveTemplate = async (data: any) => {
    try {
      if (selectedTemplate?.id) {
        await updateTemplateMutation.mutateAsync({ id: selectedTemplate.id, ...data });
        toast.success('Template updated');
      } else {
        await createTemplateMutation.mutateAsync(data);
        toast.success('Template created');
      }
      setIsEditing(false);
      setSelectedTemplate(null);
      emailTemplatesQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to save template');
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await deleteTemplateMutation.mutateAsync({ id });
      toast.success('Template deleted');
      emailTemplatesQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete template');
    }
  };

  const handleResetTemplate = async (id: number) => {
    if (!confirm('Reset this template to default? Your changes will be lost.')) return;
    try {
      await resetTemplateMutation.mutateAsync({ id });
      toast.success('Template reset to default');
      emailTemplatesQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || 'Failed to reset template');
    }
  };

  const groupedTemplates = emailTemplatesQuery.data?.reduce((acc: any, template: any) => {
    const category = template.category || 'general';
    if (!acc[category]) acc[category] = [];
    acc[category].push(template);
    return acc;
  }, {}) || {};

  return (
    <div style={{ padding: '24px', color: 'rgba(255, 255, 255, 0.9)' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '8px' }}>
          Dojo Flow Messaging
        </h2>
        <p style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '14px' }}>
          Manage email templates and SMS campaigns for your dojo
        </p>
      </div>

      {/* Tabs */}
      <div style={{ 
        display: 'flex', 
        gap: '16px', 
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        marginBottom: '32px'
      }}>
        <button
          onClick={() => setActiveTab('email')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'email' ? '2px solid #ef4444' : '2px solid transparent',
            color: activeTab === 'email' ? '#ef4444' : 'rgba(255, 255, 255, 0.6)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <Mail size={18} />
          Email Templates
        </button>
        <button
          onClick={() => setActiveTab('sms')}
          style={{
            padding: '12px 24px',
            background: 'none',
            border: 'none',
            borderBottom: activeTab === 'sms' ? '2px solid #ef4444' : '2px solid transparent',
            color: activeTab === 'sms' ? '#ef4444' : 'rgba(255, 255, 255, 0.6)',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <MessageSquare size={18} />
          SMS Campaigns
        </button>
      </div>

      {/* Email Templates Tab */}
      {activeTab === 'email' && (
        <div>
          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <button
              onClick={() => {
                setSelectedTemplate(null);
                setIsEditing(true);
              }}
              style={{
                padding: '10px 20px',
                background: '#ef4444',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Plus size={18} />
              New Template
            </button>
            <button
              onClick={handleInstallDefaults}
              disabled={installDefaultsMutation.isPending}
              style={{
                padding: '10px 20px',
                background: 'rgba(255, 255, 255, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Download size={18} />
              Install Default Templates
            </button>
          </div>

          {/* Templates List */}
          {emailTemplatesQuery.isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255, 255, 255, 0.6)' }}>
              Loading templates...
            </div>
          ) : Object.keys(groupedTemplates).length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              border: '1px dashed rgba(255, 255, 255, 0.2)'
            }}>
              <Mail size={48} style={{ color: 'rgba(255, 255, 255, 0.3)', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No email templates yet</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)', marginBottom: '20px' }}>
                Get started by installing default templates or creating your own
              </p>
              <button
                onClick={handleInstallDefaults}
                style={{
                  padding: '10px 24px',
                  background: '#ef4444',
                  border: 'none',
                  borderRadius: '8px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                }}
              >
                Install Default Templates
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              {Object.entries(groupedTemplates).map(([category, templates]: [string, any]) => (
                <div key={category}>
                  <h3 style={{ 
                    fontSize: '16px', 
                    fontWeight: '600', 
                    marginBottom: '12px',
                    textTransform: 'capitalize',
                    color: 'rgba(255, 255, 255, 0.8)'
                  }}>
                    {category}
                  </h3>
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {templates.map((template: any) => (
                      <div
                        key={template.id}
                        style={{
                          padding: '16px',
                          background: 'rgba(255, 255, 255, 0.05)',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          borderRadius: '8px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <h4 style={{ fontSize: '14px', fontWeight: '500' }}>{template.name}</h4>
                            {template.is_default && (
                              <span style={{
                                padding: '2px 8px',
                                background: 'rgba(34, 197, 94, 0.2)',
                                color: '#22c55e',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '500',
                              }}>
                                DEFAULT
                              </span>
                            )}
                          </div>
                          <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)' }}>
                            {template.subject}
                          </p>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSelectedTemplate(template);
                              setShowPreview(true);
                            }}
                            style={{
                              padding: '8px',
                              background: 'rgba(255, 255, 255, 0.1)',
                              border: 'none',
                              borderRadius: '6px',
                              color: 'white',
                              cursor: 'pointer',
                            }}
                            title="Preview"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onMouseDown={(e) => {
                              e.preventDefault();
                              setSelectedTemplate(template);
                              setIsEditing(true);
                            }}
                            style={{
                              padding: '8px',
                              background: 'rgba(255, 255, 255, 0.1)',
                              border: 'none',
                              borderRadius: '6px',
                              color: 'white',
                              cursor: 'pointer',
                            }}
                            title="Edit"
                          >
                            <Edit size={16} />
                          </button>
                          {template.is_default && (
                            <button
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleResetTemplate(template.id);
                              }}
                              style={{
                                padding: '8px',
                                background: 'rgba(255, 255, 255, 0.1)',
                                border: 'none',
                                borderRadius: '6px',
                                color: 'white',
                                cursor: 'pointer',
                              }}
                              title="Reset to default"
                            >
                              <RotateCcw size={16} />
                            </button>
                          )}
                          {!template.is_default && (
                            <button
                              onMouseDown={(e) => {
                                e.preventDefault();
                                handleDeleteTemplate(template.id);
                              }}
                              style={{
                                padding: '8px',
                                background: 'rgba(239, 68, 68, 0.2)',
                                border: 'none',
                                borderRadius: '6px',
                                color: '#ef4444',
                                cursor: 'pointer',
                              }}
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SMS Campaigns Tab */}
      {activeTab === 'sms' && (
        <div>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
            <button
              onClick={() => {
                // TODO: Open SMS campaign creation modal
                toast.info('SMS campaign creation coming soon');
              }}
              style={{
                padding: '10px 20px',
                background: '#ef4444',
                border: 'none',
                borderRadius: '8px',
                color: 'white',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Plus size={18} />
              New SMS Campaign
            </button>
          </div>

          {smsCampaignsQuery.isLoading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255, 255, 255, 0.6)' }}>
              Loading campaigns...
            </div>
          ) : !smsCampaignsQuery.data || smsCampaignsQuery.data.length === 0 ? (
            <div style={{ 
              textAlign: 'center', 
              padding: '60px 20px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderRadius: '12px',
              border: '1px dashed rgba(255, 255, 255, 0.2)'
            }}>
              <MessageSquare size={48} style={{ color: 'rgba(255, 255, 255, 0.3)', margin: '0 auto 16px' }} />
              <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No SMS campaigns yet</h3>
              <p style={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                Create your first SMS campaign to reach your students
              </p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '12px' }}>
              {smsCampaignsQuery.data.map((campaign: any) => (
                <div
                  key={campaign.id}
                  style={{
                    padding: '16px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '500', marginBottom: '4px' }}>
                        {campaign.name}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '12px', color: 'rgba(255, 255, 255, 0.6)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {campaign.status === 'sent' ? <CheckCircle size={14} /> : <Clock size={14} />}
                          {campaign.status}
                        </span>
                        {campaign.recipient_count > 0 && (
                          <span>{campaign.recipient_count} recipients</span>
                        )}
                      </div>
                    </div>
                    <span style={{
                      padding: '4px 12px',
                      background: campaign.status === 'sent' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(251, 191, 36, 0.2)',
                      color: campaign.status === 'sent' ? '#22c55e' : '#fbbf24',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '500',
                      textTransform: 'uppercase',
                    }}>
                      {campaign.status}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.8)', marginBottom: '12px' }}>
                    {campaign.message}
                  </p>
                  {campaign.status === 'draft' && (
                    <button
                      onClick={() => {
                        // TODO: Open recipient selection modal
                        toast.info('SMS sending coming soon');
                      }}
                      style={{
                        padding: '8px 16px',
                        background: '#ef4444',
                        border: 'none',
                        borderRadius: '6px',
                        color: 'white',
                        cursor: 'pointer',
                        fontSize: '13px',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                      }}
                    >
                      <Send size={14} />
                      Send Campaign
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedTemplate && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              setShowPreview(false);
              setSelectedTemplate(null);
            }
          }}
        >
          <div
            style={{
              background: '#1a1a1a',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              padding: '32px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600' }}>Preview: {selectedTemplate.name}</h3>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setShowRawTemplate(!showRawTemplate);
                  }}
                  style={{
                    padding: '6px 12px',
                    background: showRawTemplate ? '#ef4444' : 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '12px',
                    fontWeight: '500',
                  }}
                >
                  {showRawTemplate ? 'Show Preview' : 'Show Raw'}
                </button>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setShowPreview(false);
                    setSelectedTemplate(null);
                    setShowRawTemplate(false);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'rgba(255, 255, 255, 0.6)',
                    cursor: 'pointer',
                    fontSize: '24px',
                    padding: '0',
                    lineHeight: '1',
                  }}
                >
                  ×
                </button>
              </div>
            </div>
            
            {showRawTemplate ? (
              // Raw template view
              <>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Subject (Raw):</strong>
                  <p style={{ color: 'rgba(255, 255, 255, 0.9)', marginTop: '8px', fontFamily: 'monospace' }}>{selectedTemplate.subject}</p>
                </div>
                <div>
                  <strong style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Body (Raw):</strong>
                  <div
                    style={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      marginTop: '8px',
                      whiteSpace: 'pre-wrap',
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '16px',
                      borderRadius: '8px',
                      fontFamily: 'monospace',
                      fontSize: '13px',
                    }}
                  >
                    {selectedTemplate.bodyHtml}
                  </div>
                </div>
              </>
            ) : (
              // Preview with substituted variables
              <>
                <div style={{ 
                  marginBottom: '16px',
                  padding: '12px',
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '8px',
                }}>
                  <p style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)', marginBottom: '8px' }}>
                    📧 This preview shows how the email will appear with sample data. Variables like <code style={{ background: 'rgba(255, 255, 255, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>{'{{student_name}}'}</code> are replaced with example values.
                  </p>
                </div>
                <div style={{ marginBottom: '16px' }}>
                  <strong style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Subject:</strong>
                  <p style={{ color: 'rgba(255, 255, 255, 0.9)', marginTop: '8px', fontSize: '16px', fontWeight: '500' }}>
                    {substituteVariables(selectedTemplate.subject)}
                  </p>
                </div>
                <div>
                  <strong style={{ color: 'rgba(255, 255, 255, 0.8)' }}>Body:</strong>
                  <div
                    style={{
                      color: 'rgba(255, 255, 255, 0.9)',
                      marginTop: '8px',
                      whiteSpace: 'pre-wrap',
                      background: 'white',
                      padding: '24px',
                      borderRadius: '8px',
                      color: '#1a1a1a',
                      lineHeight: '1.6',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                    }}
                  >
                    {substituteVariables(selectedTemplate.bodyHtml)}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              e.preventDefault();
              setIsEditing(false);
              setSelectedTemplate(null);
            }
          }}
        >
          <div
            style={{
              background: '#1a1a1a',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              padding: '32px',
              maxWidth: '600px',
              width: '90%',
              maxHeight: '80vh',
              overflow: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontSize: '20px', fontWeight: '600' }}>
                {selectedTemplate ? 'Edit Template' : 'New Template'}
              </h3>
              <button
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsEditing(false);
                  setSelectedTemplate(null);
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255, 255, 255, 0.6)',
                  cursor: 'pointer',
                  fontSize: '24px',
                  padding: '0',
                  lineHeight: '1',
                }}
              >
                ×
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleSaveTemplate({
                  name: formData.get('name'),
                  subject: formData.get('subject'),
                  bodyHtml: formData.get('bodyHtml'),
                  category: formData.get('category') || 'general',
                });
              }}
            >
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  Template Name
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={selectedTemplate?.name || ''}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  Subject
                </label>
                <input
                  type="text"
                  name="subject"
                  defaultValue={selectedTemplate?.subject || ''}
                  required
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  Category
                </label>
                <select
                  name="category"
                  defaultValue={selectedTemplate?.category || 'general'}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '14px',
                  }}
                >
                  <option value="general">General</option>
                  <option value="achievements">Achievements</option>
                  <option value="billing">Billing</option>
                  <option value="onboarding">Onboarding</option>
                </select>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                  Body
                </label>
                <textarea
                  name="bodyHtml"
                  defaultValue={selectedTemplate?.bodyHtml || ''}
                  required
                  rows={10}
                  style={{
                    width: '100%',
                    padding: '10px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '14px',
                    fontFamily: 'monospace',
                    resize: 'vertical',
                  }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setIsEditing(false);
                    setSelectedTemplate(null);
                  }}
                  style={{
                    padding: '10px 20px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '10px 20px',
                    background: '#ef4444',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                >
                  Save Template
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
