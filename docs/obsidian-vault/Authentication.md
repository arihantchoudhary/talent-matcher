# Authentication

Clerk-based auth with custom styling and protected route middleware.

## Architecture

```
Request → middleware.ts → Is public route?
                            │
                  ┌─────────┴──────────┐
                  │ Yes                 │ No
                  ▼                     ▼
              Serve page         auth.protect()
                                    │
                              ┌─────┴──────┐
                              │ Has token  │ No token
                              ▼            ▼
                          Serve page   Redirect to
                                       /sign-in
```

## Route Protection

```typescript
// middleware.ts
const isPublic = createRouteMatcher([
  "/",              // Landing page
  "/sign-in(.*)",   // Clerk sign-in
  "/sign-up(.*)"    // Clerk sign-up
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublic(req)) await auth.protect();
});
```

**Protected routes:** `/upload`, `/rankings`, `/stable-match`, `/roles`, `/settings`

## Custom Auth Pages

The default Clerk forms look generic. Custom styling creates a branded experience:

```
┌───────────────────────────────────────────┐
│                                           │
│  ┌──────────────┐  ┌──────────────────┐  │
│  │              │  │                  │  │
│  │  BLACK       │  │  Clerk Form      │  │
│  │  BRANDING    │  │  - Social login  │  │
│  │  PANEL       │  │  - Divider       │  │
│  │              │  │  - Email/pass    │  │
│  │  "Talent     │  │                  │  │
│  │   Matcher"   │  │  (No branding)   │  │
│  │              │  │  (No footer)     │  │
│  └──────────────┘  └──────────────────┘  │
│                                           │
└───────────────────────────────────────────┘
```

### CSS Overrides (Clerk Branding Removal)

Clerk injects its own branding, dev badges, and footer. These are removed via CSS:

```css
/* Hide Clerk branding elements */
.cl-internal-b3fm6y { display: none !important; }
.cl-footer { display: none !important; }
[data-clerk-component] .cl-footerAction { display: none !important; }
```

**Why CSS instead of Clerk config?** Clerk's free tier doesn't expose all branding removal options. CSS `!important` overrides work regardless of plan.

## User Data Access

### Server Components (RSC)
```typescript
const { userId } = await auth();
```

### Client Components
```typescript
const { user } = useUser();
// user.fullName, user.primaryEmailAddress, user.imageUrl
```

### Custom User Menu

Replaced Clerk's `<UserButton>` with a custom dropdown to remove the branding badge:

```typescript
// app/(dashboard)/user-button.tsx
export function UserButton() {
  const { user } = useUser();
  const { signOut } = useClerk();
  // Custom dropdown with avatar, name, email, sign-out
}
```

## Related
- [[Architecture Overview]] — Auth in the system context
- [[Design System]] — Auth page styling
- [[Decision Log]] — Why Clerk over Auth.js/NextAuth
