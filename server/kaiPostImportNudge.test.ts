import { describe, it, expect, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Unit tests for the post-import schedule nudge logic
// These test the message construction and quick-reply action handling
// without needing a full React environment.
// ---------------------------------------------------------------------------

interface QuickReply {
  label: string;
  action: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  quickReplies?: QuickReply[];
}

// Replicate the nudge message construction logic from KaiCommand.tsx
function buildImportSuccessMessages(insertedCount: number, errors: string[]): Message[] {
  const now = new Date();

  const successMessage: Message = {
    id: `student-import-done-test`,
    role: 'assistant',
    content: `**${insertedCount} student${insertedCount !== 1 ? 's' : ''} imported** successfully!${
      errors.length > 0
        ? `\n\n**${errors.length} row${errors.length !== 1 ? 's' : ''} skipped:**\n${errors.slice(0, 5).join('\n')}`
        : ''
    }\n\nYour roster is live — head to the **Students** page to review it.`,
    timestamp: now,
  };

  const nudgeMessage: Message = {
    id: `schedule-nudge-test`,
    role: 'assistant',
    content: `Want to set up your **class schedule** next? Drop an Excel, CSV, or PDF file into the chat bar and I'll import it automatically — or I can walk you through creating classes one by one.`,
    timestamp: now,
    quickReplies: [
      { label: '📅 Yes, import my schedule', action: 'open_schedule_import' },
      { label: 'Skip for now', action: 'dismiss_nudge' },
    ],
  };

  return [successMessage, nudgeMessage];
}

// Replicate the dismiss_nudge handler logic
function handleDismissNudge(messages: Message[], nudgeMessageId: string): Message[] {
  const withRepliesRemoved = messages.map(m =>
    m.id === nudgeMessageId ? { ...m, quickReplies: [] } : m
  );
  const skipAck: Message = {
    id: `skip-ack-test`,
    role: 'assistant',
    content: 'No problem! You can set up your class schedule anytime by dropping a file into the chat bar or visiting the **Classes** page.',
    timestamp: new Date(),
  };
  return [...withRepliesRemoved, skipAck];
}

describe('Kai post-import schedule nudge', () => {
  it('produces two messages after a successful import', () => {
    const messages = buildImportSuccessMessages(5, []);
    expect(messages).toHaveLength(2);
  });

  it('first message confirms the correct import count (singular)', () => {
    const [success] = buildImportSuccessMessages(1, []);
    expect(success.content).toContain('1 student imported');
    expect(success.content).not.toContain('students imported');
  });

  it('first message confirms the correct import count (plural)', () => {
    const [success] = buildImportSuccessMessages(12, []);
    expect(success.content).toContain('12 students imported');
  });

  it('first message includes skipped row count when errors exist', () => {
    const [success] = buildImportSuccessMessages(8, ['Row 3: missing name', 'Row 7: invalid email']);
    expect(success.content).toContain('2 rows skipped');
    expect(success.content).toContain('Row 3: missing name');
  });

  it('first message has no error section when no errors', () => {
    const [success] = buildImportSuccessMessages(3, []);
    expect(success.content).not.toContain('skipped');
  });

  it('nudge message has two quick-reply buttons', () => {
    const [, nudge] = buildImportSuccessMessages(5, []);
    expect(nudge.quickReplies).toHaveLength(2);
    expect(nudge.quickReplies![0].action).toBe('open_schedule_import');
    expect(nudge.quickReplies![1].action).toBe('dismiss_nudge');
  });

  it('nudge message is from the assistant role', () => {
    const [, nudge] = buildImportSuccessMessages(5, []);
    expect(nudge.role).toBe('assistant');
  });

  it('dismiss_nudge clears quick replies from the nudge message', () => {
    const messages = buildImportSuccessMessages(5, []);
    const nudgeId = messages[1].id;
    const updated = handleDismissNudge(messages, nudgeId);
    const nudge = updated.find(m => m.id === nudgeId);
    expect(nudge?.quickReplies).toHaveLength(0);
  });

  it('dismiss_nudge appends a skip acknowledgement message', () => {
    const messages = buildImportSuccessMessages(5, []);
    const nudgeId = messages[1].id;
    const updated = handleDismissNudge(messages, nudgeId);
    const ack = updated[updated.length - 1];
    expect(ack.content).toContain('No problem');
    expect(ack.content).toContain('Classes');
  });

  it('dismiss_nudge does not remove other messages', () => {
    const messages = buildImportSuccessMessages(5, []);
    const nudgeId = messages[1].id;
    const updated = handleDismissNudge(messages, nudgeId);
    // Original 2 messages + 1 ack = 3
    expect(updated).toHaveLength(3);
  });
});
