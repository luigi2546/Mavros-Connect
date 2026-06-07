import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertCircle, CheckCircle, Clock, Download, Plus, XCircle, Pause, PlayCircle } from "lucide-react";
import { ghs } from "@/lib/currency";

// Helper function for authenticated fetch
async function authenticatedFetch(url: string, options?: RequestInit) {
  const token = localStorage.getItem("mavros_access_token");
  const res = await fetch(url, {
    ...options,
    headers: {
      ...options?.headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

interface Subscription {
  id: number;
  packageName: string;
  status: "active" | "paused" | "cancelled" | "expired";
  billingCycle: "monthly" | "quarterly" | "yearly";
  price: number;
  nextBillingDate: string;
  startDate: string;
  cancelledAt?: string;
}

interface Refund {
  id: number;
  paymentId: number;
  amount: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "processed" | "failed";
  requestedAt: string;
  processedAt?: string;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  total: number;
  status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
  issuedDate: string;
  dueDate?: string;
  paidDate?: string;
}

export default function BillingPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"subscriptions" | "refunds" | "invoices">("subscriptions");
  const [promoCode, setPromoCode] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  // Fetch subscriptions
  const { data: subscriptions, isLoading: loadingSubscriptions, error: errorSubscriptions } = useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => authenticatedFetch("/api/billing/subscriptions"),
  });

  // Fetch refunds
  const { data: refunds, isLoading: loadingRefunds, error: errorRefunds } = useQuery({
    queryKey: ["refunds"],
    queryFn: () => authenticatedFetch("/api/billing/refunds"),
  });

  // Fetch invoices
  const { data: invoices, isLoading: loadingInvoices, error: errorInvoices } = useQuery({
    queryKey: ["invoices"],
    queryFn: () => authenticatedFetch("/api/billing/invoices"),
  });

  // Update subscription status
  const updateSubscriptionMutation = useMutation({
    mutationFn: (data: { id: number; status: string }) =>
      authenticatedFetch(`/api/billing/subscriptions/${data.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: data.status }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });

  // Request refund
  const refundMutation = useMutation({
    mutationFn: (data: { paymentId: number; amount: number; reason: string }) =>
      authenticatedFetch("/api/billing/refunds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refunds"] });
      setRefundAmount("");
      setRefundReason("");
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-emerald-500/10 text-emerald-700";
      case "paused":
        return "bg-amber-500/10 text-amber-700";
      case "cancelled":
      case "failed":
        return "bg-red-500/10 text-red-700";
      case "pending":
        return "bg-blue-500/10 text-blue-700";
      case "approved":
      case "processed":
      case "paid":
        return "bg-emerald-500/10 text-emerald-700";
      default:
        return "bg-gray-500/10 text-gray-700";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
      case "paid":
      case "processed":
        return <CheckCircle className="h-4 w-4 text-emerald-600" />;
      case "paused":
        return <Clock className="h-4 w-4 text-amber-600" />;
      case "pending":
        return <Clock className="h-4 w-4 text-blue-600" />;
      case "cancelled":
      case "failed":
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  const anyError = errorSubscriptions || errorRefunds || errorInvoices;
  if (anyError) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold tracking-tight font-mono uppercase">Billing & Payment</h1>
        <Card className="rounded-sm border-red-500 bg-red-500/10">
          <CardHeader>
            <CardTitle className="text-red-700 font-mono flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Error Loading Billing
            </CardTitle>
          </CardHeader>
          <CardContent className="border-t border-red-500/50">
            <p className="text-sm text-red-700 font-mono">{(anyError as Error)?.message || "Unknown error"}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight font-mono uppercase">Billing & Payment</h1>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-border">
        {["subscriptions", "refunds", "invoices"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 font-mono text-sm uppercase tracking-wider border-b-2 transition-colors ${
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* SUBSCRIPTIONS TAB */}
      {activeTab === "subscriptions" && (
        <div className="space-y-4">
          <Card className="rounded-sm border-border bg-card">
            <CardHeader>
              <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Active Subscriptions</CardTitle>
            </CardHeader>
            <CardContent className="border-t border-border space-y-3">
              {loadingSubscriptions ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : (subscriptions || []).length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground font-mono">No active subscriptions</div>
              ) : (
                (subscriptions || []).map((sub: Subscription) => (
                  <div key={sub.id} className="p-4 border border-border rounded-sm hover:bg-muted/30 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <p className="font-mono font-bold uppercase text-sm">{sub.packageName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{sub.billingCycle.toUpperCase()} BILLING</p>
                      </div>
                      <Badge className={`font-mono text-[10px] ${getStatusColor(sub.status)}`}>
                        {sub.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <p className="text-xs text-muted-foreground font-mono">Price</p>
                        <p className="font-mono font-bold">{ghs(sub.price)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-mono">Next Billing</p>
                        <p className="font-mono text-sm">{new Date(sub.nextBillingDate).toLocaleDateString()}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {sub.status === "active" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateSubscriptionMutation.mutate({ id: sub.id, status: "paused" })}
                          className="h-7 text-xs gap-1 font-mono"
                        >
                          <Pause className="h-3 w-3" />
                          PAUSE
                        </Button>
                      )}
                      {sub.status === "paused" && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => updateSubscriptionMutation.mutate({ id: sub.id, status: "active" })}
                          className="h-7 text-xs gap-1 font-mono"
                        >
                          <PlayCircle className="h-3 w-3" />
                          RESUME
                        </Button>
                      )}
                      {sub.status !== "cancelled" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => updateSubscriptionMutation.mutate({ id: sub.id, status: "cancelled" })}
                          className="h-7 text-xs text-destructive font-mono"
                        >
                          CANCEL
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* REFUNDS TAB */}
      {activeTab === "refunds" && (
        <div className="space-y-4">
          <Card className="rounded-sm border-border bg-card">
            <CardHeader>
              <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Refund Requests</CardTitle>
            </CardHeader>
            <CardContent className="border-t border-border space-y-4">
              {loadingRefunds ? (
                <Skeleton className="h-32 w-full" />
              ) : (refunds || []).length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground font-mono">No refund requests</div>
              ) : (
                (refunds || []).map((refund: Refund) => (
                  <div key={refund.id} className="p-4 border border-border rounded-sm hover:bg-muted/30">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-mono font-bold uppercase text-sm">Refund #{refund.id}</p>
                        <p className="text-xs text-muted-foreground font-mono">{refund.reason}</p>
                      </div>
                      <Badge className={`font-mono text-[10px] ${getStatusColor(refund.status)}`}>
                        {refund.status.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-muted-foreground font-mono">Amount</p>
                        <p className="font-mono font-bold">{ghs(refund.amount)}</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-mono">Requested</p>
                        <p className="font-mono text-sm">{new Date(refund.requestedAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* INVOICES TAB */}
      {activeTab === "invoices" && (
        <div className="space-y-4">
          <Card className="rounded-sm border-border bg-card">
            <CardHeader>
              <CardTitle className="font-mono text-sm uppercase tracking-wider text-muted-foreground">Invoice History</CardTitle>
            </CardHeader>
            <CardContent className="border-t border-border">
              {loadingInvoices ? (
                <Skeleton className="h-64 w-full" />
              ) : (invoices || []).length === 0 ? (
                <div className="text-center py-8 text-sm text-muted-foreground font-mono">No invoices</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border">
                      <tr>
                        <th className="text-left py-2 px-4 font-mono text-xs uppercase text-muted-foreground">Invoice</th>
                        <th className="text-right py-2 px-4 font-mono text-xs uppercase text-muted-foreground">Amount</th>
                        <th className="text-center py-2 px-4 font-mono text-xs uppercase text-muted-foreground">Status</th>
                        <th className="text-center py-2 px-4 font-mono text-xs uppercase text-muted-foreground">Date</th>
                        <th className="text-center py-2 px-4 font-mono text-xs uppercase text-muted-foreground">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {(invoices || []).map((invoice: Invoice) => (
                        <tr key={invoice.id} className="hover:bg-muted/50">
                          <td className="py-2 px-4 font-mono font-medium">{invoice.invoiceNumber}</td>
                          <td className="text-right py-2 px-4 font-mono font-bold">{ghs(invoice.total)}</td>
                          <td className="text-center py-2 px-4">
                            <Badge className={`font-mono text-[10px] ${getStatusColor(invoice.status)}`}>
                              {invoice.status.toUpperCase()}
                            </Badge>
                          </td>
                          <td className="text-center py-2 px-4 font-mono text-xs">{new Date(invoice.issuedDate).toLocaleDateString()}</td>
                          <td className="text-center py-2 px-4">
                            <Button size="sm" variant="ghost" className="h-6 px-2 text-xs gap-1">
                              <Download className="h-3 w-3" />
                              PDF
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
