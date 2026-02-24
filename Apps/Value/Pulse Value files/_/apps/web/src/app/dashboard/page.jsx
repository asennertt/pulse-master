"use client";
import { useState, useEffect } from "react";
import {
  ArrowRight,
  Search,
  Calendar,
  DollarSign,
  TrendingUp,
  FileText,
  Activity,
  Settings,
  BarChart3,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  TrendingDown,
  Zap,
} from "lucide-react";

export default function DashboardPage() {
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

  // Helper to safely render trim field
  const getTrimDisplay = (trim) => {
    if (!trim) return "";
    if (typeof trim === "object") {
      return trim?.name || trim?.code || "";
    }
    return trim;
  };

  // Calculate stats
  const totalAppraisals = appraisals.length;
  const totalValue = appraisals.reduce(
    (sum, a) => sum + (a.vehicle_data?.price || 0),
    0,
  );
  const avgValue = totalAppraisals > 0 ? totalValue / totalAppraisals : 0;

  // Activity Feed Data
  const activityFeed = [
    {
      id: 1,
      type: "appraisal",
      icon: FileText,
      color: "#06b6d4",
      title: "New appraisal completed",
      description: "2024 Tesla Model 3 - $42,500",
      time: "5 minutes ago",
    },
    {
      id: 2,
      type: "trend",
      icon: TrendingUp,
      color: "#f59e0b",
      title: "Market alert",
      description: "SUV segment up 12% this week",
      time: "23 minutes ago",
    },
    {
      id: 3,
      type: "success",
      icon: CheckCircle,
      color: "#10b981",
      title: "Deal closed",
      description: "2023 Honda Accord sold at target margin",
      time: "1 hour ago",
    },
    {
      id: 4,
      type: "appraisal",
      icon: FileText,
      color: "#06b6d4",
      title: "Appraisal updated",
      description: "2022 Ford F-150 - Reconditioned",
      time: "2 hours ago",
    },
    {
      id: 5,
      type: "alert",
      icon: AlertCircle,
      color: "#ef4444",
      title: "Price drop detected",
      description: "Compact sedan segment down 3%",
      time: "3 hours ago",
    },
  ];

  // Quick Actions
  const quickActions = [
    {
      title: "New Appraisal",
      description: "Start appraising a vehicle",
      icon: Zap,
      color: "#06b6d4",
      href: "/appraise",
      primary: true,
    },
    {
      title: "VIN Search",
      description: "Look up existing appraisals",
      icon: Search,
      color: "#10b981",
      href: "/appraise",
      primary: false,
    },
    {
      title: "View Analytics",
      description: "Market trends & insights",
      icon: BarChart3,
      color: "#f59e0b",
      href: "/analytics",
      primary: false,
    },
    {
      title: "View History",
      description: "Browse all appraisals",
      icon: Clock,
      color: "#8b5cf6",
      href: "/dashboard",
      primary: false,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B1120] font-inter antialiased">
      {/* Header */}
      <header className="bg-[#0F1419] border-b border-slate-800 sticky top-0 z-50 bg-opacity-95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div
            className="flex items-center gap-4 cursor-pointer"
            onClick={() => (window.location.href = "/")}
          >
            {/* Pulse line logo */}
            <div className="w-12 h-12 relative">
              <svg viewBox="0 0 48 48" className="w-full h-full">
                <path
                  d="M 2,24 L 12,24 L 16,12 L 22,36 L 28,18 L 32,28 L 36,24 L 46,24"
                  stroke="#00D9FF"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    filter: "drop-shadow(0 0 8px rgba(0, 217, 255, 0.6))",
                  }}
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-wide">
                <span
                  style={{
                    color: "#00D9FF",
                    textShadow:
                      "0 0 20px rgba(0, 217, 255, 0.8), 0 0 40px rgba(0, 217, 255, 0.4)",
                  }}
                >
                  PULSE
                </span>{" "}
                <span className="text-white">APPRAISING</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium tracking-wider">
                REAL-TIME MARKET INTELLIGENCE
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => (window.location.href = "/analytics")}
              className="hidden md:flex items-center gap-2 bg-[#1A1F2E] text-white px-4 py-3 rounded-lg border border-slate-700 hover:border-[#00D9FF] transition-all hover:shadow-[0_0_15px_rgba(0,217,255,0.3)]"
            >
              <BarChart3 className="w-4 h-4" />
              Analytics
            </button>
            <button
              onClick={() => (window.location.href = "/settings")}
              className="hidden md:flex items-center gap-2 bg-[#1A1F2E] text-white px-4 py-3 rounded-lg border border-slate-700 hover:border-[#00D9FF] transition-all hover:shadow-[0_0_15px_rgba(0,217,255,0.3)]"
            >
              <Settings className="w-4 h-4" />
              Settings
            </button>
            <button
              onClick={() => (window.location.href = "/appraise")}
              className="bg-[#00D9FF] text-[#0F1419] font-bold px-6 py-3 rounded-lg hover:bg-[#00C3E6] active:scale-95 transition-all duration-200 shadow-[0_0_25px_rgba(0,217,255,0.5)]"
            >
              New Appraisal
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-12 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Dashboard
            </h2>
            <p className="text-slate-400">
              Real-time overview of your appraisal activity
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="bg-[#1A1F2E] p-6 rounded-xl border border-slate-700 hover:border-[#00D9FF] transition-all hover:shadow-[0_0_20px_rgba(0,217,255,0.2)]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[#00D9FF]/20 text-[#00D9FF] flex items-center justify-center rounded-lg">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-slate-400 text-sm font-medium">
                  Total Appraisals
                </span>
              </div>
              <p className="text-3xl font-bold text-white">{totalAppraisals}</p>
            </div>

            <div className="bg-[#1A1F2E] p-6 rounded-xl border border-slate-700 hover:border-[#10b981] transition-all hover:shadow-[0_0_20px_rgba(16,185,129,0.2)]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[#10b981]/20 text-[#10b981] flex items-center justify-center rounded-lg">
                  <DollarSign className="w-5 h-5" />
                </div>
                <span className="text-slate-400 text-sm font-medium">
                  Total Value
                </span>
              </div>
              <p className="text-3xl font-bold text-white">
                ${totalValue.toLocaleString()}
              </p>
            </div>

            <div className="bg-[#1A1F2E] p-6 rounded-xl border border-slate-700 hover:border-[#f59e0b] transition-all hover:shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-[#f59e0b]/20 text-[#f59e0b] flex items-center justify-center rounded-lg">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <span className="text-slate-400 text-sm font-medium">
                  Avg Value
                </span>
              </div>
              <p className="text-3xl font-bold text-white">
                $
                {avgValue.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-12">
            <h3 className="text-xl font-bold text-white mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => (window.location.href = action.href)}
                  className={`${
                    action.primary
                      ? "bg-[#00D9FF] text-[#0F1419] shadow-[0_0_30px_rgba(0,217,255,0.5)]"
                      : "bg-[#1A1F2E] text-white border border-slate-700 hover:border-slate-600 hover:shadow-[0_0_15px_rgba(0,217,255,0.2)]"
                  } rounded-xl p-6 text-left transition-all hover:scale-105 active:scale-95`}
                >
                  <action.icon
                    className="w-8 h-8 mb-3"
                    style={{ color: action.primary ? "#0F1419" : action.color }}
                  />
                  <h4 className="font-bold text-lg mb-1">{action.title}</h4>
                  <p
                    className={`text-sm ${action.primary ? "text-[#0F1419]/70" : "text-slate-400"}`}
                  >
                    {action.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Activity Feed and Recent Appraisals */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            {/* Activity Feed */}
            <div className="lg:col-span-1">
              <h3 className="text-xl font-bold text-white mb-4">
                Activity Feed
              </h3>
              <div className="bg-[#1A1F2E] rounded-xl border border-slate-700 p-6">
                <div className="space-y-4">
                  {activityFeed.map((item) => (
                    <div
                      key={item.id}
                      className="flex gap-3 pb-4 border-b border-slate-700 last:border-b-0 last:pb-0"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${item.color}20` }}
                      >
                        <item.icon
                          className="w-5 h-5"
                          style={{ color: item.color }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium text-sm mb-1">
                          {item.title}
                        </p>
                        <p className="text-slate-400 text-xs mb-2 line-clamp-1">
                          {item.description}
                        </p>
                        <div className="flex items-center gap-1 text-slate-500 text-xs">
                          <Clock className="w-3 h-3" />
                          <span>{item.time}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Appraisals */}
            <div className="lg:col-span-2">
              <h3 className="text-xl font-bold text-white mb-4">
                Recent Appraisals
              </h3>

              {loading ? (
                <div className="text-center py-20">
                  <Activity className="w-12 h-12 text-[#00D9FF] mx-auto mb-4 animate-pulse" />
                  <p className="text-slate-400">Loading appraisals...</p>
                </div>
              ) : appraisals.length === 0 ? (
                <div className="bg-[#1A1F2E] rounded-xl p-12 text-center border border-slate-700">
                  <Search className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-xl text-white mb-2">
                    No appraisals yet
                  </h3>
                  <p className="text-slate-400 mb-6">
                    Get started by appraising your first vehicle
                  </p>
                  <button
                    onClick={() => (window.location.href = "/appraise")}
                    className="bg-[#00D9FF] text-[#0F1419] font-bold px-6 py-3 rounded-lg hover:bg-[#00C3E6] active:scale-95 transition-all duration-200 shadow-[0_0_25px_rgba(0,217,255,0.5)]"
                  >
                    Start First Appraisal
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {appraisals.slice(0, 4).map((appraisal) => (
                    <div
                      key={appraisal.id}
                      onClick={() =>
                        (window.location.href = `/appraise/${appraisal.id}`)
                      }
                      className="bg-[#1A1F2E] rounded-xl p-6 border border-slate-700 hover:border-[#00D9FF] cursor-pointer transition-all duration-200 hover:shadow-[0_0_25px_rgba(0,217,255,0.3)]"
                    >
                      <div className="mb-4">
                        <h3 className="font-bold text-lg text-white mb-1">
                          {appraisal.vehicle_data?.year}{" "}
                          {appraisal.vehicle_data?.make}{" "}
                          {appraisal.vehicle_data?.model}
                        </h3>
                        <p className="text-sm text-slate-400">
                          {getTrimDisplay(appraisal.vehicle_data?.trim)}
                        </p>
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-400">VIN</span>
                          <span className="text-sm text-white font-mono">
                            {appraisal.vin.slice(-8)}
                          </span>
                        </div>
                        {appraisal.vehicle_data?.miles && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-400">
                              Mileage
                            </span>
                            <span className="text-sm text-white">
                              {appraisal.vehicle_data.miles.toLocaleString()} mi
                            </span>
                          </div>
                        )}
                      </div>

                      {appraisal.vehicle_data?.price && (
                        <div className="pt-4 border-t border-slate-700">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-400">
                              Pulse Value
                            </span>
                            <span className="font-bold text-xl text-[#10b981]">
                              ${appraisal.vehicle_data.price.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-slate-500 text-xs mt-4">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(appraisal.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
