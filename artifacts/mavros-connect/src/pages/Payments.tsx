import { useState } from "react";
import { useListPayments, getListPaymentsQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ghs } from "@/lib/currency";

export default function Payments() {
  const { data: payments, isLoading } = useListPayments({ query: { queryKey: getListPaymentsQueryKey() } });
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [methodFilter, setMethodFilter] = useState("all");

  const filteredPayments = (payments || []).filter((payment) => {
    const matchesSearch = 
      payment.id.toString().includes(searchTerm) ||
      (payment.reference?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (payment.email?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    const matchesMethod = methodFilter === "all" || payment.method === methodFilter;
    
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-emerald-500 text-white hover:bg-emerald-600';
      case 'pending': return 'bg-amber-500 text-white hover:bg-amber-600';
      case 'failed': return 'bg-destructive text-destructive-foreground';
      case 'refunded': return 'bg-blue-500 text-white';
      default: return 'bg-secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight font-mono uppercase">Transaction Ledger</h1>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end rounded-sm border border-border bg-card p-4">
        <div className="flex-1 space-y-2">
          <label className="text-xs font-mono uppercase text-muted-foreground">Search</label>
          <Input
            placeholder="Search by ID, reference, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="font-mono rounded-sm"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase text-muted-foreground">Status</label>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 font-mono rounded-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase text-muted-foreground">Method</label>
          <Select value={methodFilter} onValueChange={setMethodFilter}>
            <SelectTrigger className="w-40 font-mono rounded-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="paystack">Paystack</SelectItem>
              <SelectItem value="momo">Mobile Money</SelectItem>
              <SelectItem value="card">Card</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="rounded-sm border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-mono text-xs font-semibold uppercase">Tx ID</TableHead>
              <TableHead className="font-mono text-xs font-semibold uppercase">Details</TableHead>
              <TableHead className="font-mono text-xs font-semibold uppercase">Amount</TableHead>
              <TableHead className="font-mono text-xs font-semibold uppercase">Status</TableHead>
              <TableHead className="font-mono text-xs font-semibold uppercase text-right">Timestamp</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center font-mono text-muted-foreground">
                  {payments?.length === 0 ? "NO TRANSACTIONS RECORDED" : "NO MATCHING TRANSACTIONS"}
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((payment) => (
                <TableRow key={payment.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="font-mono text-xs font-medium">{payment.id}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{payment.reference || 'No Ref'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-xs uppercase">{payment.method}</div>
                    <div className="font-mono text-xs text-muted-foreground">{payment.email || 'N/A'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono font-medium">{ghs(payment.amount)}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{payment.currency || 'GHS'}</div>
                  </TableCell>
                  <TableCell>
                    <Badge className={`font-mono uppercase text-[10px] ${getStatusColor(payment.status)}`}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs text-muted-foreground">
                    {new Date(payment.createdAt).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
