import { Mail, Phone, MapPin, X, Edit, FileText, Calendar, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Student {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  date_of_birth?: string;
  belt_rank: string;
  status: string;
  membership_status: string;
  street_address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  photo_url?: string;
  program?: string;
  guardian_name?: string;
  guardian_phone?: string;
  guardian_email?: string;
}

interface StudentCardOverlayProps {
  student: Student;
  onClose: () => void;
  onViewNotes?: () => void;
  onEditProfile?: () => void;
  isDarkMode?: boolean;
}

/**
 * StudentCardOverlay - Apple-like floating sheet card for full map mode
 * Positioned bottom-center with max-width constraint
 */
export const StudentCardOverlay: React.FC<StudentCardOverlayProps> = ({
  student,
  onClose,
  onViewNotes,
  onEditProfile,
  isDarkMode = false,
}) => {
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-500';
      case 'on hold':
        return 'bg-yellow-500';
      default:
        return 'bg-red-500';
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'on hold':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-red-100 text-red-700';
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        bottom: '24px',
        width: 'min(920px, calc(100vw - 32px))',
        pointerEvents: 'auto',
      }}
    >
      <div
        className={`
          rounded-[24px] shadow-2xl overflow-hidden
          ${isDarkMode ? 'bg-[#1C1C1E]' : 'bg-white'}
          backdrop-blur-xl
        `}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 12px 24px -8px rgba(0, 0, 0, 0.2)',
        }}
      >
        {/* Card Content - Horizontal Layout */}
        <div className="flex items-stretch">
          {/* Left Section - Avatar and Basic Info */}
          <div className={`flex-shrink-0 p-6 flex items-center gap-5 border-r ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
            {/* Avatar */}
            <div className="relative">
              {student.photo_url ? (
                <img
                  src={student.photo_url}
                  alt={`${student.first_name} ${student.last_name}`}
                  className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className={`w-20 h-20 rounded-full flex items-center justify-center border-4 border-white shadow-lg ${isDarkMode ? 'bg-slate-700' : 'bg-gradient-to-br from-slate-200 to-slate-300'}`}>
                  <span className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-600'}`}>
                    {student.first_name[0]}{student.last_name[0]}
                  </span>
                </div>
              )}
              <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${getStatusColor(student.status)}`} />
            </div>

            {/* Name and Program */}
            <div>
              <h2 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {student.first_name} {student.last_name}
              </h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {student.program || 'General Program'}
              </p>
              {/* Status Badges */}
              <div className="flex flex-wrap gap-2 mt-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle(student.status)}`}>
                  {student.status}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                  {student.belt_rank || 'White Belt'}
                </span>
              </div>
            </div>
          </div>

          {/* Middle Section - Contact Info */}
          <div className={`flex-1 p-6 flex flex-col justify-center gap-3 border-r ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
            {student.email && (
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
                  <Mail className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                </div>
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{student.email}</span>
              </div>
            )}
            {student.phone && (
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-green-500/20' : 'bg-green-50'}`}>
                  <Phone className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                </div>
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{student.phone}</span>
              </div>
            )}
            {(student.street_address || student.city) && (
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-purple-500/20' : 'bg-purple-50'}`}>
                  <MapPin className={`h-4 w-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`} />
                </div>
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'} truncate max-w-[200px]`}>
                  {[student.city, student.state].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Right Section - Actions */}
          <div className="flex-shrink-0 p-6 flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onViewNotes}
              className={`h-10 px-4 rounded-full ${isDarkMode ? 'border-white/20 text-white hover:bg-white/10' : ''}`}
            >
              <FileText className="h-4 w-4 mr-2" />
              Notes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onEditProfile}
              className={`h-10 px-4 rounded-full ${isDarkMode ? 'border-white/20 text-white hover:bg-white/10' : ''}`}
            >
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Button>
            <button
              onClick={onClose}
              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                isDarkMode 
                  ? 'bg-white/10 hover:bg-white/20 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentCardOverlay;
