import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, User, Phone, Zap } from 'lucide-react';

/**
 * KioskNewStudent - New student onboarding entry screen
 * 
 * Features:
 * - Name input
 * - Phone number input
 * - Program interest selector
 * - Placeholder for waiver and payment flows
 * - Back button to home
 */
export default function KioskNewStudent() {
  const navigate = useNavigate();
  const { locationSlug } = useParams<{ locationSlug: string }>();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    program: '',
  });

  const [currentStep, setCurrentStep] = useState<'info' | 'program' | 'confirm'>('info');

  const programs = [
    { id: 'kids-karate', name: 'Kids Karate', age: '4-7 years', icon: '🥋' },
    { id: 'youth-karate', name: 'Youth Karate', age: '8-12 years', icon: '🥋' },
    { id: 'teen-karate', name: 'Teen Karate', age: '13-17 years', icon: '🥋' },
    { id: 'adult-karate', name: 'Adult Karate', age: '18+ years', icon: '🥋' },
    { id: 'fitness', name: 'Fitness Classes', age: 'All ages', icon: '💪' },
    { id: 'trial', name: 'Free Trial Class', age: 'All ages', icon: '⭐' },
  ];

  const handleBack = () => {
    if (currentStep === 'info') {
      navigate(`/kiosk/${locationSlug}`);
    } else {
      setCurrentStep('info');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProgramSelect = (programId: string) => {
    setFormData((prev) => ({ ...prev, program: programId }));
    setCurrentStep('confirm');
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !formData.phone.trim() || !formData.program) {
      alert('Please fill in all fields');
      return;
    }

    // TODO: Implement actual enrollment logic
    console.log('New student enrollment:', formData);
    alert(
      `Welcome to training!\n\nName: ${formData.name}\nPhone: ${formData.phone}\nProgram: ${formData.program}\n\nNext: Waiver & Payment`
    );

    // Reset form
    setFormData({ name: '', phone: '', program: '' });
    setCurrentStep('info');
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-4 py-8">
      {/* Header with Back Button */}
      <div className="w-full max-w-2xl mb-12">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-8"
        >
          <ArrowLeft className="h-6 w-6" />
          <span className="text-lg font-medium">Back</span>
        </button>

        <h1 className="text-5xl md:text-6xl font-bold text-white mb-3">Start Training</h1>
        <p className="text-white/70 text-xl">Welcome! Let's get you started</p>
      </div>

      {/* Step 1: Basic Info */}
      {currentStep === 'info' && (
        <div className="w-full max-w-2xl space-y-6">
          <div className="space-y-3">
            <label className="block text-white/70 text-sm font-medium">Your Name</label>
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

      {/* Step 2: Program Selection */}
      {currentStep === 'program' && (
        <div className="w-full max-w-4xl space-y-6">
          <h2 className="text-3xl font-bold text-white mb-8">Which program interests you?</h2>

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

          <button
            onClick={() => setCurrentStep('info')}
            className="w-full py-3 rounded-2xl bg-white/10 text-white font-semibold hover:bg-white/20 transition-all"
          >
            Back
          </button>
        </div>
      )}

      {/* Step 3: Confirmation */}
      {currentStep === 'confirm' && (
        <div className="w-full max-w-2xl space-y-8">
          <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 space-y-6">
            <h2 className="text-3xl font-bold text-white">Confirm Your Information</h2>

            <div className="space-y-4">
              <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                <User className="h-6 w-6 text-red-400" />
                <div>
                  <p className="text-white/60 text-sm">Name</p>
                  <p className="text-white text-lg font-semibold">{formData.name}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 pb-4 border-b border-white/10">
                <Phone className="h-6 w-6 text-red-400" />
                <div>
                  <p className="text-white/60 text-sm">Phone</p>
                  <p className="text-white text-lg font-semibold">{formData.phone}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Zap className="h-6 w-6 text-red-400" />
                <div>
                  <p className="text-white/60 text-sm">Program</p>
                  <p className="text-white text-lg font-semibold">
                    {programs.find((p) => p.id === formData.program)?.name}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setCurrentStep('program')}
              className="py-4 rounded-2xl bg-white/10 text-white font-bold hover:bg-white/20 transition-all"
            >
              Back
            </button>

            <button
              onClick={handleSubmit}
              className="py-4 rounded-2xl bg-gradient-to-r from-green-500 to-green-600 text-white font-bold shadow-lg hover:from-green-400 hover:to-green-500 transition-all active:scale-95"
            >
              Complete Enrollment
            </button>
          </div>

          <p className="text-center text-white/40 text-sm">
            Next: Waiver signature • Payment information
          </p>
        </div>
      )}
    </div>
  );
}
