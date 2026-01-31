import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { 
  Mail, MessageSquare, Plus, Edit, Trash2, RotateCcw, Send, Eye, 
  Download, Clock, CheckCircle, XCircle 
} from 'lucide-react';

export function DojoFlowMessagingTab() {
  const [activeTab, setActiveTab] = useState<'email' | 'sms'>('email');
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

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

  // Email sending
  const sendEmailMutation = trpc.dojoFlowMessaging.sendEmail.useMutation();
  const [showSendDialog, setShowSendDialog] = useState(false);
  const [sendTemplateId, setSendTemplateId] = useState<number | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');

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

  const handleSendEmail = async () => {
    if (!sendTemplateId || !recipientEmail) {
      toast.error('Please provide recipient email');
      return;
    }
    try {
      await sendEmailMutation.mutateAsync({
        templateId: sendTemplateId,
        to: recipientEmail,
        variables: {
          school_name: 'DojoFlow Academy',
          student_name: 'Student',
        },
      });
      toast.success('Email sent successfully!');
      setShowSendDialog(false);
      setRecipientEmail('');
      setSendTemplateId(null);
    } catch (error: any) {
      toast.error(error.message || 'Failed to send email');
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
                            onClick={() => {
                              setSendTemplateId(template.id);
                              setShowSendDialog(true);
                            }}
                            style={{
                              padding: '8px',
                              background: 'rgba(34, 197, 94, 0.2)',
                              border: 'none',
                              borderRadius: '6px',
                              color: '#22c55e',
                              cursor: 'pointer',
                            }}
                            title="Send Email"
                          >
                            <Send size={16} />
                          </button>
                          <button
                            onClick={() => {
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
                            onClick={() => {
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
                              onClick={() => handleResetTemplate(template.id)}
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
                              onClick={() => handleDeleteTemplate(template.id)}
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

      {/* Send Email Dialog */}
      {showSendDialog && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: '#1a1a1a',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '24px',
            width: '90%',
            maxWidth: '500px',
          }}>
            <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px' }}>
              Send Email
            </h3>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)' }}>
                Recipient Email *
              </label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="student@example.com"
                style={{
                  width: '100%',
                  padding: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '6px',
                  color: 'white',
                  fontSize: '14px',
                }}
              />
            </div>
            <p style={{ fontSize: '13px', color: 'rgba(255, 255, 255, 0.6)', marginBottom: '20px' }}>
              Template variables will be filled with sample data for testing.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => {
                  setShowSendDialog(false);
                  setRecipientEmail('');
                  setSendTemplateId(null);
                }}
                style={{
                  padding: '10px 20px',
                  background: 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSendEmail}
                disabled={sendEmailMutation.isPending || !recipientEmail}
                style={{
                  padding: '10px 20px',
                  background: sendEmailMutation.isPending || !recipientEmail ? 'rgba(239, 68, 68, 0.5)' : '#ef4444',
                  border: 'none',
                  borderRadius: '6px',
                  color: 'white',
                  cursor: sendEmailMutation.isPending || !recipientEmail ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Send size={16} />
                {sendEmailMutation.isPending ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
