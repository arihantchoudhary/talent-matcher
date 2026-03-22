import { NextRequest } from "next/server";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

const API = process.env.NEXT_PUBLIC_API_URL || "https://aicm3pweed.us-east-1.awsapprunner.com";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch {
    return Response.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId || session.client_reference_id;
    if (userId) {
      // Save subscription to backend
      await fetch(`${API}/talent-pluto/subscription`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          plan: "pro",
          stripe_customer_id: session.customer,
          stripe_subscription_id: session.subscription,
          status: "active",
        }),
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const sub = event.data.object as Stripe.Subscription;
    const userId = sub.metadata?.userId;
    if (userId) {
      await fetch(`${API}/talent-pluto/subscription`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, plan: "free", status: "cancelled" }),
      });
    }
  }

  return Response.json({ received: true });
}
