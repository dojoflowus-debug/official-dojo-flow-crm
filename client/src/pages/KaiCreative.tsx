import { useState, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import {
  Sparkles,
  Wand2,
  Upload,
  Download,
  RefreshCw,
  Copy,
  Trash2,
  Heart,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Palette,
  Layers,
  X,
  Check,
  Star,
  StarOff,
  ZoomIn,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { CREATIVE_TEMPLATES, OUTPUT_SIZES, type OutputSize } from "../../../shared/kaiCreativeTemplates";

// ─── Types ────────────────────────────────────────────────────────────────────
interface GeneratedResult {
  url: string;
  prompt: string;
  followUpSuggestions: string[];
  templateId?: string;
  outputSize: OutputSize;
}

// ─── Size selector options ────────────────────────────────────────────────────
const SIZE_OPTIONS: { id: OutputSize; label: string; icon: string }[] = [
  { id: "instagram_post",  label: "Instagram Post",  icon: "📷" },
  { id: "instagram_story", label: "Instagram Story", icon: "📱" },
  { id: "facebook_ad",     label: "Facebook Ad",     icon: "📘" },
  { id: "facebook_post",   label: "Facebook Post",   icon: "📰" },
  { id: "flyer",           label: "Flyer",           icon: "📄" },
  { id: "poster",          label: "Poster",          icon: "🖼️" },
  { id: "website_banner",  label: "Website Banner",  icon: "🌐" },
  { id: "sms_graphic",     label: "SMS Graphic",     icon: "💬" },
  { id: "email_header",    label: "Email Header",    icon: "📧" },
];

// ─── Kai Creative Page ────────────────────────────────────────────────────────
export default function KaiCreative() {
  const { theme } = useTheme();
  const isDark = theme === "dark" || theme === "cinematic";

  // ── State ──────────────────────────────────────────────────────────────────
  const [prompt, setPrompt] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<OutputSize>("instagram_post");
  const [showTemplates, setShowTemplates] = useState(true);
  const [showAssetLibrary, setShowAssetLibrary] = useState(false);
  const [activeTab, setActiveTab] = useState<"create" | "library">("create");
  const [result, setResult] = useState<GeneratedResult | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadedImageBase64, setUploadedImageBase64] = useState<string | null>(null);
  const [uploadedImageName, setUploadedImageName] = useState<string>("");
  const [copiedSuggestion, setCopiedSuggestion] = useState<string | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadAssetRef = useRef<HTMLInputElement>(null);

  // ── tRPC ───────────────────────────────────────────────────────────────────
  const generateMutation = trpc.kaiCreative.generate.useMutation();
  const uploadAssetMutation = trpc.kaiCreative.uploadAsset.useMutation();
  const deleteAssetMutation = trpc.kaiCreative.deleteAsset.useMutation();
  const toggleFavoriteMutation = trpc.kaiCreative.toggleFavorite.useMutation();

  const { data: brandData } = trpc.kaiCreative.getBrandData.useQuery();
  const { data: assetsData, refetch: refetchAssets } = trpc.kaiCreative.listAssets.useQuery({
    assetType: "all",
    limit: 50,
  });
  const { data: generatedData, refetch: refetchGenerated } = trpc.kaiCreative.listAssets.useQuery({
    assetType: "generated",
    limit: 24,
  });

  // ── Template selection ─────────────────────────────────────────────────────
  const handleSelectTemplate = (templateId: string) => {
    const template = CREATIVE_TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    setSelectedTemplate(templateId);
    setSelectedSize(template.defaultSize);
    // Pre-fill prompt with a user-friendly version
    const year = new Date().getFullYear();
    const schoolName = brandData?.schoolName || "your school";
    const phone = brandData?.phone || "your phone";
    const website = brandData?.website || "your website";
    const tagline = brandData?.tagline || "Train Hard. Live Well.";
    let filledPrompt = template.promptTemplate
      .replace(/{schoolName}/g, schoolName)
      .replace(/{primaryColor}/g, brandData?.primaryColor || "#E53935")
      .replace(/{tagline}/g, tagline)
      .replace(/{phone}/g, phone)
      .replace(/{website}/g, website || "your website")
      .replace(/{year}/g, year.toString());
    setPrompt(filledPrompt);
  };

  // ── Image upload for editing ───────────────────────────────────────────────
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreviewUrl(dataUrl);
      setUploadedImageBase64(dataUrl.split(",")[1]);
      setUploadedImageName(file.name);
      setEditMode(true);
    };
    reader.readAsDataURL(file);
  }, []);

  // ── Asset upload ───────────────────────────────────────────────────────────
  const handleAssetUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, assetType: "uploaded_logo" | "uploaded_photo" | "uploaded_other") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      const base64Data = dataUrl.split(",")[1];
      try {
        await uploadAssetMutation.mutateAsync({
          name: file.name,
          assetType,
          base64Data,
          mimeType: file.type || "image/png",
        });
        refetchAssets();
      } catch (err) {
        console.error("Asset upload failed:", err);
      }
    };
    reader.readAsDataURL(file);
  }, [uploadAssetMutation, refetchAssets]);

  // ── Generate ───────────────────────────────────────────────────────────────
  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    try {
      const res = await generateMutation.mutateAsync({
        prompt: prompt.trim(),
        templateId: selectedTemplate ?? undefined,
        outputSize: selectedSize,
      });
      setResult({
        url: res.url,
        prompt: res.prompt,
        followUpSuggestions: res.followUpSuggestions,
        templateId: selectedTemplate ?? undefined,
        outputSize: selectedSize,
      });
      refetchGenerated();
    } catch (err) {
      console.error("Generation failed:", err);
    }
  };

  // ── Edit existing image ────────────────────────────────────────────────────
  const handleEdit = async () => {
    if (!prompt.trim()) return;
    const referenceUrl = result?.url || undefined;
    try {
      const res = await generateMutation.mutateAsync({
        prompt: prompt.trim(),
        outputSize: selectedSize,
        referenceImageUrl: referenceUrl,
      });
      setResult({
        url: res.url,
        prompt: res.prompt,
        followUpSuggestions: res.followUpSuggestions,
        outputSize: selectedSize,
      });
      refetchGenerated();
    } catch (err) {
      console.error("Edit failed:", err);
    }
  };

  // ── Download ───────────────────────────────────────────────────────────────
  const handleDownload = async (url: string, name?: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.download = name || `kai-creative-${Date.now()}.png`;
    link.target = "_blank";
    link.click();
  };

  // ── Follow-up suggestion click ─────────────────────────────────────────────
  const handleFollowUp = (suggestion: string) => {
    setPrompt(suggestion);
    setCopiedSuggestion(suggestion);
    setTimeout(() => setCopiedSuggestion(null), 2000);
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const bg = isDark ? "bg-[oklch(0.09_0.008_25)]" : "bg-slate-50";
  const card = isDark ? "bg-[oklch(0.12_0.008_25)] border-white/8" : "bg-white border-slate-200";
  const text = isDark ? "text-white" : "text-slate-900";
  const muted = isDark ? "text-white/50" : "text-slate-400";
  const inputBg = isDark ? "bg-[oklch(0.16_0.008_25)] border-white/10 text-white placeholder-white/30" : "bg-white border-slate-200 text-slate-900 placeholder-slate-400";

  return (
    <div className={`min-h-screen ${bg} pb-24`}>
      {/* Header */}
      <div className={`sticky top-0 z-10 ${isDark ? "bg-[oklch(0.09_0.008_25)]/90" : "bg-slate-50/90"} backdrop-blur-xl border-b ${isDark ? "border-white/6" : "border-slate-200"} px-4 py-3`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#E53935] to-[#FF6F00] flex items-center justify-center shadow-lg">
              <Wand2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className={`text-lg font-bold ${text}`}>Kai Creative</h1>
              <p className={`text-xs ${muted}`}>AI Marketing Studio</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab("create")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "create"
                  ? "bg-[#E53935] text-white"
                  : isDark ? "text-white/60 hover:text-white" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Create
            </button>
            <button
              onClick={() => setActiveTab("library")}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "library"
                  ? "bg-[#E53935] text-white"
                  : isDark ? "text-white/60 hover:text-white" : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Library {assetsData?.assets?.length ? `(${assetsData.assets.length})` : ""}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-4 space-y-4">

        {/* ── CREATE TAB ── */}
        {activeTab === "create" && (
          <>
            {/* Brand Status Bar */}
            {brandData && (
              <div className={`rounded-xl border ${card} p-3 flex items-center gap-3 flex-wrap`}>
                <div className="flex items-center gap-2">
                  <div
                    className="w-5 h-5 rounded-full border-2 border-white/20 flex-shrink-0"
                    style={{ backgroundColor: brandData.primaryColor || "#E53935" }}
                  />
                  <span className={`text-xs font-medium ${text}`}>{brandData.schoolName || "Your School"}</span>
                </div>
                {brandData.tagline && (
                  <span className={`text-xs ${muted} italic`}>"{brandData.tagline}"</span>
                )}
                <div className="ml-auto flex items-center gap-1">
                  {brandData.logoLightUrl && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-green-500/20 text-green-400">Logo ✓</span>
                  )}
                  {brandData.primaryColor && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">Colors ✓</span>
                  )}
                </div>
              </div>
            )}

            {/* Template Library */}
            <div className={`rounded-xl border ${card} overflow-hidden`}>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className={`w-full flex items-center justify-between px-4 py-3 ${isDark ? "hover:bg-white/4" : "hover:bg-slate-50"} transition-colors`}
              >
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-[#E53935]" />
                  <span className={`text-sm font-semibold ${text}`}>Templates</span>
                  <span className={`text-xs ${muted}`}>({CREATIVE_TEMPLATES.length} martial arts templates)</span>
                </div>
                {showTemplates ? <ChevronUp className={`w-4 h-4 ${muted}`} /> : <ChevronDown className={`w-4 h-4 ${muted}`} />}
              </button>
              {showTemplates && (
                <div className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {CREATIVE_TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTemplate(t.id)}
                      className={`text-left p-3 rounded-xl border transition-all ${
                        selectedTemplate === t.id
                          ? "border-[#E53935] bg-[#E53935]/10"
                          : isDark
                            ? "border-white/8 hover:border-white/20 bg-white/3"
                            : "border-slate-200 hover:border-slate-300 bg-slate-50"
                      }`}
                    >
                      <div className="text-xl mb-1">{t.emoji}</div>
                      <div className={`text-xs font-semibold ${text} leading-tight`}>{t.name}</div>
                      <div className={`text-xs ${muted} mt-0.5 leading-tight`}>{t.description}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Prompt + Controls */}
            <div className={`rounded-xl border ${card} p-4 space-y-3`}>
              {/* Upload for editing */}
              {editMode && previewUrl && (
                <div className="relative rounded-xl overflow-hidden border border-[#E53935]/40 mb-2">
                  <img src={previewUrl} alt="Reference" className="w-full max-h-48 object-contain bg-black/20" />
                  <button
                    onClick={() => { setEditMode(false); setPreviewUrl(null); setUploadedImageBase64(null); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 flex items-center justify-center text-white hover:bg-black/80"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <div className="absolute bottom-2 left-2 text-xs text-white/80 bg-black/50 px-2 py-0.5 rounded-full">
                    Editing: {uploadedImageName}
                  </div>
                </div>
              )}

              {/* Prompt textarea */}
              <div>
                <label className={`text-xs font-semibold ${muted} uppercase tracking-wide mb-1.5 block`}>
                  {editMode ? "What should Kai change?" : "Describe your graphic"}
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder={
                    editMode
                      ? "e.g. Put my logo in the top right corner, make the background darker..."
                      : "e.g. Create a summer camp flyer for Little Ninjas, ages 5–12..."
                  }
                  rows={4}
                  className={`w-full rounded-xl border px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#E53935]/40 ${inputBg}`}
                />
              </div>

              {/* Size selector */}
              <div>
                <label className={`text-xs font-semibold ${muted} uppercase tracking-wide mb-1.5 block`}>Output Size</label>
                <div className="flex flex-wrap gap-2">
                  {SIZE_OPTIONS.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => setSelectedSize(s.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                        selectedSize === s.id
                          ? "bg-[#E53935] border-[#E53935] text-white"
                          : isDark
                            ? "border-white/10 text-white/60 hover:border-white/30 hover:text-white"
                            : "border-slate-200 text-slate-500 hover:border-slate-400 hover:text-slate-700"
                      }`}
                    >
                      <span>{s.icon}</span>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pt-1">
                <Button
                  onClick={editMode ? handleEdit : handleGenerate}
                  disabled={!prompt.trim() || generateMutation.isPending}
                  className="flex-1 h-11 bg-[#E53935] hover:bg-[#C62828] text-white font-semibold rounded-xl gap-2"
                >
                  {generateMutation.isPending ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Kai is creating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      {editMode ? "Apply Changes" : "Create Image"}
                    </>
                  )}
                </Button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className={`h-11 px-4 rounded-xl border font-medium text-sm flex items-center gap-2 transition-colors ${
                    isDark
                      ? "border-white/10 text-white/70 hover:border-white/30 hover:text-white"
                      : "border-slate-200 text-slate-600 hover:border-slate-400"
                  }`}
                >
                  <Upload className="w-4 h-4" />
                  Upload
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                />
              </div>
            </div>

            {/* Result */}
            {result && (
              <div className={`rounded-xl border ${card} overflow-hidden`}>
                {/* Image preview */}
                <div className="relative group">
                  <img
                    src={result.url}
                    alt="Generated marketing image"
                    className="w-full object-contain max-h-[480px] bg-black/10 cursor-zoom-in"
                    onClick={() => setLightboxUrl(result.url)}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <ZoomIn className="w-8 h-8 text-white drop-shadow-lg" />
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button
                      onClick={() => handleDownload(result.url)}
                      className="flex-1 h-10 bg-[#E53935] hover:bg-[#C62828] text-white rounded-xl gap-2 text-sm"
                    >
                      <Download className="w-4 h-4" />
                      Download
                    </Button>
                    <button
                      onClick={() => {
                        setPrompt("");
                        setEditMode(true);
                      }}
                      className={`h-10 px-4 rounded-xl border text-sm flex items-center gap-2 transition-colors ${
                        isDark ? "border-white/10 text-white/70 hover:border-white/30" : "border-slate-200 text-slate-600 hover:border-slate-400"
                      }`}
                    >
                      <Wand2 className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={handleGenerate}
                      disabled={generateMutation.isPending}
                      className={`h-10 px-4 rounded-xl border text-sm flex items-center gap-2 transition-colors ${
                        isDark ? "border-white/10 text-white/70 hover:border-white/30" : "border-slate-200 text-slate-600 hover:border-slate-400"
                      }`}
                    >
                      <RefreshCw className={`w-4 h-4 ${generateMutation.isPending ? "animate-spin" : ""}`} />
                      Regenerate
                    </button>
                  </div>

                  {/* Kai follow-up suggestions */}
                  {result.followUpSuggestions.length > 0 && (
                    <div>
                      <p className={`text-xs font-semibold ${muted} mb-2`}>Kai suggests:</p>
                      <div className="flex flex-wrap gap-2">
                        {result.followUpSuggestions.map((s, i) => (
                          <button
                            key={i}
                            onClick={() => handleFollowUp(s)}
                            className={`text-xs px-3 py-1.5 rounded-full border transition-all flex items-center gap-1.5 ${
                              copiedSuggestion === s
                                ? "border-green-500 bg-green-500/10 text-green-400"
                                : isDark
                                  ? "border-white/10 text-white/60 hover:border-[#E53935]/60 hover:text-white bg-white/3"
                                  : "border-slate-200 text-slate-500 hover:border-[#E53935]/60 hover:text-slate-900"
                            }`}
                          >
                            {copiedSuggestion === s ? <Check className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                            {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Past generations grid */}
            {generatedData?.assets && generatedData.assets.length > 0 && (
              <div>
                <h3 className={`text-sm font-semibold ${text} mb-3`}>Recent Creations</h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {generatedData.assets.slice(0, 9).map((asset) => (
                    <div
                      key={asset.id}
                      className={`rounded-xl border ${card} overflow-hidden group cursor-pointer`}
                      onClick={() => setLightboxUrl(asset.url)}
                    >
                      <div className="relative aspect-square bg-black/10">
                        <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDownload(asset.url, asset.name); }}
                            className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavoriteMutation.mutate({ assetId: asset.id, isFavorited: !asset.isFavorited });
                              refetchGenerated();
                            }}
                            className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/40"
                          >
                            {asset.isFavorited ? <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" /> : <StarOff className="w-4 h-4" />}
                          </button>
                        </div>
                      </div>
                      <div className="p-2">
                        <p className={`text-xs ${muted} truncate`}>{asset.outputSize?.replace("_", " ") || "image"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* ── LIBRARY TAB ── */}
        {activeTab === "library" && (
          <div className="space-y-4">
            {/* Upload buttons */}
            <div className="grid grid-cols-3 gap-3">
              {(["uploaded_logo", "uploaded_photo", "uploaded_other"] as const).map((type) => (
                <button
                  key={type}
                  onClick={() => uploadAssetRef.current?.click()}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-dashed transition-colors ${
                    isDark
                      ? "border-white/15 text-white/50 hover:border-[#E53935]/60 hover:text-white"
                      : "border-slate-300 text-slate-400 hover:border-[#E53935]/60 hover:text-slate-700"
                  }`}
                >
                  <Plus className="w-5 h-5" />
                  <span className="text-xs font-medium capitalize">
                    {type === "uploaded_logo" ? "Upload Logo" : type === "uploaded_photo" ? "Upload Photo" : "Upload Other"}
                  </span>
                </button>
              ))}
            </div>
            <input
              ref={uploadAssetRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleAssetUpload(e, "uploaded_logo")}
            />

            {/* Asset grid */}
            {assetsData?.assets && assetsData.assets.length > 0 ? (
              <>
                {/* Logos */}
                {assetsData.assets.filter((a) => a.assetType === "uploaded_logo").length > 0 && (
                  <div>
                    <h3 className={`text-sm font-semibold ${text} mb-2`}>Logos</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {assetsData.assets.filter((a) => a.assetType === "uploaded_logo").map((asset) => (
                        <AssetCard key={asset.id} asset={asset} isDark={isDark} onDelete={() => { deleteAssetMutation.mutate({ assetId: asset.id }); refetchAssets(); }} onDownload={() => handleDownload(asset.url, asset.name)} onZoom={() => setLightboxUrl(asset.url)} />
                      ))}
                    </div>
                  </div>
                )}
                {/* Photos */}
                {assetsData.assets.filter((a) => a.assetType === "uploaded_photo").length > 0 && (
                  <div>
                    <h3 className={`text-sm font-semibold ${text} mb-2`}>Photos</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                      {assetsData.assets.filter((a) => a.assetType === "uploaded_photo").map((asset) => (
                        <AssetCard key={asset.id} asset={asset} isDark={isDark} onDelete={() => { deleteAssetMutation.mutate({ assetId: asset.id }); refetchAssets(); }} onDownload={() => handleDownload(asset.url, asset.name)} onZoom={() => setLightboxUrl(asset.url)} />
                      ))}
                    </div>
                  </div>
                )}
                {/* Generated */}
                {assetsData.assets.filter((a) => a.assetType === "generated").length > 0 && (
                  <div>
                    <h3 className={`text-sm font-semibold ${text} mb-2`}>Generated Images</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {assetsData.assets.filter((a) => a.assetType === "generated").map((asset) => (
                        <AssetCard key={asset.id} asset={asset} isDark={isDark} onDelete={() => { deleteAssetMutation.mutate({ assetId: asset.id }); refetchAssets(); }} onDownload={() => handleDownload(asset.url, asset.name)} onZoom={() => setLightboxUrl(asset.url)} />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className={`rounded-xl border ${card} p-12 text-center`}>
                <ImageIcon className={`w-10 h-10 ${muted} mx-auto mb-3`} />
                <p className={`text-sm font-medium ${text}`}>No assets yet</p>
                <p className={`text-xs ${muted} mt-1`}>Upload logos, photos, or generate images to build your library.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20"
            onClick={() => setLightboxUrl(null)}
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxUrl}
            alt="Preview"
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={(e) => { e.stopPropagation(); handleDownload(lightboxUrl); }}
            className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E53935] text-white text-sm font-medium hover:bg-[#C62828]"
          >
            <Download className="w-4 h-4" />
            Download
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Asset Card Component ─────────────────────────────────────────────────────
function AssetCard({
  asset,
  isDark,
  onDelete,
  onDownload,
  onZoom,
}: {
  asset: { id: number; name: string; url: string; assetType: string; isFavorited: boolean };
  isDark: boolean;
  onDelete: () => void;
  onDownload: () => void;
  onZoom: () => void;
}) {
  const card = isDark ? "bg-[oklch(0.12_0.008_25)] border-white/8" : "bg-white border-slate-200";
  return (
    <div className={`rounded-xl border ${card} overflow-hidden group`}>
      <div className="relative aspect-square bg-black/10 cursor-pointer" onClick={onZoom}>
        <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          <button onClick={(e) => { e.stopPropagation(); onDownload(); }} className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/40">
            <Download className="w-3.5 h-3.5" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="w-7 h-7 rounded-full bg-red-500/60 flex items-center justify-center text-white hover:bg-red-500/80">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="px-2 py-1.5">
        <p className={`text-xs truncate ${isDark ? "text-white/50" : "text-slate-400"}`}>{asset.name}</p>
      </div>
    </div>
  );
}
