import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RotateCcw, Edit3 } from 'lucide-react';

interface IndustryMessagePanelProps {
  industry: string;
  defaultMessage: string;
  onMessageChange?: (message: string) => void;
}

export default function IndustryMessagePanel({
  industry,
  defaultMessage,
  onMessageChange
}: IndustryMessagePanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [customMessage, setCustomMessage] = useState(defaultMessage);

  // Update customMessage when defaultMessage prop changes (industry selection changes)
  useEffect(() => {
    console.log('[IndustryMessagePanel] Industry changed:', industry);
    console.log('[IndustryMessagePanel] New default message:', defaultMessage);
    console.log('[IndustryMessagePanel] Current custom message:', customMessage);
    // Force update the message even if component is remounting
    setCustomMessage(defaultMessage);
    setIsEditing(false); // Reset editing mode when industry changes
  }, [defaultMessage]); // Only depend on defaultMessage, not industry

  const handleReset = () => {
    setCustomMessage(defaultMessage);
    setIsEditing(false);
    if (onMessageChange) {
      onMessageChange(defaultMessage);
    }
  };

  const handleMessageChange = (value: string) => {
    setCustomMessage(value);
    if (onMessageChange) {
      onMessageChange(value);
    }
  };

  return (
    <div className="animate-in fade-in duration-300 slide-in-from-bottom-4">
      <div className="bg-[#1a1a1a] border border-gray-800 rounded-lg p-6 shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">
            Configuration Message
          </h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className="text-gray-400 hover:text-white"
            >
              <Edit3 className="h-4 w-4 mr-2" />
              {isEditing ? 'View' : 'Edit'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-gray-400 hover:text-white"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>

        {/* Message Content */}
        {isEditing ? (
          <Textarea
            value={customMessage}
            onChange={(e) => handleMessageChange(e.target.value)}
            className="min-h-[120px] bg-black/50 border-gray-700 text-white focus:border-red-500 focus:ring-red-500/20 resize-none"
            placeholder="Enter your custom configuration message..."
          />
        ) : (
          <div className="bg-black/30 rounded-md p-4 border border-gray-800">
            <p className="text-gray-300 leading-relaxed whitespace-pre-wrap">
              {customMessage}
            </p>
          </div>
        )}

        {/* Info Text */}
        <p className="text-xs text-gray-500 mt-3">
          This message explains how Kai will configure your {industry} setup. You can customize it to match your specific needs.
        </p>
      </div>
    </div>
  );
}
