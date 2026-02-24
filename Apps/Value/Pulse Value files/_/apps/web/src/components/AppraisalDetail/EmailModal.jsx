import { X, Mail, Activity } from "lucide-react";

export function EmailModal({
  show,
  onClose,
  emailData,
  setEmailData,
  sendingEmail,
  onSendEmail,
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-6">
      <div className="bg-[#1E293B] rounded-xl p-8 max-w-md w-full border border-slate-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Email Appraisal</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Recipient Email *
            </label>
            <input
              type="email"
              value={emailData.recipientEmail}
              onChange={(e) =>
                setEmailData({
                  ...emailData,
                  recipientEmail: e.target.value,
                })
              }
              placeholder="customer@example.com"
              className="w-full bg-[#0B1120] text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Recipient Name
            </label>
            <input
              type="text"
              value={emailData.recipientName}
              onChange={(e) =>
                setEmailData({
                  ...emailData,
                  recipientName: e.target.value,
                })
              }
              placeholder="John Doe"
              className="w-full bg-[#0B1120] text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">
              Personal Message
            </label>
            <textarea
              value={emailData.message}
              onChange={(e) =>
                setEmailData({ ...emailData, message: e.target.value })
              }
              placeholder="Add a personal note..."
              rows={4}
              className="w-full bg-[#0B1120] text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-[#06b6d4] focus:ring-2 focus:ring-[#06b6d4]/20 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-[#1E293B] text-white py-3 rounded-lg border border-slate-700 hover:border-[#06b6d4] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={onSendEmail}
            disabled={sendingEmail || !emailData.recipientEmail}
            className="flex-1 bg-[#06b6d4] text-white py-3 rounded-lg hover:bg-[#0891b2] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
          >
            {sendingEmail ? (
              <>
                <Activity className="w-4 h-4 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4" />
                Send Email
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
