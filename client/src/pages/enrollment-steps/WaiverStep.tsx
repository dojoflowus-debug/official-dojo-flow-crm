import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';

interface WaiverStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
}

const WAIVER_TEXT = `
I, the undersigned, acknowledge that martial arts training involves physical activity and contact, 
and that there are inherent risks associated with such activities. I voluntarily assume all risks 
associated with participation in classes and activities at this facility.

I agree to:
• Follow all safety rules and instructor guidance
• Inform staff of any medical conditions or injuries
• Maintain appropriate conduct and respect for others
• Accept responsibility for personal belongings

I release and hold harmless the facility, its owners, instructors, and staff from any and all 
liability for injuries or damages that may occur during participation.
`;

export default function WaiverStep({ data, onNext, onBack, isSubmitting }: WaiverStepProps) {
  const [consentGiven, setConsentGiven] = useState(data.consentGiven || false);
  const [hasSignature, setHasSignature] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const signatureRef = useRef<SignatureCanvas>(null);

  const handleClearSignature = () => {
    signatureRef.current?.clear();
    setHasSignature(false);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!consentGiven) {
      newErrors.consent = 'You must agree to the waiver terms';
    }
    
    if (!hasSignature && signatureRef.current?.isEmpty()) {
      newErrors.signature = 'Signature is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      const signatureData = signatureRef.current?.toDataURL();
      
      onNext({
        waiverSigned: 1,
        waiverSignature: signatureData,
        waiverSignedAt: new Date().toISOString(),
        consentGiven: consentGiven ? 1 : 0,
      });
    }
  };

  return (
    <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 md:p-12">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
      >
        <ChevronLeft className="w-5 h-5" />
        Back
      </button>

      <div className="mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">
          Waiver & Consent
        </h2>
        <p className="text-slate-400">
          Please read and sign the waiver to complete your enrollment
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Waiver Text */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 max-h-64 overflow-y-auto">
          <h3 className="text-white font-semibold mb-4">Liability Waiver & Release</h3>
          <div className="text-slate-300 text-sm whitespace-pre-line leading-relaxed">
            {WAIVER_TEXT}
          </div>
        </div>

        {/* Consent Checkbox */}
        <div className="flex items-start gap-3">
          <Checkbox
            id="consent"
            checked={consentGiven}
            onCheckedChange={(checked) => setConsentGiven(checked as boolean)}
            className="mt-1"
          />
          <label htmlFor="consent" className="text-white text-sm cursor-pointer">
            I have read and agree to the terms of the liability waiver and release. 
            I understand the risks involved in martial arts training and voluntarily 
            assume all such risks.
            <span className="text-red-500"> *</span>
          </label>
        </div>
        {errors.consent && (
          <p className="text-red-400 text-sm">{errors.consent}</p>
        )}

        {/* Signature Pad */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-white text-lg">
              Signature <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={handleClearSignature}
              className="text-sm text-slate-400 hover:text-white transition-colors"
            >
              Clear
            </button>
          </div>
          
          <div className="border-2 border-slate-700 rounded-lg bg-white overflow-hidden">
            <SignatureCanvas
              ref={signatureRef}
              canvasProps={{
                className: 'w-full h-48',
              }}
              onEnd={() => setHasSignature(true)}
            />
          </div>
          
          <p className="text-slate-500 text-sm mt-2">
            Sign above using your mouse, trackpad, or touch screen
          </p>
          {errors.signature && (
            <p className="text-red-400 text-sm mt-2">{errors.signature}</p>
          )}
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-14 text-lg bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold"
        >
          {isSubmitting ? 'Saving...' : 'Continue to Review'}
        </Button>
      </form>
    </div>
  );
}
