/**
 * ImageLightbox — fullscreen image viewer with zoom, pan, and controls overlay
 *
 * Features:
 *  - Fullscreen dark modal
 *  - Scroll wheel zoom + pinch zoom (mobile)
 *  - Click + drag to pan
 *  - Double-click to zoom in/out toggle
 *  - +/- buttons, Fit / 100% / Fill mode buttons
 *  - Controls overlay: Close, Download, Open in Creative, Edit
 */

import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  X,
  Download,
  ExternalLink,
  Edit3,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Square,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ImageLightboxProps {
  imageUrl: string;
  imageBase64?: string;
  mimeType?: string;
  prompt?: string;
  size?: string;
  onClose: () => void;
  onEdit?: () => void;
  onOpenInCreative?: () => void;
  onDownload?: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const MIN_SCALE = 0.1;
const MAX_SCALE = 10;
const ZOOM_STEP = 0.25;
const DOUBLE_CLICK_ZOOM = 2.5;

// ── Component ─────────────────────────────────────────────────────────────────

export default function ImageLightbox({
  imageUrl,
  imageBase64,
  mimeType = "image/png",
  prompt,
  size,
  onClose,
  onEdit,
  onOpenInCreative,
  onDownload,
}: ImageLightboxProps) {
  const navigate = useNavigate();

  // Transform state
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [fitMode, setFitMode] = useState<"fit" | "actual" | "fill">("fit");

  // Drag state
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const offsetAtDragStart = useRef({ x: 0, y: 0 });

  // Pinch state
  const lastPinchDist = useRef<number | null>(null);

  // Image ref for natural dimensions
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Fit mode helpers ──────────────────────────────────────────────────────

  const applyFitMode = useCallback((mode: "fit" | "actual" | "fill") => {
    setFitMode(mode);
    setOffset({ x: 0, y: 0 });
    if (mode === "actual") {
      setScale(1);
    } else if (mode === "fit") {
      // CSS handles fit — reset scale to 1 which maps to object-fit:contain
      setScale(1);
    } else {
      // fill — zoom to fill viewport
      setScale(1.5);
    }
  }, []);

  // ── Zoom helpers ──────────────────────────────────────────────────────────

  const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));

  const zoomAt = useCallback((delta: number, cx: number, cy: number) => {
    setScale((prev) => {
      const next = clampScale(prev + delta * prev);
      const ratio = next / prev;
      setOffset((off) => ({
        x: cx - ratio * (cx - off.x),
        y: cy - ratio * (cy - off.y),
      }));
      return next;
    });
  }, []);

  // ── Mouse wheel zoom ──────────────────────────────────────────────────────

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = e.clientX - rect.left - rect.width / 2;
      const cy = e.clientY - rect.top - rect.height / 2;
      const delta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP;
      zoomAt(delta, cx, cy);
    },
    [zoomAt]
  );

  // ── Mouse drag ────────────────────────────────────────────────────────────

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX, y: e.clientY };
    offsetAtDragStart.current = { ...offset };
    e.preventDefault();
  }, [offset]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current) return;
    setOffset({
      x: offsetAtDragStart.current.x + (e.clientX - dragStart.current.x),
      y: offsetAtDragStart.current.y + (e.clientY - dragStart.current.y),
    });
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  // ── Double-click zoom toggle ──────────────────────────────────────────────

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const cx = e.clientX - rect.left - rect.width / 2;
      const cy = e.clientY - rect.top - rect.height / 2;
      if (scale < DOUBLE_CLICK_ZOOM - 0.1) {
        // Zoom in to DOUBLE_CLICK_ZOOM
        const delta = (DOUBLE_CLICK_ZOOM - scale) / scale;
        zoomAt(delta, cx, cy);
      } else {
        // Zoom back to 1 (fit)
        setScale(1);
        setOffset({ x: 0, y: 0 });
      }
    },
    [scale, zoomAt]
  );

  // ── Touch pinch zoom ──────────────────────────────────────────────────────

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      lastPinchDist.current = Math.hypot(dx, dy);
    } else if (e.touches.length === 1) {
      isDragging.current = true;
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      offsetAtDragStart.current = { ...offset };
    }
  }, [offset]);

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();
      if (e.touches.length === 2 && lastPinchDist.current !== null) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.hypot(dx, dy);
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const rect = containerRef.current?.getBoundingClientRect();
        if (rect) {
          const cx = midX - rect.left - rect.width / 2;
          const cy = midY - rect.top - rect.height / 2;
          const delta = (dist - lastPinchDist.current) / lastPinchDist.current;
          zoomAt(delta, cx, cy);
        }
        lastPinchDist.current = dist;
      } else if (e.touches.length === 1 && isDragging.current) {
        setOffset({
          x: offsetAtDragStart.current.x + (e.touches[0].clientX - dragStart.current.x),
          y: offsetAtDragStart.current.y + (e.touches[0].clientY - dragStart.current.y),
        });
      }
    },
    [zoomAt]
  );

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
    lastPinchDist.current = null;
  }, []);

  // ── Keyboard shortcuts ────────────────────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "+" || e.key === "=") setScale((s) => clampScale(s + ZOOM_STEP));
      if (e.key === "-") setScale((s) => clampScale(s - ZOOM_STEP));
      if (e.key === "0") { setScale(1); setOffset({ x: 0, y: 0 }); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // ── Download ──────────────────────────────────────────────────────────────

  const handleDownload = useCallback(() => {
    if (onDownload) { onDownload(); return; }
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `kai-creative-${size ?? "image"}-${Date.now()}.${mimeType.includes("jpeg") ? "jpg" : "png"}`;
    a.target = "_blank";
    a.click();
  }, [onDownload, imageUrl, size, mimeType]);

  // ── Open in Creative ──────────────────────────────────────────────────────

  const handleOpenInCreative = useCallback(() => {
    if (onOpenInCreative) { onOpenInCreative(); return; }
    navigate("/kai/creative");
    onClose();
  }, [onOpenInCreative, navigate, onClose]);

  // ── Render ────────────────────────────────────────────────────────────────

  const transform = `translate(${offset.x}px, ${offset.y}px) scale(${scale})`;
  const cursor = isDragging.current ? "grabbing" : scale > 1 ? "grab" : "zoom-in";

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* ── Controls overlay (top bar) ────────────────────────────────────── */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
        {/* Left: prompt / size info */}
        <div className="pointer-events-none">
          {size && (
            <span className="text-xs text-white/50 font-mono bg-white/10 px-2 py-0.5 rounded-full">
              {size.replace("_", " ")}
            </span>
          )}
          {prompt && (
            <p className="text-xs text-white/40 mt-1 max-w-xs truncate">{prompt}</p>
          )}
        </div>

        {/* Right: action buttons */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {onEdit && (
            <button
              onClick={onEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              Edit
            </button>
          )}
          <button
            onClick={handleOpenInCreative}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-medium transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open in Creative
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Image canvas ──────────────────────────────────────────────────── */}
      <div
        ref={containerRef}
        className="relative w-full h-full flex items-center justify-center overflow-hidden select-none"
        style={{ cursor }}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          ref={imgRef}
          src={imageUrl}
          alt={prompt ?? "Generated image"}
          draggable={false}
          className="max-w-[90vw] max-h-[85vh] object-contain rounded-lg shadow-2xl"
          style={{
            transform,
            transformOrigin: "center center",
            transition: isDragging.current ? "none" : "transform 0.1s ease-out",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
        />
      </div>

      {/* ── Bottom controls bar ───────────────────────────────────────────── */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1 bg-black/70 backdrop-blur-md rounded-2xl px-3 py-2 border border-white/10">
        {/* Zoom out */}
        <button
          onClick={() => setScale((s) => clampScale(s - ZOOM_STEP))}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          title="Zoom out (-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        {/* Scale readout */}
        <span className="text-xs text-white/60 font-mono w-12 text-center">
          {Math.round(scale * 100)}%
        </span>

        {/* Zoom in */}
        <button
          onClick={() => setScale((s) => clampScale(s + ZOOM_STEP))}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-white/70 hover:text-white transition-colors"
          title="Zoom in (+)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-white/15 mx-1" />

        {/* Fit to screen */}
        <button
          onClick={() => applyFitMode("fit")}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${fitMode === "fit" ? "bg-white/20 text-white" : "hover:bg-white/10 text-white/60 hover:text-white"}`}
          title="Fit to screen (0)"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {/* Actual size 100% */}
        <button
          onClick={() => applyFitMode("actual")}
          className={`px-2 h-8 flex items-center justify-center rounded-lg text-xs font-mono transition-colors ${fitMode === "actual" ? "bg-white/20 text-white" : "hover:bg-white/10 text-white/60 hover:text-white"}`}
          title="Actual size (100%)"
        >
          1:1
        </button>

        {/* Fill */}
        <button
          onClick={() => applyFitMode("fill")}
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${fitMode === "fill" ? "bg-white/20 text-white" : "hover:bg-white/10 text-white/60 hover:text-white"}`}
          title="Zoom to fill"
        >
          <Square className="w-3.5 h-3.5" />
        </button>

        <div className="w-px h-5 bg-white/15 mx-1" />

        {/* Keyboard hint */}
        <span className="text-xs text-white/30 hidden sm:block">
          scroll to zoom · drag to pan · dbl-click toggle
        </span>
      </div>
    </div>
  );
}
