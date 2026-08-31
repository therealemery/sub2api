# OwnAPI Public And User Motion System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add restrained, accessible, high-performance motion to OwnAPI’s public pages and ordinary-user dashboard while leaving every administrator page visually unchanged.

**Architecture:** Build an opt-in motion layer from CSS tokens, small Vue composables/components, and layout-scoped route transitions. Public and user pages explicitly adopt effects; administrator layouts receive no route animation or decorative motion. CSS/Vue primitives are preferred over a new animation dependency.

**Tech Stack:** Vue 3, TypeScript, Vue Router, CSS, IntersectionObserver, Chart.js/vue-chartjs, Vitest, Vue Test Utils.

**Spec:** `docs/superpowers/specs/2026-08-31-ownapi-public-user-motion-design.md`

## Global Constraints

- Administrator pages and administrator monitoring must receive no new motion.
- Micro interactions use 120–200ms, component transitions 200–300ms, and public reveal motion at most 450ms.
- Ordinary reveal displacement is 2–24px.
- Animate `transform` and `opacity` by default; do not introduce heavy filter/layout animation.
- `prefers-reduced-motion: reduce` removes displacement, scale, animated counting, shimmer, and chart drawing.
- Motion never delays API calls, initial content visibility, button handlers, or route navigation.
- No WebGL, Three.js, Lottie, Rive, background video, cursor follower, strong magnetism, continuous rotation, or decorative particles.
- No new animation dependency unless CSS/Vue/Chart.js cannot satisfy an approved requirement.

---

### Task 1: Motion Tokens And Reduced-Motion Composable

**Files:**
- Modify: `frontend/src/style.css`
- Create: `frontend/src/composables/useReducedMotion.ts`
- Create: `frontend/src/composables/__tests__/useReducedMotion.spec.ts`

**Interfaces:**
- Produces: CSS custom properties from the spec and `useReducedMotion(): Readonly<Ref<boolean>>`.
- Consumes: browser `matchMedia('(prefers-reduced-motion: reduce)')`.

- [ ] **Step 1: Write the failing composable test**

Mock `matchMedia`, mount a tiny setup component, assert the initial preference and a later `change` event update the returned ref, then unmount and assert the listener is removed.

```ts
const reduced = useReducedMotion()
expect(reduced.value).toBe(false)
media.matches = true
media.dispatchEvent(new Event('change'))
expect(reduced.value).toBe(true)
```

- [ ] **Step 2: Run the focused test and verify failure**

Run: `cd frontend && pnpm vitest run src/composables/__tests__/useReducedMotion.spec.ts`

- [ ] **Step 3: Implement the composable and tokens**

Export one readonly ref per caller, adding/removing the same `change` handler in Vue lifecycle hooks. If `matchMedia` is unavailable, default to `false`.

Add to `:root` in `style.css`:

```css
--motion-instant: 120ms;
--motion-fast: 160ms;
--motion-base: 220ms;
--motion-slow: 320ms;
--motion-hero: 450ms;
--ease-standard: cubic-bezier(.2, 0, 0, 1);
--ease-enter: cubic-bezier(.16, 1, .3, 1);
--ease-exit: cubic-bezier(.4, 0, 1, 1);
```

Add global `.motion-fade-*`, `.motion-scale-fade-*`, and `.motion-list-*` Vue transition classes. Add a Reduced Motion media query that makes these transitions effectively instantaneous and removes transforms.

- [ ] **Step 4: Run test, lint, and commit**

Run: `cd frontend && pnpm vitest run src/composables/__tests__/useReducedMotion.spec.ts && pnpm lint:check`

```bash
git add frontend/src/style.css frontend/src/composables/useReducedMotion.ts frontend/src/composables/__tests__/useReducedMotion.spec.ts
git commit -m "feat: add accessible motion primitives"
```

### Task 2: One-Time In-View Reveal Primitive

**Files:**
- Create: `frontend/src/composables/useInViewReveal.ts`
- Create: `frontend/src/composables/__tests__/useInViewReveal.spec.ts`
- Modify: `frontend/src/style.css`

**Interfaces:**
- Consumes: `useReducedMotion()` from Task 1.
- Produces: `useInViewReveal(options?)` returning `{ target, revealed }`, with `once` defaulting to true and direct visibility fallback.

- [ ] **Step 1: Write failing observer tests**

Mock `IntersectionObserver` and assert: observation starts after mount, intersecting sets `revealed` true, default behavior disconnects after first reveal, Reduced Motion immediately reveals, missing IntersectionObserver immediately reveals, and unmount disconnects.

- [ ] **Step 2: Run and verify failure**

Run: `cd frontend && pnpm vitest run src/composables/__tests__/useInViewReveal.spec.ts`

- [ ] **Step 3: Implement the primitive**

Use this public signature:

```ts
export interface InViewRevealOptions {
  once?: boolean
  rootMargin?: string
  threshold?: number
}

export function useInViewReveal(options: InViewRevealOptions = {}) {
  const target = ref<HTMLElement | null>(null)
  const revealed = ref(false)
  // observe target; fallback to revealed=true
  return { target, revealed: readonly(revealed) }
}
```

Add `.reveal-item` and `.reveal-item.is-revealed` styles using opacity and `translateY(16px)`. Allow a CSS `--reveal-delay` capped by page code; never hide content without the JS enhancement class on `<html>`.

- [ ] **Step 4: Run tests and commit**

Run: `cd frontend && pnpm vitest run src/composables/__tests__/useInViewReveal.spec.ts`

```bash
git add frontend/src/composables/useInViewReveal.ts frontend/src/composables/__tests__/useInViewReveal.spec.ts frontend/src/style.css
git commit -m "feat: add one-time content reveal motion"
```

### Task 3: Layout-Scoped Route And Mobile Navigation Motion

**Files:**
- Modify: `frontend/src/components/public/PublicSiteLayout.vue`
- Modify: `frontend/src/components/public/PublicSiteHeader.vue`
- Modify: `frontend/src/components/layout/LayoutView.vue`
- Create: `frontend/src/components/layout/UserRouteTransition.vue`
- Create: `frontend/src/components/layout/__tests__/UserRouteTransition.spec.ts`

**Interfaces:**
- Consumes: global transition classes from Task 1 and router-view slot API.
- Produces: public/user route transitions only; admin route names bypass transitions.

- [ ] **Step 1: Write failing route-transition tests**

Assert ordinary user route metadata produces `motion-fade`, while `route.path.startsWith('/admin')` produces no transition wrapper/name. Assert the mobile public menu is wrapped by `Transition` and remains keyboard reachable when open.

- [ ] **Step 2: Run and verify failure**

Run: `cd frontend && pnpm vitest run src/components/layout/__tests__/UserRouteTransition.spec.ts`

- [ ] **Step 3: Implement opt-in transitions**

Use router-view’s slot in the public/user layout:

```vue
<router-view v-slot="{ Component, route }">
  <Transition :name="route.path.startsWith('/admin') ? undefined : 'motion-fade'" mode="out-in">
    <component :is="Component" :key="route.fullPath" />
  </Transition>
</router-view>
```

Do not apply a transition in administrator-specific full-screen routes. Wrap the mobile panel in `Transition name="motion-scale-fade"`; retain `aria-expanded`, current focus behavior, and immediate click handling.

- [ ] **Step 4: Run tests and commit**

Run: `cd frontend && pnpm vitest run src/components/layout/__tests__/UserRouteTransition.spec.ts && pnpm typecheck`

```bash
git add frontend/src/components/public/PublicSiteLayout.vue frontend/src/components/public/PublicSiteHeader.vue frontend/src/components/layout/LayoutView.vue frontend/src/components/layout/UserRouteTransition.vue frontend/src/components/layout/__tests__/UserRouteTransition.spec.ts
git commit -m "feat: scope route motion to public and user pages"
```

### Task 4: Public Homepage Motion

**Files:**
- Modify: `frontend/src/views/HomeView.vue`
- Create: `frontend/src/views/__tests__/HomeView.motion.spec.ts`

**Interfaces:**
- Consumes: reveal primitive and motion tokens.
- Produces: one-time hero sequence, model matrix reveal, section reveals, hover/FAQ feedback.

- [ ] **Step 1: Write failing homepage motion tests**

Mount Home with mocked IntersectionObserver and assert hero layers have deterministic delay variables `0ms`, `60ms`, `120ms`, and `180ms`; capability sections become revealed on intersection; no timer or request prevents CTA clicks; Reduced Motion exposes final content immediately.

- [ ] **Step 2: Run and verify failure**

Run: `cd frontend && pnpm vitest run src/views/__tests__/HomeView.motion.spec.ts`

- [ ] **Step 3: Add the approved homepage motion**

Apply animation classes only to hero eyebrow/title/copy/actions and model matrix tiles. Cap total hero sequence below 600ms. Use `translateY(3px)` hover lift for provider tiles, `translateY(-2px)` for capability cards, and max icon scale `1.04`. Add animated FAQ content height using CSS grid rows or Vue transition without measuring on every frame.

- [ ] **Step 4: Run tests, typecheck, and commit**

Run: `cd frontend && pnpm vitest run src/views/__tests__/HomeView.motion.spec.ts && pnpm typecheck`

```bash
git add frontend/src/views/HomeView.vue frontend/src/views/__tests__/HomeView.motion.spec.ts
git commit -m "feat: add restrained homepage motion"
```

### Task 5: Models And Docs Motion

**Files:**
- Modify: `frontend/src/views/public/ModelsCatalogView.vue`
- Modify: `frontend/src/views/public/ModelDetailView.vue`
- Modify: `frontend/src/views/public/DocsView.vue`
- Modify: `frontend/src/components/models/ModelCodeExamples.vue`
- Create: `frontend/src/views/public/__tests__/PublicMotion.spec.ts`

**Interfaces:**
- Consumes: price/filter implementation from the model-pricing plan and motion primitives from Tasks 1–2.
- Produces: bounded list transition, card hover, price-tier crossfade, Docs indicator/copy feedback.

- [ ] **Step 1: Write failing public-page motion tests**

Assert Models uses a `TransitionGroup`, list delays are capped after the first visible row, Grok price tier content uses `motion-fade`, and Docs copy confirmation preserves button dimensions and resets after 1.5 seconds. In Reduced Motion, all content renders without transform classes.

- [ ] **Step 2: Run and verify failure**

Run: `cd frontend && pnpm vitest run src/views/public/__tests__/PublicMotion.spec.ts`

- [ ] **Step 3: Implement bounded public motion**

Use `TransitionGroup name="motion-list"` for filtered models and stable keys `${platform}:${modelId}`. Set delays only for the first six visible entries and use `0ms` afterward. Keep card hover at `-2px` and artwork scale at `1.02`. Wrap tier price values and copied-state labels in `motion-fade`; do not animate individual digits.

Move Docs active-item indication with transform/opacity; keep anchor positioning immediate under Reduced Motion. Do not add scroll reveals to code blocks, tables, or long prose.

- [ ] **Step 4: Run tests and commit**

Run: `cd frontend && pnpm vitest run src/views/public/__tests__/PublicMotion.spec.ts && pnpm typecheck`

```bash
git add frontend/src/views/public/ModelsCatalogView.vue frontend/src/views/public/ModelDetailView.vue frontend/src/views/public/DocsView.vue frontend/src/components/models/ModelCodeExamples.vue frontend/src/views/public/__tests__/PublicMotion.spec.ts
git commit -m "feat: animate public model and docs interactions"
```

### Task 6: Animated User Statistics And Dashboard Loading

**Files:**
- Create: `frontend/src/components/common/AnimatedNumber.vue`
- Create: `frontend/src/components/common/__tests__/AnimatedNumber.spec.ts`
- Modify: `frontend/src/components/dashboard/UserDashboardStats.vue`
- Modify: `frontend/src/components/dashboard/UserDashboardCharts.vue`
- Modify: `frontend/src/views/user/DashboardView.vue`
- Create: `frontend/src/views/user/__tests__/DashboardMotion.spec.ts`

**Interfaces:**
- Consumes: `useReducedMotion` and existing formatted numeric values.
- Produces: `AnimatedNumber` props `{ value: number; duration?: number; format?: (value: number) => string }`; first-load stats and chart reveal.

- [ ] **Step 1: Write failing AnimatedNumber tests**

Use fake timers and mocked `requestAnimationFrame`. Assert the component starts from the previous value, reaches the exact new value, uses the formatter, cancels RAF on unmount, and jumps immediately under Reduced Motion.

- [ ] **Step 2: Write failing dashboard behavior tests**

Assert initial stats animate once, automatic refresh transitions from the displayed old value rather than zero, skeleton and final cards have stable wrappers, and admin dashboard components are not imported or modified.

- [ ] **Step 3: Run and verify failures**

Run: `cd frontend && pnpm vitest run src/components/common/__tests__/AnimatedNumber.spec.ts src/views/user/__tests__/DashboardMotion.spec.ts`

- [ ] **Step 4: Implement AnimatedNumber and user dashboard integration**

Use `performance.now()` and RAF with the approved enter easing. Default duration is 320ms and capped at 450ms. Preserve formatted decimals/currency through the supplied formatter. Make Chart.js animations 300–450ms on first data, approximately 220ms for range updates, and `duration: 0` under Reduced Motion.

Replace the full-page spinner with stable card skeletons only if existing card dimensions can be preserved; otherwise retain the spinner and animate only the final content opacity.

- [ ] **Step 5: Run tests, typecheck, and commit**

Run: `cd frontend && pnpm vitest run src/components/common/__tests__/AnimatedNumber.spec.ts src/views/user/__tests__/DashboardMotion.spec.ts && pnpm typecheck`

```bash
git add frontend/src/components/common/AnimatedNumber.vue frontend/src/components/common/__tests__/AnimatedNumber.spec.ts frontend/src/components/dashboard/UserDashboardStats.vue frontend/src/components/dashboard/UserDashboardCharts.vue frontend/src/views/user/DashboardView.vue frontend/src/views/user/__tests__/DashboardMotion.spec.ts
git commit -m "feat: animate user dashboard feedback"
```

### Task 7: User Monitor, Keys, Forms, And Dense Tables

**Files:**
- Modify: `frontend/src/views/user/ChannelStatusView.vue`
- Modify: `frontend/src/views/user/KeysView.vue`
- Modify: `frontend/src/components/common/Toast.vue`
- Modify: `frontend/src/styles/interaction-states.css`
- Create: `frontend/src/views/user/__tests__/UserInteractionMotion.spec.ts`

**Interfaces:**
- Consumes: motion tokens and Reduced Motion preference.
- Produces: one-shot status-change pulse, request-only refresh spin, copy/success transitions, static dense table behavior.

- [ ] **Step 1: Write failing interaction tests**

Assert status pulse is added only when status changes, removed after one animation cycle, and never loops. Assert refresh icon spins only while the request promise is pending. Assert copy feedback changes in place. Assert user table rows do not receive translate/scale classes.

- [ ] **Step 2: Run and verify failure**

Run: `cd frontend && pnpm vitest run src/views/user/__tests__/UserInteractionMotion.spec.ts`

- [ ] **Step 3: Implement functional feedback**

Use keyed previous-status comparison, a one-shot CSS animation under 300ms, and static Reduced Motion fallback. Reuse existing Toast transitions with motion tokens. Keep table hover limited to background/border color; add only arrow rotation and inline validation fade where already supported.

- [ ] **Step 4: Run tests and commit**

Run: `cd frontend && pnpm vitest run src/views/user/__tests__/UserInteractionMotion.spec.ts && pnpm typecheck`

```bash
git add frontend/src/views/user/ChannelStatusView.vue frontend/src/views/user/KeysView.vue frontend/src/components/common/Toast.vue frontend/src/styles/interaction-states.css frontend/src/views/user/__tests__/UserInteractionMotion.spec.ts
git commit -m "feat: add functional user interaction motion"
```

### Task 8: Regression Verification And Durable Handoff

**Files:**
- Modify: `AGENTS.md`

**Interfaces:**
- Consumes: all earlier motion tasks.
- Produces: verified public/user motion with documented recovery state.

- [ ] **Step 1: Run all frontend checks**

Run: `cd frontend && pnpm lint:check && pnpm typecheck && pnpm test:run && pnpm build`

Expected: all commands exit 0.

- [ ] **Step 2: Verify administrator exclusion**

Inspect `git diff --name-only` and ensure no `frontend/src/views/admin/**` file changed. Visit `/admin/dashboard` and `/admin/ops` with an administrator session and confirm there is no new route transition, reveal, count-up, card lift, or pulsing status.

- [ ] **Step 3: Browser QA normal motion**

At desktop and mobile widths, verify Home hero/sections/FAQ, Models filtering/tier changes, Docs copy/anchors, Dashboard load/range refresh, Keys copy/action feedback, and user Monitor refresh/status. Confirm controls remain clickable during motion, focus is retained, and no content waits on staggered animation.

- [ ] **Step 4: Browser QA Reduced Motion**

Emulate `prefers-reduced-motion: reduce` and repeat the same paths. Confirm no displacement, scale, shimmer, animated count, chart drawing, continuous rotation, or smooth anchor scrolling remains; state changes must still be understandable.

- [ ] **Step 5: Performance check**

Record a browser performance trace for Home initial load and Dashboard data refresh. Confirm animation work is dominated by compositor-friendly transform/opacity, no long task is introduced by motion code, and request start times are unchanged.

- [ ] **Step 6: Update `AGENTS.md`**

Record motion architecture, exact scope exclusions, new primitives, changed files, tests/build results, browser QA states, latest safe commit, and how to disable or extend motion. Preserve existing deployment blocker notes.

- [ ] **Step 7: Commit verification checkpoint**

```bash
git add AGENTS.md
git commit -m "docs: record motion system implementation"
```
