import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingDown, TrendingUp, DollarSign, Loader2, X, ArrowDown, ArrowUp } from "lucide-react";
import type { Vehicle } from "@/data/vehicles";

interface PriceHistoryEntry {
  id: string;
  old_price: number;
  new_price: number;
  change_amount: number;
  change_percent: number;
  source: string;
  change_date: string;
}

interface PriceHistoryChartProps {
  vehicle: Vehicle;
  onClose: () => void;
}

export function PriceHistoryChart({ vehicle, onClose }: PriceHistoryChartProps) {
  const [history, setHistory] = useState<PriceHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, [vehicle.id]);

  const loadHistory = async () => {
    const { data, error } = await supabase
      .from("pulse_price_history")
      .select("*")
      .eq("vehicle_id", vehicle.id)
      .order("change_date", { ascending: true });
    if (!error && data) {
      setHistory(data as unknown as PriceHistoryEntry[]);
    }
    setLoading(false);
  };

  // Build chart data: start with first old_price, then each new_price
  const chartData = history.length > 0
    ? [
        { date: "Listed", price: Number(history[0].old_price) },
        ...history.map(h => ({
          date: new Date(h.change_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          price: Number(h.new_price),
        })),
      ]
    : [{ date: "Current", price: Number(vehicle.price) }];

  const totalDrop = history.length > 0
    ? Number(history[0].old_price) - Number(history[history.length - 1].new_price)
    : 0;
  const totalPercent = history.length > 0 && Number(history[0].old_price) > 0
    ? ((totalDrop / Number(history[0].old_price)) * 100).toFixed(1)
    : "0";

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="glass-card rounded-xl w-full max-w-2xl max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-5 border-b border-border">
          <div>
            <h2 className="text-base font-bold text-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" />
              Price History
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {vehicle.year} {vehicle.make} {vehicle.model} · VIN: {vehicle.vin.slice(-6)}
            </p>
          </div>
          <button onClick={onClose} className="rounded-md bg-secondary border border-border p-1.5 text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-secondary/60 border border-border p-3 text-center">
              <div className="text-lg font-bold text-foreground">${Number(vehicle.price).toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Current Price</div>
            </div>
            <div className="rounded-lg bg-secondary/60 border border-border p-3 text-center">
              <div className="text-lg font-bold text-foreground">{history.length}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Price Changes</div>
            </div>
            <div className={`rounded-lg border p-3 text-center ${totalDrop > 0 ? "bg-success/10 border-success/20" : totalDrop < 0 ? "bg-destructive/10 border-destructive/20" : "bg-secondary/60 border-border"}`}>
              <div className={`text-lg font-bold flex items-center justify-center gap-1 ${totalDrop > 0 ? "text-success" : totalDrop < 0 ? "text-destructive" : "text-foreground"}`}>
                {totalDrop > 0 ? <ArrowDown className="h-4 w-4" /> : totalDrop < 0 ? <ArrowUp className="h-4 w-4" /> : null}
                {totalDrop !== 0 ? `$${Math.abs(totalDrop).toLocaleString()}` : "—"}
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                Total Change ({totalPercent}%)
              </div>
            </div>
          </div>

          {/* Chart */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-sm">
              No price changes recorded yet. Changes are tracked automatically during DMS syncs.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Price"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", r: 4 }}
                    activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Change Log */}
          {history.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Change Log</h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {[...history].reverse().map(h => (
                  <div key={h.id} className="flex items-center gap-3 rounded-md bg-secondary/40 border border-border/50 px-3 py-2">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center ${Number(h.change_amount) < 0 ? "bg-success/15" : "bg-destructive/15"}`}>
                      {Number(h.change_amount) < 0
                        ? <TrendingDown className="h-3 w-3 text-success" />
                        : <TrendingUp className="h-3 w-3 text-destructive" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-foreground">
                        ${Number(h.old_price).toLocaleString()} → ${Number(h.new_price).toLocaleString()}
                        <span className={`ml-2 font-semibold ${Number(h.change_amount) < 0 ? "text-success" : "text-destructive"}`}>
                          ({Number(h.change_amount) < 0 ? "" : "+"}{Number(h.change_percent)}%)
                        </span>
                      </div>
                      <div className="text-[10px] text-muted-foreground">{h.source} · {new Date(h.change_date).toLocaleDateString()}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
