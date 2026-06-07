import { useEffect } from "react";
import { useListVouchers, getListVouchersQueryKey, useListPackages, getListPackagesQueryKey } from "@workspace/api-client-react";
import { ghs } from "@/lib/currency";

export default function VoucherPrint() {
  const { data: vouchers } = useListVouchers({ query: { queryKey: getListVouchersQueryKey() } });
  const { data: packages } = useListPackages({ query: { queryKey: getListPackagesQueryKey() } });

  const pkgMap = Object.fromEntries((packages ?? []).map(p => [p.id, p]));

  // Only show unused vouchers by default (query param ?all=1 shows all)
  const showAll = new URLSearchParams(window.location.search).get("all") === "1";
  const list = (vouchers ?? []).filter(v => showAll || v.status === "unused");

  useEffect(() => {
    if (list.length > 0) {
      document.title = "Vouchers — Print";
    }
  }, [list.length]);

  return (
    <div className="print-page p-4 font-mono bg-white min-h-screen">
      <div className="no-print mb-4 flex gap-2 items-center">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-indigo-600 text-white rounded text-sm font-bold"
        >
          🖨️ Print
        </button>
        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 border rounded text-sm"
        >
          ← Back
        </button>
        <span className="text-sm text-gray-500">{list.length} voucher{list.length !== 1 ? "s" : ""} ready to print</span>
      </div>

      <div className="voucher-grid">
        {list.map((v) => {
          const pkg = pkgMap[v.packageId];
          return (
            <div key={v.id} className="voucher-card">
              <div className="voucher-header">
                <span className="brand">MAVROS CONNECT</span>
                {pkg && <span className="pkg-name">{pkg.name}</span>}
              </div>
              <div className="voucher-code">{v.code}</div>
              <div className="voucher-details">
                {pkg && (
                  <>
                    <span>{ghs(pkg.price)}</span>
                    <span className="sep">·</span>
                    <span>{pkg.duration} {pkg.durationUnit}</span>
                    {pkg.downloadSpeed && <><span className="sep">·</span><span>{pkg.downloadSpeed}Mbps</span></>}
                  </>
                )}
              </div>
              {v.expiresAt && (
                <div className="voucher-expiry">
                  Expires: {new Date(v.expiresAt).toLocaleDateString("en-GH", { day: "2-digit", month: "short", year: "numeric" })}
                </div>
              )}
              <div className="voucher-footer">Valid once · Not transferable</div>
            </div>
          );
        })}
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { margin: 0; background: white; }
        }
        .voucher-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
        }
        @media (max-width: 600px) {
          .voucher-grid { grid-template-columns: repeat(2, 1fr); }
        }
        .voucher-card {
          border: 2px dashed #4F46E5;
          border-radius: 8px;
          padding: 12px;
          text-align: center;
          background: white;
          page-break-inside: avoid;
        }
        .voucher-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #6B7280;
          margin-bottom: 8px;
        }
        .brand { font-weight: 700; color: #4F46E5; }
        .pkg-name { font-weight: 600; color: #374151; }
        .voucher-code {
          font-size: 22px;
          font-weight: 900;
          letter-spacing: 0.15em;
          color: #111827;
          padding: 8px 0;
          border-top: 1px solid #E5E7EB;
          border-bottom: 1px solid #E5E7EB;
          margin: 6px 0;
        }
        .voucher-details {
          font-size: 10px;
          color: #4B5563;
          font-weight: 600;
          margin: 4px 0;
        }
        .sep { margin: 0 4px; color: #D1D5DB; }
        .voucher-expiry {
          font-size: 9px;
          color: #EF4444;
          margin-top: 4px;
        }
        .voucher-footer {
          font-size: 8px;
          color: #9CA3AF;
          margin-top: 6px;
        }
      `}</style>
    </div>
  );
}
