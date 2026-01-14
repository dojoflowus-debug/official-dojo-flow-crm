import { useState } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDangerous?: boolean;
  requiresTyping?: boolean;
  typingPrompt?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmationModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDangerous = false,
  requiresTyping = false,
  typingPrompt = 'Type CONFIRM to proceed',
  onConfirm,
  onCancel,
}: ConfirmationModalProps) {
  const [typingValue, setTypingValue] = useState('');
  const isConfirmDisabled = requiresTyping && typingValue !== 'CONFIRM';

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (requiresTyping && typingValue !== 'CONFIRM') return;
    setTypingValue('');
    onConfirm();
  };

  const handleCancel = () => {
    setTypingValue('');
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            {isDangerous && <AlertCircle className="w-5 h-5 text-destructive" />}
            <h2 className="text-lg font-semibold">{title}</h2>
          </div>
          <button
            onClick={handleCancel}
            className="p-1 hover:bg-accent rounded-lg transition-colors"
          >
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">{message}</p>

          {requiresTyping && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {typingPrompt}
              </label>
              <input
                type="text"
                value={typingValue}
                onChange={(e) => setTypingValue(e.target.value.toUpperCase())}
                placeholder="Type here..."
                className="w-full px-3 py-2 border border-border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-border flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-md hover:bg-muted/80 transition-colors font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isConfirmDisabled}
            className={`flex-1 px-4 py-2 rounded-md font-medium transition-colors ${
              isDangerous
                ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50'
                : 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
