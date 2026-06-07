import { useState } from "react";
import { useListVouchers, getListVouchersQueryKey, useCreateVoucher, useBulkCreateVouchers, useDeleteVoucher } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Ticket, Copy, Trash2, Printer } from "lucide-react";

export default function Vouchers() {
  const { data: vouchers, isLoading } = useListVouchers({ query: { queryKey: getListVouchersQueryKey() } });
  const [isSingleDialogOpen, setIsSingleDialogOpen] = useState(false);
  const [isBulkDialogOpen, setIsBulkDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteVoucher();

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to revoke this voucher?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: "Voucher Revoked", description: "The voucher has been cancelled." });
      queryClient.invalidateQueries({ queryKey: getListVouchersQueryKey() });
    } catch (error: any) {
      toast({ title: "Revoke Error", description: error?.message || "Failed to revoke voucher", variant: "destructive" });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: "Voucher code copied to clipboard." });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-500 text-white hover:bg-emerald-600';
      case 'unused': return 'bg-blue-500 text-white hover:bg-blue-600';
      case 'used': return 'bg-muted-foreground text-white';
      case 'expired': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-secondary';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight font-mono uppercase">Voucher Management</h1>
        <div className="flex gap-2">
          <BulkGenerateDialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen} />
          <GenerateDialog open={isSingleDialogOpen} onOpenChange={setIsSingleDialogOpen} />
        </div>
      </div>

      <div className="rounded-sm border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-mono text-xs font-semibold uppercase">Code</TableHead>
              <TableHead className="font-mono text-xs font-semibold uppercase">Package ID</TableHead>
              <TableHead className="font-mono text-xs font-semibold uppercase">Status</TableHead>
              <TableHead className="font-mono text-xs font-semibold uppercase">Details</TableHead>
              <TableHead className="font-mono text-xs font-semibold uppercase text-right">Actions</TableHead>
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
            ) : vouchers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center font-mono text-muted-foreground">
                  NO VOUCHERS GENERATED
                </TableCell>
              </TableRow>
            ) : (
              vouchers?.map((voucher) => (
                <TableRow key={voucher.id} className="hover:bg-muted/30">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold tracking-widest text-lg">{voucher.code}</span>
                      <button onClick={() => copyToClipboard(voucher.code)} className="text-muted-foreground hover:text-foreground transition-colors">
                        <Copy className="h-4 w-4" />
                      </button>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">PKG-{voucher.packageId}</TableCell>
                  <TableCell>
                    <Badge className={`font-mono uppercase text-[10px] ${getStatusColor(voucher.status)}`}>
                      {voucher.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-[10px] text-muted-foreground">
                      {voucher.usedAt && <div>Used: {new Date(voucher.usedAt).toLocaleString()}</div>}
                      {voucher.expiresAt && <div>Exp: {new Date(voucher.expiresAt).toLocaleString()}</div>}
                      {voucher.usedByMac && <div>MAC: {voucher.usedByMac}</div>}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" className="font-mono text-xs">
                        <Printer className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(voucher.id)} className="text-destructive font-mono text-xs">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
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

function GenerateDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [packageId, setPackageId] = useState("");
  const [locationId, setLocationId] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateVoucher();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({ 
        data: { 
          packageId: parseInt(packageId),
          locationId: locationId ? parseInt(locationId) : undefined
        } 
      });
      queryClient.invalidateQueries({ queryKey: getListVouchersQueryKey() });
      toast({ title: "Voucher Generated", description: "New access code is ready." });
      onOpenChange(false);
      setPackageId(""); setLocationId("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Generation Failed", description: error?.message || "Error creating voucher." });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="outline" className="font-bold uppercase font-mono text-xs tracking-wider rounded-sm">
          <Ticket className="mr-2 h-4 w-4" /> Single
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-sm border-border bg-card">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase tracking-wider">Generate Voucher</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="packageId" className="font-mono text-xs uppercase">Package ID</Label>
            <Input id="packageId" type="number" value={packageId} onChange={(e) => setPackageId(e.target.value)} required className="font-mono rounded-sm" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="locationId" className="font-mono text-xs uppercase">Location ID (Optional)</Label>
            <Input id="locationId" type="number" value={locationId} onChange={(e) => setLocationId(e.target.value)} className="font-mono rounded-sm" />
          </div>
          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={createMutation.isPending} className="font-bold uppercase font-mono text-xs tracking-wider rounded-sm">
              {createMutation.isPending ? 'GENERATING...' : 'GENERATE'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BulkGenerateDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [packageId, setPackageId] = useState("");
  const [quantity, setQuantity] = useState("10");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const bulkCreateMutation = useBulkCreateVouchers();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await bulkCreateMutation.mutateAsync({ 
        data: { 
          packageId: parseInt(packageId),
          quantity: parseInt(quantity)
        } 
      });
      queryClient.invalidateQueries({ queryKey: getListVouchersQueryKey() });
      toast({ title: "Batch Completed", description: `${quantity} vouchers generated successfully.` });
      onOpenChange(false);
      setPackageId(""); setQuantity("10");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Batch Failed", description: error?.message || "Error generating batch." });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="font-bold uppercase font-mono text-xs tracking-wider rounded-sm">
          <Ticket className="mr-2 h-4 w-4" /> Bulk Generate
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-sm border-border bg-card">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase tracking-wider">Batch Generate</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bulkPackageId" className="font-mono text-xs uppercase">Package ID</Label>
              <Input id="bulkPackageId" type="number" value={packageId} onChange={(e) => setPackageId(e.target.value)} required className="font-mono rounded-sm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="quantity" className="font-mono text-xs uppercase">Quantity</Label>
              <Input id="quantity" type="number" min="1" max="1000" value={quantity} onChange={(e) => setQuantity(e.target.value)} required className="font-mono rounded-sm" />
            </div>
          </div>
          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={bulkCreateMutation.isPending} className="font-bold uppercase font-mono text-xs tracking-wider rounded-sm">
              {bulkCreateMutation.isPending ? 'PROCESSING...' : 'EXECUTE BATCH'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
