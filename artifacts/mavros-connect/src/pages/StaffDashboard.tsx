import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, Clock, MapPin, Wifi, User, TrendingUp } from "lucide-react";
import { ghs } from "@/lib/currency";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";

export default function StaffDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    activeSessions: 0,
    totalSessions: 0,
    assignedLocation: "Not assigned",
    assignedRouter: "Not assigned",
    lastActivity: "N/A"
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading staff data
    // In a real app, this would call an API endpoint
    setTimeout(() => {
      setStats({
        activeSessions: 2,
        totalSessions: 24,
        assignedLocation: user?.locationId ? "Location A" : "Not assigned",
        assignedRouter: "Router-01",
        lastActivity: "Connected 2 hours ago"
      });
      setIsLoading(false);
    }, 500);
  }, [user]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-mono uppercase">Welcome, {user?.name}</h1>
          <p className="text-sm text-muted-foreground mt-1">Your personal dashboard</p>
        </div>
        <Badge variant="outline" className="font-mono text-xs uppercase">{user?.role}</Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Active Sessions" 
          value={stats.activeSessions} 
          icon={<Activity className="h-4 w-4 text-emerald-500" />}
          subtitle="Currently online"
        />
        <StatsCard 
          title="Total Sessions" 
          value={stats.totalSessions} 
          icon={<Clock className="h-4 w-4 text-blue-500" />}
          subtitle="This month"
        />
        <StatsCard 
          title="Assigned Location" 
          value={stats.assignedLocation} 
          icon={<MapPin className="h-4 w-4 text-orange-500" />}
        />
        <StatsCard 
          title="Assigned Router" 
          value={stats.assignedRouter} 
          icon={<Wifi className="h-4 w-4 text-emerald-500" />}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Profile Card */}
        <Card className="rounded-sm border-border bg-card">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              Your Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 border-t border-border pt-4">
            <div>
              <p className="text-xs text-muted-foreground font-mono uppercase">Name</p>
              <p className="text-sm font-medium">{user?.name}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-mono uppercase">Email</p>
              <p className="text-sm font-medium break-all">{user?.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-mono uppercase">Role</p>
              <Badge className="mt-1">{user?.role}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-mono uppercase">Status</p>
              <Badge variant="outline" className="mt-1 bg-emerald-500/10 text-emerald-700 border-emerald-200">
                Active
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity Card */}
        <Card className="rounded-sm border-border bg-card md:col-span-2">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="border-t border-border p-0">
            <div className="divide-y divide-border">
              <div className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                <div>
                  <p className="text-sm font-medium">Session Started</p>
                  <p className="text-xs text-muted-foreground">Connected to Router-01 • 2 hours ago</p>
                </div>
              </div>
              <div className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <div>
                  <p className="text-sm font-medium">Device Connected</p>
                  <p className="text-xs text-muted-foreground">MAC: AA:BB:CC:DD:EE:FF • 5 hours ago</p>
                </div>
              </div>
              <div className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                <div>
                  <p className="text-sm font-medium">Voucher Used</p>
                  <p className="text-xs text-muted-foreground">7-DAY-PASS • 1 day ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Section */}
      <Card className="rounded-sm border-border bg-card">
        <CardHeader>
          <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Network Statistics</CardTitle>
        </CardHeader>
        <CardContent className="border-t border-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-mono uppercase">Data Used</p>
              <p className="text-lg font-bold font-mono">2.4 GB</p>
              <p className="text-xs text-muted-foreground">of 10 GB</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-mono uppercase">Avg Speed</p>
              <p className="text-lg font-bold font-mono">45 Mbps</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-mono uppercase">Session Time</p>
              <p className="text-lg font-bold font-mono">124 hrs</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-mono uppercase">Devices</p>
              <p className="text-lg font-bold font-mono">3</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatsCard({ title, value, icon, subtitle }: { title: string, value: string | number, icon: React.ReactNode, subtitle?: string }) {
  return (
    <Card className="rounded-sm border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono">{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1 font-mono">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
