import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useRegister } from "@workspace/api-client-react";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const registerMutation = useRegister();
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await registerMutation.mutateAsync({
        data: { email, password, name, tenantName }
      });
      toast({ title: "Registration complete", description: "Tenant initialized successfully. Logging in..." });
      
      // Auto-login
      await login({ email, password });
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error?.message || "Could not register tenant.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center bg-primary text-primary-foreground">
            <span className="font-mono text-xl font-bold">M</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Operator Registration</h1>
          <p className="mt-2 text-sm text-muted-foreground">Initialize a new tenant</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tenantName">Business/Tenant Name</Label>
            <Input
              id="tenantName"
              placeholder="e.g. Starlink Hub Alpha"
              value={tenantName}
              onChange={(e) => setTenantName(e.target.value)}
              required
              className="bg-card font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Operator Name</Label>
            <Input
              id="name"
              placeholder="e.g. John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-card font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Operator Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@system.net"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-card font-mono"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Passkey (min 8 chars)</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="bg-card font-mono"
            />
          </div>
          <Button type="submit" className="w-full font-bold" disabled={isLoading}>
            {isLoading ? "PROVISIONING..." : "INITIALIZE TENANT"}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          Existing deployment?{" "}
          <Link href="/login">
            <div className="cursor-pointer font-medium text-primary hover:underline inline">Login</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
