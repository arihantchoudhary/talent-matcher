import { PlanId } from "./stripe";

const API = process.env.NEXT_PUBLIC_API_URL || "https://aicm3pweed.us-east-1.awsapprunner.com";

export interface Subscription {
  user_id: string;
  plan: PlanId;
  postings_used: number;
  postings_limit: number;
  stripe_customer_id?: string;
  status: string;
}

export async function getSubscription(userId: string): Promise<Subscription> {
  try {
    const resp = await fetch(`${API}/talent-pluto/subscription?user_id=${userId}`, { cache: "no-store" });
    if (resp.ok) return await resp.json();
  } catch { /* fallback */ }
  return { user_id: userId, plan: "free", postings_used: 0, postings_limit: 3, status: "active" };
}

export async function incrementUsage(userId: string): Promise<{ allowed: boolean; remaining: number }> {
  try {
    const resp = await fetch(`${API}/talent-pluto/subscription/use`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    if (resp.ok) return await resp.json();
  } catch { /* fallback */ }
  return { allowed: true, remaining: 99 };
}
