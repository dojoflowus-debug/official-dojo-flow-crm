import React, { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';
import { KaiChatStateful } from './KaiChatStateful';
import { Button } from './ui/button';
import { Loader2 } from 'lucide-react';

interface ChatCustomizationProps {
  onSave?: (settings: { useFullLogo: boolean; welcomeMessage: string }) => Promise<void>;
}

export default function ChatCustomization({ onSave }: ChatCustomizationProps = {}) {
  const [useFullLogo, setUseFullLogo] = useState(false);
  const [welcomeMessage, setWelcomeMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch current settings
  const utils = trpc.useUtils();
  const { data: profile, isLoading } = trpc.schoolProfile.get.useQuery();
  const updateMutation = trpc.schoolProfile.updateChatSettings.useMutation({
    onSuccess: () => {
      utils.schoolProfile.get.invalidate();
    },
  });

  useEffect(() => {
    if (profile) {
      setUseFullLogo(profile.chatUseFullLogo || false);
      setWelcomeMessage(profile.chatWelcomeMessage || '');
    }
  }, [profile]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      if (onSave) {
        await onSave({ useFullLogo, welcomeMessage });
      } else {
        await updateMutation.mutateAsync({
          chatUseFullLogo: useFullLogo,
          chatWelcomeMessage: welcomeMessage || null,
        });
        alert('Chat settings saved successfully!');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Expose save function to parent
  React.useEffect(() => {
    if (onSave) {
      (window as any).__chatCustomizationSave = handleSave;
    }
  }, [useFullLogo, welcomeMessage]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6 py-4">
      {/* Settings Controls */}
      <div className="space-y-6 max-w-2xl">
        {/* Logo Display Option */}
        <div>
          <label className="block text-base font-semibold text-white mb-4">
            Header Display
          </label>
          <div className="space-y-3">
            <label 
              className="flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-slate-800/40"
              style={{ 
                borderColor: !useFullLogo ? '#EF4444' : 'rgba(148, 163, 184, 0.3)',
                backgroundColor: !useFullLogo ? 'rgba(239, 68, 68, 0.1)' : 'rgba(15, 23, 42, 0.4)'
              }}
            >
              <input
                type="radio"
                checked={!useFullLogo}
                onChange={() => setUseFullLogo(false)}
                className="mt-1 accent-red-500"
              />
              <div>
                <div className="font-medium text-white">School Name (Text)</div>
                <div className="text-sm text-slate-400 mt-1">
                  Display your school name as text in the chat header
                </div>
              </div>
            </label>

            <label 
              className="flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all hover:bg-slate-800/40"
              style={{ 
                borderColor: useFullLogo ? '#EF4444' : 'rgba(148, 163, 184, 0.3)',
                backgroundColor: useFullLogo ? 'rgba(239, 68, 68, 0.1)' : 'rgba(15, 23, 42, 0.4)'
              }}
            >
              <input
                type="radio"
                checked={useFullLogo}
                onChange={() => setUseFullLogo(true)}
                className="mt-1 accent-red-500"
              />
              <div className="flex-1">
                <div className="font-medium text-white">Full Logo (Image)</div>
                <div className="text-sm text-slate-400 mt-1">
                  Display your horizontal logo image in the chat header
                </div>
                {useFullLogo && !profile?.logoLightUrl && !profile?.logoDarkUrl && (
                  <div className="mt-2 text-sm text-amber-400 bg-amber-900/30 px-3 py-2 rounded-lg border border-amber-700/50">
                    ⚠️ No full logo uploaded. Please upload logos in School Profile settings.
                  </div>
                )}
              </div>
            </label>
          </div>
        </div>

        {/* Welcome Message */}
        <div>
          <label className="block text-base font-semibold text-white mb-2">
            Welcome Message
          </label>
          <textarea
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            placeholder="Hi! 👋 Welcome to MyDojo. I can help you pick the right program and book a free intro class. What are you looking for today?"
            rows={5}
            className="w-full px-4 py-3 bg-slate-900/60 border-2 border-slate-700/40 rounded-xl text-white placeholder-slate-500 focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none transition-all"
          />
          <p className="text-sm text-slate-400 mt-2">
            This is the first message visitors see when they open the chat. Leave empty to use the default message.
          </p>
        </div>

        {/* Note: Save functionality will be handled by parent modal's Continue button */}
      </div>

      {/* Live Preview */}
      <div className="max-w-2xl">
        <div className="bg-slate-900/60 border-2 border-slate-700/40 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Live Preview</h3>
          <div className="border-2 border-slate-700 rounded-xl overflow-hidden shadow-2xl" style={{ height: '400px' }}>
            <KaiChatStateful
              embedded={false}
              locationName={profile?.schoolName || 'Your School'}
              organizationId={profile?.organizationId?.toString() || ''}
            />
          </div>
          <p className="text-sm text-slate-400 mt-4">
            This preview shows how your chat will appear to visitors on your website.
          </p>
        </div>
      </div>
    </div>
  );
}
