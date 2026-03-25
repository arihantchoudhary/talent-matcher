# Payments (Stripe)

Usage-based billing with free, pro, and enterprise tiers.

## Pricing Model

| Plan | Price | Postings/month | Candidates | Features |
|------|-------|---------------|------------|----------|
| Free | $0 | 3 | 93 max | CSV export, LinkedIn enrichment |
| Pro | $49/mo | 25 | Unlimited | + JSON export, stable matching |
| Enterprise | Custom | Unlimited | Unlimited | + Priority support, custom rubrics |

**"Posting" = one scoring run.** Upload CSV + score = 1 posting used.

## Architecture

```
Frontend                          Backend (FastAPI)              Stripe
   │                                    │                          │
   │ Click "Upgrade to Pro"             │                          │
   │────────────────────────────────────→                          │
   │          POST /checkout            │                          │
   │          { user_id, price_id }     │──── Create Session ─────→│
   │                                    │←─── session.url ─────────│
   │←── { checkout_url } ──────────────│                          │
   │                                    │                          │
   │ Redirect to Stripe Checkout ──────────────────────────────────→│
   │                                    │                          │
   │                                    │←── Webhook: payment ─────│
   │                                    │    succeeded             │
   │                                    │                          │
   │                                    │ Update DynamoDB:         │
   │                                    │ plan="pro"               │
   │                                    │ postings_limit=25        │
```

## Backend Implementation

### Checkout
```python
@app.post("/talent-pluto/checkout")
async def create_checkout(user_id: str, price_id: str):
    session = stripe.checkout.Session.create(
        payment_method_types=["card"],
        line_items=[{"price": price_id, "quantity": 1}],
        mode="subscription",
        success_url=f"{frontend_url}/settings?success=true",
        cancel_url=f"{frontend_url}/settings?canceled=true",
        metadata={"user_id": user_id}
    )
    return {"checkout_url": session.url}
```

### Webhook
```python
@app.post("/webhooks")
async def stripe_webhook(request: Request):
    event = stripe.Webhook.construct_event(...)
    if event.type == "checkout.session.completed":
        user_id = event.data.object.metadata["user_id"]
        update_subscription(user_id, plan="pro", limit=25)
```

### Usage Tracking
```python
@app.post("/talent-pluto/subscription/use")
async def increment_usage(user_id: str):
    sub = get_subscription(user_id)
    if sub.postings_used >= sub.postings_limit:
        raise HTTPException(402, "Posting limit reached")
    sub.postings_used += 1
    save_subscription(sub)
```

## Frontend Integration

### Settings Page
```typescript
// Check subscription status on mount
const sub = await fetchSubscription(userId);
// Display: plan name, postings used/limit, upgrade button

// Upgrade button
const { checkout_url } = await createCheckout(userId, priceId);
window.location.href = checkout_url;
```

### Price ID Handling

**Problem:** Stripe price IDs differ between test and live mode.

**Solution:** Environment variable `NEXT_PUBLIC_STRIPE_PRO_PRICE_ID` with hardcoded fallback:
```typescript
const priceId = process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID
  || "price_1RBhFXFWmNtTzFGrXB6C1tVK";
```

## Design Decision: Backend Stripe

Initially Stripe was frontend-only (direct API calls from Next.js). Moved to backend because:
1. **Webhook verification** requires server-side secret
2. **DynamoDB updates** happen server-side
3. **Single source of truth** for subscription state
4. **No Stripe secret key in frontend** env vars

## Related
- [[Architecture Overview]] — Payment flow in system context
- [[API Design]] — Checkout and webhook endpoints
- [[Decision Log]] — Why usage-based over seat-based billing
