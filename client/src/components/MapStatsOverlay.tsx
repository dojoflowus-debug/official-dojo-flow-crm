import { Users, AlertTriangle, Clock, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface MapStatsOverlayProps {
  activeCount: number
  trialCount: number
  atRiskCount: number
  isDarkMode?: boolean
  showDensity?: boolean
  onToggleDensity?: () => void
  onLayerChange?: (layer: string) => void
}

export default function MapStatsOverlay({
  activeCount,
  trialCount,
  atRiskCount,
  isDarkMode,
  showDensity = true,
  onToggleDensity,
  onLayerChange
}: MapStatsOverlayProps) {
  return (
    <div className="absolute top-4 left-4 z-[1000] pointer-events-auto">
      {/* Stats Pills */}
      <div className={`
        flex items-center gap-2 p-2 rounded-2xl backdrop-blur-md
        ${isDarkMode 
          ? 'bg-slate-900/80 border border-white/10' 
          : 'bg-white/90 border border-slate-200 shadow-lg'
        }
      `}>
        {/* Active */}
        <div className="flex items-center gap-2 px-3 py-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
          <span className={`text-lg font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
            {activeCount}
          </span>
          <span className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>
            Active
          </span>
        </div>
        
        {/* Divider */}
        <div className={`w-px h-6 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />
        
        {/* Trial */}
        <div className="flex items-center gap-2 px-3 py-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <span className={`text-lg font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>
            {trialCount}
          </span>
          <span className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>
            Trial
          </span>
        </div>
        
        {/* Divider */}
        <div className={`w-px h-6 ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`} />
        
        {/* At Risk */}
        <div className="flex items-center gap-2 px-3 py-1.5">
          <AlertTriangle className={`w-4 h-4 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
          <span className={`text-lg font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
            {atRiskCount}
          </span>
          <span className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>
            ARisk
          </span>
        </div>
      </div>
      
      {/* Layer Control */}
      <div className="mt-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={`
                gap-2 rounded-xl backdrop-blur-md
                ${isDarkMode 
                  ? 'bg-slate-900/80 border-white/10 text-white hover:bg-slate-800/80' 
                  : 'bg-white/90 border-slate-200 text-slate-700 hover:bg-slate-50'
                }
              `}
            >
              <Layers className="w-4 h-4" />
              Layer
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className={isDarkMode ? 'bg-slate-900 border-white/10' : ''}>
            <DropdownMenuItem onClick={() => onLayerChange?.('default')}>
              Default View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onLayerChange?.('satellite')}>
              Satellite
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onLayerChange?.('terrain')}>
              Terrain
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      {/* Density Toggle */}
      {onToggleDensity && (
        <div className="mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onToggleDensity}
            className={`
              gap-2 rounded-xl backdrop-blur-md
              ${isDarkMode 
                ? 'bg-slate-900/80 border-white/10 text-white hover:bg-slate-800/80' 
                : 'bg-white/90 border-slate-200 text-slate-700 hover:bg-slate-50'
              }
              ${showDensity ? 'ring-2 ring-primary' : ''}
            `}
          >
            <div className={`w-3 h-3 rounded-full ${showDensity ? 'bg-green-500' : 'bg-slate-400'}`} />
            Density {showDensity ? 'On' : 'Off'}
          </Button>
        </div>
      )}
    </div>
  )
}
