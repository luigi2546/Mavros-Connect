import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Wifi, Activity, Zap, Server, BarChart3, Smartphone } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const authenticatedFetch = async (endpoint: string) => {
  const token = localStorage.getItem("mavros_access_token");
  const response = await fetch(`/api${endpoint}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) throw new Error(`Failed to fetch ${endpoint}`);
  return response.json();
};

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case "critical":
      return "bg-red-100 text-red-800";
    case "warning":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-blue-100 text-blue-800";
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "online":
      return "text-emerald-600";
    case "offline":
      return "text-red-600";
    case "degraded":
      return "text-amber-600";
    default:
      return "text-slate-600";
  }
};

export default function NetworkManagement() {
  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ["network-metrics"],
    queryFn: () => authenticatedFetch("/network/metrics"),
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ["network-alerts"],
    queryFn: () => authenticatedFetch("/network/alerts"),
  });

  const { data: health, isLoading: healthLoading } = useQuery({
    queryKey: ["network-health"],
    queryFn: () => authenticatedFetch("/network/health"),
  });

  const { data: devices, isLoading: devicesLoading } = useQuery({
    queryKey: ["network-devices"],
    queryFn: () => authenticatedFetch("/network/devices"),
  });

  const { data: bandwidth, isLoading: bandwidthLoading } = useQuery({
    queryKey: ["network-bandwidth"],
    queryFn: () => authenticatedFetch("/network/bandwidth"),
  });

  const { data: qosConfigs, isLoading: qosLoading } = useQuery({
    queryKey: ["network-qos"],
    queryFn: () => authenticatedFetch("/network/qos"),
  });

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 flex items-center gap-3">
            <Wifi className="w-8 h-8 text-blue-600" />
            Network Management
          </h1>
          <p className="text-slate-600 mt-2">Monitor and manage WiFi network performance, devices, and QoS settings</p>
        </div>

        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <Activity className="w-4 h-4" /> Metrics
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> Alerts
            </TabsTrigger>
            <TabsTrigger value="devices" className="flex items-center gap-2">
              <Smartphone className="w-4 h-4" /> Devices
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-2">
              <Server className="w-4 h-4" /> Health
            </TabsTrigger>
            <TabsTrigger value="bandwidth" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Bandwidth
            </TabsTrigger>
            <TabsTrigger value="qos" className="flex items-center gap-2">
              <Zap className="w-4 h-4" /> QoS
            </TabsTrigger>
          </TabsList>

          {/* Metrics Tab */}
          <TabsContent value="metrics" className="space-y-4">
            {metricsLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-slate-500">Loading metrics...</p>
                </CardContent>
              </Card>
            ) : metrics && metrics.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {metrics.map((metric: any) => (
                  <Card key={metric.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm text-slate-600">Router {metric.routerId}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Uptime:</span>
                        <span className="font-medium">{metric.uptime}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">CPU:</span>
                        <span className="font-medium">{metric.cpuUsage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Memory:</span>
                        <span className="font-medium">{metric.memoryUsage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Connections:</span>
                        <span className="font-medium">{metric.activeConnections}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Latency:</span>
                        <span className="font-medium">{metric.latency}ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Packet Loss:</span>
                        <span className="font-medium">{metric.packetLoss}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Download:</span>
                        <span className="font-medium">{metric.downloadSpeed}Mbps</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Upload:</span>
                        <span className="font-medium">{metric.uploadSpeed}Mbps</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-slate-500">No metrics available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-4">
            {alertsLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-slate-500">Loading alerts...</p>
                </CardContent>
              </Card>
            ) : alerts && alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert: any) => (
                  <Card key={alert.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-slate-900">{alert.alertType.replace(/_/g, " ").toUpperCase()}</h3>
                            <Badge className={getSeverityColor(alert.severity)}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                            {alert.isResolved && (
                              <Badge variant="outline" className="bg-emerald-50">
                                Resolved
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-600 mb-2">{alert.message}</p>
                          <div className="text-xs text-slate-500">
                            Router {alert.routerId} • {new Date(alert.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-slate-500">No alerts</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Devices Tab */}
          <TabsContent value="devices" className="space-y-4">
            {devicesLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-slate-500">Loading devices...</p>
                </CardContent>
              </Card>
            ) : devices && devices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-100 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Device</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Type</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">IP Address</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Signal</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-700">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {devices.map((device: any) => (
                      <tr key={device.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3">{device.deviceName || "Unknown"}</td>
                        <td className="px-4 py-3">
                          <Badge variant="outline">{device.deviceType || "Unknown"}</Badge>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs">{device.ipAddress || "—"}</td>
                        <td className="px-4 py-3">{device.signalStrength || "—"} dBm</td>
                        <td className="px-4 py-3">
                          <Badge className={device.isConnected ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"}>
                            {device.isConnected ? "Connected" : "Offline"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {device.lastActivityAt ? new Date(device.lastActivityAt).toLocaleDateString() : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-slate-500">No devices found</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Health Tab */}
          <TabsContent value="health" className="space-y-4">
            {healthLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-slate-500">Loading health history...</p>
                </CardContent>
              </Card>
            ) : health && health.length > 0 ? (
              <div className="space-y-3">
                {health.slice(0, 20).map((record: any) => (
                  <Card key={record.id}>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-slate-900">Router {record.routerId}</h3>
                          <p className="text-sm text-slate-600">{record.reason || "Status change"}</p>
                        </div>
                        <Badge className={`${getStatusColor(record.status)} border`}>
                          {record.status.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="mt-3 text-xs text-slate-500">
                        {new Date(record.startTime).toLocaleDateString()} to{" "}
                        {record.endTime ? new Date(record.endTime).toLocaleDateString() : "Present"}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-slate-500">No health history available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Bandwidth Tab */}
          <TabsContent value="bandwidth" className="space-y-4">
            {bandwidthLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-slate-500">Loading bandwidth data...</p>
                </CardContent>
              </Card>
            ) : bandwidth && bandwidth.length > 0 ? (
              <div className="space-y-3">
                {bandwidth.map((record: any) => (
                  <Card key={record.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Router {record.routerId}</CardTitle>
                      <CardDescription>
                        {new Date(record.periodStart).toLocaleDateString()} to{" "}
                        {new Date(record.periodEnd).toLocaleDateString()}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Total:</span>
                        <span className="font-medium">{record.totalBytes} bytes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Download:</span>
                        <span className="font-medium">{record.downloadBytes} bytes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Upload:</span>
                        <span className="font-medium">{record.uploadBytes} bytes</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Peak Download:</span>
                        <span className="font-medium">{record.peakDownload} Mbps</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Peak Upload:</span>
                        <span className="font-medium">{record.peakUpload} Mbps</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-slate-500">No bandwidth data available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* QoS Tab */}
          <TabsContent value="qos" className="space-y-4">
            {qosLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-slate-500">Loading QoS configurations...</p>
                </CardContent>
              </Card>
            ) : qosConfigs && qosConfigs.length > 0 ? (
              <div className="space-y-3">
                {qosConfigs.map((config: any) => (
                  <Card key={config.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">Router {config.routerId}</CardTitle>
                        <Badge className={config.isActive ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-800"}>
                          {config.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                      <CardDescription>{config.description || "No description"}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-600">Priority:</span>
                        <span className="font-medium capitalize">{config.priorityLevel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-600">Bandwidth Limit:</span>
                        <span className="font-medium">{config.bandwidthLimit ? `${config.bandwidthLimit} Mbps` : "Unlimited"}</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-slate-500">No QoS configurations</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
