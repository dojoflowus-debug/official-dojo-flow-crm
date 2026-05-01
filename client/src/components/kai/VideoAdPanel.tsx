/**
 * VideoAdPanel — generates AI video reels with ElevenLabs voiceover + ffmpeg assembly
 * Supports Instagram Reels (9:16), Stories (9:16), and Square (1:1) formats
 */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useTheme } from "@/contexts/ThemeContext";
import { Video, RefreshCw, Sparkles, Download, Play, FileText, Clock, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VideoAdPanelProps {
  initialProgram?: string;
}

export function VideoAdPanel({ initialProgram = "" }: VideoAdPanelProps) {
  const { isDark } = useTheme();
  const text = isDark ? "text-white/90" : "text-slate-800";
  const muted = isDark ? "text-white/40" : "text-slate-400";
  const cardBg = isDark ? "bg-white/5 border-white/8" : "bg-white border-slate-200";
  const inputBg = isDark ? "bg-white/8 border-white/12 text-white placeholder-white/30" : "bg-white border-slate-300 text-slate-800 placeholder-slate-400";
  const sectionBg = isDark ? "bg-white/4 border-white/6" : "bg-slate-50 border-slate-200";

  const [program, setProgram] = useState(initialProgram);
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("energetic and motivational");
  const [format, setFormat] = useState<"reel" | "story" | "square">("reel");
  const [activeScriptTab, setActiveScriptTab] = useState<"full" | "overlays">("full");

  const mutation = trpc.kaiCreative.generateVideoAd.useMutation();

  const handleGenerate = () => {
    if (!program.trim()) return;
    mutation.mutate({
      program: program.trim(),
      audience: audience.trim() || "all ages",
      tone,
      format,
    });
  };

  const data = mutation.data;
  const script = data?.script;

  const handleDownload = () => {
    if (!data?.videoUrl) return;
    const a = document.createElement("a");
    a.href = data.videoUrl;
    a.download = `${program.replace(/\s+/g, "-").toLowerCase()}-${format}-ad.mp4`;
    a.click();
  };

  return (
    <div className="flex flex-col gap-4 px-4 py-4">
      {/* Input section */}
      <div className={`rounded-xl border p-4 ${cardBg} flex flex-col gap-3`}>
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-red-400" />
          <span className={`text-sm font-semibold ${text}`}>AI Video Ad Generator</span>
          <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 font-medium">NEW</span>
        </div>
        <p className={`text-xs ${muted}`}>Generate a 15-30 second video ad with AI voiceover, text overlays, and your brand colors. Ready for Instagram Reels, TikTok, and Facebook Video.</p>

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

          <div className="grid grid-cols-2 gap-2">
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value)}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-red-500/50 ${inputBg}`}
            >
              <option value="energetic and motivational">Energetic & Motivational</option>
              <option value="bold and conversion-focused">Bold & Conversion-Focused</option>
              <option value="warm and family-focused">Warm & Family-Focused</option>
              <option value="professional and authoritative">Professional & Authoritative</option>
              <option value="inspirational and empowering">Inspirational & Empowering</option>
            </select>

            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as "reel" | "story" | "square")}
              className={`w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-red-500/50 ${inputBg}`}
            >
              <option value="reel">Reel / TikTok (9:16)</option>
              <option value="story">Story (9:16)</option>
              <option value="square">Square (1:1)</option>
            </select>
          </div>
        </div>

        {/* What's included */}
        <div className={`rounded-lg border p-3 ${sectionBg} flex flex-col gap-1.5`}>
          <p className={`text-xs font-medium ${muted}`}>What Kai generates:</p>
          <div className="grid grid-cols-2 gap-1">
            {[
              { icon: FileText, label: "AI video script" },
              { icon: Mic, label: "ElevenLabs voiceover" },
              { icon: Video, label: "Text overlays" },
              { icon: Clock, label: "15-30 seconds" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5">
                <Icon className="w-3 h-3 text-red-400" />
                <span className={`text-xs ${muted}`}>{label}</span>
              </div>
            ))}
          </div>
        </div>

        <Button
          onClick={handleGenerate}
          disabled={mutation.isPending || !program.trim()}
          className="w-full bg-red-600 hover:bg-red-700 text-white text-sm"
        >
          {mutation.isPending ? (
            <><RefreshCw className="w-3.5 h-3.5 mr-2 animate-spin" />Generating video (30-60s)...</>
          ) : (
            <><Sparkles className="w-3.5 h-3.5 mr-2" />Generate Video Ad</>
          )}
        </Button>

        {mutation.isPending && (
          <div className={`rounded-lg border p-3 ${sectionBg}`}>
            <p className={`text-xs ${muted} text-center`}>
              ✍️ Writing script → 🎙️ Generating voiceover → 🎬 Assembling video...
            </p>
          </div>
        )}

        {mutation.error && (
          <p className="text-xs text-red-400">{mutation.error.message}</p>
        )}
      </div>

      {/* Script preview */}
      {script && (
        <div className={`rounded-xl border ${cardBg} overflow-hidden`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
            <span className={`text-sm font-semibold ${text}`}>Generated Script</span>
            <span className={`text-xs ${muted}`}>~{script.estimatedDuration}s</span>
          </div>

          {/* Script tabs */}
          <div className="flex border-b border-white/8">
            {(["full", "overlays"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveScriptTab(tab)}
                className={`px-4 py-2 text-xs font-medium transition-colors border-b-2 ${
                  activeScriptTab === tab
                    ? "border-red-500 text-red-400"
                    : `border-transparent ${muted} hover:text-white/70`
                }`}
              >
                {tab === "full" ? "Full Script" : "Text Overlays"}
              </button>
            ))}
          </div>

          <div className="p-4">
            {activeScriptTab === "full" && (
              <div className="flex flex-col gap-3">
                <div className={`rounded-lg border p-3 ${sectionBg}`}>
                  <p className={`text-xs font-medium text-red-400 mb-1`}>🎯 Hook (0-3s)</p>
                  <p className={`text-sm ${text} leading-relaxed`}>{script.hook}</p>
                </div>
                <div className={`rounded-lg border p-3 ${sectionBg}`}>
                  <p className={`text-xs font-medium text-amber-400 mb-1`}>📖 Story (3-20s)</p>
                  <p className={`text-sm ${text} leading-relaxed`}>{script.story}</p>
                </div>
                <div className={`rounded-lg border p-3 ${sectionBg}`}>
                  <p className={`text-xs font-medium text-green-400 mb-1`}>📣 CTA (last 5s)</p>
                  <p className={`text-sm ${text} leading-relaxed`}>{script.cta}</p>
                </div>
              </div>
            )}

            {activeScriptTab === "overlays" && (
              <div className="flex flex-col gap-2">
                {script.textOverlays.map((overlay, i) => (
                  <div key={i} className={`flex items-start gap-3 rounded-lg border p-3 ${sectionBg}`}>
                    <span className={`text-xs font-mono ${muted} w-10 shrink-0`}>{overlay.time}s</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded shrink-0 ${
                      overlay.style === "hook" ? "bg-red-500/20 text-red-400" :
                      overlay.style === "cta" ? "bg-green-500/20 text-green-400" :
                      "bg-amber-500/20 text-amber-400"
                    }`}>{overlay.style}</span>
                    <span className={`text-sm ${text} flex-1`}>{overlay.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Video result */}
      {data?.success && data.videoUrl && (
        <div className={`rounded-xl border ${cardBg} overflow-hidden`}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4 text-green-400" />
              <span className={`text-sm font-semibold ${text}`}>Video Ready</span>
            </div>
            <Button
              onClick={handleDownload}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white text-xs h-7"
            >
              <Download className="w-3 h-3 mr-1" />
              Download MP4
            </Button>
          </div>
          <div className="p-4">
            <video
              src={data.videoUrl}
              controls
              className="w-full rounded-lg max-h-96 bg-black"
              style={{ aspectRatio: format === "square" ? "1/1" : "9/16", maxWidth: format !== "square" ? "280px" : "100%", margin: "0 auto", display: "block" }}
            />
            <p className={`text-xs ${muted} text-center mt-2`}>
              {format === "reel" ? "Instagram Reel / TikTok (9:16)" : format === "story" ? "Story (9:16)" : "Square (1:1)"} · {data.durationSeconds}s
            </p>
          </div>
        </div>
      )}

      {data && !data.success && (
        <div className={`rounded-xl border border-red-500/30 p-4 ${isDark ? "bg-red-500/10" : "bg-red-50"}`}>
          <p className="text-xs text-red-400 font-medium">Video generation failed</p>
          <p className={`text-xs ${muted} mt-1`}>{data.error}</p>
        </div>
      )}
    </div>
  );
}
