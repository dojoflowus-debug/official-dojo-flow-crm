import { LayoutGrid, Map, List } from 'lucide-react';

export type ViewMode = 'split' | 'fullMap' | 'list';

interface ViewModeToggleProps {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
  isDarkMode?: boolean;
}

/**
 * ViewModeToggle - Segmented control for switching between Split View, Full Map, and List View
 */
export const ViewModeToggle: React.FC<ViewModeToggleProps> = ({
  mode,
  onChange,
  isDarkMode = false,
}) => {
  const modes: { value: ViewMode; label: string; icon: React.ElementType }[] = [
    { value: 'split', label: 'Split', icon: LayoutGrid },
    { value: 'fullMap', label: 'Map', icon: Map },
    { value: 'list', label: 'List', icon: List },
  ];

  return (
    <div
      className={`
        inline-flex items-center rounded-lg p-1
        ${isDarkMode 
          ? 'bg-white/10 border border-white/10' 
          : 'bg-slate-100 border border-slate-200'
        }
      `}
    >
      {modes.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium
            transition-all duration-150
            ${mode === value
              ? isDarkMode
                ? 'bg-white/20 text-white shadow-sm'
                : 'bg-white text-slate-900 shadow-sm'
              : isDarkMode
                ? 'text-white/60 hover:text-white/80 hover:bg-white/5'
                : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }
          `}
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  );
};

export default ViewModeToggle;
