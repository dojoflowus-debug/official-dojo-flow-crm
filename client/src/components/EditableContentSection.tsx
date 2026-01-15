import React, { useState } from 'react';
import { updateKioskContent } from '@/lib/kioskConfigProvider';
import type { KioskContent } from '@/lib/kioskConfigProvider';

interface EditableContentSectionProps {
  locationId: string;
  deviceType: string;
  content: KioskContent;
  onContentChange: (content: KioskContent) => void;
}

export function EditableContentSection({
  locationId,
  deviceType,
  content,
  onContentChange,
}: EditableContentSectionProps) {
  const [localContent, setLocalContent] = useState(content);
  const [saving, setSaving] = useState(false);

  const handleFieldChange = (field: keyof KioskContent, value: string) => {
    const updated = { ...localContent, [field]: value };
    setLocalContent(updated);
    
    // Auto-save to localStorage
    setSaving(true);
    updateKioskContent(locationId, deviceType, { [field]: value }).then(() => {
      onContentChange(updated);
      setSaving(false);
    });
  };

  const handleReset = async () => {
    const defaultContent: KioskContent = {
      headline: 'Welcome',
      subheadline: 'Tap the screen to begin',
      helper: 'Need help? See the front desk.',
      footer: 'Discipline • Confidence • Fitness',
    };
    
    setLocalContent(defaultContent);
    setSaving(true);
    
    await updateKioskContent(locationId, deviceType, defaultContent);
    onContentChange(defaultContent);
    setSaving(false);
  };

  return (
    <div className="space-y-6 p-4 bg-slate-700 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-white font-bold text-lg">Kiosk Content</h3>
        <button
          onClick={handleReset}
          disabled={saving}
          className="text-sm bg-gray-600 hover:bg-gray-500 disabled:bg-gray-700 text-white px-3 py-1 rounded transition-all"
        >
          Reset to Defaults
        </button>
      </div>

      {/* Headline */}
      <div>
        <label className="block text-white font-semibold mb-2">Headline</label>
        <input
          type="text"
          value={localContent.headline}
          onChange={(e) => handleFieldChange('headline', e.target.value)}
          disabled={saving}
          className="w-full bg-slate-600 text-white px-4 py-2 rounded border border-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
          placeholder="Welcome"
        />
        <p className="text-slate-400 text-xs mt-1">Main heading displayed on kiosk home screen</p>
      </div>

      {/* Subheadline */}
      <div>
        <label className="block text-white font-semibold mb-2">Subheadline</label>
        <input
          type="text"
          value={localContent.subheadline}
          onChange={(e) => handleFieldChange('subheadline', e.target.value)}
          disabled={saving}
          className="w-full bg-slate-600 text-white px-4 py-2 rounded border border-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
          placeholder="Tap the screen to begin"
        />
        <p className="text-slate-400 text-xs mt-1">Secondary text below headline</p>
      </div>

      {/* Helper Text */}
      <div>
        <label className="block text-white font-semibold mb-2">Helper Text (Optional)</label>
        <input
          type="text"
          value={localContent.helper || ''}
          onChange={(e) => handleFieldChange('helper', e.target.value)}
          disabled={saving}
          className="w-full bg-slate-600 text-white px-4 py-2 rounded border border-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
          placeholder="Need help? See the front desk."
        />
        <p className="text-slate-400 text-xs mt-1">Optional helper message</p>
      </div>

      {/* Footer */}
      <div>
        <label className="block text-white font-semibold mb-2">Footer Text (Optional)</label>
        <input
          type="text"
          value={localContent.footer || ''}
          onChange={(e) => handleFieldChange('footer', e.target.value)}
          disabled={saving}
          className="w-full bg-slate-600 text-white px-4 py-2 rounded border border-slate-500 focus:border-blue-500 focus:outline-none disabled:opacity-50"
          placeholder="Discipline • Confidence • Fitness"
        />
        <p className="text-slate-400 text-xs mt-1">Optional footer message (e.g., school values)</p>
      </div>

      {/* Saving Indicator */}
      {saving && (
        <div className="text-blue-400 text-sm flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
          Saving...
        </div>
      )}
    </div>
  );
}
