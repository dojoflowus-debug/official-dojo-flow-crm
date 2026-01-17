import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export interface InfoPanelData {
  studentCard?: {
    id: string;
    name: string;
    photo?: string;
    rank?: string;
    program?: string;
    attendance: number;
    absences: number;
    lastAbsence?: string;
    atRisk?: boolean;
    recommendations?: number;
  };
  summaryCards?: Array<{
    id: string;
    label: string;
    value: number;
    accent?: 'red' | 'orange' | 'yellow' | 'blue';
  }>;
  reportCards?: Array<{
    id: string;
    title: string;
    description: string;
    type: 'alert' | 'info' | 'warning';
  }>;
}

interface InfoPanelProps {
  open?: boolean;
  data?: InfoPanelData;
  isDark?: boolean;
  isCinematic?: boolean;
  onClose?: () => void;
}

const StudentCardPanel: React.FC<{ 
  student: InfoPanelData['studentCard'];
  isDark?: boolean;
}> = ({ student, isDark }) => {
  if (!student) return null;

  return (
    <div className={`rounded-lg p-4 mb-4 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-black/5 border border-black/10'}`}>
      <div className="flex gap-3 mb-4">
        {student.photo ? (
          <img 
            src={student.photo} 
            alt={student.name}
            className="w-16 h-16 rounded-lg object-cover"
          />
        ) : (
          <div className={`w-16 h-16 rounded-lg ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
        )}
        <div className="flex-1">
          <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{student.name}</h3>
          {student.rank && <p className={`text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>{student.rank}</p>}
          {student.program && <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>{student.program}</p>}
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className={`text-sm ${isDark ? 'text-white/70' : 'text-black/70'}`}>Attendance</span>
          <span className={`font-semibold ${student.atRisk ? 'text-red-400' : 'text-green-400'}`}>{student.attendance}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div 
            className={`h-2 rounded-full ${student.atRisk ? 'bg-red-500' : 'bg-green-500'}`}
            style={{ width: `${student.attendance}%` }}
          />
        </div>
        {student.absences > 0 && (
          <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>{student.absences} absences</p>
        )}
      </div>
    </div>
  );
};

const SummaryCard: React.FC<{
  card: InfoPanelData['summaryCards'][number];
  isDark?: boolean;
}> = ({ card, isDark }) => {
  const accentColors = {
    red: 'text-red-400',
    orange: 'text-orange-400',
    yellow: 'text-yellow-400',
    blue: 'text-blue-400',
  };

  return (
    <div className={`rounded-lg p-3 mb-3 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-black/5 border border-black/10'}`}>
      <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-white/60' : 'text-black/60'}`}>
        {card.label}
      </p>
      <p className={`text-2xl font-bold mt-1 ${accentColors[card.accent || 'blue']}`}>
        {card.value}
      </p>
    </div>
  );
};

const ReportCard: React.FC<{
  card: InfoPanelData['reportCards'][number];
  isDark?: boolean;
}> = ({ card, isDark }) => {
  const typeColors = {
    alert: 'border-red-500/30 bg-red-500/5',
    warning: 'border-yellow-500/30 bg-yellow-500/5',
    info: 'border-blue-500/30 bg-blue-500/5',
  };

  return (
    <div className={`rounded-lg p-3 mb-3 border ${typeColors[card.type]} ${isDark ? '' : ''}`}>
      <h4 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-black'}`}>{card.title}</h4>
      <p className={`text-xs mt-1 ${isDark ? 'text-white/60' : 'text-black/60'}`}>{card.description}</p>
    </div>
  );
};

export const InfoPanel: React.FC<InfoPanelProps> = ({
  open = false,
  data,
  isDark = true,
  isCinematic = false,
  onClose,
}) => {
  const hasData = data && (data.studentCard || data.summaryCards?.length || data.reportCards?.length);
  const isVisible = open && hasData;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, x: 400 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 400 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className={`fixed right-4 top-[var(--app-shell-header-height,80px)] bottom-[var(--app-shell-bottom-nav-height,80px)] w-[380px] max-w-[calc(100vw-32px)] z-40 flex flex-col ${
            isDark 
              ? 'bg-[#18181A]/95 border border-white/10' 
              : 'bg-white/95 border border-black/10'
          } backdrop-blur-md rounded-lg shadow-2xl overflow-hidden`}
        >
          {/* Header */}
          <div className={`flex items-center justify-between p-4 border-b ${isDark ? 'border-white/10' : 'border-black/10'}`}>
            <h2 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-black'}`}>
              KAI INTEL
            </h2>
            <button
              onClick={onClose}
              className={`p-1 rounded hover:bg-white/10 transition-colors ${isDark ? 'text-white/60 hover:text-white' : 'text-black/60 hover:text-black'}`}
              aria-label="Close panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {data?.studentCard && (
              <StudentCardPanel student={data.studentCard} isDark={isDark} />
            )}

            {data?.summaryCards && data.summaryCards.length > 0 && (
              <div>
                <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  Summary
                </h3>
                {data.summaryCards.map(card => (
                  <SummaryCard key={card.id} card={card} isDark={isDark} />
                ))}
              </div>
            )}

            {data?.reportCards && data.reportCards.length > 0 && (
              <div>
                <h3 className={`text-xs font-bold uppercase tracking-wider mb-3 ${isDark ? 'text-white/60' : 'text-black/60'}`}>
                  Reports
                </h3>
                {data.reportCards.map(card => (
                  <ReportCard key={card.id} card={card} isDark={isDark} />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default InfoPanel;
