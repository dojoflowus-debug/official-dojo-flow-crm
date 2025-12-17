import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ChevronLeft } from 'lucide-react';

interface ContactInfoStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
  onSkip: () => void;
  isSubmitting: boolean;
}

export default function ContactInfoStep({ data, onNext, onBack, isSubmitting }: ContactInfoStepProps) {
  const [phone, setPhone] = useState(data.phone || '');
  const [email, setEmail] = useState(data.email || '');
  const [streetAddress, setStreetAddress] = useState(data.streetAddress || '');
  const [city, setCity] = useState(data.city || '');
  const [state, setState] = useState(data.state || '');
  const [zipCode, setZipCode] = useState(data.zipCode || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatPhone = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{0,3})(\d{0,3})(\d{0,4})$/);
    if (match) {
      return !match[2] ? match[1] : `(${match[1]}) ${match[2]}${match[3] ? `-${match[3]}` : ''}`;
    }
    return value;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!phone && !email) {
      newErrors.contact = 'Phone number or email is required';
    }
    
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (phone && phone.replace(/\D/g, '').length !== 10) {
      newErrors.phone = 'Phone number must be 10 digits';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validate()) {
      onNext({
        phone: phone || undefined,
        email: email || undefined,
        streetAddress: streetAddress || undefined,
        city: city || undefined,
        state: state || undefined,
        zipCode: zipCode || undefined,
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
          How can we reach you?
        </h2>
        <p className="text-slate-400">
          We'll use this to send you class updates and important information
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Phone */}
        <div>
          <Label htmlFor="phone" className="text-white text-lg mb-2 block">
            Phone Number
          </Label>
          <Input
            id="phone"
            type="tel"
            value={phone}
            onChange={handlePhoneChange}
            className="h-14 text-lg bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
            placeholder="(555) 123-4567"
            maxLength={14}
          />
          {errors.phone && (
            <p className="text-red-400 text-sm mt-2">{errors.phone}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email" className="text-white text-lg mb-2 block">
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-14 text-lg bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
            placeholder="your.email@example.com"
          />
          {errors.email && (
            <p className="text-red-400 text-sm mt-2">{errors.email}</p>
          )}
        </div>

        {errors.contact && (
          <p className="text-red-400 text-sm">{errors.contact}</p>
        )}

        {/* Address (Optional) */}
        <div className="pt-4 border-t border-slate-700">
          <p className="text-slate-400 text-sm mb-4">Address (Optional)</p>
          
          <div className="space-y-4">
            <Input
              type="text"
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              className="h-12 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
              placeholder="Street Address"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="h-12 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                placeholder="City"
              />
              <Input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="h-12 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
                placeholder="State"
                maxLength={2}
              />
            </div>
            
            <Input
              type="text"
              value={zipCode}
              onChange={(e) => setZipCode(e.target.value)}
              className="h-12 bg-slate-800 border-slate-600 text-white placeholder:text-slate-500"
              placeholder="ZIP Code"
              maxLength={10}
            />
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-14 text-lg bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-semibold"
        >
          {isSubmitting ? 'Saving...' : 'Continue'}
        </Button>
      </form>
    </div>
  );
}
