import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { useForgotPassword } from "@workspace/api-client-react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const { toast } = useToast();
  const forgotMutation = useForgotPassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await forgotMutation.mutateAsync({ data: { email } });
      setIsSent(true);
      toast({ title: "Request accepted", description: "If the operator exists, reset instructions have been transmitted." });
    } catch (error: any) {
      toast({
        title: "Request Failed",
        description: error?.message || "Unable to process request.",
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
          <h1 className="text-2xl font-bold tracking-tight">Credential Reset</h1>
          <p className="mt-2 text-sm text-muted-foreground">Request access recovery</p>
        </div>

        {isSent ? (
          <div className="rounded-md border border-border bg-card p-4 text-center">
            <p className="text-sm">Transmission complete. Check your secure inbox for further instructions.</p>
            <Link href="/login">
              <Button variant="outline" className="mt-4 w-full">RETURN TO LOGIN</Button>
            </Link>
          </div>
        ) : (
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
            <Button type="submit" className="w-full font-bold" disabled={isLoading}>
              {isLoading ? "TRANSMITTING..." : "REQUEST RECOVERY"}
            </Button>
          </form>
        )}

        {!isSent && (
          <div className="text-center text-sm text-muted-foreground">
            <Link href="/login">
              <div className="cursor-pointer font-medium text-primary hover:underline inline">Abort recovery and login</div>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
