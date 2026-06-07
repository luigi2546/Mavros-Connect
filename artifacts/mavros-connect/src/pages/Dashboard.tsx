import { useGetDashboardStats, getGetDashboardStatsQueryKey } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity, CreditCard, MapPin, Users, Wifi, Ticket } from "lucide-react";
import { ghs } from "@/lib/currency";
import StaffDashboard from "./StaffDashboard";

export default function Dashboard() {
  const { user } = useAuth();
  const { data: stats, isLoading } = useGetDashboardStats({ query: { queryKey: getGetDashboardStatsQueryKey() } });

  // Show staff dashboard for non-admin roles
  if (user?.role === "staff" || user?.role === "manager") {
    return <StaffDashboard />;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight font-mono uppercase">System Overview</h1>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatsCard 
          title="Total Revenue" 
          value={ghs(stats?.totalRevenue || 0)} 
          icon={<CreditCard className="h-4 w-4 text-muted-foreground" />} 
          subtitle="All time"
        />
        <StatsCard 
          title="Revenue Today" 
          value={ghs(stats?.revenueToday || 0)} 
          icon={<CreditCard className="h-4 w-4 text-primary" />} 
          subtitle="Past 24h"
          highlight
        />
        <StatsCard 
          title="Active Users" 
          value={stats?.activeUsers || 0} 
          icon={<Users className="h-4 w-4 text-emerald-500" />} 
        />
        <StatsCard 
          title="Active Sessions" 
          value={stats?.activeSessions || 0} 
          icon={<Activity className="h-4 w-4 text-emerald-500" />} 
        />
        <StatsCard 
          title="Total Vouchers" 
          value={stats?.totalVouchers || 0} 
          icon={<Ticket className="h-4 w-4 text-muted-foreground" />} 
        />
        <StatsCard 
          title="Used Vouchers" 
          value={stats?.usedVouchers || 0} 
          icon={<Ticket className="h-4 w-4 text-blue-500" />} 
        />
        <StatsCard 
          title="Active Routers" 
          value={stats?.activeRouters || 0} 
          icon={<Wifi className="h-4 w-4 text-emerald-500" />} 
        />
        <StatsCard 
          title="Total Locations" 
          value={stats?.totalLocations || 0} 
          icon={<MapPin className="h-4 w-4 text-muted-foreground" />} 
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 rounded-sm border-border bg-card">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Traffic Analysis</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] flex items-center justify-center border-t border-border bg-muted/10">
            <p className="text-muted-foreground font-mono text-sm">CHART MODULE PENDING</p>
          </CardContent>
        </Card>

        <Card className="col-span-3 rounded-sm border-border bg-card">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent className="border-t border-border p-0">
            <div className="divide-y divide-border">
              <div className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                <div className="h-2 w-2 rounded-full bg-emerald-500"></div>
                <div>
                  <p className="text-sm font-medium">Session Started</p>
                  <p className="text-xs text-muted-foreground">Router: Alpha-1 • 2 mins ago</p>
                </div>
              </div>
              <div className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                <div className="h-2 w-2 rounded-full bg-primary"></div>
                <div>
                  <p className="text-sm font-medium">Voucher Activated</p>
                  <p className="text-xs text-muted-foreground">PKG-1DAY • 15 mins ago</p>
                </div>
              </div>
              <div className="p-4 flex items-center gap-4 hover:bg-muted/50 transition-colors">
                <div className="h-2 w-2 rounded-full bg-destructive"></div>
                <div>
                  <p className="text-sm font-medium">Router Offline</p>
                  <p className="text-xs text-muted-foreground">Beta-HQ • 1 hr ago</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon, subtitle, highlight = false }: { title: string, value: string | number, icon: React.ReactNode, subtitle?: string, highlight?: boolean }) {
  return (
    <Card className={`rounded-sm border-border ${highlight ? 'bg-primary/5 border-primary/20' : 'bg-card'}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className={`text-2xl font-bold font-mono ${highlight ? 'text-primary' : ''}`}>{value}</div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1 font-mono">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}
