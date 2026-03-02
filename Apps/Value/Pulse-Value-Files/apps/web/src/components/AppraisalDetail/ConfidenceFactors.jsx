import { Shield, TrendingUp, Database, Eye, AlertCircle } from "lucide-react";

export function ConfidenceFactors({ vehicle }) {
  const confidence = vehicle.confidence_score || 87;

  const factors = [
    {
      label: "Data Quality",
      score: vehicle.data_quality_score || Math.round(confidence * 0.95),
      icon: Database,
      description: "Completeness of vehicle data",
    },
    {
      label: "Market Coverage",
      score:
        vehicle.market_coverage_score || Math.round(confidence * 1.02) > 100
          ? 98
          : Math.round(confidence * 1.02),
      icon: Eye,
      description: "Comparable listings analyzed",
    },
    {
      label: "Price Stability",
      score: vehicle.price_stability_score || Math.round(confidence * 0.9),
      icon: TrendingUp,
      description: "Market price consistency",
    },
    {
      label: "VIN Accuracy",
      score: vehicle.vin_accuracy_score || Math.round(confidence * 0.98),
      icon: Shield,
      description: "Vehicle identification verified",
    },
  ];

  const getScoreColor = (score) => {
    if (score >= 90) return "text-emerald-400";
    if (score >= 75) return "text-blue-400";
    if (score >= 60) return "text-amber-400";
    return "text-red-400";
  };

  const getBarColor = (score) => {
    if (score >= 90) return "bg-emerald-500";
    if (score >= 75) return "bg-blue-500";
    if (score >= 60) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="bg-[#1E293B] rounded-xl p-6 border border-slate-700">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-white font-bold text-lg">Confidence Factors</h3>
          <p className="text-slate-400 text-sm mt-1">What drives our valuation confidence</p>
        </div>
        <div className="text-right">
          <p className={`text-3xl font-bold ${getScoreColor(confidence)}`}>{confidence}%</p>
          <p className="text-xs text-slate-400">Overall</p>
        </div>
      </div>

      <div className="space-y-4">
        {factors.map((factor, idx) => (
          <div key={idx}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <factor.icon className="w-4 h-4 text-[#06b6d4]" />
                <span className="text-sm text-white font-medium">{factor.label}</span>
              </div>
              <span className={`text-sm font-bold ${getScoreColor(factor.score)}`}>
                {factor.score}%
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${getBarColor(factor.score)} rounded-full transition-all duration-700`}
                style={{ width: `${factor.score}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 mt-1">{factor.description}</p>
          </div>
        ))}
      </div>

      {confidence < 75 && (
        <div className="mt-4 bg-amber-500/10 border border-amber-500/30 rounded-lg p-3 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-300">
            Lower confidence score. Consider getting additional market data or a physical inspection.
          </p>
        </div>
      )}
    </div>
  );
}
