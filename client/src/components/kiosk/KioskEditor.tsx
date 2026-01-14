import { useState } from 'react';
import { ChevronDown, Upload, Plus, Trash2, Loader } from 'lucide-react';
import { trpc } from '../../lib/trpc';
import BackgroundSection from './sections/BackgroundSection';
import ThemeSection from './sections/ThemeSection';
import BehaviorSection from './sections/BehaviorSection';

interface Location {
  id: number;
  name: string;
  address?: string;
  isActive: number;
  updatedAt: string;
}

interface KioskEditorProps {
  location: Location;
  onLocationUpdated: () => void;
}

interface EditorState {
  background: {
    type: 'color' | 'image' | 'preset';
    color: string;
    imageUrl?: string;
    blur: number;
    dim: number;
  };
  colors: {
    primary: string;
    secondary: string;
  };
  theme: string;
  behavior: {
    idleTimeout: number;
    message: string;
    screensaverEnabled: boolean;
  };
}

export default function KioskEditor({ location, onLocationUpdated }: KioskEditorProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    background: true,
    theme: true,
    behavior: true,
  });

  const [state, setState] = useState<EditorState>({
    background: {
      type: 'color',
      color: '#ffffff',
      blur: 0,
      dim: 0,
    },
    colors: {
      primary: '#ef4444',
      secondary: '#fbbf24',
    },
    theme: 'default',
    behavior: {
      idleTimeout: 60,
      message: 'Tap the screen to check in',
      screensaverEnabled: true,
    },
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const updateAppearanceMutation = trpc.kioskManager.updateKioskAppearance.useMutation({
    onSuccess: () => {
      onLocationUpdated();
    },
  });

  const handleSave = async () => {
    updateAppearanceMutation.mutate({
      locationId: location.id,
      appearance: state,
    });
  };

  const EditorSection = ({ 
    title, 
    icon: Icon, 
    id, 
    children 
  }: { 
    title: string; 
    icon: React.ComponentType<any>; 
    id: string; 
    children: React.ReactNode 
  }) => (
    <div className="border border-white/10 rounded-lg overflow-hidden">
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between p-4 hover:bg-slate-700/30 transition-colors bg-slate-700/20"
      >
        <div className="flex items-center gap-3">
          <Icon size={18} className="text-red-400" />
          <h3 className="font-semibold text-white">{title}</h3>
        </div>
        <ChevronDown
          size={18}
          className={`text-slate-400 transition-transform duration-200 ${
            expandedSections[id] ? 'rotate-180' : ''
          }`}
        />
      </button>
      {expandedSections[id] && (
        <div className="p-4 border-t border-white/10 space-y-4 bg-slate-800/30">
          {children}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-slate-800/50 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-white/10 bg-slate-900/50">
        <h2 className="text-xl font-bold text-white">{location.name}</h2>
        <p className="text-sm text-slate-400 mt-1">Customize kiosk appearance and behavior</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {/* Background Section */}
        <EditorSection title="Background" icon={Upload} id="background">
          <BackgroundSection state={state} setState={setState} />
        </EditorSection>

        {/* Theme & Text Section */}
        <EditorSection title="Theme & Text" icon={Upload} id="theme">
          <ThemeSection state={state} setState={setState} />
        </EditorSection>

        {/* Behavior Section */}
        <EditorSection title="Behavior" icon={Upload} id="behavior">
          <BehaviorSection state={state} setState={setState} />
        </EditorSection>
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-white/10 bg-slate-900/50 flex gap-3">
        <button className="flex-1 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 text-white font-medium rounded-lg transition-colors">
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={updateAppearanceMutation.isPending}
          className="flex-1 px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-slate-600 disabled:to-slate-600 text-white font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
        >
          {updateAppearanceMutation.isPending && <Loader size={16} className="animate-spin" />}
          {updateAppearanceMutation.isPending ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
}
