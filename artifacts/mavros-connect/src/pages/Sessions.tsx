import { useListSessions, getListSessionsQueryKey, useTerminateSession } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Ban } from "lucide-react";

export default function Sessions() {
  const { data: sessions, isLoading } = useListSessions({ query: { queryKey: getListSessionsQueryKey() } });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const terminateMutation = useTerminateSession();

  const handleTerminate = async (id: number) => {
    if (!confirm("Terminate this session and kick user offline?")) return;
    try {
      await terminateMutation.mutateAsync({ id });
      toast({ title: "Session Terminated", description: "The connection has been dropped." });
      queryClient.invalidateQueries({ queryKey: getListSessionsQueryKey() });
    } catch (error: any) {
      toast({ title: "Termination Error", description: error?.message || "Failed to drop session", variant: "destructive" });
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight font-mono uppercase">Active Telemetry</h1>
      </div>

      <div className="rounded-sm border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              <TableHead className="font-mono text-xs font-semibold uppercase">Session ID</TableHead>
              <TableHead className="font-mono text-xs font-semibold uppercase">Device</TableHead>
              <TableHead className="font-mono text-xs font-semibold uppercase">Traffic</TableHead>
              <TableHead className="font-mono text-xs font-semibold uppercase">Duration</TableHead>
              <TableHead className="font-mono text-xs font-semibold uppercase">Status</TableHead>
              <TableHead className="font-mono text-xs font-semibold uppercase text-right">Action</TableHead>
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
            ) : sessions?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center font-mono text-muted-foreground">
                  NO ACTIVE SESSIONS
                </TableCell>
              </TableRow>
            ) : (
              sessions?.map((session) => (
                <TableRow key={session.id} className="hover:bg-muted/30">
                  <TableCell className="font-mono text-xs">{session.id}</TableCell>
                  <TableCell>
                    <div className="font-mono text-xs">{session.macAddress}</div>
                    <div className="font-mono text-[10px] text-muted-foreground">{session.ipAddress || 'Unknown IP'}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-mono text-xs text-emerald-500">↓ {formatBytes(session.bytesIn)}</div>
                    <div className="font-mono text-xs text-blue-500">↑ {formatBytes(session.bytesOut)}</div>
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    <div>Start: {new Date(session.startedAt).toLocaleTimeString()}</div>
                    {session.endedAt && <div>End: {new Date(session.endedAt).toLocaleTimeString()}</div>}
                  </TableCell>
                  <TableCell>
                    <Badge variant={session.status === 'active' ? 'default' : 'secondary'} className="font-mono uppercase text-[10px]">
                      {session.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {session.status === 'active' && (
                      <Button variant="outline" size="sm" onClick={() => handleTerminate(session.id)} className="text-destructive border-destructive/50 hover:bg-destructive hover:text-white font-mono text-xs">
                        <Ban className="h-3 w-3 mr-1" /> DROP
                      </Button>
                    )}
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
