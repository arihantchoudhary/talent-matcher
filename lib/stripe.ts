import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

// Plan definitions — billing is per job posting
export const PLANS = {
  free: {
    name: "Free",
    postings: 3, // per month
    price: 0,
    priceId: null as string | null,
  },
  pro: {
    name: "Pro",
    postings: 25, // per month
    price: 49,
    priceId: process.env.STRIPE_PRO_PRICE_ID || null,
  },
  enterprise: {
    name: "Enterprise",
    postings: Infinity,
    price: null, // custom
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID || null,
  },
} as const;

export type PlanId = keyof typeof PLANS;

export function getPlanLimits(plan: PlanId) {
  return PLANS[plan];
}
