import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Users, User, CheckCircle2, XCircle, AlertTriangle, Phone, MessageSquare, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { KaiStudentCard, KaiStudentCardData } from './KaiStudentCard';
import { FlyerCreationPanel } from './kai/FlyerCreationPanel';

interface SmsBlastRecipient {
  name: string;
  phone: string;
  status: 'delivered' | 'failed' | 'rate_limited' | 'skipped';
  error?: string;
}

interface SmsBlastResultBlock {
  type: 'sms_blast_result';
  message: string;
  target: string;
  filter?: string;
  totalTargeted: number;
  delivered: number;
  failed: number;
  rateLimited: number;
  skippedNoPhone: number;
  recipients: SmsBlastRecipient[];
  retryAvailable: boolean;
  retryCount: number;
}

interface UIBlock {
  type: 'student_card' | 'student_list' | 'lead_card' | 'lead_list' | 'flyer_creation' | 'sms_blast_result';
  studentId?: number;
  studentIds?: number[];
  leadId?: number;
  leadIds?: number[];
  student?: KaiStudentCardData;
  label?: string;
  initialPrompt?: string;
  // sms_blast_result fields
  message?: string;
  target?: string;
  filter?: string;
  totalTargeted?: number;
  delivered?: number;
  failed?: number;
  rateLimited?: number;
  skippedNoPhone?: number;
  recipients?: SmsBlastRecipient[];
  retryAvailable?: boolean;
  retryCount?: number;
}

interface UIBlockRendererProps {
  blocks: UIBlock[];
  onBlockClick?: (block: UIBlock) => void;
  theme?: 'light' | 'dark' | 'cinematic';
}

function SmsBlastResultCard({ block }: { block: SmsBlastResultBlock }) {
  const [showAll, setShowAll] = useState(false);
  const displayRecipients = showAll ? block.recipients : block.recipients.slice(0, 10);
  const hasMore = block.recipients.length > 10;

  const successRate = block.totalTargeted > 0
    ? Math.round((block.delivered / block.totalTargeted) * 100)
    : 0;

  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-white" />
          <span className="text-white font-semibold text-sm">SMS Blast Complete</span>
          <Badge className="bg-white/20 text-white border-0 text-xs">
            {block.target === 'leads' ? 'Leads' : block.target === 'students' ? 'Students' : 'All'}
            {block.filter ? ` · ${block.filter}` : ''}
          </Badge>
        </div>
        <span className="text-white/80 text-xs">{successRate}% success rate</span>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
        <div className="px-4 py-3 text-center">
          <div className="text-2xl font-bold text-slate-800">{block.totalTargeted}</div>
          <div className="text-xs text-slate-500 mt-0.5">Total Targeted</div>
        </div>
        <div className="px-4 py-3 text-center">
          <div className="text-2xl font-bold text-green-600">{block.delivered}</div>
          <div className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-green-500" /> Delivered
          </div>
        </div>
        <div className="px-4 py-3 text-center">
          <div className="text-2xl font-bold text-amber-500">{block.rateLimited}</div>
          <div className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1">
            <AlertTriangle className="w-3 h-3 text-amber-500" /> Rate Limited
          </div>
        </div>
        <div className="px-4 py-3 text-center">
          <div className="text-2xl font-bold text-red-500">{block.failed}</div>
          <div className="text-xs text-slate-500 mt-0.5 flex items-center justify-center gap-1">
            <XCircle className="w-3 h-3 text-red-500" /> Failed
          </div>
        </div>
      </div>

      {/* Message preview */}
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
        <div className="text-xs text-slate-500 font-medium mb-1">Message sent:</div>
        <div className="text-sm text-slate-700 italic">"{block.message}"</div>
      </div>

      {/* Recipients table */}
      {block.recipients.length > 0 && (
        <div className="px-4 py-3">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Recipients</div>
          <div className="rounded-lg border border-slate-100 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">Name</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">Phone</th>
                  <th className="text-left px-3 py-2 text-xs font-medium text-slate-500">Status</th>
                </tr>
              </thead>
              <tbody>
                {displayRecipients.map((r, i) => (
                  <tr key={i} className="border-b border-slate-50 last:border-0">
                    <td className="px-3 py-2 text-slate-800 font-medium">{r.name}</td>
                    <td className="px-3 py-2 text-slate-500 font-mono text-xs">{r.phone}</td>
                    <td className="px-3 py-2">
                      {r.status === 'delivered' && (
                        <span className="inline-flex items-center gap-1 text-green-600 text-xs font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Delivered
                        </span>
                      )}
                      {r.status === 'rate_limited' && (
                        <span className="inline-flex items-center gap-1 text-amber-500 text-xs font-medium">
                          <AlertTriangle className="w-3 h-3" /> Rate Limited
                        </span>
                      )}
                      {r.status === 'failed' && (
                        <span className="inline-flex items-center gap-1 text-red-500 text-xs font-medium">
                          <XCircle className="w-3 h-3" /> Failed
                        </span>
                      )}
                      {r.status === 'skipped' && (
                        <span className="inline-flex items-center gap-1 text-slate-400 text-xs font-medium">
                          <Phone className="w-3 h-3" /> No Phone
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {hasMore && (
            <button
              onClick={() => setShowAll(!showAll)}
              className="mt-2 w-full flex items-center justify-center gap-1 text-xs text-slate-500 hover:text-slate-700 py-1"
            >
              {showAll ? (
                <><ChevronUp className="w-3 h-3" /> Show fewer</>
              ) : (
                <><ChevronDown className="w-3 h-3" /> Show all {block.recipients.length} recipients</>
              )}
            </button>
          )}
        </div>
      )}

      {/* Retry banner */}
      {block.retryAvailable && (
        <div className="px-4 py-3 bg-amber-50 border-t border-amber-100 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <AlertTriangle className="w-4 h-4" />
            <span>{block.retryCount} messages were rate-limited. Ask KAI to retry them.</span>
          </div>
          <div className="text-xs text-amber-500 font-medium">
            Say: "Retry the {block.retryCount} failed sends"
          </div>
        </div>
      )}
    </div>
  );
}

export function UIBlockRenderer({ blocks, onBlockClick, theme = 'light' }: UIBlockRendererProps) {
  console.log('[UIBlockRenderer] Rendering blocks:', blocks);
  if (!blocks || blocks.length === 0) {
    console.log('[UIBlockRenderer] No blocks to render');
    return null;
  }

  const isDark = theme === 'dark';
  const isCinematic = theme === 'cinematic';

  return (
    <div className="flex flex-col gap-3 mt-3">
      {blocks.map((block, index) => {
        // Render SMS blast result card
        if (block.type === 'sms_blast_result') {
          return (
            <SmsBlastResultCard
              key={index}
              block={block as unknown as SmsBlastResultBlock}
            />
          );
        }

        // Render flyer creation panel
        if (block.type === 'flyer_creation') {
          return (
            <FlyerCreationPanel
              key={index}
              initialPrompt={block.initialPrompt || ''}
            />
          );
        }
        
        // Render inline student card if full data is provided
        if (block.type === 'student_card' && block.student) {
          console.log('[UIBlockRenderer] Rendering KaiStudentCard:', block.student);
          try {
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
          } catch (error) {
            console.error('[UIBlockRenderer] Error rendering KaiStudentCard:', error);
            return (
              <div key={index} className="p-4 bg-red-100 border border-red-300 rounded text-red-700">
                Error rendering student card: {error instanceof Error ? error.message : String(error)}
              </div>
            );
          }
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
