/**
 * CreativePreviewCard — rendered inside Kai chat when an image is generated.
 *
 * Shows:
 *  - Generated image preview
 *  - Prompt used
 *  - "Saved to Library" badge (when applicable)
 *  - Action buttons: Open in Creative, Edit, Retry, Download
 */

import { useLocation } from "wouter";
import { Download, ExternalLink, Edit3, RefreshCw, Sparkles, CheckCircle2 } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";

export interface CreativePreviewCardData {
  imageUrl: string;
  imageBase64: string;
  mimeType: string;
  prompt: string;
  size: string;
  assetId: number | null;
  savedToLibrary: boolean;
}

interface CreativePreviewCardProps {
  data: CreativePreviewCardData;
  onRetry?: () => void;
  onEdit?: (data: CreativePreviewCardData) => void;
}

const SIZE_LABELS: Record<string, string> = {
  instagram_post: "Instagram Post · 1:1",
  instagram_story: "Instagram Story · 9:16",
  facebook_ad: "Facebook Ad · 4:5",
  flyer: "Flyer · 3:4",
  website_banner: "Website Banner · 16:9",
};

export function CreativePreviewCard({ data, onRetry, onEdit }: CreativePreviewCardProps) {
  const [, navigate] = useLocation();
  const { theme } = useTheme();
  const isDark = theme === "dark" || theme === "cinematic";
  const isCinematic = theme === "cinematic";

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = data.imageUrl;
    a.download = `kai-creative-${data.size}-${Date.now()}.${data.mimeType.includes("jpeg") ? "jpg" : "png"}`;
    a.target = "_blank";
    a.click();
  };

  const handleOpenInCreative = () => {
    navigate("/kai/creative");
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(data);
    } else {
      // Navigate to Creative with edit state encoded in URL
      navigate("/kai/creative");
    }
  };

  const cardBg = isCinematic
    ? "bg-black/40 border-white/10"
    : isDark
    ? "bg-[oklch(0.13_0.008_25)] border-white/10"
    : "bg-white border-slate-200";

  const textPrimary = isDark ? "text-white" : "text-slate-900";
  const textMuted = isDark ? "text-white/50" : "text-slate-500";
  const btnBase = isDark
    ? "border-white/15 text-white/70 hover:bg-white/8 hover:text-white"
    : "border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900";

  return (
    <div className={`rounded-2xl border overflow-hidden shadow-lg ${cardBg} max-w-sm w-full`}>
      {/* Image */}
      <div className="relative bg-black/20">
        <img
          src={data.imageUrl}
          alt={data.prompt}
          className="w-full object-contain max-h-72"
          loading="lazy"
        />
        {/* Size badge */}
        <div className="absolute top-2 left-2">
          <span
            className={`text-xs px-2 py-0.5 rounded-full font-medium backdrop-blur-sm ${
              isDark ? "bg-black/60 text-white/80" : "bg-white/80 text-slate-700"
            }`}
          >
            {SIZE_LABELS[data.size] ?? data.size}
          </span>
        </div>
        {/* Saved badge */}
        {data.savedToLibrary && (
          <div className="absolute top-2 right-2">
            <span className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 backdrop-blur-sm border border-green-500/30">
              <CheckCircle2 className="w-3 h-3" />
              Saved
            </span>
          </div>
        )}
      </div>

      {/* Prompt */}
      <div className="px-3 pt-2.5 pb-1">
        <p className={`text-xs ${textMuted} line-clamp-2`}>
          <span className={`font-medium ${textPrimary}`}>Prompt:</span> {data.prompt}
        </p>
      </div>

      {/* Action buttons */}
      <div className="p-3 grid grid-cols-2 gap-2">
        {/* Download — primary */}
        <button
          onClick={handleDownload}
          className="col-span-2 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          Download
        </button>

        {/* Open in Creative */}
        <button
          onClick={handleOpenInCreative}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition-colors ${btnBase}`}
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Open in Creative
        </button>

        {/* Edit */}
        <button
          onClick={handleEdit}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-medium transition-colors ${btnBase}`}
        >
          <Edit3 className="w-3.5 h-3.5" />
          Edit
        </button>

        {/* Retry */}
        {onRetry && (
          <button
            onClick={onRetry}
            className={`col-span-2 flex items-center justify-center gap-1.5 py-1.5 rounded-xl border text-xs font-medium transition-colors ${btnBase}`}
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        )}
      </div>

      {/* Kai branding footer */}
      <div className={`px-3 pb-2.5 flex items-center gap-1 ${textMuted}`}>
        <Sparkles className="w-3 h-3" />
        <span className="text-xs">Generated by Kai Creative · Gemini</span>
      </div>
    </div>
  );
}
