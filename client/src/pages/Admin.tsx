import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  ArrowLeft,
  UserCheck,
  FileSignature,
  CreditCard,
  Settings,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  CheckCircle2,
  XCircle,
  Eye
} from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { kioskAPI } from "@/lib/api";

export default function Admin() {
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState(true);

  // State for real data
  const [stats, setStats] = useState({
    todayCheckIns: 0,
    newVisitors: 0,
    waiversSigned: 0,
    paymentsProcessed: 0,
    totalRevenue: 0
  });

  const [recentCheckIns, setRecentCheckIns] = useState<any[]>([]);

  const [recentWaivers, setRecentWaivers] = useState<any[]>([]);

  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  const [newVisitors, setNewVisitors] = useState<any[]>([]);

  // Fetch data on component mount
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // Fetch all data in parallel
      const [statsData, checkInsData, visitorsData, waiversData, paymentsData] = await Promise.all([
        kioskAPI.getTodayStats(),
        kioskAPI.getRecentCheckIns(),
        kioskAPI.getRecentVisitors(),
        kioskAPI.getRecentWaivers(),
        kioskAPI.getRecentPayments()
      ]);

      // Update stats
      if (statsData.stats) {
        setStats(statsData.stats);
      }

      // Update check-ins
      if (checkInsData.checkins) {
        setRecentCheckIns(checkInsData.checkins);
      }

      // Update visitors
      if (visitorsData.visitors) {
        setNewVisitors(visitorsData.visitors);
      }

      // Update waivers
      if (waiversData.waivers) {
        setRecentWaivers(waiversData.waivers);
      }

      // Update payments
      if (paymentsData.payments) {
        setRecentPayments(paymentsData.payments);
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading kiosk data...</p>
        </div>
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
              <h1 className="text-2xl font-bold text-white">Kiosk Admin Panel</h1>
              <p className="text-sm text-slate-400">Monitor and manage kiosk activity</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="border-slate-700 text-white hover:bg-slate-800"
          >
            <Settings className="mr-2 h-5 w-5" />
            Settings
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Check-Ins</p>
                <p className="text-3xl font-bold text-white">{stats.todayCheckIns}</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-red-600 to-red-700">
                <UserCheck className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-green-500">+12%</span>
              <span className="text-slate-400">vs yesterday</span>
            </div>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">New Visitors</p>
                <p className="text-3xl font-bold text-white">{stats.newVisitors}</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700">
                <Users className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm">
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="text-green-500">+8%</span>
              <span className="text-slate-400">vs yesterday</span>
            </div>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Waivers</p>
                <p className="text-3xl font-bold text-white">{stats.waiversSigned}</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-purple-600 to-purple-700">
                <FileSignature className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm">
              <span className="text-slate-400">3 pending review</span>
            </div>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Payments</p>
                <p className="text-3xl font-bold text-white">{stats.paymentsProcessed}</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-green-600 to-green-700">
                <CreditCard className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <span className="text-green-500">1 failed</span>
            </div>
          </Card>

          <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 mb-1">Revenue</p>
                <p className="text-3xl font-bold text-white">${stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-lg bg-gradient-to-br from-yellow-600 to-yellow-700">
                <DollarSign className="h-6 w-6 text-white" />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1 text-sm">
              <span className="text-slate-400">Today's total</span>
            </div>
          </Card>
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="checkins" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-slate-900/50 border border-slate-800">
            <TabsTrigger value="checkins" className="data-[state=active]:bg-red-600">
              Check-Ins
            </TabsTrigger>
            <TabsTrigger value="visitors" className="data-[state=active]:bg-blue-600">
              New Visitors
            </TabsTrigger>
            <TabsTrigger value="waivers" className="data-[state=active]:bg-purple-600">
              Waivers
            </TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-green-600">
              Payments
            </TabsTrigger>
          </TabsList>

          {/* Check-Ins Tab */}
          <TabsContent value="checkins" className="mt-6">
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
              <div className="p-6 border-b border-slate-800">
                <h3 className="text-xl font-bold text-white">Recent Check-Ins</h3>
                <p className="text-sm text-slate-400">Students who checked in today</p>
              </div>
              <ScrollArea className="h-[400px]">
                <div className="p-6 space-y-4">
                  {recentCheckIns.map((checkin) => (
                    <div
                      key={checkin.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-red-600/20">
                          <UserCheck className="h-5 w-5 text-red-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{checkin.name}</p>
                          <p className="text-sm text-slate-400">{checkin.class}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="flex items-center gap-2 text-slate-400">
                            <Clock className="h-4 w-4" />
                            <span className="text-sm">{checkin.time}</span>
                          </div>
                        </div>
                        <Badge className="bg-green-600 hover:bg-green-700">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Checked In
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          {/* New Visitors Tab */}
          <TabsContent value="visitors" className="mt-6">
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
              <div className="p-6 border-b border-slate-800">
                <h3 className="text-xl font-bold text-white">New Visitor Sign-Ups</h3>
                <p className="text-sm text-slate-400">Trial classes scheduled via kiosk</p>
              </div>
              <ScrollArea className="h-[400px]">
                <div className="p-6 space-y-4">
                  {newVisitors.map((visitor) => (
                    <div
                      key={visitor.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-blue-600/20">
                          <Users className="h-5 w-5 text-blue-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{visitor.name}</p>
                          <p className="text-sm text-slate-400">{visitor.phone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-white">{visitor.interest}</p>
                          <p className="text-sm text-slate-400">{visitor.scheduled}</p>
                        </div>
                        <Button size="sm" variant="outline" className="border-slate-700">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          {/* Waivers Tab */}
          <TabsContent value="waivers" className="mt-6">
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
              <div className="p-6 border-b border-slate-800">
                <h3 className="text-xl font-bold text-white">Digital Waivers</h3>
                <p className="text-sm text-slate-400">Signed and pending waivers</p>
              </div>
              <ScrollArea className="h-[400px]">
                <div className="p-6 space-y-4">
                  {recentWaivers.map((waiver) => (
                    <div
                      key={waiver.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-purple-600/20">
                          <FileSignature className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{waiver.name}</p>
                          <p className="text-sm text-slate-400">{waiver.type} Waiver • {waiver.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {waiver.status === "signed" ? (
                          <Badge className="bg-green-600 hover:bg-green-700">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Signed
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="border-yellow-600 text-yellow-500">
                            Pending
                          </Badge>
                        )}
                        <Button size="sm" variant="outline" className="border-slate-700">
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>

          {/* Payments Tab */}
          <TabsContent value="payments" className="mt-6">
            <Card className="border-slate-800 bg-slate-900/50 backdrop-blur-sm">
              <div className="p-6 border-b border-slate-800">
                <h3 className="text-xl font-bold text-white">Payment Transactions</h3>
                <p className="text-sm text-slate-400">Processed payments via kiosk</p>
              </div>
              <ScrollArea className="h-[400px]">
                <div className="p-6 space-y-4">
                  {recentPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className="flex items-center justify-between p-4 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-green-600/20">
                          <CreditCard className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                          <p className="font-semibold text-white">{payment.name}</p>
                          <p className="text-sm text-slate-400">{payment.type}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-xl font-bold text-white">${payment.amount}</p>
                        {payment.status === "completed" ? (
                          <Badge className="bg-green-600 hover:bg-green-700">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            <XCircle className="h-3 w-3 mr-1" />
                            Failed
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

