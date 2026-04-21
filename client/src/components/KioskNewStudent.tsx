import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';
import KioskWaiverSigning from './KioskWaiverSigning';

/**
 * KioskNewStudent - New student onboarding entry screen
 *
 * Flow: info → program → waiver → done
 */
export default function KioskNewStudent() {
  const navigate = useNavigate();
  const { locationSlug } = useParams<{ locationSlug: string }>();
  const { user } = useAuth();
  const orgId = (user as any)?.activeOrgId || 1;

  const [formData, setFormData] = useState({ name: '', phone: '', program: '' });
  const [currentStep, setCurrentStep] = useState<'info' | 'program' | 'waiver' | 'done'>('info');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createLead = trpc.kiosk.createKioskLead.useMutation();

  const programs = [
    { id: 'kids-karate',  name: 'Kids Karate',     age: '4–7 years',   icon: '🥋' },
    { id: 'youth-karate', name: 'Youth Karate',    age: '8–12 years',  icon: '🥋' },
    { id: 'teen-karate',  name: 'Teen Karate',     age: '13–17 years', icon: '🥋' },
    { id: 'adult-karate', name: 'Adult Karate',    age: '18+ years',   icon: '🥋' },
    { id: 'fitness',      name: 'Fitness Classes', age: 'All ages',    icon: '💪' },
    { id: 'trial',        name: 'Free Trial Class', age: 'All ages',   icon: '⭐' },
  ];

  const handleBack = () => {
    if (currentStep === 'info') navigate(`/kiosk/${locationSlug}`);
    else if (currentStep === 'program') setCurrentStep('info');
    else if (currentStep === 'waiver') setCurrentStep('program');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProgramSelect = (programId: string) => {
    setFormData(prev => ({ ...prev, program: programId }));
    setCurrentStep('waiver');
  };

  const handleWaiverAccepted = async (_signatureDataUrl: string) => {
    setIsSubmitting(true);
    try {
      const nameParts = formData.name.trim().split(' ');
      const firstName = nameParts[0] || formData.name;
      const lastName = nameParts.slice(1).join(' ') || '';
      await createLead.mutateAsync({
        orgId,
        firstName,
        lastName,
        phone: formData.phone,
        interestedProgram: formData.program,
        source: 'Kiosk',
      });
    } catch (err) {
      console.error('Failed to create lead from kiosk:', err);
    } finally {
      setIsSubmitting(false);
      setCurrentStep('done');
    }
  };

  // ── Done screen ─────────────────────────────────────────────────────────────
  if (currentStep === 'done') {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-8 text-center">
        <div className="text-8xl mb-6">🎉</div>
        <h1
          className="text-6xl font-black text-white mb-4 uppercase tracking-widest"
          style={{ textShadow: '0 0 40px rgba(34,197,94,0.6)' }}
        >
          Welcome!
        </h1>
        <p className="text-2xl text-white/70 mb-2">
          You're all set, <span className="text-white font-bold">{formData.name.split(' ')[0]}</span>!
        </p>
        <p className="text-lg text-white/50 mb-10">
          A staff member will reach out to schedule your first class.
        </p>
        <div
          className="flex items-center gap-3 px-6 py-3 rounded-full mb-10"
          style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)' }}
        >
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-green-300 font-semibold">Waiver signed &amp; info saved</span>
        </div>
        <button
          onClick={() => navigate(`/kiosk/${locationSlug}`)}
          className="px-10 py-4 rounded-2xl text-white font-black text-xl"
          style={{
            background: 'linear-gradient(135deg, #ef4444, #dc2626)',
            boxShadow: '0 0 30px rgba(239,68,68,0.4)',
          }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-8">
      {/* Header */}
      {currentStep !== 'waiver' && (
        <div className="w-full max-w-2xl mb-10">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="h-6 w-6" />
            <span className="text-lg font-medium">Back</span>
          </button>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-2">
            {currentStep === 'info' ? 'New Student' : 'Choose a Program'}
          </h1>
          <p className="text-white/60 text-lg">
            {currentStep === 'info'
              ? 'Tell us a bit about yourself'
              : 'Pick the program that interests you most'}
          </p>
        </div>
      )}

      {/* Step 1: Info */}
      {currentStep === 'info' && (
        <div className="w-full max-w-2xl space-y-6">
          <div className="space-y-3">
            <label className="block text-white/70 text-sm font-medium">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="John Doe"
              className="w-full px-6 py-4 rounded-2xl bg-white/10 border-2 border-white/20 text-white text-2xl font-semibold placeholder-white/40 focus:outline-none focus:border-red-400 focus:bg-white/20 transition-all"
              autoFocus
            />
          </div>
          <div className="space-y-3">
            <label className="block text-white/70 text-sm font-medium">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="(555) 123-4567"
              className="w-full px-6 py-4 rounded-2xl bg-white/10 border-2 border-white/20 text-white text-2xl font-semibold placeholder-white/40 focus:outline-none focus:border-red-400 focus:bg-white/20 transition-all"
            />
          </div>
          <button
            onClick={() => setCurrentStep('program')}
            disabled={!formData.name.trim() || !formData.phone.trim()}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 text-white text-xl font-bold shadow-lg hover:from-red-400 hover:to-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            Next: Choose Program
          </button>
        </div>
      )}

      {/* Step 2: Program */}
      {currentStep === 'program' && (
        <div className="w-full max-w-4xl space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {programs.map((program) => (
              <button
                key={program.id}
                onClick={() => handleProgramSelect(program.id)}
                className="group relative bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-md rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border border-white/20 hover:border-red-400/50 overflow-hidden text-left"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-red-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative">
                  <div className="text-4xl mb-3">{program.icon}</div>
                  <h3 className="text-white text-xl font-bold mb-1">{program.name}</h3>
                  <p className="text-white/60 text-sm">{program.age}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Waiver */}
      {currentStep === 'waiver' && (
        <div className="w-full max-w-2xl">
          <div className="mb-6">
            <button
              onClick={handleBack}
              className="flex items-center gap-2 text-white/60 hover:text-white transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="font-medium">Back</span>
            </button>
          </div>
          <KioskWaiverSigning
            studentName={formData.name}
            onAccept={handleWaiverAccepted}
            onDecline={handleBack}
          />
          {isSubmitting && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
              <div className="text-white text-xl font-bold animate-pulse">Saving your info...</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
