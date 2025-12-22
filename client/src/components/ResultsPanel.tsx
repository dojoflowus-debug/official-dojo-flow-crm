/**
 * Results Panel Component
 * Right-side drawer for displaying student and lead data cards
 * Triggered by clicking chips in Kai Command chat
 */

import { X, User, Mail, Phone, MapPin, Calendar, Award, CreditCard } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc";

export type ResultsPanelData = 
  | { type: "student_card"; studentId: number }
  | { type: "student_list"; studentIds: number[] }
  | { type: "lead_card"; leadId: number }
  | { type: "lead_list"; leadIds: number[] }
  | null;

interface ResultsPanelProps {
  data: ResultsPanelData;
  onClose: () => void;
}

export function ResultsPanel({ data, onClose }: ResultsPanelProps) {
  if (!data) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[420px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-2xl z-[100] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {data.type === "student_card" && "Student Details"}
          {data.type === "student_list" && `Students (${data.studentIds.length})`}
          {data.type === "lead_card" && "Lead Details"}
          {data.type === "lead_list" && `Leads (${data.leadIds.length})`}
        </h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {data.type === "student_card" && <StudentCard studentId={data.studentId} />}
        {data.type === "student_list" && <StudentList studentIds={data.studentIds} />}
        {data.type === "lead_card" && <LeadCard leadId={data.leadId} />}
        {data.type === "lead_list" && <LeadList leadIds={data.leadIds} />}
      </div>
    </div>
  );
}

function StudentCard({ studentId }: { studentId: number }) {
  const { data: student, isLoading } = trpc.kaiData.getStudent.useQuery({ studentId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="text-center py-12 text-slate-500">
        Student not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <div className="flex items-start gap-4">
        {student.photoUrl ? (
          <img
            src={student.photoUrl}
            alt={`${student.firstName} ${student.lastName}`}
            className="w-20 h-20 rounded-full object-cover"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white text-2xl font-semibold">
            {student.firstName[0]}{student.lastName[0]}
          </div>
        )}
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            {student.firstName} {student.lastName}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              student.status === "Active" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
              student.status === "On Hold" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300" :
              "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}>
              {student.status}
            </span>
            {student.beltRank && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300">
                {student.beltRank}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          Contact Information
        </h4>
        {student.email && (
          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-4 h-4 text-slate-400" />
            <a href={`mailto:${student.email}`} className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400">
              {student.email}
            </a>
          </div>
        )}
        {student.phone && (
          <div className="flex items-center gap-3 text-sm">
            <Phone className="w-4 h-4 text-slate-400" />
            <a href={`tel:${student.phone}`} className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400">
              {student.phone}
            </a>
          </div>
        )}
        {(student.streetAddress || student.city) && (
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400">
              {student.streetAddress && `${student.streetAddress}, `}
              {student.city && `${student.city}, `}
              {student.state} {student.zipCode}
            </span>
          </div>
        )}
      </div>

      {/* Program Info */}
      {student.program && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Program
          </h4>
          <div className="flex items-center gap-3 text-sm">
            <Award className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400">{student.program}</span>
          </div>
        </div>
      )}

      {/* Membership Status */}
      {student.membershipStatus && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Membership
          </h4>
          <div className="flex items-center gap-3 text-sm">
            <CreditCard className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400">{student.membershipStatus}</span>
          </div>
        </div>
      )}

      {/* Guardian Info */}
      {student.guardianName && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Guardian
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3 text-sm">
              <User className="w-4 h-4 text-slate-400" />
              <span className="text-slate-600 dark:text-slate-400">
                {student.guardianName}
                {student.guardianRelationship && ` (${student.guardianRelationship})`}
              </span>
            </div>
            {student.guardianPhone && (
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-slate-400" />
                <a href={`tel:${student.guardianPhone}`} className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400">
                  {student.guardianPhone}
                </a>
              </div>
            )}
            {student.guardianEmail && (
              <div className="flex items-center gap-3 text-sm">
                <Mail className="w-4 h-4 text-slate-400" />
                <a href={`mailto:${student.guardianEmail}`} className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400">
                  {student.guardianEmail}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StudentList({ studentIds }: { studentIds: number[] }) {
  return (
    <div className="space-y-4">
      {studentIds.map((id) => (
        <StudentCard key={id} studentId={id} />
      ))}
    </div>
  );
}

function LeadCard({ leadId }: { leadId: number }) {
  const { data: lead, isLoading } = trpc.kaiData.getLead.useQuery({ leadId });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="text-center py-12 text-slate-500">
        Lead not found
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Section */}
      <div className="flex items-start gap-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-2xl font-semibold">
          {lead.firstName[0]}{lead.lastName[0]}
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
            {lead.firstName} {lead.lastName}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              lead.status === "New Lead" ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300" :
              lead.status === "Enrolled" ? "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300" :
              "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
            }`}>
              {lead.status}
            </span>
            {lead.source && (
              <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300">
                {lead.source}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Contact Info */}
      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
          Contact Information
        </h4>
        {lead.email && (
          <div className="flex items-center gap-3 text-sm">
            <Mail className="w-4 h-4 text-slate-400" />
            <a href={`mailto:${lead.email}`} className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400">
              {lead.email}
            </a>
          </div>
        )}
        {lead.phone && (
          <div className="flex items-center gap-3 text-sm">
            <Phone className="w-4 h-4 text-slate-400" />
            <a href={`tel:${lead.phone}`} className="text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400">
              {lead.phone}
            </a>
          </div>
        )}
        {(lead.address || lead.city) && (
          <div className="flex items-center gap-3 text-sm">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="text-slate-600 dark:text-slate-400">
              {lead.address && `${lead.address}, `}
              {lead.city && `${lead.city}, `}
              {lead.state} {lead.zipCode}
            </span>
          </div>
        )}
      </div>

      {/* Message */}
      {lead.message && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Message
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
            {lead.message}
          </p>
        </div>
      )}

      {/* Notes */}
      {lead.notes && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
            Notes
          </h4>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            {lead.notes}
          </p>
        </div>
      )}
    </div>
  );
}

function LeadList({ leadIds }: { leadIds: number[] }) {
  return (
    <div className="space-y-4">
      {leadIds.map((id) => (
        <LeadCard key={id} leadId={id} />
      ))}
    </div>
  );
}
