import { useState } from "react";
import { useListPackages, getListPackagesQueryKey, useCreatePackage, useDeletePackage } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Package as PackageIcon, Trash2 } from "lucide-react";
import { ghs } from "@/lib/currency";

export default function Packages() {
  const { data: packages, isLoading } = useListPackages({ query: { queryKey: getListPackagesQueryKey() } });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteMutation = useDeletePackage();

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this package?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: "Package Deleted", description: "The package has been removed." });
      queryClient.invalidateQueries({ queryKey: getListPackagesQueryKey() });
    } catch (error: any) {
      toast({ title: "Delete Error", description: error?.message || "Failed to delete package", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight font-mono uppercase">Internet Packages</h1>
        <PackageDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      </div>

      <div className="rounded-sm border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-mono text-xs font-semibold uppercase">ID</TableHead>
              <TableHead className="font-mono text-xs font-semibold uppercase">Plan Details</TableHead>
              <TableHead className="font-mono text-xs font-semibold uppercase">Limits</TableHead>
              <TableHead className="font-mono text-xs font-semibold uppercase">Pricing</TableHead>
              <TableHead className="font-mono text-xs font-semibold uppercase">Status</TableHead>
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
            ) : packages?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center font-mono text-muted-foreground">
                  NO PACKAGES CONFIGURED
                </TableCell>
              </TableRow>
            ) : (
              packages?.map((pkg) => (
                <TableRow key={pkg.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-xs">{pkg.id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{pkg.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">Duration: {pkg.duration} {pkg.durationUnit}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-xs">
                      Speed: {pkg.downloadSpeed || 'Unl'}/{pkg.uploadSpeed || 'Unl'} Mbps
                    </div>
                    <div className="font-mono text-xs text-muted-foreground">
                      Data: {pkg.dataCapMb ? `${pkg.dataCapMb} MB` : 'Unlimited'}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono font-medium">{ghs(pkg.price)}</div>
                    <div className="font-mono text-xs text-muted-foreground">{pkg.currency || 'GHS'}</div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={pkg.status === 'active' ? 'default' : 'secondary'} className="font-mono uppercase text-[10px]">
                      {pkg.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(pkg.id)} className="text-destructive font-mono text-xs">
                      <Trash2 className="h-3 w-3" />
                    </Button>
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

function PackageDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("1");
  const [durationUnit, setDurationUnit] = useState<"minutes" | "hours" | "days" | "weeks" | "months">("days");
  const [downloadSpeed, setDownloadSpeed] = useState("");
  const [uploadSpeed, setUploadSpeed] = useState("");
  const [dataCapMb, setDataCapMb] = useState("");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreatePackage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({ 
        data: { 
          name, 
          price: parseFloat(price), 
          duration: parseInt(duration), 
          durationUnit,
          downloadSpeed: downloadSpeed ? parseInt(downloadSpeed) : undefined,
          uploadSpeed: uploadSpeed ? parseInt(uploadSpeed) : undefined,
          dataCapMb: dataCapMb ? parseInt(dataCapMb) : undefined
        } 
      });
      queryClient.invalidateQueries({ queryKey: getListPackagesQueryKey() });
      toast({ title: "Package Created", description: "New internet package is now available." });
      onOpenChange(false);
      // Reset form
      setName(""); setPrice(""); setDuration("1"); setDownloadSpeed(""); setUploadSpeed(""); setDataCapMb("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Creation Failed", description: error?.message || "Error adding package." });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="font-bold uppercase font-mono text-xs tracking-wider rounded-sm">
          <PackageIcon className="mr-2 h-4 w-4" /> Create Package
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-sm border-border bg-card">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase tracking-wider">Define New Package</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-mono text-xs uppercase">Package Name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="font-mono rounded-sm" placeholder="1 Day Pass" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="price" className="font-mono text-xs uppercase">Price</Label>
              <Input id="price" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required className="font-mono rounded-sm" placeholder="5.00" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration" className="font-mono text-xs uppercase">Duration Time</Label>
              <Input id="duration" type="number" value={duration} onChange={(e) => setDuration(e.target.value)} required className="font-mono rounded-sm" min="1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="durationUnit" className="font-mono text-xs uppercase">Unit</Label>
              <select 
                id="durationUnit" 
                value={durationUnit} 
                onChange={(e) => setDurationUnit(e.target.value as any)} 
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono"
              >
                <option value="minutes">Minutes</option>
                <option value="hours">Hours</option>
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="space-y-2">
              <Label htmlFor="downloadSpeed" className="font-mono text-xs uppercase">DL (Mbps)</Label>
              <Input id="downloadSpeed" type="number" value={downloadSpeed} onChange={(e) => setDownloadSpeed(e.target.value)} className="font-mono rounded-sm" placeholder="Unl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="uploadSpeed" className="font-mono text-xs uppercase">UL (Mbps)</Label>
              <Input id="uploadSpeed" type="number" value={uploadSpeed} onChange={(e) => setUploadSpeed(e.target.value)} className="font-mono rounded-sm" placeholder="Unl" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dataCapMb" className="font-mono text-xs uppercase">Cap (MB)</Label>
              <Input id="dataCapMb" type="number" value={dataCapMb} onChange={(e) => setDataCapMb(e.target.value)} className="font-mono rounded-sm" placeholder="Unl" />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={createMutation.isPending} className="font-bold uppercase font-mono text-xs tracking-wider rounded-sm">
              {createMutation.isPending ? 'EXECUTING...' : 'COMMIT'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
