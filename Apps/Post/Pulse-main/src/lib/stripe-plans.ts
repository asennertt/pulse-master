export const PLANS = {
  starter: {
    price_id: "price_1TAbPcIbUZnqOMdHgmabYat7",
    product_id: "prod_U8tB6bDTynDkVe",
    name: "Starter",
    price: 99,
  },
  unlimited: {
    price_id: "price_1TAbPgIbUZnqOMdH9aeZFj3L",
    product_id: "prod_U8tBqEk62Baag0",
    name: "Unlimited",
    price: 199,
  },
} as const;

export type PlanKey = keyof typeof PLANS;

export function getPlanByProductId(productId: string): PlanKey | null {
  for (const [key, plan] of Object.entries(PLANS)) {
    if (plan.product_id === productId) return key as PlanKey;
  }
  return null;
}
