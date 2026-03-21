/**
 * Kai Creative Studio — Gemini-powered AI marketing image generator
 *
 * Three modes:
 *  1. Create Image  — text prompt → image (brand colors auto-injected)
 *  2. Logo Branding — upload logo + prompt → branded image
 *  3. Edit Image    — upload existing image + prompt → edited image
 *
 * Plus an Asset Library tab for saved images.
 */

import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Wand2,
  Upload,
  Download,
  RefreshCw,
  Trash2,
  Image as ImageIcon,
  Palette,
  Layers,
  X,
  Check,
  ChevronDown,
  Star,
  StarOff,
  Edit3,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Types ─────────────────────────────────────────────────────────────────────

type Mode = "create" | "edit" | "logo";
type ImageSize = "instagram_post" | "instagram_story" | "facebook_ad" | "flyer" | "website_banner";

interface GeneratedResult {
  imageUrl: string;
  imageBase64: string;
  mimeType: string;
  prompt: string;
  size: ImageSize;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SIZES: { id: ImageSize; label: string; ratio: string; description: string }[] = [
  { id: "instagram_post",  label: "Instagram Post",  ratio: "1:1",  description: "1080×1080" },
  { id: "instagram_story", label: "Instagram Story", ratio: "9:16", description: "1080×1920" },
  { id: "facebook_ad",     label: "Facebook Ad",     ratio: "4:5",  description: "1080×1350" },
  { id: "flyer",           label: "Flyer",           ratio: "3:4",  description: "1080×1440" },
  { id: "website_banner",  label: "Website Banner",  ratio: "16:9", description: "1920×1080" },
];

const PROMPT_SUGGESTIONS = [
  "Summer camp flyer for kids karate — bold, red and black, energetic",
  "Belt promotion celebration post — gold and black, professional",
  "Free trial class offer — include call to action and phone number",
  "Back to school special — karate for kids, fun and safe",
  "Adult self-defense class — strong, confident, modern design",
  "Grand opening announcement — exciting, community-focused",
];

// ── Main Component ────────────────────────────────────────────────────────────

export default function KaiCreative() {
  const { theme } = useTheme();
  const isDark = theme === "dark" || theme === "cinematic";

  // Mode
  const [mode, setMode] = useState<Mode>("create");

  // Inputs
  const [prompt, setPrompt] = useState("");
  const [size, setSize] = useState<ImageSize>("instagram_post");
  const [useBrandColors, setUseBrandColors] = useState(true);
  const [showSizeDropdown, setShowSizeDropdown] = useState(false);

  // Logo upload (logo mode)
  const [logoBase64, setLogoBase64] = useState<string | null>(null);
  const [logoMimeType, setLogoMimeType] = useState("image/png");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Source image upload (edit mode)
  const [sourceBase64, setSourceBase64] = useState<string | null>(null);
  const [sourceMimeType, setSourceMimeType] = useState("image/png");
  const [sourcePreview, setSourcePreview] = useState<string | null>(null);
  const sourceInputRef = useRef<HTMLInputElement>(null);

  // Results
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Tabs
  const [activeTab, setActiveTab] = useState<"studio" | "library">("studio");

  // ── tRPC mutations ──────────────────────────────────────────────────────────

  const generateMutation = trpc.kaiCreative.generate.useMutation({
    onSuccess: (data) => { setResult(data as GeneratedResult); setError(null); },
    onError: (err) => setError(err.message),
  });

  const generateWithLogoMutation = trpc.kaiCreative.generateWithLogo.useMutation({
    onSuccess: (data) => { setResult(data as GeneratedResult); setError(null); },
    onError: (err) => setError(err.message),
  });

  const editMutation = trpc.kaiCreative.edit.useMutation({
    onSuccess: (data) => { setResult(data as GeneratedResult); setError(null); },
    onError: (err) => setError(err.message),
  });

  const toggleFavoriteMutation = trpc.kaiCreative.toggleFavorite.useMutation();
  const deleteAssetMutation = trpc.kaiCreative.deleteAsset.useMutation({
    onSuccess: () => assetsQuery.refetch(),
  });

  // ── tRPC queries ────────────────────────────────────────────────────────────

  const brandQuery = trpc.kaiCreative.getBrandData.useQuery();
  const assetsQuery = trpc.kaiCreative.listAssets.useQuery(
    { assetType: "all", limit: 50 },
    { enabled: activeTab === "library" }
  );

  // ── File handlers ───────────────────────────────────────────────────────────

  const handleLogoUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setLogoBase64(dataUrl.split(",")[1]);
      setLogoMimeType(file.type || "image/png");
      setLogoPreview(dataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSourceUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setSourceBase64(dataUrl.split(",")[1]);
      setSourceMimeType(file.type || "image/png");
      setSourcePreview(dataUrl);
    };
    reader.readAsDataURL(file);
  }, []);

  // ── Generate handler ────────────────────────────────────────────────────────

  const handleGenerate = useCallback(() => {
    if (!prompt.trim()) return;
    setResult(null);
    setError(null);

    if (mode === "create") {
      generateMutation.mutate({ prompt: prompt.trim(), size, useBrandColors });
    } else if (mode === "logo") {
      if (!logoBase64) { setError("Please upload a logo first."); return; }
      generateWithLogoMutation.mutate({ prompt: prompt.trim(), logoBase64, logoMimeType, size, useBrandColors });
    } else {
      if (!sourceBase64) { setError("Please upload an image to edit first."); return; }
      editMutation.mutate({ prompt: prompt.trim(), sourceImageBase64: sourceBase64, sourceMimeType, size, useBrandColors });
    }
  }, [mode, prompt, size, useBrandColors, logoBase64, logoMimeType, sourceBase64, sourceMimeType,
      generateMutation, generateWithLogoMutation, editMutation]);

  const isLoading = generateMutation.isPending || generateWithLogoMutation.isPending || editMutation.isPending;

  // ── Download ────────────────────────────────────────────────────────────────

  const handleDownload = useCallback(() => {
    if (!result) return;
    const a = document.createElement("a");
    a.href = result.imageUrl;
    a.download = `kai-creative-${result.size}-${Date.now()}.${result.mimeType.includes("jpeg") ? "jpg" : "png"}`;
    a.target = "_blank";
    a.click();
  }, [result]);

  // ── Theme helpers ───────────────────────────────────────────────────────────

  const bg      = isDark ? "bg-[oklch(0.09_0.008_25)]" : "bg-slate-50";
  const card    = isDark ? "bg-[oklch(0.12_0.008_25)] border-white/8" : "bg-white border-slate-200";
  const text    = isDark ? "text-white" : "text-slate-900";
  const muted   = isDark ? "text-white/50" : "text-slate-400";
  const inputBg = isDark
    ? "bg-[oklch(0.16_0.008_25)] border-white/10 text-white placeholder-white/30 focus:border-red-500/50"
    : "bg-white border-slate-200 text-slate-900 placeholder-slate-400 focus:border-red-400";
  const tabActive   = "bg-red-600 text-white";
  const tabInactive = isDark ? "text-white/50 hover:text-white/80" : "text-slate-500 hover:text-slate-700";

  const selectedSizeInfo = SIZES.find((s) => s.id === size) ?? SIZES[0];
  const brand = brandQuery.data;

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className={`min-h-screen ${bg} pb-24`}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className={`sticky top-0 z-10 ${isDark ? "bg-[oklch(0.09_0.008_25)]/95" : "bg-slate-50/95"} backdrop-blur-xl border-b ${isDark ? "border-white/6" : "border-slate-200"} px-4 py-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
              <Wand2 className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className={`text-sm font-bold ${text}`}>Kai Creative</h1>
              <p className={`text-xs ${muted}`}>AI Marketing Studio · Gemini</p>
            </div>
          </div>

          {/* Studio / Library tabs */}
          <div className={`flex rounded-lg p-0.5 ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
            {(["studio", "library"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${activeTab === tab ? tabActive : tabInactive}`}
              >
                {tab === "library" && assetsQuery.data?.assets.length
                  ? `Library (${assetsQuery.data.assets.length})`
                  : tab === "library" ? "Library" : "Studio"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Studio Tab ─────────────────────────────────────────────────────── */}
      {activeTab === "studio" && (
        <div className="px-4 py-4 space-y-4 max-w-2xl mx-auto">

          {/* Mode selector */}
          <div className={`flex rounded-xl p-1 ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
            {([
              { id: "create" as Mode, label: "Create Image", icon: Sparkles },
              { id: "logo"   as Mode, label: "Logo Branding", icon: Palette },
              { id: "edit"   as Mode, label: "Edit Image",    icon: Edit3 },
            ]).map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setMode(id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${mode === id ? tabActive : tabInactive}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Brand badge */}
          {brand?.schoolName && (
            <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${isDark ? "bg-white/5 border-white/8" : "bg-slate-50 border-slate-200"}`}>
              <div className="w-2 h-2 rounded-full bg-green-400 shrink-0" />
              <span className={`text-xs ${muted} truncate`}>
                Brand: <span className={`font-medium ${text}`}>{brand.schoolName}</span>
                {brand.primaryColor && (
                  <span className="ml-2 inline-flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full border border-white/20 inline-block" style={{ backgroundColor: brand.primaryColor }} />
                    <span className="font-mono">{brand.primaryColor}</span>
                  </span>
                )}
              </span>
              <button
                onClick={() => setUseBrandColors(!useBrandColors)}
                className={`ml-auto shrink-0 text-xs px-2 py-0.5 rounded-full transition-colors ${
                  useBrandColors ? "bg-green-500/20 text-green-400" : isDark ? "bg-white/10 text-white/40" : "bg-slate-200 text-slate-400"
                }`}
              >
                {useBrandColors ? "Auto-brand ON" : "Auto-brand OFF"}
              </button>
            </div>
          )}

          {/* Logo upload (logo mode) */}
          {mode === "logo" && (
            <div
              onClick={() => logoInputRef.current?.click()}
              className={`rounded-xl border-2 border-dashed cursor-pointer transition-colors p-4 flex items-center gap-3 ${
                logoPreview
                  ? isDark ? "border-green-500/40 bg-green-500/5" : "border-green-400/40 bg-green-50"
                  : isDark ? "border-white/15 hover:border-red-500/40 bg-white/3" : "border-slate-200 hover:border-red-400/40"
              }`}
            >
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
              {logoPreview ? (
                <>
                  <img src={logoPreview} alt="Logo" className="w-12 h-12 object-contain rounded-lg" />
                  <div>
                    <p className={`text-sm font-medium ${text}`}>Logo uploaded</p>
                    <p className={`text-xs ${muted}`}>Click to change</p>
                  </div>
                  <Check className="w-4 h-4 text-green-400 ml-auto" />
                </>
              ) : (
                <>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDark ? "bg-white/8" : "bg-slate-100"}`}>
                    <Upload className={`w-5 h-5 ${muted}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${text}`}>Upload your logo</p>
                    <p className={`text-xs ${muted}`}>PNG, JPG, SVG — Kai incorporates it into the design</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Source image upload (edit mode) */}
          {mode === "edit" && (
            <div
              onClick={() => sourceInputRef.current?.click()}
              className={`rounded-xl border-2 border-dashed cursor-pointer transition-colors p-4 flex items-center gap-3 ${
                sourcePreview
                  ? isDark ? "border-green-500/40 bg-green-500/5" : "border-green-400/40 bg-green-50"
                  : isDark ? "border-white/15 hover:border-red-500/40 bg-white/3" : "border-slate-200 hover:border-red-400/40"
              }`}
            >
              <input ref={sourceInputRef} type="file" accept="image/*" className="hidden" onChange={handleSourceUpload} />
              {sourcePreview ? (
                <>
                  <img src={sourcePreview} alt="Source" className="w-12 h-12 object-cover rounded-lg" />
                  <div>
                    <p className={`text-sm font-medium ${text}`}>Image uploaded</p>
                    <p className={`text-xs ${muted}`}>Click to change</p>
                  </div>
                  <Check className="w-4 h-4 text-green-400 ml-auto" />
                </>
              ) : (
                <>
                  <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${isDark ? "bg-white/8" : "bg-slate-100"}`}>
                    <ImageIcon className={`w-5 h-5 ${muted}`} />
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${text}`}>Upload image to edit</p>
                    <p className={`text-xs ${muted}`}>Upload an existing flyer — Kai will modify it</p>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Prompt input */}
          <div className="space-y-2">
            <label className={`text-xs font-medium ${muted} uppercase tracking-wide`}>
              {mode === "create" ? "Describe your image" : mode === "logo" ? "Describe the design" : "Describe the edit"}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={
                mode === "create"
                  ? "e.g. Summer camp flyer for kids karate — bold, red and black, energetic"
                  : mode === "logo"
                  ? "e.g. Professional flyer with my logo, summer camp promotion, bold colors"
                  : "e.g. Change the background to dark red, make the text bigger, add a phone number"
              }
              rows={3}
              className={`w-full rounded-xl border px-4 py-3 text-sm resize-none outline-none transition-colors ${inputBg}`}
              onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleGenerate(); }}
            />
            {/* Quick suggestions */}
            {mode === "create" && !prompt && (
              <div className="flex flex-wrap gap-1.5">
                {PROMPT_SUGGESTIONS.slice(0, 3).map((s) => (
                  <button
                    key={s}
                    onClick={() => setPrompt(s)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                      isDark
                        ? "border-white/10 text-white/50 hover:border-red-500/40 hover:text-white/80"
                        : "border-slate-200 text-slate-400 hover:border-red-400/40 hover:text-slate-600"
                    }`}
                  >
                    {s.length > 45 ? s.slice(0, 45) + "…" : s}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Size selector */}
          <div className="space-y-2">
            <label className={`text-xs font-medium ${muted} uppercase tracking-wide`}>Export Size</label>
            <div className="relative">
              <button
                onClick={() => setShowSizeDropdown(!showSizeDropdown)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm transition-colors ${inputBg}`}
              >
                <span className="flex items-center gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded font-mono ${isDark ? "bg-white/10 text-white/60" : "bg-slate-100 text-slate-500"}`}>
                    {selectedSizeInfo.ratio}
                  </span>
                  <span className={text}>{selectedSizeInfo.label}</span>
                  <span className={`text-xs ${muted}`}>{selectedSizeInfo.description}</span>
                </span>
                <ChevronDown className={`w-4 h-4 ${muted} transition-transform ${showSizeDropdown ? "rotate-180" : ""}`} />
              </button>

              {showSizeDropdown && (
                <div className={`absolute top-full left-0 right-0 mt-1 rounded-xl border shadow-xl z-20 overflow-hidden ${isDark ? "bg-[oklch(0.14_0.008_25)] border-white/10" : "bg-white border-slate-200"}`}>
                  {SIZES.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => { setSize(s.id); setShowSizeDropdown(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                        size === s.id
                          ? isDark ? "bg-red-600/20 text-white" : "bg-red-50 text-red-700"
                          : isDark ? "hover:bg-white/5 text-white/80" : "hover:bg-slate-50 text-slate-700"
                      }`}
                    >
                      <span className={`text-xs px-1.5 py-0.5 rounded font-mono w-10 text-center ${isDark ? "bg-white/10 text-white/60" : "bg-slate-100 text-slate-500"}`}>
                        {s.ratio}
                      </span>
                      <span className="font-medium">{s.label}</span>
                      <span className={`text-xs ml-auto ${muted}`}>{s.description}</span>
                      {size === s.id && <Check className="w-3.5 h-3.5 text-red-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Generate button */}
          <Button
            onClick={handleGenerate}
            disabled={isLoading || !prompt.trim()}
            className="w-full h-12 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-900/20 transition-all disabled:opacity-50"
          >
            {isLoading ? (
              <span className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin" />
                Generating with Gemini…
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Wand2 className="w-4 h-4" />
                {mode === "create" ? "Create Image" : mode === "logo" ? "Brand It" : "Edit Image"}
                <span className="text-xs opacity-60">⌘↵</span>
              </span>
            )}
          </Button>

          {/* Error */}
          {error && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 flex items-start gap-2">
              <X className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Loading skeleton */}
          {isLoading && (
            <div className={`rounded-2xl border overflow-hidden ${card} animate-pulse`}>
              <div className={`${isDark ? "bg-white/5" : "bg-slate-100"} aspect-square w-full flex flex-col items-center justify-center gap-3`}>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                  <Wand2 className="w-5 h-5 text-white" />
                </div>
                <p className={`text-sm ${muted}`}>Kai is generating your image…</p>
                <p className={`text-xs ${muted} opacity-60`}>Powered by Gemini · 10–30 seconds</p>
              </div>
            </div>
          )}

          {/* Result */}
          {result && !isLoading && (
            <div className={`rounded-2xl border overflow-hidden ${card}`}>
              <div className="relative bg-black/10">
                <img
                  src={result.imageUrl}
                  alt={result.prompt}
                  className="w-full object-contain max-h-[520px]"
                />
                <div className="absolute top-3 left-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium backdrop-blur-sm ${isDark ? "bg-black/60 text-white/80" : "bg-white/80 text-slate-700"}`}>
                    {SIZES.find((s) => s.id === result.size)?.label ?? result.size}
                  </span>
                </div>
              </div>

              {/* Action bar */}
              <div className="p-3 flex items-center gap-2">
                <Button
                  onClick={handleDownload}
                  size="sm"
                  className="flex-1 bg-red-600 hover:bg-red-500 text-white rounded-lg h-9"
                >
                  <Download className="w-3.5 h-3.5 mr-1.5" />
                  Download
                </Button>
                <Button
                  onClick={handleGenerate}
                  size="sm"
                  variant="outline"
                  className={`rounded-lg h-9 ${isDark ? "border-white/10 text-white/70 hover:bg-white/5" : "border-slate-200 text-slate-600"}`}
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Retry
                </Button>
                <Button
                  onClick={() => {
                    setMode("edit");
                    setSourceBase64(result.imageBase64);
                    setSourceMimeType(result.mimeType);
                    setSourcePreview(result.imageUrl);
                    setPrompt("");
                  }}
                  size="sm"
                  variant="outline"
                  className={`rounded-lg h-9 ${isDark ? "border-white/10 text-white/70 hover:bg-white/5" : "border-slate-200 text-slate-600"}`}
                >
                  <Edit3 className="w-3.5 h-3.5 mr-1.5" />
                  Edit
                </Button>
              </div>

              {/* Prompt used */}
              <div className="px-3 pb-3">
                <p className={`text-xs ${muted} line-clamp-2`}>
                  <span className="font-medium">Prompt used:</span> {result.prompt}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Library Tab ────────────────────────────────────────────────────── */}
      {activeTab === "library" && (
        <div className="px-4 py-4 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-sm font-semibold ${text}`}>Saved Images</h2>
            <button
              onClick={() => assetsQuery.refetch()}
              className={`text-xs ${muted} flex items-center gap-1 hover:opacity-80 transition-opacity`}
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>

          {assetsQuery.isLoading && (
            <div className="grid grid-cols-2 gap-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className={`aspect-square rounded-xl ${isDark ? "bg-white/5" : "bg-slate-100"} animate-pulse`} />
              ))}
            </div>
          )}

          {!assetsQuery.isLoading && assetsQuery.data?.assets.length === 0 && (
            <div className={`text-center py-16 ${muted}`}>
              <Layers className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No saved images yet.</p>
              <p className="text-xs mt-1 opacity-60">Generated images are saved here automatically.</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            {assetsQuery.data?.assets.map((asset) => (
              <div key={asset.id} className={`relative rounded-xl overflow-hidden border ${card} group`}>
                <img src={asset.url} alt={asset.name} className="w-full aspect-square object-cover" />
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2 gap-1">
                  <button
                    onClick={() => {
                      const a = document.createElement("a");
                      a.href = asset.url;
                      a.download = `${asset.name}.png`;
                      a.target = "_blank";
                      a.click();
                    }}
                    className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs transition-colors"
                  >
                    <Download className="w-3 h-3" />
                    Save
                  </button>
                  <button
                    onClick={() => toggleFavoriteMutation.mutate({ assetId: asset.id, isFavorited: !asset.isFavorited })}
                    className="p-1.5 rounded-lg bg-white/20 hover:bg-white/30 text-white transition-colors"
                  >
                    {asset.isFavorited
                      ? <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                      : <StarOff className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => deleteAssetMutation.mutate({ assetId: asset.id })}
                    className="p-1.5 rounded-lg bg-red-500/40 hover:bg-red-500/60 text-white transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                {/* Size badge */}
                {asset.outputSize && (
                  <div className="absolute top-2 left-2 pointer-events-none">
                    <span className="text-xs px-1.5 py-0.5 rounded bg-black/60 text-white/80 backdrop-blur-sm">
                      {SIZES.find((s) => s.id === asset.outputSize)?.ratio ?? asset.outputSize}
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
