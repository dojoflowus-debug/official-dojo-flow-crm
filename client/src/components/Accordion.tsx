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
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="border border-white/10 rounded-lg overflow-hidden" style={{background: 'rgba(18, 22, 28, 0.4)'}}>
          {/* Header */}
          <button
            onClick={() => setOpenId(openId === item.id ? null : item.id)}
            className="w-full px-4 py-3.5 hover:bg-white/5 transition flex items-center justify-between"
          >
            <div className="text-left">
              <p className="text-sm font-semibold" style={{color: 'rgba(255,255,255,0.92)'}}>{item.title}</p>
              {item.description && (
                <p className="text-xs mt-1" style={{color: 'rgba(255,255,255,0.65)'}}>{item.description}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {item.onReset && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    item.onReset?.();
                  }}
                  className="px-2 py-1 text-xs rounded transition"
                  style={{
                    background: 'rgba(239, 68, 68, 0.15)',
                    color: 'rgba(255,255,255,0.65)',
                    border: '1px solid rgba(239, 68, 68, 0.3)',
                  }}
                >
                  Reset
                </button>
              )}
              <div
                className={`w-5 h-5 flex items-center justify-center transition ${
                  openId === item.id ? 'rotate-180' : ''
                }`}
                style={{color: 'rgba(255,255,255,0.65)'}}
              >
                ▼
              </div>
            </div>
          </button>

          {/* Content */}
          {openId === item.id && (
            <div className="px-4 py-5 border-t border-white/10" style={{background: 'rgba(0, 0, 0, 0.2)'}}>
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
