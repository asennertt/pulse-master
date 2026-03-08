"use client";
import { useState, useEffect } from "react";
import {
  Calendar,
  Gauge,
  Car,
  DollarSign,
  TrendingUp,
  Package,
  Sparkles,
  Activity,
} from "lucide-react";

export default function SharedAppraisalPage({ params }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShared = async () => {
      try {
        const response = await fetch(`/api/shared/${params.token}`);
        if (!response.ok) {
          throw new Error("Shared appraisal not found");
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (params.token) {
      fetchShared();
    }
  }, [params.token]);

  const safeValue = (value) => {
    if (!value) return null;
    if (typeof value === "object" && value !== null) {
      return value.name || value.code || value.base || null;
    }
    return value;
  };

  const safeNumericValue = (value) => {
    if (!value) return null;
    if (typeof value === "object" && value !== null) {
      return value.msrp || value.base || value.value || null;
    }
    return value;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <svg viewBox="0 0 48 48" className="w-full h-full">
              <path
                d="M 2,24 L 12,24 L 16,12 L 22,36 L 28,18 L 32,28 L 36,24 L 46,24"
                stroke="#00D9FF"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: "drop-shadow(0 0 8px rgba(0, 217, 255, 0.6))" }}
              />
            </svg>
          </div>
          <p className="text-slate-400 text-lg">Loading appraisal...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">{error || "Not found"}</p>
          <a href="/" className="text-[#00D9FF] hover:underline">
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  const { appraisal, company } = data;
  const vehicleData = appraisal.vehicle_data || {};

  return (
    <div className="min-h-screen bg-[#0B1120] font-inter antialiased">
      {/* Header */}
      <header className="bg-[#0F1419] border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 relative">
              <svg viewBox="0 0 48 48" className="w-full h-full">
                <path
                  d="M 2,24 L 12,24 L 16,12 L 22,36 L 28,18 L 32,28 L 36,24 L 46,24"
                  stroke="#00D9FF"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ filter: "drop-shadow(0 0 8px rgba(0, 217, 255, 0.6))" }}
                />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                <span style={{ color: "#00D9FF" }}>
                  {company.company_name || "PULSE APPRAISING"}
                </span>
              </h1>
              {company.tagline && (
                <p className="text-xs text-slate-400">{company.tagline}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-sm">
            <Activity className="w-4 h-4" />
            Shared Appraisal
          </div>
        </div>
      </header>

      <div className="pt-8 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Vehicle Header */}
          <div className="bg-gradient-to-br from-[#00D9FF]/20 to-[#1A1F2E] rounded-xl p-8 border border-[#00D9FF]/30 mb-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  {appraisal.year} {appraisal.make} {appraisal.model}
                </h2>
                {vehicleData.trim && (
                  <p className="text-lg text-slate-300">
                    {typeof vehicleData.trim === "object"
                      ? vehicleData.trim?.name || vehicleData.trim?.code
                      : vehicleData.trim}
                  </p>
                )}
                <p className="text-sm text-slate-400 mt-2">
                  VIN: {appraisal.vin}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400 mb-1">Appraised Value</p>
                <p className="text-4xl font-bold text-[#10b981]">
                  ${appraisal.estimated_price?.toLocaleString() || "N/A"}
                </p>
                {appraisal.confidence_score && (
                  <p className="text-xs text-slate-400 mt-1">
                    {appraisal.confidence_score}% confidence
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#1A1F2E] p-4 rounded-lg border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Gauge className="w-4 h-4 text-[#00D9FF]" />
                <span className="text-xs text-slate-400">Mileage</span>
              </div>
              <p className="text-lg font-bold text-white">
                {appraisal.mileage?.toLocaleString() || "N/A"} mi
              </p>
            </div>

            <div className="bg-[#1A1F2E] p-4 rounded-lg border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Car className="w-4 h-4 text-[#00D9FF]" />
                <span className="text-xs text-slate-400">Condition</span>
              </div>
              <p className="text-lg font-bold text-white capitalize">
                {appraisal.condition}
              </p>
            </div>

            <div className="bg-[#1A1F2E] p-4 rounded-lg border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="w-4 h-4 text-[#00D9FF]" />
                <span className="text-xs text-slate-400">Appraised On</span>
              </div>
              <p className="text-lg font-bold text-white">
                {new Date(appraisal.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="bg-[#1A1F2E] p-4 rounded-lg border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-[#00D9FF]" />
                <span className="text-xs text-slate-400">MSRP</span>
              </div>
              <p className="text-lg font-bold text-white">
                $
                {safeNumericValue(vehicleData.msrp)?.toLocaleString() || "N/A"}
              </p>
            </div>
          </div>

          {/* Market Analysis */}
          {vehicleData.market_analysis && (
            <div className="bg-[#1A1F2E] rounded-xl p-6 border border-slate-700 mb-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-[#00D9FF]" />
                Market Analysis
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {vehicleData.market_analysis.avg_price && (
                  <div>
                    <p className="text-xs text-slate-400">Avg Price</p>
                    <p className="text-lg font-bold text-white">
                      $
                      {vehicleData.market_analysis.avg_price.toLocaleString()}
                    </p>
                  </div>
                )}
                {vehicleData.market_analysis.low_price && (
                  <div>
                    <p className="text-xs text-slate-400">Low Price</p>
                    <p className="text-lg font-bold text-white">
                      $
                      {vehicleData.market_analysis.low_price.toLocaleString()}
                    </p>
                  </div>
                )}
                {vehicleData.market_analysis.high_price && (
                  <div>
                    <p className="text-xs text-slate-400">High Price</p>
                    <p className="text-lg font-bold text-white">
                      $
                      {vehicleData.market_analysis.high_price.toLocaleString()}
                    </p>
                  </div>
                )}
                {vehicleData.market_analysis.listings_count && (
                  <div>
                    <p className="text-xs text-slate-400">Listings</p>
                    <p className="text-lg font-bold text-white">
                      {vehicleData.market_analysis.listings_count}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Vehicle Specs */}
          {vehicleData.specs && (
            <div className="bg-[#1A1F2E] rounded-xl p-6 border border-slate-700 mb-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-[#00D9FF]" />
                Vehicle Specifications
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {vehicleData.specs.engine && (
                  <div>
                    <p className="text-xs text-slate-400">Engine</p>
                    <p className="font-medium text-white">
                      {safeValue(vehicleData.specs.engine)}
                    </p>
                  </div>
                )}
                {vehicleData.specs.transmission && (
                  <div>
                    <p className="text-xs text-slate-400">Transmission</p>
                    <p className="font-medium text-white">
                      {safeValue(vehicleData.specs.transmission)}
                    </p>
                  </div>
                )}
                {vehicleData.specs.drivetrain && (
                  <div>
                    <p className="text-xs text-slate-400">Drivetrain</p>
                    <p className="font-medium text-white">
                      {safeValue(vehicleData.specs.drivetrain)}
                    </p>
                  </div>
                )}
                {vehicleData.specs.fuel_type && (
                  <div>
                    <p className="text-xs text-slate-400">Fuel Type</p>
                    <p className="font-medium text-white">
                      {safeValue(vehicleData.specs.fuel_type)}
                    </p>
                  </div>
                )}
                {vehicleData.specs.exterior_color && (
                  <div>
                    <p className="text-xs text-slate-400">Exterior</p>
                    <p className="font-medium text-white">
                      {safeValue(vehicleData.specs.exterior_color)}
                    </p>
                  </div>
                )}
                {vehicleData.specs.interior_color && (
                  <div>
                    <p className="text-xs text-slate-400">Interior</p>
                    <p className="font-medium text-white">
                      {safeValue(vehicleData.specs.interior_color)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Options */}
          {vehicleData.options && vehicleData.options.length > 0 && (
            <div className="bg-[#1A1F2E] rounded-xl p-6 border border-slate-700 mb-6">
              <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#00D9FF]" />
                Options & Packages
              </h3>
              <div className="flex flex-wrap gap-2">
                {vehicleData.options.map((option, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-[#00D9FF]/10 text-[#00D9FF] rounded-full text-sm border border-[#00D9FF]/20"
                  >
                    {typeof option === "object"
                      ? option.name || option.code
                      : option}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center py-8 border-t border-slate-800">
            <p className="text-slate-500 text-sm">
              Appraisal generated by{" "}
              <span className="text-[#00D9FF]">
                {company.company_name || "Pulse Appraising"}
              </span>
            </p>
            <a
              href="/"
              className="text-slate-600 hover:text-[#00D9FF] text-xs mt-2 inline-block transition-colors"
            >
              Powered by Pulse Appraising
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
