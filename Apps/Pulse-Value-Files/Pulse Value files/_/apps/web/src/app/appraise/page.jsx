"use client";
import { useState } from "react";
import {
  ArrowRight,
  Search,
  Loader2,
  Check,
  X,
  Car,
  Gauge,
  Settings,
  DollarSign,
  TrendingUp,
  Package,
  Sparkles,
} from "lucide-react";

export default function AppraisePage() {
  const [vin, setVin] = useState("");
  const [mileage, setMileage] = useState("");
  const [condition, setCondition] = useState("good");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [vehicleData, setVehicleData] = useState(null);

  // Helper function to safely extract value from potentially object fields
  const safeValue = (value) => {
    if (!value) return null;
    if (typeof value === "object" && value !== null) {
      return value.name || value.code || value.base || null;
    }
    return value;
  };

  // Helper function to safely extract numeric value (for MSRP, prices, etc.)
  const safeNumericValue = (value) => {
    if (!value) return null;
    if (typeof value === "object" && value !== null) {
      return value.msrp || value.base || value.value || null;
    }
    return value;
  };

  // Decode VIN and fetch vehicle data
  const handleDecodeVin = async () => {
    setError(null);

    if (!vin || vin.length < 17) {
      setError("Please enter a valid 17-character VIN");
      return;
    }

    if (!mileage || parseInt(mileage) <= 0) {
      setError("Please enter a valid mileage");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/appraisals/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vin: vin.toUpperCase(),
          mileage: parseInt(mileage),
          condition: condition,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(
          "[Lookup Error] Status:",
          response.status,
          "Data:",
          errorData,
        );
        const errorMessage = errorData.details
          ? `${errorData.error}: ${errorData.details}`
          : errorData.error || "Failed to fetch vehicle data";
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setVehicleData(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  // Save appraisal after reviewing data
  const handleSaveAppraisal = async () => {
    if (!vehicleData) return;

    setSaving(true);
    setError(null);

    try {
      const saveResponse = await fetch("/api/appraisals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vin: vin.toUpperCase(),
          vehicleData: vehicleData,
        }),
      });

      if (!saveResponse.ok) {
        const errorData = await saveResponse.json();

        if (saveResponse.status === 401) {
          setError(
            "Please sign in to save appraisals. Redirecting to sign in...",
          );
          setTimeout(() => {
            if (typeof window !== "undefined") {
              window.location.href = "/account/signin?callbackUrl=/appraise";
            }
          }, 2000);
          return;
        }

        if (errorData.upgrade) {
          setError(errorData.error + " Redirecting to pricing...");
          setTimeout(() => {
            if (typeof window !== "undefined") {
              window.location.href = "/pricing";
            }
          }, 2000);
          return;
        }

        throw new Error(errorData.error || "Failed to save appraisal");
      }

      const savedAppraisal = await saveResponse.json();
      if (typeof window !== "undefined") {
        window.location.href = `/appraise/${savedAppraisal.id}`;
      }
    } catch (err) {
      console.error(err);
      setError(err.message || "An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleEditData = () => {
    setVehicleData(null);
  };

  // Helper to safely render trim
  const getTrimDisplay = (trim) => {
    if (!trim) return "N/A";
    if (typeof trim === "object") {
      return trim?.name || trim?.code || "N/A";
    }
    return trim;
  };

  return (
    <div className="min-h-screen bg-[#0B1120] font-inter antialiased">
      {/* Header */}
      <header className="bg-[#0F1419] border-b border-slate-800 sticky top-0 z-50 bg-opacity-95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div
            className="flex items-center gap-4 cursor-pointer"
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.href = "/";
              }
            }}
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
          <button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.href = "/dashboard";
              }
            }}
            className="bg-[#1A1F2E] text-white px-6 py-3 rounded-lg border border-slate-700 hover:border-[#00D9FF] transition-all hover:shadow-[0_0_15px_rgba(0,217,255,0.3)]"
          >
            Dashboard
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-12 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          {!vehicleData ? (
            // VIN Input Form
            <>
              <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                Decode Vehicle
              </h1>
              <p className="text-lg text-slate-400 mb-12">
                Enter the VIN and mileage to decode vehicle specs and get
                real-time market data
              </p>

              <div className="space-y-6">
                <div className="bg-[#1A1F2E] rounded-xl p-8 border border-slate-700">
                  <label className="block font-semibold text-white mb-3">
                    VIN Number
                  </label>
                  <input
                    type="text"
                    value={vin}
                    onChange={(e) => setVin(e.target.value.toUpperCase())}
                    placeholder="Enter 17-character VIN"
                    maxLength={17}
                    className="w-full bg-[#0B1120] text-white px-6 py-4 rounded-lg border border-slate-600 focus:border-[#00D9FF] focus:ring-2 focus:ring-[#00D9FF]/20 focus:outline-none transition-all duration-200"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-slate-400">
                      {vin.length}/17 characters
                    </p>
                    {vin.length === 17 && (
                      <p className="text-sm text-[#10b981] font-medium flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        Valid length
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-[#1A1F2E] rounded-xl p-8 border border-slate-700">
                  <label className="block font-semibold text-white mb-3">
                    Current Mileage
                  </label>
                  <input
                    type="number"
                    value={mileage}
                    onChange={(e) => setMileage(e.target.value)}
                    placeholder="Enter current mileage"
                    min="0"
                    className="w-full bg-[#0B1120] text-white px-6 py-4 rounded-lg border border-slate-600 focus:border-[#00D9FF] focus:ring-2 focus:ring-[#00D9FF]/20 focus:outline-none transition-all duration-200"
                  />
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-slate-400">
                      {mileage ? parseInt(mileage).toLocaleString() : "0"} miles
                    </p>
                    {mileage && parseInt(mileage) > 0 && (
                      <p className="text-sm text-[#10b981] font-medium flex items-center gap-1">
                        <Check className="w-4 h-4" />
                        Valid mileage
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-[#1A1F2E] rounded-xl p-8 border border-slate-700">
                  <label className="block font-semibold text-white mb-3">
                    Vehicle Condition
                  </label>
                  <select
                    value={condition}
                    onChange={(e) => setCondition(e.target.value)}
                    className="w-full bg-[#0B1120] text-white px-6 py-4 rounded-lg border border-slate-600 focus:border-[#00D9FF] focus:ring-2 focus:ring-[#00D9FF]/20 focus:outline-none transition-all duration-200"
                  >
                    <option value="excellent">
                      Excellent - Like new, no visible wear
                    </option>
                    <option value="good">
                      Good - Minor wear, well maintained
                    </option>
                    <option value="fair">
                      Fair - Moderate wear, some repairs needed
                    </option>
                    <option value="poor">
                      Poor - Significant wear, major repairs needed
                    </option>
                  </select>
                  <p className="text-xs text-slate-500 mt-2">
                    This affects the final valuation price
                  </p>
                </div>

                {error && (
                  <div className="p-4 bg-[#ef4444]/10 border border-[#ef4444] rounded-lg">
                    <p className="text-sm text-[#ef4444]">{error}</p>
                  </div>
                )}

                <button
                  onClick={handleDecodeVin}
                  disabled={
                    loading ||
                    vin.length < 17 ||
                    !mileage ||
                    parseInt(mileage) <= 0
                  }
                  className="w-full bg-[#00D9FF] text-[#0F1419] font-bold py-4 rounded-lg hover:bg-[#00C3E6] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-[0_0_20px_rgba(0,217,255,0.4)] disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Decoding Vehicle...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Decode VIN & Get Market Data
                    </>
                  )}
                </button>
              </div>

              <div className="mt-12 p-6 bg-[#1A1F2E] rounded-xl border border-slate-700">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <span className="text-[#00D9FF]">📍</span>
                  Where to find the VIN
                </h3>
                <ul className="text-slate-400 space-y-2 text-sm">
                  <li className="flex items-start">
                    <span className="text-[#00D9FF] mr-2">•</span> Dashboard
                    (driver's side, visible through windshield)
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#00D9FF] mr-2">•</span> Driver's side
                    door jamb
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#00D9FF] mr-2">•</span> Vehicle
                    registration or title
                  </li>
                  <li className="flex items-start">
                    <span className="text-[#00D9FF] mr-2">•</span> Insurance
                    documents
                  </li>
                </ul>
              </div>
            </>
          ) : (
            // Vehicle Data Preview
            <>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
                    Vehicle Decoded
                  </h1>
                  <p className="text-lg text-slate-400">
                    Review the details below and start your appraisal
                  </p>
                </div>
                <button
                  onClick={handleEditData}
                  className="flex items-center gap-2 bg-[#1A1F2E] text-white px-4 py-3 rounded-lg border border-slate-700 hover:border-[#00D9FF] transition-all"
                >
                  <X className="w-4 h-4" />
                  Edit VIN
                </button>
              </div>

              {/* Vehicle Header */}
              <div className="bg-gradient-to-br from-[#00D9FF]/20 to-[#1A1F2E] rounded-xl p-8 border border-[#00D9FF]/30 mb-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">
                      {vehicleData.year} {vehicleData.make} {vehicleData.model}
                    </h2>
                    <p className="text-lg text-slate-300">
                      {getTrimDisplay(vehicleData.trim)}
                    </p>
                    <p className="text-sm text-slate-400 mt-2">
                      VIN: {vehicleData.vin}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-400 mb-1">
                      Estimated Value
                    </p>
                    <p className="text-4xl font-bold text-[#10b981]">
                      ${vehicleData.estimated_price?.toLocaleString() || "N/A"}
                    </p>
                    {vehicleData.confidence_score && (
                      <p className="text-xs text-slate-400 mt-1">
                        {vehicleData.confidence_score}% confidence
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
                    {vehicleData.mileage?.toLocaleString() || "N/A"} mi
                  </p>
                </div>

                <div className="bg-[#1A1F2E] p-4 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings className="w-4 h-4 text-[#00D9FF]" />
                    <span className="text-xs text-slate-400">Condition</span>
                  </div>
                  <p className="text-lg font-bold text-white capitalize">
                    {vehicleData.condition}
                  </p>
                </div>

                <div className="bg-[#1A1F2E] p-4 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <Car className="w-4 h-4 text-[#00D9FF]" />
                    <span className="text-xs text-slate-400">Body Type</span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {safeValue(vehicleData.body_type) || "N/A"}
                  </p>
                </div>

                <div className="bg-[#1A1F2E] p-4 rounded-lg border border-slate-700">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-4 h-4 text-[#00D9FF]" />
                    <span className="text-xs text-slate-400">
                      Original MSRP
                    </span>
                  </div>
                  <p className="text-lg font-bold text-white">
                    {safeNumericValue(vehicleData.msrp)
                      ? `$${safeNumericValue(vehicleData.msrp).toLocaleString()}`
                      : "N/A"}
                  </p>
                </div>
              </div>

              {/* Detailed Specs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Basic Specs */}
                <div className="bg-[#1A1F2E] rounded-xl p-6 border border-slate-700">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <Car className="w-5 h-5 text-[#00D9FF]" />
                    Basic Specifications
                  </h3>
                  <div className="space-y-3">
                    {[
                      {
                        label: "Drivetrain",
                        value: safeValue(vehicleData.drivetrain),
                      },
                      {
                        label: "Transmission",
                        value: safeValue(vehicleData.transmission),
                      },
                      {
                        label: "Exterior Color",
                        value: safeValue(vehicleData.exterior_color),
                      },
                      {
                        label: "Interior Color",
                        value: safeValue(vehicleData.interior_color),
                      },
                      {
                        label: "Fuel Type",
                        value: safeValue(vehicleData.fuel_type),
                      },
                      { label: "Doors", value: vehicleData.doors },
                      { label: "Seats", value: vehicleData.seats },
                    ].map(
                      (item, idx) =>
                        item.value && (
                          <div
                            key={idx}
                            className="flex justify-between items-center"
                          >
                            <span className="text-sm text-slate-400">
                              {item.label}
                            </span>
                            <span className="text-sm text-white font-medium">
                              {item.value}
                            </span>
                          </div>
                        ),
                    )}
                  </div>
                </div>

                {/* Engine Specs */}
                <div className="bg-[#1A1F2E] rounded-xl p-6 border border-slate-700">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <Settings className="w-5 h-5 text-[#00D9FF]" />
                    Engine & Performance
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: "Engine", value: safeValue(vehicleData.engine) },
                      {
                        label: "Horsepower",
                        value: vehicleData.horsepower
                          ? `${vehicleData.horsepower} hp`
                          : null,
                      },
                      { label: "Torque", value: safeValue(vehicleData.torque) },
                      { label: "Cylinders", value: vehicleData.cylinders },
                      {
                        label: "Displacement",
                        value: safeValue(vehicleData.displacement),
                      },
                      {
                        label: "MPG City",
                        value: vehicleData.mpg_city
                          ? `${vehicleData.mpg_city} mpg`
                          : null,
                      },
                      {
                        label: "MPG Highway",
                        value: vehicleData.mpg_highway
                          ? `${vehicleData.mpg_highway} mpg`
                          : null,
                      },
                    ].map(
                      (item, idx) =>
                        item.value && (
                          <div
                            key={idx}
                            className="flex justify-between items-center"
                          >
                            <span className="text-sm text-slate-400">
                              {item.label}
                            </span>
                            <span className="text-sm text-white font-medium">
                              {item.value}
                            </span>
                          </div>
                        ),
                    )}
                  </div>
                </div>
              </div>

              {/* Market Data */}
              {vehicleData.comparables &&
                vehicleData.comparables.length > 0 && (
                  <div className="bg-[#1A1F2E] rounded-xl p-6 border border-slate-700 mb-6">
                    <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-[#00D9FF]" />
                      Market Comparables ({vehicleData.comparables.length})
                    </h3>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {vehicleData.comparables.slice(0, 10).map((comp, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center p-3 bg-[#0B1120] rounded-lg"
                        >
                          <div>
                            <p className="text-sm text-white font-medium">
                              {comp.year} {getTrimDisplay(comp.trim)}
                            </p>
                            <p className="text-xs text-slate-400">
                              {comp.miles?.toLocaleString()} mi •{" "}
                              {comp.dealer_city}, {comp.dealer_state}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-[#10b981]">
                            ${comp.price?.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              {/* Features & Options */}
              {(vehicleData.features?.length > 0 ||
                vehicleData.options?.length > 0) && (
                <div className="bg-[#1A1F2E] rounded-xl p-6 border border-slate-700 mb-6">
                  <h3 className="font-bold text-white mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-[#00D9FF]" />
                    Features & Options
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {[
                      ...(vehicleData.features || []),
                      ...(vehicleData.options || []),
                    ]
                      .slice(0, 20)
                      .map((feature, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-2 text-sm text-slate-300"
                        >
                          <Check className="w-4 h-4 text-[#10b981]" />
                          {typeof feature === "object"
                            ? feature.name || feature.description
                            : feature}
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {error && (
                <div className="p-4 bg-[#ef4444]/10 border border-[#ef4444] rounded-lg mb-6">
                  <p className="text-sm text-[#ef4444]">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={handleEditData}
                  className="flex-1 bg-[#1A1F2E] text-white font-bold py-4 rounded-lg border border-slate-700 hover:border-slate-600 transition-all"
                >
                  Back to Edit
                </button>
                <button
                  onClick={handleSaveAppraisal}
                  disabled={saving}
                  className="flex-1 bg-[#00D9FF] text-[#0F1419] font-bold py-4 rounded-lg hover:bg-[#00C3E6] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-[0_0_20px_rgba(0,217,255,0.4)] flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Saving Appraisal...
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      Start Appraisal
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
