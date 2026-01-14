import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, X } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface BulkMessageSelectorProps {
  messages: Message[];
  conversationId: number;
  onBulkDelete: (messageIds: number[]) => Promise<void>;
  isDark?: boolean;
  isCinematic?: boolean;
}

/**
 * BulkMessageSelector component for selecting and deleting multiple messages
 * 
 * Features:
 * - Toggle selection mode with button
 * - Select/deselect individual messages
 * - Select all / deselect all
 * - Bulk delete with confirmation dialog
 * - Visual feedback for selected messages
 * - Keyboard shortcuts (Cmd/Ctrl+A for select all)
 */
export function BulkMessageSelector({
  messages,
  conversationId,
  onBulkDelete,
  isDark = true,
  isCinematic = false,
}: BulkMessageSelectorProps) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Handle keyboard shortcut for select all
  useEffect(() => {
    if (!selectionMode) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      if ((isMac && e.metaKey && e.key === 'a') || (!isMac && e.ctrlKey && e.key === 'a')) {
        e.preventDefault();
        if (selectedIds.size === messages.length) {
          setSelectedIds(new Set());
        } else {
          setSelectedIds(new Set(messages.map(m => m.id)));
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectionMode, selectedIds, messages]);

  const toggleMessageSelection = (messageId: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(messageId)) {
      newSelected.delete(messageId);
    } else {
      newSelected.add(messageId);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === messages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(messages.map(m => m.id)));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;

    setIsDeleting(true);
    try {
      const messageIds = Array.from(selectedIds)
        .map(id => parseInt(id))
        .filter(id => !isNaN(id));

      if (messageIds.length === 0) {
        toast.error('No valid messages selected');
        return;
      }

      await onBulkDelete(messageIds);
      
      // Clear selection after successful deletion
      setSelectedIds(new Set());
      setSelectionMode(false);
      setShowConfirmDialog(false);
      
      toast.success(`Deleted ${messageIds.length} message${messageIds.length > 1 ? 's' : ''}`);
    } catch (error: any) {
      console.error('Failed to delete messages:', error);
      toast.error(error?.message || 'Failed to delete messages');
    } finally {
      setIsDeleting(false);
    }
  };

  // Exit selection mode when no messages are selected
  useEffect(() => {
    if (selectionMode && selectedIds.size === 0 && messages.length > 0) {
      // Keep selection mode on even if no messages are selected
    }
  }, [selectedIds, selectionMode, messages]);

  return {
    selectionMode,
    setSelectionMode,
    selectedIds,
    toggleMessageSelection,
    toggleSelectAll,
    showConfirmDialog,
    setShowConfirmDialog,
    handleBulkDelete,
    isDeleting,
    SelectionToolbar: () => (
      selectionMode && (
        <div
          className={`flex items-center justify-between p-4 border-b ${
            isCinematic
              ? 'bg-white/5 border-white/10'
              : isDark
              ? 'bg-zinc-900 border-zinc-800'
              : 'bg-slate-100 border-slate-200'
          }`}
        >
          <div className="flex items-center gap-3">
            <Checkbox
              checked={selectedIds.size === messages.length && messages.length > 0}
              onCheckedChange={toggleSelectAll}
              className="cursor-pointer"
            />
            <span
              className={`text-sm font-semibold ${
                isCinematic
                  ? 'text-white'
                  : isDark
                  ? 'text-white'
                  : 'text-slate-900'
              }`}
            >
              {selectedIds.size} selected
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={() => {
                if (selectedIds.size > 0) {
                  setShowConfirmDialog(true);
                }
              }}
              disabled={selectedIds.size === 0 || isDeleting}
              variant="destructive"
              size="sm"
              className={`${
                isCinematic
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>

            <Button
              onClick={() => {
                setSelectionMode(false);
                setSelectedIds(new Set());
              }}
              variant="ghost"
              size="sm"
              className={
                isCinematic
                  ? 'text-white/70 hover:text-white hover:bg-white/10'
                  : isDark
                  ? 'text-white/70 hover:text-white hover:bg-white/10'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )
    ),
    MessageCheckbox: ({ messageId }: { messageId: string }) => (
      selectionMode && (
        <Checkbox
          checked={selectedIds.has(messageId)}
          onCheckedChange={() => toggleMessageSelection(messageId)}
          className="cursor-pointer"
        />
      )
    ),
    ConfirmDialog: () => (
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent
          className={
            isCinematic
              ? 'bg-black/80 border border-white/20 text-white'
              : isDark
              ? 'bg-zinc-900 border-zinc-800 text-white'
              : 'bg-white border-slate-200 text-slate-900'
          }
        >
          <AlertDialogHeader>
            <AlertDialogTitle className={isCinematic ? 'text-white' : ''}>
              Delete {selectedIds.size} message{selectedIds.size > 1 ? 's' : ''}?
            </AlertDialogTitle>
            <AlertDialogDescription
              className={
                isCinematic
                  ? 'text-white/70'
                  : isDark
                  ? 'text-white/70'
                  : 'text-slate-600'
              }
            >
              This action cannot be undone. The selected messages will be permanently deleted from this conversation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel
              disabled={isDeleting}
              className={
                isCinematic
                  ? 'bg-white/10 text-white hover:bg-white/20 border-white/20'
                  : isDark
                  ? 'bg-zinc-800 text-white hover:bg-zinc-700 border-zinc-700'
                  : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
              }
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    ),
  };
}
