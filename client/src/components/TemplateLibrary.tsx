import React, { useState } from 'react';
import { Trash2, Copy, Download, MoreVertical } from 'lucide-react';



interface TemplateLibraryProps {
  templates: Template[];
  onSelect: (templateId: string) => void;
  onDelete: (templateId: string) => Promise<void>;
  onDuplicate: (templateId: string) => Promise<void>;
  isLoading?: boolean;
}

interface Template {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  usageCount: number;
  createdBy: string;
}

export function TemplateLibrary({
  templates,
  onSelect,
  onDelete,
  onDuplicate,
  isLoading = false,
}: TemplateLibraryProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (templates.length === 0) {
    return (
      <div className="p-6 text-center">
        <p className="text-white/60 mb-4">No templates saved yet</p>
        <p className="text-sm text-white/40">Save your first design as a template to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {templates.map((template) => (
        <div
          key={template.id}
          className="p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <button
                onClick={() => onSelect(template.id)}
                className="text-left hover:text-red-400 transition-colors"
              >
                <h3 className="font-medium text-white truncate">{template.name}</h3>
              </button>
              {template.description && (
                <p className="text-sm text-white/60 line-clamp-2 mt-1">{template.description}</p>
              )}
              <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                <span>Used {template.usageCount} times</span>
                <span>
                  {new Date(template.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelect(template.id)}
                className="px-3 py-1 bg-red-500 hover:bg-red-600 rounded text-sm text-white transition-colors"
              >
                Apply
              </button>
              <button
                onClick={() => setExpandedId(expandedId === template.id ? null : template.id)}
                className="p-2 hover:bg-white/10 rounded transition-colors"
              >
                <MoreVertical className="w-4 h-4 text-white/60" />
              </button>
            </div>
          </div>

          {/* Expanded Actions */}
          {expandedId === template.id && (
            <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
              <button
                onClick={() => onDuplicate(template.id)}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 rounded text-sm text-white transition-colors disabled:opacity-50"
              >
                <Copy className="w-4 h-4" />
                Duplicate
              </button>
              <button
                onClick={() => onDelete(template.id)}
                disabled={isLoading}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-500/10 hover:bg-red-500/20 rounded text-sm text-red-400 transition-colors disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
