import { useState } from "react";
import { useListUsers, getListUsersQueryKey, useCreateUser, useDeleteUser, useSuspendUser, useUnsuspendUser } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { UserPlus, Trash2, Ban, CheckCircle } from "lucide-react";

export default function Users() {
  const { data: users, isLoading } = useListUsers({ query: { queryKey: getListUsersQueryKey() } });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteUser();
  const suspendMutation = useSuspendUser();
  const unsuspendMutation = useUnsuspendUser();

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to permanently delete this user?")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast({ title: "Operator Removed", description: "User has been permanently deleted from the system." });
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
    } catch (error: any) {
      toast({ title: "Action Failed", description: error?.message, variant: "destructive" });
    }
  };

  const toggleSuspend = async (id: number, isSuspended: boolean) => {
    try {
      if (isSuspended) {
        await unsuspendMutation.mutateAsync({ id });
        toast({ title: "Access Restored", description: "Operator privileges reinstated." });
      } else {
        await suspendMutation.mutateAsync({ id });
        toast({ title: "Access Revoked", description: "Operator privileges suspended." });
      }
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
    } catch (error: any) {
      toast({ title: "Action Failed", description: error?.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight font-mono uppercase">Staff Operations</h1>
        <UserDialog open={isDialogOpen} onOpenChange={setIsDialogOpen} />
      </div>

      <div className="rounded-sm border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-mono text-xs font-semibold uppercase">ID</TableHead>
              <TableHead className="font-mono text-xs font-semibold uppercase">Identity</TableHead>
              <TableHead className="font-mono text-xs font-semibold uppercase">Role</TableHead>
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
            ) : users?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center font-mono text-muted-foreground">
                  NO OPERATORS FOUND
                </TableCell>
              </TableRow>
            ) : (
              users?.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-xs">{user.id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{user.name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{user.email}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs uppercase">{user.role.replace('_', ' ')}</TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'active' ? 'default' : 'destructive'} className="font-mono uppercase text-[10px]">
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => toggleSuspend(user.id, user.status === 'suspended')} 
                        className={user.status === 'suspended' ? 'text-emerald-500' : 'text-amber-500'}
                      >
                        {user.status === 'suspended' ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(user.id)} className="text-destructive font-mono text-xs">
                        <Trash2 className="h-4 w-4" />
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

function UserDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"admin" | "manager" | "staff">("staff");
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const createMutation = useCreateUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync({ 
        data: { name, email, password, role } 
      });
      queryClient.invalidateQueries({ queryKey: getListUsersQueryKey() });
      toast({ title: "Operator Added", description: "New staff member provisioned." });
      onOpenChange(false);
      setName(""); setEmail(""); setPassword(""); setRole("staff");
    } catch (error: any) {
      toast({ variant: "destructive", title: "Provisioning Failed", description: error?.message || "Error adding user." });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button className="font-bold uppercase font-mono text-xs tracking-wider rounded-sm">
          <UserPlus className="mr-2 h-4 w-4" /> Add Operator
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-sm border-border bg-card">
        <DialogHeader>
          <DialogTitle className="font-mono uppercase tracking-wider">Provision Operator</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="font-mono text-xs uppercase">Full Name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="font-mono rounded-sm" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="font-mono text-xs uppercase">Identifier (Email)</Label>
            <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="font-mono rounded-sm" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="font-mono text-xs uppercase">Initial Passkey</Label>
            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} className="font-mono rounded-sm" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role" className="font-mono text-xs uppercase">Clearance Level</Label>
            <select 
              id="role" 
              value={role} 
              onChange={(e) => setRole(e.target.value as any)} 
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring font-mono"
            >
              <option value="staff">Staff (Level 1)</option>
              <option value="manager">Manager (Level 2)</option>
              <option value="admin">Admin (Level 3)</option>
            </select>
          </div>

          <div className="pt-4 flex justify-end">
            <Button type="submit" disabled={createMutation.isPending} className="font-bold uppercase font-mono text-xs tracking-wider rounded-sm">
              {createMutation.isPending ? 'EXECUTING...' : 'AUTHORIZE'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
