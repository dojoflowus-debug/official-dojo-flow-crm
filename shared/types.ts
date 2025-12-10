/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

// Belt ranks
export type BeltRank = "white" | "yellow" | "orange" | "green" | "blue" | "purple" | "brown" | "red" | "black";

// Student status
export type StudentStatus = "active" | "inactive" | "trial" | "frozen";

// ABC Category for student engagement
export type ABCCategory = "A" | "B" | "C";

// Payment status
export type PaymentStatus = "current" | "late" | "overdue";

// Lead stages for kanban pipeline
export type LeadStage = 
  | "new"
  | "contacted"
  | "appointment_set"
  | "trial_scheduled"
  | "trial_completed"
  | "proposal_sent"
  | "negotiation"
  | "won"
  | "lost";

// Belt color mapping
export const BELT_COLORS: Record<BeltRank, { bg: string; text: string; border: string }> = {
  white: { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-200" },
  yellow: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" },
  orange: { bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-200" },
  green: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
  blue: { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200" },
  purple: { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200" },
  brown: { bg: "bg-amber-800/10", text: "text-amber-800", border: "border-amber-800/20" },
  red: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
  black: { bg: "bg-gray-900", text: "text-white", border: "border-gray-900" },
};

// ABC Category colors
export const ABC_COLORS: Record<ABCCategory, { bg: string; text: string; border: string }> = {
  A: { bg: "bg-green-100", text: "text-green-700", border: "border-green-200" },
  B: { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-200" },
  C: { bg: "bg-red-100", text: "text-red-700", border: "border-red-200" },
};

// Lead stage configuration for kanban
export const LEAD_STAGES: { id: LeadStage; label: string; color: string }[] = [
  { id: "new", label: "New", color: "bg-blue-500" },
  { id: "contacted", label: "Contacted", color: "bg-purple-500" },
  { id: "appointment_set", label: "Appointment Set", color: "bg-indigo-500" },
  { id: "trial_scheduled", label: "Trial Scheduled", color: "bg-cyan-500" },
  { id: "trial_completed", label: "Trial Completed", color: "bg-teal-500" },
  { id: "proposal_sent", label: "Proposal Sent", color: "bg-amber-500" },
  { id: "negotiation", label: "Negotiation", color: "bg-orange-500" },
  { id: "won", label: "Won", color: "bg-green-500" },
  { id: "lost", label: "Lost", color: "bg-red-500" },
];
