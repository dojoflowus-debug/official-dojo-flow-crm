import React, { useState, useEffect } from 'react';
import { X, User, Calendar, Award, Phone, Mail, MapPin, Clock, History, BarChart3 } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ManagementPanelProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: number | null;
  theme: 'light' | 'dark' | 'cinematic';
}

type TabType = 'details' | 'history' | 'analytics';

export function ManagementPanel({ isOpen, onClose, studentId, theme }: ManagementPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('details');
  
  const isDark = theme === 'dark' || theme === 'cinematic';

  // Fetch student details
  const { data: student, isLoading } = trpc.students.getById.useQuery(
    { id: studentId! },
    { enabled: isOpen && !!studentId }
  );

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'details', label: 'Details', icon: <User className="w-4 h-4" /> },
    { id: 'history', label: 'History', icon: <History className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className={`h-full flex flex-col border-l ${
        isDark ? 'bg-[#0A0A0B] border-white/10' : 'bg-white border-slate-200'
      }`}
      style={{ 
        minWidth: 0,
        minHeight: 0,
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${
        isDark ? 'border-white/10' : 'border-slate-200'
      }`}>
        <h2 className={`text-sm font-semibold ${
          isDark ? 'text-white' : 'text-slate-900'
        }`}>
          Management UI
        </h2>
        <button
          onClick={onClose}
          className={`p-1 rounded-sm transition-colors ${
            isDark 
              ? 'hover:bg-white/10 text-white/70 hover:text-white' 
              : 'hover:bg-slate-100 text-slate-500 hover:text-slate-700'
          }`}
          title="Close panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Tabs */}
      <div className={`flex border-b ${
        isDark ? 'border-white/10' : 'border-slate-200'
      }`}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? isDark
                  ? 'text-white border-b-2 border-[#ED393D]'
                  : 'text-slate-900 border-b-2 border-[#ED393D]'
                : isDark
                  ? 'text-white/50 hover:text-white/70 hover:bg-white/5'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {!studentId && (
          <div className={`flex items-center justify-center h-full p-8 ${
            isDark ? 'text-white/50' : 'text-slate-400'
          }`}>
            <div className="text-center">
              <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No student selected</p>
              <p className="text-xs mt-1">Click a student card to view details</p>
            </div>
          </div>
        )}

        {studentId && isLoading && (
          <div className={`flex items-center justify-center h-full ${
            isDark ? 'text-white/70' : 'text-slate-600'
          }`}>
            <p className="text-sm">Loading student details...</p>
          </div>
        )}

        {studentId && !isLoading && student && activeTab === 'details' && (
          <div className="p-4 space-y-6">
            {/* Student Photo & Name */}
            <div className="flex flex-col items-center text-center">
              {student.photoUrl ? (
                <img 
                  src={student.photoUrl} 
                  alt={`${student.firstName} ${student.lastName}`}
                  className="w-24 h-24 rounded-full object-cover mb-3 border-2 border-[#ED393D]"
                />
              ) : (
                <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-3 border-2 ${
                  isDark ? 'bg-white/10 border-white/20' : 'bg-slate-100 border-slate-200'
                }`}>
                  <User className={`w-12 h-12 ${isDark ? 'text-white/50' : 'text-slate-400'}`} />
                </div>
              )}
              <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {student.firstName} {student.lastName}
              </h3>
              {student.beltRank && (
                <Badge className="mt-2" variant="outline">
                  {student.beltRank}
                </Badge>
              )}
            </div>

            {/* Contact Information */}
            <div className="space-y-3">
              <h4 className={`text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-white/70' : 'text-slate-600'
              }`}>
                Contact
              </h4>
              {student.email && (
                <div className="flex items-center gap-2">
                  <Mail className={`w-4 h-4 ${isDark ? 'text-white/50' : 'text-slate-400'}`} />
                  <span className={`text-sm ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                    {student.email}
                  </span>
                </div>
              )}
              {student.phone && (
                <div className="flex items-center gap-2">
                  <Phone className={`w-4 h-4 ${isDark ? 'text-white/50' : 'text-slate-400'}`} />
                  <span className={`text-sm ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                    {student.phone}
                  </span>
                </div>
              )}
            </div>

            {/* Status & Dates */}
            <div className="space-y-3">
              <h4 className={`text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-white/70' : 'text-slate-600'
              }`}>
                Status
              </h4>
              <div className="flex items-center gap-2">
                <Award className={`w-4 h-4 ${isDark ? 'text-white/50' : 'text-slate-400'}`} />
                <span className={`text-sm ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                  {student.status || 'Active'}
                </span>
              </div>
              {student.dateOfBirth && (
                <div className="flex items-center gap-2">
                  <Calendar className={`w-4 h-4 ${isDark ? 'text-white/50' : 'text-slate-400'}`} />
                  <span className={`text-sm ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                    DOB: {new Date(student.dateOfBirth).toLocaleDateString()}
                  </span>
                </div>
              )}
              {student.startDate && (
                <div className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${isDark ? 'text-white/50' : 'text-slate-400'}`} />
                  <span className={`text-sm ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
                    Started: {new Date(student.startDate).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
        
        {studentId && activeTab === 'history' && (
          <div className={`p-4 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
            <p className="text-sm">Student history coming soon...</p>
          </div>
        )}
        
        {studentId && activeTab === 'analytics' && (
          <div className={`p-4 ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
            <p className="text-sm">Student analytics coming soon...</p>
          </div>
        )}
      </div>
    </div>
  );
}
