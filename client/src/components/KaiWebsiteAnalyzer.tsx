import React, { useState } from 'react';
import { trpc } from '../lib/trpc';
import { Globe, Loader2, CheckCircle, XCircle, ChevronDown, ChevronUp, Save, X, MapPin, Phone, Mail, Calendar, Users, Briefcase, AlertCircle } from 'lucide-react';

interface AnalyzedData {
  schoolName?: string | null;
  displayName?: string | null;
  tagline?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  addressStreet?: string | null;
  addressCity?: string | null;
  addressState?: string | null;
  addressPostal?: string | null;
  addressCountry?: string | null;
  logoUrl?: string | null;
  brandColorPrimary?: string | null;
  timezone?: string | null;
  programs?: Array<{
    name: string;
    description?: string | null;
    ageRange?: string | null;
    price?: number | null;
    billing?: string | null;
  }>;
  classes?: Array<{
    name: string;
    instructor?: string | null;
    dayOfWeek?: string | null;
    startTime?: string | null;
    endTime?: string | null;
    program?: string | null;
    level?: string | null;
  }>;
  instructors?: Array<{
    name: string;
    bio?: string | null;
    specialties?: string | null;
    certifications?: string | null;
  }>;
  socialLinks?: {
    facebook?: string | null;
    instagram?: string | null;
    youtube?: string | null;
    twitter?: string | null;
  };
  confidence?: {
    overall: 'high' | 'medium' | 'low';
    notes: string;
  };
}

interface Props {
  onClose: () => void;
  initialUrl?: string;
}

type Step = 'input' | 'analyzing' | 'review' | 'saving' | 'done';

export default function KaiWebsiteAnalyzer({ onClose, initialUrl = '' }: Props) {
  const [url, setUrl] = useState(initialUrl);
  const [step, setStep] = useState<Step>('input');
  const [data, setData] = useState<AnalyzedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['identity', 'contact', 'address']));
  const [saveResults, setSaveResults] = useState<string[]>([]);

  // Selected fields to save (user can deselect)
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const analyzeMutation = trpc.kai.analyzeSchoolWebsite.useMutation({
    onSuccess: (result) => {
      setData(result.data);
      // Auto-select all non-null fields
      const autoSelected = new Set<string>();
      const d = result.data;
      if (d.schoolName) autoSelected.add('schoolName');
      if (d.displayName) autoSelected.add('displayName');
      if (d.tagline) autoSelected.add('tagline');
      if (d.phone) autoSelected.add('phone');
      if (d.email) autoSelected.add('email');
      if (d.website) autoSelected.add('website');
      if (d.addressStreet) autoSelected.add('addressStreet');
      if (d.addressCity) autoSelected.add('addressCity');
      if (d.addressState) autoSelected.add('addressState');
      if (d.addressPostal) autoSelected.add('addressPostal');
      if (d.addressCountry) autoSelected.add('addressCountry');
      if (d.logoUrl) autoSelected.add('logoUrl');
      if (d.brandColorPrimary) autoSelected.add('brandColorPrimary');
      if (d.timezone) autoSelected.add('timezone');
      if (d.programs?.length) autoSelected.add('programs');
      if (d.classes?.length) autoSelected.add('classes');
      if (d.instructors?.length) autoSelected.add('instructors');
      setSelected(autoSelected);
      setStep('review');
    },
    onError: (err) => {
      setError(err.message);
      setStep('input');
    },
  });

  const populateMutation = trpc.kai.populateSchoolFromWebsite.useMutation({
    onSuccess: (result) => {
      setSaveResults(result.results);
      setStep('done');
    },
    onError: (err) => {
      setError(err.message);
      setStep('review');
    },
  });

  const handleAnalyze = () => {
    if (!url.trim()) return;
    setError(null);
    setStep('analyzing');
    analyzeMutation.mutate({ url: url.trim() });
  };

  const handleSave = () => {
    if (!data) return;
    setStep('saving');
    const payload: any = {};
    if (selected.has('schoolName') && data.schoolName) payload.schoolName = data.schoolName;
    if (selected.has('displayName') && data.displayName) payload.displayName = data.displayName;
    if (selected.has('tagline') && data.tagline) payload.tagline = data.tagline;
    if (selected.has('phone') && data.phone) payload.phone = data.phone;
    if (selected.has('email') && data.email) payload.email = data.email;
    if (selected.has('website') && data.website) payload.website = data.website;
    if (selected.has('addressStreet') && data.addressStreet) payload.addressStreet = data.addressStreet;
    if (selected.has('addressCity') && data.addressCity) payload.addressCity = data.addressCity;
    if (selected.has('addressState') && data.addressState) payload.addressState = data.addressState;
    if (selected.has('addressPostal') && data.addressPostal) payload.addressPostal = data.addressPostal;
    if (selected.has('addressCountry') && data.addressCountry) payload.addressCountry = data.addressCountry;
    if (selected.has('logoUrl') && data.logoUrl) payload.logoUrl = data.logoUrl;
    if (selected.has('brandColorPrimary') && data.brandColorPrimary) payload.brandColorPrimary = data.brandColorPrimary;
    if (selected.has('timezone') && data.timezone) payload.timezone = data.timezone;
    if (selected.has('programs') && data.programs?.length) payload.programs = data.programs;
    if (selected.has('classes') && data.classes?.length) payload.classes = data.classes;
    if (selected.has('instructors') && data.instructors?.length) payload.instructors = data.instructors;
    populateMutation.mutate(payload);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      return next;
    });
  };

  const toggleField = (field: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(field)) next.delete(field);
      else next.add(field);
      return next;
    });
  };

  const confidenceColor = {
    high: 'text-green-400',
    medium: 'text-yellow-400',
    low: 'text-red-400',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Globe className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base">Kai Website Analyzer</h2>
              <p className="text-white/40 text-xs">Auto-populate your school info from your website</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Step: Input */}
          {(step === 'input' || step === 'analyzing') && (
            <div className="space-y-4">
              <p className="text-white/60 text-sm leading-relaxed">
                Enter your school's website URL and Kai will scan it to extract your school name, address, phone, logo, programs, class schedules, instructors, and more — then save everything directly to DojoFlow.
              </p>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                  placeholder="https://yourdojo.com"
                  disabled={step === 'analyzing'}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-blue-500/50 focus:bg-white/8 transition-all disabled:opacity-50"
                />
                <button
                  onClick={handleAnalyze}
                  disabled={!url.trim() || step === 'analyzing'}
                  className="px-5 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-2"
                >
                  {step === 'analyzing' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Globe className="w-4 h-4" />
                      Analyze
                    </>
                  )}
                </button>
              </div>
              {step === 'analyzing' && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin flex-shrink-0" />
                    <div>
                      <p className="text-blue-300 text-sm font-medium">Scanning website...</p>
                      <p className="text-blue-400/60 text-xs mt-0.5">Kai is reading your website and extracting school information. This may take 10–20 seconds.</p>
                    </div>
                  </div>
                </div>
              )}
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Step: Review */}
          {(step === 'review' || step === 'saving') && data && (
            <div className="space-y-4">
              {/* Confidence badge */}
              {data.confidence && (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-white/40">Confidence:</span>
                  <span className={`font-medium capitalize ${confidenceColor[data.confidence.overall]}`}>
                    {data.confidence.overall}
                  </span>
                  <span className="text-white/30">—</span>
                  <span className="text-white/40 text-xs">{data.confidence.notes}</span>
                </div>
              )}

              <p className="text-white/50 text-xs">
                Review the extracted data below. Uncheck any fields you don't want to save, then click <strong className="text-white/70">Save to DojoFlow</strong>.
              </p>

              {/* Identity Section */}
              <Section
                title="School Identity"
                icon={<Briefcase className="w-4 h-4" />}
                expanded={expandedSections.has('identity')}
                onToggle={() => toggleSection('identity')}
              >
                {data.logoUrl && (
                  <FieldRow label="Logo" fieldKey="logoUrl" selected={selected} onToggle={toggleField}>
                    <img src={data.logoUrl} alt="Logo" className="h-8 object-contain rounded" onError={e => (e.currentTarget.style.display = 'none')} />
                    <span className="text-white/40 text-xs truncate max-w-[200px]">{data.logoUrl}</span>
                  </FieldRow>
                )}
                {data.schoolName && <FieldRow label="School Name" fieldKey="schoolName" selected={selected} onToggle={toggleField}><span className="text-white text-sm">{data.schoolName}</span></FieldRow>}
                {data.displayName && <FieldRow label="Display Name" fieldKey="displayName" selected={selected} onToggle={toggleField}><span className="text-white text-sm">{data.displayName}</span></FieldRow>}
                {data.tagline && <FieldRow label="Tagline" fieldKey="tagline" selected={selected} onToggle={toggleField}><span className="text-white/70 text-sm italic">"{data.tagline}"</span></FieldRow>}
                {data.brandColorPrimary && (
                  <FieldRow label="Brand Color" fieldKey="brandColorPrimary" selected={selected} onToggle={toggleField}>
                    <div className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: data.brandColorPrimary }} />
                    <span className="text-white/70 text-sm">{data.brandColorPrimary}</span>
                  </FieldRow>
                )}
                {data.timezone && <FieldRow label="Timezone" fieldKey="timezone" selected={selected} onToggle={toggleField}><span className="text-white/70 text-sm">{data.timezone}</span></FieldRow>}
              </Section>

              {/* Contact Section */}
              <Section
                title="Contact Info"
                icon={<Phone className="w-4 h-4" />}
                expanded={expandedSections.has('contact')}
                onToggle={() => toggleSection('contact')}
              >
                {data.phone && <FieldRow label="Phone" fieldKey="phone" selected={selected} onToggle={toggleField}><span className="text-white text-sm">{data.phone}</span></FieldRow>}
                {data.email && <FieldRow label="Email" fieldKey="email" selected={selected} onToggle={toggleField}><span className="text-white text-sm">{data.email}</span></FieldRow>}
                {data.website && <FieldRow label="Website" fieldKey="website" selected={selected} onToggle={toggleField}><span className="text-blue-400 text-sm">{data.website}</span></FieldRow>}
              </Section>

              {/* Address Section */}
              <Section
                title="Address"
                icon={<MapPin className="w-4 h-4" />}
                expanded={expandedSections.has('address')}
                onToggle={() => toggleSection('address')}
              >
                {data.addressStreet && <FieldRow label="Street" fieldKey="addressStreet" selected={selected} onToggle={toggleField}><span className="text-white text-sm">{data.addressStreet}</span></FieldRow>}
                {data.addressCity && <FieldRow label="City" fieldKey="addressCity" selected={selected} onToggle={toggleField}><span className="text-white text-sm">{data.addressCity}</span></FieldRow>}
                {data.addressState && <FieldRow label="State" fieldKey="addressState" selected={selected} onToggle={toggleField}><span className="text-white text-sm">{data.addressState}</span></FieldRow>}
                {data.addressPostal && <FieldRow label="Postal" fieldKey="addressPostal" selected={selected} onToggle={toggleField}><span className="text-white text-sm">{data.addressPostal}</span></FieldRow>}
                {data.addressCountry && <FieldRow label="Country" fieldKey="addressCountry" selected={selected} onToggle={toggleField}><span className="text-white text-sm">{data.addressCountry}</span></FieldRow>}
              </Section>

              {/* Programs */}
              {data.programs && data.programs.length > 0 && (
                <Section
                  title={`Programs (${data.programs.length})`}
                  icon={<Briefcase className="w-4 h-4" />}
                  expanded={expandedSections.has('programs')}
                  onToggle={() => toggleSection('programs')}
                >
                  <div className="flex items-center gap-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has('programs')}
                      onChange={() => toggleField('programs')}
                      className="w-4 h-4 rounded accent-blue-500"
                    />
                    <span className="text-white/50 text-xs">Save all {data.programs.length} programs</span>
                  </div>
                  <div className="space-y-2 mt-1">
                    {data.programs.map((p, i) => (
                      <div key={i} className="bg-white/5 rounded-lg px-3 py-2">
                        <p className="text-white text-sm font-medium">{p.name}</p>
                        {p.ageRange && <p className="text-white/40 text-xs">Ages: {p.ageRange}</p>}
                        {p.description && <p className="text-white/50 text-xs mt-1 line-clamp-2">{p.description}</p>}
                        {p.price && <p className="text-green-400 text-xs">${p.price}/mo</p>}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Classes */}
              {data.classes && data.classes.length > 0 && (
                <Section
                  title={`Class Schedule (${data.classes.length})`}
                  icon={<Calendar className="w-4 h-4" />}
                  expanded={expandedSections.has('classes')}
                  onToggle={() => toggleSection('classes')}
                >
                  <div className="flex items-center gap-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has('classes')}
                      onChange={() => toggleField('classes')}
                      className="w-4 h-4 rounded accent-blue-500"
                    />
                    <span className="text-white/50 text-xs">Save all {data.classes.length} classes</span>
                  </div>
                  <div className="space-y-2 mt-1">
                    {data.classes.map((c, i) => (
                      <div key={i} className="bg-white/5 rounded-lg px-3 py-2 flex items-center justify-between">
                        <div>
                          <p className="text-white text-sm font-medium">{c.name}</p>
                          {c.instructor && <p className="text-white/40 text-xs">Instructor: {c.instructor}</p>}
                        </div>
                        {(c.dayOfWeek || c.startTime) && (
                          <div className="text-right">
                            {c.dayOfWeek && <p className="text-blue-400 text-xs">{c.dayOfWeek}</p>}
                            {c.startTime && <p className="text-white/50 text-xs">{c.startTime}{c.endTime ? ` – ${c.endTime}` : ''}</p>}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {/* Instructors */}
              {data.instructors && data.instructors.length > 0 && (
                <Section
                  title={`Instructors (${data.instructors.length})`}
                  icon={<Users className="w-4 h-4" />}
                  expanded={expandedSections.has('instructors')}
                  onToggle={() => toggleSection('instructors')}
                >
                  <div className="flex items-center gap-3 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has('instructors')}
                      onChange={() => toggleField('instructors')}
                      className="w-4 h-4 rounded accent-blue-500"
                    />
                    <span className="text-white/50 text-xs">Save all {data.instructors.length} instructors</span>
                  </div>
                  <div className="space-y-2 mt-1">
                    {data.instructors.map((inst, i) => (
                      <div key={i} className="bg-white/5 rounded-lg px-3 py-2">
                        <p className="text-white text-sm font-medium">{inst.name}</p>
                        {inst.specialties && <p className="text-white/40 text-xs">{inst.specialties}</p>}
                        {inst.bio && <p className="text-white/50 text-xs mt-1 line-clamp-2">{inst.bio}</p>}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-red-300 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Step: Done */}
          {step === 'done' && (
            <div className="space-y-4 text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">All Done!</h3>
                <p className="text-white/50 text-sm mt-1">Your school information has been saved to DojoFlow.</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 text-left space-y-2">
                {saveResults.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                    <span className="text-white/70">{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex items-center justify-between">
          {step === 'review' || step === 'saving' ? (
            <>
              <button
                onClick={() => setStep('input')}
                disabled={step === 'saving'}
                className="text-white/40 hover:text-white text-sm transition-colors disabled:opacity-30"
              >
                ← Try different URL
              </button>
              <button
                onClick={handleSave}
                disabled={selected.size === 0 || step === 'saving'}
                className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-2"
              >
                {step === 'saving' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Save {selected.size} field{selected.size !== 1 ? 's' : ''} to DojoFlow
                  </>
                )}
              </button>
            </>
          ) : step === 'done' ? (
            <button
              onClick={onClose}
              className="ml-auto px-6 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-sm font-medium transition-all"
            >
              Close
            </button>
          ) : (
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white text-sm transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper components
function Section({
  title, icon, expanded, onToggle, children,
}: {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border border-white/8 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-white/3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2 text-white/70">
          {icon}
          <span className="text-sm font-medium">{title}</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
      </button>
      {expanded && <div className="px-4 pb-3 space-y-2">{children}</div>}
    </div>
  );
}

function FieldRow({
  label, fieldKey, selected, onToggle, children,
}: {
  label: string;
  fieldKey: string;
  selected: Set<string>;
  onToggle: (key: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <input
        type="checkbox"
        checked={selected.has(fieldKey)}
        onChange={() => onToggle(fieldKey)}
        className="w-4 h-4 rounded accent-blue-500 flex-shrink-0"
      />
      <span className="text-white/40 text-xs w-24 flex-shrink-0">{label}</span>
      <div className="flex items-center gap-2 flex-1 min-w-0">{children}</div>
    </div>
  );
}
