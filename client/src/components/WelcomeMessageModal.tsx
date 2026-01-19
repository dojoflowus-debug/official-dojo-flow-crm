import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface WelcomeMessage {
  id: number;
  title: string;
  message: string;
  subMessage?: string;
  ctaText: string;
  ctaUrl?: string;
  imageUrl?: string;
}

interface WelcomeMessageModalProps {
  isOpen: boolean;
  welcomeMessage: WelcomeMessage | null;
  onClose: () => void;
  onCtaClick?: () => void;
}

export function WelcomeMessageModal({
  isOpen,
  welcomeMessage,
  onClose,
  onCtaClick,
}: WelcomeMessageModalProps) {
  if (!welcomeMessage) return null;

  const handleCtaClick = () => {
    if (onCtaClick) {
      onCtaClick();
    } else if (welcomeMessage.ctaUrl) {
      window.location.href = welcomeMessage.ctaUrl;
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-gradient-to-br from-[#1a1a1b] to-[#0f0f10] border border-[#2a2a2c] shadow-2xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1 hover:bg-[#2a2a2c] rounded-lg transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-gray-400" />
        </button>

        {/* Header Image */}
        {welcomeMessage.imageUrl && (
          <div className="relative w-full h-48 -mx-6 -mt-6 mb-4 overflow-hidden rounded-t-lg">
            <img
              src={welcomeMessage.imageUrl}
              alt="Welcome"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1a1a1b]/80" />
          </div>
        )}

        {/* Content */}
        <div className="space-y-4">
          {/* Title */}
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {welcomeMessage.title}
            </h2>
            {welcomeMessage.subMessage && (
              <p className="text-gray-400 text-sm">
                {welcomeMessage.subMessage}
              </p>
            )}
          </div>

          {/* Message */}
          <div className="bg-[#2a2a2c]/50 rounded-lg p-4 border border-[#3a3a3c]">
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {welcomeMessage.message}
            </p>
          </div>

          {/* CTA Button */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleCtaClick}
              className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 rounded-lg transition-all"
            >
              {welcomeMessage.ctaText}
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="px-6 border-[#3a3a3c] text-gray-300 hover:bg-[#2a2a2c]"
            >
              Skip
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 pt-4 border-t border-[#2a2a2c]">
          Welcome to DojoFlow! This message appears once for new users.
        </div>
      </DialogContent>
    </Dialog>
  );
}
