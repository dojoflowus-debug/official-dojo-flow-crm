import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { APP_LOGO, APP_TITLE } from "@/const";
import { MapPin, ChevronRight, Star, Clock, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { trpc } from "@/lib/trpc";

// School type definition
interface School {
  id: number;
  name: string;
  city: string;
  state: string;
  logoUrl?: string;
  lastAccessed?: Date;
  isPinned?: boolean;
}

// Apple Wallet-style School Card
function SchoolCard({ 
  school, 
  onSelect,
  isPinned = false
}: { 
  school: School; 
  onSelect: () => void;
  isPinned?: boolean;
}) {
  return (
    <div 
      className="group relative bg-white rounded-3xl p-6 shadow-[0_2px_20px_rgba(0,0,0,0.06)] border border-gray-100/50 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.12)] hover:-translate-y-1 cursor-pointer"
      onClick={onSelect}
    >
      {/* Pinned Indicator */}
      {isPinned && (
        <div className="absolute top-4 right-4">
          <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
        </div>
      )}

      {/* School Logo */}
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center mb-4 overflow-hidden shadow-inner">
        {school.logoUrl ? (
          <img 
            src={school.logoUrl} 
            alt={school.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-3xl font-bold text-gray-400">
            {school.name.charAt(0)}
          </div>
        )}
      </div>

      {/* School Info */}
      <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-red-600 transition-colors">
        {school.name}
      </h3>
      
      <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-4">
        <MapPin className="h-3.5 w-3.5" />
        <span>{school.city}, {school.state}</span>
      </div>

      {/* Last Accessed */}
      {school.lastAccessed && (
        <div className="flex items-center gap-1.5 text-gray-400 text-xs mb-4">
          <Clock className="h-3 w-3" />
          <span>Last visited {new Date(school.lastAccessed).toLocaleDateString()}</span>
        </div>
      )}

      {/* Enter Button */}
      <Button 
        className="w-full h-12 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold shadow-lg shadow-gray-900/20 transition-all group-hover:shadow-xl group-hover:shadow-gray-900/30"
      >
        Enter School
        <ChevronRight className="h-4 w-4 ml-2" />
      </Button>
    </div>
  );
}

/**
 * Select School Page - For students enrolled in multiple schools
 * Apple Wallet-style card grid with hover effects
 */
export default function SelectSchool() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [studentId, setStudentId] = useState<number | null>(null);

  useEffect(() => {
    const isLoggedIn = localStorage.getItem("student_logged_in");
    const storedStudentId = localStorage.getItem("student_id");
    
    if (!isLoggedIn) {
      navigate("/student-login");
      return;
    }
    
    if (storedStudentId) {
      setStudentId(parseInt(storedStudentId, 10));
    }
    
    setTimeout(() => setMounted(true), 100);
  }, [navigate]);

  // Fetch student's schools
  const { data: schoolsData, isLoading } = trpc.studentPortal.getStudentSchools.useQuery(
    { studentId: studentId! },
    { enabled: !!studentId }
  );

  const handleSelectSchool = (schoolId: number) => {
    // Store selected school
    localStorage.setItem("selected_school_id", schoolId.toString());
    navigate("/student-dashboard");
  };

  // Demo schools for fallback
  const demoSchools: School[] = [
    {
      id: 1,
      name: "Dragon's Den Martial Arts",
      city: "Austin",
      state: "TX",
      lastAccessed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      isPinned: true
    },
    {
      id: 2,
      name: "Tiger Academy",
      city: "Houston",
      state: "TX",
      lastAccessed: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    },
    {
      id: 3,
      name: "Phoenix Dojo",
      city: "Dallas",
      state: "TX"
    }
  ];

  const schools = schoolsData?.schools || demoSchools;

  // Sort schools: pinned first, then by last accessed
  const sortedSchools = [...schools].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    if (a.lastAccessed && b.lastAccessed) {
      return new Date(b.lastAccessed).getTime() - new Date(a.lastAccessed).getTime();
    }
    return 0;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-red-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading your schools...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {APP_LOGO && (
              <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-auto" />
            )}
            <span className="text-lg font-semibold text-gray-900">{APP_TITLE}</span>
          </div>
          <Button
            variant="ghost"
            onClick={() => {
              localStorage.removeItem("student_logged_in");
              localStorage.removeItem("student_id");
              navigate("/student-login");
            }}
            className="text-gray-500 hover:text-gray-900"
          >
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 max-w-5xl">
        {/* Welcome Section */}
        <div className={`text-center mb-12 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-3">
            Select Your School
          </h1>
          <p className="text-xl text-gray-500">
            Choose which dojo you'd like to access today
          </p>
        </div>

        {/* Schools Grid */}
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-700 delay-100 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {sortedSchools.map((school, index) => (
            <div 
              key={school.id}
              style={{ animationDelay: `${index * 100}ms` }}
              className="animate-in fade-in slide-in-from-bottom-4"
            >
              <SchoolCard
                school={school}
                onSelect={() => handleSelectSchool(school.id)}
                isPinned={school.isPinned}
              />
            </div>
          ))}
        </div>

        {/* Empty State */}
        {schools.length === 0 && (
          <div className="text-center py-16">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-6">
              <MapPin className="h-10 w-10 text-gray-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">No Schools Found</h2>
            <p className="text-gray-500 mb-6">You're not enrolled in any schools yet.</p>
            <Button 
              onClick={() => navigate("/student-onboarding")}
              className="bg-red-500 hover:bg-red-600 text-white rounded-xl px-8 h-12"
            >
              Find a School
            </Button>
          </div>
        )}

        {/* Join Another School Link */}
        {schools.length > 0 && (
          <div className={`text-center mt-12 transition-all duration-700 delay-200 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <Button
              variant="ghost"
              onClick={() => navigate("/student-onboarding")}
              className="text-gray-400 hover:text-gray-600"
            >
              + Join Another School
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
