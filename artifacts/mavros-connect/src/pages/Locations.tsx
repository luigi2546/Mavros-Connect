import { useState } from "react";
import { useListLocations, getListLocationsQueryKey, useCreateLocation } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export default function Locations() {
  const { data: locations, isLoading } = useListLocations({ query: { queryKey: getListLocationsQueryKey() } });
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight font-mono uppercase">Locations</h1>
        <LocationDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      </div>

      <div className="rounded-sm border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-mono text-xs font-semibold uppercase">ID</TableHead>
              <TableHead className="font-mono text-xs font-semibold uppercase">Name</TableHead>
              <TableHead className="font-mono text-xs font-semibold uppercase">Address</TableHead>
              <TableHead className="font-mono text-xs font-semibold uppercase">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                </TableCell>
              </TableRow>
            ) : locations?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center font-mono text-muted-foreground">
                  NO LOCATIONS PROVISIONED
                </TableCell>
              </TableRow>
            ) : (
              locations?.map((loc) => (
                <TableRow key={loc.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-xs">{loc.id}</TableCell>
                  <TableCell className="font-medium">{loc.name}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {loc.city ? `${loc.city}, ${loc.country || ''}` : loc.address || 'Unspecified'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={loc.status === 'active' ? 'default' : 'secondary'} className="font-mono uppercase text-[10px]">
                      {loc.status}
                    </Badge>
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

function LocationDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateLocation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({ data: { name, city, country } });
      queryClient.invalidateQueries({ queryKey: getListLocationsQueryKey() });
      toast({ title: "Location Provisioned", description: "New operational location added." });
      onOpenChange(false);
      setName("");
      setCity("");
      setCountry("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Operation Failed", description: error?.message || "Error provisioning location." });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="font-bold uppercase font-mono text-xs tracking-wider rounded-sm">Provision Location</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-sm border-border bg-card">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase tracking-wider">New Location</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="font-mono text-xs uppercase">Identifier/Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="font-mono rounded-sm" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city" className="font-mono text-xs uppercase">City</Label>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} className="font-mono rounded-sm" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="country" className="font-mono text-xs uppercase">Country</Label>
            <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} className="font-mono rounded-sm" />
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
