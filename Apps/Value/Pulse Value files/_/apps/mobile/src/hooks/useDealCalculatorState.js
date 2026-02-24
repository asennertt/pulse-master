import { useState } from "react";

export function useDealCalculatorState() {
  const [targetProfit, setTargetProfit] = useState(3000);
  const [reconditioningCost, setReconditioningCost] = useState(1500);

  const calculateMaxBuyPrice = (pulseValue) => {
    return pulseValue - targetProfit - reconditioningCost;
  };

  return {
    targetProfit,
    setTargetProfit,
    reconditioningCost,
    setReconditioningCost,
    calculateMaxBuyPrice,
  };
}
