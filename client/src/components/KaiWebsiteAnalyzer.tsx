import React, { useState, useEffect } from 'react';
import { trpc } from '../lib/trpc';
import {
  Globe, Loader2, CheckCircle, ChevronDown, ChevronUp,
  Save, X, MapPin, Phone, Calendar, Users, Briefcase,
  AlertCircle, RefreshCw, ArrowRight, Sparkles
} from 'lucide-react';

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
  confidence?: {
    overall: 'high' | 'medium' | 'low';
    notes: string;
  };
}

interface Props {
  onClose: () => void;
  initialUrl?: string;
  rescanMode?: boolean;
}

type Step = 'input' | 'analyzing' | 'review' | 'saving' | 'done';
type ChangeStatus = 'new' | 'changed' | 'unchanged' | 'empty';

interface FieldDiff {
  status: ChangeStatus;
  oldValue?: string | null;
  newValue?: string | null;
}

export default function KaiWebsiteAnalyzer({ onClose, initialUrl = '', rescanMode = false }: Props) {
  const [url, setUrl] = useState(initialUrl);
  const [step, setStep] = useState<Step>('input');
  const [data, setData] = useState<AnalyzedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['identity', 'contact', 'address'])
  );
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [saveResults, setSaveResults] = useState<string[]>([]);
  const [fieldDiffs, setFieldDiffs] = useState<Record<string, FieldDiff>>({});
  const [changedCount, setChangedCount] = useState(0);

  const { data: currentProfile } = trpc.schoolProfile.get.useQuery(undefined, {
    enabled: rescanMode || step === 'review',
  });

  const analyzeMutation = trpc.kai.analyzeSchoolWebsite.useMutation({
    onSuccess: (result) => {
      setData(result.data);
      const d = result.data;
      const diffs: Record<string, FieldDiff> = {};
      let changes = 0;

      const scalarFields: Array<keyof AnalyzedData> = [
        'schoolName', 'displayName', 'tagline', 'phone', 'email', 'website',
        'addressStreet', 'addressCity', 'addressState', 'addressPostal', 'addressCountry',
        'logoUrl', 'brandColorPrimary', 'timezone',
      ];

      const autoSelected = new Set<string>();

      for (const field of scalarFields) {
        const newVal = d[field] as string | null | undefined;
        const oldVal = currentProfile ? (currentProfile as any)[field] as string | null | undefined : undefined;

        if (!newVal) {
          diffs[field] = { status: 'empty' };
          continue;
        }
        if (!oldVal) {
          diffs[field] = { status: 'new', newValue: newVal };
          autoSelected.add(field);
          changes++;
        } else if (oldVal !== newVal) {
          diffs[field] = { status: 'changed', oldValue: oldVal, newValue: newVal };
          autoSelected.add(field);
          changes++;
        } else {
          diffs[field] = { status: 'unchanged', oldValue: oldVal, newValue: newVal };
          if (!rescanMode) autoSelected.add(field);
        }
      }

      if (d.programs?.length) { autoSelected.add('programs'); diffs['programs'] = { status: 'new' }; changes++; }
      if (d.classes?.length) { autoSelected.add('classes'); diffs['classes'] = { status: 'new' }; changes++; }
      if (d.instructors?.length) { autoSelected.add('instructors'); diffs['instructors'] = { status: 'new' }; changes++; }

      setFieldDiffs(diffs);
      setChangedCount(changes);
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

  useEffect(() => {
    if (rescanMode && currentProfile?.website && !url) {
      setUrl(currentProfile.website);
    }
  }, [rescanMode, currentProfile]);

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

  const confidenceColor = { high: 'text-green-600 dark:text-green-400', medium: 'text-yellow-600 dark:text-yellow-400', low: 'text-red-600 dark:text-red-400' };

  const getDiffBadge = (fieldKey: string) => {
    const diff = fieldDiffs[fieldKey];
    if (!diff || diff.status === 'empty') return null;
    if (diff.status === 'new') return (
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-100 dark:bg-green-500/20 text-green-700 dark:text-green-400 uppercase tracking-wide">New</span>
    );
    if (diff.status === 'changed') return (
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/20 text-amber-700 dark:text-amber-400 uppercase tracking-wide">Changed</span>
    );
    if (diff.status === 'unchanged') return (
      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground uppercase tracking-wide">Same</span>
    );
    return null;
  };

  const getDiffRowClass = (fieldKey: string) => {
    const diff = fieldDiffs[fieldKey];
    if (!diff) return '';
    if (diff.status === 'new') return 'bg-green-50 dark:bg-green-500/5 border-l-2 border-green-500/50 pl-2 rounded-r-lg';
    if (diff.status === 'changed') return 'bg-amber-50 dark:bg-amber-500/5 border-l-2 border-amber-500/50 pl-2 rounded-r-lg';
    return '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              {rescanMode ? <RefreshCw className="w-5 h-5 text-white" /> : <Globe className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h2 className="text-foreground font-semibold text-base">
                {rescanMode ? 'Re-scan Website' : 'Kai Website Analyzer'}
              </h2>
              <p className="text-muted-foreground text-xs">
                {rescanMode
                  ? 'Detect changes since your last scan and update your profile'
                  : 'Auto-populate your school info from your website'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Step: Input / Analyzing */}
          {(step === 'input' || step === 'analyzing') && (
            <div className="space-y-4">
              {rescanMode && currentProfile?.website && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted rounded-xl px-4 py-3">
                  <Globe className="w-4 h-4 flex-shrink-0" />
                  <span>Last saved website: <span className="text-blue-500">{currentProfile.website}</span></span>
                </div>
              )}
              <p className="text-muted-foreground text-sm leading-relaxed">
                {rescanMode
                  ? 'Kai will re-scan your website and highlight any fields that have changed since your last scan.'
                  : "Enter your school's website URL and Kai will scan it to extract your school name, address, phone, logo, programs, class schedules, instructors, and more."}
              </p>
              <div className="flex gap-3">
                <input
                  type="url"
                  value={url}
                  onChange={e => setUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
                  placeholder="https://yourdojo.com"
                  disabled={step === 'analyzing'}
                  className="flex-1 bg-background border border-border rounded-xl px-4 py-3 text-foreground placeholder-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all disabled:opacity-50"
                />
                <button
                  onClick={handleAnalyze}
                  disabled={!url.trim() || step === 'analyzing'}
                  className="px-5 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-2"
                >
                  {step === 'analyzing' ? (
                    <><Loader2 className="w-4 h-4 animate-spin" />Scanning...</>
                  ) : rescanMode ? (
                    <><RefreshCw className="w-4 h-4" />Re-scan</>
                  ) : (
                    <><Globe className="w-4 h-4" />Analyze</>
                  )}
                </button>
              </div>
              {step === 'analyzing' && (
                <div className="bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin flex-shrink-0" />
                    <div>
                      <p className="text-blue-700 dark:text-blue-300 text-sm font-medium">
                        {rescanMode ? 'Re-scanning website...' : 'Scanning website...'}
                      </p>
                      <p className="text-blue-600/70 dark:text-blue-400/60 text-xs mt-0.5">
                        Kai is reading your website and extracting school information. This may take 10–20 seconds.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {error && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Step: Review */}
          {(step === 'review' || step === 'saving') && data && (
            <div className="space-y-4">
              {/* Summary bar */}
              <div className="flex items-center gap-3 flex-wrap">
                {data.confidence && (
                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="text-muted-foreground">Confidence:</span>
                    <span className={`font-medium capitalize ${confidenceColor[data.confidence.overall]}`}>
                      {data.confidence.overall}
                    </span>
                  </div>
                )}
                {rescanMode && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground text-xs">|</span>
                    {changedCount > 0 ? (
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                        <span className="text-amber-600 dark:text-amber-400 text-sm font-medium">{changedCount} change{changedCount !== 1 ? 's' : ''} detected</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        <span className="text-green-600 dark:text-green-400 text-sm">No changes detected</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Legend for rescan mode */}
              {rescanMode && changedCount > 0 && (
                <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted rounded-xl px-4 py-2.5">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span>New field</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Changed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-border" />
                    <span>Unchanged</span>
                  </div>
                </div>
              )}

              <p className="text-muted-foreground text-xs">
                {rescanMode
                  ? "Changed and new fields are pre-selected. Uncheck any you don't want to update."
                  : "Review the extracted data. Uncheck any fields you don't want to save."}
              </p>

              {/* Identity Section */}
              <Section
                title="School Identity"
                icon={<Briefcase className="w-4 h-4" />}
                expanded={expandedSections.has('identity')}
                onToggle={() => toggleSection('identity')}
              >
                {data.logoUrl && (
                  <FieldRow label="Logo" fieldKey="logoUrl" selected={selected} onToggle={toggleField}
                    badge={getDiffBadge('logoUrl')} rowClass={getDiffRowClass('logoUrl')}>
                    <img src={data.logoUrl} alt="Logo" className="h-8 object-contain rounded" onError={e => (e.currentTarget.style.display = 'none')} />
                    <span className="text-muted-foreground text-xs truncate max-w-[180px]">{data.logoUrl}</span>
                  </FieldRow>
                )}
                {data.schoolName && (
                  <FieldRow label="School Name" fieldKey="schoolName" selected={selected} onToggle={toggleField}
                    badge={getDiffBadge('schoolName')} rowClass={getDiffRowClass('schoolName')}>
                    {rescanMode && fieldDiffs['schoolName']?.status === 'changed' ? (
                      <DiffValue old={fieldDiffs['schoolName'].oldValue} next={data.schoolName} />
                    ) : (
                      <span className="text-foreground text-sm">{data.schoolName}</span>
                    )}
                  </FieldRow>
                )}
                {data.displayName && (
                  <FieldRow label="Display Name" fieldKey="displayName" selected={selected} onToggle={toggleField}
                    badge={getDiffBadge('displayName')} rowClass={getDiffRowClass('displayName')}>
                    {rescanMode && fieldDiffs['displayName']?.status === 'changed' ? (
                      <DiffValue old={fieldDiffs['displayName'].oldValue} next={data.displayName} />
                    ) : (
                      <span className="text-foreground text-sm">{data.displayName}</span>
                    )}
                  </FieldRow>
                )}
                {data.tagline && (
                  <FieldRow label="Tagline" fieldKey="tagline" selected={selected} onToggle={toggleField}
                    badge={getDiffBadge('tagline')} rowClass={getDiffRowClass('tagline')}>
                    <span className="text-muted-foreground text-sm italic">"{data.tagline}"</span>
                  </FieldRow>
                )}
                {data.brandColorPrimary && (
                  <FieldRow label="Brand Color" fieldKey="brandColorPrimary" selected={selected} onToggle={toggleField}
                    badge={getDiffBadge('brandColorPrimary')} rowClass={getDiffRowClass('brandColorPrimary')}>
                    <div className="w-5 h-5 rounded-full border border-border" style={{ backgroundColor: data.brandColorPrimary }} />
                    <span className="text-muted-foreground text-sm">{data.brandColorPrimary}</span>
                  </FieldRow>
                )}
                {data.timezone && (
                  <FieldRow label="Timezone" fieldKey="timezone" selected={selected} onToggle={toggleField}
                    badge={getDiffBadge('timezone')} rowClass={getDiffRowClass('timezone')}>
                    <span className="text-muted-foreground text-sm">{data.timezone}</span>
                  </FieldRow>
                )}
              </Section>

              {/* Contact Section */}
              <Section
                title="Contact Info"
                icon={<Phone className="w-4 h-4" />}
                expanded={expandedSections.has('contact')}
                onToggle={() => toggleSection('contact')}
              >
                {data.phone && (
                  <FieldRow label="Phone" fieldKey="phone" selected={selected} onToggle={toggleField}
                    badge={getDiffBadge('phone')} rowClass={getDiffRowClass('phone')}>
                    {rescanMode && fieldDiffs['phone']?.status === 'changed' ? (
                      <DiffValue old={fieldDiffs['phone'].oldValue} next={data.phone} />
                    ) : (
                      <span className="text-foreground text-sm">{data.phone}</span>
                    )}
                  </FieldRow>
                )}
                {data.email && (
                  <FieldRow label="Email" fieldKey="email" selected={selected} onToggle={toggleField}
                    badge={getDiffBadge('email')} rowClass={getDiffRowClass('email')}>
                    {rescanMode && fieldDiffs['email']?.status === 'changed' ? (
                      <DiffValue old={fieldDiffs['email'].oldValue} next={data.email} />
                    ) : (
                      <span className="text-foreground text-sm">{data.email}</span>
                    )}
                  </FieldRow>
                )}
                {data.website && (
                  <FieldRow label="Website" fieldKey="website" selected={selected} onToggle={toggleField}
                    badge={getDiffBadge('website')} rowClass={getDiffRowClass('website')}>
                    <span className="text-blue-500 text-sm">{data.website}</span>
                  </FieldRow>
                )}
              </Section>

              {/* Address Section */}
              <Section
                title="Address"
                icon={<MapPin className="w-4 h-4" />}
                expanded={expandedSections.has('address')}
                onToggle={() => toggleSection('address')}
              >
                {data.addressStreet && (
                  <FieldRow label="Street" fieldKey="addressStreet" selected={selected} onToggle={toggleField}
                    badge={getDiffBadge('addressStreet')} rowClass={getDiffRowClass('addressStreet')}>
                    {rescanMode && fieldDiffs['addressStreet']?.status === 'changed' ? (
                      <DiffValue old={fieldDiffs['addressStreet'].oldValue} next={data.addressStreet} />
                    ) : (
                      <span className="text-foreground text-sm">{data.addressStreet}</span>
                    )}
                  </FieldRow>
                )}
                {data.addressCity && (
                  <FieldRow label="City" fieldKey="addressCity" selected={selected} onToggle={toggleField}
                    badge={getDiffBadge('addressCity')} rowClass={getDiffRowClass('addressCity')}>
                    <span className="text-foreground text-sm">{data.addressCity}</span>
                  </FieldRow>
                )}
                {data.addressState && (
                  <FieldRow label="State" fieldKey="addressState" selected={selected} onToggle={toggleField}
                    badge={getDiffBadge('addressState')} rowClass={getDiffRowClass('addressState')}>
                    <span className="text-foreground text-sm">{data.addressState}</span>
                  </FieldRow>
                )}
                {data.addressPostal && (
                  <FieldRow label="Postal" fieldKey="addressPostal" selected={selected} onToggle={toggleField}
                    badge={getDiffBadge('addressPostal')} rowClass={getDiffRowClass('addressPostal')}>
                    <span className="text-foreground text-sm">{data.addressPostal}</span>
                  </FieldRow>
                )}
                {data.addressCountry && (
                  <FieldRow label="Country" fieldKey="addressCountry" selected={selected} onToggle={toggleField}
                    badge={getDiffBadge('addressCountry')} rowClass={getDiffRowClass('addressCountry')}>
                    <span className="text-foreground text-sm">{data.addressCountry}</span>
                  </FieldRow>
                )}
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
                    <input type="checkbox" checked={selected.has('programs')} onChange={() => toggleField('programs')}
                      className="w-4 h-4 rounded accent-blue-500" />
                    <span className="text-muted-foreground text-xs">Save all {data.programs.length} programs</span>
                    {getDiffBadge('programs')}
                  </div>
                  <div className="space-y-2 mt-1">
                    {data.programs.map((p, i) => (
                      <div key={i} className="bg-muted rounded-lg px-3 py-2">
                        <p className="text-foreground text-sm font-medium">{p.name}</p>
                        {p.ageRange && <p className="text-muted-foreground text-xs">Ages: {p.ageRange}</p>}
                        {p.description && <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{p.description}</p>}
                        {p.price && <p className="text-green-600 dark:text-green-400 text-xs">${p.price}/mo</p>}
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
                    <input type="checkbox" checked={selected.has('classes')} onChange={() => toggleField('classes')}
                      className="w-4 h-4 rounded accent-blue-500" />
                    <span className="text-muted-foreground text-xs">Save all {data.classes.length} classes</span>
                    {getDiffBadge('classes')}
                  </div>
                  <div className="space-y-2 mt-1">
                    {data.classes.map((c, i) => (
                      <div key={i} className="bg-muted rounded-lg px-3 py-2 flex items-center justify-between">
                        <div>
                          <p className="text-foreground text-sm font-medium">{c.name}</p>
                          {c.instructor && <p className="text-muted-foreground text-xs">Instructor: {c.instructor}</p>}
                        </div>
                        {(c.dayOfWeek || c.startTime) && (
                          <div className="text-right">
                            {c.dayOfWeek && <p className="text-blue-500 text-xs">{c.dayOfWeek}</p>}
                            {c.startTime && <p className="text-muted-foreground text-xs">{c.startTime}{c.endTime ? ` – ${c.endTime}` : ''}</p>}
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
                    <input type="checkbox" checked={selected.has('instructors')} onChange={() => toggleField('instructors')}
                      className="w-4 h-4 rounded accent-blue-500" />
                    <span className="text-muted-foreground text-xs">Save all {data.instructors.length} instructors</span>
                    {getDiffBadge('instructors')}
                  </div>
                  <div className="space-y-2 mt-1">
                    {data.instructors.map((inst, i) => (
                      <div key={i} className="bg-muted rounded-lg px-3 py-2">
                        <p className="text-foreground text-sm font-medium">{inst.name}</p>
                        {inst.specialties && <p className="text-muted-foreground text-xs">{inst.specialties}</p>}
                        {inst.bio && <p className="text-muted-foreground text-xs mt-1 line-clamp-2">{inst.bio}</p>}
                      </div>
                    ))}
                  </div>
                </Section>
              )}

              {error && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* Step: Done */}
          {step === 'done' && (
            <div className="space-y-4 text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/20 flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="text-foreground font-semibold text-lg">
                  {rescanMode ? 'Profile Updated!' : 'All Done!'}
                </h3>
                <p className="text-muted-foreground text-sm mt-1">
                  {rescanMode
                    ? 'Your school profile has been updated with the latest information.'
                    : 'Your school information has been saved to DojoFlow.'}
                </p>
              </div>
              <div className="bg-muted rounded-xl p-4 text-left space-y-2">
                {saveResults.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span className="text-muted-foreground">{r}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-between">
          {step === 'review' || step === 'saving' ? (
            <>
              <button
                onClick={() => setStep('input')}
                disabled={step === 'saving'}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors disabled:opacity-30"
              >
                ← Try different URL
              </button>
              <button
                onClick={handleSave}
                disabled={selected.size === 0 || step === 'saving'}
                className="px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-all flex items-center gap-2"
              >
                {step === 'saving' ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Saving...</>
                ) : (
                  <><Save className="w-4 h-4" />
                    {rescanMode
                      ? `Apply ${selected.size} update${selected.size !== 1 ? 's' : ''}`
                      : `Save ${selected.size} field${selected.size !== 1 ? 's' : ''} to DojoFlow`}
                  </>
                )}
              </button>
            </>
          ) : step === 'done' ? (
            <button
              onClick={onClose}
              className="ml-auto px-6 py-2.5 bg-muted hover:bg-muted/80 text-foreground rounded-xl text-sm font-medium transition-all"
            >
              Close
            </button>
          ) : (
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-foreground text-sm transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function DiffValue({ old: oldVal, next: newVal }: { old?: string | null; next?: string | null }) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-muted-foreground text-sm line-through">{oldVal}</span>
      <ArrowRight className="w-3 h-3 text-amber-500 flex-shrink-0" />
      <span className="text-amber-600 dark:text-amber-300 text-sm font-medium">{newVal}</span>
    </div>
  );
}

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
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted/50 hover:bg-muted transition-colors"
      >
        <div className="flex items-center gap-2 text-muted-foreground">
          {icon}
          <span className="text-sm font-medium text-foreground">{title}</span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {expanded && <div className="px-4 pb-3 space-y-2">{children}</div>}
    </div>
  );
}

function FieldRow({
  label, fieldKey, selected, onToggle, children, badge, rowClass = '',
}: {
  label: string;
  fieldKey: string;
  selected: Set<string>;
  onToggle: (key: string) => void;
  children: React.ReactNode;
  badge?: React.ReactNode;
  rowClass?: string;
}) {
  return (
    <div className={`flex items-center gap-3 py-1.5 ${rowClass}`}>
      <input
        type="checkbox"
        checked={selected.has(fieldKey)}
        onChange={() => onToggle(fieldKey)}
        className="w-4 h-4 rounded accent-blue-500 flex-shrink-0"
      />
      <span className="text-muted-foreground text-xs w-24 flex-shrink-0">{label}</span>
      <div className="flex items-center gap-2 flex-1 min-w-0">{children}</div>
      {badge && <div className="flex-shrink-0">{badge}</div>}
    </div>
  );
}
