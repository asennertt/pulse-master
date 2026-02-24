import { Download, Mail, Share2, FileText } from "lucide-react";

export function AppraisalHeader({
  onShare,
  onEmail,
  onDownloadPDF,
  onDownloadCustomerPDF,
}) {
  return (
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
            onClick={onShare}
            className="hidden md:flex items-center gap-2 bg-[#1A1F2E] text-white px-4 py-2 rounded-lg border border-slate-700 hover:border-[#00D9FF] transition-all hover:shadow-[0_0_15px_rgba(0,217,255,0.3)]"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm">Share</span>
          </button>
          <button
            onClick={onEmail}
            className="hidden md:flex items-center gap-2 bg-[#1A1F2E] text-white px-4 py-2 rounded-lg border border-slate-700 hover:border-[#00D9FF] transition-all hover:shadow-[0_0_15px_rgba(0,217,255,0.3)]"
          >
            <Mail className="w-4 h-4" />
            <span className="text-sm">Email</span>
          </button>
          <button
            onClick={onDownloadCustomerPDF}
            className="hidden md:flex items-center gap-2 bg-gradient-to-r from-[#10b981] to-[#059669] text-white px-4 py-2 rounded-lg hover:from-[#059669] hover:to-[#047857] transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
          >
            <FileText className="w-4 h-4" />
            <span className="text-sm">Customer PDF</span>
          </button>
          <button
            onClick={onDownloadPDF}
            className="hidden md:flex items-center gap-2 bg-[#00D9FF] text-[#0F1419] font-semibold px-4 py-2 rounded-lg hover:bg-[#00C3E6] transition-all shadow-[0_0_20px_rgba(0,217,255,0.4)]"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Dealer PDF</span>
          </button>
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="bg-[#1A1F2E] text-white px-6 py-3 rounded-lg border border-slate-700 hover:border-[#00D9FF] transition-all hover:shadow-[0_0_15px_rgba(0,217,255,0.3)]"
          >
            Dashboard
          </button>
        </div>
      </div>
    </header>
  );
}
