import { useState, useEffect } from "react";
import { useGetPortalConfig, getGetPortalConfigQueryKey, useGetPortalPackages, getGetPortalPackagesQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Wifi, AlertTriangle, Ticket, CreditCard, Loader2 } from "lucide-react";
import { ghs } from "@/lib/currency";

export default function Portal() {
  const [tab, setTab] = useState<"voucher" | "pay">("voucher");
  const [voucherCode, setVoucherCode] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedPkg, setSelectedPkg] = useState<number | null>(null);
  const [macAddress] = useState(() => localStorage.getItem("temp_mac") ?? "AA:BB:CC:DD:EE:FF");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const { toast } = useToast();

  const pathParts = window.location.pathname.split("/");
  const tenantSlug = pathParts[pathParts.length - 1];

  const { data: config, isLoading, error } = useGetPortalConfig(tenantSlug, {
    query: { queryKey: getGetPortalConfigQueryKey(tenantSlug) },
  });
  const { data: packages } = useGetPortalPackages(tenantSlug, {
    query: { queryKey: getGetPortalPackagesQueryKey(tenantSlug) },
  });

  // Check for voucher code from Paystack callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const voucherFromUrl = params.get("voucher");
    const voucherFromStorage = localStorage.getItem("paystack_voucher");
    
    if (voucherFromUrl) {
      setVoucherCode(voucherFromUrl);
      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (voucherFromStorage) {
      setVoucherCode(voucherFromStorage);
    }
    
    // Clear voucher from storage after displaying
    localStorage.removeItem("paystack_voucher");
  }, []);

  const primaryColor = config?.primaryColor ?? "#4F46E5";

  // ── Voucher connect ──────────────────────────────────────────────────────────
  const handleVoucherConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voucherCode) return;
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/portal/${tenantSlug}/connect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "voucher", voucherCode, macAddress }),
      });
      const data = await res.json() as { success: boolean; message: string };
      if (data.success) {
        setIsConnected(true);
      } else {
        toast({ title: "Access Denied", description: data.message, variant: "destructive" });
      }
    } catch {
      toast({ title: "Connection Failed", description: "Server error.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Paystack pay ─────────────────────────────────────────────────────────────
  const handlePaystack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPkg || !email) return;
    setIsProcessing(true);
    try {
      const res = await fetch("/api/payments/paystack/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: selectedPkg, email, phone, macAddress, tenantSlug }),
      });
      const data = await res.json() as { authorizationUrl?: string; error?: string };
      if (data.authorizationUrl) {
        // Store tenant slug for callback redirect
        localStorage.setItem("paystack_tenant_slug", tenantSlug);
        window.location.href = data.authorizationUrl;
      } else {
        toast({ title: "Payment Error", description: data.error ?? "Could not start payment.", variant: "destructive" });
        setIsProcessing(false);
      }
    } catch {
      toast({ title: "Payment Error", description: "Server error.", variant: "destructive" });
      setIsProcessing(false);
    }
  };

  // ── Loading / error states ────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
      </div>
    );
  }
  if (error || !config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-sm w-full text-center">
          <AlertTriangle className="mx-auto h-12 w-12 text-amber-500 mb-4" />
          <h2 className="text-xl font-bold mb-2">Portal Unavailable</h2>
          <p className="text-gray-500 text-sm">This hotspot is not configured correctly.</p>
        </div>
      </div>
    );
  }

  // ── Connected ─────────────────────────────────────────────────────────────────
  if (isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border-t-8" style={{ borderColor: primaryColor }}>
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-6 bg-green-100 text-green-600">
            <Wifi size={32} />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-gray-900">Connected!</h1>
          <p className="text-gray-600 mb-6">You now have internet access via <strong>{config.tenantName}</strong>.</p>
          <Button className="w-full font-bold h-12 text-white" style={{ backgroundColor: primaryColor }}
            onClick={() => window.open("https://google.com", "_blank")}>
            Browse the Web
          </Button>
        </div>
      </div>
    );
  }

  // ── Main portal ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex flex-col p-4 bg-gray-50">
      <div className="flex-1 flex flex-col items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl max-w-md w-full border-t-8" style={{ borderColor: primaryColor }}>

          {/* Header */}
          <div className="text-center px-6 pt-8 pb-4">
            {config.logoUrl ? (
              <img src={config.logoUrl} alt={config.tenantName} className="h-16 mx-auto mb-3 object-contain" />
            ) : (
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full mb-3 text-white font-bold text-xl"
                style={{ backgroundColor: primaryColor }}>
                {config.tenantName.substring(0, 2).toUpperCase()}
              </div>
            )}
            <h1 className="text-2xl font-bold text-gray-900">{config.tenantName}</h1>
            <p className="text-gray-500 text-sm mt-1">{config.welcomeMessage ?? "Connect to high-speed internet"}</p>
          </div>

          {/* Tab switcher */}
          <div className="flex border-b border-gray-100 mx-6">
            <button
              onClick={() => setTab("voucher")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors ${tab === "voucher" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
              style={tab === "voucher" ? { borderColor: primaryColor, color: primaryColor } : {}}
            >
              <Ticket className="h-4 w-4" /> Voucher Code
            </button>
            <button
              onClick={() => setTab("pay")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold border-b-2 transition-colors ${tab === "pay" ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-400 hover:text-gray-600"}`}
              style={tab === "pay" ? { borderColor: primaryColor, color: primaryColor } : {}}
            >
              <CreditCard className="h-4 w-4" /> Pay with Card / MoMo
            </button>
          </div>

          {/* Tab: Voucher */}
          {tab === "voucher" && (
            <form onSubmit={handleVoucherConnect} className="px-6 py-6 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="voucherCode" className="text-gray-700 font-semibold uppercase text-xs tracking-wider">
                  Access Code
                </Label>
                <Input
                  id="voucherCode"
                  placeholder="e.g. DEMO1234"
                  value={voucherCode}
                  onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
                  required
                  className="h-12 text-center font-mono text-xl tracking-widest uppercase bg-gray-50 border-2 focus-visible:ring-0"
                  style={{ borderColor: voucherCode ? primaryColor : undefined } as React.CSSProperties}
                />
              </div>
              <Button type="submit" className="w-full font-bold h-12 text-white"
                style={{ backgroundColor: primaryColor }} disabled={isProcessing || !voucherCode}>
                {isProcessing ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Verifying…</> : "CONNECT NOW"}
              </Button>
            </form>
          )}

          {/* Tab: Pay */}
          {tab === "pay" && (
            <form onSubmit={handlePaystack} className="px-6 py-6 space-y-4">
              {/* Package selector */}
              <div className="space-y-2">
                <Label className="text-gray-700 font-semibold uppercase text-xs tracking-wider">Choose a Package</Label>
                <div className="grid grid-cols-1 gap-2">
                  {packages?.map((pkg) => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedPkg(pkg.id)}
                      className={`w-full text-left rounded-xl border-2 p-3 transition-all ${selectedPkg === pkg.id ? "border-indigo-600 bg-indigo-50" : "border-gray-200 hover:border-gray-300 bg-white"}`}
                      style={selectedPkg === pkg.id ? { borderColor: primaryColor, backgroundColor: primaryColor + "10" } : {}}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-gray-900 text-sm">{pkg.name}</p>
                          <p className="text-xs text-gray-500">{pkg.duration} {pkg.durationUnit}
                            {pkg.downloadSpeed ? ` · ${pkg.downloadSpeed} Mbps` : ""}
                          </p>
                        </div>
                        <span className="font-black text-lg" style={{ color: primaryColor }}>{ghs(pkg.price)}</span>
                      </div>
                    </button>
                  ))}
                  {(!packages || packages.length === 0) && (
                    <p className="text-center text-sm text-gray-400 py-4">No packages available.</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-semibold uppercase text-xs tracking-wider">Email <span className="text-gray-400">(for receipt)</span></Label>
                <Input id="email" type="email" placeholder="you@example.com" value={email}
                  onChange={(e) => setEmail(e.target.value)} required className="h-11 bg-gray-50 border-2" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-gray-700 font-semibold uppercase text-xs tracking-wider">Phone <span className="text-gray-400">(optional — for MoMo)</span></Label>
                <Input id="phone" type="tel" placeholder="024 000 0000" value={phone}
                  onChange={(e) => setPhone(e.target.value)} className="h-11 bg-gray-50 border-2" />
              </div>

              <Button type="submit" className="w-full font-bold h-12 text-white"
                style={{ backgroundColor: primaryColor }} disabled={isProcessing || !selectedPkg || !email}>
                {isProcessing
                  ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Redirecting to Paystack…</>
                  : selectedPkg
                    ? `Pay ${ghs(packages?.find(p => p.id === selectedPkg)?.price)} via Paystack`
                    : "Select a Package"}
              </Button>

              <p className="text-center text-xs text-gray-400">
                Secured by <span className="font-semibold text-gray-500">Paystack</span> · Card, MoMo & Bank
              </p>
            </form>
          )}

          {/* Support footer */}
          {config.supportPhone && (
            <div className="mx-6 mb-6 pt-4 border-t text-center">
              <p className="text-xs text-gray-400">Need help?</p>
              <p className="text-sm font-semibold text-gray-700">{config.supportPhone}</p>
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
