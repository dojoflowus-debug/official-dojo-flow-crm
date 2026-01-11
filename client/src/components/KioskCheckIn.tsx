import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Search, Phone } from 'lucide-react';

/**
 * KioskCheckIn - Check-in entry screen for existing students
 * 
 * Features:
 * - Large, touch-friendly input
 * - Phone number search
 * - Name search
 * - QR scan ready (placeholder)
 * - RFID code ready (placeholder)
 * - Back button to home
 */
export default function KioskCheckIn() {
  const navigate = useNavigate();
  const { locationSlug } = useParams<{ locationSlug: string }>();

  const [inputValue, setInputValue] = useState('');
  const [inputMode, setInputMode] = useState<'phone' | 'name' | 'qr'>('phone');

  const handleBack = () => {
    navigate(`/kiosk/${locationSlug}`);
  };

  const handleCheckIn = () => {
    if (!inputValue.trim()) {
      alert('Please enter your information');
      return;
    }

    // TODO: Implement actual check-in logic
    console.log(`Check-in attempt: ${inputMode} = ${inputValue}`);
    alert(`Check-in successful!\n${inputMode}: ${inputValue}`);

    // Reset form
    setInputValue('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCheckIn();
    }
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

        <h1 className="text-5xl md:text-6xl font-bold text-white mb-3">Check In</h1>
        <p className="text-white/70 text-xl">
          {inputMode === 'phone' && 'Enter your phone number'}
          {inputMode === 'name' && 'Enter your name'}
          {inputMode === 'qr' && 'Scan your QR code'}
        </p>
      </div>

      {/* Main Input Section */}
      <div className="w-full max-w-2xl space-y-6">
        {/* Input Mode Selector */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => {
              setInputMode('phone');
              setInputValue('');
            }}
            className={`py-4 px-4 rounded-2xl font-semibold text-lg transition-all ${
              inputMode === 'phone'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            <Phone className="h-5 w-5 mx-auto mb-2" />
            Phone
          </button>

          <button
            onClick={() => {
              setInputMode('name');
              setInputValue('');
            }}
            className={`py-4 px-4 rounded-2xl font-semibold text-lg transition-all ${
              inputMode === 'name'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            <Search className="h-5 w-5 mx-auto mb-2" />
            Name
          </button>

          <button
            onClick={() => {
              setInputMode('qr');
              setInputValue('');
            }}
            className={`py-4 px-4 rounded-2xl font-semibold text-lg transition-all ${
              inputMode === 'qr'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            <svg className="h-5 w-5 mx-auto mb-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13-5h-2v3h-3v2h3v3h2v-3h3v-2h-3v-3z" />
            </svg>
            QR Code
          </button>
        </div>

        {/* Large Input Field */}
        <div className="space-y-3">
          <input
            type={inputMode === 'phone' ? 'tel' : 'text'}
            value={inputValue}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={
              inputMode === 'phone'
                ? '(555) 123-4567'
                : inputMode === 'name'
                  ? 'John Doe'
                  : 'Scan QR code...'
            }
            autoFocus
            className="w-full px-8 py-6 rounded-3xl bg-white/10 border-2 border-white/20 text-white text-3xl font-semibold placeholder-white/40 focus:outline-none focus:border-blue-400 focus:bg-white/20 transition-all"
          />
        </div>

        {/* Check In Button */}
        <button
          onClick={handleCheckIn}
          className="w-full py-6 rounded-3xl bg-gradient-to-r from-green-500 to-green-600 text-white text-2xl font-bold shadow-lg hover:from-green-400 hover:to-green-500 transition-all active:scale-95"
        >
          Check In
        </button>

        {/* Info Text */}
        <p className="text-center text-white/50 text-sm">
          {inputMode === 'phone' && "We'll find your account by phone number"}
          {inputMode === 'name' && 'Search for your name in our system'}
          {inputMode === 'qr' && 'Scan your student QR code to check in instantly'}
        </p>
      </div>

      {/* Placeholder for future features */}
      <div className="w-full max-w-2xl mt-12 pt-8 border-t border-white/10">
        <p className="text-center text-white/40 text-xs">
          Future: RFID card scan • Biometric • Voice recognition
        </p>
      </div>
    </div>
  );
}
