/**
 * PlatformCopyPanel — generates tailored ad copy for all major platforms
 * Facebook, Instagram, TikTok, Google Ads, SMS
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { Copy, Check, RefreshCw, Sparkles, Facebook, Instagram, MessageSquare, Search, Video } from "lucide-react";
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

  const mutation = trpc.kaiCreative.generatePlatformCopy.useMutation();

  const handleGenerate = () => {
    if (!program.trim()) return;
    mutation.mutate({ program: program.trim(), audience: audience.trim() || "all ages", tone });
  };

  const data = mutation.data;

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
          <input
            type="text"
            placeholder="Program name (e.g. Little Ninjas, Adult Karate)"
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-red-500/50 ${inputBg}`}
          />
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
            <><RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />Generating copy...</>
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
          {/* Platform tabs */}
          <div className="flex border-b border-white/8 overflow-x-auto">
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
        </div>
      )}
    </div>
  );
}
