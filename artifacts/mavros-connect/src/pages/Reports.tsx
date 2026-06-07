import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";
import { Download, FileText, AlertCircle } from "lucide-react";
import { ghs } from "@/lib/currency";

// Helper function for authenticated fetch
async function authenticatedFetch(url: string) {
  const token = localStorage.getItem("mavros_access_token");
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export default function Reports() {
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly">("daily");

  const { data: revenueTrends, isLoading: loadingTrends, error: errorTrends } = useQuery({
    queryKey: ["revenueTrends", period],
    queryFn: () => authenticatedFetch(`/api/analytics/revenue-trends/${period}`),
  });

  const { data: conversionRates, isLoading: loadingConversion, error: errorConversion } = useQuery({
    queryKey: ["conversionRates"],
    queryFn: () => authenticatedFetch("/api/analytics/conversion-rates"),
  });

  const { data: peakUsage, isLoading: loadingPeakUsage, error: errorPeakUsage } = useQuery({
    queryKey: ["peakUsage"],
    queryFn: () => authenticatedFetch("/api/analytics/peak-usage-hours"),
  });

  const { data: forecast, isLoading: loadingForecast, error: errorForecast } = useQuery({
    queryKey: ["revenueForecast"],
    queryFn: () => authenticatedFetch("/api/analytics/revenue-forecast"),
  });

  // Check for errors
  const anyError = errorTrends || errorConversion || errorPeakUsage || errorForecast;
  if (anyError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight font-mono uppercase">Reports</h1>
        <Card className="rounded-sm border-red-500 bg-red-500/10">
          <CardHeader>
            <CardTitle className="text-red-700 font-mono flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error Loading Reports
            </CardTitle>
          </CardHeader>
          <CardContent className="border-t border-red-500/50">
            <p className="text-sm text-red-700 font-mono">{(anyError as Error)?.message || "Unknown error"}</p>
            <p className="text-xs text-red-600 mt-2 font-mono">Check your authentication and backend logs</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Safe data access with fallbacks
  const safeTrends = revenueTrends || [];
  const safeConversion = conversionRates || [];
  const safePeakUsage = peakUsage || [];
  const safeForecast = forecast || [];

  const handlePDFDownload = () => {
    // Simple PDF generation using HTML to PDF
    const content = `
      <h1>Mavros-Connect Analytics Report</h1>
      <p>Generated: ${new Date().toLocaleDateString()}</p>
      
      <h2>Revenue Trends (${period})</h2>
      ${safeTrends.map((d: any) => `<p>${d.period}: ${ghs(d.revenue || 0)}</p>`).join("")}
      
      <h2>Top Conversion Rates</h2>
      ${safeConversion.slice(0, 5).map((d: any) => `<p>${d.packageName}: ${d.conversionRate}%</p>`).join("")}
      
      <h2>Peak Usage Hours</h2>
      ${safePeakUsage.slice(0, 5).map((d: any) => `<p>Hour ${d.hour}: ${d.totalSessions} sessions</p>`).join("")}
    `;

    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(content);
      newWindow.document.close();
      newWindow.print();
    }
  };

  const combinedForecastData = [
    ...(safeForecast?.historical || safeForecast || []),
    ...(safeForecast?.forecast || []),
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight font-mono uppercase">Reports & Forecasting</h1>
        <Button onClick={handlePDFDownload} className="font-bold uppercase font-mono text-xs tracking-wider rounded-sm gap-2">
          <FileText className="h-4 w-4" /> Download Report
        </Button>
      </div>

      {/* Revenue Trends */}
      <Card className="rounded-sm border-border bg-card">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Revenue Trends</CardTitle>
          <Select value={period} onValueChange={(v: any) => setPeriod(v)}>
            <SelectTrigger className="w-32 font-mono rounded-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="h-[350px] p-4 border-t border-border">
          {loadingTrends ? (
            <Skeleton className="h-full w-full" />
          ) : safeTrends.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground font-mono">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={safeTrends}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="period" stroke="var(--color-muted-foreground)" style={{ fontSize: "12px" }} />
                <YAxis stroke="var(--color-muted-foreground)" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
                  formatter={(value: number) => ghs(value)}
                />
                <Area type="monotone" dataKey="revenue" stroke="var(--color-primary)" fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Conversion Rates & Peak Usage */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="rounded-sm border-border bg-card">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Conversion Rates by Package</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] p-4 border-t border-border">
            {loadingConversion ? (
              <Skeleton className="h-full w-full" />
            ) : safeConversion.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground font-mono">No conversion data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={safeConversion}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="packageName" stroke="var(--color-muted-foreground)" style={{ fontSize: "11px" }} />
                  <YAxis stroke="var(--color-muted-foreground)" style={{ fontSize: "12px" }} label={{ value: "%", angle: -90, position: "insideLeft" }} />
                  <Tooltip contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }} formatter={(v: any) => `${v || 0}%`} />
                  <Bar dataKey="conversionRate" fill="var(--color-primary)" name="Conversion Rate %" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-sm border-border bg-card">
          <CardHeader>
            <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Peak Usage Hours</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] p-4 border-t border-border">
            {loadingPeakUsage ? (
              <Skeleton className="h-full w-full" />
            ) : safePeakUsage.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground font-mono">No usage data</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={safePeakUsage}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="hour" stroke="var(--color-muted-foreground)" style={{ fontSize: "12px" }} label={{ value: "Hour of Day", position: "insideBottomRight", offset: -5 }} />
                  <YAxis stroke="var(--color-muted-foreground)" style={{ fontSize: "12px" }} />
                  <Tooltip contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }} />
                  <Bar dataKey="totalSessions" fill="var(--color-emerald-500)" name="Sessions" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Revenue Forecast */}
      <Card className="rounded-sm border-border bg-card">
        <CardHeader>
          <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">30-Day Revenue Forecast</CardTitle>
        </CardHeader>
        <CardContent className="h-[350px] p-4 border-t border-border">
          {loadingForecast ? (
            <Skeleton className="h-full w-full" />
          ) : combinedForecastData.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground font-mono">No forecast data</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={combinedForecastData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="date" stroke="var(--color-muted-foreground)" style={{ fontSize: "12px" }} />
                <YAxis stroke="var(--color-muted-foreground)" style={{ fontSize: "12px" }} />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
                  formatter={(value: number) => ghs(value)}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  dot={false}
                  name="Historical"
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="var(--color-primary)"
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={false}
                  name="Forecast"
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      {/* Conversion Rate Details Table */}
      <Card className="rounded-sm border-border bg-card">
        <CardHeader>
          <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Detailed Conversion Metrics</CardTitle>
        </CardHeader>
        <CardContent className="border-t border-border">
          {loadingConversion ? (
            <Skeleton className="h-64 w-full" />
          ) : safeConversion.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground font-mono">No conversion data available</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr>
                    <th className="text-left py-2 px-4 font-mono text-xs uppercase text-muted-foreground">Package</th>
                    <th className="text-center py-2 px-4 font-mono text-xs uppercase text-muted-foreground">Generated</th>
                    <th className="text-center py-2 px-4 font-mono text-xs uppercase text-muted-foreground">Converted</th>
                    <th className="text-center py-2 px-4 font-mono text-xs uppercase text-muted-foreground">Conversion Rate</th>
                    <th className="text-center py-2 px-4 font-mono text-xs uppercase text-muted-foreground">Avg Time to Convert</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {safeConversion.map((pkg: any) => (
                    <tr key={pkg.packageId} className="hover:bg-muted/50">
                      <td className="py-2 px-4 font-medium">{pkg.packageName || "Unknown"}</td>
                      <td className="text-center py-2 px-4">{pkg.generatedVouchers || 0}</td>
                      <td className="text-center py-2 px-4">{pkg.usedVouchers || 0}</td>
                      <td className="text-center py-2 px-4 font-bold text-primary">{pkg.conversionRate || 0}%</td>
                      <td className="text-center py-2 px-4 font-mono text-xs text-muted-foreground">{pkg.avgTimeToConversion ? `${Math.round(pkg.avgTimeToConversion)}h` : "N/A"}</td>
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
