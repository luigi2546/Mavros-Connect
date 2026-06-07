import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login({ email, password });
      toast({ title: "Welcome back", description: "Successfully authenticated to the terminal." });
    } catch (error: any) {
      toast({
        title: "Access Denied",
        description: error?.message || "Invalid credentials provided.",
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
          <h1 className="text-2xl font-bold tracking-tight">Mavros Connect</h1>
          <p className="mt-2 text-sm text-muted-foreground">Operator Terminal Login</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Operator Identifier (Email)</Label>
            <Input
              id="email"
              type="email"
              placeholder="operator@system.net"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="bg-card font-mono"
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Passkey</Label>
              <Link href="/forgot-password">
                <div className="cursor-pointer text-xs text-primary hover:underline">Forgot?</div>
              </Link>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="bg-card font-mono"
            />
          </div>
          <Button type="submit" className="w-full font-bold" disabled={isLoading}>
            {isLoading ? "AUTHENTICATING..." : "INITIATE SESSION"}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          New terminal deployment?{" "}
          <Link href="/register">
            <div className="cursor-pointer font-medium text-primary hover:underline inline">Register tenant</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
