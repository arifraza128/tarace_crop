import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Sprout, 
  ThermometerSun, 
  BellRing, 
  LineChart, 
  Cpu, 
  Settings, 
  LogOut, 
  Menu, 
  X,
  Map,
  ShoppingBasket
} from "lucide-react";
import { useGetFarm } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/farm", label: "Farm Setup", icon: Map },
  { href: "/crops", label: "Crops", icon: Sprout },
  { href: "/readings", label: "Readings", icon: ThermometerSun },
  { href: "/alerts", label: "Alerts", icon: BellRing },
  { href: "/analytics", label: "Analytics", icon: LineChart },
  { href: "/devices", label: "Devices", icon: Cpu },
  { href: "/prices", label: "Crop Prices", icon: ShoppingBasket },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();
  
  // Try to get farm profile to show in header
  const { data: farm } = useGetFarm({
    query: { retry: false }
  });

  const SidebarContent = () => (
    <>
      <div className="p-6 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20">
          <Sprout className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="font-display font-bold text-xl text-foreground">SmartTerrace</h1>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1 overflow-y-auto no-scrollbar">
        {NAV_ITEMS.map((item) => {
          const isActive = location === item.href;
          return (
            <Link 
              key={item.href} 
              href={item.href}
              onClick={() => setIsMobileOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 font-medium",
                isActive 
                  ? "bg-primary text-white shadow-md shadow-primary/20" 
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              )}
            >
              <item.icon className={cn("w-5 h-5", isActive ? "text-white" : "text-muted-foreground")} />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 mt-auto">
        <div className="p-4 rounded-2xl bg-secondary/50 border border-border/50 mb-4">
          <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/10 transition-colors font-medium"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-border z-20">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Sprout className="w-5 h-5 text-white" />
          </div>
          <span className="font-display font-bold text-lg">SmartTerrace</span>
        </div>
        <button onClick={() => setIsMobileOpen(true)} className="p-2 text-foreground">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.div 
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-72 bg-white shadow-2xl z-50 flex flex-col md:hidden"
            >
              <div className="absolute top-4 right-4">
                <button onClick={() => setIsMobileOpen(false)} className="p-2 text-muted-foreground hover:text-foreground bg-secondary rounded-full">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col w-72 bg-white border-r border-border shrink-0 z-10 shadow-sm relative">
        <SidebarContent />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col w-full min-w-0 overflow-hidden relative">
        {/* Desktop Top Nav */}
        <header className="hidden md:flex items-center justify-between h-20 px-8 bg-white/50 backdrop-blur-md border-b border-border/50 sticky top-0 z-10">
          <div>
            <h2 className="text-xl font-display font-bold text-foreground">
              {farm ? farm.farmName : "Welcome to SmartTerrace"}
            </h2>
            {farm && <p className="text-sm text-muted-foreground flex items-center gap-1"><Map className="w-3 h-3"/> {farm.location}</p>}
          </div>
          
          <div className="flex items-center gap-4">
            <Link href="/alerts" className="relative p-2 text-muted-foreground hover:text-primary hover:bg-primary/5 rounded-full transition-colors">
              <BellRing className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border border-white"></span>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 no-scrollbar relative z-0">
          <motion.div
            key={location}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  );
}
