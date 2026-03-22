/**
 * Brand DNA Panel — Kai Creative's brand identity configurator
 *
 * Shows the current Brand DNA and lets users edit it inline.
 * Displayed as a collapsible sidebar panel in Kai Creative.
 * Auto-loads on mount; blocks generation if DNA is not set up.
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useToast } from "@/hooks/use-toast";
import {
  ChevronDown,
  ChevronUp,
  Palette,
  Type,
  Users,
  Zap,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Sparkles,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface BrandDnaData {
  id: number;
  orgId: number;
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  headlineFont?: string | null;
  bodyFont?: string | null;
  brandTone?: string | null;
  brandVoice?: string | null;
  primaryAudience?: string | null;
  ageRangeMin?: number | null;
  ageRangeMax?: number | null;
  visualStyle?: string | null;
  designEnergy?: string | null;
  brandKeywords?: string | null;
  programs?: string[] | null;
  logoUrl?: string | null;
  isSetupComplete: boolean;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ColorSwatch({ color, label }: { color: string | null | undefined; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-5 h-5 rounded-full border border-white/20 flex-shrink-0"
        style={{ backgroundColor: color ?? "#888" }}
      />
      <span className="text-xs text-gray-400">{label}</span>
      <span className="text-xs text-gray-500 font-mono">{color ?? "—"}</span>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  isOpen,
  onToggle,
}: {
  icon: React.ElementType;
  title: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between py-2 text-left hover:text-white transition-colors"
    >
      <div className="flex items-center gap-2 text-gray-300">
        <Icon className="w-3.5 h-3.5" />
        <span className="text-xs font-semibold uppercase tracking-wider">{title}</span>
      </div>
      {isOpen ? (
        <ChevronUp className="w-3.5 h-3.5 text-gray-500" />
      ) : (
        <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
      )}
    </button>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

interface BrandDnaPanelProps {
  onDnaLoaded?: (dna: BrandDnaData) => void;
}

export function BrandDnaPanel({ onDnaLoaded }: BrandDnaPanelProps) {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    colors: true,
    typography: false,
    voice: true,
    audience: false,
    style: false,
  });

  // ── Queries ──────────────────────────────────────────────────────────────────
  const { data: dna, isLoading, refetch } = trpc.brandDna.get.useQuery(undefined, {
    onSuccess: (data) => {
      if (data && onDnaLoaded) onDnaLoaded(data as BrandDnaData);
    },
  });

  const { data: insights } = trpc.brandDna.getInsights.useQuery();

  // ── Mutations ─────────────────────────────────────────────────────────────────
  const upsertMutation = trpc.brandDna.upsert.useMutation({
    onSuccess: () => {
      toast({ title: "Brand DNA saved", description: "Your brand identity has been updated." });
      refetch();
      setIsEditing(false);
    },
    onError: (err) => {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    },
  });

  const syncMutation = trpc.brandDna.syncFromProfile.useMutation({
    onSuccess: () => {
      toast({ title: "Synced from profile", description: "Brand colors and logo pulled from your school profile." });
      refetch();
    },
    onError: (err) => {
      toast({ title: "Sync failed", description: err.message, variant: "destructive" });
    },
  });

  // ── Edit State ────────────────────────────────────────────────────────────────
  const [editValues, setEditValues] = useState<Partial<BrandDnaData>>({});

  function startEdit() {
    if (!dna) return;
    setEditValues({
      primaryColor: dna.primaryColor,
      secondaryColor: dna.secondaryColor,
      accentColor: dna.accentColor,
      headlineFont: dna.headlineFont,
      bodyFont: dna.bodyFont,
      brandTone: dna.brandTone,
      brandVoice: dna.brandVoice,
      primaryAudience: dna.primaryAudience,
      ageRangeMin: dna.ageRangeMin,
      ageRangeMax: dna.ageRangeMax,
      visualStyle: dna.visualStyle,
      designEnergy: dna.designEnergy,
      brandKeywords: dna.brandKeywords,
      programs: (dna.programs as string[] | null) ?? [],
    });
    setIsEditing(true);
  }

  function saveEdit() {
    upsertMutation.mutate({
      ...editValues,
      isSetupComplete: true,
    });
  }

  function toggleSection(key: string) {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="bg-gray-900/60 border border-white/10 rounded-xl p-3 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-1/2 mb-2" />
        <div className="h-3 bg-gray-700 rounded w-3/4" />
      </div>
    );
  }

  const isComplete = dna?.isSetupComplete;
  const hasLogo = !!(dna?.logoUrl);

  return (
    <div className="bg-gray-900/60 border border-white/10 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-red-400" />
          <span className="text-sm font-semibold text-white">Brand DNA</span>
          {isComplete ? (
            <span className="flex items-center gap-1 text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
              <CheckCircle className="w-3 h-3" /> Active
            </span>
          ) : (
            <span className="flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
              <AlertCircle className="w-3 h-3" /> Incomplete
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>

      {isExpanded && dna && (
        <div className="px-4 pb-4 space-y-3">
          {/* Logo status */}
          <div className="flex items-center gap-2 py-2 border-b border-white/5">
            {hasLogo ? (
              <div className="flex items-center gap-2">
                <img
                  src={dna.logoUrl!}
                  alt="Brand logo"
                  className="h-8 max-w-[80px] object-contain bg-white/5 rounded p-1"
                />
                <span className="text-xs text-green-400">Logo loaded ✓</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-amber-400 font-medium">No logo uploaded</p>
                  <p className="text-xs text-gray-500">Upload in School Profile → Branding</p>
                </div>
              </div>
            )}
            <button
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isLoading}
              className="ml-auto flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors"
              title="Sync from School Profile"
            >
              <RefreshCw className={`w-3 h-3 ${syncMutation.isLoading ? "animate-spin" : ""}`} />
              Sync
            </button>
          </div>

          {/* Colors Section */}
          <div>
            <SectionHeader
              icon={Palette}
              title="Colors"
              isOpen={openSections.colors}
              onToggle={() => toggleSection("colors")}
            />
            {openSections.colors && (
              <div className="space-y-1.5 mt-1 pl-1">
                {isEditing ? (
                  <div className="grid grid-cols-3 gap-2">
                    {(["primaryColor", "secondaryColor", "accentColor"] as const).map((key) => (
                      <div key={key} className="flex flex-col gap-1">
                        <label className="text-xs text-gray-500 capitalize">
                          {key.replace("Color", "")}
                        </label>
                        <input
                          type="color"
                          value={(editValues[key] as string) ?? "#000000"}
                          onChange={(e) => setEditValues((prev) => ({ ...prev, [key]: e.target.value }))}
                          className="w-full h-8 rounded cursor-pointer border border-white/10 bg-transparent"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <ColorSwatch color={dna.primaryColor} label="Primary" />
                    <ColorSwatch color={dna.secondaryColor} label="Secondary" />
                    <ColorSwatch color={dna.accentColor} label="Accent" />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Voice & Tone Section */}
          <div>
            <SectionHeader
              icon={Zap}
              title="Voice & Tone"
              isOpen={openSections.voice}
              onToggle={() => toggleSection("voice")}
            />
            {openSections.voice && (
              <div className="space-y-2 mt-1 pl-1">
                {isEditing ? (
                  <>
                    <div>
                      <label className="text-xs text-gray-500">Tone</label>
                      <select
                        value={editValues.brandTone ?? "bold"}
                        onChange={(e) => setEditValues((prev) => ({ ...prev, brandTone: e.target.value }))}
                        className="w-full mt-1 bg-gray-800 border border-white/10 rounded px-2 py-1.5 text-xs text-white"
                      >
                        <option value="bold">Bold & Powerful</option>
                        <option value="playful">Playful & Fun</option>
                        <option value="premium">Premium & Refined</option>
                        <option value="community">Community-Focused</option>
                        <option value="motivational">Motivational</option>
                        <option value="professional">Professional</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Brand Voice (1 sentence)</label>
                      <input
                        type="text"
                        value={editValues.brandVoice ?? ""}
                        onChange={(e) => setEditValues((prev) => ({ ...prev, brandVoice: e.target.value }))}
                        placeholder="e.g. We build champions through discipline and heart."
                        className="w-full mt-1 bg-gray-800 border border-white/10 rounded px-2 py-1.5 text-xs text-white placeholder-gray-600"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Design Energy</label>
                      <select
                        value={editValues.designEnergy ?? "high-energy"}
                        onChange={(e) => setEditValues((prev) => ({ ...prev, designEnergy: e.target.value }))}
                        className="w-full mt-1 bg-gray-800 border border-white/10 rounded px-2 py-1.5 text-xs text-white"
                      >
                        <option value="high-energy">High-Energy</option>
                        <option value="premium">Premium</option>
                        <option value="playful">Playful</option>
                        <option value="calm">Calm & Focused</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-300">
                      <span className="text-gray-500">Tone: </span>
                      {dna.brandTone ?? "—"}
                    </p>
                    <p className="text-xs text-gray-300">
                      <span className="text-gray-500">Energy: </span>
                      {dna.designEnergy ?? "—"}
                    </p>
                    {dna.brandVoice && (
                      <p className="text-xs text-gray-400 italic">"{dna.brandVoice}"</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Audience Section */}
          <div>
            <SectionHeader
              icon={Users}
              title="Audience"
              isOpen={openSections.audience}
              onToggle={() => toggleSection("audience")}
            />
            {openSections.audience && (
              <div className="space-y-2 mt-1 pl-1">
                {isEditing ? (
                  <>
                    <div>
                      <label className="text-xs text-gray-500">Primary Audience</label>
                      <input
                        type="text"
                        value={editValues.primaryAudience ?? ""}
                        onChange={(e) => setEditValues((prev) => ({ ...prev, primaryAudience: e.target.value }))}
                        placeholder="e.g. Parents of kids ages 3-12"
                        className="w-full mt-1 bg-gray-800 border border-white/10 rounded px-2 py-1.5 text-xs text-white placeholder-gray-600"
                      />
                    </div>
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500">Min Age</label>
                        <input
                          type="number"
                          value={editValues.ageRangeMin ?? ""}
                          onChange={(e) => setEditValues((prev) => ({ ...prev, ageRangeMin: parseInt(e.target.value) || undefined }))}
                          className="w-full mt-1 bg-gray-800 border border-white/10 rounded px-2 py-1.5 text-xs text-white"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-gray-500">Max Age</label>
                        <input
                          type="number"
                          value={editValues.ageRangeMax ?? ""}
                          onChange={(e) => setEditValues((prev) => ({ ...prev, ageRangeMax: parseInt(e.target.value) || undefined }))}
                          className="w-full mt-1 bg-gray-800 border border-white/10 rounded px-2 py-1.5 text-xs text-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Programs (comma-separated)</label>
                      <input
                        type="text"
                        value={(editValues.programs as string[] | undefined)?.join(", ") ?? ""}
                        onChange={(e) =>
                          setEditValues((prev) => ({
                            ...prev,
                            programs: e.target.value.split(",").map((s) => s.trim()).filter(Boolean),
                          }))
                        }
                        placeholder="e.g. Little Ninjas, Adult Karate, Self Defense"
                        className="w-full mt-1 bg-gray-800 border border-white/10 rounded px-2 py-1.5 text-xs text-white placeholder-gray-600"
                      />
                    </div>
                  </>
                ) : (
                  <div className="space-y-1">
                    {dna.primaryAudience && (
                      <p className="text-xs text-gray-300">{dna.primaryAudience}</p>
                    )}
                    {(dna.ageRangeMin || dna.ageRangeMax) && (
                      <p className="text-xs text-gray-400">
                        Ages {dna.ageRangeMin ?? "?"} – {dna.ageRangeMax ?? "?"}
                      </p>
                    )}
                    {dna.programs && (dna.programs as string[]).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {(dna.programs as string[]).map((p) => (
                          <span
                            key={p}
                            className="text-xs bg-red-900/30 text-red-300 border border-red-800/40 px-2 py-0.5 rounded-full"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Typography Section */}
          <div>
            <SectionHeader
              icon={Type}
              title="Typography"
              isOpen={openSections.typography}
              onToggle={() => toggleSection("typography")}
            />
            {openSections.typography && (
              <div className="space-y-2 mt-1 pl-1">
                {isEditing ? (
                  <>
                    <div>
                      <label className="text-xs text-gray-500">Headline Font</label>
                      <select
                        value={editValues.headlineFont ?? ""}
                        onChange={(e) => setEditValues((prev) => ({ ...prev, headlineFont: e.target.value }))}
                        className="w-full mt-1 bg-gray-800 border border-white/10 rounded px-2 py-1.5 text-xs text-white"
                      >
                        <option value="">Auto (engine picks)</option>
                        <option value="Bebas Neue">Bebas Neue (Cinematic)</option>
                        <option value="Impact">Impact (Bold)</option>
                        <option value="Montserrat Black">Montserrat Black (Modern)</option>
                        <option value="Oswald">Oswald (Athletic)</option>
                        <option value="Anton">Anton (Powerful)</option>
                        <option value="Barlow Condensed">Barlow Condensed (Clean)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500">Visual Style</label>
                      <select
                        value={editValues.visualStyle ?? "cinematic"}
                        onChange={(e) => setEditValues((prev) => ({ ...prev, visualStyle: e.target.value }))}
                        className="w-full mt-1 bg-gray-800 border border-white/10 rounded px-2 py-1.5 text-xs text-white"
                      >
                        <option value="cinematic">Cinematic Photography</option>
                        <option value="cartoon">Cartoon / Illustration</option>
                        <option value="premium">Premium Minimalist</option>
                        <option value="bold_graphic">Bold Graphic Design</option>
                        <option value="kids_friendly">Kids Friendly</option>
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs text-gray-300">
                      <span className="text-gray-500">Headline: </span>
                      {dna.headlineFont ?? "Auto"}
                    </p>
                    <p className="text-xs text-gray-300">
                      <span className="text-gray-500">Style: </span>
                      {dna.visualStyle ?? "cinematic"}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Creative Memory Insights */}
          {insights && insights.totalGenerations > 0 && (
            <div className="pt-2 border-t border-white/5">
              <p className="text-xs text-gray-500 mb-1.5">
                <Sparkles className="w-3 h-3 inline mr-1" />
                Learned from {insights.totalGenerations} generations
              </p>
              <div className="flex flex-wrap gap-1">
                {insights.topKeywords.slice(0, 5).map((kw) => (
                  <span
                    key={kw}
                    className="text-xs bg-white/5 text-gray-400 px-2 py-0.5 rounded-full border border-white/10"
                  >
                    {kw}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {isEditing ? (
              <>
                <button
                  onClick={saveEdit}
                  disabled={upsertMutation.isLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {upsertMutation.isLoading ? "Saving..." : "Save Brand DNA"}
                </button>
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-3 bg-gray-700 hover:bg-gray-600 text-white text-xs py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={startEdit}
                className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium py-2 rounded-lg border border-white/10 transition-colors"
              >
                Edit Brand DNA
              </button>
            )}
          </div>

          {!isComplete && (
            <div className="bg-amber-900/20 border border-amber-800/40 rounded-lg p-2.5">
              <p className="text-xs text-amber-300 font-medium">Brand DNA incomplete</p>
              <p className="text-xs text-amber-400/70 mt-0.5">
                Complete your brand setup for best results. Kai will use defaults until then.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
