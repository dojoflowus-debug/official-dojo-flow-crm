import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { APP_LOGO, APP_TITLE } from "@/const";
import { 
  ArrowLeft,
  User,
  Mail,
  Phone,
  Bell,
  Shield,
  Camera,
  Save,
  LogOut
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Soft Card Component
function SoftCard({ 
  children, 
  className = "",
  hover = false
}: { 
  children: React.ReactNode; 
  className?: string;
  hover?: boolean;
}) {
  return (
    <div 
      className={`
        bg-white rounded-3xl 
        shadow-[0_2px_20px_rgba(0,0,0,0.06)]
        border border-gray-100/50
        ${hover ? 'transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.1)] hover:-translate-y-1' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export default function StudentSettings() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    firstName: "Mike",
    lastName: "Johnson",
    email: "mike.johnson@example.com",
    phone: "(555) 123-4567",
    emergencyContact: "Jane Johnson",
    emergencyPhone: "(555) 987-6543"
  });

  // Notification preferences
  const [notifications, setNotifications] = useState({
    classReminders: true,
    beltTestReminders: true,
    paymentReminders: true,
    promotionalEmails: false,
    smsNotifications: true
  });

  useEffect(() => {
    // Check if student is logged in
    const isLoggedIn = localStorage.getItem("student_logged_in");
    if (!isLoggedIn) {
      navigate("/student-login");
      return;
    }
    setTimeout(() => setMounted(true), 100);
  }, [navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsSaving(false);
    // Show success message (in a real app, use a toast)
    alert("Settings saved successfully!");
  };

  const handleLogout = () => {
    localStorage.removeItem("student_logged_in");
    localStorage.removeItem("student_id");
    localStorage.removeItem("student_email");
    navigate("/student-login");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate("/student-dashboard")}
              className="flex items-center gap-2 px-3 py-2 rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
              <span className="text-sm font-medium">Dashboard</span>
            </button>
            <div className="flex items-center gap-3">
              {APP_LOGO && (
                <img src={APP_LOGO} alt={APP_TITLE} className="h-8 w-auto" />
              )}
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Account Settings</h1>
                <p className="text-xs text-gray-500">Manage your profile and preferences</p>
              </div>
            </div>
          </div>
          
          <Button 
            onClick={handleSave}
            disabled={isSaving}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8 max-w-4xl">
        <div className={`space-y-6 transition-all duration-700 ${mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          
          {/* Profile Photo */}
          <SoftCard className="p-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gray-200 overflow-hidden">
                  <img 
                    src="https://images.unsplash.com/photo-1555597673-b21d5c935865?w=200&h=200&fit=crop&crop=face"
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-orange-500 rounded-full text-white hover:bg-orange-600 transition-colors">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{formData.firstName} {formData.lastName}</h2>
                <p className="text-gray-500">Yellow Belt • Member since Oct 2025</p>
                <Button variant="link" className="text-orange-500 p-0 h-auto mt-1">
                  Change profile photo
                </Button>
              </div>
            </div>
          </SoftCard>

          {/* Personal Information */}
          <SoftCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-blue-100">
                <User className="h-5 w-5 text-blue-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Personal Information</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName" className="text-gray-700">First Name</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className="mt-1 rounded-xl border-gray-200"
                />
              </div>
              <div>
                <Label htmlFor="lastName" className="text-gray-700">Last Name</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="mt-1 rounded-xl border-gray-200"
                />
              </div>
              <div>
                <Label htmlFor="email" className="text-gray-700">Email Address</Label>
                <div className="relative mt-1">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10 rounded-xl border-gray-200"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="phone" className="text-gray-700">Phone Number</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="pl-10 rounded-xl border-gray-200"
                  />
                </div>
              </div>
            </div>
          </SoftCard>

          {/* Emergency Contact */}
          <SoftCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-red-100">
                <Shield className="h-5 w-5 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Emergency Contact</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="emergencyContact" className="text-gray-700">Contact Name</Label>
                <Input
                  id="emergencyContact"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleInputChange}
                  className="mt-1 rounded-xl border-gray-200"
                />
              </div>
              <div>
                <Label htmlFor="emergencyPhone" className="text-gray-700">Contact Phone</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="emergencyPhone"
                    name="emergencyPhone"
                    type="tel"
                    value={formData.emergencyPhone}
                    onChange={handleInputChange}
                    className="pl-10 rounded-xl border-gray-200"
                  />
                </div>
              </div>
            </div>
          </SoftCard>

          {/* Notification Preferences */}
          <SoftCard className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-purple-100">
                <Bell className="h-5 w-5 text-purple-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Notification Preferences</h2>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900">Class Reminders</p>
                  <p className="text-sm text-gray-500">Get notified before your scheduled classes</p>
                </div>
                <Switch 
                  checked={notifications.classReminders}
                  onCheckedChange={() => handleNotificationChange('classReminders')}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900">Belt Test Reminders</p>
                  <p className="text-sm text-gray-500">Reminders about upcoming belt tests and eligibility</p>
                </div>
                <Switch 
                  checked={notifications.beltTestReminders}
                  onCheckedChange={() => handleNotificationChange('beltTestReminders')}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900">Payment Reminders</p>
                  <p className="text-sm text-gray-500">Get notified about upcoming payments</p>
                </div>
                <Switch 
                  checked={notifications.paymentReminders}
                  onCheckedChange={() => handleNotificationChange('paymentReminders')}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900">SMS Notifications</p>
                  <p className="text-sm text-gray-500">Receive notifications via text message</p>
                </div>
                <Switch 
                  checked={notifications.smsNotifications}
                  onCheckedChange={() => handleNotificationChange('smsNotifications')}
                />
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900">Promotional Emails</p>
                  <p className="text-sm text-gray-500">News about events, promotions, and updates</p>
                </div>
                <Switch 
                  checked={notifications.promotionalEmails}
                  onCheckedChange={() => handleNotificationChange('promotionalEmails')}
                />
              </div>
            </div>
          </SoftCard>

          {/* Danger Zone */}
          <SoftCard className="p-6 border-red-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Account Actions</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">Sign Out</p>
                <p className="text-sm text-gray-500">Sign out of your student portal account</p>
              </div>
              <Button 
                variant="outline" 
                onClick={handleLogout}
                className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </SoftCard>
        </div>
      </main>
    </div>
  );
}
