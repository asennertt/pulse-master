import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/Contexts/AuthContext";
import { TrendingDown, BarChart3, Timer, Trophy, Users, Clock, Loader2 } from "lucide-react";

interface SoldVehicle {
  id: string;
  vin: string;
  year: number;
  make: string;
  model: string;
  trim: string | null;
  first_posted_at: string | null;
  sold_at: string | null;
  days_to_sell: number | null;
}

interface PostingEvent {
  id: string;
  vehicle_id: string;
  staff_id: string | null;
  event_type: string;
  created_at: string;
}

interface StaffMember {
  id: string;
  name: string;
}

interface StaffStats {
  name: string;
  postCount: number;
  avgDaysToSell: number | null;
}

export function AttributionAnalytics() {
  const { activeDealerId } = useAuth();
  const [soldVehicles, setSoldVehicles] = useState<SoldVehicle[]>([]);
  const [postingEvents, setPostingEvents] = useState<PostingEvent[]>([]);
  const [staffMap, setStaffMap] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeDealerId) return;
    loadData();
  }, [activeDealerId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [vehiclesRes, eventsRes, staffRes] = await Promise.all([
        supabase
          .from("vehicles")
          .select("id, vin, year, make, model, trim, first_posted_at, sold_at, days_to_sell")
          .eq("dealer_id", activeDealerId!)
          .eq("status", "sold")
          .not("sold_at", "is", null)
          .order("sold_at", { ascending: false })
          .limit(50),
        supabase
          .from("posting_events")
          .select("id, vehicle_id, staff_id, event_type, created_at")
          .eq("dealership_id", activeDealerId!)
          .order("created_at", { ascending: false }),
        supabase
          .from("staff")
          .select("id, name")
          .eq("dealership_id", activeDealerId!),
      ]);

      setSoldVehicles((vehiclesRes.data as unknown as SoldVehicle[]) || []);
      setPostingEvents((eventsRes.data as unknown as PostingEvent[]) || []);

      const map = new Map<string, string>();
      if (staffRes.data) {
        for (const s of staffRes.data as unknown as StaffMember[]) {
          map.set(s.id, s.name);
        }
      }
      setStaffMap(map);
    } finally {
      setLoading(false);
    }
  };

  // Compute overall stats
  const vehiclesWithDays = soldVehicles.filter((v) => v.days_to_sell != null);
  const avgDaysToSell =
    vehiclesWithDays.length > 0
      ? Math.round(vehiclesWithDays.reduce((sum, v) => sum + v.days_to_sell!, 0) / vehiclesWithDays.length)
      : null;
  const totalSold = soldVehicles.length;

  const postEvents = postingEvents.filter((e) => e.event_type === "posted");
  const totalPosted = postEvents.length;

  // Posting velocity: posts per week (last 30 days)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const recentPosts = postEvents.filter((e) => new Date(e.created_at) >= thirtyDaysAgo);
  const weeksInRange = Math.max(1, 30 / 7);
  const postsPerWeek = Math.round((recentPosts.length / weeksInRange) * 10) / 10;

  // Staff leaderboard
  const staffStats: StaffStats[] = [];
  const staffPostCounts = new Map<string, number>();
  const staffSoldVehicleIds = new Map<string, Set<string>>();

  for (const event of postEvents) {
    if (!event.staff_id) continue;
    staffPostCounts.set(event.staff_id, (staffPostCounts.get(event.staff_id) || 0) + 1);
    if (!staffSoldVehicleIds.has(event.staff_id)) {
      staffSoldVehicleIds.set(event.staff_id, new Set());
    }
    staffSoldVehicleIds.get(event.staff_id)!.add(event.vehicle_id);
  }

  const soldVehicleMap = new Map(soldVehicles.map((v) => [v.id, v]));

  for (const [staffId, postCount] of staffPostCounts) {
    const name = staffMap.get(staffId) || "Unknown";
    const vehicleIds = staffSoldVehicleIds.get(staffId) || new Set();
    const daysValues: number[] = [];
    for (const vid of vehicleIds) {
      const v = soldVehicleMap.get(vid);
      if (v?.days_to_sell != null) daysValues.push(v.days_to_sell);
    }
    const avg = daysValues.length > 0 ? Math.round(daysValues.reduce((a, b) => a + b, 0) / daysValues.length) : null;
    staffStats.push({ name, postCount, avgDaysToSell: avg });
  }

  staffStats.sort((a, b) => b.postCount - a.postCount);

  const formatDate = (iso: string | null) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Attribution Analytics</h2>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="rounded-lg border border-border bg-secondary p-4">
          <div className="flex items-center gap-2 mb-2">
            <Timer className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Avg Days to Sell</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{avgDaysToSell != null ? avgDaysToSell : "—"}</p>
          <p className="text-xs text-muted-foreground mt-1">
            {vehiclesWithDays.length} vehicle{vehiclesWithDays.length !== 1 ? "s" : ""} tracked
          </p>
        </div>

        <div className="rounded-lg border border-border bg-secondary p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Sold</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalSold}</p>
          <p className="text-xs text-muted-foreground mt-1">with attribution data</p>
        </div>

        <div className="rounded-lg border border-border bg-secondary p-4">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Total Posts</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{totalPosted}</p>
          <p className="text-xs text-muted-foreground mt-1">all-time posting events</p>
        </div>

        <div className="rounded-lg border border-border bg-secondary p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Posts / Week</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{postsPerWeek}</p>
          <p className="text-xs text-muted-foreground mt-1">last 30 days</p>
        </div>
      </div>

      {/* Two-column layout: Time to Sell + Staff Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time to Sell Breakdown */}
        <div className="rounded-lg border border-border bg-secondary p-5">
          <div className="flex items-center gap-2 mb-4">
            <Timer className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Time to Sell</h3>
          </div>
          {soldVehicles.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No sold vehicles with attribution data yet.</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {soldVehicles.slice(0, 20).map((v) => (
                <div key={v.id} className="flex items-center justify-between rounded-md bg-background/50 border border-border/50 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {v.year} {v.make} {v.model} {v.trim || ""}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Posted {formatDate(v.first_posted_at)} &middot; Sold {formatDate(v.sold_at)}
                    </p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    {v.days_to_sell != null ? (
                      <span className={`text-lg font-bold ${v.days_to_sell <= 7 ? "text-green-500" : v.days_to_sell <= 30 ? "text-primary" : "text-orange-400"}`}>
                        {v.days_to_sell}d
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Staff Leaderboard */}
        <div className="rounded-lg border border-border bg-secondary p-5">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-semibold text-foreground">Staff Leaderboard</h3>
          </div>
          {staffStats.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Users className="h-8 w-8 mb-2 opacity-40" />
              <p className="text-sm">No staff posting data yet.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {staffStats.map((s, i) => (
                <div key={s.name + i} className="flex items-center justify-between rounded-md bg-background/50 border border-border/50 px-3 py-2">
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center justify-center h-6 w-6 rounded-full text-xs font-bold ${i === 0 ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{s.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.postCount} post{s.postCount !== 1 ? "s" : ""}
                        {s.avgDaysToSell != null && ` · avg ${s.avgDaysToSell}d to sell`}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span className="text-lg font-bold text-foreground">{s.postCount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
