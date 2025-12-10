import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import {
  Users, UserPlus, Target, TrendingUp, DollarSign, 
  MessageSquare, Calendar, Bell, ChevronRight, Sparkles
} from "lucide-react";
import { BELT_COLORS, type BeltRank } from "@shared/types";
import { cn } from "@/lib/utils";

// Stat card component
function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color,
  href
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: string;
  color: string;
  href?: string;
}) {
  const content = (
    <Card className={cn("hover:shadow-md transition-shadow", href && "cursor-pointer")}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-3xl font-bold mt-1">{value}</p>
            {trend && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {trend}
              </p>
            )}
          </div>
          <div className={cn("p-3 rounded-lg", color)}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}

// Belt distribution chart
function BeltDistribution({ data }: { data: any[] }) {
  if (!data || data.length === 0) return null;

  const total = data.reduce((sum, item) => sum + item.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Belt Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {data.map((item) => {
            const colors = BELT_COLORS[item.beltRank as BeltRank] || BELT_COLORS.white;
            const percentage = total > 0 ? Math.round((item.count / total) * 100) : 0;
            
            return (
              <div key={item.beltRank} className="flex items-center gap-3">
                <div className={cn("w-4 h-4 rounded", colors.bg)} />
                <span className="text-sm capitalize flex-1">{item.beltRank}</span>
                <span className="text-sm text-muted-foreground">{item.count}</span>
                <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full rounded-full", colors.bg.replace("/10", ""))}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// Quick action button
function QuickAction({
  title,
  description,
  icon: Icon,
  href,
  color
}: {
  title: string;
  description: string;
  icon: React.ElementType;
  href: string;
  color: string;
}) {
  return (
    <Link href={href}>
      <Card className="hover:shadow-md transition-all hover:scale-[1.02] cursor-pointer h-full">
        <CardContent className="p-4 flex items-center gap-4">
          <div className={cn("p-3 rounded-lg shrink-0", color)}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium">{title}</h4>
            <p className="text-sm text-muted-foreground truncate">{description}</p>
          </div>
          <ChevronRight className="h-5 w-5 text-muted-foreground shrink-0" />
        </CardContent>
      </Card>
    </Link>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const { data: studentStats, isLoading: loadingStudents } = trpc.student.stats.useQuery();
  const { data: beltDistribution } = trpc.student.beltDistribution.useQuery();
  const { data: kaiData } = trpc.kai.dataSummary.useQuery();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container py-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              {greeting()}, {user?.name?.split(" ")[0] || "there"}!
            </h1>
            <p className="text-muted-foreground">
              Here's what's happening at your dojo today
            </p>
          </div>
          <Link href="/kai-chat">
            <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600">
              <Sparkles className="h-4 w-4 mr-2" />
              Ask Kai
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loadingStudents ? (
            [...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardContent>
              </Card>
            ))
          ) : (
            <>
              <StatCard
                title="Active Students"
                value={studentStats?.active || 0}
                icon={Users}
                trend="+5 this month"
                color="bg-green-100 text-green-600"
                href="/students"
              />
              <StatCard
                title="New Leads"
                value={kaiData?.leads?.new || 0}
                icon={Target}
                color="bg-blue-100 text-blue-600"
                href="/leads"
              />
              <StatCard
                title="Monthly Revenue"
                value={`$${kaiData?.billing?.totalMonthlyRevenue || 0}`}
                icon={DollarSign}
                color="bg-purple-100 text-purple-600"
              />
              <StatCard
                title="Late Payments"
                value={kaiData?.billing?.latePayers || 0}
                icon={Bell}
                color="bg-amber-100 text-amber-600"
              />
            </>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Quick Actions */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <QuickAction
                title="Manage Students"
                description="View and manage all students"
                icon={Users}
                href="/students"
                color="bg-green-100 text-green-600"
              />
              <QuickAction
                title="Lead Pipeline"
                description="Track prospective students"
                icon={Target}
                href="/leads"
                color="bg-blue-100 text-blue-600"
              />
              <QuickAction
                title="Chat with Kai"
                description="AI-powered insights"
                icon={MessageSquare}
                href="/kai-chat"
                color="bg-gradient-to-br from-emerald-100 to-cyan-100 text-emerald-600"
              />
              <QuickAction
                title="Add Student"
                description="Enroll a new student"
                icon={UserPlus}
                href="/students?action=add"
                color="bg-purple-100 text-purple-600"
              />
            </div>

            {/* Category Overview */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Student Categories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 rounded-lg bg-green-50 border border-green-200">
                    <p className="text-3xl font-bold text-green-600">{studentStats?.categoryA || 0}</p>
                    <p className="text-sm text-green-700">Category A</p>
                    <p className="text-xs text-muted-foreground">Excellent</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-yellow-50 border border-yellow-200">
                    <p className="text-3xl font-bold text-yellow-600">{studentStats?.categoryB || 0}</p>
                    <p className="text-sm text-yellow-700">Category B</p>
                    <p className="text-xs text-muted-foreground">Good</p>
                  </div>
                  <div className="text-center p-4 rounded-lg bg-red-50 border border-red-200">
                    <p className="text-3xl font-bold text-red-600">{studentStats?.categoryC || 0}</p>
                    <p className="text-sm text-red-700">Category C</p>
                    <p className="text-xs text-muted-foreground">At Risk</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Belt Distribution */}
          <div className="space-y-4">
            <BeltDistribution data={beltDistribution || []} />
            
            {/* Kai Quick Summary */}
            <Card className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-emerald-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-emerald-500" />
                  Kai Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Students</span>
                  <Badge variant="secondary">{kaiData?.students?.total || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Leads</span>
                  <Badge variant="secondary">{kaiData?.leads?.total || 0}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Late Payers</span>
                  <Badge variant="destructive">{kaiData?.billing?.latePayers || 0}</Badge>
                </div>
                <Link href="/kai-chat">
                  <Button variant="outline" className="w-full mt-2">
                    Ask Kai for More
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
