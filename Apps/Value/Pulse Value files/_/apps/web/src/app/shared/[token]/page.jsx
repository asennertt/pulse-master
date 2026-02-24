"use client";
import { useState, useEffect } from "react";
import {
  Calendar,
  DollarSign,
  Gauge,
  TrendingUp,
  Activity,
} from "lucide-react";
import {
  RadarChart,
  Radar,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

export default function SharedAppraisalPage({ params }) {
  const [appraisal, setAppraisal] = useState(null);
  const [companySettings, setCompanySettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to safely extract string value from potentially object fields
  const safeValue = (value) => {
    if (!value) return null;
    if (typeof value === "object" && value !== null) {
      return value.name || value.code || value.base || null;
    }
    return value;
  };

  useEffect(() => {
    fetchSharedAppraisal();
  }, [params.token]);

  const fetchSharedAppraisal = async () => {
    try {
      // Fetch the appraisal by share token
      const response = await fetch(`/api/shared/${params.token}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError("This appraisal link is invalid or has expired.");
        } else {
          setError("Failed to load appraisal");
        }
        return;
      }

      const data = await response.json();
      setAppraisal(data.appraisal);
      setCompanySettings(data.company);
    } catch (err) {
      console.error(err);
      setError("An error occurred while loading the appraisal");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <Activity className="w-12 h-12 text-[#06b6d4] animate-pulse" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center px-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">
            Appraisal Not Found
          </h1>
          <p className="text-slate-400">{error}</p>
        </div>
      </div>
    );
  }

  const vehicle = appraisal.vehicle_data || {};
  const company = companySettings || {
    company_name: "Pulse Appraising",
    tagline: "Real-Time Market Intelligence",
  };

  // Handle both 'miles' and 'mileage' field names
  const vehicleMileage = vehicle.miles || vehicle.mileage || 0;

  // Mock data for charts
  const radarData = [
    { subject: "Market Demand", A: 92, fullMark: 100 },
    { subject: "Condition", A: 85, fullMark: 100 },
    { subject: "Mileage", A: 78, fullMark: 100 },
    { subject: "Trim Value", A: 88, fullMark: 100 },
    { subject: "Color Appeal", A: 75, fullMark: 100 },
    { subject: "History", A: 95, fullMark: 100 },
  ];

  const generateScatterData = () => {
    const basePrice = vehicle.price || 45000;
    const baseMiles = vehicleMileage || 30000;
    const data = [];
    for (let i = 0; i < 40; i++) {
      data.push({
        x: Math.max(5000, baseMiles + (Math.random() - 0.5) * 40000),
        y: Math.max(20000, basePrice + (Math.random() - 0.5) * 15000),
        z: 100,
      });
    }
    return data;
  };

  const scatterData = generateScatterData();
  const currentVehicle = {
    x: vehicleMileage || 30000,
    y: vehicle.price || 45000,
    z: 400,
  };

  return (
    <div className="min-h-screen bg-[#0B1120] font-inter antialiased">
      {/* Branded Header */}
      <header className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              {company.logo_url ? (
                <img
                  src={company.logo_url}
                  alt={company.company_name}
                  className="h-12"
                />
              ) : (
                <div>
                  <h1 className="text-2xl font-bold text-white tracking-tight">
                    {company.company_name}
                  </h1>
                  <p className="text-xs text-slate-400 font-medium">
                    {company.tagline}
                  </p>
                </div>
              )}
            </div>
            <div className="text-right text-sm text-slate-400">
              {company.phone && <p>{company.phone}</p>}
              {company.email && <p>{company.email}</p>}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-12 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Vehicle Header */}
          <div className="bg-[#1E293B] rounded-xl p-8 mb-8 border border-slate-700">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </h1>
                <p className="text-slate-400 mb-4">
                  {safeValue(vehicle.trim) || "N/A"}
                </p>
                <p className="text-sm text-slate-500 font-mono">
                  VIN: {appraisal.vin}
                </p>
              </div>

              <div className="mt-6 md:mt-0 bg-gradient-to-br from-[#06b6d4]/20 to-[#06b6d4]/5 rounded-xl p-6 border border-[#06b6d4]/50 shadow-[0_0_30px_rgba(6,182,212,0.3)]">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 bg-[#06b6d4] rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-400 uppercase tracking-wider">
                    Pulse Value
                  </span>
                </div>
                <p className="text-5xl font-bold text-white mb-2">
                  ${(vehicle.price || 0).toLocaleString()}
                </p>
                <div className="bg-[#10b981]/20 text-[#10b981] px-3 py-1 rounded-full text-xs font-semibold inline-block">
                  87% Confidence
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
              <div className="bg-[#0B1120] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Gauge className="w-4 h-4 text-[#06b6d4]" />
                  <span className="text-xs text-slate-400">Mileage</span>
                </div>
                <p className="text-xl font-bold text-white">
                  {vehicleMileage.toLocaleString()}
                </p>
              </div>
              <div className="bg-[#0B1120] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-4 h-4 text-[#06b6d4]" />
                  <span className="text-xs text-slate-400">Days Supply</span>
                </div>
                <p className="text-xl font-bold text-white">28</p>
              </div>
              <div className="bg-[#0B1120] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="w-4 h-4 text-[#10b981]" />
                  <span className="text-xs text-slate-400">Market</span>
                </div>
                <p className="text-xl font-bold text-[#10b981]">High</p>
              </div>
              <div className="bg-[#0B1120] rounded-lg p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Calendar className="w-4 h-4 text-[#06b6d4]" />
                  <span className="text-xs text-slate-400">Velocity</span>
                </div>
                <p className="text-xl font-bold text-white">Fast</p>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <div className="bg-[#1E293B] rounded-xl p-6 border border-slate-700">
              <h3 className="text-white font-bold text-lg mb-4">
                Vehicle Score Analysis
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <RadarChart data={radarData}>
                  <defs>
                    <linearGradient
                      id="radarGradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0F172A",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#e2e8f0",
                    }}
                    labelStyle={{ color: "#06b6d4" }}
                  />
                  <Radar
                    name="Score"
                    dataKey="A"
                    stroke="#06b6d4"
                    fill="url(#radarGradient)"
                    strokeWidth={2}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-[#1E293B] rounded-xl p-6 border border-slate-700">
              <h3 className="text-white font-bold text-lg mb-4">
                Market Positioning
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart
                  margin={{ top: 10, right: 10, bottom: 10, left: 10 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis
                    type="number"
                    dataKey="x"
                    stroke="#94a3b8"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                  />
                  <YAxis
                    type="number"
                    dataKey="y"
                    stroke="#94a3b8"
                    tick={{ fill: "#94a3b8", fontSize: 12 }}
                    tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0F172A",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                      color: "#e2e8f0",
                    }}
                  />
                  <Scatter
                    name="Comparables"
                    data={scatterData}
                    fill="#f43f5e"
                    opacity={0.6}
                  />
                  <Scatter
                    name="Your Vehicle"
                    data={[currentVehicle]}
                    fill="#06b6d4"
                  >
                    <Cell fill="#06b6d4" />
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Vehicle Specs */}
          <div className="bg-[#1E293B] rounded-xl p-6 border border-slate-700">
            <h3 className="text-white font-bold text-lg mb-6">
              Vehicle Specifications
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {vehicle.body_type && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Body Type</p>
                  <p className="text-white font-medium">
                    {safeValue(vehicle.body_type)}
                  </p>
                </div>
              )}
              {vehicle.exterior_color && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Exterior Color</p>
                  <p className="text-white font-medium">
                    {safeValue(vehicle.exterior_color)}
                  </p>
                </div>
              )}
              {vehicle.interior_color && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Interior Color</p>
                  <p className="text-white font-medium">
                    {safeValue(vehicle.interior_color)}
                  </p>
                </div>
              )}
              {vehicle.drivetrain && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Drivetrain</p>
                  <p className="text-white font-medium">
                    {safeValue(vehicle.drivetrain)}
                  </p>
                </div>
              )}
              {vehicle.transmission && (
                <div>
                  <p className="text-sm text-slate-400 mb-1">Transmission</p>
                  <p className="text-white font-medium">
                    {safeValue(vehicle.transmission)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
            <p>
              Generated by{" "}
              <strong className="text-[#06b6d4]">{company.company_name}</strong>
            </p>
            {company.website && (
              <p className="mt-2">
                <a
                  href={company.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#06b6d4] hover:underline"
                >
                  {company.website}
                </a>
              </p>
            )}
            <p className="mt-4 text-xs">
              Report generated on{" "}
              {new Date(appraisal.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
