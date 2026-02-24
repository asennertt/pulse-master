"use client";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Activity,
  TrendingUp,
  DollarSign,
  Calendar,
  BarChart3,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";

export default function AnalyticsPage() {
  const [appraisals, setAppraisals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppraisals();
  }, []);

  const fetchAppraisals = async () => {
    try {
      const response = await fetch("/api/appraisals");
      if (!response.ok) throw new Error("Failed to fetch appraisals");
      const data = await response.json();
      setAppraisals(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Appraisal Trend Data (Monthly)
  const trendData = [
    { month: "Jan", count: 12, value: 540000 },
    { month: "Feb", count: 19, value: 850000 },
    { month: "Mar", count: 15, value: 675000 },
    { month: "Apr", count: 22, value: 990000 },
    { month: "May", count: 28, value: 1260000 },
    { month: "Jun", count: 24, value: 1080000 },
  ];

  // Vehicle Segment Data
  const segmentData = [
    { name: "Luxury SUV", value: 35, color: "#06b6d4" },
    { name: "Sedan", value: 25, color: "#10b981" },
    { name: "EV/Hybrid", value: 20, color: "#f59e0b" },
    { name: "Truck", value: 15, color: "#8b5cf6" },
    { name: "Other", value: 5, color: "#ef4444" },
  ];

  // Market Comparison Data
  const comparisonData = [
    {
      metric: "Avg. Price",
      yourDealership: 45000,
      marketAverage: 42000,
    },
    {
      metric: "Days on Market",
      yourDealership: 28,
      marketAverage: 35,
    },
    {
      metric: "Conversion Rate",
      yourDealership: 72,
      marketAverage: 65,
    },
    {
      metric: "Customer Rating",
      yourDealership: 4.8,
      marketAverage: 4.3,
    },
  ];

  // Calculate stats
  const totalAppraisals = appraisals.length;
  const totalValue = appraisals.reduce(
    (sum, a) => sum + (a.vehicle_data?.price || 0),
    0,
  );
  const avgValue = totalAppraisals > 0 ? totalValue / totalAppraisals : 0;
  const thisMonthCount = trendData[trendData.length - 1]?.count || 0;

  return (
    <div className="min-h-screen bg-[#0B1120] font-inter antialiased">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 bg-opacity-90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => (window.location.href = "/")}
          >
            <span className="text-3xl">📡</span>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                PULSE <span className="text-[#06b6d4]">APPRAISING</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                REAL-TIME MARKET INTELLIGENCE
              </p>
            </div>
          </div>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="bg-[#1E293B] text-white px-6 py-3 rounded-lg border border-slate-700 hover:border-[#06b6d4] transition-all"
          >
            Dashboard
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-8 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="flex items-center gap-2 text-slate-400 hover:text-[#06b6d4] mb-8 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <div className="mb-12">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 className="w-8 h-8 text-[#06b6d4]" />
              <h2 className="text-3xl md:text-4xl font-bold text-white">
                Analytics
              </h2>
            </div>
            <p className="text-slate-400">
              Market trends, insights, and performance metrics
            </p>
          </div>

          {loading ? (
            <div className="text-center py-20">
              <Activity className="w-12 h-12 text-[#06b6d4] mx-auto mb-4 animate-pulse" />
              <p className="text-slate-400">Loading analytics...</p>
            </div>
          ) : (
            <>
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                <div className="bg-[#1E293B] p-6 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-5 h-5 text-[#06b6d4]" />
                    <span className="text-sm text-slate-400">This Month</span>
                  </div>
                  <p className="text-3xl font-bold text-white">
                    {thisMonthCount}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Appraisals</p>
                </div>

                <div className="bg-[#1E293B] p-6 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-5 h-5 text-[#10b981]" />
                    <span className="text-sm text-slate-400">Growth</span>
                  </div>
                  <p className="text-3xl font-bold text-[#10b981]">+27%</p>
                  <p className="text-xs text-slate-500 mt-1">vs. Last Month</p>
                </div>

                <div className="bg-[#1E293B] p-6 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-[#f59e0b]" />
                    <span className="text-sm text-slate-400">Avg Value</span>
                  </div>
                  <p className="text-3xl font-bold text-white">
                    $
                    {avgValue.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">Per Appraisal</p>
                </div>

                <div className="bg-[#1E293B] p-6 rounded-xl border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-5 h-5 text-[#8b5cf6]" />
                    <span className="text-sm text-slate-400">
                      Total Appraised
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-white">
                    ${(totalValue / 1000000).toFixed(1)}M
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    Cumulative Value
                  </p>
                </div>
              </div>

              {/* Appraisal Trend Chart */}
              <div className="bg-[#1E293B] rounded-xl p-6 border border-slate-700 mb-8">
                <h3 className="text-white font-bold text-lg mb-6">
                  Appraisal Volume & Value Trend
                </h3>
                <ResponsiveContainer width="100%" height={350}>
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient
                        id="colorCount"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#06b6d4"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#06b6d4"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="colorValue"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="#10b981"
                          stopOpacity={0.4}
                        />
                        <stop
                          offset="95%"
                          stopColor="#10b981"
                          stopOpacity={0}
                        />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis
                      dataKey="month"
                      stroke="#94a3b8"
                      tick={{ fill: "#94a3b8" }}
                    />
                    <YAxis
                      yAxisId="left"
                      stroke="#94a3b8"
                      tick={{ fill: "#94a3b8" }}
                    />
                    <YAxis
                      yAxisId="right"
                      orientation="right"
                      stroke="#94a3b8"
                      tick={{ fill: "#94a3b8" }}
                      tickFormatter={(value) =>
                        `$${(value / 1000).toFixed(0)}k`
                      }
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#0F172A",
                        border: "1px solid #334155",
                        borderRadius: "8px",
                        color: "#e2e8f0",
                      }}
                      labelStyle={{ color: "#06b6d4" }}
                    />
                    <Legend
                      wrapperStyle={{ color: "#94a3b8" }}
                      iconType="circle"
                    />
                    <Area
                      yAxisId="left"
                      type="monotone"
                      dataKey="count"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorCount)"
                      name="Appraisal Count"
                    />
                    <Area
                      yAxisId="right"
                      type="monotone"
                      dataKey="value"
                      stroke="#10b981"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorValue)"
                      name="Total Value ($)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Vehicle Segment & Market Comparison */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                {/* Vehicle Segment Pie Chart */}
                <div className="bg-[#1E293B] rounded-xl p-6 border border-slate-700">
                  <h3 className="text-white font-bold text-lg mb-6">
                    Vehicle Segment Breakdown
                  </h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <PieChart>
                      <Pie
                        data={segmentData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) =>
                          `${name} ${(percent * 100).toFixed(0)}%`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {segmentData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0F172A",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                          color: "#e2e8f0",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-2 gap-3 mt-6">
                    {segmentData.map((segment, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-sm"
                      >
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: segment.color }}
                        ></div>
                        <span className="text-slate-400">{segment.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Market Comparison Bar Chart */}
                <div className="bg-[#1E293B] rounded-xl p-6 border border-slate-700">
                  <h3 className="text-white font-bold text-lg mb-6">
                    Market Comparison
                  </h3>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart
                      data={comparisonData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis
                        dataKey="metric"
                        stroke="#94a3b8"
                        tick={{ fill: "#94a3b8", fontSize: 12 }}
                      />
                      <YAxis stroke="#94a3b8" tick={{ fill: "#94a3b8" }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0F172A",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                          color: "#e2e8f0",
                        }}
                        labelStyle={{ color: "#06b6d4" }}
                      />
                      <Legend
                        wrapperStyle={{ color: "#94a3b8" }}
                        iconType="circle"
                      />
                      <Bar
                        dataKey="yourDealership"
                        fill="#06b6d4"
                        name="Your Dealership"
                        radius={[8, 8, 0, 0]}
                      />
                      <Bar
                        dataKey="marketAverage"
                        fill="#64748b"
                        name="Market Average"
                        radius={[8, 8, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="bg-[#10b981]/10 border border-[#10b981]/50 rounded-lg p-4 mt-6">
                    <p className="text-sm text-[#10b981]">
                      <span className="font-bold">✓ Great performance!</span>{" "}
                      You're outperforming market averages across all key
                      metrics
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
