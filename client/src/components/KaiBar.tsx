import React, { useRef } from 'react';
import { useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Paperclip, AtSign, Mic, Send, X, Image, File, Loader2, RefreshCw } from 'lucide-react';
import { MentionInput } from '@/components/MentionInput';
import { useTheme } from '@/contexts/ThemeContext';
import { useFocusMode } from '@/contexts/FocusModeContext';
import { useKaiBar } from '@/contexts/KaiBarContext';

const BOTTOM_NAV_HEIGHT = 72; // pixels
const KAI_BAR_GAP = 12; // pixels between KaiBar and BottomNav

export function KaiBar() {
  const [location] = useLocation();
  const { theme } = useTheme();
  const { isFocusMode } = useFocusMode();
  const {
    messageInput,
    setMessageInput,
    attachments,
    removeAttachment,
    isLoading,
    expandedInput,
    setExpandedInput,
    onSendMessage,
  } = useKaiBar();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const isDark = theme === 'dark';
  const isCinematic = theme === 'cinematic';

  // Only render on /kai route
  if (location !== '/kai') {
    return null;
  }

  // Don't render in focus mode
  if (isFocusMode) {
    return null;
  }

  const handleSendMessage = async () => {
    if (onSendMessage) {
      await onSendMessage(messageInput, attachments);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    // File handling logic would go here
    // This is a placeholder for now
  };

  const isImageFile = (fileType: string): boolean => {
    return fileType.startsWith('image/');
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <>
      {/* Attachment Preview Area */}
      {attachments.length > 0 && (
        <div
          style={{
            position: 'fixed',
            left: '16px',
            right: '16px',
            bottom: `calc(${BOTTOM_NAV_HEIGHT + KAI_BAR_GAP}px + 60px)`,
            zIndex: 1949,
            maxWidth: '1100px',
            margin: '0 auto',
            pointerEvents: 'auto',
          }}
        >
          <div
            className={`flex flex-wrap gap-2 p-3 rounded-xl ${
              isCinematic || isFocusMode
                ? 'bg-black/60 border border-white/20'
                : isDark
                ? 'bg-[#1A1A1C] border border-white/5'
                : 'bg-slate-50 border border-slate-200'
            }`}
          >
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className={`relative group flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                  attachment.error
                    ? 'bg-red-500/20 border border-red-500/50'
                    : isCinematic || isFocusMode
                    ? 'bg-white/10 border border-white/20'
                    : isDark
                    ? 'bg-white/5 border border-white/10'
                    : 'bg-white border border-slate-200 shadow-sm'
                }`}
              >
                {/* File icon or thumbnail */}
                {isImageFile(attachment.fileType) && attachment.url ? (
                  <img
                    src={attachment.url}
                    alt={attachment.fileName}
                    className="w-10 h-10 rounded object-cover"
                  />
                ) : (
                  <div
                    className={`w-10 h-10 rounded flex items-center justify-center ${
                      isCinematic || isFocusMode
                        ? 'bg-white/10'
                        : isDark
                        ? 'bg-white/5'
                        : 'bg-slate-100'
                    }`}
                  >
                    {isImageFile(attachment.fileType) ? (
                      <Image
                        className={`w-5 h-5 ${
                          isCinematic || isFocusMode
                            ? 'text-white/70'
                            : isDark
                            ? 'text-white/50'
                            : 'text-slate-400'
                        }`}
                      />
                    ) : (
                      <File
                        className={`w-5 h-5 ${
                          isCinematic || isFocusMode
                            ? 'text-white/70'
                            : isDark
                            ? 'text-white/50'
                            : 'text-slate-400'
                        }`}
                      />
                    )}
                  </div>
                )}

                {/* File info */}
                <div className="flex-1 min-w-0 max-w-[120px]">
                  <p
                    className={`text-xs font-medium truncate ${
                      isCinematic || isFocusMode
                        ? 'text-white'
                        : isDark
                        ? 'text-white'
                        : 'text-slate-700'
                    }`}
                  >
                    {attachment.fileName}
                  </p>
                  <p
                    className={`text-[10px] ${
                      isCinematic || isFocusMode
                        ? 'text-white/50'
                        : isDark
                        ? 'text-white/40'
                        : 'text-slate-400'
                    }`}
                  >
                    {formatFileSize(attachment.fileSize)}
                  </p>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => removeAttachment(attachment.id)}
                  className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity ${
                    isCinematic || isFocusMode
                      ? 'bg-white/20 hover:bg-white/30 text-white'
                      : isDark
                      ? 'bg-white/10 hover:bg-white/20 text-white'
                      : 'bg-slate-200 hover:bg-slate-300 text-slate-600'
                  }`}
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KaiBar - Fixed at app root level */}
      <div
        style={{
          position: 'fixed',
          left: '16px',
          right: '16px',
          bottom: `calc(${BOTTOM_NAV_HEIGHT + KAI_BAR_GAP}px)`,
          maxWidth: '1100px',
          width: 'auto',
          margin: '0 auto',
          zIndex: 1950,
          pointerEvents: 'auto',
          padding: 0,
          background: 'transparent',
        }}
      >
        <div className="relative transition-all duration-500 flex justify-center">
          {/* Expand/Collapse Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setExpandedInput(!expandedInput)}
            className={`absolute -top-3 left-1/2 -translate-x-1/2 h-6 w-6 rounded-full z-10 shadow-sm ${
              isCinematic
                ? 'bg-black/80 hover:bg-black/90 text-white'
                : isDark
                ? 'bg-[#202022] hover:bg-[#2A2A2D] text-white'
                : 'bg-slate-100 hover:bg-slate-200'
            }`}
          >
            {/* Chevron icon would go here */}
          </Button>

          {/* Hidden file input */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv,text/plain,.xlsx,.xls,.csv"
            multiple
            className="hidden"
          />

          {/* Input container - Clean floating pill with no outer container background */}
          <div
            className="kaiBar flex items-center gap-2 transition-all duration-300 rounded-full p-3 relative z-10 border border-white/30 focus-within:kai-command-bar-focus"
            style={{
              background: isDark || isCinematic ? 'rgba(0, 0, 0, 0.85)' : 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              width: '100%',
              maxWidth: '100%',
              transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
              borderColor: isDark || isCinematic ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Attachment Button */}
            <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 rounded-full ${
                isCinematic
                  ? '[&_svg]:fill-white text-white hover:text-white hover:bg-white/20'
                  : isDark
                  ? 'text-[rgba(255,255,255,0.45)] hover:text-white hover:bg-[rgba(255,255,255,0.08)]'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
              title="Attach file (images, PDFs, documents)"
              onClick={() => fileInputRef.current?.click()}
            >
              <Paperclip className="w-5 h-5" style={isCinematic ? { color: '#FFFFFF' } : {}} />
            </Button>

            {/* @ Mention Button */}
            <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 rounded-full ${
                isCinematic
                  ? '[&_svg]:fill-white text-white hover:text-white hover:bg-white/20'
                  : isDark
                  ? 'text-[rgba(255,255,255,0.45)] hover:text-white hover:bg-[rgba(255,255,255,0.08)]'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
              title="Mention someone"
              onClick={() => {
                setMessageInput(prev => prev + '@');
              }}
            >
              <AtSign className="w-5 h-5" style={isCinematic ? { color: '#FFFFFF' } : {}} />
            </Button>

            {/* Message Input */}
            <MentionInput
              value={messageInput}
              onChange={setMessageInput}
              onSubmit={(value, mentions) => {
                handleSendMessage();
              }}
              placeholder="Issue directive... Type @ to assign"
              theme={isCinematic ? 'cinematic' : isDark ? 'dark' : 'light'}
              variant="apple"
            />

            {/* Mic Button */}
            <Button
              variant="ghost"
              size="icon"
              className={`h-9 w-9 rounded-full ${
                isCinematic
                  ? '[&_svg]:fill-white text-white hover:text-white hover:bg-white/20'
                  : isDark
                  ? 'text-[rgba(255,255,255,0.45)] hover:text-white hover:bg-[rgba(255,255,255,0.08)]'
                  : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Mic className="w-5 h-5" style={isCinematic ? { color: '#FFFFFF' } : {}} />
            </Button>

            {/* Send Button */}
            <Button
              size="icon"
              className="h-9 w-9 bg-[#FF4C4C] hover:bg-[#FF5E5E] text-white rounded-full shadow-sm"
              onClick={handleSendMessage}
              disabled={(!messageInput.trim() && attachments.length === 0) || isLoading || attachments.some(att => att.uploading)}
            >
              <Send className="w-4 h-4" style={{ color: '#FFFFFF' }} />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
