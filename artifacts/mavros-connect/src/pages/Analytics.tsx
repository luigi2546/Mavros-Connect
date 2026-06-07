import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { TrendingUp, Zap, AlertCircle, Clock } from "lucide-react";
import { ghs } from "@/lib/currency";

export default function Analytics() {
  const { data: topPackages, isLoading: loadingPackages } = useQuery({
    queryKey: ["topPackages"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/top-packages");
      return res.json();
    },
  });

  const { data: sessionStats, isLoading: loadingSessionStats } = useQuery({
    queryKey: ["sessionStats"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/session-stats");
      return res.json();
    },
  });

  const { data: routerHealth, isLoading: loadingRouterHealth } = useQuery({
    queryKey: ["routerHealth"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/router-health");
      return res.json();
    },
  });

  const { data: expiringVouchers, isLoading: loadingVouchers } = useQuery({
    queryKey: ["expiringVouchers"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/expiring-vouchers");
      return res.json();
    },
  });

  const { data: packagePerformance, isLoading: loadingPerformance } = useQuery({
    queryKey: ["packagePerformance"],
    queryFn: async () => {
      const res = await fetch("/api/analytics/package-performance");
      return res.json();
    },
  });

  const colors = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight font-mono uppercase">Analytics</h1>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Avg Session Duration"
          value={sessionStats ? `${Math.round(sessionStats.avgSessionDuration / 60)} min` : "-"}
          icon={<Clock className="h-4 w-4 text-primary" />}
          isLoading={loadingSessionStats}
        />
        <StatCard
          title="Total Data Used"
          value={sessionStats ? `${sessionStats.totalDataUsed?.toFixed(2)} MB` : "-"}
          icon={<Zap className="h-4 w-4 text-emerald-500" />}
          isLoading={loadingSessionStats}
        />
        <StatCard
          title="Total Sessions"
          value={sessionStats?.totalSessions || 0}
          icon={<TrendingUp className="h-4 w-4 text-blue-500" />}
          isLoading={loadingSessionStats}
        />
        <StatCard
          title="Offline Routers"
          value={routerHealth?.filter((r: any) => r.status === "offline").length || 0}
          icon={<AlertCircle className="h-4 w-4 text-red-500" />}
          isLoading={loadingRouterHealth}
        />
      </div>

      {/* Top Packages by Sales */}
      <Card className="rounded-sm border-border bg-card">
        <CardHeader>
          <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Top Packages by Sales</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] p-4 border-t border-border">
          {loadingPackages ? (
            <Skeleton className="h-full w-full" />
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topPackages || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="packageName" stroke="var(--color-muted-foreground)" style={{ fontSize: "12px" }} />
                <YAxis stroke="var(--color-muted-foreground)" style={{ fontSize: "12px" }} />
                <Tooltip contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }} />
                <Legend />
                <Bar dataKey="usedCount" fill="var(--color-primary)" name="Used" />
                <Bar dataKey="generatedCount" fill="var(--color-muted-foreground)" name="Generated" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Router Health & Expiring Vouchers */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-sm border-border bg-card">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Router Health</CardTitle>
          </CardHeader>
          <CardContent className="border-t border-border p-0">
            {loadingRouterHealth ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="divide-y divide-border max-h-64 overflow-y-auto">
                {(routerHealth || []).map((router: any) => (
                  <div key={router.id} className="p-4 flex items-center justify-between hover:bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">{router.name}</p>
                      <p className="text-xs text-muted-foreground">{router.activeSessions} active sessions</p>
                    </div>
                    <div className={`px-2 py-1 rounded text-xs font-mono ${router.status === "online" ? "bg-emerald-500/20 text-emerald-700" : "bg-red-500/20 text-red-700"}`}>
                      {router.status.toUpperCase()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-sm border-border bg-card">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Expiring Vouchers (7 days)</CardTitle>
          </CardHeader>
          <CardContent className="border-t border-border p-0">
            {loadingVouchers ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <div className="divide-y divide-border max-h-64 overflow-y-auto">
                {(expiringVouchers || []).length > 0 ? (
                  (expiringVouchers || []).map((voucher: any) => (
                    <div key={voucher.id} className="p-4 flex items-center justify-between hover:bg-muted/50">
                      <div>
                        <p className="text-sm font-mono font-medium">{voucher.code}</p>
                        <p className="text-xs text-muted-foreground">{voucher.packageName}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-xs font-mono font-bold ${Number(voucher.daysUntilExpiry) <= 1 ? "text-red-600" : "text-amber-600"}`}>
                          {Math.ceil(Number(voucher.daysUntilExpiry))} days
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-sm text-muted-foreground">No expiring vouchers</div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Package Performance */}
      <Card className="rounded-sm border-border bg-card">
        <CardHeader>
          <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Package Performance (Last 30 days)</CardTitle>
        </CardHeader>
        <CardContent className="border-t border-border">
          {loadingPerformance ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left py-2 px-4 font-mono text-xs uppercase text-muted-foreground">Package</th>
                    <th className="text-center py-2 px-4 font-mono text-xs uppercase text-muted-foreground">Generated</th>
                    <th className="text-center py-2 px-4 font-mono text-xs uppercase text-muted-foreground">Used</th>
                    <th className="text-center py-2 px-4 font-mono text-xs uppercase text-muted-foreground">Conversion</th>
                    <th className="text-right py-2 px-4 font-mono text-xs uppercase text-muted-foreground">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(packagePerformance || []).map((pkg: any) => (
                    <tr key={pkg.packageId} className="hover:bg-muted/50">
                      <td className="py-2 px-4 font-medium">{pkg.packageName}</td>
                      <td className="text-center py-2 px-4">{pkg.totalVouchers}</td>
                      <td className="text-center py-2 px-4">{pkg.usedVouchers}</td>
                      <td className="text-center py-2 px-4">{pkg.conversionRate}%</td>
                      <td className="text-right py-2 px-4 font-mono">{ghs(pkg.revenue || 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value, icon, isLoading }: { title: string; value: string | number; icon: React.ReactNode; isLoading: boolean }) {
  return (
    <Card className="rounded-sm border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <p className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{title}</p>
        {icon}
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-8 w-24" /> : <p className="text-2xl font-bold font-mono">{value}</p>}
      </CardContent>
    </Card>
  );
}
