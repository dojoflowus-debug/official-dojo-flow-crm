import React, { useState } from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEnvironment, environments, EnvironmentType, Environment } from '@/contexts/EnvironmentContext';

export function EnvironmentSelectorModal() {
  const { 
    currentEnvironment, 
    setEnvironment, 
    setDefaultEnvironment, 
    isModalOpen, 
    closeModal,
    defaultEnvironment 
  } = useEnvironment();
  
  const [selectedEnvironment, setSelectedEnvironment] = useState<Environment | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!isModalOpen) return null;

  const handleCardClick = (env: Environment) => {
    setSelectedEnvironment(env);
    setShowConfirmation(true);
  };

  const handlePreviewOnly = () => {
    if (selectedEnvironment) {
      setEnvironment(selectedEnvironment.id);
    }
    setShowConfirmation(false);
    setSelectedEnvironment(null);
    closeModal();
  };

  const handleSetAsDefault = () => {
    if (selectedEnvironment) {
      setDefaultEnvironment(selectedEnvironment.id);
    }
    setShowConfirmation(false);
    setSelectedEnvironment(null);
    closeModal();
  };

  const handleClose = () => {
    setShowConfirmation(false);
    setSelectedEnvironment(null);
    closeModal();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
      style={{ animation: 'fadeIn 0.3s ease-out' }}
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      />
      
      {/* Modal */}
      <div 
        className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden rounded-[24px] border border-white/10"
        style={{ 
          background: 'rgba(18, 18, 20, 0.85)',
          backdropFilter: 'blur(40px)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.05)',
          animation: 'modalSlideIn 0.4s ease-out'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF4C4C] to-[#FF8C8C] flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">Choose Your Environment</h2>
              <p className="text-sm text-white/50">Select a cinematic backdrop for your dojo</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-10 h-10 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-100px)]">
          {!showConfirmation ? (
            /* Environment Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {environments.map((env) => (
                <button
                  key={env.id}
                  onClick={() => handleCardClick(env)}
                  className="group relative overflow-hidden rounded-[18px] border border-white/10 transition-all duration-300 hover:scale-[1.03] hover:border-white/25 focus:outline-none focus:ring-2 focus:ring-[#FF4C4C]/50"
                  style={{
                    boxShadow: currentEnvironment.id === env.id 
                      ? '0 0 30px rgba(255, 76, 76, 0.3), 0 8px 32px rgba(0, 0, 0, 0.3)'
                      : '0 8px 32px rgba(0, 0, 0, 0.2)'
                  }}
                >
                  {/* Preview Background */}
                  <div 
                    className="aspect-[16/10] w-full transition-transform duration-500 group-hover:scale-110"
                    style={{ background: env.previewGradient }}
                  />
                  
                  {/* Overlay with info */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-4">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-white font-medium text-sm">{env.name}</h3>
                      {currentEnvironment.id === env.id && (
                        <span className="px-2 py-0.5 bg-[#FF4C4C] rounded-full text-[10px] font-medium text-white">
                          Active
                        </span>
                      )}
                      {defaultEnvironment === env.id && currentEnvironment.id !== env.id && (
                        <span className="px-2 py-0.5 bg-white/20 rounded-full text-[10px] font-medium text-white">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-white/60 text-xs">{env.description}</p>
                  </div>

                  {/* Hover glow effect */}
                  <div 
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at center, ${env.accentColor}20 0%, transparent 70%)`
                    }}
                  />
                </button>
              ))}
            </div>
          ) : (
            /* Confirmation Modal */
            <div 
              className="flex flex-col items-center justify-center py-8"
              style={{ animation: 'fadeIn 0.3s ease-out' }}
            >
              {/* Preview of selected environment */}
              <div 
                className="w-64 h-40 rounded-[18px] mb-6 overflow-hidden border border-white/20"
                style={{ 
                  background: selectedEnvironment?.previewGradient,
                  boxShadow: `0 0 40px ${selectedEnvironment?.accentColor}30`
                }}
              />
              
              <h3 className="text-xl font-semibold text-white mb-2">
                {selectedEnvironment?.name}
              </h3>
              <p className="text-white/60 text-sm mb-8 text-center max-w-md">
                Set this as your default environment?
              </p>

              <div className="flex gap-4">
                <Button
                  variant="outline"
                  onClick={handlePreviewOnly}
                  className="px-6 py-2 rounded-full border-white/20 text-white hover:bg-white/10 hover:border-white/30"
                >
                  Preview Only
                </Button>
                <Button
                  onClick={handleSetAsDefault}
                  className="px-6 py-2 rounded-full bg-[#FF4C4C] hover:bg-[#FF5E5E] text-white"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Set as Default
                </Button>
              </div>

              <button
                onClick={() => setShowConfirmation(false)}
                className="mt-6 text-white/50 hover:text-white text-sm transition-colors"
              >
                ← Back to environments
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes modalSlideIn {
          from { 
            opacity: 0; 
            transform: scale(0.95) translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: scale(1) translateY(0); 
          }
        }
      `}</style>
    </div>
  );
}
