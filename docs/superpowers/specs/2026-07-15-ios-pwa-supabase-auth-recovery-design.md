# iOS PWA Supabase Auth Recovery Design

## Goal

Prevent a suspended or failed browser-side token refresh from permanently blocking authentication and every Supabase data query in the iOS Home Screen app.

## Considered approaches

1. **Server-assisted refresh with a replaceable browser singleton (selected).** Disable browser auto-refresh, refresh through a same-origin Next.js route on initial load and foreground resume, then rebuild the browser client from the updated cookie. This removes the failing iOS refresh boundary while retaining direct Supabase data access through the existing Vercel rewrite.
2. **Keep browser auto-refresh and only migrate helpers.** Smaller, but a stalled iOS fetch can still poison the singleton initialization promise.
3. **Proxy every data operation through application APIs.** Strong isolation but unnecessarily rewrites the whole data layer.

## Architecture

- Replace deprecated `@supabase/auth-helpers-nextjs` clients with `@supabase/ssr`.
- Configure the browser client with `autoRefreshToken: false`, `detectSessionInUrl: false`, cookie storage, the existing same-origin Supabase proxy, and an application-owned singleton that can be replaced.
- Add `POST /api/auth/refresh`. Its per-request server client validates the current user and refreshes an expiring cookie through Vercel-to-Supabase connectivity.
- During authentication initialization and whenever the PWA becomes visible again, call the refresh endpoint with a hard timeout, replace the browser client, and load the session/profile from the fresh cookie.
- Keep middleware responsible for refreshing cookies during navigation and use verified claims rather than trusting `getSession()` for route protection.

## Error handling

- Browser fetches receive a hard timeout even when the caller supplied an AbortSignal.
- A refresh timeout never leaves the app waiting on the old client; the client is replaced before retrying local session recovery.
- A 401 from the refresh endpoint is treated as signed out. Other failures fall back to the existing cookie if it is still readable, without an infinite loading state.

## Compatibility

- Keep the existing Supabase project URL, anon key, storage key, and raw cookie encoding for migration from Auth Helpers.
- Existing stores continue calling `createBrowserClient()` and require no business-query rewrite.

## Verification

- Node tests cover proxy rewriting, hard abort behavior, and browser auth options.
- Typecheck diagnostics must no longer contain illegal Auth Helper `auth` option errors.
- Lint, build, and focused tests run after migration.
- Production acceptance requires iOS Home Screen cold start, foreground resume after token expiry, and Wi-Fi/cellular switching.
