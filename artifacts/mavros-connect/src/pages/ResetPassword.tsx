import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useLocation } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useResetPassword } from "@workspace/api-client-react";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const resetMutation = useResetPassword();
  const [location, setLocation] = useLocation();

  // Extract token from URL
  const searchParams = new URLSearchParams(window.location.search);
  const token = searchParams.get("token") || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      toast({ title: "Invalid Request", description: "Missing authorization token.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await resetMutation.mutateAsync({ data: { token, password } });
      toast({ title: "Credentials Updated", description: "Access restored successfully." });
      setLocation("/login");
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error?.message || "Invalid or expired token.",
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
          <h1 className="text-2xl font-bold tracking-tight">Establish New Passkey</h1>
          <p className="mt-2 text-sm text-muted-foreground">Enter a secure credential</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New Passkey (min 8 chars)</Label>
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
          <Button type="submit" className="w-full font-bold" disabled={isLoading || !token}>
            {isLoading ? "UPDATING..." : "COMMIT CREDENTIAL"}
          </Button>
        </form>

        <div className="text-center text-sm text-muted-foreground">
          <Link href="/login">
            <div className="cursor-pointer font-medium text-primary hover:underline inline">Return to login</div>
          </Link>
        </div>
      </div>
    </div>
  );
}
