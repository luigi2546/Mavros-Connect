import { useState } from "react";
import { useListRouters, getListRoutersQueryKey, useCreateRouter, useTestRouterConnection, useDeleteRouter } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Wifi, Activity, Trash2 } from "lucide-react";

export default function Routers() {
  const { data: routers, isLoading } = useListRouters({ query: { queryKey: getListRoutersQueryKey() } });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const testMutation = useTestRouterConnection();
  const deleteMutation = useDeleteRouter();

  const handleTest = async (id: number) => {
    try {
      const result = await testMutation.mutateAsync({ id });
      if (result.success) {
        toast({ title: "Connection Successful", description: result.message });
      } else {
        toast({ title: "Connection Failed", description: result.message, variant: "destructive" });
      }
      queryClient.invalidateQueries({ queryKey: getListRoutersQueryKey() });
    } catch (error: any) {
      toast({ title: "Test Error", description: error?.message || "Failed to test connection", variant: "destructive" });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this router?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: "Router Deleted", description: "The router has been removed." });
      queryClient.invalidateQueries({ queryKey: getListRoutersQueryKey() });
    } catch (error: any) {
      toast({ title: "Delete Error", description: error?.message || "Failed to delete router", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight font-mono uppercase">Routers</h1>
        <RouterDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      </div>

      <div className="rounded-sm border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-mono text-xs font-semibold uppercase">ID</TableHead>
              <TableHead className="font-mono text-xs font-semibold uppercase">Name / IP</TableHead>
              <TableHead className="font-mono text-xs font-semibold uppercase">Location ID</TableHead>
              <TableHead className="font-mono text-xs font-semibold uppercase">Status</TableHead>
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
            ) : routers?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center font-mono text-muted-foreground">
                  NO ROUTERS PROVISIONED
                </TableCell>
              </TableRow>
            ) : (
              routers?.map((router) => (
                <TableRow key={router.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-xs">{router.id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{router.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{router.ipAddress}:{router.apiPort}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{router.locationId}</TableCell>
                  <TableCell>
                    <Badge variant={router.status === 'online' ? 'default' : router.status === 'offline' ? 'destructive' : 'secondary'} className="font-mono uppercase text-[10px]">
                      {router.status}
                    </Badge>
                    {router.lastSeen && <div className="text-[10px] text-muted-foreground mt-1 font-mono">Seen: {new Date(router.lastSeen).toLocaleTimeString()}</div>}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => handleTest(router.id)} disabled={testMutation.isPending} className="font-mono text-xs">
                        <Activity className="h-3 w-3 mr-1" />
                        TEST
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(router.id)} className="text-destructive font-mono text-xs">
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

function RouterDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState("");
  const [ipAddress, setIpAddress] = useState("");
  const [apiPort, setApiPort] = useState("8728");
  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [locationId, setLocationId] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({ 
        data: { 
          name, 
          ipAddress, 
          apiPort: parseInt(apiPort), 
          username, 
          password, 
          locationId: parseInt(locationId) 
        } 
      });
      queryClient.invalidateQueries({ queryKey: getListRoutersQueryKey() });
      toast({ title: "Router Provisioned", description: "New router added to the network." });
      onOpenChange(false);
      setName("");
      setIpAddress("");
      setPassword("");
      setLocationId("");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Provisioning Failed", description: error?.message || "Error adding router." });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="font-bold uppercase font-mono text-xs tracking-wider rounded-sm">
          <Wifi className="mr-2 h-4 w-4" /> Add Router
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-sm border-border bg-card">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase tracking-wider">Provision Router</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="font-mono text-xs uppercase">Identifier</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="font-mono rounded-sm" placeholder="Alpha-1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationId" className="font-mono text-xs uppercase">Location ID</Label>
              <Input id="locationId" type="number" value={locationId} onChange={(e) => setLocationId(e.target.value)} required className="font-mono rounded-sm" placeholder="1" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="ipAddress" className="font-mono text-xs uppercase">IP Address</Label>
              <Input id="ipAddress" value={ipAddress} onChange={(e) => setIpAddress(e.target.value)} required className="font-mono rounded-sm" placeholder="192.168.88.1" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="apiPort" className="font-mono text-xs uppercase">API Port</Label>
              <Input id="apiPort" type="number" value={apiPort} onChange={(e) => setApiPort(e.target.value)} required className="font-mono rounded-sm" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="font-mono text-xs uppercase">API User</Label>
              <Input id="username" value={username} onChange={(e) => setUsername(e.target.value)} required className="font-mono rounded-sm" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="font-mono text-xs uppercase">API Passkey</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="font-mono rounded-sm" />
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
