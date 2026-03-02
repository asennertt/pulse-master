"use client";
import { ArrowLeft, Activity } from "lucide-react";
import { useAppraisal } from "@/utils/useAppraisals";
import AppraisalDetailCard from "@/components/AppraisalDetailCard";
import { useParams } from "next/navigation";

export default function AppraisalDetailPage() {
  const params = useParams();
  const id = params?.id;
  const { appraisal, loading, error } = useAppraisal(id);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4">
            <svg viewBox="0 0 48 48" className="w-full h-full">
              <path
                d="M 2,24 L 12,24 L 16,12 L 22,36 L 28,18 L 32,28 L 36,24 L 46,24"
                stroke="#00D9FF"
                strokeWidth="2.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: "drop-shadow(0 0 8px rgba(0, 217, 255, 0.6))" }}
              />
            </svg>
          </div>
          <p className="text-slate-400 text-lg">Loading appraisal...</p>
        </div>
      </div>
    );
  }

  if (error || !appraisal) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 text-lg mb-4">
            {error || "Appraisal not found"}
          </p>
          <button
            onClick={() => window.history.back()}
            className="text-[#00D9FF] hover:underline"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120] font-inter antialiased">
      {/* Header */}
      <header className="bg-[#0F1419] border-b border-slate-800 sticky top-0 z-50 bg-opacity-95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => window.history.back()}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
            <div
              className="flex items-center gap-4 cursor-pointer"
              onClick={() => (window.location.href = "/")}
            >
              <div className="w-10 h-10 relative">
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
              <h1 className="text-xl font-bold text-white">
                <span style={{ color: "#00D9FF" }}>PULSE</span> APPRAISING
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2 text-[#00D9FF]">
            <Activity className="w-5 h-5" />
            <span className="text-sm font-medium">Appraisal Detail</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="pt-8 pb-20 px-6">
        <div className="max-w-5xl mx-auto">
          <AppraisalDetailCard appraisal={appraisal} showShareButton={true} />
        </div>
      </div>
    </div>
  );
}
