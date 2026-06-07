import { useListPayments, getListPaymentsQueryKey } from "@workspace/api-client-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ghs } from "@/lib/currency";

export default function Payments() {
  const { data: payments, isLoading } = useListPayments({ query: { queryKey: getListPaymentsQueryKey() } });

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
            ) : payments?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center font-mono text-muted-foreground">
                  NO TRANSACTIONS RECORDED
                </TableCell>
              </TableRow>
            ) : (
              payments?.map((payment) => (
                <TableRow key={payment.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="font-mono text-xs font-medium">{payment.id}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{payment.reference || 'No Ref'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-xs uppercase">{payment.method}</div>
                    <div className="font-mono text-xs text-muted-foreground">PKG-{payment.packageId}</div>
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
