import { View, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAppraisalDetail } from "@/hooks/useAppraisalDetail";
import { useAppraisalActions } from "@/hooks/useAppraisalActions";
import { useDealCalculatorState } from "@/hooks/useDealCalculatorState";
import {
  calculateMarketMetrics,
  getPulseValue,
  getConfidence,
} from "@/utils/appraisalCalculations";
import { useTheme, getTheme } from "@/utils/theme/useTheme";
import { AppraisalHeader } from "@/components/AppraisalDetail/AppraisalHeader";
import { VehicleTitle } from "@/components/AppraisalDetail/VehicleTitle";
import { PriceCards } from "@/components/AppraisalDetail/PriceCards";
import { QuickStats } from "@/components/AppraisalDetail/QuickStats";
import { PriceHistory } from "@/components/AppraisalDetail/PriceHistory";
import { VehicleSpecifications } from "@/components/AppraisalDetail/VehicleSpecifications";
import { VehicleHistoryReports } from "@/components/AppraisalDetail/VehicleHistoryReports";
import { DealCalculator } from "@/components/AppraisalDetail/DealCalculator";
import { LoadingState } from "@/components/AppraisalDetail/LoadingState";
import { ErrorState } from "@/components/AppraisalDetail/ErrorState";

export default function AppraisalDetailPage() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { isDark } = useTheme();
  const theme = getTheme(isDark);
  const { appraisal, loading } = useAppraisalDetail(id);
  const { targetProfit, reconditioningCost, calculateMaxBuyPrice } =
    useDealCalculatorState();

  const { handleShare, handleCopyVIN, handleCarfax, handleAutoCheck } =
    useAppraisalActions(id, appraisal?.vin);

  if (loading) {
    return <LoadingState />;
  }

  if (!appraisal) {
    return <ErrorState message="Appraisal not found" topInset={insets.top} />;
  }

  const vehicle = appraisal.vehicle_data || {};
  const pulseValue = getPulseValue(vehicle);
  const confidence = getConfidence(vehicle);
  const { daysOfSupply, marketHealth, velocity } =
    calculateMarketMetrics(vehicle);
  const priceTrend = "up";
  const targetPurchasePrice = calculateMaxBuyPrice(pulseValue);

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.background,
        paddingTop: insets.top,
      }}
    >
      <StatusBar style={isDark ? "light" : "dark"} />

      <AppraisalHeader onBack={() => router.back()} onShare={handleShare} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 80,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ padding: 24 }}>
          <VehicleTitle
            vehicle={vehicle}
            vin={appraisal.vin}
            onCopyVIN={handleCopyVIN}
          />

          <PriceCards
            pulseValue={pulseValue}
            confidence={confidence}
            priceTrend={priceTrend}
            targetPurchasePrice={targetPurchasePrice}
            targetProfit={targetProfit}
          />

          <QuickStats
            vehicle={vehicle}
            daysOfSupply={daysOfSupply}
            marketHealth={marketHealth}
            velocity={velocity}
          />

          <PriceHistory priceHistory={vehicle.price_history} />

          <VehicleSpecifications vehicle={vehicle} />

          <VehicleHistoryReports
            onCarfax={handleCarfax}
            onAutoCheck={handleAutoCheck}
          />

          <DealCalculator
            pulseValue={pulseValue}
            targetProfit={targetProfit}
            reconditioningCost={reconditioningCost}
            targetPurchasePrice={targetPurchasePrice}
          />
        </View>
      </ScrollView>
    </View>
  );
}
