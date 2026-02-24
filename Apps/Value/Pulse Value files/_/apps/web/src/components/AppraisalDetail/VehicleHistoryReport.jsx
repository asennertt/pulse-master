import { useState } from "react";
import {
  FileText,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";

export function VehicleHistoryReport({ vin }) {
  const [activeService, setActiveService] = useState(null);

  const handleCarfaxQuickVin = () => {
    // Carfax QuickVIN (requires dealer login)
    const quickVinUrl = `https://www.carfaxonline.com/vhrs/${vin}`;
    window.open(quickVinUrl, "_blank", "width=1200,height=800");
    setActiveService("carfax");
  };

  const handleAutoCheck = () => {
    // AutoCheck (requires dealer login)
    const autoCheckUrl = `https://www.autocheck.com/vehiclehistory/?vin=${vin}`;
    window.open(autoCheckUrl, "_blank", "width=1200,height=800");
    setActiveService("autocheck");
  };

  return (
    <div className="bg-[#1E293B] rounded-xl p-6 border border-slate-700 hover:border-[#06b6d4] transition-all">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-[#06b6d4]/20 text-[#06b6d4] flex items-center justify-center rounded-lg">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">
            Vehicle History Report
          </h3>
          <p className="text-sm text-slate-400">
            View Carfax or AutoCheck report
          </p>
        </div>
      </div>

      <div className="bg-[#0B1120] rounded-lg p-4 mb-6 border border-slate-800">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-[#f59e0b] flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm text-slate-300 mb-1">
              <strong>Dealer Login Required</strong>
            </p>
            <p className="text-xs text-slate-400">
              You must be logged into your dealer account for these reports to
              display.
            </p>
          </div>
        </div>
      </div>

      {/* Carfax Section */}
      <div className="bg-[#0B1120] rounded-lg p-4 border border-slate-800 mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#ff6b00] to-[#ff8800] rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-white">CARFAX</h4>
              <p className="text-xs text-slate-400">
                Industry-leading vehicle history
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleCarfaxQuickVin}
          className="w-full bg-gradient-to-r from-[#ff6b00] to-[#ff8800] text-white px-4 py-2 rounded-lg hover:from-[#ff8800] hover:to-[#ffa500] transition-all flex items-center justify-center gap-2 text-sm font-semibold mt-3"
        >
          <ExternalLink className="w-4 h-4" />
          Open Carfax Report
        </button>
      </div>

      {/* AutoCheck Section */}
      <div className="bg-[#0B1120] rounded-lg p-4 border border-slate-800 mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#ff6600] to-[#0066cc] rounded-lg flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <div>
              <h4 className="font-bold text-white">AutoCheck</h4>
              <p className="text-xs text-slate-400">
                Comprehensive vehicle history
              </p>
            </div>
          </div>
        </div>
        <button
          onClick={handleAutoCheck}
          className="w-full bg-gradient-to-r from-[#ff6600] to-[#0066cc] text-white px-4 py-2 rounded-lg hover:from-[#ff7700] hover:to-[#0077dd] transition-all flex items-center justify-center gap-2 text-sm font-semibold mt-3"
        >
          <ExternalLink className="w-4 h-4" />
          Open AutoCheck Report
        </button>
      </div>

      {/* VIN Display */}
      <div className="bg-[#0B1120] rounded-lg p-4 border border-slate-800">
        <h5 className="text-sm font-semibold text-white mb-2">VIN Number</h5>
        <div className="flex items-center justify-between bg-[#1E293B] rounded-lg p-3 border border-slate-700">
          <code className="text-[#06b6d4] font-mono text-sm">{vin}</code>
          <button
            onClick={() => {
              navigator.clipboard.writeText(vin);
            }}
            className="text-xs text-slate-400 hover:text-[#06b6d4] transition-all"
          >
            Copy
          </button>
        </div>
      </div>

      {activeService && (
        <div className="mt-4 p-3 bg-[#10b981]/10 border border-[#10b981]/30 rounded-lg">
          <p className="text-xs text-[#10b981] flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            {activeService === "carfax" ? "Carfax" : "AutoCheck"} report opened
            in new window
          </p>
        </div>
      )}
    </div>
  );
}
