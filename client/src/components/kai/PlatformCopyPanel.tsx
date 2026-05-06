/**
 * PlatformCopyPanel — generates tailored ad copy for all major platforms
 * Facebook, Instagram, TikTok, Google Ads, SMS
 *
 * UPGRADE (May 2026):
 * - Auto-populates program/audience from Brand DNA on load
 * - "Copy All" button to copy all platform variants at once
 * - Better visual feedback and loading states
 */
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { Copy, Check, RefreshCw, Sparkles, Facebook, Instagram, MessageSquare, Search, Video, CopyCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

type Platform = "facebook" | "instagram" | "tiktok" | "google" | "sms";

interface PlatformCopyPanelProps {
  initialProgram?: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1.5 rounded-md hover:bg-white/10 transition-colors shrink-0"
      title="Copy to clipboard"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5 opacity-50" />}
    </button>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  const { isDark } = useTheme();
  const muted = isDark ? "text-white/40" : "text-slate-400";
  const text = isDark ? "text-white/90" : "text-slate-800";
  return (
    <div className="flex items-start gap-2 py-2 border-b border-white/5 last:border-0">
      <span className={`text-xs font-medium ${muted} w-24 shrink-0 pt-0.5`}>{label}</span>
      <span className={`text-xs ${text} flex-1 leading-relaxed whitespace-pre-wrap`}>{value}</span>
      <CopyButton text={value} />
    </div>
  );
}

function HashtagList({ tags }: { tags: string[] }) {
  const { isDark } = useTheme();
  const allTags = tags.join(" ");
  return (
    <div className="flex items-start gap-2 py-2 border-b border-white/5 last:border-0">
      <span className={`text-xs font-medium ${isDark ? "text-white/40" : "text-slate-400"} w-24 shrink-0 pt-0.5`}>Hashtags</span>
      <div className="flex-1 flex flex-wrap gap-1">
        {tags.map((tag, i) => (
          <span key={i} className="text-xs px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 font-mono">{tag}</span>
        ))}
      </div>
      <CopyButton text={allTags} />
    </div>
  );
}

const PLATFORM_ICONS: Record<Platform, React.ReactNode> = {
  facebook: <Facebook className="w-3.5 h-3.5" />,
  instagram: <Instagram className="w-3.5 h-3.5" />,
  tiktok: <Video className="w-3.5 h-3.5" />,
  google: <Search className="w-3.5 h-3.5" />,
  sms: <MessageSquare className="w-3.5 h-3.5" />,
};

const PLATFORM_LABELS: Record<Platform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  tiktok: "TikTok",
  google: "Google Ads",
  sms: "SMS",
};

function buildCopyAllText(data: any): string {
  const sections: string[] = [];
  if (data.facebook) {
    sections.push(`=== FACEBOOK ===\nHeadline: ${data.facebook.headline}\nPrimary Text: ${data.facebook.primaryText}\nDescription: ${data.facebook.description}\nCTA: ${data.facebook.cta}`);
  }
  if (data.instagram) {
    sections.push(`=== INSTAGRAM ===\nCaption: ${data.instagram.caption}\nHashtags: ${data.instagram.hashtags?.join(" ")}\nStory Text: ${data.instagram.storyText}\nCTA: ${data.instagram.cta}`);
  }
  if (data.tiktok) {
    sections.push(`=== TIKTOK ===\nHook: ${data.tiktok.hook}\nScript: ${data.tiktok.script}\nCaption: ${data.tiktok.caption}\nHashtags: ${data.tiktok.hashtags?.join(" ")}\nCTA: ${data.tiktok.cta}`);
  }
  if (data.google) {
    sections.push(`=== GOOGLE ADS ===\nHeadline 1: ${data.google.headline1}\nHeadline 2: ${data.google.headline2}\nHeadline 3: ${data.google.headline3}\nDescription 1: ${data.google.description1}\nDescription 2: ${data.google.description2}`);
  }
  if (data.sms) {
    sections.push(`=== SMS ===\nMessage: ${data.sms.message}\nFollow-up: ${data.sms.followUp}`);
  }
  return sections.join("\n\n");
}

export function PlatformCopyPanel({ initialProgram = "" }: PlatformCopyPanelProps) {
  const { isDark } = useTheme();
  const text = isDark ? "text-white/90" : "text-slate-800";
  const muted = isDark ? "text-white/40" : "text-slate-400";
  const cardBg = isDark ? "bg-white/5 border-white/8" : "bg-white border-slate-200";
  const inputBg = isDark ? "bg-white/8 border-white/12 text-white placeholder-white/30" : "bg-white border-slate-300 text-slate-800 placeholder-slate-400";

  const [program, setProgram] = useState(initialProgram);
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("bold and energetic");
  const [activePlatform, setActivePlatform] = useState<Platform>("facebook");
  const [copyAllDone, setCopyAllDone] = useState(false);

  // Auto-populate from Brand DNA
  const brandQuery = trpc.kaiCreative.getBrandData.useQuery(undefined, { staleTime: 60000 });
  const programSuggestionsQuery = trpc.kaiCreative.getProgramSuggestions.useQuery(undefined, { staleTime: 60000 });

  useEffect(() => {
    // Auto-populate program from first program in Brand DNA if not set
    if (!program && programSuggestionsQuery.data?.length) {
      const firstProgram = programSuggestionsQuery.data[0];
      if (firstProgram?.name) {
        setProgram(firstProgram.name);
        if (firstProgram.ageRange) {
          setAudience(firstProgram.ageRange);
        }
      }
    }
  }, [programSuggestionsQuery.data, program]);

  const mutation = trpc.kaiCreative.generatePlatformCopy.useMutation();

  const handleGenerate = () => {
    if (!program.trim()) return;
    mutation.mutate({ program: program.trim(), audience: audience.trim() || "all ages", tone });
  };

  const handleCopyAll = async () => {
    if (!mutation.data) return;
    const allText = buildCopyAllText(mutation.data);
    await navigator.clipboard.writeText(allText);
    setCopyAllDone(true);
    setTimeout(() => setCopyAllDone(false), 2500);
  };

  const data = mutation.data;
  const programs = programSuggestionsQuery.data ?? [];

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {/* Input section */}
      <div className={`rounded-xl border p-4 ${cardBg} flex flex-col gap-3`}>
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-red-400" />
          <span className={`text-sm font-semibold ${text}`}>Platform Copy Generator</span>
        </div>
        <p className={`text-xs ${muted}`}>Generate tailored ad copy for every major platform in one click.</p>

        <div className="flex flex-col gap-2">
          {/* Program input with quick-select chips */}
          <div className="flex flex-col gap-1.5">
            <input
              type="text"
              placeholder="Program name (e.g. Little Ninjas, Adult Karate)"
              value={program}
              onChange={(e) => setProgram(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-red-500/50 ${inputBg}`}
            />
            {/* Quick program chips from Brand DNA */}
            {programs.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {programs.slice(0, 5).map((p) => (
                  <button
                    key={p.name}
                    onClick={() => {
                      setProgram(p.name);
                      if (p.ageRange) setAudience(p.ageRange);
                    }}
                    className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                      program === p.name
                        ? "bg-red-600 border-red-600 text-white"
                        : isDark
                        ? "border-white/15 text-white/60 hover:border-white/30 hover:text-white/80"
                        : "border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700"
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <input
            type="text"
            placeholder="Target audience (e.g. Kids ages 4-7, Adults 18+)"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-red-500/50 ${inputBg}`}
          />
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-red-500/50 ${inputBg}`}
          >
            <option value="bold and energetic">Bold & Energetic</option>
            <option value="professional and authoritative">Professional & Authoritative</option>
            <option value="warm and family-focused">Warm & Family-Focused</option>
            <option value="urgent and conversion-focused">Urgent & Conversion-Focused</option>
            <option value="inspirational and motivational">Inspirational & Motivational</option>
          </select>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={mutation.isPending || !program.trim()}
          className="w-full bg-red-600 hover:bg-red-700 text-white text-sm"
        >
          {mutation.isPending ? (
            <><RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />Generating copy for all platforms...</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5 mr-2" />Generate Platform Copy</>
          )}
        </Button>

        {mutation.error && (
          <p className="text-xs text-red-400">{mutation.error.message}</p>
        )}
      </div>

      {/* Results section */}
      {data && (
        <div className={`rounded-xl border ${cardBg} overflow-hidden`}>
          {/* Platform tabs + Copy All */}
          <div className="flex items-center border-b border-white/8">
            <div className="flex overflow-x-auto flex-1">
              {(Object.keys(PLATFORM_LABELS) as Platform[]).map((platform) => (
                <button
                  key={platform}
                  onClick={() => setActivePlatform(platform)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium whitespace-nowrap transition-colors border-b-2 ${
                    activePlatform === platform
                      ? "border-red-500 text-red-400"
                      : `border-transparent ${muted} hover:text-white/70`
                  }`}
                >
                  {PLATFORM_ICONS[platform]}
                  {PLATFORM_LABELS[platform]}
                </button>
              ))}
            </div>
            {/* Copy All button */}
            <button
              onClick={handleCopyAll}
              className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium shrink-0 mr-1 rounded-lg transition-colors ${
                copyAllDone
                  ? "text-green-400"
                  : isDark
                  ? "text-white/50 hover:text-white/80 hover:bg-white/5"
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
              }`}
              title="Copy all platforms at once"
            >
              {copyAllDone ? (
                <><CopyCheck className="w-3.5 h-3.5" /> Copied!</>
              ) : (
                <><Copy className="w-3.5 h-3.5" /> Copy All</>
              )}
            </button>
          </div>

          {/* Platform content */}
          <div className="p-4">
            {activePlatform === "facebook" && data.facebook && (
              <div>
                <FieldRow label="Headline" value={data.facebook.headline} />
                <FieldRow label="Primary Text" value={data.facebook.primaryText} />
                <FieldRow label="Description" value={data.facebook.description} />
                <FieldRow label="CTA Button" value={data.facebook.cta} />
              </div>
            )}
            {activePlatform === "instagram" && data.instagram && (
              <div>
                <FieldRow label="Caption" value={data.instagram.caption} />
                <HashtagList tags={data.instagram.hashtags} />
                <FieldRow label="Story Text" value={data.instagram.storyText} />
                <FieldRow label="CTA" value={data.instagram.cta} />
              </div>
            )}
            {activePlatform === "tiktok" && data.tiktok && (
              <div>
                <FieldRow label="Hook (3s)" value={data.tiktok.hook} />
                <FieldRow label="Script" value={data.tiktok.script} />
                <FieldRow label="Caption" value={data.tiktok.caption} />
                <HashtagList tags={data.tiktok.hashtags} />
                <FieldRow label="CTA" value={data.tiktok.cta} />
              </div>
            )}
            {activePlatform === "google" && data.google && (
              <div>
                <FieldRow label="Headline 1" value={`${data.google.headline1} (${data.google.headline1.length}/30)`} />
                <FieldRow label="Headline 2" value={`${data.google.headline2} (${data.google.headline2.length}/30)`} />
                <FieldRow label="Headline 3" value={`${data.google.headline3} (${data.google.headline3.length}/30)`} />
                <FieldRow label="Description 1" value={`${data.google.description1} (${data.google.description1.length}/90)`} />
                <FieldRow label="Description 2" value={`${data.google.description2} (${data.google.description2.length}/90)`} />
                {data.google.finalUrl && <FieldRow label="Final URL" value={data.google.finalUrl} />}
              </div>
            )}
            {activePlatform === "sms" && data.sms && (
              <div>
                <FieldRow label="First SMS" value={`${data.sms.message} (${data.sms.message.length}/160 chars)`} />
                <FieldRow label="Follow-up" value={`${data.sms.followUp} (${data.sms.followUp.length}/160 chars)`} />
              </div>
            )}
          </div>

          {/* Regenerate button */}
          <div className="px-4 pb-4">
            <button
              onClick={handleGenerate}
              disabled={mutation.isPending}
              className={`w-full text-xs py-2 rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${
                isDark
                  ? "border-white/10 text-white/50 hover:bg-white/5 hover:text-white/70"
                  : "border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${mutation.isPending ? "animate-spin" : ""}`} />
              Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
