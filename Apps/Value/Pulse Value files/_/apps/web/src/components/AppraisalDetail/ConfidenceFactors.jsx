import { CheckCircle, AlertCircle, Info } from "lucide-react";

export function ConfidenceFactors({ vehicle }) {
  const confidenceScore = vehicle.confidence_score || 0;
  const confidenceFactors = vehicle.confidence_factors || [];

  // Categorize confidence level
  let confidenceLevel = "Low";
  let confidenceColor = "#ef4444";
  let confidenceBg = "from-[#ef4444]/20 to-[#ef4444]/5";
  let confidenceBorder = "border-[#ef4444]/50";

  if (confidenceScore >= 80) {
    confidenceLevel = "Very High";
    confidenceColor = "#10b981";
    confidenceBg = "from-[#10b981]/20 to-[#10b981]/5";
    confidenceBorder = "border-[#10b981]/50";
  } else if (confidenceScore >= 70) {
    confidenceLevel = "High";
    confidenceColor = "#06b6d4";
    confidenceBg = "from-[#06b6d4]/20 to-[#06b6d4]/5";
    confidenceBorder = "border-[#06b6d4]/50";
  } else if (confidenceScore >= 60) {
    confidenceLevel = "Moderate";
    confidenceColor = "#f59e0b";
    confidenceBg = "from-[#f59e0b]/20 to-[#f59e0b]/5";
    confidenceBorder = "border-[#f59e0b]/50";
  }

  return (
    <div className="bg-[#1E293B] rounded-xl p-6 border border-slate-700">
      <h3 className="text-white font-bold text-lg flex items-center gap-2 mb-6">
        <Info className="w-5 h-5 text-[#06b6d4]" />
        Valuation Confidence
      </h3>

      {/* Confidence Score Display */}
      <div
        className={`bg-gradient-to-br ${confidenceBg} rounded-lg p-6 border ${confidenceBorder} mb-6`}
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">
              Confidence Level
            </p>
            <p className="text-4xl font-bold text-white">{confidenceScore}%</p>
          </div>
          <div className="text-right">
            <p
              className="text-2xl font-bold"
              style={{ color: confidenceColor }}
            >
              {confidenceLevel}
            </p>
            <p className="text-xs text-slate-400 mt-1">Reliability</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-3 bg-[#0B1120] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${confidenceScore}%`,
              backgroundColor: confidenceColor,
              boxShadow: `0 0 10px ${confidenceColor}`,
            }}
          />
        </div>
      </div>

      {/* Confidence Factors List */}
      {confidenceFactors.length > 0 ? (
        <div className="space-y-3">
          <p className="text-sm font-semibold text-white mb-3">
            What Affects This Score:
          </p>
          {confidenceFactors.map((factor, idx) => {
            const isWarning = factor.includes("⚠");
            const cleanFactor = factor.replace("⚠ ", "");

            return (
              <div
                key={idx}
                className={`flex items-start gap-3 p-3 rounded-lg ${
                  isWarning
                    ? "bg-[#f59e0b]/10 border border-[#f59e0b]/30"
                    : "bg-[#0B1120] border border-slate-700/50"
                }`}
              >
                {isWarning ? (
                  <AlertCircle className="w-5 h-5 text-[#f59e0b] flex-shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="w-5 h-5 text-[#10b981] flex-shrink-0 mt-0.5" />
                )}
                <p className="text-sm text-slate-300 flex-1">{cleanFactor}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-[#0B1120] rounded-lg p-4 text-center">
          <Info className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-sm text-slate-400">
            No detailed confidence factors available
          </p>
        </div>
      )}

      {/* Confidence Guide */}
      <div className="mt-6 bg-[#0B1120] rounded-lg p-4">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Confidence Guide
        </h4>
        <div className="space-y-2">
          <ConfidenceGuideItem
            range="80-95%"
            label="Very High"
            description="Excellent data quality. Valuation is highly reliable."
            color="#10b981"
          />
          <ConfidenceGuideItem
            range="70-79%"
            label="High"
            description="Good data quality. Valuation is reliable."
            color="#06b6d4"
          />
          <ConfidenceGuideItem
            range="60-69%"
            label="Moderate"
            description="Adequate data. Consider additional research."
            color="#f59e0b"
          />
          <ConfidenceGuideItem
            range="Below 60%"
            label="Low"
            description="Limited data. Use caution and verify pricing."
            color="#ef4444"
          />
        </div>
      </div>
    </div>
  );
}

function ConfidenceGuideItem({ range, label, description, color }) {
  return (
    <div className="flex items-start gap-3">
      <div
        className="w-2 h-2 rounded-full flex-shrink-0 mt-2"
        style={{ backgroundColor: color }}
      />
      <div className="flex-1">
        <p className="text-sm text-white font-semibold">
          {range} - {label}
        </p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
    </div>
  );
}
