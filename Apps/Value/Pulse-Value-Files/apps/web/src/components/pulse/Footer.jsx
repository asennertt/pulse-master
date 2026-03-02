export default function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-slate-800 bg-[#0B1120]">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-[#06b6d4] to-[#8b5cf6] rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">P</span>
            </div>
            <span className="text-white font-bold text-lg">Pulse</span>
          </div>

          <div className="flex items-center gap-8">
            <a
              href="#features"
              className="text-slate-400 hover:text-white transition-colors text-sm"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-slate-400 hover:text-white transition-colors text-sm"
            >
              How It Works
            </a>
            <a
              href="#get-started"
              className="text-slate-400 hover:text-white transition-colors text-sm"
            >
              Get Started
            </a>
          </div>

          <div className="text-slate-500 text-sm">
            © 2025 Lotly Auto. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
}
