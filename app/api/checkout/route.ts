import { NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { priceId } = await req.json();
  if (!priceId) return Response.json({ error: "Missing priceId" }, { status: 400 });

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${req.nextUrl.origin}/settings?upgraded=true`,
    cancel_url: `${req.nextUrl.origin}/settings`,
    metadata: { userId },
    client_reference_id: userId,
  });

  return Response.json({ url: session.url });
}
