export default function Footer() {
  return (
    <footer className="border-t border-slate-800 py-12 mt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo side */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10">
              <svg viewBox="0 0 48 48" className="w-full h-full">
                <path
                  d="M 2,24 L 12,24 L 16,12 L 22,36 L 28,18 L 32,28 L 36,24 L 46,24"
                  stroke="#00D9FF"
                  strokeWidth="2.5"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{
                    filter: "drop-shadow(0 0 6px rgba(0, 217, 255, 0.5))",
                  }}
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">
                <span className="text-[#00D9FF]">PULSE</span> APPRAISING
              </h3>
              <p className="text-xs text-slate-500">
                Real-time vehicle valuations
              </p>
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-8 text-sm">
            <button
              onClick={() => (window.location.href = "/dashboard")}
              className="text-slate-400 hover:text-[#00D9FF] transition-colors"
            >
              Dashboard
            </button>
            <button
              onClick={() => (window.location.href = "/appraise")}
              className="text-slate-400 hover:text-[#00D9FF] transition-colors"
            >
              Appraise
            </button>
            <button
              onClick={() => (window.location.href = "/settings")}
              className="text-slate-400 hover:text-[#00D9FF] transition-colors"
            >
              Settings
            </button>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-8 border-t border-slate-800 text-center">
          <p className="text-slate-600 text-sm">
            © 2026 Pulse Appraising. Powered by real-time market data.
          </p>
        </div>
      </div>
    </footer>
  );
}
