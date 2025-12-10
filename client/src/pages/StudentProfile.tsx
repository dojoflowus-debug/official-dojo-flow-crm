import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { APP_LOGO, APP_TITLE } from "@/const";
import { 
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  Save,
  Camera
} from "lucide-react";
import { useLocation } from "wouter";

/**
 * Student Profile - View and edit profile settings
 */
export default function StudentProfile() {
  const [, setLocation] = useLocation();
  const [profile, setProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    // Check if student is logged in
    const isLoggedIn = localStorage.getItem("student_logged_in");
    if (!isLoggedIn) {
      setLocation("/student-login");
      return;
    }

    // TODO: Fetch profile from backend API
    // Mock data for now
    setProfile({
      name: "Mike Johnson",
      email: "mike.j@example.com",
      phone: "(555) 123-4567",
      address: "123 Main St, Springfield, IL 62701",
      dateOfBirth: "Jan 15, 2010",
      joinDate: "Jul 1, 2024",
      beltRank: "Yellow Belt",
      nextBeltTest: "Nov 15, 2025",
      photo: "https://i.pravatar.cc/150?img=1",
      emergencyContact: {
        name: "Jane Johnson",
        phone: "(555) 987-6543",
        relationship: "Mother"
      },
      preferences: {
        notifications: true,
        emailUpdates: true,
        smsReminders: false
      }
    });
  }, [setLocation]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Save profile changes through backend API
    console.log("Saving profile:", profile);
    setIsEditing(false);
  };

  const handlePhotoUpload = () => {
    // TODO: Implement photo upload
    console.log("Upload photo");
  };

  if (!profile) {
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
            <Button
              variant="ghost"
              onClick={() => setLocation("/student-dashboard")}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-white">Profile Settings</h1>
              <p className="text-xs text-slate-400">Manage your account information</p>
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
        <div className="max-w-4xl mx-auto">
          {/* Profile Header Card */}
          <Card className="bg-gradient-to-br from-blue-600 to-blue-800 border-0 p-8 mb-8">
            <div className="flex items-center gap-6">
              <div className="relative">
                <img 
                  src={profile.photo} 
                  alt={profile.name}
                  className="h-24 w-24 rounded-full border-4 border-white"
                />
                <Button
                  onClick={handlePhotoUpload}
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-white text-blue-600 hover:bg-blue-50 p-0"
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex-1">
                <h2 className="text-3xl font-bold text-white mb-2">
                  {profile.name}
                </h2>
                <div className="flex items-center gap-3 mb-3">
                  <Badge className="bg-white text-blue-600 border-0">
                    <Award className="h-3 w-3 mr-1" />
                    {profile.beltRank}
                  </Badge>
                  <span className="text-blue-100 text-sm">
                    Member since {profile.joinDate}
                  </span>
                </div>
                <p className="text-blue-100 text-sm">
                  Next belt test: {profile.nextBeltTest}
                </p>
              </div>
              <Button
                onClick={() => setIsEditing(!isEditing)}
                className="bg-white text-blue-600 hover:bg-blue-50"
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </Button>
            </div>
          </Card>

          <form onSubmit={handleSave}>
            {/* Personal Information */}
            <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 p-6 mb-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <User className="h-5 w-5 text-blue-500" />
                Personal Information
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="name" className="text-slate-300">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({...profile, name: e.target.value})}
                    disabled={!isEditing}
                    className="bg-slate-800 border-slate-700 text-white disabled:opacity-70"
                  />
                </div>

                <div>
                  <Label htmlFor="email" className="text-slate-300">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                      disabled={!isEditing}
                      className="bg-slate-800 border-slate-700 text-white pl-10 disabled:opacity-70"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-slate-300">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="phone"
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      disabled={!isEditing}
                      className="bg-slate-800 border-slate-700 text-white pl-10 disabled:opacity-70"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="dob" className="text-slate-300">Date of Birth</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="dob"
                      value={profile.dateOfBirth}
                      disabled
                      className="bg-slate-800 border-slate-700 text-white pl-10 disabled:opacity-70"
                    />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="address" className="text-slate-300">Address</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      id="address"
                      value={profile.address}
                      onChange={(e) => setProfile({...profile, address: e.target.value})}
                      disabled={!isEditing}
                      className="bg-slate-800 border-slate-700 text-white pl-10 disabled:opacity-70"
                    />
                  </div>
                </div>
              </div>
            </Card>

            {/* Emergency Contact */}
            <Card className="bg-slate-900/50 backdrop-blur-sm border-slate-800 p-6 mb-6">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Phone className="h-5 w-5 text-orange-500" />
                Emergency Contact
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="ec-name" className="text-slate-300">Name</Label>
                  <Input
                    id="ec-name"
                    value={profile.emergencyContact.name}
                    onChange={(e) => setProfile({
                      ...profile,
                      emergencyContact: {...profile.emergencyContact, name: e.target.value}
                    })}
                    disabled={!isEditing}
                    className="bg-slate-800 border-slate-700 text-white disabled:opacity-70"
                  />
                </div>

                <div>
                  <Label htmlFor="ec-phone" className="text-slate-300">Phone</Label>
                  <Input
                    id="ec-phone"
                    type="tel"
                    value={profile.emergencyContact.phone}
                    onChange={(e) => setProfile({
                      ...profile,
                      emergencyContact: {...profile.emergencyContact, phone: e.target.value}
                    })}
                    disabled={!isEditing}
                    className="bg-slate-800 border-slate-700 text-white disabled:opacity-70"
                  />
                </div>

                <div>
                  <Label htmlFor="ec-relationship" className="text-slate-300">Relationship</Label>
                  <Input
                    id="ec-relationship"
                    value={profile.emergencyContact.relationship}
                    onChange={(e) => setProfile({
                      ...profile,
                      emergencyContact: {...profile.emergencyContact, relationship: e.target.value}
                    })}
                    disabled={!isEditing}
                    className="bg-slate-800 border-slate-700 text-white disabled:opacity-70"
                  />
                </div>
              </div>
            </Card>

            {/* Save Button */}
            {isEditing && (
              <div className="flex justify-end">
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  size="lg"
                >
                  <Save className="h-5 w-5 mr-2" />
                  Save Changes
                </Button>
              </div>
            )}
          </form>
        </div>
      </main>
    </div>
  );
}
