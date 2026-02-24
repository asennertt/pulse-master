import { useState } from "react";

export function useDealCalculator() {
  const [targetProfit, setTargetProfit] = useState(2500);
  const [reconditioningCost, setReconditioningCost] = useState(1500);

  return {
    targetProfit,
    setTargetProfit,
    reconditioningCost,
    setReconditioningCost,
  };
}
