import React, { useState, useRef, useCallback } from 'react';
import { X, Check, Sparkles, Tag, Zap, Upload, ImageIcon, Trash2, Plus, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEnvironment, environments, EnvironmentType, Environment, IndustryTag } from '@/contexts/EnvironmentContext';

// Human-readable tag labels
const TAG_LABELS: Record<IndustryTag, string> = {
  martial_arts: 'Martial Arts',
  mma: 'MMA',
  boxing: 'Boxing',
  kickboxing: 'Kickboxing',
  dance: 'Dance',
  yoga: 'Yoga',
  yoga_dance: 'Yoga & Dance',
  fitness: 'Fitness',
  wellness: 'Wellness',
  personal_trainer: 'Personal Training',
  other: 'General',
};

// Tag accent colors
const TAG_COLORS: Record<IndustryTag, string> = {
  martial_arts: '#EF4444',
  mma: '#3B82F6',
  boxing: '#DC2626',
  kickboxing: '#F59E0B',
  dance: '#A855F7',
  yoga: '#22C55E',
  yoga_dance: '#8B5CF6',
  fitness: '#06B6D4',
  wellness: '#10B981',
  personal_trainer: '#6366F1',
  other: '#6B7280',
};

// Industry section groups
const INDUSTRY_SECTIONS: { tag: IndustryTag; label: string; emoji: string }[] = [
  { tag: 'martial_arts', label: 'Martial Arts', emoji: '🥋' },
  { tag: 'mma', label: 'MMA', emoji: '🥊' },
  { tag: 'boxing', label: 'Boxing', emoji: '🥊' },
  { tag: 'kickboxing', label: 'Kickboxing & Muay Thai', emoji: '🦵' },
  { tag: 'dance', label: 'Dance', emoji: '💃' },
  { tag: 'yoga', label: 'Yoga & Wellness', emoji: '🧘' },
  { tag: 'fitness', label: 'Fitness', emoji: '💪' },
  { tag: 'personal_trainer', label: 'Personal Training', emoji: '🏋️' },
];

function IndustryTagBadge({ tag }: { tag: IndustryTag }) {
  const color = TAG_COLORS[tag] || '#6B7280';
  const label = TAG_LABELS[tag] || tag;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
    >
      <Tag className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}

function EnvironmentCard({
  env,
  currentEnvironmentId,
  defaultEnvironment,
  onClick,
  onDelete,
}: {
  env: Environment;
  currentEnvironmentId: string;
  defaultEnvironment: EnvironmentType | null;
  onClick: (env: Environment) => void;
  onDelete?: (id: string) => void;
}) {
  const isActive = currentEnvironmentId === env.id;
  const isDefault = defaultEnvironment === env.id;
  const isCustom = env.id.startsWith('custom-');

  return (
    <button
      onClick={() => onClick(env)}
      className="group relative overflow-hidden rounded-[18px] border transition-all duration-300 hover:scale-[1.03] focus:outline-none focus:ring-2 focus:ring-[#FF4C4C]/50 text-left"
      style={{
        borderColor: isActive ? `${env.accentColor}60` : 'rgba(255,255,255,0.1)',
        boxShadow: isActive
          ? `0 0 30px ${env.accentColor}30, 0 8px 32px rgba(0,0,0,0.3)`
          : '0 8px 32px rgba(0,0,0,0.2)',
      }}
    >
      {/* Preview Background */}
      <div
        className="aspect-[16/10] w-full transition-transform duration-500 group-hover:scale-110"
        style={
          env.backgroundImage
            ? {
                backgroundImage: `url(${env.backgroundImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }
            : {
                background: env.gradient,
              }
        }
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent flex flex-col justify-end p-3">
        <div className="flex items-center gap-1.5 mb-1 flex-wrap">
          {isActive && (
            <span className="px-2 py-0.5 bg-[#FF4C4C] rounded-full text-[10px] font-semibold text-white">
              Active
            </span>
          )}
          {isDefault && !isActive && (
            <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-semibold text-white">
              Default
            </span>
          )}
          {isCustom && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FF4C4C]/20 text-[#FF4C4C] border border-[#FF4C4C]/40 flex items-center gap-1">
              <Upload className="w-2.5 h-2.5" />
              Custom
            </span>
          )}
          {env.isNew && !isActive && !isDefault && !isCustom && (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold flex items-center gap-1"
              style={{ background: `${env.accentColor}30`, color: env.accentColor, border: `1px solid ${env.accentColor}50` }}
            >
              <Zap className="w-2.5 h-2.5" />
              New
            </span>
          )}
        </div>

        <h3 className="text-white font-semibold text-sm leading-tight mb-1">{env.name}</h3>
        <p className="text-white/55 text-[11px] mb-2 leading-tight">{env.description}</p>

        {env.industryTags && env.industryTags.length > 0 && !isCustom && (
          <div className="flex flex-wrap gap-1">
            {env.industryTags.slice(0, 2).map(tag => (
              <IndustryTagBadge key={tag} tag={tag as IndustryTag} />
            ))}
            {env.industryTags.length > 2 && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-white/50 border border-white/15">
                +{env.industryTags.length - 2}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Delete button for custom environments */}
      {isCustom && onDelete && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(env.id); }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white/60 hover:text-red-400 hover:bg-black/80 transition-colors opacity-0 group-hover:opacity-100"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Hover glow */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ background: `radial-gradient(circle at center, ${env.accentColor}18 0%, transparent 70%)` }}
      />
    </button>
  );
}

// ── Custom Upload Panel ────────────────────────────────────────────────────────
function CustomUploadPanel({ onAdd }: { onAdd: (name: string, url: string) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const [customName, setCustomName] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [urlMode, setUrlMode] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPG, PNG, WebP, etc.)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB');
      return;
    }
    setError('');
    setUploading(true);

    try {
      // Convert to base64 data URL for local preview and storage
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        setPreviewUrl(dataUrl);
        setUploading(false);
      };
      reader.onerror = () => {
        setError('Failed to read file');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setError('Upload failed. Please try again.');
      setUploading(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleUrlSubmit = () => {
    if (!urlInput.trim()) return;
    setPreviewUrl(urlInput.trim());
    setUrlInput('');
    setUrlMode(false);
    setError('');
  };

  const handleAdd = () => {
    if (!previewUrl) {
      setError('Please select or upload an image first');
      return;
    }
    onAdd(customName || 'My Custom Environment', previewUrl);
    setPreviewUrl('');
    setCustomName('');
    setError('');
  };

  return (
    <div className="space-y-4">
      {!previewUrl ? (
        <>
          {!urlMode ? (
            /* Drag & Drop Zone */
            <div
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="relative border-2 border-dashed rounded-[18px] p-10 text-center cursor-pointer transition-all duration-200"
              style={{
                borderColor: isDragging ? '#FF4C4C' : 'rgba(255,255,255,0.15)',
                background: isDragging ? 'rgba(255,76,76,0.08)' : 'rgba(255,255,255,0.03)',
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
              />
              {uploading ? (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-10 h-10 border-2 border-[#FF4C4C] border-t-transparent rounded-full animate-spin" />
                  <p className="text-white/60 text-sm">Processing image...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                    <Upload className="w-6 h-6 text-white/40" />
                  </div>
                  <div>
                    <p className="text-white/80 font-medium text-sm">Drop your image here</p>
                    <p className="text-white/40 text-xs mt-1">or click to browse · JPG, PNG, WebP up to 10MB</p>
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* URL Input Mode */
            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={e => setUrlInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleUrlSubmit()}
                  placeholder="https://example.com/your-gym-photo.jpg"
                  className="flex-1 bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#FF4C4C]/50"
                />
                <Button onClick={handleUrlSubmit} className="bg-[#FF4C4C] hover:bg-[#FF5E5E] text-white rounded-xl px-4">
                  Use
                </Button>
              </div>
            </div>
          )}

          {/* Toggle between file and URL */}
          <button
            onClick={() => setUrlMode(!urlMode)}
            className="flex items-center gap-2 text-white/40 hover:text-white/70 text-xs transition-colors mx-auto"
          >
            {urlMode ? (
              <><ImageIcon className="w-3.5 h-3.5" /> Upload a file instead</>
            ) : (
              <><Link className="w-3.5 h-3.5" /> Use an image URL instead</>
            )}
          </button>
        </>
      ) : (
        /* Preview & Confirm */
        <div className="space-y-4">
          <div
            className="w-full aspect-[16/9] rounded-[18px] overflow-hidden border border-white/15"
            style={{ backgroundImage: `url(${previewUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          />
          <div className="flex gap-3">
            <input
              type="text"
              value={customName}
              onChange={e => setCustomName(e.target.value)}
              placeholder="Name this environment (optional)"
              className="flex-1 bg-white/5 border border-white/15 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#FF4C4C]/50"
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => { setPreviewUrl(''); setCustomName(''); setError(''); }}
              className="flex-1 border-white/20 text-white hover:bg-white/10 rounded-xl"
            >
              Choose Different
            </Button>
            <Button
              onClick={handleAdd}
              className="flex-1 bg-[#FF4C4C] hover:bg-[#FF5E5E] text-white rounded-xl"
            >
              <Check className="w-4 h-4 mr-2" />
              Add Environment
            </Button>
          </div>
        </div>
      )}

      {error && (
        <p className="text-red-400 text-xs text-center">{error}</p>
      )}
    </div>
  );
}

// ── Main Modal ─────────────────────────────────────────────────────────────────
export function EnvironmentSelectorModal() {
  const {
    currentEnvironment,
    setEnvironment,
    setDefaultEnvironment,
    isModalOpen,
    closeModal,
    defaultEnvironment,
    customEnvironments,
    addCustomEnvironment,
    removeCustomEnvironment,
  } = useEnvironment();

  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [activeFilter, setActiveFilter] = useState<IndustryTag | 'all' | 'custom'>('all');
  const [showUploadPanel, setShowUploadPanel] = useState(false);

  if (!isModalOpen) return null;

  const allEnvs = [...environments, ...customEnvironments];

  // Count environments per tag
  const tagCounts: Partial<Record<IndustryTag, number>> = {};
  environments.forEach(env => {
    env.industryTags?.forEach(tag => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const orderedTags = INDUSTRY_SECTIONS.map(s => s.tag).filter(t => (tagCounts[t] || 0) > 0);

  // Filtered environments
  const filteredEnvironments =
    activeFilter === 'all'
      ? environments
      : activeFilter === 'custom'
      ? customEnvironments
      : environments.filter(e => e.industryTags?.includes(activeFilter));

  // Build grouped sections for "All" view
  const buildSections = () => {
    const seen = new Set<string>();
    return INDUSTRY_SECTIONS.map(section => {
      const sectionEnvs = environments.filter(
        e => e.industryTags?.includes(section.tag) && !seen.has(e.id)
      );
      sectionEnvs.forEach(e => seen.add(e.id));
      return { ...section, envs: sectionEnvs };
    }).filter(s => s.envs.length > 0);
  };

  const handleCardClick = (env: Environment) => {
    setSelectedEnvironment(env);
    setShowConfirmation(true);
    setShowUploadPanel(false);
  };

  const handlePreviewOnly = () => {
    if (selectedEnvironment) setEnvironment(selectedEnvironment.id);
    setShowConfirmation(false);
    setSelectedEnvironment(null);
    closeModal();
  };

  const handleSetAsDefault = () => {
    if (selectedEnvironment) setDefaultEnvironment(selectedEnvironment.id);
    setShowConfirmation(false);
    setSelectedEnvironment(null);
    closeModal();
  };

  const handleClose = () => {
    setShowConfirmation(false);
    setShowUploadPanel(false);
    setSelectedEnvironment(null);
    closeModal();
  };

  const handleCustomAdd = (name: string, url: string) => {
    addCustomEnvironment(name, url);
    setShowUploadPanel(false);
    closeModal();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) handleClose();
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      style={{ animation: 'fadeIn 0.3s ease-out' }}
    >
      <div className="absolute inset-0 bg-black/65 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-[24px] border border-white/10 flex flex-col"
        style={{
          background: 'rgba(14, 14, 18, 0.95)',
          backdropFilter: 'blur(40px)',
          boxShadow: '0 25px 60px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)',
          animation: 'modalSlideIn 0.4s ease-out',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF4C4C] to-[#FF8C8C] flex items-center justify-center shadow-lg">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Choose Your Environment</h2>
              <p className="text-sm text-white/45">
                {allEnvs.length} environments across 8 industries
                {customEnvironments.length > 0 && ` · ${customEnvironments.length} custom`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => { setShowUploadPanel(true); setShowConfirmation(false); setActiveFilter('custom'); }}
              className="bg-white/10 hover:bg-white/15 text-white border border-white/15 rounded-full px-4 py-2 text-sm flex items-center gap-2"
              variant="outline"
            >
              <Plus className="w-4 h-4" />
              Upload Custom
            </Button>
            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto flex-1 min-h-0">
          {showUploadPanel ? (
            /* Upload Panel */
            <div className="p-6 max-w-2xl mx-auto" style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => setShowUploadPanel(false)}
                  className="text-white/40 hover:text-white/70 text-sm transition-colors"
                >
                  ← Back
                </button>
                <h3 className="text-lg font-semibold text-white">Upload Custom Environment</h3>
              </div>
              <p className="text-white/50 text-sm mb-6">
                Upload your own gym or studio photo to use as a cinematic backdrop. Your image is stored locally in your browser.
              </p>
              <CustomUploadPanel onAdd={handleCustomAdd} />

              {/* Existing custom environments */}
              {customEnvironments.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-sm font-semibold text-white/60 mb-3">Your Custom Environments</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {customEnvironments.map(env => (
                      <EnvironmentCard
                        key={env.id}
                        env={env}
                        currentEnvironmentId={currentEnvironment.id}
                        defaultEnvironment={defaultEnvironment}
                        onClick={handleCardClick}
                        onDelete={removeCustomEnvironment}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : showConfirmation ? (
            /* Confirmation Panel */
            <div className="flex flex-col items-center justify-center py-12 px-6" style={{ animation: 'fadeIn 0.3s ease-out' }}>
              <div
                className="w-80 h-48 rounded-[20px] mb-6 overflow-hidden border border-white/20"
                style={{
                  backgroundImage: `url(${selectedEnvironment?.backgroundImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  boxShadow: `0 0 50px ${selectedEnvironment?.accentColor}35`,
                }}
              />
              <h3 className="text-2xl font-semibold text-white mb-1">{selectedEnvironment?.name}</h3>
              <p className="text-white/55 text-sm mb-4 text-center max-w-sm">{selectedEnvironment?.description}</p>

              {selectedEnvironment?.industryTags && selectedEnvironment.industryTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 justify-center mb-7">
                  {selectedEnvironment.industryTags.map(tag => (
                    <IndustryTagBadge key={tag} tag={tag as IndustryTag} />
                  ))}
                </div>
              )}

              <p className="text-white/35 text-sm mb-8 text-center">
                Set this as your default environment or just preview it now?
              </p>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handlePreviewOnly}
                  className="px-6 py-2 rounded-full border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                >
                  Preview Only
                </Button>
                <Button
                  onClick={handleSetAsDefault}
                  className="px-6 py-2 rounded-full bg-[#FF4C4C] hover:bg-[#FF5E5E] text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Set as Default
                </Button>
              </div>

              <button
                onClick={() => setShowConfirmation(false)}
                className="mt-6 text-white/40 hover:text-white/70 text-sm transition-colors"
              >
                ← Back to environments
              </button>
            </div>
          ) : (
            /* Main Grid */
            <div className="p-6">
              {/* Filter Pills */}
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border ${
                    activeFilter === 'all'
                      ? 'bg-white/20 text-white border-white/30'
                      : 'bg-white/5 text-white/50 border-white/10 hover:bg-white/10 hover:text-white/80'
                  }`}
                >
                  All ({environments.length})
                </button>
                {orderedTags.map(tag => {
                  const section = INDUSTRY_SECTIONS.find(s => s.tag === tag);
                  const count = tagCounts[tag] || 0;
                  const isActive = activeFilter === tag;
                  return (
                    <button
                      key={tag}
                      onClick={() => setActiveFilter(tag)}
                      className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border flex items-center gap-1.5"
                      style={
                        isActive
                          ? { background: `${TAG_COLORS[tag]}28`, borderColor: `${TAG_COLORS[tag]}55`, color: TAG_COLORS[tag] }
                          : { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }
                      }
                    >
                      <span>{section?.emoji}</span>
                      {TAG_LABELS[tag]}
                      <span
                        className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                        style={
                          isActive
                            ? { background: `${TAG_COLORS[tag]}33`, color: TAG_COLORS[tag] }
                            : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }
                        }
                      >
                        {count}
                      </span>
                    </button>
                  );
                })}
                {customEnvironments.length > 0 && (
                  <button
                    onClick={() => setActiveFilter('custom')}
                    className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200 border flex items-center gap-1.5"
                    style={
                      activeFilter === 'custom'
                        ? { background: 'rgba(255,76,76,0.2)', borderColor: 'rgba(255,76,76,0.4)', color: '#FF4C4C' }
                        : { background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }
                    }
                  >
                    <Upload className="w-3 h-3" />
                    My Uploads
                    <span
                      className="px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                      style={
                        activeFilter === 'custom'
                          ? { background: 'rgba(255,76,76,0.3)', color: '#FF4C4C' }
                          : { background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }
                      }
                    >
                      {customEnvironments.length}
                    </span>
                  </button>
                )}
              </div>

              {/* Environment Grid */}
              {activeFilter === 'all' ? (
                <div className="space-y-8">
                  {buildSections().map(section => (
                    <div key={section.tag}>
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">{section.emoji}</span>
                        <h3 className="text-sm font-semibold text-white/80">{section.label}</h3>
                        <div className="flex-1 h-px bg-white/10 ml-2" />
                        <span
                          className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                          style={{ background: `${TAG_COLORS[section.tag]}20`, color: TAG_COLORS[section.tag], border: `1px solid ${TAG_COLORS[section.tag]}35` }}
                        >
                          {section.envs.length} environments
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {section.envs.map(env => (
                          <EnvironmentCard
                            key={env.id}
                            env={env}
                            currentEnvironmentId={currentEnvironment.id}
                            defaultEnvironment={defaultEnvironment}
                            onClick={handleCardClick}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : activeFilter === 'custom' ? (
                <div>
                  {customEnvironments.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                        <Upload className="w-7 h-7 text-white/30" />
                      </div>
                      <p className="text-white/50 text-sm mb-2">No custom environments yet</p>
                      <p className="text-white/30 text-xs mb-6">Upload your own gym or studio photo to get started</p>
                      <Button
                        onClick={() => setShowUploadPanel(true)}
                        className="bg-[#FF4C4C] hover:bg-[#FF5E5E] text-white rounded-full px-6"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Your First Environment
                      </Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {customEnvironments.map(env => (
                        <EnvironmentCard
                          key={env.id}
                          env={env}
                          currentEnvironmentId={currentEnvironment.id}
                          defaultEnvironment={defaultEnvironment}
                          onClick={handleCardClick}
                          onDelete={removeCustomEnvironment}
                        />
                      ))}
                      {/* Add more button */}
                      <button
                        onClick={() => setShowUploadPanel(true)}
                        className="aspect-[16/10] rounded-[18px] border-2 border-dashed border-white/15 flex flex-col items-center justify-center gap-2 hover:border-[#FF4C4C]/50 hover:bg-[#FF4C4C]/5 transition-all duration-200"
                      >
                        <Plus className="w-6 h-6 text-white/30" />
                        <span className="text-white/40 text-xs">Add Another</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredEnvironments.map(env => (
                    <EnvironmentCard
                      key={env.id}
                      env={env}
                      currentEnvironmentId={currentEnvironment.id}
                      defaultEnvironment={defaultEnvironment}
                      onClick={handleCardClick}
                    />
                  ))}
                  {filteredEnvironments.length === 0 && (
                    <div className="col-span-3 text-center py-12 text-white/40">
                      <Sparkles className="w-8 h-8 mx-auto mb-3 opacity-40" />
                      <p className="text-sm">No environments found for this filter.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes modalSlideIn { from { opacity: 0; transform: scale(0.95) translateY(20px); } to { opacity: 1; transform: scale(1) translateY(0); } }
      `}</style>
    </div>
  );
}
