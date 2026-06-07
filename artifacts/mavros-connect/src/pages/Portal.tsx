import { useState } from "react";
import { useGetPortalConfig, getGetPortalConfigQueryKey, useValidateVoucher } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Wifi, AlertTriangle } from "lucide-react";
import { Label } from "@/components/ui/label";

export default function Portal() {
  const [voucherCode, setVoucherCode] = useState("");
  const [macAddress] = useState(() => localStorage.getItem("temp_mac") || "AA:BB:CC:DD:EE:FF"); // Mock MAC for demo
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();
  
  // Extract tenantSlug from URL
  const pathParts = window.location.pathname.split('/');
  const tenantSlug = pathParts[pathParts.length - 1];

  const { data: config, isLoading, error } = useGetPortalConfig(tenantSlug, { 
    query: { queryKey: getGetPortalConfigQueryKey(tenantSlug) } 
  });
  
  const validateMutation = useValidateVoucher();

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCode) return;
    
    setIsProcessing(true);
    try {
      const result = await validateMutation.mutateAsync({ 
        data: { code: voucherCode, tenantSlug, macAddress } 
      });
      
      if (result.valid) {
        setIsConnected(true);
        toast({ title: "Access Granted", description: "You are now connected to the internet." });
      } else {
        toast({ title: "Access Denied", description: result.message || "Invalid voucher code.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Connection Failed", description: err?.message || "Server error.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-100">Loading Portal...</div>;
  }

  if (error || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-sm w-full text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Portal Unavailable</h2>
          <p className="text-gray-500 text-sm">The hotspot you are trying to access is not configured correctly.</p>
        </div>
      </div>
    );
  }

  const primaryColor = config.primaryColor || "#3b82f6";

  if (isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-md w-full text-center border-t-8" style={{ borderColor: primaryColor }}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-6 bg-green-100 text-green-600">
            <Wifi size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900">Connected!</h1>
          <p className="text-gray-600 mb-6">You now have secure internet access via {config.tenantName}.</p>
          <Button className="w-full font-bold h-12" style={{ backgroundColor: primaryColor }} onClick={() => window.open('https://google.com', '_blank')}>
            Browse the Web
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col p-4 bg-gray-50">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="bg-white p-6 md:p-8 rounded-xl shadow-xl max-w-md w-full border-t-8" style={{ borderColor: primaryColor }}>
          
          <div className="text-center mb-8">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt={config.tenantName} className="h-16 mx-auto mb-4 object-contain" />
            ) : (
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-4 text-white font-bold text-xl" style={{ backgroundColor: primaryColor }}>
                {config.tenantName.substring(0, 2).toUpperCase()}
              </div>
            )}
            <h1 className="text-2xl font-bold text-gray-900">{config.tenantName}</h1>
            <p className="text-gray-500 text-sm mt-1">{config.welcomeMessage || "Connect to high-speed internet"}</p>
          </div>

          <form onSubmit={handleConnect} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="voucherCode" className="text-gray-700 font-semibold uppercase text-xs tracking-wider">Access Code</Label>
              <Input
                id="voucherCode"
                placeholder="Enter your voucher code"
                value={voucherCode}
                onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                required
                className="h-12 text-center font-mono text-lg tracking-widest uppercase bg-gray-50 border-2 focus-visible:ring-0"
                style={{ '--tw-ring-color': primaryColor, borderColor: voucherCode ? primaryColor : undefined } as any}
              />
            </div>
            
            <Button 
              type="submit" 
              className="w-full font-bold h-12 text-md text-white transition-opacity hover:opacity-90" 
              style={{ backgroundColor: primaryColor }}
              disabled={isProcessing || !voucherCode}
            >
              {isProcessing ? "VERIFYING..." : "CONNECT NOW"}
            </Button>
          </form>

          {config.supportPhone && (
            <div className="mt-8 pt-6 border-t text-center">
              <p className="text-sm text-gray-500">Need help? Contact support</p>
              <p className="font-semibold text-gray-800">{config.supportPhone}</p>
            </div>
          )}
        </div>
      </div>
      
      <div className="py-4 text-center">
        <p className="text-xs text-gray-400 font-mono">Powered by Mavros Connect</p>
      </div>
    </div>
  );
}
