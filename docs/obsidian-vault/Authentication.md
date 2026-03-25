# Authentication

**Read this out loud in 4 points:**

1. **Clerk handles all auth — sign-in, sign-up, session management, user profiles.** One wrapper component (`ClerkProvider`) and one middleware file. No password hashing, no session tokens, no OAuth flows to implement. Auth was fully working in 15 minutes.

2. **A middleware file protects every route except the landing page and auth pages.** If you're not logged in and try to hit `/upload`, the middleware redirects you to `/sign-in`. Public routes: `/`, `/sign-in`, `/sign-up`. Everything else requires authentication.

3. **The sign-in pages use a custom split layout — black branding panel on the left, Clerk form on the right.** Default Clerk forms look generic. The custom styling makes them feel like part of the product. Clerk's free tier injects branding badges and footers, which are hidden via CSS overrides.

4. **Clerk's `<UserButton>` was replaced with a custom user menu to remove the branding badge.** The default Clerk user button shows a "Powered by Clerk" badge. A custom dropdown that uses Clerk's `useUser()` hook for data and `useClerk().signOut()` for logout removes this while keeping all the functionality.

---

## If they probe deeper

**"Why Clerk over NextAuth/Auth.js?"** — Speed. Clerk is fully managed: user database, social login, email verification, session management. NextAuth requires you to configure providers, set up database adapters, handle callbacks. For a take-home assessment, managed auth = focus on the product, not the plumbing.

**"Why 4 CSS commits to hide Clerk branding?"** — Clerk's DOM structure changed between versions. Internal selectors (`.cl-internal-*`) broke. Each commit narrowed to more stable selectors: internal classes → public classes (`.cl-footer`) → component-level selectors. Defensive CSS: don't depend on third-party implementation details.

**"How do you access user data?"** — Server components: `const { userId } = await auth()`. Client components: `const { user } = useUser()` which gives `fullName`, `primaryEmailAddress`, `imageUrl`. Used for personalizing the dashboard and associating sessions with users.

## See also
- [[Architecture Overview]] — Auth in the system context
- [[Design System]] — Auth page styling
