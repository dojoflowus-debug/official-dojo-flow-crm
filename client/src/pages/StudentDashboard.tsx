import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_LOGO, APP_TITLE } from "@/const";
import { 
  User, 
  LogOut, 
  DollarSign, 
  Calendar, 
  CreditCard,
  Settings,
  MessageSquare,
  FileText,
  AlertCircle
} from "lucide-react";
import { useLocation } from "wouter";

/**
 * Student Dashboard - Main portal for students to manage their account
 */
export default function StudentDashboard() {
  const [, setLocation] = useLocation();
  const [studentData, setStudentData] = useState<any>(null);

  useEffect(() => {
    // Check if student is logged in
    const isLoggedIn = localStorage.getItem("student_logged_in");
    const email = localStorage.getItem("student_email");
    
    if (!isLoggedIn) {
      setLocation("/student-login");
      return;
    }

    // TODO: Fetch student data from backend API
    // Mock data for now
    setStudentData({
      name: "Mike Johnson",
      email: email || "mike.j@example.com",
      photo: "https://i.pravatar.cc/150?img=1",
      belt_rank: "Yellow Belt",
      membership_status: "Active",
      account_balance: 0,
      next_payment_due: "Nov 1, 2025",
      classes_this_month: 12,
      upcoming_classes: [
        {
          id: 1,
          name: "Kids Karate - Beginners",
          instructor: "John Smith",
          date: "Oct 27, 2025",
          time: "4:00 PM - 5:00 PM",
          location: "Main Dojo"
        },
        {
          id: 2,
          name: "Kids Karate - Beginners",
          instructor: "John Smith",
          date: "Oct 29, 2025",
          time: "4:00 PM - 5:00 PM",
          location: "Main Dojo"
        }
      ]
    });
  }, [setLocation]);

  const handleLogout = () => {
    localStorage.removeItem("student_logged_in");
    localStorage.removeItem("student_email");
    setLocation("/");
  };

  if (!studentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {APP_LOGO && (
              <img 
                src={APP_LOGO} 
                alt={APP_TITLE} 
                className="h-10 w-auto"
              />
            )}
            <div>
              <h1 className="text-xl font-bold text-white">{APP_TITLE}</h1>
              <p className="text-xs text-slate-400">Student Portal</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3">
              <img 
                src={studentData.photo} 
                alt={studentData.name} 
                className="h-10 w-10 rounded-full border-2 border-blue-600"
              />
              <div>
                <p className="text-sm font-semibold text-white">{studentData.name}</p>
                <p className="text-xs text-slate-400">{studentData.belt_rank}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              onClick={handleLogout}
              className="text-slate-400 hover:text-white"
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-white mb-2">
              Welcome back, {studentData.name.split(' ')[0]}!
            </h2>
            <p className="text-slate-400">Manage your training and account</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Account Balance</p>
                  <p className="text-3xl font-bold text-white">
                    ${studentData.account_balance}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Next payment: {studentData.next_payment_due}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-green-600/20">
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </div>
            </Card>

            <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Classes This Month</p>
                  <p className="text-3xl font-bold text-white">
                    {studentData.classes_this_month}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Keep up the great work!
                  </p>
                </div>
                <div className="p-3 rounded-full bg-blue-600/20">
                  <Calendar className="h-8 w-8 text-blue-500" />
                </div>
              </div>
            </Card>

            <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm mb-1">Membership</p>
                  <Badge className="bg-green-600 text-white border-0 mb-2">
                    {studentData.membership_status}
                  </Badge>
                  <p className="text-xs text-slate-500">
                    {studentData.belt_rank}
                  </p>
                </div>
                <div className="p-3 rounded-full bg-purple-600/20">
                  <User className="h-8 w-8 text-purple-500" />
                </div>
              </div>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Button
              onClick={() => setLocation("/student-schedule")}
              className="h-24 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 flex-col gap-2"
            >
              <Calendar className="h-6 w-6 text-blue-500" />
              <span className="text-white">My Schedule</span>
            </Button>

            <Button
              onClick={() => setLocation("/student-payments")}
              className="h-24 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 flex-col gap-2"
            >
              <CreditCard className="h-6 w-6 text-green-500" />
              <span className="text-white">Payments</span>
            </Button>

            <Button
              onClick={() => setLocation("/student-messages")}
              className="h-24 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 flex-col gap-2"
            >
              <MessageSquare className="h-6 w-6 text-purple-500" />
              <span className="text-white">Messages</span>
            </Button>

            <Button
              onClick={() => setLocation("/student-profile")}
              className="h-24 bg-slate-900/50 hover:bg-slate-800 border border-slate-800 flex-col gap-2"
            >
              <Settings className="h-6 w-6 text-orange-500" />
              <span className="text-white">Settings</span>
            </Button>
          </div>

          {/* Upcoming Classes */}
          <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 p-6">
            <h3 className="text-xl font-bold text-white mb-4">Upcoming Classes</h3>
            <div className="space-y-4">
              {studentData.upcoming_classes.map((class_item: any) => (
                <div 
                  key={class_item.id}
                  className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-blue-600/20">
                      <Calendar className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{class_item.name}</p>
                      <p className="text-sm text-slate-400">
                        Instructor: {class_item.instructor}
                      </p>
                      <p className="text-xs text-slate-500">
                        {class_item.location}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{class_item.date}</p>
                    <p className="text-xs text-slate-400">{class_item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
