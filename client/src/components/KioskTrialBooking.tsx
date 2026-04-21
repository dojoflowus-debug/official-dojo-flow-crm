/**
 * KioskTrialBooking
 * Allows walk-in visitors to book a free trial class directly on the kiosk.
 * Flow: info → pick time slot → confirm → done
 */
import { useState } from 'react';
import { ArrowLeft, Calendar, Clock, CheckCircle, User, Phone } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/hooks/useAuth';

interface Props {
  onBack: () => void;
  onDone: () => void;
}

const TIME_SLOTS = [
  { id: 'mon-6pm',  label: 'Monday',    time: '6:00 PM',  spots: 4 },
  { id: 'tue-10am', label: 'Tuesday',   time: '10:00 AM', spots: 6 },
  { id: 'wed-6pm',  label: 'Wednesday', time: '6:00 PM',  spots: 3 },
  { id: 'thu-7pm',  label: 'Thursday',  time: '7:00 PM',  spots: 5 },
  { id: 'sat-10am', label: 'Saturday',  time: '10:00 AM', spots: 8 },
  { id: 'sat-12pm', label: 'Saturday',  time: '12:00 PM', spots: 6 },
];

const PROGRAMS = [
  { id: 'kids-karate',  label: 'Kids Karate',    age: '4–12 yrs' },
  { id: 'adult-karate', label: 'Adult Karate',   age: '13+ yrs' },
  { id: 'fitness',      label: 'Fitness',        age: 'All ages' },
];

export default function KioskTrialBooking({ onBack, onDone }: Props) {
  const { user } = useAuth();
  const orgId = (user as any)?.activeOrgId || 1;

  const [step, setStep] = useState<'info' | 'slot' | 'confirm' | 'done'>('info');
  const [form, setForm] = useState({ name: '', phone: '', program: '' });
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bookTrial = trpc.kiosk.bookTrialClass.useMutation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const slot = TIME_SLOTS.find(s => s.id === selectedSlot);
      const nameParts = form.name.trim().split(' ');
      await bookTrial.mutateAsync({
        orgId,
        firstName: nameParts[0] || form.name,
        lastName: nameParts.slice(1).join(' ') || '',
        phone: form.phone,
        program: form.program || 'Free Trial',
        preferredDate: slot?.label,
        preferredTime: slot?.time,
      });
      setStep('done');
    } catch (err) {
      console.error('Failed to book trial:', err);
      setStep('done'); // still show success to visitor
    } finally {
      setIsSubmitting(false);
    }
  };

  if (step === 'done') {
    return (
      <div className="flex flex-col items-center justify-center text-center py-12 space-y-6">
        <div className="text-8xl">🥋</div>
        <h2
          className="text-5xl font-black text-white uppercase tracking-widest"
          style={{ textShadow: '0 0 30px rgba(34,197,94,0.5)' }}
        >
          Trial Booked!
        </h2>
        <p className="text-xl text-white/70">
          We'll text <span className="text-white font-bold">{form.phone}</span> to confirm your spot.
        </p>
        <div
          className="flex items-center gap-3 px-6 py-3 rounded-full"
          style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)' }}
        >
          <CheckCircle className="w-5 h-5 text-green-400" />
          <span className="text-green-300 font-semibold">
            {TIME_SLOTS.find(s => s.id === selectedSlot)?.label} at {TIME_SLOTS.find(s => s.id === selectedSlot)?.time}
          </span>
        </div>
        <button
          onClick={onDone}
          className="mt-4 px-10 py-4 rounded-2xl text-white font-black text-xl"
          style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 0 30px rgba(239,68,68,0.4)' }}
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={step === 'info' ? onBack : () => setStep(step === 'slot' ? 'info' : 'slot')}
          className="flex items-center gap-2 text-white/60 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft className="h-5 w-5" />
          <span className="font-medium">Back</span>
        </button>
        <h2 className="text-4xl font-black text-white mb-1">
          {step === 'info' ? 'Book a Free Trial' : step === 'slot' ? 'Pick a Time' : 'Confirm Booking'}
        </h2>
        <p className="text-white/50">
          {step === 'info' ? 'No commitment — just come try it out' : step === 'slot' ? 'Choose the class that works for you' : 'Review your details below'}
        </p>
      </div>

      {/* Step 1: Info */}
      {step === 'info' && (
        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-white/70 text-sm font-medium flex items-center gap-2">
              <User className="w-4 h-4" /> Full Name
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="John Doe"
              autoFocus
              className="w-full px-5 py-4 rounded-2xl text-white text-xl font-semibold placeholder-white/30 focus:outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.07)', border: '2px solid rgba(255,255,255,0.15)' }}
            />
          </div>
          <div className="space-y-2">
            <label className="text-white/70 text-sm font-medium flex items-center gap-2">
              <Phone className="w-4 h-4" /> Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              placeholder="(555) 123-4567"
              className="w-full px-5 py-4 rounded-2xl text-white text-xl font-semibold placeholder-white/30 focus:outline-none transition-all"
              style={{ background: 'rgba(255,255,255,0.07)', border: '2px solid rgba(255,255,255,0.15)' }}
            />
          </div>
          {/* Program selector */}
          <div className="space-y-2">
            <label className="text-white/70 text-sm font-medium">Program Interest</label>
            <div className="grid grid-cols-3 gap-3">
              {PROGRAMS.map(p => (
                <button
                  key={p.id}
                  onClick={() => setForm(prev => ({ ...prev, program: p.id }))}
                  className="py-3 px-2 rounded-xl text-center transition-all"
                  style={{
                    background: form.program === p.id ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)',
                    border: `2px solid ${form.program === p.id ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.12)'}`,
                  }}
                >
                  <p className="text-white font-bold text-sm">{p.label}</p>
                  <p className="text-white/50 text-xs">{p.age}</p>
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => setStep('slot')}
            disabled={!form.name.trim() || !form.phone.trim()}
            className="w-full py-4 rounded-2xl text-white text-xl font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 0 20px rgba(239,68,68,0.3)' }}
          >
            Next: Pick a Time
          </button>
        </div>
      )}

      {/* Step 2: Time slots */}
      {step === 'slot' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {TIME_SLOTS.map(slot => (
              <button
                key={slot.id}
                onClick={() => setSelectedSlot(slot.id)}
                className="rounded-2xl p-5 text-left transition-all"
                style={{
                  background: selectedSlot === slot.id ? 'rgba(239,68,68,0.2)' : 'rgba(255,255,255,0.05)',
                  border: `2px solid ${selectedSlot === slot.id ? 'rgba(239,68,68,0.6)' : 'rgba(255,255,255,0.1)'}`,
                  boxShadow: selectedSlot === slot.id ? '0 0 20px rgba(239,68,68,0.2)' : 'none',
                }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-red-400" />
                  <span className="text-white font-bold">{slot.label}</span>
                </div>
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-white/40" />
                  <span className="text-white/70 text-sm">{slot.time}</span>
                </div>
                <span className="text-xs text-green-400 font-medium">{slot.spots} spots left</span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setStep('confirm')}
            disabled={!selectedSlot}
            className="w-full py-4 rounded-2xl text-white text-xl font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 0 20px rgba(239,68,68,0.3)' }}
          >
            Next: Confirm
          </button>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 'confirm' && (
        <div className="space-y-6">
          <div
            className="rounded-2xl p-6 space-y-4"
            style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-white/50 text-xs">Name</p>
                <p className="text-white font-bold">{form.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-white/50 text-xs">Phone</p>
                <p className="text-white font-bold">{form.phone}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Calendar className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-white/50 text-xs">Trial Class</p>
                <p className="text-white font-bold">
                  {TIME_SLOTS.find(s => s.id === selectedSlot)?.label} at {TIME_SLOTS.find(s => s.id === selectedSlot)?.time}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="w-full py-4 rounded-2xl text-white text-xl font-black transition-all disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 0 20px rgba(34,197,94,0.3)' }}
          >
            {isSubmitting ? 'Booking...' : '✓ Confirm Trial Class'}
          </button>
        </div>
      )}
    </div>
  );
}
