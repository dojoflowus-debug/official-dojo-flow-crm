import { Mail, Phone, MapPin, X, Edit, FileText } from 'lucide-react';
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
 * Responsive: becomes bottom sheet on mobile
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
        return isDarkMode ? 'bg-green-500/20 text-green-400' : 'bg-green-100 text-green-700';
      case 'on hold':
        return isDarkMode ? 'bg-yellow-500/20 text-yellow-400' : 'bg-yellow-100 text-yellow-700';
      default:
        return isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700';
    }
  };

  // Stop propagation to prevent Leaflet from intercepting clicks
  const handleCardClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleButtonClick = (e: React.MouseEvent, callback?: () => void) => {
    e.stopPropagation();
    callback?.();
  };

  return (
    <div
      className="fixed left-0 right-0 bottom-0 md:absolute md:left-1/2 md:-translate-x-1/2 md:bottom-6 md:right-auto"
      onClick={handleCardClick}
      style={{
        width: '100%',
        maxWidth: 'min(920px, calc(100vw - 32px))',
        margin: '0 auto',
        pointerEvents: 'auto',
        zIndex: 9999,
      }}
    >
      <div
        className={`
          rounded-t-[24px] md:rounded-[24px] shadow-2xl overflow-hidden
          ${isDarkMode ? 'bg-[#1C1C1E]/95 backdrop-blur-xl' : 'bg-white/95 backdrop-blur-xl'}
          animate-in slide-in-from-bottom-4 duration-300
        `}
        style={{
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.2), 0 -2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        {/* Drag Handle - Mobile only */}
        <div className="md:hidden flex justify-center pt-3 pb-1">
          <div className={`w-10 h-1 rounded-full ${isDarkMode ? 'bg-white/20' : 'bg-gray-300'}`} />
        </div>

        {/* Card Content */}
        <div className="flex flex-col md:flex-row md:items-stretch">
          {/* Left Section - Avatar and Basic Info */}
          <div className={`flex-shrink-0 p-4 md:p-6 flex items-center gap-4 md:border-r ${isDarkMode ? 'md:border-white/10' : 'md:border-gray-100'}`}>
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              {student.photo_url ? (
                <img
                  src={student.photo_url}
                  alt={`${student.first_name} ${student.last_name}`}
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-3 border-white shadow-lg"
                />
              ) : (
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center border-3 border-white shadow-lg ${isDarkMode ? 'bg-slate-700' : 'bg-gradient-to-br from-slate-200 to-slate-300'}`}>
                  <span className={`text-xl md:text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-slate-600'}`}>
                    {student.first_name[0]}{student.last_name[0]}
                  </span>
                </div>
              )}
              <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 md:w-5 md:h-5 rounded-full border-2 border-white ${getStatusColor(student.status)}`} />
            </div>

            {/* Name and Program */}
            <div className="flex-1 min-w-0">
              <h2 className={`text-lg md:text-xl font-bold truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                {student.first_name} {student.last_name}
              </h2>
              <p className={`text-sm truncate ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {student.program || 'General Program'}
              </p>
              {/* Status Badges */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle(student.status)}`}>
                  {student.status}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${isDarkMode ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                  {student.belt_rank || 'White Belt'}
                </span>
              </div>
            </div>

            {/* Close Button - Mobile */}
            <button
              onClick={(e) => handleButtonClick(e, onClose)}
              className={`md:hidden w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0 ${
                isDarkMode 
                  ? 'bg-white/10 hover:bg-white/20 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Middle Section - Contact Info */}
          <div className={`hidden md:flex flex-1 p-6 flex-col justify-center gap-3 border-r ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
            {student.email && (
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
                  <Mail className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                </div>
                <span className={`text-sm truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{student.email}</span>
              </div>
            )}
            {student.phone && (
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-green-500/20' : 'bg-green-50'}`}>
                  <Phone className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                </div>
                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>{student.phone}</span>
              </div>
            )}
            {(student.street_address || student.city) && (
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isDarkMode ? 'bg-purple-500/20' : 'bg-purple-50'}`}>
                  <MapPin className={`h-4 w-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`} />
                </div>
                <span className={`text-sm truncate ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {[student.city, student.state].filter(Boolean).join(', ')}
                </span>
              </div>
            )}
          </div>

          {/* Right Section - Actions */}
          <div className="flex-shrink-0 p-4 md:p-6 flex items-center justify-center gap-2 md:gap-3 border-t md:border-t-0 ${isDarkMode ? 'border-white/10' : 'border-gray-100'}">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => handleButtonClick(e, onViewNotes)}
              className={`h-9 md:h-10 px-3 md:px-4 rounded-full text-sm ${isDarkMode ? 'border-white/20 text-white hover:bg-white/10' : ''}`}
            >
              <FileText className="h-4 w-4 mr-1.5" />
              Notes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => handleButtonClick(e, onEditProfile)}
              className={`h-9 md:h-10 px-3 md:px-4 rounded-full text-sm ${isDarkMode ? 'border-white/20 text-white hover:bg-white/10' : ''}`}
            >
              <Edit className="h-4 w-4 mr-1.5" />
              Edit
            </Button>
            {/* Close Button - Desktop */}
            <button
              onClick={(e) => handleButtonClick(e, onClose)}
              className={`hidden md:flex w-10 h-10 rounded-full items-center justify-center transition-colors ${
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
