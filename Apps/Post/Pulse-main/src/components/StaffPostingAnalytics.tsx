import { useState, useEffect, useMemo, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/Contexts/AuthContext";
import {
  BarChart3, Calendar, ChevronLeft, ChevronRight, Download,
  Loader2, Users, Car, TrendingUp, Printer, Filter,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

// ── Types ──────────────────────────────────────────────
interface PostingRecord {
  id: string;
  user_id: string;
  vehicle_id: string;
  dealer_id: string;
  posted_at: string;
  user_name: string;
  vehicle_label: string;
}

interface StaffSummary {
  user_id: string;
  name: string;
  total: number;
  posts: PostingRecord[];
}

type RangeMode = "day" | "week" | "month";

// ── Helpers ────────────────────────────────────────────
function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function startOfWeek(d: Date) {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday start
  return new Date(d.getFullYear(), d.getMonth(), diff);
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}
function endOfWeek(d: Date) {
  const s = startOfWeek(d);
  return new Date(s.getFullYear(), s.getMonth(), s.getDate() + 6, 23, 59, 59, 999);
}
function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
}

function formatRangeLabel(date: Date, mode: RangeMode): string {
  const opts: Intl.DateTimeFormatOptions =
    mode === "day" ? { weekday: "short", month: "short", day: "numeric" }
    : mode === "week" ? { month: "short", day: "numeric" }
    : { month: "long", year: "numeric" };
  if (mode === "week") {
    const end = endOfWeek(date);
    return `${date.toLocaleDateString("en-US", opts)} – ${end.toLocaleDateString("en-US", opts)}`;
  }
  return date.toLocaleDateString("en-US", opts);
}

function navigate(date: Date, mode: RangeMode, direction: -1 | 1): Date {
  if (mode === "day") return new Date(date.getFullYear(), date.getMonth(), date.getDate() + direction);
  if (mode === "week") return new Date(date.getFullYear(), date.getMonth(), date.getDate() + direction * 7);
  return new Date(date.getFullYear(), date.getMonth() + direction, 1);
}

function getRange(date: Date, mode: RangeMode): [Date, Date] {
  if (mode === "day") return [startOfDay(date), endOfDay(date)];
  if (mode === "week") return [startOfWeek(date), endOfWeek(date)];
  return [startOfMonth(date), endOfMonth(date)];
}

// ── Chart colors (cycle through these) ─────────────────
const CHART_COLORS = [
  "hsl(205, 100%, 55%)", // primary blue
  "hsl(160, 70%, 45%)",  // green
  "hsl(280, 60%, 55%)",  // purple
  "hsl(30, 90%, 55%)",   // orange
  "hsl(340, 70%, 55%)",  // pink
  "hsl(190, 80%, 45%)",  // teal
  "hsl(50, 90%, 50%)",   // gold
  "hsl(0, 70%, 55%)",    // red
];

// ── Custom Tooltip ─────────────────────────────────────
function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg bg-popover border border-border px-3 py-2 shadow-lg">
      <div className="text-sm font-semibold text-foreground">{d.name}</div>
      <div className="text-xs text-primary font-bold">{d.total} post{d.total !== 1 ? "s" : ""}</div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────
export function StaffPostingAnalytics() {
  const { profile } = useAuth();
  const dealerId = profile?.dealership_id;

  const [loading, setLoading] = useState(true);
  const [allRecords, setAllRecords] = useState<PostingRecord[]>([]);
  const [mode, setMode] = useState<RangeMode>("week");
  const [refDate, setRefDate] = useState(new Date());
  const [selectedStaff, setSelectedStaff] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  // ── Load all posting data + join profiles + vehicles ──
  useEffect(() => {
    if (!dealerId) return;
    loadData();
  }, [dealerId]);

  const loadData = async () => {
    setLoading(true);

    // Fetch postings for this dealer
    const { data: postings } = await supabase
      .from("user_vehicle_postings")
      .select("*")
      .eq("dealer_id", dealerId)
      .order("posted_at", { ascending: false });

    if (!postings || postings.length === 0) {
      setAllRecords([]);
      setLoading(false);
      return;
    }

    // Get unique user IDs and vehicle IDs
    const userIds = [...new Set(postings.map((p: any) => p.user_id))];
    const vehicleIds = [...new Set(postings.map((p: any) => p.vehicle_id))];

    // Fetch profiles and vehicles in parallel
    const [profilesRes, vehiclesRes] = await Promise.all([
      supabase.from("profiles").select("user_id, full_name").in("user_id", userIds),
      supabase.from("vehicles").select("id, year, make, model").in("id", vehicleIds),
    ]);

    const profileMap = new Map(
      (profilesRes.data || []).map((p: any) => [p.user_id, p.full_name || "Unknown Staff"])
    );
    const vehicleMap = new Map(
      (vehiclesRes.data || []).map((v: any) => [v.id, `${v.year} ${v.make} ${v.model}`])
    );

    const records: PostingRecord[] = postings.map((p: any) => ({
      id: p.id,
      user_id: p.user_id,
      vehicle_id: p.vehicle_id,
      dealer_id: p.dealer_id,
      posted_at: p.posted_at,
      user_name: profileMap.get(p.user_id) || "Unknown Staff",
      vehicle_label: vehicleMap.get(p.vehicle_id) || "Unknown Vehicle",
    }));

    setAllRecords(records);
    setLoading(false);
  };

  // ── Filter records by current date range ──────────────
  const [rangeStart, rangeEnd] = useMemo(() => getRange(refDate, mode), [refDate, mode]);

  const filteredRecords = useMemo(() =>
    allRecords.filter(r => {
      const d = new Date(r.posted_at);
      return d >= rangeStart && d <= rangeEnd;
    }),
    [allRecords, rangeStart, rangeEnd]
  );

  // ── Aggregate by staff ────────────────────────────────
  const staffSummaries: StaffSummary[] = useMemo(() => {
    const map = new Map<string, StaffSummary>();
    for (const r of filteredRecords) {
      if (!map.has(r.user_id)) {
        map.set(r.user_id, { user_id: r.user_id, name: r.user_name, total: 0, posts: [] });
      }
      const s = map.get(r.user_id)!;
      s.total++;
      s.posts.push(r);
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [filteredRecords]);

  // Chart data
  const chartData = staffSummaries.map((s, i) => ({
    name: s.name.split(" ")[0], // first name for chart labels
    fullName: s.name,
    total: s.total,
    color: CHART_COLORS[i % CHART_COLORS.length],
    user_id: s.user_id,
  }));

  const totalPosts = staffSummaries.reduce((s, x) => s + x.total, 0);

  // ── Print report ──────────────────────────────────────
  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const rangeLabel = formatRangeLabel(mode === "week" ? startOfWeek(refDate) : mode === "month" ? startOfMonth(refDate) : refDate, mode);

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Staff Posting Report — ${rangeLabel}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; padding: 40px; color: #1a1a2e; }
          h1 { font-size: 22px; margin-bottom: 4px; }
          .subtitle { font-size: 13px; color: #666; margin-bottom: 24px; }
          .stats { display: flex; gap: 24px; margin-bottom: 24px; }
          .stat { background: #f5f5f7; border-radius: 8px; padding: 12px 20px; }
          .stat-value { font-size: 24px; font-weight: 700; color: #1a73e8; }
          .stat-label { font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { text-align: left; padding: 10px 12px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #888; border-bottom: 2px solid #eee; }
          td { padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #f0f0f0; }
          .staff-name { font-weight: 600; }
          .count { font-weight: 700; color: #1a73e8; text-align: right; }
          .vehicle-list { font-size: 11px; color: #666; margin-top: 4px; }
          .footer { margin-top: 32px; font-size: 10px; color: #aaa; border-top: 1px solid #eee; padding-top: 12px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>Staff Posting Report</h1>
        <div class="subtitle">${rangeLabel} · Printed ${new Date().toLocaleString()}</div>
        <div class="stats">
          <div class="stat">
            <div class="stat-value">${totalPosts}</div>
            <div class="stat-label">Total Posts</div>
          </div>
          <div class="stat">
            <div class="stat-value">${staffSummaries.length}</div>
            <div class="stat-label">Active Staff</div>
          </div>
          <div class="stat">
            <div class="stat-value">${staffSummaries.length > 0 ? (totalPosts / staffSummaries.length).toFixed(1) : 0}</div>
            <div class="stat-label">Avg per Staff</div>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Staff Member</th>
              <th>Vehicles Posted</th>
              <th style="text-align:right">Total Posts</th>
            </tr>
          </thead>
          <tbody>
            ${staffSummaries.map(s => `
              <tr>
                <td class="staff-name">${s.name}</td>
                <td>
                  <div class="vehicle-list">
                    ${s.posts.map(p => `${p.vehicle_label} — ${new Date(p.posted_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`).join("<br/>")}
                  </div>
                </td>
                <td class="count">${s.total}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
        <div class="footer">Generated by Pulse Post · ${window.location.origin}</div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => printWindow.print(), 300);
  };

  // ── Navigate date range ───────────────────────────────
  const goBack = () => setRefDate(d => navigate(d, mode, -1));
  const goForward = () => setRefDate(d => navigate(d, mode, 1));
  const goToday = () => setRefDate(new Date());

  const rangeLabel = formatRangeLabel(
    mode === "week" ? startOfWeek(refDate) : mode === "month" ? startOfMonth(refDate) : refDate,
    mode
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6" ref={printRef}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" /> Staff Posting Analytics
        </h2>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 rounded-md bg-secondary border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <Printer className="h-3.5 w-3.5" /> Print Report
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="stat-gradient rounded-lg border border-border p-4 text-center">
          <Car className="h-5 w-5 mx-auto mb-1 text-primary" />
          <div className="text-2xl font-bold text-primary">{totalPosts}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Posts</div>
        </div>
        <div className="stat-gradient rounded-lg border border-border p-4 text-center">
          <Users className="h-5 w-5 mx-auto mb-1 text-foreground" />
          <div className="text-2xl font-bold text-foreground">{staffSummaries.length}</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Active Staff</div>
        </div>
        <div className="stat-gradient rounded-lg border border-border p-4 text-center">
          <TrendingUp className="h-5 w-5 mx-auto mb-1 text-success" />
          <div className="text-2xl font-bold text-success">
            {staffSummaries.length > 0 ? (totalPosts / staffSummaries.length).toFixed(1) : "0"}
          </div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Avg / Staff</div>
        </div>
      </div>

      {/* Controls: mode toggle + date nav */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        {/* Range mode toggle */}
        <div className="flex items-center rounded-lg bg-secondary border border-border p-0.5">
          {(["day", "week", "month"] as RangeMode[]).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "day" ? "Daily" : m === "week" ? "Weekly" : "Monthly"}
            </button>
          ))}
        </div>

        {/* Date navigator */}
        <div className="flex items-center gap-2">
          <button onClick={goBack} className="rounded-md bg-secondary border border-border p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={goToday}
            className="flex items-center gap-1.5 rounded-md bg-secondary border border-border px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors min-w-[180px] justify-center"
          >
            <Calendar className="h-3.5 w-3.5 text-primary" /> {rangeLabel}
          </button>
          <button onClick={goForward} className="rounded-md bg-secondary border border-border p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chart */}
      <div className="glass-card rounded-lg p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Posts per Staff Member</h3>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 18%, 16%)" />
              <XAxis
                dataKey="name"
                tick={{ fill: "hsl(210, 20%, 60%)", fontSize: 12 }}
                axisLine={{ stroke: "hsl(220, 18%, 16%)" }}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "hsl(210, 20%, 60%)", fontSize: 12 }}
                axisLine={{ stroke: "hsl(220, 18%, 16%)" }}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: "hsl(220, 18%, 12%)" }} />
              <Bar
                dataKey="total"
                radius={[6, 6, 0, 0]}
                cursor="pointer"
                onClick={(data: any) => setSelectedStaff(
                  selectedStaff === data.user_id ? null : data.user_id
                )}
              >
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={selectedStaff === entry.user_id ? entry.color : selectedStaff ? `${entry.color}40` : entry.color}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <BarChart3 className="h-8 w-8 mb-2 opacity-30" />
            <p className="text-sm">No posting data for this period</p>
            <p className="text-xs mt-1">Try selecting a different date range</p>
          </div>
        )}
      </div>

      {/* Staff detail table */}
      <div className="glass-card rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Posting History</h3>
          {selectedStaff && (
            <button
              onClick={() => setSelectedStaff(null)}
              className="flex items-center gap-1 text-[10px] text-primary hover:text-primary/80 transition-colors"
            >
              <Filter className="h-3 w-3" /> Clear filter
            </button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Staff Member</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Vehicle</th>
                <th className="text-left px-4 py-3 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Posted</th>
              </tr>
            </thead>
            <tbody>
              {(selectedStaff
                ? filteredRecords.filter(r => r.user_id === selectedStaff)
                : filteredRecords
              ).map(r => (
                <tr key={r.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{r.user_name}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-foreground">{r.vehicle_label}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-muted-foreground">
                      {new Date(r.posted_at).toLocaleString("en-US", {
                        month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                      })}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground text-sm">
                    No posting data for this period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* All-time leaderboard */}
      {allRecords.length > 0 && (
        <div className="glass-card rounded-lg p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground">All-Time Leaderboard</h3>
          <div className="space-y-2">
            {(() => {
              const allTime = new Map<string, { name: string; total: number }>();
              for (const r of allRecords) {
                if (!allTime.has(r.user_id)) allTime.set(r.user_id, { name: r.user_name, total: 0 });
                allTime.get(r.user_id)!.total++;
              }
              const sorted = [...allTime.values()].sort((a, b) => b.total - a.total);
              const max = sorted[0]?.total || 1;
              return sorted.map((s, i) => (
                <div key={i} className="flex items-center gap-3">
                  <span className={`flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-bold shrink-0 ${
                    i === 0 ? "bg-primary/20 text-primary" :
                    i === 1 ? "bg-secondary text-foreground" :
                    i === 2 ? "bg-secondary text-foreground" :
                    "bg-secondary/60 text-muted-foreground"
                  }`}>
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-foreground">{s.name}</span>
                      <span className="text-xs font-bold text-primary">{s.total}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500"
                        style={{ width: `${(s.total / max) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ));
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
