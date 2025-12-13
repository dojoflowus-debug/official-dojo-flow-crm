import { useCallback, useEffect, useRef, useState } from 'react';
import { GripVertical } from 'lucide-react';

interface ResizableDividerProps {
  onResize: (leftWidth: number) => void;
  onDoubleClick: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
  isDarkMode?: boolean;
}

/**
 * ResizableDivider - A draggable divider for split-screen layouts
 * Features:
 * - Drag to resize panes
 * - Double-click to reset to 50/50
 * - Visual grip handle
 */
export const ResizableDivider: React.FC<ResizableDividerProps> = ({
  onResize,
  onDoubleClick,
  containerRef,
  isDarkMode = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dividerRef = useRef<HTMLDivElement>(null);

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
      onResize(clampedWidth);
    },
    [isDragging, containerRef, onResize]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

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
      onDoubleClick={onDoubleClick}
      className={`
        relative w-2 cursor-col-resize flex-shrink-0
        transition-colors duration-150
        ${isDragging 
          ? (isDarkMode ? 'bg-red-500/30' : 'bg-red-500/20') 
          : (isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-gray-200 hover:bg-gray-300')
        }
      `}
      style={{ touchAction: 'none' }}
    >
      {/* Grip Handle */}
      <div
        className={`
          absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-6 h-12 rounded-full flex items-center justify-center
          transition-all duration-150
          ${isDragging
            ? (isDarkMode ? 'bg-red-500/40 scale-110' : 'bg-red-500/30 scale-110')
            : (isDarkMode ? 'bg-white/20 hover:bg-white/30' : 'bg-gray-300 hover:bg-gray-400')
          }
        `}
      >
        <GripVertical className={`w-4 h-4 ${isDarkMode ? 'text-white/60' : 'text-gray-500'}`} />
      </div>
    </div>
  );
};

export default ResizableDivider;
