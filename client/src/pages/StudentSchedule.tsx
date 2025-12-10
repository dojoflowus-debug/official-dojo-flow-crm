import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_LOGO, APP_TITLE } from "@/const";
import { 
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  User,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useLocation } from "wouter";

/**
 * Student Schedule - View class schedule and attendance
 */
export default function StudentSchedule() {
  const [, setLocation] = useLocation();
  const [currentWeek, setCurrentWeek] = useState(0);
  const [schedule, setSchedule] = useState<any[]>([]);

  useEffect(() => {
    // Check if student is logged in
    const isLoggedIn = localStorage.getItem("student_logged_in");
    if (!isLoggedIn) {
      setLocation("/student-login");
      return;
    }

    // TODO: Fetch schedule from backend API
    // Mock data for now
    setSchedule([
      {
        id: 1,
        day: "Monday",
        date: "Oct 27",
        classes: [
          {
            id: 1,
            name: "Kids Karate - Beginners",
            time: "4:00 PM - 5:00 PM",
            instructor: "John Smith",
            location: "Main Dojo",
            status: "enrolled"
          }
        ]
      },
      {
        id: 2,
        day: "Tuesday",
        date: "Oct 28",
        classes: []
      },
      {
        id: 3,
        day: "Wednesday",
        date: "Oct 29",
        classes: [
          {
            id: 2,
            name: "Kids Karate - Beginners",
            time: "4:00 PM - 5:00 PM",
            instructor: "John Smith",
            location: "Main Dojo",
            status: "enrolled"
          }
        ]
      },
      {
        id: 4,
        day: "Thursday",
        date: "Oct 30",
        classes: []
      },
      {
        id: 5,
        day: "Friday",
        date: "Oct 31",
        classes: [
          {
            id: 3,
            name: "Kids Karate - Beginners",
            time: "4:00 PM - 5:00 PM",
            instructor: "John Smith",
            location: "Main Dojo",
            status: "enrolled"
          }
        ]
      },
      {
        id: 6,
        day: "Saturday",
        date: "Nov 1",
        classes: [
          {
            id: 4,
            name: "Open Mat Session",
            time: "10:00 AM - 12:00 PM",
            instructor: "All Instructors",
            location: "Main Dojo",
            status: "available"
          }
        ]
      },
      {
        id: 7,
        day: "Sunday",
        date: "Nov 2",
        classes: []
      }
    ]);
  }, [setLocation]);

  const handlePreviousWeek = () => {
    setCurrentWeek(currentWeek - 1);
  };

  const handleNextWeek = () => {
    setCurrentWeek(currentWeek + 1);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "enrolled":
        return <Badge className="bg-green-600 text-white border-0">Enrolled</Badge>;
      case "available":
        return <Badge className="bg-blue-600 text-white border-0">Available</Badge>;
      case "completed":
        return <Badge className="bg-slate-600 text-white border-0">Completed</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => setLocation("/student-dashboard")}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">My Schedule</h1>
              <p className="text-xs text-slate-400">View your class schedule</p>
            </div>
          </div>
          
          {APP_LOGO && (
            <img 
              src={APP_LOGO} 
              alt={APP_TITLE} 
              className="h-10 w-auto"
            />
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Week Navigation */}
          <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 p-6 mb-6">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={handlePreviousWeek}
                className="text-slate-400 hover:text-white"
              >
                <ChevronLeft className="h-5 w-5" />
                <span className="ml-2">Previous Week</span>
              </Button>
              
              <div className="text-center">
                <p className="text-lg font-bold text-white">
                  {currentWeek === 0 ? "This Week" : currentWeek > 0 ? `${currentWeek} Week${currentWeek > 1 ? 's' : ''} Ahead` : `${Math.abs(currentWeek)} Week${Math.abs(currentWeek) > 1 ? 's' : ''} Ago`}
                </p>
                <p className="text-sm text-slate-400">Oct 27 - Nov 2, 2025</p>
              </div>
              
              <Button
                variant="ghost"
                onClick={handleNextWeek}
                className="text-slate-400 hover:text-white"
              >
                <span className="mr-2">Next Week</span>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </Card>

          {/* Weekly Schedule Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schedule.map((day) => (
              <Card 
                key={day.id}
                className="bg-slate-900/50 backdrop-blur-sm border-slate-800 p-4"
              >
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white">{day.day}</h3>
                  <p className="text-sm text-slate-400">{day.date}</p>
                </div>

                {day.classes.length === 0 ? (
                  <div className="text-center py-8">
                    <Calendar className="h-12 w-12 text-slate-600 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">No classes scheduled</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {day.classes.map((classItem: any) => (
                      <div 
                        key={classItem.id}
                        className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-blue-600 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-white text-sm">
                            {classItem.name}
                          </h4>
                          {getStatusBadge(classItem.status)}
                        </div>
                        
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Clock className="h-3 w-3" />
                            <span>{classItem.time}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <User className="h-3 w-3" />
                            <span>{classItem.instructor}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <MapPin className="h-3 w-3" />
                            <span>{classItem.location}</span>
                          </div>
                        </div>

                        {classItem.status === "available" && (
                          <Button
                            className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white"
                            size="sm"
                          >
                            Enroll in Class
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            ))}
          </div>

          {/* Legend */}
          <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 p-4 mt-6">
            <div className="flex flex-wrap items-center gap-4 justify-center">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-600 text-white border-0">Enrolled</Badge>
                <span className="text-sm text-slate-400">Classes you're enrolled in</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-blue-600 text-white border-0">Available</Badge>
                <span className="text-sm text-slate-400">Classes you can join</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-slate-600 text-white border-0">Completed</Badge>
                <span className="text-sm text-slate-400">Past classes</span>
              </div>
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
