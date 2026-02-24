import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { Vehicle, VehicleStatus } from "@/data/vehicles";
import { VehicleCard } from "@/components/VehicleCard";
import { DashboardStats } from "@/components/DashboardStats";
import { StatusFilter } from "@/components/StatusFilter";
import { GeneratePostPanel } from "@/components/GeneratePostPanel";
import { DispatcherPanel } from "@/components/DispatcherPanel";
import { SmartImageSorter } from "@/components/SmartImageSorter";
import { DMSFeedLog } from "@/components/DMSFeedLog";
import { LeadsTab } from "@/components/LeadsTab";
import { MarketplaceDrawer } from "@/components/MarketplaceDrawer";
import { StaffDashboard } from "@/components/StaffDashboard";
import { SoldAlertsBanner } from "@/components/SoldAlertsBanner";
import { IngestionEngine } from "@/components/IngestionEngine";
import { RenewalsBanner } from "@/components/RenewalsBanner";
import { SettingsHub } from "@/components/SettingsHub";

import { fetchVehicles, updateVehicleStatus, updateFacebookSync, syncInventoryFromDMS } from "@/services/vehicleService";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Database, RefreshCw, Loader2, Users, Car, UserCog, DownloadCloud, Shield, Settings, LogOut, Eye, X, Search } from "lucide-react";
import { useRef } from "react";
import pulseLogo from "@/assets/pulse-logo.png";
import { Input } from "@/components/ui/input";

type Tab = "inventory" | "leads" | "staff" | "ingestion" | "settings";

// Track which vehicles the current user has posted
interface UserPosting {
  vehicle_id: string;
  posted_at: string;
}

const Index = () => {
  const navigate = useNavigate();
  const { isSuperAdmin, isDealerAdmin, signOut, impersonatingDealerId, setImpersonatingDealerId, profile, user } = useAuth();
  const isAdmin = isSuperAdmin || isDealerAdmin;
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("inventory");
  const [activeFilter, setActiveFilter] = useState<VehicleStatus | "All">("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [postVehicle, setPostVehicle] = useState<Vehicle | null>(null);
  const [dispatchVehicle, setDispatchVehicle] = useState<Vehicle | null>(null);
  const [imageSorterVehicle, setImageSorterVehicle] = useState<Vehicle | null>(null);
  const [showDMSLog, setShowDMSLog] = useState(false);
  const [marketplaceVehicle, setMarketplaceVehicle] = useState<Vehicle | null>(null);
  const [userPostings, setUserPostings] = useState<Map<string, string>>(new Map());

  

  // Hide header on scroll down, show on scroll up
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setHeaderVisible(currentY < lastScrollY.current || currentY < 10);
      lastScrollY.current = currentY;
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const loadVehicles = useCallback(async () => {
    try {
      const data = await fetchVehicles();
      setVehicles(data);
    } catch (e: any) {
      toast.error("Failed to load vehicles", { description: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadVehicles(); }, [loadVehicles]);

  // Load current user's postings
  const loadUserPostings = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("user_vehicle_postings")
      .select("vehicle_id, posted_at");
    if (data) {
      const map = new Map<string, string>();
      for (const p of data as unknown as UserPosting[]) {
        map.set(p.vehicle_id, p.posted_at);
      }
      setUserPostings(map);
    }
  }, [user]);

  useEffect(() => { loadUserPostings(); }, [loadUserPostings]);

  // Realtime price change notifications
  useEffect(() => {
    const channel = supabase
      .channel('price-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'price_history' },
        async (payload: any) => {
          const record = payload.new;
          if (!record) return;
          const changeAmount = Number(record.old_price) - Number(record.new_price);
          if (changeAmount > 0) {
            // Price drop — find the vehicle to get details
            const vehicle = vehicles.find(v => v.id === record.vehicle_id);
            const label = vehicle
              ? `${vehicle.year} ${vehicle.make} ${vehicle.model}`
              : 'a vehicle';
            toast.success(`🚨 Price drop detected for ${label}`, {
              description: `$${Number(record.old_price).toLocaleString()} → $${Number(record.new_price).toLocaleString()} (-$${changeAmount.toLocaleString()})`,
              duration: 8000,
            });
            // Refresh vehicles to pick up new price
            loadVehicles();
          }
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [vehicles, loadVehicles]);

  const counts = useMemo(() => ({
    All: vehicles.length,
    available: vehicles.filter(v => v.status === "available").length,
    pending: vehicles.filter(v => v.status === "pending").length,
    sold: vehicles.filter(v => v.status === "sold").length,
  }), [vehicles]);

  const filtered = useMemo(() => {
    let result = activeFilter === "All" ? vehicles : vehicles.filter(v => v.status === activeFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(v =>
        `${v.year} ${v.make} ${v.model} ${v.trim || ""} ${v.vin} ${v.exterior_color || ""}`.toLowerCase().includes(q)
      );
    }
    return result;
  }, [vehicles, activeFilter, searchQuery]);

  const handleMarkSold = async (id: string) => {
    const vehicle = vehicles.find(v => v.id === id);
    if (!vehicle) return;
    setVehicles(prev => prev.map(v =>
      v.id === id ? { ...v, status: "sold" as VehicleStatus, synced_to_facebook: false, facebook_post_id: null } : v
    ));
    try {
      await updateVehicleStatus(id, "sold");
      toast.success(`${vehicle.year} ${vehicle.make} ${vehicle.model} marked as Sold`, {
        description: "Listing removed · Facebook kill webhook triggered.",
      });
    } catch (e: any) {
      setVehicles(prev => prev.map(v => v.id === id ? vehicle : v));
      toast.error("Failed to update status", { description: e.message });
    }
  };

  const handleSynced = async (id: string) => {
    // Record posting for current user in user_vehicle_postings
    if (user && profile?.dealership_id) {
      const { error } = await supabase
        .from("user_vehicle_postings")
        .upsert({
          user_id: user.id,
          vehicle_id: id,
          dealer_id: profile.dealership_id,
          posted_at: new Date().toISOString(),
        }, { onConflict: "user_id,vehicle_id" });
      if (!error) {
        setUserPostings(prev => new Map(prev).set(id, new Date().toISOString()));
      }
    }
    // Also update the vehicle-level sync flag for backwards compat
    const mockPostId = `fb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setVehicles(prev => prev.map(v =>
      v.id === id ? { ...v, synced_to_facebook: true, facebook_post_id: mockPostId } : v
    ));
    try {
      await updateFacebookSync(id, true, mockPostId);
    } catch {
      toast.error("Failed to update sync status");
    }
  };

  const handleDMSSync = async () => {
    setSyncing(true);
    try {
      const result = await syncInventoryFromDMS();
      await loadVehicles();
      toast.success("DMS Sync Complete", {
        description: `${result.added} new vehicle(s) added · ${result.markedSold} marked as sold`,
      });
    } catch (e: any) {
      toast.error("Sync failed", { description: e.message });
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Impersonation Banner */}
      {impersonatingDealerId && (
        <div className="bg-warning/10 border-b border-warning/30 px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2 text-warning text-sm">
            <Eye className="h-4 w-4" />
            <span className="font-medium">Impersonation Mode</span>
            <span className="text-xs text-muted-foreground">Viewing as dealer — data is filtered to their account</span>
          </div>
          <button
            onClick={() => { setImpersonatingDealerId(null); navigate("/super-admin"); }}
            className="flex items-center gap-1.5 rounded-md bg-warning/20 border border-warning/30 px-3 py-1 text-xs text-warning hover:bg-warning/30 transition-colors"
          >
            <X className="h-3 w-3" /> Exit Impersonation
          </button>
        </div>
      )}

      <header className={`border-b border-border glass sticky top-0 z-40 transition-transform duration-300 ${headerVisible ? "translate-y-0" : "-translate-y-full"}`}>
        <div className="max-w-[1600px] mx-auto flex items-center justify-between px-6 py-2">
          <div className="flex items-center gap-3">
            <img src={pulseLogo} alt="Pulse Posting" className="h-14 w-auto object-contain" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center rounded-lg bg-secondary border border-border p-0.5">
              <button onClick={() => setActiveTab("inventory")} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === "inventory" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                <Car className="h-3.5 w-3.5" /> Inventory
              </button>
              {isAdmin && (
                <>
                  <button onClick={() => setActiveTab("staff")} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === "staff" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                    <UserCog className="h-3.5 w-3.5" /> Staff
                  </button>
                  <button onClick={() => setActiveTab("ingestion")} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === "ingestion" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                    <DownloadCloud className="h-3.5 w-3.5" /> Ingestion
                  </button>
                  <button onClick={() => setActiveTab("settings")} className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${activeTab === "settings" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                    <Settings className="h-3.5 w-3.5" /> Settings
                  </button>
                </>
              )}
            </div>

            <button onClick={handleDMSSync} disabled={syncing} className="flex items-center gap-1.5 rounded-md bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/20 transition-colors disabled:opacity-50">
              {syncing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              {syncing ? "Syncing..." : "Sync DMS"}
            </button>
            <button onClick={() => setShowDMSLog(true)} className="flex items-center gap-1.5 rounded-md bg-secondary border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <Database className="h-3.5 w-3.5" /> Feed Log
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => navigate("/super-admin")}
                className="flex items-center gap-1.5 rounded-md bg-destructive/10 border border-destructive/20 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/20 transition-colors"
              >
                <Shield className="h-3.5 w-3.5" /> Admin
              </button>
            )}
            <button onClick={signOut} className="flex items-center gap-1.5 rounded-md bg-secondary border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              <LogOut className="h-3.5 w-3.5" />
            </button>
            <div className="hidden sm:flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-success animate-pulse-glow" />
              Online
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-6 py-6">
        {/* Sold Alerts Banner */}
        <SoldAlertsBanner />

        {activeTab === "inventory" ? (
          <>
            <RenewalsBanner />
            <DashboardStats vehicles={vehicles} />
            <div className="mt-6 flex gap-6">
              <aside className="w-56 shrink-0 hidden md:block">
                <StatusFilter activeFilter={activeFilter} onFilterChange={setActiveFilter} counts={counts} />
              </aside>
              <main className="flex-1">
                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by make, model, year, VIN..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-2 mb-4 md:hidden overflow-x-auto pb-2">
                  {(["All", "available", "pending", "sold"] as const).map(f => (
                    <button key={f} onClick={() => setActiveFilter(f)} className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${activeFilter === f ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                      {f === "All" ? "All" : f === "available" ? "Active" : f === "pending" ? "Pending" : "Sold"} ({counts[f]})
                    </button>
                  ))}
                </div>
                {loading ? (
                  <div className="flex items-center justify-center py-20">
                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filtered.map((vehicle) => (
                      <VehicleCard
                        key={vehicle.id}
                        vehicle={vehicle}
                        userPostedAt={userPostings.get(vehicle.id) || null}
                        onMarkSold={handleMarkSold}
                        onGeneratePost={setPostVehicle}
                        onDispatch={setDispatchVehicle}
                        onImageSort={(v) => setImageSorterVehicle(v)}
                        onListMarketplace={setMarketplaceVehicle}
                      />
                    ))}
                  </div>
                )}
                {!loading && filtered.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                    <p className="text-sm">No vehicles in this category</p>
                  </div>
                )}
              </main>
            </div>
          </>
        ) : activeTab === "leads" ? (
          <LeadsTab />
        ) : activeTab === "staff" ? (
          <StaffDashboard />
        ) : activeTab === "ingestion" ? (
          <IngestionEngine />
        ) : (
          <SettingsHub />
        )}
      </div>

      {postVehicle && <GeneratePostPanel vehicle={postVehicle} onClose={() => setPostVehicle(null)} />}
      {dispatchVehicle && <DispatcherPanel vehicle={dispatchVehicle} onClose={() => setDispatchVehicle(null)} onSynced={handleSynced} />}
      {imageSorterVehicle && <SmartImageSorter vehicle={imageSorterVehicle} onClose={() => setImageSorterVehicle(null)} />}
      {showDMSLog && <DMSFeedLog onClose={() => setShowDMSLog(false)} />}
      {marketplaceVehicle && (
        <MarketplaceDrawer
          vehicle={marketplaceVehicle}
          onClose={() => setMarketplaceVehicle(null)}
          onSynced={handleSynced}
        />
      )}
    </div>
  );
};

export default Index;
