"use client";
import { ArrowLeft, Activity } from "lucide-react";
import { useAppraisal } from "@/hooks/useAppraisal";
import { useShareAppraisal } from "@/hooks/useShareAppraisal";
import { useEmailAppraisal } from "@/hooks/useEmailAppraisal";
import { useDealCalculator } from "@/hooks/useDealCalculator";
import { AppraisalHeader } from "@/components/AppraisalDetail/AppraisalHeader";
import { VehicleHeader } from "@/components/AppraisalDetail/VehicleHeader";
import { VehicleScoreChart } from "@/components/AppraisalDetail/VehicleScoreChart";
import { MarketPositioningChart } from "@/components/AppraisalDetail/MarketPositioningChart";
import { PriceCalculationBreakdown } from "@/components/AppraisalDetail/PriceCalculationBreakdown";
import { DealCalculator } from "@/components/AppraisalDetail/DealCalculator";
import { VehicleSpecifications } from "@/components/AppraisalDetail/VehicleSpecifications";
import { VehicleHistoryReport } from "@/components/AppraisalDetail/VehicleHistoryReport";
import { PriceHistory } from "@/components/AppraisalDetail/PriceHistory";
import { ShareModal } from "@/components/AppraisalDetail/ShareModal";
import { EmailModal } from "@/components/AppraisalDetail/EmailModal";
import { MultiTierPricing } from "@/components/AppraisalDetail/MultiTierPricing";
import { VehicleScoreGauge } from "@/components/AppraisalDetail/VehicleScoreGauge";
import { MarketAnalysisCards } from "@/components/AppraisalDetail/MarketAnalysisCards";
import { ConfidenceFactors } from "@/components/AppraisalDetail/ConfidenceFactors";
import { EnhancedSpecifications } from "@/components/AppraisalDetail/EnhancedSpecifications";
import { ComparablesGrid } from "@/components/AppraisalDetail/ComparablesGrid";
import {
  buildAdjustmentSteps,
  calculatePulseValue,
  calculateMarketHealth,
  generateScatterData,
  generateRadarData,
} from "@/utils/appraisalCalculations";

export default function AppraisalDetailPage({ params }) {
  const { appraisal, loading } = useAppraisal(params.id);
  const {
    showShareModal,
    setShowShareModal,
    shareUrl,
    copied,
    handleShare,
    handleCopyLink,
  } = useShareAppraisal(params.id);
  const {
    showEmailModal,
    setShowEmailModal,
    emailData,
    setEmailData,
    sendingEmail,
    handleSendEmail,
  } = useEmailAppraisal(params.id);
  const {
    targetProfit,
    setTargetProfit,
    reconditioningCost,
    setReconditioningCost,
  } = useDealCalculator();

  const handleDownloadPDF = () => {
    window.open(`/api/appraisals/${params.id}/pdf`, "_blank");
  };

  const handleDownloadCustomerPDF = () => {
    window.open(`/api/appraisals/${params.id}/customer-pdf`, "_blank");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <Activity className="w-12 h-12 text-[#06b6d4] animate-pulse" />
      </div>
    );
  }

  if (!appraisal) {
    return (
      <div className="min-h-screen bg-[#0B1120] flex items-center justify-center">
        <p className="text-slate-400">Appraisal not found</p>
      </div>
    );
  }

  const vehicle = appraisal.vehicle_data || {};
  const calculation = vehicle.calculation || {};

  const radarData = generateRadarData(vehicle); // Pass vehicle object for real scores
  const scatterData = generateScatterData(vehicle);
  const currentVehicle = {
    x: vehicle.miles || 30000,
    y: vehicle.estimated_price || vehicle.price || 45000,
    z: 400,
  };

  const adjustmentSteps = buildAdjustmentSteps(calculation, vehicle);
  const pulseValue =
    vehicle.estimated_price || calculatePulseValue(adjustmentSteps);
  const confidence =
    vehicle.confidence_score || calculation.confidenceScore || 87;
  const daysOfSupply =
    vehicle.market_days_supply || calculation.marketDaysSupply || 28;
  const priceTrend = calculation.trend || "up";
  const pricePosition =
    vehicle.market_position || calculation.pricePosition || "Fair Market";
  const marketHealth = calculateMarketHealth(daysOfSupply);

  const targetPurchasePrice = pulseValue - targetProfit - reconditioningCost;

  // Get comparables for the grid
  const comparables = vehicle.comparables || [];

  return (
    <div className="min-h-screen bg-[#0B1120] font-inter antialiased">
      <AppraisalHeader
        onShare={handleShare}
        onEmail={() => setShowEmailModal(true)}
        onDownloadPDF={handleDownloadPDF}
        onDownloadCustomerPDF={handleDownloadCustomerPDF}
      />

      <div className="pt-8 pb-20 px-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => (window.location.href = "/dashboard")}
            className="flex items-center gap-2 text-slate-400 hover:text-[#06b6d4] mb-8 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <VehicleHeader
            vehicle={vehicle}
            vin={appraisal.vin}
            pulseValue={pulseValue}
            confidence={confidence}
            priceTrend={priceTrend}
            targetPurchasePrice={targetPurchasePrice}
            targetProfit={targetProfit}
            daysOfSupply={daysOfSupply}
            marketHealth={marketHealth}
          />

          {/* NEW: Multi-Tier Pricing */}
          <div className="mb-8">
            <MultiTierPricing vehicle={vehicle} />
          </div>

          {/* NEW: Vehicle Score & Market Analysis Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <VehicleScoreGauge vehicle={vehicle} />
            <ConfidenceFactors vehicle={vehicle} />
          </div>

          {/* NEW: Market Analysis Cards */}
          <div className="mb-8">
            <MarketAnalysisCards vehicle={vehicle} />
          </div>

          {/* Comparables Grid */}
          {comparables.length > 0 && (
            <div className="mb-8">
              <ComparablesGrid comparables={comparables} />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <VehicleScoreChart radarData={radarData} />
            <MarketPositioningChart
              scatterData={scatterData}
              currentVehicle={currentVehicle}
            />
          </div>

          {/* Price History Section */}
          {vehicle.price_history && vehicle.price_history.length > 0 && (
            <div className="mb-8">
              <PriceHistory priceHistory={vehicle.price_history} />
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <PriceCalculationBreakdown
              adjustmentSteps={adjustmentSteps}
              pulseValue={pulseValue}
              confidence={confidence}
              pricePosition={pricePosition}
            />
            <DealCalculator
              targetProfit={targetProfit}
              setTargetProfit={setTargetProfit}
              reconditioningCost={reconditioningCost}
              setReconditioningCost={setReconditioningCost}
              pulseValue={pulseValue}
              targetPurchasePrice={targetPurchasePrice}
            />
          </div>

          <VehicleSpecifications
            vehicle={vehicle}
            createdAt={appraisal.created_at}
          />

          {/* NEW: Enhanced Specifications */}
          <div className="mt-8">
            <EnhancedSpecifications vehicle={vehicle} />
          </div>

          {/* Vehicle History Report Section */}
          <div className="mt-8">
            <VehicleHistoryReport vin={appraisal.vin} />
          </div>
        </div>
      </div>

      <ShareModal
        show={showShareModal}
        onClose={() => setShowShareModal(false)}
        shareUrl={shareUrl}
        copied={copied}
        onCopyLink={handleCopyLink}
      />

      <EmailModal
        show={showEmailModal}
        onClose={() => setShowEmailModal(false)}
        emailData={emailData}
        setEmailData={setEmailData}
        sendingEmail={sendingEmail}
        onSendEmail={handleSendEmail}
      />
    </div>
  );
}
