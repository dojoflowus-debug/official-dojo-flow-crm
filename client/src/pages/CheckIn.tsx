import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { APP_TITLE } from "@/const";
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { 
  QrCode, 
  Phone, 
  Search,
  ArrowLeft,
  CheckCircle2,
  Flame
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function CheckIn() {
  const [, setLocation] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [checkedIn, setCheckedIn] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const qrScannerRef = useRef<Html5QrcodeScanner | null>(null);
  
  // Fetch school logo from database
  const { data: brandData } = trpc.setupWizard.getBrand.useQuery();
  const schoolLogo = brandData?.logoSquare || null;
  
  // trpc mutations
  const lookupByPhoneMutation = trpc.students.lookupByPhone.useMutation();
  const lookupByNameMutation = trpc.students.searchStudents.useMutation();
  const checkInMutation = trpc.kiosk.recordCheckIn.useMutation();

  // Cleanup QR scanner on unmount
  useEffect(() => {
    return () => {
      if (qrScannerRef.current) {
        qrScannerRef.current.clear().catch(console.error);
      }
    };
  }, []);
  
  const startQRScanner = () => {
    setIsScanning(true);
    
    // Initialize QR scanner
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );
    
    scanner.render(
      async (decodedText) => {
        // QR code successfully scanned
        scanner.clear();
        setIsScanning(false);
        
        try {
          const studentId = parseInt(decodedText);
          
          if (isNaN(studentId)) {
            toast.error('Invalid QR code');
            return;
          }
          
          // Record check-in
          const result = await checkInMutation.mutateAsync({ studentId });
          
          if (result.success && result.student) {
            setStudentData({
              name: result.student.name,
              belt: result.student.belt_rank || 'White Belt',
              streak: 5, // TODO: Calculate actual streak
              class: 'Your next scheduled class'
            });
            setCheckedIn(true);
            toast.success(`Welcome, ${result.student.name}!`);
          }
        } catch (error) {
          console.error('Check-in error:', error);
          toast.error('Check-in failed. Please try again.');
        }
      },
      (errorMessage) => {
        // QR code scan error (can be ignored, happens frequently)
      }
    );
    
    qrScannerRef.current = scanner;
  };
  
  const handlePhoneCheckIn = async () => {
    if (!phoneNumber.trim()) {
      toast.error('Please enter a phone number');
      return;
    }
    
    try {
      const result = await lookupByPhoneMutation.mutateAsync({ phone: phoneNumber });
      
      if (result.student) {
        // Record check-in
        const checkInResult = await checkInMutation.mutateAsync({ studentId: result.student.id });
        
        if (checkInResult.success && checkInResult.student) {
          setStudentData({
            name: checkInResult.student.name,
            belt: checkInResult.student.belt_rank || 'White Belt',
            streak: 5,
            class: 'Your next scheduled class'
          });
          setCheckedIn(true);
          toast.success(`Welcome, ${checkInResult.student.name}!`);
        }
      } else {
        toast.error('Student not found. Please check your phone number.');
      }
    } catch (error) {
      console.error('Phone lookup error:', error);
      toast.error('Lookup failed. Please try again.');
    }
  };
  
  const handleNameCheckIn = async () => {
    if (!searchQuery.trim()) {
      toast.error('Please enter a name');
      return;
    }
    
    try {
      const result = await lookupByNameMutation.mutateAsync({ query: searchQuery });
      
      if (result.students && result.students.length > 0) {
        const student = result.students[0]; // Take first match
        
        // Record check-in
        const checkInResult = await checkInMutation.mutateAsync({ studentId: student.id });
        
        if (checkInResult.success && checkInResult.student) {
          setStudentData({
            name: checkInResult.student.name,
            belt: checkInResult.student.belt_rank || 'White Belt',
            streak: 5,
            class: 'Your next scheduled class'
          });
          setCheckedIn(true);
          toast.success(`Welcome, ${checkInResult.student.name}!`);
        }
      } else {
        toast.error('Student not found. Please check the name.');
      }
    } catch (error) {
      console.error('Name lookup error:', error);
      toast.error('Lookup failed. Please try again.');
    }
  };

  if (checkedIn && studentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full border-slate-800 bg-slate-900/50 backdrop-blur-sm p-12">
          <div className="text-center space-y-6">
            {/* Success Icon */}
            <div className="flex justify-center">
              <div className="p-6 rounded-full bg-gradient-to-br from-green-600 to-green-700 shadow-lg">
                <CheckCircle2 className="h-20 w-20 text-white" />
              </div>
            </div>

            {/* Success Message */}
            <div>
              <h2 className="text-4xl font-bold text-white mb-2">
                Welcome Back, {studentData.name}!
              </h2>
              <p className="text-xl text-slate-300">
                You're checked in for {studentData.class}
              </p>
            </div>

            {/* Student Info */}
            <div className="grid grid-cols-2 gap-4 py-6">
              <div className="p-4 rounded-lg bg-slate-800/50">
                <p className="text-sm text-slate-400 mb-1">Current Belt</p>
                <p className="text-2xl font-bold text-white">{studentData.belt}</p>
              </div>
              <div className="p-4 rounded-lg bg-slate-800/50">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="h-4 w-4 text-orange-500" />
                  <p className="text-sm text-slate-400">Attendance Streak</p>
                </div>
                <p className="text-2xl font-bold text-orange-500">{studentData.streak} days</p>
              </div>
            </div>

            {/* Actions */}
            <Button
              size="lg"
              onClick={() => setLocation("/")}
              className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
            >
              Done
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-950/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/")}
              className="text-slate-400 hover:text-white"
            >
              <ArrowLeft className="h-6 w-6" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-white">Student Check-In</h1>
              <p className="text-sm text-slate-400">Scan, search, or enter phone number</p>
            </div>
          </div>
          {/* School Logo */}
          {schoolLogo && (
            <div className="flex items-center">
              <img 
                src={schoolLogo} 
                alt="School Logo" 
                className="h-12 w-12 object-contain rounded-lg"
              />
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <Tabs defaultValue="qr" className="w-full">
            <TabsList className="grid w-full grid-cols-3 bg-slate-900/50 border border-slate-800">
              <TabsTrigger value="qr" className="data-[state=active]:bg-red-600">
                <QrCode className="h-5 w-5 mr-2" />
                QR Code
              </TabsTrigger>
              <TabsTrigger value="phone" className="data-[state=active]:bg-red-600">
                <Phone className="h-5 w-5 mr-2" />
                Phone
              </TabsTrigger>
              <TabsTrigger value="search" className="data-[state=active]:bg-red-600">
                <Search className="h-5 w-5 mr-2" />
                Name
              </TabsTrigger>
            </TabsList>

            {/* QR Code Tab */}
            <TabsContent value="qr" className="mt-8">
              <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm p-12">
                <div className="text-center space-y-6">
                  <div className="flex justify-center">
                    <div className="p-8 rounded-2xl bg-white">
                      <QrCode className="h-32 w-32 text-slate-900" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white mb-2">
                      Scan Your QR Code
                    </h3>
                    <p className="text-slate-400">
                      Hold your membership card or phone QR code up to the camera
                    </p>
                  </div>
                  {!isScanning && (
                    <Button
                      size="lg"
                      onClick={startQRScanner}
                      className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                    >
                      Start QR Scanner
                    </Button>
                  )}
                  <div id="qr-reader" className="w-full"></div>
                </div>
              </Card>
            </TabsContent>

            {/* Phone Number Tab */}
            <TabsContent value="phone" className="mt-8">
              <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm p-8">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="phone" className="text-white text-lg mb-2 block">
                      Enter Your Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="text-2xl h-16 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <Button
                    size="lg"
                    onClick={handlePhoneCheckIn}
                    disabled={!phoneNumber || lookupByPhoneMutation.isPending || checkInMutation.isPending}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 h-14 text-lg"
                  >
                    {lookupByPhoneMutation.isPending || checkInMutation.isPending ? 'Checking in...' : 'Check In'}
                  </Button>
                </div>
              </Card>
            </TabsContent>

            {/* Name Search Tab */}
            <TabsContent value="search" className="mt-8">
              <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm p-8">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="search" className="text-white text-lg mb-2 block">
                      Search by Name
                    </Label>
                    <Input
                      id="search"
                      type="text"
                      placeholder="Enter your first or last name"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="text-2xl h-16 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                    />
                  </div>
                  <Button
                    size="lg"
                    onClick={handleNameCheckIn}
                    disabled={!searchQuery || lookupByNameMutation.isPending || checkInMutation.isPending}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 h-14 text-lg"
                  >
                    {lookupByNameMutation.isPending || checkInMutation.isPending ? 'Checking in...' : 'Search & Check In'}
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

