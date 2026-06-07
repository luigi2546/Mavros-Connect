import { useState } from "react";
import {
  useListVouchers, getListVouchersQueryKey,
  useCreateVoucher, useBulkCreateVouchers, useDeleteVoucher,
  useListPackages, getListPackagesQueryKey,
  useListLocations, getListLocationsQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Ticket, Copy, Trash2, Printer, Download } from "lucide-react";
import { ghs } from "@/lib/currency";

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

  const handlePrint = () => {
    window.open("/vouchers/print", "_blank");
  };

  const handleExportCSV = () => {
    if (!vouchers || vouchers.length === 0) {
      toast({ title: "No Data", description: "No vouchers to export.", variant: "destructive" });
      return;
    }

    const headers = ["Code", "Package", "Price", "Status", "Expires At", "Used At", "Used By MAC"];
    const rows = vouchers.map((voucher) => {
      const pkg = (voucher as any).package;
      return [
        voucher.code,
        pkg?.name || `PKG-${voucher.packageId}`,
        pkg?.price || "N/A",
        voucher.status,
        voucher.expiresAt ? new Date(voucher.expiresAt).toLocaleDateString("en-GH") : "No expiry",
        voucher.usedAt ? new Date(voucher.usedAt).toLocaleDateString("en-GH") : "—",
        voucher.usedByMac || "—",
      ];
    });

    const csv = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `vouchers-export-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast({ title: "Exported", description: `${vouchers.length} vouchers exported to CSV.` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight font-mono uppercase">Voucher Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportCSV} className="font-bold uppercase font-mono text-xs tracking-wider rounded-sm">
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" onClick={handlePrint} className="font-bold uppercase font-mono text-xs tracking-wider rounded-sm">
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
          <BulkGenerateDialog open={isBulkDialogOpen} onOpenChange={setIsBulkDialogOpen} />
          <GenerateDialog open={isSingleDialogOpen} onOpenChange={setIsSingleDialogOpen} />
        </div>
      </div>

      <div className="rounded-sm border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-mono text-xs font-semibold uppercase">Code</TableHead>
              <TableHead className="font-mono text-xs font-semibold uppercase">Package</TableHead>
              <TableHead className="font-mono text-xs font-semibold uppercase">Status</TableHead>
              <TableHead className="font-mono text-xs font-semibold uppercase">Expiry</TableHead>
              <TableHead className="font-mono text-xs font-semibold uppercase">Used</TableHead>
              <TableHead className="font-mono text-xs font-semibold uppercase text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </TableCell>
              </TableRow>
            ) : vouchers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center font-mono text-muted-foreground">
                  NO VOUCHERS GENERATED
                </TableCell>
              </TableRow>
            ) : (
              vouchers?.map((voucher) => {
                const pkg = (voucher as any).package;
                return (
                  <TableRow key={voucher.id} className="hover:bg-muted/30">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold tracking-widest text-lg">{voucher.code}</span>
                        <button onClick={() => copyToClipboard(voucher.code)} className="text-muted-foreground hover:text-foreground transition-colors">
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      {pkg ? (
                        <div>
                          <p className="font-medium text-sm">{pkg.name}</p>
                          <p className="text-xs text-muted-foreground font-mono">
                            {ghs(pkg.price)} · {pkg.duration} {pkg.durationUnit}
                          </p>
                        </div>
                      ) : (
                        <span className="font-mono text-xs text-muted-foreground">PKG-{voucher.packageId}</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge className={`font-mono uppercase text-[10px] ${getStatusColor(voucher.status)}`}>
                        {voucher.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {voucher.expiresAt
                        ? new Date(voucher.expiresAt).toLocaleDateString("en-GH", { day: "2-digit", month: "short", year: "numeric" })
                        : "No expiry"}
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {voucher.usedAt
                        ? new Date(voucher.usedAt).toLocaleDateString("en-GH", { day: "2-digit", month: "short" })
                        : "—"}
                      {voucher.usedByMac && <div className="text-[10px] opacity-60">{voucher.usedByMac}</div>}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" size="sm" className="font-mono text-xs"
                          onClick={() => window.open(`/vouchers/print?ids=${voucher.id}`, "_blank")}>
                          <Printer className="h-3 w-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(voucher.id)} className="text-destructive font-mono text-xs">
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
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
  const [expiresAt, setExpiresAt] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateVoucher();
  const { data: packages } = useListPackages({ query: { queryKey: getListPackagesQueryKey() } });
  const { data: locations } = useListLocations({ query: { queryKey: getListLocationsQueryKey() } });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({
        data: {
          packageId: parseInt(packageId),
          locationId: locationId && locationId !== "any" ? parseInt(locationId) : undefined,
          expiresAt: expiresAt || undefined,
        }
      });
      queryClient.invalidateQueries({ queryKey: getListVouchersQueryKey() });
      toast({ title: "Voucher Generated", description: "New access code is ready." });
      onOpenChange(false);
      setPackageId(""); setLocationId(""); setExpiresAt("");
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
            <Label className="font-mono text-xs uppercase">Package</Label>
            <Select value={packageId} onValueChange={setPackageId} required>
              <SelectTrigger className="font-mono rounded-sm">
                <SelectValue placeholder="Select a package…" />
              </SelectTrigger>
              <SelectContent>
                {packages?.map((pkg) => (
                  <SelectItem key={pkg.id} value={String(pkg.id)}>
                    <span className="font-medium">{pkg.name}</span>
                    <span className="ml-2 text-muted-foreground text-xs">{ghs(pkg.price)} · {pkg.duration} {pkg.durationUnit}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="font-mono text-xs uppercase">Location <span className="text-muted-foreground">(optional)</span></Label>
            <Select value={locationId} onValueChange={setLocationId}>
              <SelectTrigger className="font-mono rounded-sm">
                <SelectValue placeholder="Any location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">Any location</SelectItem>
                {locations?.map((loc) => (
                  <SelectItem key={loc.id} value={String(loc.id)}>{loc.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expiresAt" className="font-mono text-xs uppercase">Expires On <span className="text-muted-foreground">(optional)</span></Label>
            <Input id="expiresAt" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split("T")[0]} className="font-mono rounded-sm" />
            <p className="text-[10px] text-muted-foreground font-mono">Leave blank for no expiry</p>
          </div>
          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={createMutation.isPending || !packageId} className="font-bold uppercase font-mono text-xs tracking-wider rounded-sm">
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
  const [locationId, setLocationId] = useState("");
  const [quantity, setQuantity] = useState("10");
  const [expiresAt, setExpiresAt] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const bulkCreateMutation = useBulkCreateVouchers();
  const { data: packages } = useListPackages({ query: { queryKey: getListPackagesQueryKey() } });
  const { data: locations } = useListLocations({ query: { queryKey: getListLocationsQueryKey() } });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await bulkCreateMutation.mutateAsync({
        data: {
          packageId: parseInt(packageId),
          locationId: locationId && locationId !== "any" ? parseInt(locationId) : undefined,
          quantity: parseInt(quantity),
          expiresAt: expiresAt || undefined,
        }
      });
      queryClient.invalidateQueries({ queryKey: getListVouchersQueryKey() });
      toast({ title: "Batch Completed", description: `${quantity} vouchers generated successfully.` });
      onOpenChange(false);
      setPackageId(""); setLocationId(""); setQuantity("10"); setExpiresAt("");
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
      <DialogContent className="sm:max-w-[450px] rounded-sm border-border bg-card">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase tracking-wider">Batch Generate</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label className="font-mono text-xs uppercase">Package</Label>
            <Select value={packageId} onValueChange={setPackageId} required>
              <SelectTrigger className="font-mono rounded-sm">
                <SelectValue placeholder="Select a package…" />
              </SelectTrigger>
              <SelectContent>
                {packages?.map((pkg) => (
                  <SelectItem key={pkg.id} value={String(pkg.id)}>
                    <span className="font-medium">{pkg.name}</span>
                    <span className="ml-2 text-muted-foreground text-xs">{ghs(pkg.price)} · {pkg.duration} {pkg.durationUnit}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="font-mono text-xs uppercase">Location <span className="text-muted-foreground">(opt.)</span></Label>
              <Select value={locationId} onValueChange={setLocationId}>
                <SelectTrigger className="font-mono rounded-sm">
                  <SelectValue placeholder="Any" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any location</SelectItem>
                  {locations?.map((loc) => (
                    <SelectItem key={loc.id} value={String(loc.id)}>{loc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulkQty" className="font-mono text-xs uppercase">Quantity</Label>
              <Input id="bulkQty" type="number" min="1" max="1000" value={quantity}
                onChange={(e) => setQuantity(e.target.value)} required className="font-mono rounded-sm" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bulkExpiresAt" className="font-mono text-xs uppercase">Expires On <span className="text-muted-foreground">(optional)</span></Label>
            <Input id="bulkExpiresAt" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().split("T")[0]} className="font-mono rounded-sm" />
            <p className="text-[10px] text-muted-foreground font-mono">Leave blank for no expiry</p>
          </div>
          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={bulkCreateMutation.isPending || !packageId} className="font-bold uppercase font-mono text-xs tracking-wider rounded-sm">
              {bulkCreateMutation.isPending ? 'PROCESSING...' : `GENERATE ${quantity} VOUCHERS`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
