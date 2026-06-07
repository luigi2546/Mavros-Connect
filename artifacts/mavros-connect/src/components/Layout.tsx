import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
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
  X,
  BarChart3,
  TrendingUp,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";

// Helper function for authenticated fetch
async function authenticatedFetch(url: string) {
  const token = localStorage.getItem("mavros_access_token");
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

const adminNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/reports", label: "Reports", icon: TrendingUp },
  { href: "/locations", label: "Locations", icon: MapPin },
  { href: "/routers", label: "Routers", icon: Wifi },
  { href: "/packages", label: "Packages", icon: Package },
  { href: "/vouchers", label: "Vouchers", icon: Ticket },
  { href: "/payments", label: "Payments", icon: CreditCard },
  { href: "/sessions", label: "Sessions", icon: Activity },
  { href: "/users", label: "Staff", icon: Users },
  { href: "/settings", label: "Settings", icon: Settings },
];

const staffNavItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vouchers", label: "My Vouchers", icon: Ticket },
  { href: "/payments", label: "My Payments", icon: CreditCard },
  { href: "/sessions", label: "My Sessions", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const { logout, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Get unread notification count
  const { data: unreadData } = useQuery({
    queryKey: ["unreadNotifications"],
    queryFn: () => authenticatedFetch("/api/notifications/unread-count"),
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  // Determine which nav items to show based on user role
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const navItems = isAdmin ? adminNavItems : staffNavItems;

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
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-card px-4 md:hidden">
          <div className="flex items-center gap-2">
            <button className="text-muted-foreground" onClick={() => setSidebarOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="font-mono font-bold text-primary">MAVROS</div>
          </div>
          <Link href="/notifications">
            <div className="relative cursor-pointer text-muted-foreground hover:text-foreground transition-colors">
              <Bell size={20} />
              {(unreadData?.unreadCount ?? 0) > 0 && (
                <span className="absolute -top-1 -right-2 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {Math.min(unreadData.unreadCount, 9)}
                </span>
              )}
            </div>
          </Link>
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
