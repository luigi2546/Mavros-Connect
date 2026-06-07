import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  MapPin, 
  Wifi, 
  Package, 
  Ticket, 
  CreditCard, 
  Activity, 
  Users, 
  Settings,
  LogOut,
  Menu,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/locations", label: "Locations", icon: MapPin },
  { href: "/routers", label: "Routers", icon: Wifi },
  { href: "/packages", label: "Packages", icon: Package },
  { href: "/vouchers", label: "Vouchers", icon: Ticket },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/sessions", label: "Sessions", icon: Activity },
  { href: "/users", label: "Staff", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground selection:bg-primary/30">
      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 md:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 w-64 transform flex-col border-r border-border bg-card transition-transform duration-200 ease-in-out md:relative md:flex md:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-6">
          <div className="flex items-center gap-2 font-mono font-bold tracking-tight text-primary">
            <div className="h-4 w-4 rounded-sm bg-primary" />
            MAVROS
          </div>
          <button className="md:hidden text-muted-foreground" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4 scrollbar-thin">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.startsWith(item.href);
            return (
              <Link key={item.href} href={item.href}>
                <div
                  onClick={() => setSidebarOpen(false)}
                  className={`flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon size={18} className={isActive ? "text-primary" : "text-muted-foreground"} />
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-border p-4">
          <div className="mb-4 px-2">
            <p className="truncate text-sm font-medium">{user?.name || "Operator"}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email || "sysadmin@mavros"}</p>
          </div>
          <Button variant="outline" className="w-full justify-start gap-2" onClick={logout}>
            <LogOut size={16} />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex flex-1 flex-col min-w-0 overflow-hidden">
        {/* Mobile Header */}
        <header className="flex h-14 shrink-0 items-center border-b border-border bg-card px-4 md:hidden">
          <button className="text-muted-foreground mr-4" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <div className="font-mono font-bold text-primary">MAVROS</div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin bg-muted/20">
          <div className="mx-auto max-w-7xl">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
