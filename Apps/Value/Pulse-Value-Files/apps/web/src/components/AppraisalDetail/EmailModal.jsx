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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-[#1E293B] rounded-2xl p-8 w-full max-w-md border border-slate-700 shadow-2xl">
        <h3 className="text-white font-bold text-xl mb-6">Email Appraisal Report</h3>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-2 block">Recipient Email</label>
            <input
              type="email"
              value={emailData?.to || ""}
              onChange={(e) =>
                setEmailData((prev) => ({ ...prev, to: e.target.value }))
              }
              placeholder="customer@example.com"
              className="w-full bg-[#0B1120] text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-[#06b6d4] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">Customer Name</label>
            <input
              type="text"
              value={emailData?.customerName || ""}
              onChange={(e) =>
                setEmailData((prev) => ({
                  ...prev,
                  customerName: e.target.value,
                }))
              }
              placeholder="John Smith"
              className="w-full bg-[#0B1120] text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-[#06b6d4] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-2 block">Message (Optional)</label>
            <textarea
              value={emailData?.message || ""}
              onChange={(e) =>
                setEmailData((prev) => ({ ...prev, message: e.target.value }))
              }
              placeholder="Add a personal message..."
              rows={3}
              className="w-full bg-[#0B1120] text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-[#06b6d4] focus:outline-none resize-none"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 text-white py-3 rounded-lg hover:bg-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSendEmail}
            disabled={sendingEmail}
            className="flex-1 bg-[#06b6d4] text-white py-3 rounded-lg hover:bg-[#0891b2] transition-colors disabled:opacity-50"
          >
            {sendingEmail ? "Sending..." : "Send Email"}
          </button>
        </div>
      </div>
    </div>
  );
}
