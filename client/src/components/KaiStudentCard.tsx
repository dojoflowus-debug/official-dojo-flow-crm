import { User, Award, Calendar, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export interface KaiStudentCardData {
  id: number;
  fullName: string;
  photoUrl?: string | null;
  rank?: string | null;
  program?: string | null;
  status: 'Active' | 'Inactive' | 'On Hold';
  lastCheckIn?: string | null;
  attendance30Days: number;
  membershipPlan?: string | null;
  balanceDue?: number | null;
  alerts: string[];
}

interface KaiStudentCardProps {
  student: KaiStudentCardData;
  onClick?: () => void;
  isDark?: boolean;
  isCinematic?: boolean;
  isFocusMode?: boolean;
}

export function KaiStudentCard({ student, onClick, isDark, isCinematic, isFocusMode }: KaiStudentCardProps) {
  const isInteractive = !!onClick;
  const themeIsDark = isDark || isCinematic || isFocusMode;
  
  // Status badge color
  const getStatusColor = () => {
    switch (student.status) {
      case 'Active':
        return isCinematic || isFocusMode 
          ? 'bg-green-500/20 text-green-300 border-green-500/30'
          : themeIsDark 
            ? 'bg-green-500/20 text-green-300 border-green-500/30'
            : 'bg-green-100 text-green-700 border-green-200';
      case 'Inactive':
        return isCinematic || isFocusMode
          ? 'bg-gray-500/20 text-gray-300 border-gray-500/30'
          : themeIsDark
            ? 'bg-gray-500/20 text-gray-300 border-gray-500/30'
            : 'bg-gray-100 text-gray-700 border-gray-200';
      case 'On Hold':
        return isCinematic || isFocusMode
          ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
          : themeIsDark
            ? 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
            : 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default:
        return isCinematic || isFocusMode
          ? 'bg-gray-500/20 text-gray-300 border-gray-500/30'
          : themeIsDark
            ? 'bg-gray-500/20 text-gray-300 border-gray-500/30'
            : 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };
  
  // Get initials for avatar fallback
  const getInitials = () => {
    const names = student.fullName.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return student.fullName.substring(0, 2).toUpperCase();
  };
  
  // Format last check-in
  const formatLastCheckIn = () => {
    if (!student.lastCheckIn) return 'Never';
    try {
      return formatDistanceToNow(new Date(student.lastCheckIn), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };
  
  return (
    <div
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (isInteractive && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`
        relative overflow-hidden rounded-lg border
        ${isCinematic || isFocusMode 
          ? 'bg-white/5 border-white/10 backdrop-blur-sm' 
          : themeIsDark 
            ? 'bg-slate-800/50 border-slate-700/50' 
            : 'bg-white border-slate-200'
        }
        ${isInteractive ? 'cursor-pointer hover:shadow-lg transition-all duration-200' : ''}
        ${isInteractive && (isCinematic || isFocusMode) ? 'hover:bg-white/10 hover:border-white/20' : ''}
        ${isInteractive && themeIsDark && !(isCinematic || isFocusMode) ? 'hover:bg-slate-800/70 hover:border-slate-600' : ''}
        ${isInteractive && !themeIsDark ? 'hover:bg-slate-50 hover:border-slate-300 hover:shadow-md' : ''}
      `}
      style={{ maxWidth: '400px' }}
    >
      {/* Card content */}
      <div className="p-4">
        {/* Header: Avatar + Name + Status */}
        <div className="flex items-start gap-3 mb-3">
          {/* Avatar */}
          <div className="shrink-0">
            {student.photoUrl ? (
              <img
                src={student.photoUrl}
                alt={student.fullName}
                className="w-12 h-12 rounded-full object-cover ring-2 ring-offset-2 ring-offset-transparent ring-[#FF4C4C]/30"
              />
            ) : (
              <div 
                className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-sm ring-2 ring-offset-2 ring-offset-transparent ring-[#FF4C4C]/30 ${
                  isCinematic || isFocusMode
                    ? 'bg-gradient-to-br from-[#FF4C4C] to-[#FF6B6B] text-white'
                    : themeIsDark
                      ? 'bg-gradient-to-br from-slate-700 to-slate-600 text-white'
                      : 'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-700'
                }`}
              >
                {getInitials()}
              </div>
            )}
          </div>
          
          {/* Name + Status */}
          <div className="flex-1 min-w-0">
            <h3 
              className={`font-semibold text-base truncate ${
                isCinematic || isFocusMode
                  ? 'text-white'
                  : themeIsDark
                    ? 'text-white'
                    : 'text-slate-900'
              }`}
            >
              {student.fullName}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span 
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor()}`}
              >
                {student.status}
              </span>
            </div>
          </div>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          {/* Belt Rank */}
          {student.rank && (
            <div className="flex items-center gap-2">
              <Award className={`w-4 h-4 ${isCinematic || isFocusMode ? 'text-yellow-400' : themeIsDark ? 'text-yellow-400' : 'text-yellow-600'}`} />
              <div className="min-w-0">
                <p className={`text-xs ${isCinematic || isFocusMode ? 'text-white/60' : themeIsDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Belt
                </p>
                <p className={`text-sm font-medium truncate ${isCinematic || isFocusMode ? 'text-white' : themeIsDark ? 'text-white' : 'text-slate-900'}`}>
                  {student.rank}
                </p>
              </div>
            </div>
          )}
          
          {/* Program */}
          {student.program && (
            <div className="flex items-center gap-2">
              <User className={`w-4 h-4 ${isCinematic || isFocusMode ? 'text-blue-400' : themeIsDark ? 'text-blue-400' : 'text-blue-600'}`} />
              <div className="min-w-0">
                <p className={`text-xs ${isCinematic || isFocusMode ? 'text-white/60' : themeIsDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Program
                </p>
                <p className={`text-sm font-medium truncate ${isCinematic || isFocusMode ? 'text-white' : themeIsDark ? 'text-white' : 'text-slate-900'}`}>
                  {student.program}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {/* Attendance + Last Check-in */}
        <div className="flex items-center justify-between mb-3 pb-3 border-b" style={{
          borderColor: isCinematic || isFocusMode ? 'rgba(255,255,255,0.1)' : themeIsDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
        }}>
          <div>
            <p className={`text-xs ${isCinematic || isFocusMode ? 'text-white/60' : themeIsDark ? 'text-slate-400' : 'text-slate-500'}`}>
              30-day attendance
            </p>
            <p className={`text-lg font-bold ${isCinematic || isFocusMode ? 'text-[#FF4C4C]' : themeIsDark ? 'text-[#FF4C4C]' : 'text-[#FF4C4C]'}`}>
              {student.attendance30Days}
            </p>
          </div>
          <div className="text-right">
            <p className={`text-xs ${isCinematic || isFocusMode ? 'text-white/60' : themeIsDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Last check-in
            </p>
            <p className={`text-sm font-medium ${isCinematic || isFocusMode ? 'text-white' : themeIsDark ? 'text-white' : 'text-slate-900'}`}>
              {formatLastCheckIn()}
            </p>
          </div>
        </div>
        
        {/* Alerts */}
        {student.alerts.length > 0 && (
          <div className="space-y-1.5">
            {student.alerts.map((alert, idx) => (
              <div 
                key={idx}
                className={`flex items-center gap-2 px-2 py-1.5 rounded text-xs ${
                  isCinematic || isFocusMode
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : themeIsDark
                      ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                      : 'bg-red-50 text-red-700 border border-red-200'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="font-medium">{alert}</span>
              </div>
            ))}
          </div>
        )}
        
        {/* Click hint */}
        {isInteractive && (
          <div className={`mt-3 pt-3 border-t text-center text-xs ${
            isCinematic || isFocusMode
              ? 'text-white/50 border-white/10'
              : themeIsDark
                ? 'text-slate-400 border-slate-700'
                : 'text-slate-500 border-slate-200'
          }`}>
            Click to view full profile
          </div>
        )}
      </div>
    </div>
  );
}
