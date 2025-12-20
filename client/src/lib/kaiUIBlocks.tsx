/**
 * Kai UI Blocks Parser
 * Detects and extracts structured UI blocks from Kai responses
 * Supports student cards, lead cards, and clickable chips
 */

import { ReactNode } from "react";

export interface StudentChip {
  type: "student_chip";
  studentId: number;
  label: string;
}

export interface LeadChip {
  type: "lead_chip";
  leadId: number;
  label: string;
}

export interface StudentListBlock {
  type: "student_list";
  studentIds: number[];
  summary: string;
}

export interface LeadListBlock {
  type: "lead_list";
  leadIds: number[];
  summary: string;
}

export type UIBlock = StudentChip | LeadChip | StudentListBlock | LeadListBlock;

export interface ParsedMessage {
  text: string;
  blocks: UIBlock[];
}

/**
 * Parse Kai message content for UI blocks
 * Detects patterns like:
 * - [STUDENT:123:John Smith] → Student chip
 * - [LEAD:456:Jane Doe] → Lead chip
 * - [STUDENT_LIST:123,456,789:3 students found] → Student list
 * - [LEAD_LIST:111,222:2 new leads] → Lead list
 */
export function parseKaiMessage(content: string): ParsedMessage {
  const blocks: UIBlock[] = [];
  let text = content;

  // Pattern: [STUDENT:123:John Smith]
  const studentChipRegex = /\[STUDENT:(\d+):([^\]]+)\]/g;
  let match;
  while ((match = studentChipRegex.exec(content)) !== null) {
    const [fullMatch, studentId, label] = match;
    blocks.push({
      type: "student_chip",
      studentId: parseInt(studentId),
      label: label.trim(),
    });
    // Replace with placeholder for rendering
    text = text.replace(fullMatch, `__STUDENT_CHIP_${blocks.length - 1}__`);
  }

  // Pattern: [LEAD:456:Jane Doe]
  const leadChipRegex = /\[LEAD:(\d+):([^\]]+)\]/g;
  while ((match = leadChipRegex.exec(content)) !== null) {
    const [fullMatch, leadId, label] = match;
    blocks.push({
      type: "lead_chip",
      leadId: parseInt(leadId),
      label: label.trim(),
    });
    text = text.replace(fullMatch, `__LEAD_CHIP_${blocks.length - 1}__`);
  }

  // Pattern: [STUDENT_LIST:123,456,789:3 students found]
  const studentListRegex = /\[STUDENT_LIST:([0-9,]+):([^\]]+)\]/g;
  while ((match = studentListRegex.exec(content)) !== null) {
    const [fullMatch, idsStr, summary] = match;
    const studentIds = idsStr.split(",").map((id) => parseInt(id.trim()));
    blocks.push({
      type: "student_list",
      studentIds,
      summary: summary.trim(),
    });
    text = text.replace(fullMatch, `__STUDENT_LIST_${blocks.length - 1}__`);
  }

  // Pattern: [LEAD_LIST:111,222:2 new leads]
  const leadListRegex = /\[LEAD_LIST:([0-9,]+):([^\]]+)\]/g;
  while ((match = leadListRegex.exec(content)) !== null) {
    const [fullMatch, idsStr, summary] = match;
    const leadIds = idsStr.split(",").map((id) => parseInt(id.trim()));
    blocks.push({
      type: "lead_list",
      leadIds,
      summary: summary.trim(),
    });
    text = text.replace(fullMatch, `__LEAD_LIST_${blocks.length - 1}__`);
  }

  return { text, blocks };
}

/**
 * Render parsed message with UI blocks as clickable chips
 */
export function renderParsedMessage(
  parsed: ParsedMessage,
  onStudentClick: (studentId: number) => void,
  onLeadClick: (leadId: number) => void,
  onStudentListClick: (studentIds: number[]) => void,
  onLeadListClick: (leadIds: number[]) => void,
  isDark: boolean = false,
  isCinematic: boolean = false
): ReactNode {
  const { text, blocks } = parsed;

  // Split text by placeholders and reconstruct with chips
  const parts: ReactNode[] = [];
  let currentText = text;
  let lastIndex = 0;

  // Find all placeholders in order
  const placeholderRegex = /__(STUDENT_CHIP|LEAD_CHIP|STUDENT_LIST|LEAD_LIST)_(\d+)__/g;
  let placeholderMatch;

  while ((placeholderMatch = placeholderRegex.exec(text)) !== null) {
    const [fullMatch, blockType, blockIndex] = placeholderMatch;
    const idx = parseInt(blockIndex);
    const block = blocks[idx];

    // Add text before placeholder
    if (placeholderMatch.index > lastIndex) {
      parts.push(text.slice(lastIndex, placeholderMatch.index));
    }

    // Add chip component
    if (block.type === "student_chip") {
      parts.push(
        <button
          key={`chip-${idx}`}
          onClick={() => onStudentClick(block.studentId)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-all hover:scale-105 ${
            isCinematic
              ? "bg-gradient-to-r from-blue-500/30 to-blue-600/30 text-blue-200 border border-blue-400/40 hover:border-blue-300/60 shadow-lg"
              : isDark
              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30"
              : "bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-current"></span>
          {block.label}
        </button>
      );
    } else if (block.type === "lead_chip") {
      parts.push(
        <button
          key={`chip-${idx}`}
          onClick={() => onLeadClick(block.leadId)}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium transition-all hover:scale-105 ${
            isCinematic
              ? "bg-gradient-to-r from-purple-500/30 to-purple-600/30 text-purple-200 border border-purple-400/40 hover:border-purple-300/60 shadow-lg"
              : isDark
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30"
              : "bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-current"></span>
          {block.label}
        </button>
      );
    } else if (block.type === "student_list") {
      parts.push(
        <button
          key={`chip-${idx}`}
          onClick={() => onStudentListClick(block.studentIds)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 ${
            isCinematic
              ? "bg-gradient-to-r from-blue-500/30 to-blue-600/30 text-blue-200 border border-blue-400/40 hover:border-blue-300/60 shadow-lg"
              : isDark
              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30 hover:bg-blue-500/30"
              : "bg-blue-100 text-blue-700 border border-blue-200 hover:bg-blue-200"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          {block.summary}
        </button>
      );
    } else if (block.type === "lead_list") {
      parts.push(
        <button
          key={`chip-${idx}`}
          onClick={() => onLeadListClick(block.leadIds)}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105 ${
            isCinematic
              ? "bg-gradient-to-r from-purple-500/30 to-purple-600/30 text-purple-200 border border-purple-400/40 hover:border-purple-300/60 shadow-lg"
              : isDark
              ? "bg-purple-500/20 text-purple-300 border border-purple-500/30 hover:bg-purple-500/30"
              : "bg-purple-100 text-purple-700 border border-purple-200 hover:bg-purple-200"
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          {block.summary}
        </button>
      );
    }

    lastIndex = placeholderMatch.index + fullMatch.length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return <>{parts}</>;
}
