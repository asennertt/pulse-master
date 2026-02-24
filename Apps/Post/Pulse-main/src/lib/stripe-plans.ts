export const PLANS = {
  starter: {
    price_id: "price_1T2msKPIAAotI3my8MbDMMt1",
    product_id: "prod_U0oVFcQjuj5YPn",
    name: "Starter",
    price: 49,
  },
  unlimited: {
    price_id: "price_1T2msXPIAAotI3myE8UPo24T",
    product_id: "prod_U0oVr4CspqqrI1",
    name: "Unlimited",
    price: 99,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlanByProductId(productId: string): PlanKey | null {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.product_id === productId) return key as PlanKey;
  }
  return null;
}
