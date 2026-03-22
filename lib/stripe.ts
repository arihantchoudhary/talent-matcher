// Stripe plan definitions (shared constants)
export const PLANS = {
  free: { name: "Free", postings: 3, price: 0 },
  pro: { name: "Pro", postings: 25, price: 49 },
  enterprise: { name: "Enterprise", postings: Infinity, price: null },
} as const;

export type PlanId = keyof typeof PLANS;
