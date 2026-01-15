/**
 * EnvironmentSelector - Kiosk Environment Selector UI
 * 
 * Displays environment thumbnails and allows selection
 * Updates kiosk background and atmosphere in real-time
 */

import { useState } from 'react';
import {
  KIOSK_ENVIRONMENTS,
  getEnvironmentCategories,
  type EnvironmentDefinition,
} from '@shared/kioskEnvironments';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface EnvironmentSelectorProps {
  selectedEnvironmentId?: string;
  onEnvironmentSelect: (environment: EnvironmentDefinition) => void;
}

export default function EnvironmentSelector({
  selectedEnvironmentId = 'martial-arts-dojo',
  onEnvironmentSelect,
}: EnvironmentSelectorProps) {
  const categories = getEnvironmentCategories();
  const [activeCategory, setActiveCategory] = useState(
    categories[0]?.id || 'martial-arts'
  );

  const environmentsInCategory = KIOSK_ENVIRONMENTS.filter(
    env => env.category === activeCategory
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-white mb-3">
          Select Environment
        </label>
        <p className="text-xs text-slate-400 mb-4">
          Choose a background environment for your kiosk
        </p>
      </div>

      {/* Category Tabs */}
      <Tabs value={activeCategory} onValueChange={setActiveCategory}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7 gap-1 bg-slate-700/30 p-1 rounded-lg">
          {categories.map(category => (
            <TabsTrigger
              key={category.id}
              value={category.id}
              className="text-xs px-2 py-1 rounded-md transition-all data-[state=active]:bg-red-500/20 data-[state=active]:text-red-300 data-[state=inactive]:text-slate-400 hover:text-slate-200"
            >
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Environment Grid */}
        {categories.map(category => (
          <TabsContent key={category.id} value={category.id} className="mt-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {environmentsInCategory.map(env => (
                <button
                  key={env.id}
                  onClick={() => onEnvironmentSelect(env)}
                  className={`group relative overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                    selectedEnvironmentId === env.id
                      ? 'border-red-500 shadow-lg shadow-red-500/20'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                  title={env.description}
                >
                  {/* Thumbnail */}
                  <div className="relative w-full h-24 bg-gradient-to-br from-slate-700 to-slate-800 overflow-hidden">
                    <img
                      src={env.thumbnailPath}
                      alt={env.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      onError={e => {
                        // Fallback if image doesn't load
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>

                  {/* Label */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-2">
                    <div className="text-left">
                      <p className="text-xs font-medium text-white">{env.name}</p>
                      <p className="text-xs text-slate-300 line-clamp-1">
                        {env.description}
                      </p>
                    </div>
                  </div>

                  {/* Selection Indicator */}
                  {selectedEnvironmentId === env.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  )}
                </button>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Environment Info */}
      {selectedEnvironmentId && (
        <div className="mt-4 p-3 bg-slate-700/20 border border-white/10 rounded-lg">
          {KIOSK_ENVIRONMENTS.find(env => env.id === selectedEnvironmentId) && (
            <>
              <p className="text-xs text-slate-300">
                <strong>Selected:</strong>{' '}
                {KIOSK_ENVIRONMENTS.find(env => env.id === selectedEnvironmentId)
                  ?.name}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {KIOSK_ENVIRONMENTS.find(env => env.id === selectedEnvironmentId)
                  ?.description}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
