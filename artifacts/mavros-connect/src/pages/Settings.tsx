import { useState, useEffect } from "react";
import { useGetMyTenant, getGetMyTenantQueryKey, useUpdateTenant } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

export default function Settings() {
  const { data: tenant, isLoading } = useGetMyTenant({ query: { queryKey: getGetMyTenantQueryKey() } });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const updateMutation = useUpdateTenant();

  const [name, setName] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [primaryColor, setPrimaryColor] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  useEffect(() => {
    if (tenant) {
      setName(tenant.name || "");
      setLogoUrl(tenant.logoUrl || "");
      setPrimaryColor(tenant.primaryColor || "");
      setContactEmail(tenant.contactEmail || "");
      setContactPhone(tenant.contactPhone || "");
    }
  }, [tenant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;
    try {
      await updateMutation.mutateAsync({ 
        id: tenant.id,
        data: { name, logoUrl, primaryColor, contactEmail, contactPhone } 
      });
      queryClient.invalidateQueries({ queryKey: getGetMyTenantQueryKey() });
      toast({ title: "Configuration Saved", description: "Tenant parameters updated successfully." });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Update Failed", description: error?.message || "Could not save configuration." });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96 w-full max-w-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight font-mono uppercase">System Configuration</h1>
      </div>

      <Card className="rounded-sm border-border bg-card">
        <CardHeader>
          <CardTitle className="font-mono uppercase tracking-wider text-sm">Tenant Identity</CardTitle>
          <CardDescription className="text-xs">Configure the public-facing identity of your hotspot portal.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2">
                <Label htmlFor="name" className="font-mono text-xs uppercase">Business Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required className="font-mono rounded-sm bg-muted/20" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactEmail" className="font-mono text-xs uppercase">Support Email</Label>
                <Input id="contactEmail" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} className="font-mono rounded-sm bg-muted/20" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactPhone" className="font-mono text-xs uppercase">Support Phone</Label>
                <Input id="contactPhone" value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} className="font-mono rounded-sm bg-muted/20" />
              </div>
              <div className="space-y-2 col-span-2">
                <Label htmlFor="logoUrl" className="font-mono text-xs uppercase">Brand Logo URL</Label>
                <Input id="logoUrl" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://example.com/logo.png" className="font-mono rounded-sm bg-muted/20" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="primaryColor" className="font-mono text-xs uppercase">Brand Color (Hex)</Label>
                <div className="flex gap-2">
                  <Input id="primaryColor" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} placeholder="#4f46e5" className="font-mono rounded-sm bg-muted/20" />
                  {primaryColor && (
                    <div className="h-9 w-9 rounded-sm border border-border shrink-0" style={{ backgroundColor: primaryColor }} />
                  )}
                </div>
              </div>
            </div>

            <div className="pt-4 flex justify-end">
              <Button type="submit" disabled={updateMutation.isPending} className="font-bold uppercase font-mono text-xs tracking-wider rounded-sm">
                {updateMutation.isPending ? 'WRITING...' : 'SAVE CONFIGURATION'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
      
      <Card className="rounded-sm border-border bg-card">
        <CardHeader>
          <CardTitle className="font-mono uppercase tracking-wider text-sm">System Properties</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground font-mono uppercase">Tenant ID</p>
              <p className="font-mono font-medium">{tenant?.id}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-mono uppercase">Slug / Routing Key</p>
              <p className="font-mono font-medium">{tenant?.slug}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-mono uppercase">Subscription Tier</p>
              <Badge className="font-mono uppercase text-[10px]">{tenant?.plan}</Badge>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-mono uppercase">Operational Status</p>
              <Badge variant="outline" className="font-mono uppercase text-[10px] border-emerald-500 text-emerald-500">{tenant?.status}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
