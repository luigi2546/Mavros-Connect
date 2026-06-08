import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Target,
  Users,
  DollarSign,
  Zap,
  Eye,
  Award,
} from "lucide-react";
import { authenticatedFetch } from "@/utils/authenticatedFetch";

interface Report {
  id: number;
  reportName: string;
  reportType: string;
  generatedAt: string;
}

interface Metric {
  id: number;
  metricName: string;
  category: string;
  value: number;
  status: string;
  trend: string;
}

interface CustomerInsight {
  id: number;
  segmentName: string;
  churnRisk: string;
  lifetime: number;
}

interface RevenueSummary {
  id: number;
  totalRevenue: number;
  netRevenue: number;
  transactionCount: number;
}

interface OperationalMetric {
  id: number;
  systemUptime: number;
  customerSatisfaction: number;
  bugCount: number;
}

interface Forecast {
  id: number;
  forecastType: string;
  confidenceLevel: number;
  startDate: string;
}

interface Trend {
  id: number;
  trendName: string;
  impact: string;
  relevance: number;
}

interface BusinessGoal {
  id: number;
  goalName: string;
  currentValue: number;
  targetValue: number;
  progress: number;
  status: string;
}

export default function BusinessFeatures() {
  const { data: reports = [] } = useQuery({
    queryKey: ["business-reports"],
    queryFn: async () => {
      const response = await authenticatedFetch("/api/business/reports");
      return response.json();
    },
    select: (data: unknown) => Array.isArray(data) ? data : [],
  });

  const { data: metrics = [] } = useQuery({
    queryKey: ["business-metrics"],
    queryFn: async () => {
      const response = await authenticatedFetch("/api/business/metrics");
      return response.json();
    },
    select: (data: unknown) => Array.isArray(data) ? data : [],
  });

  const { data: insights = [] } = useQuery({
    queryKey: ["customer-insights"],
    queryFn: async () => {
      const response = await authenticatedFetch("/api/business/insights");
      return response.json();
    },
    select: (data: unknown) => Array.isArray(data) ? data : [],
  });

  const { data: revenue = [] } = useQuery({
    queryKey: ["revenue-summary"],
    queryFn: async () => {
      const response = await authenticatedFetch("/api/business/revenue");
      return response.json();
    },
    select: (data: unknown) => Array.isArray(data) ? data : [],
  });

  const { data: operational = [] } = useQuery({
    queryKey: ["operational-metrics"],
    queryFn: async () => {
      const response = await authenticatedFetch("/api/business/operational");
      return response.json();
    },
    select: (data: unknown) => Array.isArray(data) ? data : [],
  });

  const { data: forecasts = [] } = useQuery({
    queryKey: ["forecasts"],
    queryFn: async () => {
      const response = await authenticatedFetch("/api/business/forecasts");
      return response.json();
    },
    select: (data: unknown) => Array.isArray(data) ? data : [],
  });

  const { data: trends = [] } = useQuery({
    queryKey: ["market-trends"],
    queryFn: async () => {
      const response = await authenticatedFetch("/api/business/trends");
      return response.json();
    },
    select: (data: unknown) => Array.isArray(data) ? data : [],
  });

  const { data: goals = [] } = useQuery({
    queryKey: ["business-goals"],
    queryFn: async () => {
      const response = await authenticatedFetch("/api/business/goals");
      return response.json();
    },
    select: (data: unknown) => Array.isArray(data) ? data : [],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "on-track":
        return "bg-green-100 text-green-800";
      case "at-risk":
        return "bg-orange-100 text-orange-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high":
        return "text-red-600";
      case "medium":
        return "text-orange-600";
      case "low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="w-full space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Business Features</h1>
        <p className="text-gray-500 mt-2">Analytics, reports, forecasts, and business intelligence</p>
      </div>

      <Tabs defaultValue="metrics" className="w-full">
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="metrics" className="flex items-center gap-1">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Metrics</span>
          </TabsTrigger>
          <TabsTrigger value="revenue" className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            <span className="hidden sm:inline">Revenue</span>
          </TabsTrigger>
          <TabsTrigger value="goals" className="flex items-center gap-1">
            <Target className="w-4 h-4" />
            <span className="hidden sm:inline">Goals</span>
          </TabsTrigger>
          <TabsTrigger value="forecasts" className="flex items-center gap-1">
            <TrendingUp className="w-4 h-4" />
            <span className="hidden sm:inline">Forecast</span>
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-1">
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Insights</span>
          </TabsTrigger>
          <TabsTrigger value="operational" className="flex items-center gap-1">
            <Zap className="w-4 h-4" />
            <span className="hidden sm:inline">Ops</span>
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-1">
            <Award className="w-4 h-4" />
            <span className="hidden sm:inline">Trends</span>
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-1">
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Reports</span>
          </TabsTrigger>
        </TabsList>

        {/* METRICS TAB */}
        <TabsContent value="metrics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              {metrics.length === 0 ? (
                <p className="text-gray-500">No metrics found</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {metrics.map((metric: Metric) => (
                    <Card key={metric.id} className="bg-gradient-to-br from-slate-50 to-slate-100">
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <p className="font-semibold text-sm">{metric.metricName}</p>
                          <p className="text-2xl font-bold text-blue-600">{metric.value}</p>
                          <div className="flex justify-between items-center text-xs">
                            <Badge variant="outline">{metric.category}</Badge>
                            <Badge className={`${getStatusColor(metric.status)}`}>
                              {metric.status}
                            </Badge>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* REVENUE TAB */}
        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {revenue.length === 0 ? (
                <p className="text-gray-500">No revenue data found</p>
              ) : (
                <div className="space-y-3">
                  {revenue.map((rev: RevenueSummary) => (
                    <Card key={rev.id} className="bg-green-50">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs font-medium text-gray-600">Total Revenue</p>
                            <p className="text-lg font-bold text-green-600">
                              ${parseFloat(rev.totalRevenue?.toString() || "0").toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-600">Net Revenue</p>
                            <p className="text-lg font-bold text-green-700">
                              ${parseFloat(rev.netRevenue?.toString() || "0").toFixed(2)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-600">Transactions</p>
                            <p className="text-lg font-bold text-green-600">{rev.transactionCount}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* GOALS TAB */}
        <TabsContent value="goals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Goals</CardTitle>
            </CardHeader>
            <CardContent>
              {goals.length === 0 ? (
                <p className="text-gray-500">No goals found</p>
              ) : (
                <div className="space-y-3">
                  {goals.map((goal: BusinessGoal) => (
                    <Card key={goal.id} className="bg-blue-50">
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <p className="font-semibold">{goal.goalName}</p>
                              <p className="text-xs text-gray-600">
                                {parseFloat(goal.currentValue?.toString() || "0").toFixed(1)} / {parseFloat(goal.targetValue?.toString() || "0").toFixed(1)}
                              </p>
                            </div>
                            <Badge className={getStatusColor(goal.status)}>
                              {goal.status}
                            </Badge>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full"
                              style={{
                                width: `${Math.min(
                                  (parseFloat(goal.progress?.toString() || "0") * 100),
                                  100
                                )}%`,
                              }}
                            />
                          </div>
                          <p className="text-xs text-gray-600">
                            Progress: {Math.round(parseFloat(goal.progress?.toString() || "0") * 100)}%
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* FORECASTS TAB */}
        <TabsContent value="forecasts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Forecasts</CardTitle>
            </CardHeader>
            <CardContent>
              {forecasts.length === 0 ? (
                <p className="text-gray-500">No forecasts found</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {forecasts.map((forecast: Forecast) => (
                    <Card key={forecast.id} className="bg-purple-50">
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <p className="font-semibold">{forecast.forecastType}</p>
                            <Badge variant="outline">
                              {Math.round(parseFloat(forecast.confidenceLevel?.toString() || "0"))}% Confidence
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600">
                            {new Date(forecast.startDate).toLocaleDateString()} onwards
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* INSIGHTS TAB */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Insights</CardTitle>
            </CardHeader>
            <CardContent>
              {insights.length === 0 ? (
                <p className="text-gray-500">No insights found</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.map((insight: CustomerInsight) => (
                    <Card key={insight.id} className="bg-indigo-50">
                      <CardContent className="pt-4">
                        <div className="space-y-2">
                          <div className="flex justify-between items-start">
                            <p className="font-semibold">{insight.segmentName}</p>
                            <Badge
                              variant={
                                insight.churnRisk === "high"
                                  ? "destructive"
                                  : insight.churnRisk === "medium"
                                    ? "secondary"
                                    : "default"
                              }
                            >
                              {insight.churnRisk} Churn
                            </Badge>
                          </div>
                          <p className="text-sm font-bold text-indigo-600">
                            LTV: ${parseFloat(insight.lifetime?.toString() || "0").toFixed(2)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* OPERATIONAL TAB */}
        <TabsContent value="operational" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Operational Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              {operational.length === 0 ? (
                <p className="text-gray-500">No operational data found</p>
              ) : (
                <div className="space-y-3">
                  {operational.map((op: OperationalMetric) => (
                    <Card key={op.id} className="bg-yellow-50">
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs font-medium text-gray-600">Uptime</p>
                            <p className="text-lg font-bold text-orange-600">
                              {parseFloat(op.systemUptime?.toString() || "0").toFixed(1)}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-600">Satisfaction</p>
                            <p className="text-lg font-bold text-blue-600">
                              {parseFloat(op.customerSatisfaction?.toString() || "0").toFixed(1)}/5
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-600">Bugs</p>
                            <p className="text-lg font-bold text-red-600">{op.bugCount}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TRENDS TAB */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Market Trends</CardTitle>
            </CardHeader>
            <CardContent>
              {trends.length === 0 ? (
                <p className="text-gray-500">No trends found</p>
              ) : (
                <div className="space-y-3">
                  {trends.map((trend: Trend) => (
                    <Card key={trend.id} className="bg-gray-50">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <p className="font-semibold">{trend.trendName}</p>
                            <p className={`text-sm font-bold ${getImpactColor(trend.impact)}`}>
                              Impact: {trend.impact}
                            </p>
                          </div>
                          <Badge variant="outline">
                            {Math.round(parseFloat(trend.relevance?.toString() || "0"))}% Relevant
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* REPORTS TAB */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Business Reports</CardTitle>
            </CardHeader>
            <CardContent>
              {reports.length === 0 ? (
                <p className="text-gray-500">No reports found</p>
              ) : (
                <div className="space-y-3">
                  {reports.map((report: Report) => (
                    <Card key={report.id} className="bg-gray-50">
                      <CardContent className="pt-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold">{report.reportName}</p>
                            <p className="text-xs text-gray-600">
                              {new Date(report.generatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          <Badge variant="outline">{report.reportType}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
