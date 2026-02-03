import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Users, User } from 'lucide-react';
import { KaiStudentCard, KaiStudentCardData } from './KaiStudentCard';

interface UIBlock {
  type: 'student_card' | 'student_list' | 'lead_card' | 'lead_list';
  studentId?: number;
  studentIds?: number[];
  leadId?: number;
  leadIds?: number[];
  student?: KaiStudentCardData; // Full student data for inline rendering
  label: string;
}

interface UIBlockRendererProps {
  blocks: UIBlock[];
  onBlockClick?: (block: UIBlock) => void;
  theme?: 'light' | 'dark' | 'cinematic';
}

export function UIBlockRenderer({ blocks, onBlockClick, theme = 'light' }: UIBlockRendererProps) {
  if (!blocks || blocks.length === 0) return null;

  const isDark = theme === 'dark';
  const isCinematic = theme === 'cinematic';

  return (
    <div className="flex flex-col gap-3 mt-3">
      {blocks.map((block, index) => {
        // Render inline student card if full data is provided
        if (block.type === 'student_card' && block.student) {
          return (
            <KaiStudentCard
              key={index}
              student={block.student}
              onClick={() => onBlockClick?.(block)}
              isDark={isDark}
              isCinematic={isCinematic}
              isFocusMode={false}
            />
          );
        }
        
        // Otherwise render as clickable badge/button
        const isCard = block.type === 'student_card' || block.type === 'lead_card';
        const isList = block.type === 'student_list' || block.type === 'lead_list';
        const isStudent = block.type.startsWith('student');

        return (
          <button
            key={index}
            onClick={() => onBlockClick?.(block)}
            className={`
              inline-flex items-center gap-2 px-3 py-2 rounded-lg
              transition-all duration-200 hover:scale-105
              ${isCinematic 
                ? 'bg-white/10 hover:bg-white/20 text-white border border-white/20' 
                : isDark 
                  ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200'
              }
            `}
          >
            {isCard ? (
              <User className="w-4 h-4" />
            ) : (
              <Users className="w-4 h-4" />
            )}
            <span className="text-sm font-medium">{block.label}</span>
            {isList && (
              <Badge 
                variant="secondary" 
                className={`
                  ml-1 text-xs
                  ${isCinematic 
                    ? 'bg-white/20 text-white' 
                    : isDark 
                      ? 'bg-slate-700 text-white' 
                      : 'bg-slate-200 text-slate-900'
                  }
                `}
              >
                {isStudent ? block.studentIds?.length : block.leadIds?.length}
              </Badge>
            )}
          </button>
        );
      })}
    </div>
  );
}
