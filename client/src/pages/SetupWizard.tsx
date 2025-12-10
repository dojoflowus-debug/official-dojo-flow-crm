import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { CheckCircle2, Circle, Volume2, VolumeX, AlertTriangle, RotateCcw } from 'lucide-react';

// Import all 8 step components
import Step0AvatarName from '../components/setup/Step0AvatarName';
import Step0KaiAppearance from '../components/setup-wizard/Step0KaiAppearance';
import Step1Industry from '../components/setup-wizard/Step1Industry';
import Step2Brand from '../components/setup-wizard/Step2Brand';
import Step3Locations from '../components/setup-wizard/Step3Locations';
import Step4Programs from '../components/setup-wizard/Step4Programs';
import Step5Financials from '../components/setup-wizard/Step5Financials';
import Step6Team from '../components/setup-wizard/Step6Team';
import Step7MemberJourney from '../components/setup-wizard/Step7MemberJourney';
import Step8Review from '../components/setup-wizard/Step8Review';
import Step9PaymentProcessor from '../components/setup-wizard/Step9PaymentProcessor';

// Import Kai components and services
import SetupKai from '../components/setup-wizard/SetupKai';
import { voiceService } from '../lib/voiceService';
import { getStepMessage, getIndustryMessage, getWelcomeMessage, getDisclaimerMessage, VOICE_SELECTION_MESSAGE, INDUSTRY_SELECTION_MESSAGE } from '../lib/kaiMessages';
import { setAvatarName as saveAvatarName } from '@/../../shared/utils';

export default function SetupWizard() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [disclaimerSpeechComplete, setDisclaimerSpeechComplete] = useState(false);
  const [showVoiceSelection, setShowVoiceSelection] = useState(false);
  const [voiceSelectionSpeechComplete, setVoiceSelectionSpeechComplete] = useState(false);
  const [selectedVoiceGender, setSelectedVoiceGender] = useState<'male' | 'female' | null>(null);
  const [showAvatarNaming, setShowAvatarNaming] = useState(false);
  const [avatarName, setAvatarName] = useState('Kai');
  const [showAppearanceSelection, setShowAppearanceSelection] = useState(false);
  const [appearanceSelectionSpeechComplete, setAppearanceSelectionSpeechComplete] = useState(false);
  const [selectedAppearance, setSelectedAppearance] = useState<'default' | 'orb' | 'particles'>('default');
  const [currentStep, setCurrentStep] = useState(1);
  const [currentMessage, setCurrentMessage] = useState(getWelcomeMessage().text);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(voiceService.isMutedState());
  const [selectedIndustry, setSelectedIndustry] = useState<string>('');

  const totalSteps = 9;

  const steps = [
    { number: 1, title: 'Industry', nextTitle: 'Brand Setup' },
    { number: 2, title: 'Brand', nextTitle: 'Locations' },
    { number: 3, title: 'Locations', nextTitle: 'Programs' },
    { number: 4, title: 'Programs', nextTitle: 'Financials' },
    { number: 5, title: 'Money', nextTitle: 'Team' },
    { number: 6, title: 'Team', nextTitle: 'Journey' },
    { number: 7, title: 'Journey', nextTitle: 'Payment' },
    { number: 8, title: 'Payment', nextTitle: 'Review' },
    { number: 9, title: 'Launch', nextTitle: 'Complete' },
  ];

  // Auto-play welcome message on mount
  useEffect(() => {
    if (showWelcome) {
      // Small delay to ensure component is fully mounted
      const timer = setTimeout(() => {
        const welcomeMsg = getWelcomeMessage();
        setIsSpeaking(true);
        voiceService.speak(welcomeMsg.text, () => {
          setIsSpeaking(false);
        }, { disableFallback: true });
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [showWelcome]);

  // Start setup - unlock audio and show disclaimer
  const handleStartSetup = async () => {
    // Unlock audio context first (requires user interaction)
    await voiceService.unlockAudio();
    
    // Set disclaimer message and start speaking immediately (preserves user interaction)
    const disclaimerMsg = getDisclaimerMessage();
    setCurrentMessage(disclaimerMsg.text);
    setIsSpeaking(true);
    voiceService.speakImmediate(disclaimerMsg.text, () => {
      setIsSpeaking(false);
      // Enable checkbox after Kai finishes speaking
      setDisclaimerSpeechComplete(true);
    }, { disableFallback: true }); // Disable Web Speech fallback to prevent robot voice overlap
    
    // Hide welcome screen and show disclaimer
    setShowWelcome(false);
    setShowDisclaimer(true);
  };

  // Trigger Kai voice when checkbox is checked
  useEffect(() => {
    if (disclaimerAccepted) {
      const message = "Great! You're in. Select 'I Accept' and let's get started!";
      setCurrentMessage(message);
      setIsSpeaking(true);
      voiceService.speak(message, () => {
        setIsSpeaking(false);
      }, { disableFallback: true });
    }
  }, [disclaimerAccepted]);

  // Accept disclaimer and proceed to voice selection
  const handleAcceptDisclaimer = () => {
    setShowDisclaimer(false);
    setShowVoiceSelection(true);
    setVoiceSelectionSpeechComplete(false); // Reset speech completion state
    // Kai introduces voice selection
    setCurrentMessage(VOICE_SELECTION_MESSAGE.text);
    setIsSpeaking(true);
    voiceService.speak(VOICE_SELECTION_MESSAGE.text, () => {
      setIsSpeaking(false);
      setVoiceSelectionSpeechComplete(true); // Enable continue button after speech
    }, { disableFallback: true });
  };

  // Handle voice gender selection
  const handleVoiceGenderSelect = (gender: 'male' | 'female') => {
    setSelectedVoiceGender(gender);
    
    // Switch voice gender immediately and play sample
    voiceService.setVoiceGender(gender);
    
    // Stop any currently playing voice first
    voiceService.stop();
    
    // Play sample voice in the selected gender (only if not muted)
    const sampleMessage = gender === 'female' 
      ? "Hello! This is my female voice. I'm excited to help you build your business!"
      : "Hello! This is my male voice. I'm excited to help you build your business!";
    
    setCurrentMessage(sampleMessage);
    
    // Only play if not muted
    if (!isMuted) {
      setIsSpeaking(true);
      
      // Use setTimeout to ensure voice gender has switched
      setTimeout(() => {
        voiceService.speak(sampleMessage, () => {
          setIsSpeaking(false);
        }, { disableFallback: true }); // Disable Web Speech fallback on voice selection page
      }, 100);
    }
  };

  // Continue from voice selection to avatar naming
  const handleContinueFromVoice = () => {
    setShowVoiceSelection(false);
    setShowAvatarNaming(true);
    const message = "Perfect! Now, what would you like to call me? You can choose from suggestions or create your own name.";
    setCurrentMessage(message);
    speakMessage(message);
  };

  // Handle avatar name selection
  const handleAvatarNameSelect = (name: string) => {
    setAvatarName(name);
    // Save to localStorage
    saveAvatarName(name);
    // Continue to appearance selection
    setShowAvatarNaming(false);
    setShowAppearanceSelection(true);
    setAppearanceSelectionSpeechComplete(false); // Reset speech completion state
    const message = `Great! I'll be ${name} from now on. Now let's choose how I'll appear to you. Pick the look that resonates with you!`;
    setCurrentMessage(message);
    setIsSpeaking(true);
    voiceService.speak(message, () => {
      setIsSpeaking(false);
      setAppearanceSelectionSpeechComplete(true); // Enable continue button after speech
    }, { disableFallback: true });
  };

  // Go back from avatar naming to voice selection
  const handleBackFromAvatarNaming = () => {
    setShowAvatarNaming(false);
    setShowVoiceSelection(true);
  };

  // Handle appearance selection
  const handleAppearanceSelect = (appearance: 'default' | 'orb' | 'particles') => {
    setSelectedAppearance(appearance);
  };

  // Continue from appearance selection to setup
  const handleContinueFromAppearance = () => {
    setShowAppearanceSelection(false);
    // Message will be triggered automatically by useEffect when showAppearanceSelection becomes false
  };

  // Update message when step changes (only when on setup screens)
  useEffect(() => {
    // Only play step messages when we're past welcome/disclaimer/voice/naming/appearance selection
    if (!showWelcome && !showDisclaimer && !showVoiceSelection && !showAvatarNaming && !showAppearanceSelection) {
      const message = getStepMessage(currentStep);
      setCurrentMessage(message);
      speakMessage(message);
    }
  }, [currentStep, showWelcome, showDisclaimer, showVoiceSelection, showAvatarNaming, showAppearanceSelection]);

  // Speak message function
  const speakMessage = (message: string) => {
    setIsSpeaking(true);
    voiceService.speak(message, () => {
      setIsSpeaking(false);
    }, { disableFallback: true }); // Disable Web Speech fallback to prevent robot voice overlap
  };

  // Handle industry selection
  const handleIndustrySelect = (industry: string) => {
    setSelectedIndustry(industry);
    const message = getIndustryMessage(industry);
    setCurrentMessage(message);
    speakMessage(message);
  };

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleEditStep = (stepNumber: number) => {
    setCurrentStep(stepNumber);
  };

  const toggleMute = () => {
    const newMuteState = voiceService.toggleMute();
    setIsMuted(newMuteState);
    if (newMuteState) {
      setIsSpeaking(false);
    }
  };

  // Repeat current message (replay voice + captions)
  const repeatMessage = () => {
    voiceService.stop();
    setIsSpeaking(false);
    setTimeout(() => {
      speakMessage(currentMessage);
    }, 100);
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Industry onNext={handleNext} onIndustrySelect={handleIndustrySelect} />;
      case 2:
        return <Step2Brand onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <Step3Locations onNext={handleNext} onBack={handleBack} />;
      case 4:
        return <Step4Programs onNext={handleNext} onBack={handleBack} />;
      case 5:
        return <Step5Financials onNext={handleNext} onBack={handleBack} />;
      case 6:
        return <Step6Team onNext={handleNext} onBack={handleBack} />;
      case 7:
        return <Step7MemberJourney onNext={handleNext} onBack={handleBack} />;
      case 8:
        return <Step9PaymentProcessor onNext={handleNext} onBack={handleBack} />;
      case 9:
        return <Step8Review onBack={handleBack} onEditStep={handleEditStep} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Welcome Screen Overlay */}
      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
          <div className="text-center space-y-12 px-8">
            {/* Large Red Glowing Orb */}
            <div className="flex justify-center mb-16">
              <div className="relative">
                {/* Main red orb */}
                <div className="w-64 h-64 rounded-full bg-gradient-to-br from-red-400 via-red-500 to-red-600 shadow-2xl" />
                
                {/* Intense red glow */}
                <div className="absolute inset-0 w-64 h-64 rounded-full bg-red-500 blur-3xl opacity-80 animate-pulse" />
                <div className="absolute inset-0 w-64 h-64 rounded-full bg-red-600 blur-2xl opacity-60" />
                
                {/* Outer atmospheric glow */}
                <div className="absolute -inset-8 w-80 h-80 rounded-full bg-red-500 blur-[100px] opacity-40" />
              </div>
            </div>
            
            {/* Title and Subtitle */}
            <div className="space-y-6">
              <h1 className="text-7xl font-black text-white tracking-wider">
                WELCOME TO<br/>DOJOFLOW
              </h1>
              <p className="text-2xl text-gray-300 font-light">
                Let Kai guide you through setting up your business.
              </p>
            </div>
            
            {/* Outlined Button */}
            <Button
              onClick={handleStartSetup}
              size="lg"
              className="bg-transparent border-2 border-red-500 hover:bg-red-500/10 text-white px-16 py-7 text-xl font-semibold rounded-full tracking-widest transition-all duration-300"
            >
              START SETUP WITH KAI
            </Button>
          </div>
        </div>
      )}

      {/* Disclaimer Screen */}
      {showDisclaimer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black px-8">
          <div className="relative">
            {/* Kai Orb on Disclaimer Screen - Positioned to the right of card */}
            <div className="absolute top-8 -right-64">
              <SetupKai 
                message={currentMessage} 
                isSpeaking={isSpeaking}
                bubblePosition="left"
                appearance={selectedAppearance}
              />
            </div>

            <Card className="max-w-3xl bg-black border-gray-700">
            <CardContent className="p-8 space-y-6">
              {/* Header */}
              <div className="flex items-center gap-3 pb-4 border-b border-gray-700">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <h2 className="text-3xl font-bold text-white">Terms & Conditions</h2>
              </div>

              {/* Content */}
              <div className="space-y-4 text-gray-300 max-h-96 overflow-y-auto">
                <h3 className="text-xl font-semibold text-white">About Kai - Your AI Business Assistant</h3>
                
                <p className="leading-relaxed">
                  Kai is an artificial intelligence assistant designed to help you set up and optimize your business operations. 
                  Kai provides guidance based on industry best practices, data analysis, and established business frameworks.
                </p>

                <h3 className="text-xl font-semibold text-white mt-6">Important Disclaimer</h3>
                
                <p className="leading-relaxed">
                  While Kai strives to provide helpful and accurate advice, please note:
                </p>

                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Kai's recommendations are based on general business principles and may not account for all unique aspects of your specific situation.</li>
                  <li>All advice should be reviewed and validated by qualified professionals (accountants, lawyers, business consultants) before implementation.</li>
                  <li>Kai does not provide legal, financial, or professional advice. Consult appropriate experts for specialized guidance.</li>
                  <li>Business decisions and their outcomes are ultimately your responsibility.</li>
                  <li>DojoFlow and its creators are not liable for any business decisions made based on Kai's recommendations.</li>
                </ul>

                <p className="leading-relaxed font-semibold text-white mt-6">
                  By proceeding, you acknowledge that you understand Kai is an AI assistant and that you will use the provided guidance at your own discretion and risk.
                </p>
              </div>

              {/* Acceptance Checkbox */}
              <div className="space-y-2 pt-4 border-t border-gray-700">
                <div className="flex items-start gap-3">
                  <Checkbox 
                    id="accept-terms"
                    checked={disclaimerAccepted}
                    disabled={!disclaimerSpeechComplete}
                    onCheckedChange={(checked) => setDisclaimerAccepted(checked as boolean)}
                    className={`mt-1 transition-all duration-500 ${
                      disclaimerSpeechComplete 
                        ? 'border-red-500 data-[state=unchecked]:shadow-[0_0_15px_rgba(239,68,68,0.6)] data-[state=unchecked]:border-2 cursor-pointer' 
                        : 'opacity-40 cursor-not-allowed'
                    }`}
                    style={{
                      boxShadow: disclaimerSpeechComplete && !disclaimerAccepted ? '0 0 20px rgba(239, 68, 68, 0.8), 0 0 40px rgba(239, 68, 68, 0.4)' : undefined
                    }}
                  />
                  <label 
                    htmlFor="accept-terms" 
                    className={`text-sm leading-relaxed transition-opacity ${
                      disclaimerSpeechComplete ? 'text-gray-300 cursor-pointer' : 'text-gray-500 cursor-not-allowed opacity-60'
                    }`}
                  >
                    I have read and understand the terms and conditions. I acknowledge that Kai is an AI assistant 
                    and I will use the provided advice at my own discretion and risk.
                  </label>
                </div>
                {!disclaimerSpeechComplete && (
                  <p className="text-xs text-amber-400 italic flex items-center gap-2 ml-8">
                    <span className="animate-pulse">🎧</span>
                    Please listen to Kai's message before proceeding...
                  </p>
                )}
              </div>

              {/* Accept Button */}
              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleAcceptDisclaimer}
                  disabled={!disclaimerAccepted}
                  size="lg"
                  className="bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-12 py-6 text-lg font-semibold rounded-full"
                >
                  I Accept - Continue to Setup
                </Button>
              </div>
            </CardContent>
          </Card>
          </div>
        </div>
      )}

      {/* Voice Gender Selection Screen */}
      {showVoiceSelection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black px-8">
          {/* Kai Orb on Voice Selection Screen */}
          <div className="absolute top-8 right-8">
            <SetupKai 
              message={currentMessage} 
              isSpeaking={isSpeaking}
              bubblePosition="left"
              appearance={selectedAppearance}
            />
          </div>

          <div className="w-full max-w-5xl space-y-12">
            {/* Header */}
            <div className="text-center space-y-3">
              <h2 className="text-5xl font-bold text-white">Choose Voice</h2>
              <p className="text-gray-300 text-lg">Select your preferred voice for the AI assistant.</p>
            </div>

            {/* Voice Options */}
            <div className="grid grid-cols-2 gap-8 pt-4">
              {/* Soft / Warm Voice (Female) */}
              <button
                onClick={() => handleVoiceGenderSelect('female')}
                className={`group relative p-16 rounded-3xl border-2 transition-all duration-300 hover:scale-105 ${
                  selectedVoiceGender === 'female'
                    ? 'border-red-500 bg-gradient-to-br from-red-900/20 to-transparent shadow-[0_0_50px_rgba(239,68,68,0.6)]'
                    : 'border-gray-800 hover:border-red-400/50 bg-transparent'
                }`}
              >
                <div className="flex flex-col items-center gap-8">
                  {/* Waveform SVG with animation */}
                  <div className="relative w-full h-32 flex items-center justify-center">
                    <svg width="280" height="120" viewBox="0 0 280 120" className="overflow-visible">
                      <path
                        d="M 0 60 Q 35 30, 70 60 T 140 60 T 210 60 T 280 60"
                        stroke={selectedVoiceGender === 'female' ? '#ef4444' : '#f97316'}
                        strokeWidth="5"
                        fill="none"
                        strokeLinecap="round"
                        className={selectedVoiceGender === 'female' && isSpeaking ? 'animate-[wave_0.8s_ease-in-out_infinite]' : 'animate-[wave_2s_ease-in-out_infinite]'}
                        style={{
                          filter: selectedVoiceGender === 'female' ? 'drop-shadow(0 0 8px rgba(239, 68, 68, 0.8))' : 'none'
                        }}
                      />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-semibold text-white">Soft / Warm Voice</h3>
                  <p className="text-gray-300 text-base text-center">Gentle and friendly tone</p>
                  {selectedVoiceGender === 'female' && (
                    <div className="absolute top-6 right-6">
                      <CheckCircle2 className="h-10 w-10 text-red-500" />
                    </div>
                  )}
                </div>
              </button>

              {/* Clear / Confident Voice (Male) */}
              <button
                onClick={() => handleVoiceGenderSelect('male')}
                className={`group relative p-16 rounded-3xl border-2 transition-all duration-300 hover:scale-105 ${
                  selectedVoiceGender === 'male'
                    ? 'border-red-500 bg-gradient-to-br from-gray-800/20 to-transparent shadow-[0_0_50px_rgba(239,68,68,0.6)]'
                    : 'border-gray-800 hover:border-gray-500/50 bg-transparent'
                }`}
              >
                <div className="flex flex-col items-center gap-8">
                  {/* Waveform SVG - More jagged for male voice */}
                  <div className="relative w-full h-32 flex items-center justify-center">
                    <svg width="280" height="120" viewBox="0 0 280 120" className="overflow-visible">
                      <path
                        d="M 0 60 L 28 25 L 56 95 L 84 15 L 112 105 L 140 60 L 168 25 L 196 95 L 224 15 L 252 105 L 280 60"
                        stroke={selectedVoiceGender === 'male' ? '#ffffff' : '#94a3b8'}
                        strokeWidth="5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className={selectedVoiceGender === 'male' && isSpeaking ? 'animate-[zigzag_0.6s_ease-in-out_infinite]' : 'animate-[zigzag_2.5s_ease-in-out_infinite]'}
                        style={{
                          filter: selectedVoiceGender === 'male' ? 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.8))' : 'none'
                        }}
                      />
                    </svg>
                  </div>
                  <h3 className="text-3xl font-semibold text-white">Clear / Confident Voice</h3>
                  <p className="text-gray-300 text-base text-center">Bright and authoritative tone</p>
                  {selectedVoiceGender === 'male' && (
                    <div className="absolute top-6 right-6">
                      <CheckCircle2 className="h-10 w-10 text-red-500" />
                    </div>
                  )}
                </div>
              </button>
            </div>

            {/* Settings Note */}
            <div className="text-center pt-2">
              <p className="text-gray-400 text-sm">You can change this anytime in settings.</p>
            </div>

            {/* Continue Button */}
            <div className="flex justify-center pt-8">
              <Button
                onClick={handleContinueFromVoice}
                disabled={!selectedVoiceGender || !voiceSelectionSpeechComplete}
                size="lg"
                className="bg-red-500 hover:bg-red-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white px-16 py-7 text-xl font-semibold rounded-full"
              >
                Continue to Setup
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Avatar Naming Screen */}
      {showAvatarNaming && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black px-8">
          {/* Kai Orb on Avatar Naming Screen */}
          <div className="absolute top-8 right-8">
            <SetupKai 
              message={currentMessage} 
              isSpeaking={isSpeaking}
              bubblePosition="left"
              appearance={selectedAppearance}
            />
          </div>

          <div className="w-full max-w-3xl">
            <Step0AvatarName 
              onNext={handleAvatarNameSelect}
              onBack={handleBackFromAvatarNaming}
            />
          </div>
        </div>
      )}

      {/* Kai Appearance Selection Screen */}
      {showAppearanceSelection && (
        <Step0KaiAppearance 
          onNext={handleContinueFromAppearance}
          onAppearanceSelect={handleAppearanceSelect}
          avatarName={avatarName}
          speechComplete={appearanceSelectionSpeechComplete}
        />
      )}

      {/* Kai Orb - Top Right (during setup) */}
      {!showWelcome && !showDisclaimer && !showVoiceSelection && !showAvatarNaming && !showAppearanceSelection && (
        <SetupKai 
          message={currentMessage} 
          isSpeaking={isSpeaking}
          appearance={selectedAppearance}
        />
      )}

      {/* Mute/Unmute and Repeat Buttons - Top Left */}
      <div className="fixed top-8 left-8 z-50 flex gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleMute}
          className="bg-gray-900 border border-gray-700 hover:bg-gray-800 text-white"
          title={isMuted ? 'Unmute Kai' : 'Mute Kai'}
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5" />
          ) : (
            <Volume2 className="h-5 w-5" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={repeatMessage}
          className="bg-gray-900 border border-gray-700 hover:bg-gray-800 text-white"
          title="Repeat Kai's Message"
        >
          <RotateCcw className="h-5 w-5" />
        </Button>
      </div>

      {/* Horizontal Progress Bar - Top */}
      {!showWelcome && !showDisclaimer && !showVoiceSelection && !showAppearanceSelection && (
      <div className="pt-12 pb-8 px-8">
        <div className="max-w-4xl mx-auto">
          {/* Step Progress Circles */}
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div key={step.number} className="flex items-center flex-1">
                {/* Circle */}
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all cursor-pointer ${
                    currentStep > step.number
                      ? 'bg-red-500 border-red-500'
                      : currentStep === step.number
                      ? 'bg-white border-red-500'
                      : 'bg-transparent border-gray-600'
                  }`}
                  onClick={() => currentStep >= step.number && setCurrentStep(step.number)}
                >
                  {currentStep > step.number ? (
                    <CheckCircle2 className="h-5 w-5 text-white" />
                  ) : currentStep === step.number ? (
                    <Circle className="h-5 w-5 text-red-500 fill-red-500" />
                  ) : (
                    <span className="text-gray-500 text-sm font-medium">{step.number}</span>
                  )}
                </div>

                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 h-0.5 mx-2 bg-gray-700">
                    <div
                      className={`h-full transition-all ${
                        currentStep > step.number ? 'bg-red-500' : 'bg-transparent'
                      }`}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Step Counter */}
          <div className="text-center">
            <p className="text-gray-400 text-sm">
              Step {currentStep} of {totalSteps}
            </p>
          </div>
        </div>
      </div>
      )}

      {/* Main Content Card */}
      {!showWelcome && !showDisclaimer && !showVoiceSelection && !showAppearanceSelection && (
      <div className="px-8 pb-32">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-black border border-gray-800 shadow-2xl">
            <CardContent className="p-12">
              {renderCurrentStep()}
            </CardContent>
          </Card>
        </div>
      </div>
      )}

      {/* Bottom Navigation */}
      {!showWelcome && !showDisclaimer && !showVoiceSelection && !showAppearanceSelection && (
      <div className="fixed bottom-0 left-0 right-0 bg-black border-t border-gray-800 px-8 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Skip Button */}
          <Button
            variant="ghost"
            onClick={handleSkip}
            className="text-gray-400 hover:text-white hover:bg-gray-800"
            disabled={currentStep === totalSteps}
          >
            Skip for now
          </Button>

          {/* Continue Button */}
          <Button
            onClick={handleNext}
            disabled={currentStep === totalSteps}
            className="bg-red-600 hover:bg-red-700 text-white px-8 py-6 text-base font-medium shadow-lg shadow-red-500/30"
          >
            Continue to {steps[currentStep]?.nextTitle || 'Next'}
          </Button>
        </div>
      </div>
      )}
    </div>
  );
}
