import React, { useState } from "react";
import { Grid3x3, Sparkles, RotateCcw, Save, ChevronDown, AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutControlsProps {
  onApplyLayout: (preset: string, rows: number, cols: number, spacing: number, padding: number) => void;
  onResetLayout: () => void;
  onSaveLayout: () => void;
  isVisible: boolean;
}

type LayoutPreset = "grid" | "staggered" | "perimeter" | "bag_wall";

const LAYOUT_PRESETS: Record<LayoutPreset, { label: string; description: string; defaultRows: number; defaultCols: number }> = {
  grid: { label: "Grid", description: "Uniform grid layout", defaultRows: 3, defaultCols: 7 },
  staggered: { label: "Staggered", description: "Offset rows for depth", defaultRows: 4, defaultCols: 6 },
  perimeter: { label: "Perimeter", description: "Spots around edges", defaultRows: 2, defaultCols: 10 },
  bag_wall: { label: "Bag Wall", description: "Single row front", defaultRows: 1, defaultCols: 21 },
};

export function LayoutControls({
  onApplyLayout,
  onResetLayout,
  onSaveLayout,
  isVisible,
}: LayoutControlsProps) {
  const [selectedPreset, setSelectedPreset] = useState<LayoutPreset>("grid");
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(7);
  const [spacing, setSpacing] = useState(3); // feet
  const [padding, setPadding] = useState(2); // feet
  const [isExpanded, setIsExpanded] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handlePresetChange = (preset: LayoutPreset) => {
    setSelectedPreset(preset);
    const presetConfig = LAYOUT_PRESETS[preset];
    setRows(presetConfig.defaultRows);
    setCols(presetConfig.defaultCols);
  };

  const handleApply = () => {
    onApplyLayout(selectedPreset, rows, cols, spacing, padding);
  };

  const handleResetConfirm = () => {
    onResetLayout();
    setShowResetConfirm(false);
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.7)" }}
        >
          <div 
            className="max-w-md w-full mx-4 p-6 rounded-xl"
            style={{
              background: "rgba(20,24,32,0.98)",
              border: "1px solid rgba(255,255,255,0.1)",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)",
            }}
          >
            <div className="flex items-start gap-4">
              <div 
                className="p-3 rounded-full"
                style={{ background: "rgba(251,191,36,0.15)" }}
              >
                <AlertTriangle className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Reset All Bags?
                </h3>
                <p className="text-white/60 text-sm mb-6">
                  This will restore all bags to their original auto-generated grid positions. 
                  Any custom positioning you've done will be lost.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 px-4 py-2 rounded-lg font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetConfirm}
                    className="flex-1 px-4 py-2 rounded-lg font-medium bg-amber-600 hover:bg-amber-700 text-white transition-colors flex items-center justify-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset All
                  </button>
                </div>
              </div>
              <button
                onClick={() => setShowResetConfirm(false)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5 text-white/40" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Layout Controls Panel */}
      <div
        className="fixed bottom-24 right-6 z-40 max-w-sm"
        style={{
          background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(12px)",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "12px",
        }}
      >
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors"
        >
          <div className="flex items-center gap-2">
            <Grid3x3 className="w-5 h-5 text-blue-400" />
            <span className="font-semibold text-white">Layout Controls</span>
          </div>
          <ChevronDown
            className={cn(
              "w-4 h-4 text-white/60 transition-transform",
              isExpanded && "rotate-180"
            )}
          />
        </button>

        {/* Content */}
        {isExpanded && (
          <div className="px-4 py-4 space-y-4 border-t border-white/10">
            {/* Presets */}
            <div>
              <label className="text-xs font-semibold text-white/70 uppercase tracking-wider">
                Layout Presets
              </label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {(Object.entries(LAYOUT_PRESETS) as [LayoutPreset, typeof LAYOUT_PRESETS[LayoutPreset]][]).map(
                  ([key, preset]) => (
                    <button
                      key={key}
                      onClick={() => handlePresetChange(key)}
                      className={cn(
                        "px-3 py-2 rounded-lg text-sm font-medium transition-all",
                        selectedPreset === key
                          ? "bg-blue-600 text-white"
                          : "bg-white/10 text-white/70 hover:bg-white/20"
                      )}
                    >
                      <div className="font-semibold">{preset.label}</div>
                      <div className="text-xs text-white/50">{preset.description}</div>
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Sliders */}
            <div className="space-y-3 pt-2 border-t border-white/10">
              {/* Rows */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white/80">Rows</label>
                  <span className="text-sm font-semibold text-blue-400">{rows}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="8"
                  value={rows}
                  onChange={(e) => setRows(Number(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Columns */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white/80">Columns</label>
                  <span className="text-sm font-semibold text-blue-400">{cols}</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="12"
                  value={cols}
                  onChange={(e) => setCols(Number(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Spacing */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white/80">Spacing</label>
                  <span className="text-sm font-semibold text-blue-400">{spacing} ft</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={spacing}
                  onChange={(e) => setSpacing(Number(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>

              {/* Padding */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white/80">Padding from Walls</label>
                  <span className="text-sm font-semibold text-blue-400">{padding} ft</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={padding}
                  onChange={(e) => setPadding(Number(e.target.value))}
                  className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2 border-t border-white/10">
              <button
                onClick={handleApply}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Apply
              </button>
              <button
                onClick={onSaveLayout}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
              >
                <Save className="w-4 h-4" />
                Save
              </button>
            </div>

            {/* Reset All Button - Separate with warning styling */}
            <div className="pt-2 border-t border-white/10">
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-600/30 rounded-lg font-medium transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Reset All Bags to Grid
              </button>
              <p className="text-xs text-white/40 text-center mt-2">
                Restores all bags to their original auto-generated positions
              </p>
            </div>

            {/* Info Text */}
            <div className="text-xs text-white/50 text-center pt-2">
              {rows * cols} spots will be arranged
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default LayoutControls;
