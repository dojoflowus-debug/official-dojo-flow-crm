/**
 * KaiLeadCaptureSection - Integration section for Kai chat lead capture
 * Displays chat leads, embedding link, and source analytics
 */

import React, { useMemo, useState } from 'react';
import { Copy, Check, BarChart3, MessageCircle, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';

interface KaiLeadCaptureSectionProps {
  leads: any[];
  organizationId: number;
  isDarkMode: boolean;
}

export const KaiLeadCaptureSection: React.FC<KaiLeadCaptureSectionProps> = ({
  leads,
  organizationId,
  isDarkMode,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);

  // Filter leads from Kai chat
  const chatLeads = useMemo(() => {
    return leads.filter((lead: any) => lead.source === 'website_chat' || lead.source === 'kai_chat');
  }, [leads]);

  // Calculate lead source breakdown
  const sourceBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};
    leads.forEach((lead: any) => {
      const source = lead.source || 'Unknown';
      breakdown[source] = (breakdown[source] || 0) + 1;
    });
    return breakdown;
  }, [leads]);

  const kaiChatCount = chatLeads.length;
  const totalLeads = leads.length;
  const kaiPercentage = totalLeads > 0 ? Math.round((kaiChatCount / totalLeads) * 100) : 0;

  // Generate embedding link
  const embedLink = `${window.location.origin}/lead-capture?org=${organizationId}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(embedLink);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className={`border-t ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
      <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Kai Chat Leads Widget */}
          <div className={`
            rounded-xl p-6 border
            ${isDarkMode 
              ? 'bg-gradient-to-br from-white/5 to-white/2 border-white/10' 
              : 'bg-gradient-to-br from-blue-50 to-blue-25 border-blue-200/50'
            }
          `}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  ${isDarkMode ? 'bg-white/10' : 'bg-blue-100'}
                `}>
                  <MessageCircle className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-blue-600'}`} />
                </div>
                <div>
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Kai Chat Leads
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>
                    From website chat
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <div className="text-3xl font-bold text-[#E53935]">{kaiChatCount}</div>
                <p className={`text-sm mt-1 ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`}>
                  {kaiPercentage}% of total leads
                </p>
              </div>

              {chatLeads.length > 0 && (
                <div className={`
                  rounded-lg p-3 space-y-2
                  ${isDarkMode ? 'bg-white/5' : 'bg-white/50'}
                `}>
                  <p className={`text-xs font-medium ${isDarkMode ? 'text-white/70' : 'text-slate-600'}`}>
                    Recent Chat Leads:
                  </p>
                  <div className="space-y-1 max-h-[120px] overflow-y-auto">
                    {chatLeads.slice(0, 5).map((lead: any, idx: number) => (
                      <div key={idx} className={`text-xs ${isDarkMode ? 'text-white/60' : 'text-slate-600'}`}>
                        <span className="font-medium">{lead.firstName || 'Unknown'}</span>
                        {lead.programInterest && (
                          <span className={`ml-2 px-2 py-0.5 rounded text-xs ${isDarkMode ? 'bg-white/10' : 'bg-blue-100'}`}>
                            {lead.programInterest}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Embedding Link Section */}
          <div className={`
            rounded-xl p-6 border
            ${isDarkMode 
              ? 'bg-gradient-to-br from-white/5 to-white/2 border-white/10' 
              : 'bg-gradient-to-br from-purple-50 to-purple-25 border-purple-200/50'
            }
          `}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  ${isDarkMode ? 'bg-white/10' : 'bg-purple-100'}
                `}>
                  <Link2 className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-purple-600'}`} />
                </div>
                <div>
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Embed on Website
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>
                    Share with visitors
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <div className={`
                rounded-lg p-3 font-mono text-xs break-all
                ${isDarkMode 
                  ? 'bg-white/5 border border-white/10 text-white/70' 
                  : 'bg-white border border-slate-200 text-slate-600'
                }
              `}>
                {embedLink}
              </div>

              <Button
                onClick={handleCopyLink}
                className={`w-full flex items-center justify-center gap-2 ${
                  copiedLink
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-[#E53935] hover:bg-[#C62828]'
                } text-white`}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </Button>

              <p className={`text-xs ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>
                Add this link to your website to let visitors chat with Kai and submit leads
              </p>
            </div>
          </div>

          {/* Lead Source Analytics */}
          <div className={`
            rounded-xl p-6 border
            ${isDarkMode 
              ? 'bg-gradient-to-br from-white/5 to-white/2 border-white/10' 
              : 'bg-gradient-to-br from-amber-50 to-amber-25 border-amber-200/50'
            }
          `}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`
                  w-10 h-10 rounded-lg flex items-center justify-center
                  ${isDarkMode ? 'bg-white/10' : 'bg-amber-100'}
                `}>
                  <BarChart3 className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-amber-600'}`} />
                </div>
                <div>
                  <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-slate-900'}`}>
                    Lead Sources
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDarkMode ? 'text-white/50' : 'text-slate-500'}`}>
                    Breakdown by source
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              {Object.entries(sourceBreakdown).map(([source, count]) => {
                const percentage = totalLeads > 0 ? Math.round((count as number / totalLeads) * 100) : 0;
                const isKaiChat = source === 'website_chat' || source === 'kai_chat';

                return (
                  <div key={source}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-slate-700'}`}>
                        {source === 'website_chat' || source === 'kai_chat' ? '🤖 Kai Chat' : source}
                      </span>
                      <span className={`text-sm font-bold ${isKaiChat ? 'text-[#E53935]' : isDarkMode ? 'text-white/70' : 'text-slate-600'}`}>
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className={`h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-white/10' : 'bg-slate-200'}`}>
                      <div
                        className={`h-full transition-all ${isKaiChat ? 'bg-[#E53935]' : 'bg-blue-500'}`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
