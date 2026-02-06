---
name: "vercel-react-best-practices"
description: "Vercel's official React and Next.js optimization guide. Invoke when writing new components, optimizing performance (waterfalls, re-renders, bundle size), or refactoring code."
---

# Vercel React Best Practices

Comprehensive performance optimization guide for React and Next.js applications, maintained by Vercel.

## When to Use

Apply these rules when:
- Writing new React components or Next.js pages
- Implementing data fetching (client or server-side)
- Reviewing code for performance issues
- Refactoring existing React/Next.js code
- Optimizing bundle size or load times

## Critical Rules (Priority 1-2)

### 1. Eliminating Waterfalls (CRITICAL)
- **async-defer-await**: Move `await` into branches where actually used
- **async-parallel**: Use `Promise.all()` for independent operations
- **async-dependencies**: Use `better-all` for partial dependencies
- **async-api-routes**: Start promises early, await late in API routes
- **async-suspense-boundaries**: Use `Suspense` to stream content

### 2. Bundle Size Optimization (CRITICAL)
- **bundle-barrel-imports**: Import directly, avoid barrel files (e.g., `import { X } from 'ui/X'` not `import { X } from 'ui'`)
- **bundle-dynamic-imports**: Use `next/dynamic` for heavy components
- **bundle-defer-third-party**: Load analytics/logging after hydration
- **bundle-conditional**: Load modules only when feature is activated
- **bundle-preload**: Preload on hover/focus for perceived speed

## High Impact Rules (Priority 3-4)

### 3. Server-Side Performance (HIGH)
- **server-auth-actions**: Authenticate server actions like API routes
- **server-cache-react**: Use `React.cache()` for per-request deduplication
- **server-cache-lru**: Use LRU cache for cross-request caching
- **server-dedup-props**: Avoid duplicate serialization in RSC props
- **server-serialization**: Minimize data passed to client components

### 4. Client-Side Data Fetching (MEDIUM-HIGH)
- **client-swr-dedup**: Use SWR/TanStack Query for automatic request deduplication
- **client-event-listeners**: Deduplicate global event listeners
- **client-passive-event-listeners**: Use passive listeners for scroll
- **client-localstorage-schema**: Version and minimize localStorage data

## Optimization Rules (Priority 5-8)

### 5. Re-render Optimization (MEDIUM)
- **rerender-defer-reads**: Don't subscribe to state only used in callbacks
- **rerender-memo**: Extract expensive work into memoized components
- **rerender-dependencies**: Use primitive dependencies in effects
- **rerender-functional-setstate**: Use functional setState (`set(prev => ...`) for stable callbacks
- **rerender-lazy-state-init**: Pass function to useState for expensive initial values
- **rerender-move-effect-to-event**: Put interaction logic in event handlers, not effects

### 6. Rendering Performance (MEDIUM)
- **rendering-content-visibility**: Use `content-visibility` for long lists
- **rendering-hoist-jsx**: Extract static JSX outside components
- **rendering-conditional-render**: Use ternary (`? :`), not `&&` for conditionals (avoids printing `0`)
- **rendering-usetransition-loading**: Prefer `useTransition` for loading state

### 7. JavaScript Performance (LOW-MEDIUM)
- **js-batch-dom-css**: Group CSS changes via classes
- **js-index-maps**: Build `Map` for repeated lookups
- **js-cache-storage**: Cache localStorage/sessionStorage reads

### 8. Advanced Patterns (LOW)
- **advanced-event-handler-refs**: Store event handlers in refs
- **advanced-init-once**: Initialize app once per app load
