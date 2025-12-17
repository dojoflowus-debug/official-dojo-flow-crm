import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useKiosk } from '@/contexts/KioskContext';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { 
  QrCode, 
  Phone, 
  Search,
  CheckCircle2,
  Flame,
  ArrowLeft
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function KioskCheckIn() {
  const navigate = useNavigate();
  const { isSchoolLocked, schoolName, schoolLogo } = useKiosk();
  const [searchQuery, setSearchQuery] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [checkedIn, setCheckedIn] = useState(false);
  const [studentData, setStudentData] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const qrScannerRef = useRef<Html5QrcodeScanner | null>(null);

  // TRPC mutations
  const lookupByPhoneMutation = trpc.students.lookupByPhone.useMutation();
  const lookupByNameMutation = trpc.students.searchStudents.useMutation();
  const checkInMutation = trpc.kiosk.recordCheckIn.useMutation();

  // Redirect if not in kiosk mode
  useEffect(() => {
    if (!isSchoolLocked) {
      navigate('/kiosk');
    }
  }, [isSchoolLocked, navigate]);

  // Idle timeout - return to welcome screen after 30 seconds of inactivity
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    
    const resetIdleTimer = () => {
      if (timer) {
        clearTimeout(timer);
      }
      
      timer = setTimeout(() => {
        navigate('/kiosk');
      }, 30000); // 30 seconds
    };

    const handleInteraction = () => {
      resetIdleTimer();
    };

    window.addEventListener('click', handleInteraction, { passive: true });
    window.addEventListener('keypress', handleInteraction, { passive: true });
    window.addEventListener('touchstart', handleInteraction, { passive: true });

    // Start initial timer
    resetIdleTimer();

    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      window.removeEventListener('click', handleInteraction);
      window.removeEventListener('keypress', handleInteraction);
      window.removeEventListener('touchstart', handleInteraction);
    };
  }, [navigate]);

  // Auto-return to welcome screen after successful check-in
  useEffect(() => {
    if (checkedIn) {
      const timer = setTimeout(() => {
        navigate('/kiosk');
      }, 5000); // 5 seconds

      return () => clearTimeout(timer);
    }
  }, [checkedIn, navigate]);

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
    
    const scanner = new Html5QrcodeScanner(
      'qr-reader',
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );
    
    scanner.render(
      async (decodedText) => {
        scanner.clear();
        setIsScanning(false);
        
        try {
          const studentId = parseInt(decodedText);
          
          if (isNaN(studentId)) {
            toast.error('Invalid QR code');
            return;
          }
          
          const result = await checkInMutation.mutateAsync({ studentId });
          
          if (result.success && result.student) {
            setStudentData({
              name: result.student.name,
              belt: result.student.belt_rank || 'White Belt',
              streak: 5,
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
        // QR code scan error (can be ignored)
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
        const student = result.students[0];
        
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

  // Success screen after check-in
  if (checkedIn && studentData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-6">
        <Card className="max-w-2xl w-full border-slate-800 bg-slate-900/50 backdrop-blur-sm p-12">
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <div className="p-6 rounded-full bg-gradient-to-br from-green-600 to-green-700 shadow-lg">
                <CheckCircle2 className="h-20 w-20 text-white" />
              </div>
            </div>

            <div>
              <h2 className="text-4xl font-bold text-white mb-2">
                Welcome Back, {studentData.name}!
              </h2>
              <p className="text-xl text-slate-300">
                You're checked in
              </p>
            </div>

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

            <p className="text-sm text-slate-400">
              Returning to welcome screen...
            </p>
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
              onClick={() => navigate('/kiosk')}
              className="text-slate-400 hover:text-white h-12 w-12"
            >
              <ArrowLeft className="h-8 w-8" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Check In</h1>
              <p className="text-lg text-slate-400">{schoolName}</p>
            </div>
          </div>
          {schoolLogo && (
            <img 
              src={schoolLogo} 
              alt="School Logo" 
              className="h-16 w-16 object-contain rounded-lg"
            />
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 py-12">
        <div className="max-w-3xl mx-auto">
          <Tabs defaultValue="qr" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-16 mb-8">
              <TabsTrigger value="qr" className="text-lg">
                <QrCode className="h-6 w-6 mr-2" />
                QR Code
              </TabsTrigger>
              <TabsTrigger value="phone" className="text-lg">
                <Phone className="h-6 w-6 mr-2" />
                Phone
              </TabsTrigger>
              <TabsTrigger value="name" className="text-lg">
                <Search className="h-6 w-6 mr-2" />
                Name
              </TabsTrigger>
            </TabsList>

            <TabsContent value="qr" className="space-y-6">
              <Card className="border-slate-700 bg-slate-900/50 backdrop-blur-sm p-8">
                <div className="text-center space-y-6">
                  <div id="qr-reader" className="w-full"></div>
                  {!isScanning && (
                    <Button
                      size="lg"
                      onClick={startQRScanner}
                      className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-xl py-8"
                    >
                      <QrCode className="h-8 w-8 mr-3" />
                      Start QR Scanner
                    </Button>
                  )}
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="phone" className="space-y-6">
              <Card className="border-slate-700 bg-slate-900/50 backdrop-blur-sm p-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-lg text-white mb-3 block">
                      Enter your phone number
                    </label>
                    <Input
                      type="tel"
                      placeholder="(555) 123-4567"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handlePhoneCheckIn()}
                      className="h-16 text-2xl bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <Button
                    size="lg"
                    onClick={handlePhoneCheckIn}
                    disabled={lookupByPhoneMutation.isPending}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-xl py-8"
                  >
                    <Phone className="h-8 w-8 mr-3" />
                    {lookupByPhoneMutation.isPending ? 'Checking in...' : 'Check In'}
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="name" className="space-y-6">
              <Card className="border-slate-700 bg-slate-900/50 backdrop-blur-sm p-8">
                <div className="space-y-6">
                  <div>
                    <label className="text-lg text-white mb-3 block">
                      Enter your name
                    </label>
                    <Input
                      type="text"
                      placeholder="John Doe"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleNameCheckIn()}
                      className="h-16 text-2xl bg-slate-800 border-slate-700 text-white"
                    />
                  </div>
                  <Button
                    size="lg"
                    onClick={handleNameCheckIn}
                    disabled={lookupByNameMutation.isPending}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-xl py-8"
                  >
                    <Search className="h-8 w-8 mr-3" />
                    {lookupByNameMutation.isPending ? 'Searching...' : 'Check In'}
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
