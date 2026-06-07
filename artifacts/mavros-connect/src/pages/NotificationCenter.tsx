import { useEffect, useState } from "react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, Info, Trash2, Bell } from "lucide-react";

interface Notification {
  id: number;
  type: string;
  status: "unread" | "read" | "archived";
  title: string;
  message: string;
  icon?: string;
  createdAt: string;
}

export default function Notifications() {
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState({
    paymentNotifications: true,
    voucherNotifications: true,
    routerAlerts: true,
    emailNotifications: true,
  });

  const { data: notifications, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications?limit=50");
      return res.json();
    },
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: prefs, isLoading: prefsLoading } = useQuery({
    queryKey: ["notificationPreferences"],
    queryFn: async () => {
      const res = await fetch("/api/notification-preferences");
      return res.json();
    },
  });

  useEffect(() => {
    if (prefs) {
      setPreferences({
        paymentNotifications: prefs.paymentNotifications ?? true,
        voucherNotifications: prefs.voucherNotifications ?? true,
        routerAlerts: prefs.routerAlerts ?? true,
        emailNotifications: prefs.emailNotifications ?? true,
      });
    }
  }, [prefs]);

  const markAsReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/notifications/mark-all-read", { method: "POST" });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`/api/notifications/${id}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (prefs: typeof preferences) => {
      const res = await fetch("/api/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(prefs),
      });
      return res.json();
    },
  });

  const getIcon = (type: string) => {
    switch (type) {
      case "payment_success":
      case "payment_failed":
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case "router_offline":
      case "system_alert":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  const getBadgeColor = (type: string) => {
    switch (type) {
      case "payment_success":
        return "bg-emerald-500/10 text-emerald-700";
      case "payment_failed":
        return "bg-red-500/10 text-red-700";
      case "router_offline":
      case "system_alert":
        return "bg-red-500/10 text-red-700";
      case "voucher_expiring":
        return "bg-amber-500/10 text-amber-700";
      default:
        return "bg-blue-500/10 text-blue-700";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight font-mono uppercase">Notifications</h1>
        {(notifications || []).some((n: Notification) => n.status === "unread") && (
          <Button onClick={() => markAllReadMutation.mutate()} className="font-bold uppercase font-mono text-xs tracking-wider rounded-sm">
            Mark All Read
          </Button>
        )}
      </div>

      {/* Notification Center */}
      <Card className="rounded-sm border-border bg-card">
        <CardHeader>
          <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Recent Alerts</CardTitle>
        </CardHeader>
        <CardContent className="border-t border-border space-y-3 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (notifications || []).length === 0 ? (
            <div className="text-center py-8">
              <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="text-sm text-muted-foreground font-mono">NO NOTIFICATIONS</p>
            </div>
          ) : (
            (notifications || []).map((notif: Notification) => (
              <div
                key={notif.id}
                className={`p-3 rounded border ${
                  notif.status === "unread" ? "border-primary/30 bg-primary/5" : "border-border bg-muted/20"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="mt-0.5">{getIcon(notif.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-mono text-xs font-bold uppercase text-foreground">{notif.title}</p>
                        <Badge className={`font-mono text-[10px] ${getBadgeColor(notif.type)}`}>{notif.type}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 break-words">{notif.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-2">
                        {new Date(notif.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {notif.status === "unread" && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markAsReadMutation.mutate(notif.id)}
                        className="h-7 px-2 text-xs"
                      >
                        ✓
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(notif.id)}
                      className="h-7 px-2 text-xs text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Notification Preferences */}
      <Card className="rounded-sm border-border bg-card">
        <CardHeader>
          <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Alert Preferences</CardTitle>
        </CardHeader>
        <CardContent className="border-t border-border space-y-4">
          {prefsLoading ? (
            <Skeleton className="h-40 w-full" />
          ) : (
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.paymentNotifications}
                  onChange={(e) => {
                    const updated = { ...preferences, paymentNotifications: e.target.checked };
                    setPreferences(updated);
                    updatePreferencesMutation.mutate(updated);
                  }}
                  className="rounded"
                />
                <div>
                  <p className="font-mono text-xs font-semibold uppercase">Payment Notifications</p>
                  <p className="text-xs text-muted-foreground">Alerts for successful and failed payments</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.voucherNotifications}
                  onChange={(e) => {
                    const updated = { ...preferences, voucherNotifications: e.target.checked };
                    setPreferences(updated);
                    updatePreferencesMutation.mutate(updated);
                  }}
                  className="rounded"
                />
                <div>
                  <p className="font-mono text-xs font-semibold uppercase">Voucher Alerts</p>
                  <p className="text-xs text-muted-foreground">Expiring voucher reminders</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.routerAlerts}
                  onChange={(e) => {
                    const updated = { ...preferences, routerAlerts: e.target.checked };
                    setPreferences(updated);
                    updatePreferencesMutation.mutate(updated);
                  }}
                  className="rounded"
                />
                <div>
                  <p className="font-mono text-xs font-semibold uppercase">Router Alerts</p>
                  <p className="text-xs text-muted-foreground">Critical router status changes</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={(e) => {
                    const updated = { ...preferences, emailNotifications: e.target.checked };
                    setPreferences(updated);
                    updatePreferencesMutation.mutate(updated);
                  }}
                  className="rounded"
                />
                <div>
                  <p className="font-mono text-xs font-semibold uppercase">Email Notifications</p>
                  <p className="text-xs text-muted-foreground">Send alerts to registered email address</p>
                </div>
              </label>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
