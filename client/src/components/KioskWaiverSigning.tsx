/**
 * KioskWaiverSigning
 * Touch-friendly digital waiver component for the kiosk new student flow.
 * Displays a scrollable waiver text and a finger-draw signature canvas.
 */
import { useRef, useState, useEffect, useCallback } from 'react';
import { CheckCircle, RotateCcw } from 'lucide-react';

const WAIVER_TEXT = `PARTICIPANT WAIVER AND RELEASE OF LIABILITY

By signing below, I acknowledge and agree to the following terms:

1. ASSUMPTION OF RISK
I understand that martial arts training involves physical contact, falls, throws, and other activities that carry inherent risks of injury. I voluntarily assume all risks associated with participation in classes, training sessions, and activities at this facility.

2. RELEASE OF LIABILITY
I hereby release, waive, discharge, and covenant not to sue the school, its owners, instructors, employees, and agents from any and all liability, claims, demands, actions, or causes of action arising out of or related to any loss, damage, or injury that may be sustained by me while participating in any activity at this facility.

3. MEDICAL AUTHORIZATION
I authorize the school to obtain emergency medical treatment for me (or my child) if I cannot be reached. I confirm that I am in good physical health and have no known medical conditions that would prevent safe participation.

4. PHOTO/VIDEO CONSENT
I grant permission to use photographs or video recordings taken during training for promotional or educational purposes.

5. CODE OF CONDUCT
I agree to follow all school rules, show respect to instructors and fellow students, and maintain appropriate conduct at all times.

By signing below, I confirm I have read, understood, and agree to these terms.`;

interface Props {
  studentName: string;
  onAccept: (signatureDataUrl: string) => void;
  onDecline: () => void;
}

export default function KioskWaiverSigning({ studentName, onAccept, onDecline }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isSigning, setIsSigning] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  // Setup canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getPos = (e: React.TouchEvent | React.MouseEvent, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ('touches' in e) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: ((e as React.MouseEvent).clientX - rect.left) * scaleX,
      y: ((e as React.MouseEvent).clientY - rect.top) * scaleY,
    };
  };

  const startDraw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    setIsSigning(true);
    lastPos.current = getPos(e, canvas);
  }, []);

  const draw = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (!isSigning) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    e.preventDefault();
    const pos = getPos(e, canvas);
    if (lastPos.current) {
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();
    }
    lastPos.current = pos;
    setHasSigned(true);
  }, [isSigning]);

  const endDraw = useCallback(() => {
    setIsSigning(false);
    lastPos.current = null;
  }, []);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const handleAccept = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasSigned) return;
    onAccept(canvas.toDataURL('image/png'));
  };

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 20) {
      setHasScrolled(true);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-3xl font-black text-white mb-2">Waiver & Agreement</h2>
        <p className="text-white/60">Please read and sign below, <span className="text-white font-bold">{studentName}</span></p>
      </div>

      {/* Waiver text */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="rounded-2xl p-5 text-sm leading-relaxed overflow-y-auto"
        style={{
          maxHeight: '280px',
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: 'rgba(255,255,255,0.75)',
          whiteSpace: 'pre-line',
        }}
      >
        {WAIVER_TEXT}
      </div>

      {!hasScrolled && (
        <p className="text-center text-amber-400/80 text-sm font-medium animate-pulse">
          ↓ Scroll to read the full waiver before signing
        </p>
      )}

      {/* Signature pad */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-white/70 text-sm font-medium">Sign with your finger below:</p>
          <button
            onClick={clearSignature}
            className="flex items-center gap-1.5 text-white/40 hover:text-white/70 text-xs transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
        <div
          className="rounded-2xl overflow-hidden relative"
          style={{ border: '2px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.4)' }}
        >
          <canvas
            ref={canvasRef}
            width={600}
            height={160}
            className="w-full touch-none cursor-crosshair"
            style={{ display: 'block' }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
          {!hasSigned && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <p className="text-white/20 text-lg font-medium italic">Sign here</p>
            </div>
          )}
          {/* Signature line */}
          <div className="absolute bottom-8 left-8 right-8 border-b border-white/20 pointer-events-none" />
        </div>
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={onDecline}
          className="py-4 rounded-2xl font-bold text-white/60 hover:text-white/80 transition-all"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          Back
        </button>
        <button
          onClick={handleAccept}
          disabled={!hasSigned}
          className="py-4 rounded-2xl font-black text-white transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: hasSigned ? 'linear-gradient(135deg, #22c55e, #16a34a)' : 'rgba(255,255,255,0.1)',
            boxShadow: hasSigned ? '0 0 20px rgba(34,197,94,0.4)' : 'none',
          }}
        >
          <CheckCircle className="w-5 h-5" />
          I Agree & Sign
        </button>
      </div>
    </div>
  );
}
