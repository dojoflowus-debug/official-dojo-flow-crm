import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../lib/trpc';
import { KaiChatStateful } from '../components/KaiChatStateful';

export default function LeadSettings() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'appearance' | 'messages'>('appearance');
  const [useFullLogo, setUseFullLogo] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current settings
  const { data: profile, isLoading } = trpc.schoolProfile.get.useQuery();
  const updateMutation = trpc.schoolProfile.updateChatSettings.useMutation();

  useEffect(() => {
    if (profile) {
      setUseFullLogo(profile.chatUseFullLogo || false);
      setWelcomeMessage(profile.chatWelcomeMessage || '');
    }
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({
        chatUseFullLogo: useFullLogo,
        chatWelcomeMessage: welcomeMessage || null,
      });
      alert('Chat settings saved successfully!');
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back
              </button>
              <h1 className="text-2xl font-bold text-gray-900">Lead Capture Settings</h1>
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Settings Panel */}
          <div className="space-y-6">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="flex border-b border-gray-200">
                <button
                  onClick={() => setActiveTab('appearance')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'appearance'
                      ? 'text-red-600 border-b-2 border-red-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Appearance
                </button>
                <button
                  onClick={() => setActiveTab('messages')}
                  className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                    activeTab === 'messages'
                      ? 'text-red-600 border-b-2 border-red-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Messages
                </button>
              </div>

              <div className="p-6 space-y-6">
                {activeTab === 'appearance' && (
                  <>
                    {/* Logo Display Option */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-3">
                        Header Display
                      </label>
                      <div className="space-y-3">
                        <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                          style={{ borderColor: !useFullLogo ? '#EF4444' : '#E5E7EB' }}
                        >
                          <input
                            type="radio"
                            checked={!useFullLogo}
                            onChange={() => setUseFullLogo(false)}
                            className="mt-1"
                          />
                          <div>
                            <div className="font-medium text-gray-900">School Name (Text)</div>
                            <div className="text-sm text-gray-600 mt-1">
                              Display your school name as text in the chat header
                            </div>
                          </div>
                        </label>

                        <label className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                          style={{ borderColor: useFullLogo ? '#EF4444' : '#E5E7EB' }}
                        >
                          <input
                            type="radio"
                            checked={useFullLogo}
                            onChange={() => setUseFullLogo(true)}
                            className="mt-1"
                          />
                          <div>
                            <div className="font-medium text-gray-900">Full Logo (Image)</div>
                            <div className="text-sm text-gray-600 mt-1">
                              Display your horizontal logo image in the chat header
                            </div>
                            {useFullLogo && !profile?.logoLightUrl && !profile?.logoDarkUrl && (
                              <div className="mt-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded">
                                ⚠️ No full logo uploaded. Please upload logos in School Profile settings.
                              </div>
                            )}
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex gap-3">
                        <div className="text-blue-600 text-xl">ℹ️</div>
                        <div className="text-sm text-blue-900">
                          <p className="font-medium mb-1">Logo Upload</p>
                          <p>
                            To upload or change your logos, go to{' '}
                            <button
                              onClick={() => navigate('/settings')}
                              className="underline hover:text-blue-700"
                            >
                              Settings → School Profile
                            </button>
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'messages' && (
                  <>
                    {/* Welcome Message */}
                    <div>
                      <label className="block text-sm font-medium text-gray-900 mb-2">
                        Welcome Message
                      </label>
                      <textarea
                        value={welcomeMessage}
                        onChange={(e) => setWelcomeMessage(e.target.value)}
                        placeholder="Hi! 👋 Welcome! I can help you pick the right program and book a free intro class. What are you looking for today?"
                        rows={5}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                      />
                      <p className="text-sm text-gray-600 mt-2">
                        This is the first message visitors see when they open the chat. Leave empty to use the default message.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Right: Live Preview */}
          <div className="lg:sticky lg:top-8 lg:self-start">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Preview</h3>
              <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                <KaiChatStateful
                  embedded={false}
                  locationName={profile?.schoolName || 'Your School'}
                  organizationId={profile?.organizationId?.toString() || ''}
                />
              </div>
              <p className="text-sm text-gray-600 mt-4">
                This preview shows how your chat will appear to visitors on your website.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
