import { Menu, X } from "lucide-react";
import { useState } from "react";
import useUser from "@/utils/useUser";

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { data: user, loading } = useUser();

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
              REAL-TIME VEHICLE VALUATIONS
            </p>
          </div>
        </div>

        {/* Desktop navigation */}
        <div className="hidden md:flex items-center gap-4">
          <button
            onClick={() => (window.location.href = "/pricing")}
            className="text-slate-300 hover:text-[#00D9FF] transition-colors font-semibold"
          >
            Pricing
          </button>

          {!loading && user ? (
            <>
              <button
                onClick={() => (window.location.href = "/dashboard")}
                className="text-slate-300 hover:text-[#00D9FF] transition-colors font-semibold"
              >
                Dashboard
              </button>
              <button
                onClick={() => (window.location.href = "/account/logout")}
                className="text-slate-300 hover:text-[#00D9FF] transition-colors font-semibold"
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => (window.location.href = "/account/signin")}
                className="text-slate-300 hover:text-[#00D9FF] transition-colors font-semibold"
              >
                Sign In
              </button>
              <button
                onClick={() => (window.location.href = "/account/signup")}
                className="bg-[#00D9FF] text-[#0F1419] font-bold px-6 py-3 rounded-lg hover:bg-[#00C3E6] active:scale-95 transition-all duration-200 shadow-[0_0_25px_rgba(0,217,255,0.5)]"
              >
                Get Started
              </button>
            </>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-white hover:text-[#00D9FF] p-2 rounded-md transition-all duration-200"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden fixed top-20 left-0 right-0 bg-[#0F1419] bg-opacity-95 backdrop-blur-md z-40 border-b border-slate-800">
            <div className="flex flex-col space-y-4 p-6">
              <button
                onClick={() => {
                  window.location.href = "/pricing";
                  setIsMenuOpen(false);
                }}
                className="text-slate-400 hover:text-[#00D9FF] transition-colors py-2 text-left"
              >
                Pricing
              </button>

              {!loading && user ? (
                <>
                  <button
                    onClick={() => {
                      window.location.href = "/dashboard";
                      setIsMenuOpen(false);
                    }}
                    className="text-slate-400 hover:text-[#00D9FF] transition-colors py-2 text-left"
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => {
                      window.location.href = "/account/logout";
                      setIsMenuOpen(false);
                    }}
                    className="text-slate-400 hover:text-[#00D9FF] transition-colors py-2 text-left"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => {
                      window.location.href = "/account/signin";
                      setIsMenuOpen(false);
                    }}
                    className="text-slate-400 hover:text-[#00D9FF] transition-colors py-2 text-left"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      window.location.href = "/account/signup";
                      setIsMenuOpen(false);
                    }}
                    className="bg-[#00D9FF] text-[#0F1419] font-bold px-6 py-3 rounded-lg hover:bg-[#00C3E6] transition-all text-center"
                  >
                    Get Started
                  </button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
