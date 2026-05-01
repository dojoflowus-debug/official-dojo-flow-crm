import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Users, User, CheckCircle2, XCircle, AlertTriangle, Phone, MessageSquare, ChevronDown, ChevronUp, Send, DollarSign, Link } from 'lucide-react';
import { KaiStudentCard, KaiStudentCardData } from './KaiStudentCard';
import { FlyerCreationPanel } from './kai/FlyerCreationPanel';
import { CreativePreviewCard, type CreativePreviewCardData } from './CreativePreviewCard';

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

interface ContactMessageSentBlock {
  type: 'contact_message_sent';
  success: boolean;
  contactName: string;
  contactPhone: string;
  contactType: 'lead' | 'student';
  intent: string;
  channel: string;
  messageSent: string;
  deliveryId?: string;
  enrollmentLink?: string;
  programName?: string;
  programPrice?: number;
  error?: string;
}

interface ProgramsPricingBlock {
  type: 'programs_pricing';
  programs: Array<{
    id: number;
    name: string;
    type: string;
    price: number;
    billing: string;
    ageRange?: string;
    trialType?: string;
    trialPrice?: number;
    trialLengthDays?: number;
    enrollmentLink?: string;
  }>;
  kioskBaseUrl?: string;
}

interface UIBlock {
  type: 'student_card' | 'student_list' | 'lead_card' | 'lead_list' | 'flyer_creation' | 'sms_blast_result' | 'contact_message_sent' | 'programs_pricing' | 'creative_image' | 'platform_copy' | 'video_ad';
  // platform_copy fields
  variants?: Array<{ platform: string; content: Record<string, string>; characterCount?: Record<string, number> }>;
  // video_ad fields
  videoUrl?: string;
  script?: { hook: string; story: string; cta: string; fullScript: string };
  duration?: number;
  format?: string;
  // creative_image fields
  imageUrl?: string;
  imageBase64?: string;
  mimeType?: string;
  prompt?: string;
  size?: string;
  assetId?: number | null;
  savedToLibrary?: boolean;
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

function ContactMessageSentCard({ block }: { block: ContactMessageSentBlock }) {
  const intentLabel = block.intent.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className={`px-4 py-3 flex items-center justify-between ${block.success ? 'bg-gradient-to-r from-blue-600 to-indigo-600' : 'bg-gradient-to-r from-red-600 to-rose-600'}`}>
        <div className="flex items-center gap-2">
          <Send className="w-4 h-4 text-white" />
          <span className="text-white font-semibold text-sm">
            {block.success ? 'Message Delivered' : 'Message Failed'}
          </span>
          <Badge className="bg-white/20 text-white border-0 text-xs">{block.channel.toUpperCase()}</Badge>
        </div>
        {block.success && <CheckCircle2 className="w-4 h-4 text-white/80" />}
        {!block.success && <XCircle className="w-4 h-4 text-white/80" />}
      </div>
      <div className="px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-2 mb-1">
          <User className="w-4 h-4 text-slate-400" />
          <span className="font-semibold text-slate-800">{block.contactName}</span>
          <span className="text-slate-400 text-xs font-mono">{block.contactPhone}</span>
          <Badge variant="outline" className="text-xs ml-auto">{block.contactType}</Badge>
        </div>
        <div className="text-xs text-slate-500">{intentLabel}</div>
      </div>
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
        <div className="text-xs text-slate-500 font-medium mb-1">Message sent:</div>
        <div className="text-sm text-slate-700 italic">&ldquo;{block.messageSent}&rdquo;</div>
      </div>
      {block.enrollmentLink && (
        <div className="px-4 py-3 flex items-center gap-2">
          <Link className="w-3.5 h-3.5 text-blue-500" />
          <a href={block.enrollmentLink} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline truncate">
            {block.enrollmentLink}
          </a>
        </div>
      )}
      {block.error && (
        <div className="px-4 py-3 bg-red-50 border-t border-red-100 text-xs text-red-600">
          {block.error}
        </div>
      )}
    </div>
  );
}

function ProgramsPricingCard({ block }: { block: ProgramsPricingBlock }) {
  return (
    <div className="mt-3 rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 px-4 py-3 flex items-center gap-2">
        <DollarSign className="w-4 h-4 text-white" />
        <span className="text-white font-semibold text-sm">Programs &amp; Pricing</span>
        <Badge className="bg-white/20 text-white border-0 text-xs ml-auto">{block.programs.length} programs</Badge>
      </div>
      <div className="divide-y divide-slate-100">
        {block.programs.map((p, i) => (
          <div key={i} className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="font-medium text-slate-800 text-sm truncate">{p.name}</div>
              <div className="text-xs text-slate-500">{p.type.replace(/_/g, ' ')}{p.ageRange ? ` · ${p.ageRange}` : ''}</div>
              {p.trialType && p.trialType !== 'none' && (
                <div className="text-xs text-emerald-600 mt-0.5">
                  {p.trialType === 'free'
                    ? `Free ${p.trialLengthDays}-day trial`
                    : `${p.trialLengthDays}-day trial for $${((p.trialPrice || 0) / 100).toFixed(0)}`}
                </div>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="font-bold text-slate-800">${(p.price / 100).toFixed(0)}</div>
              <div className="text-xs text-slate-400">{p.billing?.replace(/_/g, ' ')}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
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

        // Render contact message sent card
        if (block.type === 'contact_message_sent') {
          return (
            <ContactMessageSentCard
              key={index}
              block={block as unknown as ContactMessageSentBlock}
            />
          );
        }

        // Render programs pricing card
        if (block.type === 'programs_pricing') {
          return (
            <ProgramsPricingCard
              key={index}
              block={block as unknown as ProgramsPricingBlock}
            />
          );
        }

        // Render inline creative image (generated flyer)
        if (block.type === 'creative_image' && block.imageUrl) {
          const cardData: CreativePreviewCardData = {
            imageUrl: block.imageUrl,
            imageBase64: block.imageBase64,
            mimeType: block.mimeType || 'image/png',
            prompt: block.prompt || '',
            size: block.size || 'flyer',
            assetId: block.assetId ?? null,
            savedToLibrary: block.savedToLibrary ?? false,
          };
          return (
            <CreativePreviewCard
              key={index}
              data={cardData}
              isDark={isDark}
              isCinematic={isCinematic}
            />
          );
        }

        // Render platform copy block
        if (block.type === 'platform_copy' && block.variants) {
          return (
            <div key={index} className={`rounded-xl border p-4 space-y-3 ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-white/50' : 'text-slate-400'}`}>Platform Ad Copy</p>
              {block.variants.map((v, vi) => (
                <div key={vi} className={`rounded-lg p-3 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                  <p className={`text-xs font-bold mb-2 capitalize ${isDark ? 'text-white' : 'text-slate-800'}`}>{v.platform}</p>
                  {Object.entries(v.content).map(([field, value]) => (
                    <div key={field} className="mb-2">
                      <p className={`text-xs font-medium mb-0.5 capitalize ${isDark ? 'text-white/50' : 'text-slate-500'}`}>{field.replace(/_/g, ' ')}</p>
                      <p className={`text-xs ${isDark ? 'text-white/80' : 'text-slate-700'}`}>{String(value)}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          );
        }

        // Render video ad block
        if (block.type === 'video_ad' && block.videoUrl) {
          return (
            <div key={index} className={`rounded-xl border p-4 space-y-3 ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-white/50' : 'text-slate-400'}`}>🎬 Video Ad · {block.duration}s {block.format}</p>
              <video controls className="w-full rounded-lg" src={block.videoUrl} />
              {block.script && (
                <div className={`rounded-lg p-3 border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                  <p className={`text-xs font-bold mb-1 ${isDark ? 'text-white' : 'text-slate-800'}`}>Script</p>
                  <p className={`text-xs ${isDark ? 'text-white/70' : 'text-slate-600'}`}>{block.script.fullScript}</p>
                </div>
              )}
              <a href={block.videoUrl} download className={`inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-medium ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`}>⬇ Download MP4</a>
            </div>
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
