import { X, Copy, Check } from "lucide-react";

export function ShareModal({ show, onClose, shareUrl, copied, onCopyLink }) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
      <div className="bg-[#1E293B] rounded-xl p-8 max-w-md w-full border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Share Appraisal</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-slate-400 mb-4">
          Share this appraisal with anyone using the link below:
        </p>
        <div className="flex items-center gap-2 mb-6">
          <input
            type="text"
            value={shareUrl}
            readOnly
            className="flex-1 bg-[#0B1120] text-white px-4 py-3 rounded-lg border border-slate-600 text-sm"
          />
          <button
            onClick={onCopyLink}
            className="bg-[#06b6d4] text-white px-4 py-3 rounded-lg hover:bg-[#0891b2] transition-all"
          >
            {copied ? (
              <Check className="w-5 h-5" />
            ) : (
              <Copy className="w-5 h-5" />
            )}
          </button>
        </div>
        {copied && (
          <p className="text-[#10b981] text-sm mb-4">
            ✓ Link copied to clipboard!
          </p>
        )}
        <button
          onClick={onClose}
          className="w-full bg-[#1E293B] text-white py-3 rounded-lg border border-slate-700 hover:border-[#06b6d4] transition-all"
        >
          Close
        </button>
      </div>
    </div>
  );
}
