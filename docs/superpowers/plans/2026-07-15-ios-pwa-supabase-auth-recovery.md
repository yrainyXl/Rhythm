# iOS PWA Supabase Auth Recovery Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Supabase authentication recover reliably after iOS PWA suspension without allowing token refresh to block all data queries.

**Architecture:** Use `@supabase/ssr` cookie clients, disable browser-side automatic refresh, refresh sessions through a same-origin route, and own the browser singleton so it can be replaced after suspension or timeout. Keep existing business stores and the `/sb-proxy` rewrite.

**Tech Stack:** Next.js 14 App Router, TypeScript, Supabase JS, `@supabase/ssr`, Node test runner.

---

### Task 1: Lock browser client behavior

**Files:**
- Create: `tests/supabase-browser-config.test.ts`
- Create: `src/lib/supabase/browser-config.ts`

- [ ] Write tests requiring proxy URL rewriting, enforced timeout aborts, disabled browser auto-refresh, raw cookie compatibility, and a non-library singleton.
- [ ] Run `node --test tests/supabase-browser-config.test.ts` and confirm the missing module/configuration failure.
- [ ] Implement the minimal fetch and options helpers.
- [ ] Re-run the focused test and confirm it passes.

### Task 2: Migrate Supabase clients

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Modify: `src/lib/supabase/client.ts`
- Modify: `src/lib/supabase/server.ts`
- Modify: `src/lib/supabase/route-handler.ts`
- Modify: `src/middleware.ts`
- Modify: `src/app/api/profile/route.ts`
- Modify: `src/app/api/weread/sync/route.ts`

- [ ] Install `@supabase/ssr@^0.10.3` and remove `@supabase/auth-helpers-nextjs`.
- [ ] Replace browser creation with a replaceable application singleton using the tested options.
- [ ] Replace server and route clients with per-request `createServerClient` cookie adapters.
- [ ] Update middleware to propagate refreshed cookies and validate claims.
- [ ] Route API handlers through the shared route-handler client.

### Task 3: Add server-assisted recovery

**Files:**
- Create: `src/app/api/auth/refresh/route.ts`
- Modify: `src/features/auth/components/auth-provider-client.tsx`
- Modify: `src/lib/supabase/client.ts`

- [ ] Add a same-origin refresh route that returns the verified user while applying refreshed cookies.
- [ ] Add initial-load, `pageshow`, online, and visible-state recovery with a bounded request.
- [ ] Replace the client after refresh and reload session/profile without retaining a poisoned initialization promise.

### Task 4: Repair diagnostics

**Files:**
- Modify: `src/app/debug/page.tsx`

- [ ] Remove invalid Auth Helper singleton comparisons.
- [ ] Parse the current cookie through an independent SSR client.
- [ ] Add independent browser-no-refresh, server-refresh, rebuilt-client, and real-query checks.

### Task 5: Verify

**Files:**
- Modify only if a verification failure is caused by this migration.

- [ ] Run focused Node tests.
- [ ] Run `npm run typecheck` and distinguish migration errors from existing database-type failures.
- [ ] Run `npm run lint`.
- [ ] Run `npm run build`.
- [ ] Run `git diff --check` and inspect the final diff for unrelated changes.
