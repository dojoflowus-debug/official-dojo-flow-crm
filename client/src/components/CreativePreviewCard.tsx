/**
 * CreativePreviewCard — rendered inside Kai chat when an image is generated.
 *
 * Two modes:
 *  1. flyerHtml present → render in a sandboxed iframe, capture via html2canvas for download/save
 *  2. imageUrl present  → legacy mode, show <img> directly (AI-generated images)
 *
 * Shows:
 *  - Generated image / flyer preview (click to open fullscreen lightbox)
 *  - Prompt used
 *  - "Saved to Library" badge (when applicable)
 *  - Action buttons: Save to Library, Download, Open in Creative, Edit, Retry
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { Download, ExternalLink, Edit3, RefreshCw, Sparkles, CheckCircle2, ZoomIn, BookmarkPlus, Loader2 } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import ImageLightbox from "@/components/ImageLightbox";
import { trpc } from "@/lib/trpc";

export interface CreativePreviewCardData {
  imageUrl: string;
  imageBase64: string;
  mimeType: string;
  prompt: string;
  size: string;
  assetId: number | null;
  savedToLibrary: boolean;
  flyerHtml?: string | null;
}

interface CreativePreviewCardProps {
  data: CreativePreviewCardData;
  onRetry?: () => void;
  onEdit?: (data: CreativePreviewCardData) => void;
  isDark?: boolean;
  isCinematic?: boolean;
}

const SIZE_LABELS: Record<string, string> = {
  instagram_post: "Instagram Post · 1:1",
  instagram_story: "Instagram Story · 9:16",
  facebook_ad: "Facebook Ad · 4:5",
  flyer: "Flyer · 3:4",
  website_banner: "Website Banner · 16:9",
};

// Flyer dimensions in px (matches flyerRenderer.ts SIZE_DIMS)
const FLYER_DIMS: Record<string, { w: number; h: number }> = {
  flyer: { w: 816, h: 1056 },
  instagram_post: { w: 1080, h: 1080 },
  instagram_story: { w: 1080, h: 1920 },
  facebook_ad: { w: 1080, h: 1350 },
  website_banner: { w: 1200, h: 628 },
  business_card: { w: 1050, h: 600 },
};

export function CreativePreviewCard({ data, onRetry, onEdit, isDark: isDarkProp, isCinematic: isCinematicProp }: CreativePreviewCardProps) {
  const [, navigate] = useLocation();
  const { theme } = useTheme();
  const isDark = isDarkProp ?? (theme === "dark" || theme === "cinematic");
  const isCinematic = isCinematicProp ?? (theme === "cinematic");

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(data.savedToLibrary);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [renderedImageUrl, setRenderedImageUrl] = useState<string | null>(
    data.imageUrl && !data.imageUrl.startsWith('data:text/html') ? data.imageUrl : null
  );
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hasFlyerHtml = !!data.flyerHtml;

  const saveAssetMutation = trpc.kaiCreative.saveGeneratedAsset.useMutation({
    onSuccess: () => {
      setIsSaved(true);
      setSaveError(null);
    },
    onError: (err) => {
      setSaveError(err.message ?? "Save failed. Please try again.");
    },
  });

  // Capture the iframe content via html2canvas and return base64 PNG
  const captureFlyer = useCallback(async (): Promise<string | null> => {
    if (!iframeRef.current) return null;
    try {
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document;
      if (!iframeDoc) return null;
      const html2canvas = (await import('html2canvas')).default;
      const dims = FLYER_DIMS[data.size] || FLYER_DIMS.flyer;
      const canvas = await html2canvas(iframeDoc.body, {
        width: dims.w,
        height: dims.h,
        scale: 1,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: null,
      });
      return canvas.toDataURL('image/png').replace('data:image/png;base64,', '');
    } catch (err) {
      console.error('[CreativePreviewCard] html2canvas error:', err);
      return null;
    }
  }, [data.size]);

  // Render flyer HTML → PNG via html2canvas, then upload to S3
  const renderAndUpload = useCallback(async () => {
    if (!hasFlyerHtml || renderedImageUrl || isRendering) return;
    setIsRendering(true);
    setRenderError(null);
    try {
      // Wait for iframe to load
      await new Promise<void>((resolve) => {
        const iframe = iframeRef.current;
        if (!iframe) { resolve(); return; }
        if (iframe.contentDocument?.readyState === 'complete') { resolve(); return; }
        iframe.onload = () => resolve();
        setTimeout(resolve, 4000); // fallback timeout
      });

      // Extra wait for fonts/images inside iframe
      await new Promise(r => setTimeout(r, 1500));

      const base64 = await captureFlyer();
      if (!base64) throw new Error('html2canvas returned empty result');

      // Upload to server
      const resp = await fetch('/api/upload-flyer', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(data.assetId ? {} : {}),
        },
        body: JSON.stringify({
          imageBase64: base64,
          mimeType: 'image/png',
          prompt: data.prompt,
          size: data.size,
          assetId: data.assetId,
        }),
      });
      if (!resp.ok) throw new Error(`Upload failed: ${resp.status}`);
      const result = await resp.json();
      setRenderedImageUrl(result.imageUrl || `data:image/png;base64,${base64}`);
    } catch (err: any) {
      console.error('[CreativePreviewCard] renderAndUpload error:', err);
      setRenderError('Rendering failed. You can still download the flyer below.');
    } finally {
      setIsRendering(false);
    }
  }, [hasFlyerHtml, renderedImageUrl, isRendering, captureFlyer, data]);

  // Auto-render when flyerHtml is present
  useEffect(() => {
    if (hasFlyerHtml && !renderedImageUrl && !isRendering) {
      renderAndUpload();
    }
  }, [hasFlyerHtml]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSaveToLibrary = async () => {
    if (isSaved || saveAssetMutation.isPending) return;
    setSaveError(null);

    if (hasFlyerHtml && !renderedImageUrl) {
      // Trigger render first
      await renderAndUpload();
    }

    const base64ToSave = renderedImageUrl?.startsWith('data:')
      ? renderedImageUrl.replace(/^data:image\/\w+;base64,/, '')
      : data.imageBase64;

    saveAssetMutation.mutate({
      imageBase64: base64ToSave,
      mimeType: 'image/png',
      prompt: data.prompt,
      size: data.size,
    });
  };

  const handleDownload = async () => {
    let url = renderedImageUrl || data.imageUrl;
    let base64 = '';

    if (hasFlyerHtml && !renderedImageUrl) {
      // Capture on-demand
      const captured = await captureFlyer();
      if (captured) {
        base64 = captured;
        url = `data:image/png;base64,${captured}`;
      }
    }

    const a = document.createElement("a");
    a.href = url;
    a.download = `kai-flyer-${data.size}-${Date.now()}.png`;
    a.target = "_blank";
    a.click();
  };

  const handleOpenInCreative = () => {
    navigate("/kai/creative", {
      state: {
        preloadImage: {
          imageUrl: renderedImageUrl || data.imageUrl,
          imageBase64: data.imageBase64,
          mimeType: data.mimeType,
          prompt: data.prompt,
          size: data.size,
          tab: "create",
        },
      },
    } as any);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(data);
    } else {
      navigate("/kai/creative", {
        state: {
          preloadImage: {
            imageUrl: renderedImageUrl || data.imageUrl,
            imageBase64: data.imageBase64,
            mimeType: data.mimeType,
            prompt: data.prompt,
            size: data.size,
            tab: "edit",
          },
        },
      } as any);
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

  const isPortrait = data.size === 'flyer' || data.size === 'instagram_story' || data.size === 'facebook_ad';
  const previewMaxH = isPortrait ? 'max-h-[520px]' : 'max-h-72';
  const dims = FLYER_DIMS[data.size] || FLYER_DIMS.flyer;
  const iframeScale = isPortrait ? 360 / dims.w : 384 / dims.w;

  const displayUrl = renderedImageUrl || (data.imageUrl && !data.imageUrl.startsWith('data:text/html') ? data.imageUrl : null);

  return (
    <>
      <div className={`rounded-2xl border overflow-hidden shadow-lg ${cardBg} w-full`} style={{ maxWidth: isPortrait ? '360px' : '384px' }}>
        {/* Preview area */}
        <div
          className="relative bg-black/20 cursor-zoom-in group overflow-hidden"
          onClick={() => displayUrl && setLightboxOpen(true)}
        >
          {/* Hidden iframe for html2canvas capture */}
          {hasFlyerHtml && !renderedImageUrl && (
            <div style={{ position: 'absolute', left: '-9999px', top: 0, width: dims.w, height: dims.h, overflow: 'hidden', pointerEvents: 'none' }}>
              <iframe
                ref={iframeRef}
                srcDoc={data.flyerHtml!}
                style={{ width: dims.w, height: dims.h, border: 'none' }}
                sandbox="allow-same-origin"
                title="flyer-render"
              />
            </div>
          )}

          {/* Loading state while rendering */}
          {isRendering && (
            <div className={`flex flex-col items-center justify-center gap-3 ${isPortrait ? 'h-[440px]' : 'h-64'} bg-black/10`}>
              <Loader2 className="w-8 h-8 animate-spin text-red-500" />
              <p className={`text-xs ${textMuted}`}>Rendering your flyer…</p>
            </div>
          )}

          {/* Rendered PNG */}
          {!isRendering && displayUrl && (
            <>
              <img
                src={displayUrl}
                alt={data.prompt}
                className={`w-full object-contain ${previewMaxH}`}
                loading="lazy"
              />
              {/* Zoom hint */}
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                <div className="flex items-center gap-1.5 bg-black/70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
                  <ZoomIn className="w-3.5 h-3.5" />
                  Click to inspect
                </div>
              </div>
            </>
          )}

          {/* Render error fallback */}
          {!isRendering && !displayUrl && renderError && (
            <div className={`flex flex-col items-center justify-center gap-2 ${isPortrait ? 'h-[440px]' : 'h-64'} bg-black/10 px-4 text-center`}>
              <p className="text-xs text-amber-400">{renderError}</p>
              <button
                onClick={(e) => { e.stopPropagation(); renderAndUpload(); }}
                className="text-xs text-red-400 underline"
              >
                Try again
              </button>
            </div>
          )}

          {/* Fallback: iframe preview if no PNG yet and not rendering */}
          {!isRendering && !displayUrl && !renderError && hasFlyerHtml && (
            <div style={{ width: '100%', height: isPortrait ? 440 : 256, overflow: 'hidden', position: 'relative' }}>
              <iframe
                srcDoc={data.flyerHtml!}
                style={{
                  width: dims.w,
                  height: dims.h,
                  border: 'none',
                  transform: `scale(${iframeScale})`,
                  transformOrigin: 'top left',
                  pointerEvents: 'none',
                }}
                sandbox="allow-same-origin"
                title="flyer-preview"
              />
            </div>
          )}

          {/* Size badge */}
          <div className="absolute top-2 left-2">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium backdrop-blur-sm ${isDark ? "bg-black/60 text-white/80" : "bg-white/80 text-slate-700"}`}>
              {SIZE_LABELS[data.size] ?? data.size}
            </span>
          </div>

          {/* Saved badge */}
          {isSaved && (
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

        {/* Save error */}
        {saveError && (
          <div className="px-3 pb-1">
            <p className="text-xs text-red-400">{saveError}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="p-3 grid grid-cols-2 gap-2">
          {/* Save to Library */}
          {!isSaved ? (
            <button
              onClick={handleSaveToLibrary}
              disabled={saveAssetMutation.isPending || isRendering}
              className="col-span-2 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-600 hover:bg-green-500 disabled:opacity-60 disabled:cursor-not-allowed text-white text-sm font-semibold transition-colors"
            >
              {saveAssetMutation.isPending ? (
                <><Loader2 className="w-3.5 h-3.5 animate-spin" />Saving…</>
              ) : (
                <><BookmarkPlus className="w-3.5 h-3.5" />Save to Library</>
              )}
            </button>
          ) : (
            <div className="col-span-2 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-green-600/20 border border-green-500/30 text-green-400 text-sm font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Saved to Library
            </div>
          )}

          {/* Download */}
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors"
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
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl border text-xs font-medium transition-colors ${btnBase}`}
            >
              <RefreshCw className="w-3 h-3" />
              Retry
            </button>
          )}
        </div>

        {/* Kai branding footer */}
        <div className={`px-3 pb-2.5 flex items-center gap-1 ${textMuted}`}>
          <Sparkles className="w-3 h-3" />
          <span className="text-xs">Generated by Kai Creative</span>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxOpen && displayUrl && (
        <ImageLightbox
          imageUrl={displayUrl}
          imageBase64={data.imageBase64}
          mimeType={data.mimeType}
          prompt={data.prompt}
          size={SIZE_LABELS[data.size] ?? data.size}
          onClose={() => setLightboxOpen(false)}
          onDownload={handleDownload}
          onEdit={() => { setLightboxOpen(false); handleEdit(); }}
          onOpenInCreative={() => { setLightboxOpen(false); handleOpenInCreative(); }}
        />
      )}
    </>
  );
}
