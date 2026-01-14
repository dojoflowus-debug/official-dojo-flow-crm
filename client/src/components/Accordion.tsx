import React, { useState } from 'react';

interface AccordionItem {
  id: string;
  title: string;
  description?: string;
  content: React.ReactNode;
  onReset?: () => void;
}

interface AccordionProps {
  items: AccordionItem[];
  defaultOpenId?: string;
}

export function Accordion({ items, defaultOpenId }: AccordionProps) {
  const [openId, setOpenId] = useState<string | null>(defaultOpenId || items[0]?.id || null);

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="border border-white/10 rounded-lg overflow-hidden">
          {/* Header */}
          <button
            onClick={() => setOpenId(openId === item.id ? null : item.id)}
            className="w-full px-4 py-3 bg-white/5 hover:bg-white/10 transition flex items-center justify-between"
          >
            <div className="text-left">
              <p className="text-sm font-semibold text-white">{item.title}</p>
              {item.description && (
                <p className="text-xs text-gray-400 mt-1">{item.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {item.onReset && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    item.onReset?.();
                  }}
                  className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 text-gray-300 rounded transition"
                >
                  Reset
                </button>
              )}
              <div
                className={`w-5 h-5 flex items-center justify-center text-gray-400 transition ${
                  openId === item.id ? 'rotate-180' : ''
                }`}
              >
                ▼
              </div>
            </div>
          </button>

          {/* Content */}
          {openId === item.id && (
            <div className="px-4 py-4 bg-black/20 border-t border-white/10">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
