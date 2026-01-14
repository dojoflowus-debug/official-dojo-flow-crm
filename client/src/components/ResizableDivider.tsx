import { useCallback, useEffect, useRef, useState } from 'react';
import { GripVertical } from 'lucide-react';

const STORAGE_KEY = 'dojoflow-students-map-divider-width';

interface ResizableDividerProps {
  onResize: (leftWidth: number) => void;
  onDragEnd?: () => void;
  onDoubleClick: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
  isDarkMode?: boolean;
  initialWidth?: number;
}

/**
 * ResizableDivider - A draggable divider for split-screen layouts
 * Features:
 * - Drag to resize panes with live updates
 * - Double-click to reset to 50/50
 * - Visual grip handle with hover/drag states
 * - localStorage persistence for divider position
 * - onDragEnd callback for map invalidateSize
 */
export const ResizableDivider: React.FC<ResizableDividerProps> = ({
  onResize,
  onDragEnd,
  onDoubleClick,
  containerRef,
  isDarkMode = false,
  initialWidth = 50,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dividerRef = useRef<HTMLDivElement>(null);
  const currentWidthRef = useRef(initialWidth);

  // Load saved width from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const width = parseFloat(saved);
      if (!isNaN(width) && width >= 20 && width <= 80) {
        currentWidthRef.current = width;
        onResize(width);
      }
    }
  }, [onResize]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !containerRef.current) return;

      const container = containerRef.current;
      const containerRect = container.getBoundingClientRect();
      const newLeftWidth = ((e.clientX - containerRect.left) / containerRect.width) * 100;

      // Clamp between 20% and 80%
      const clampedWidth = Math.max(20, Math.min(80, newLeftWidth));
      currentWidthRef.current = clampedWidth;
      onResize(clampedWidth);
    },
    [isDragging, containerRef, onResize]
  );

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      // Save to localStorage when drag ends
      localStorage.setItem(STORAGE_KEY, currentWidthRef.current.toString());
      setIsDragging(false);
      onDragEnd?.();
    }
  }, [isDragging, onDragEnd]);

  const handleDoubleClickWithSave = useCallback(() => {
    currentWidthRef.current = 50;
    localStorage.setItem(STORAGE_KEY, '50');
    onDoubleClick();
    onDragEnd?.();
  }, [onDoubleClick, onDragEnd]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  return (
    <div
      ref={dividerRef}
      onMouseDown={handleMouseDown}
      onDoubleClick={handleDoubleClickWithSave}
      className={`
        relative w-3 cursor-col-resize flex-shrink-0
        transition-colors duration-150
        ${isDragging 
          ? (isDarkMode ? 'bg-red-500/30' : 'bg-red-500/20') 
          : (isDarkMode ? 'bg-white/5 hover:bg-white/15' : 'bg-gray-100 hover:bg-gray-200')
        }
      `}
      style={{ touchAction: 'none' }}
    >
      {/* Grip Handle - Centered pill */}
      <div
        className={`
          absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-5 h-14 rounded-full flex items-center justify-center
          transition-all duration-150 shadow-sm
          ${isDragging
            ? (isDarkMode ? 'bg-red-500/50 scale-110' : 'bg-red-500/40 scale-110')
            : (isDarkMode ? 'bg-white/15 hover:bg-white/25' : 'bg-gray-200 hover:bg-gray-300')
          }
        `}
      >
        <GripVertical className={`w-3.5 h-3.5 ${isDarkMode ? 'text-white/50' : 'text-gray-400'}`} />
      </div>
    </div>
  );
};

export default ResizableDivider;
