import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useQueryClient } from "@tanstack/react-query";

export default function PaystackCallback() {
  const [state, setState] = useState<"loading" | "success" | "failed">("loading");
  const [voucherCode, setVoucherCode] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reference = params.get("reference") ?? params.get("trxref");
    const tenantSlug = localStorage.getItem("paystack_tenant_slug");
    
    if (!reference) {
      setState("failed");
      setMessage("No payment reference found.");
      return;
    }

    // Give Paystack webhook a moment to process, then verify
    setTimeout(async () => {
      try {
        const response = await fetch(`/api/payments/paystack/verify/${reference}`);
        const data = await response.json() as { success: boolean; voucherCode?: string; message?: string };

        if (data.success && data.voucherCode) {
          setVoucherCode(data.voucherCode);
          localStorage.setItem("paystack_voucher", data.voucherCode);
          if (tenantSlug) {
            setPortalUrl(`/portal/${tenantSlug}?voucher=${data.voucherCode}`);
          }
          
          // Invalidate dashboard cache so it refreshes with new payment
          queryClient.invalidateQueries({ queryKey: ["getDashboardStats"] });
          
          setState("success");
        } else {
          setState("failed");
          setMessage(data.message ?? "Payment could not be verified.");
        }
      } catch (error) {
        setState("failed");
        setMessage("Server error while verifying payment.");
      }
    }, 1500); // Wait 1.5 seconds for webhook to process
  }, [queryClient]);

  const handleGoBack = () => {
    if (portalUrl) {
      window.location.href = portalUrl;
    } else {
      window.history.back();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-8 text-center border-t-8 border-indigo-600">
        {state === "loading" && (
          <>
            <Loader2 className="mx-auto h-14 w-14 text-indigo-500 animate-spin mb-4" />
            <h2 className="text-xl font-bold text-gray-800">Verifying Payment…</h2>
            <p className="text-gray-500 text-sm mt-2">Please wait while we confirm your transaction.</p>
          </>
        )}

        {state === "success" && voucherCode && (
          <>
            <CheckCircle className="mx-auto h-14 w-14 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Payment Successful!</h2>
            <p className="text-gray-500 text-sm mb-6">Your internet access code is ready.</p>
            <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4 mb-6">
              <p className="text-xs text-indigo-600 font-semibold uppercase tracking-widest mb-1">Your Access Code</p>
              <p className="font-mono text-3xl font-black tracking-widest text-indigo-700">{voucherCode}</p>
            </div>
            <p className="text-xs text-gray-400 mb-6">Redirecting you back to the hotspot portal to activate your access...</p>
            <Button
              className="w-full font-bold"
              onClick={() => {
                navigator.clipboard?.writeText(voucherCode);
                handleGoBack();
              }}
            >
              Copy Code & Go to Portal
            </Button>
          </>
        )}

        {state === "failed" && (
          <>
            <XCircle className="mx-auto h-14 w-14 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Verification Failed</h2>
            <p className="text-gray-500 text-sm mb-6">{message}</p>
            <Button variant="outline" className="w-full" onClick={handleGoBack}>
              Go Back to Portal
            </Button>
          </>
        )}

        <p className="text-xs text-gray-300 mt-6 font-mono">Powered by Mavros Connect</p>
      </div>
    </div>
  );
}
