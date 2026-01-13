import React from 'react';
import { KIOSK_BACKGROUND_PRESETS, BACKGROUND_CATEGORIES } from '../../../shared/kioskBackgroundPresets';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface KioskBackgroundPresetsProps {
  selectedPresetId?: string;
  onSelectPreset: (presetId: string) => void;
}

export function KioskBackgroundPresets({
  selectedPresetId,
  onSelectPreset,
}: KioskBackgroundPresetsProps) {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('martial-arts');

  const filteredPresets = KIOSK_BACKGROUND_PRESETS.filter(
    p => p.category === selectedCategory
  );

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2">
        {BACKGROUND_CATEGORIES.map(category => (
          <Button
            key={category.id}
            variant={selectedCategory === category.id ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory(category.id)}
            className="text-xs"
          >
            {category.label}
          </Button>
        ))}
      </div>

      {/* Presets Grid */}
      <div className="grid grid-cols-2 gap-3">
        {filteredPresets.map(preset => (
          <Card
            key={preset.id}
            className={`cursor-pointer overflow-hidden transition-all ${
              selectedPresetId === preset.id
                ? 'ring-2 ring-blue-500 border-blue-500'
                : 'hover:ring-1 hover:ring-gray-400'
            }`}
            onClick={() => onSelectPreset(preset.id)}
          >
            <div className="relative w-full h-32 bg-gray-200">
              <img
                src={preset.imageUrl}
                alt={preset.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ccc" width="100" height="100"/%3E%3C/svg%3E';
                }}
              />
              {/* Dim overlay preview */}
              {preset.dim > 0 && (
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundColor: `rgba(0, 0, 0, ${preset.dim / 100})`,
                  }}
                />
              )}
            </div>
            <div className="p-2">
              <p className="font-medium text-xs truncate">{preset.name}</p>
              <p className="text-xs text-gray-500 truncate">{preset.description}</p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
