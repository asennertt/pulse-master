import { Copy, Check } from "lucide-react";

export function ShareModal({ show, onClose, shareUrl, copied, onCopyLink }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1E293B] rounded-2xl p-8 w-full max-w-md border border-slate-700 shadow-2xl">
        <h3 className="text-white font-bold text-xl mb-4">Share Appraisal</h3>
        <p className="text-slate-400 text-sm mb-6">
          Share this appraisal report with anyone using the link below.
        </p>

        <div className="flex gap-3 mb-6">
          <input
            type="text"
            value={shareUrl || ""}
            readOnly
            className="flex-1 bg-[#0B1120] text-white px-4 py-3 rounded-lg border border-slate-600 text-sm focus:outline-none"
          />
          <button
            onClick={onCopyLink}
            className="flex items-center gap-2 bg-[#06b6d4] text-white px-4 py-3 rounded-lg hover:bg-[#0891b2] transition-colors"
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>

        <button
          onClick={onClose}
          className="w-full bg-slate-700 text-white py-3 rounded-lg hover:bg-slate-600 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}
