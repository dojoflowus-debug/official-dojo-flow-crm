import { useState } from 'react';
import { KIOSK_TEMPLATES, getTemplatesByCategory, getTemplateCategories, KioskTemplate } from '../../../shared/kioskTemplates';
import { Button } from '@/components/ui/button';

interface TemplateGalleryProps {
  onApplyTemplate: (template: KioskTemplate) => void;
  isLoading?: boolean;
}

/**
 * TemplateGallery - Browse and apply quick-start design templates
 */
export function TemplateGallery({ onApplyTemplate, isLoading = false }: TemplateGalleryProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const categories = getTemplateCategories();
  const templates = selectedCategory ? getTemplatesByCategory(selectedCategory) : KIOSK_TEMPLATES;

  return (
    <div className="w-full space-y-6">
      {/* Category Filter */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-200">Category</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              selectedCategory === null
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            All Templates
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Template Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-slate-200">Available Templates</h3>
        <div className="grid grid-cols-2 gap-4">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-slate-800 rounded-lg overflow-hidden hover:bg-slate-700 transition-all group cursor-pointer"
            >
              {/* Template Preview */}
              <div className="relative aspect-video bg-slate-900 overflow-hidden">
                {template.thumbnail ? (
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-800">
                    <span className="text-4xl">{template.icon}</span>
                  </div>
                )}
                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center">
                  <Button
                    onClick={() => onApplyTemplate(template)}
                    disabled={isLoading}
                    className="opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600 hover:bg-blue-700"
                  >
                    {isLoading ? 'Applying...' : 'Apply Template'}
                  </Button>
                </div>
              </div>

              {/* Template Info */}
              <div className="p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{template.icon}</span>
                  <div>
                    <h4 className="font-semibold text-white text-sm">{template.name}</h4>
                    <p className="text-xs text-slate-400">{template.category}</p>
                  </div>
                </div>
                <p className="text-xs text-slate-300 line-clamp-2">{template.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Info */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
        <p className="text-xs text-slate-400">
          💡 <strong>Tip:</strong> Select a template to instantly apply its design, colors, and typography to your kiosk. You can customize any settings afterward.
        </p>
      </div>
    </div>
  );
}
