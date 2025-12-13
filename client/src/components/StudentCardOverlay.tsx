import { useState } from 'react';
import { Mail, Phone, MapPin, X, Edit, FileText, Calendar, User, CreditCard, Users } from 'lucide-react';
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
  guardian_relationship?: string;
  notes?: string;
  tags?: string[];
}

interface StudentCardOverlayProps {
  student: Student;
  onClose: () => void;
  onViewNotes?: () => void;
  onEditProfile?: () => void;
  isDarkMode?: boolean;
}

// Format date for display
function formatDate(dateString?: string): string {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return 'N/A';
  }
}

// Calculate age from date of birth
function calculateAge(dateOfBirth?: string): number | null {
  if (!dateOfBirth) return null;
  try {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    return age;
  } catch {
    return null;
  }
}

/**
 * StudentCardOverlay - Apple-like floating sheet card for full map mode
 * With Profile and Details tabs
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
  const [activeTab, setActiveTab] = useState<'profile' | 'details'>('profile');

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

  const getMembershipBadgeStyle = (membership: string) => {
    switch (membership?.toLowerCase()) {
      case 'premium':
        return isDarkMode ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-700';
      case 'trial':
        return isDarkMode ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700';
      case 'expired':
        return isDarkMode ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-700';
      default:
        return isDarkMode ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-700';
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

  const age = calculateAge(student.date_of_birth);
  const hasGuardian = student.guardian_name || student.guardian_phone || student.guardian_email;

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

        {/* Header with Tabs */}
        <div className={`flex items-center justify-between px-4 md:px-6 py-3 border-b ${isDarkMode ? 'border-white/10' : 'border-gray-100'}`}>
          {/* Tab Toggle */}
          <div className={`flex p-1 rounded-full ${isDarkMode ? 'bg-white/10' : 'bg-gray-100'}`}>
            <button
              onClick={(e) => { e.stopPropagation(); setActiveTab('profile'); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeTab === 'profile'
                  ? isDarkMode ? 'bg-white/20 text-white' : 'bg-white text-gray-900 shadow-sm'
                  : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Profile
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setActiveTab('details'); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                activeTab === 'details'
                  ? isDarkMode ? 'bg-white/20 text-white' : 'bg-white text-gray-900 shadow-sm'
                  : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Details
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => handleButtonClick(e, onViewNotes)}
              className={`h-8 px-3 rounded-full text-xs ${isDarkMode ? 'border-white/20 text-white hover:bg-white/10' : ''}`}
            >
              <FileText className="h-3.5 w-3.5 mr-1" />
              Notes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={(e) => handleButtonClick(e, onEditProfile)}
              className={`h-8 px-3 rounded-full text-xs ${isDarkMode ? 'border-white/20 text-white hover:bg-white/10' : ''}`}
            >
              <Edit className="h-3.5 w-3.5 mr-1" />
              Edit
            </Button>
            <button
              onClick={(e) => handleButtonClick(e, onClose)}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                isDarkMode 
                  ? 'bg-white/10 hover:bg-white/20 text-white' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="overflow-hidden">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="flex flex-col md:flex-row md:items-stretch animate-in fade-in duration-200">
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
              </div>

              {/* Middle Section - Contact Info */}
              <div className={`flex-1 p-4 md:p-6 flex flex-col justify-center gap-3 ${isDarkMode ? '' : ''}`}>
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
            </div>
          )}

          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="p-4 md:p-6 animate-in fade-in duration-200">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {/* Personal Info */}
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <User className={`h-4 w-4 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
                    <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Personal Info</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Date of Birth</span>
                      <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {formatDate(student.date_of_birth)}
                      </span>
                    </div>
                    {age !== null && (
                      <div className="flex justify-between">
                        <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Age</span>
                        <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                          {age} years old
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Belt Rank</span>
                      <span className={`text-xs font-medium ${isDarkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                        {student.belt_rank || 'White Belt'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Program</span>
                      <span className={`text-xs font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {student.program || 'General'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Membership Info */}
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className={`h-4 w-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`} />
                    <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Membership</h3>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Status</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeStyle(student.status)}`}>
                        {student.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Membership</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getMembershipBadgeStyle(student.membership_status)}`}>
                        {student.membership_status || 'Standard'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Address Info */}
                <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className={`h-4 w-4 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
                    <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Address</h3>
                  </div>
                  <div className="space-y-1">
                    {student.street_address && (
                      <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {student.street_address}
                      </p>
                    )}
                    <p className={`text-xs ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {[student.city, student.state, student.zip_code].filter(Boolean).join(', ') || 'No address on file'}
                    </p>
                  </div>
                </div>

                {/* Guardian Info - Only show if minor or has guardian */}
                {hasGuardian && (
                  <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'} md:col-span-2 lg:col-span-3`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Users className={`h-4 w-4 ${isDarkMode ? 'text-orange-400' : 'text-orange-500'}`} />
                      <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Guardian / Emergency Contact</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {student.guardian_name && (
                        <div>
                          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Name</span>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {student.guardian_name}
                            {student.guardian_relationship && (
                              <span className={`ml-1 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                ({student.guardian_relationship})
                              </span>
                            )}
                          </p>
                        </div>
                      )}
                      {student.guardian_phone && (
                        <div>
                          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Phone</span>
                          <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {student.guardian_phone}
                          </p>
                        </div>
                      )}
                      {student.guardian_email && (
                        <div>
                          <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email</span>
                          <p className={`text-sm font-medium truncate ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {student.guardian_email}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Tags */}
                {student.tags && student.tags.length > 0 && (
                  <div className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-50'} md:col-span-2 lg:col-span-3`}>
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className={`h-4 w-4 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-500'}`} />
                      <h3 className={`text-sm font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Tags</h3>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {student.tags.map((tag, index) => (
                        <span
                          key={index}
                          className={`px-2 py-1 rounded-full text-xs font-medium ${isDarkMode ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-100 text-indigo-700'}`}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentCardOverlay;
