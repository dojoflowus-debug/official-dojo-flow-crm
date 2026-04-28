import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, Users } from 'lucide-react';
import { trpc } from '@/lib/trpc';

function formatPrice(price: number | null | undefined, billing: string | null | undefined): string {
  if (!price) return 'Contact for pricing';
  const amount = `$${(price / 100).toFixed(0)}`;
  const period = billing === 'monthly' ? '/mo' : billing === 'weekly' ? '/wk' : billing === 'per_session' ? '/session' : '';
  return `${amount}${period}`;
}

export default function KioskPrograms() {
  const { locationSlug } = useParams<{ locationSlug: string }>();
  const navigate = useNavigate();
  const { data: programs = [], isLoading } = trpc.kiosk.getPrograms.useQuery(
    { locationSlug: locationSlug || '' },
    { enabled: !!locationSlug }
  );

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 50%, #0a0a1a 100%)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-5 border-b border-white/10">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>
        <h1 className="text-2xl font-bold text-white tracking-tight">Programs</h1>
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : programs.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <Users className="w-12 h-12 mx-auto mb-4 opacity-40" />
            <p className="text-lg">No programs available at this time.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 max-w-2xl mx-auto">
            {programs.map((program: { id: number; name: string; type: string | null; ageRange: string | null; price: number | null; billing: string | null; description: string | null; trialType: string | null; trialLengthDays: number | null; trialPrice: number | null }) => (
              <div
                key={program.id}
                className="rounded-2xl border border-white/10 p-6"
                style={{ background: 'rgba(255,255,255,0.04)' }}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-white mb-1">{program.name}</h2>
                    {program.ageRange && (
                      <div className="flex items-center gap-1 text-white/50 text-sm mb-2">
                        <Users className="w-3.5 h-3.5" />
                        <span>Ages {program.ageRange}</span>
                      </div>
                    )}
                    {program.description && (
                      <p className="text-white/60 text-sm leading-relaxed">{program.description}</p>
                    )}
                    {program.trialType && program.trialType !== 'none' && (
                      <div
                        className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
                        style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}
                      >
                        <Star className="w-3 h-3" />
                        {program.trialType === 'free'
                          ? `Free ${program.trialLengthDays}-day trial`
                          : `${program.trialLengthDays}-day trial — $${((program.trialPrice || 0) / 100).toFixed(0)}`}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-2xl font-bold text-white">
                      {formatPrice(program.price, program.billing)}
                    </div>
                    {program.type && (
                      <div className="text-xs text-white/40 mt-1 capitalize">{program.type.replace('_', ' ')}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div className="px-6 py-6 border-t border-white/10 text-center">
        <p className="text-white/40 text-sm">Interested in joining? Speak to a staff member or check in to get started.</p>
      </div>
    </div>
  );
}
