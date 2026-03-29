# Responsive layout & viewport plan

Actionable tasks for centered canvas behavior, small-window handling, and mobile-friendly viewing. Complements the existing architecture notes in `architechture_plan.md` and `developer_spec_plan.md`.

## Principles (non-negotiables)

| Principle | Meaning |
|-----------|---------|
| **No horizontal scroll (viewing default)** | For **non-edit** / **reflow presentation**, do not rely on horizontal scroll: avoid `overflow-x: auto` as the primary answer to “too wide.” **Exception (Phase 7):** in **edit mode**, the **logical grid** is the source of truth — horizontal **panning inside the canvas** is allowed when content is wider than the viewport so users are not soft-locked after shrinking a preset or window. |
| **Wrap downward** | When the layout does not fit the available width, **reflow** (read-only path) so panes move to **new rows below**, growing height and using **vertical** scroll only. **Edit mode** may skip reflow and use scroll instead (Phase 7). |
| **Scale as a secondary lever** | Uniform **scale-down** (`transform: scale`) may still be used *if* wrapping alone is insufficient or for edge cases, but it is subordinate to reflow—not the default. |

## Goals

1. **Viewport resize** — Confirm the dashboard canvas grows and shrinks in a way that feels **center-anchored** (not “stuck to one edge”) when width mode is preset or custom.
2. **Narrow viewports** — When content is wider than the screen, **reflow downward** (primary) for **viewing**. In **edit mode**, prefer **absolute grid + horizontal scroll** inside the canvas so drag/collision stay aligned with saved coordinates (Phase 7).
3. **Touch** — Keep launch scope realistic: document what works on touch first; defer full edit-mode polish if needed.

## Current behavior (baseline)

| Area | Behavior |
|------|----------|
| Canvas wrapper | `w-full`, `max-w-full`, `box-border`, `overflow-x-hidden`; `maxWidth` from settings + `marginInline: 'auto'` (`Dashboard.tsx`). |
| Grid size | **Viewing (not edit):** when **content width > canvas width**, **reflow** packs panes into rows + **vertical** scroll only (`DashboardGrid` + `reflowLayout.ts`). **Edit (Phase 7):** keep **absolute** logical grid; canvas may **`overflow-x: auto`** when content is wider than measured width. |
| Narrow tokens | Container width **&lt; 720px** uses **`small`** layout tokens for rendering only (not persisted). |
| Scale | If any pane is still wider than the canvas after wrap, **uniform scale** (`reflowScale`) fits that max pane; wrapper height uses scaled height. |

**Code anchors**

- `frontend/src/components/dashboard/Dashboard.tsx` — canvas ref + `useElementWidth` → `containerContentWidth`
- `frontend/src/hooks/useElementWidth.ts` — `ResizeObserver` width
- `frontend/src/features/layout/reflowLayout.ts` — sort + wrap positions + `contentWidth` / `contentHeight`
- `frontend/src/features/layout/viewportLayout.ts` — **`NARROW_CANVAS_WIDTH_PX`**, **`getEffectiveTileSizeForCanvasWidth`**
- `frontend/src/components/dashboard/DashboardGrid.tsx` — reflow vs absolute grid, `effectiveTileSize`, collision uses effective size
- `frontend/src/features/layout/paneMath.ts` — macro grid and tile dimensions

---

## Phase 1 — Shell & containment (foundation)

**Outcome:** Canvas uses full available width up to the configured cap; **horizontal overflow is not the default release valve for viewing** — use **`overflow-x: hidden`** at the dashboard shell and reflow for narrow **read** layouts. **Phase 7** adds a deliberate **edit-mode** exception: horizontal scroll **inside** the grid region only, not body-level drift.

- [x] **1.1** Set the dashboard canvas container to **`width: 100%`** (e.g. Tailwind `w-full`) alongside existing `maxWidth` so below the cap the block fills `main` and remains centered.
- [x] **1.2** Confirm **`box-sizing`** on the canvas and `main` padding so `100%` does not cause accidental horizontal scroll (inspect `px-4` + borders).
- [x] **1.3** Set **`overflow-x: hidden`** on the outer dashboard scroll region (and audit `minWidth` on `DashboardGrid` once reflow exists so it does not force page-level horizontal overflow). Prefer **`overflow-y: auto`** only for vertical scrolling. **Phase 7:** when **edit mode** and content wider than canvas, allow **`overflow-x: auto`** on the **grid scroll container** (not `main` / body).
- [x] **1.4** Smoke-test **width modes** (`preset` / `custom` / `full`) in browser when changing settings; layout uses the same canvas + reflow rules for each.

---

## Phase 2 — Measure viewport vs content (data for reflow & scale)

**Outcome:** The app knows **available width** and **content width** so we can **reflow** (and optionally scale) with clear thresholds.

- [x] **2.1** Add a **`ResizeObserver`** on the canvas via **`useElementWidth`**.
- [x] **2.2** Parent passes **`containerContentWidth`** into `DashboardGrid`; grid owns content `width` / reflow threshold (no `onLayout` callback yet).
- [x] **2.3** **`needsReflow`** ≡ `width > containerContentWidth` when measured width &gt; 0.

---

## Phase 3 — Scale-to-fit (secondary; after or alongside reflow)

**Outcome:** When reflow still leaves content too wide or tiles remain impractically small, **uniformly scale down** so there is still **no horizontal scrollbar**. Use only where wrapping cannot solve the problem in time, or as a temporary bridge.

- [x] **3.1** **Decision:** Scale applies in **reflow** when **max pane width &gt; canvas width**; **edit** uses **interaction lock** while **reflow presentation** is active. **Phase 7:** avoid reflow presentation in **edit mode** so lock + banner are not triggered when shrinking the viewport after a wide layout.
- [x] **3.2** **`reflowScale = min(1, canvasWidth / maxPaneWidth)`** when the widest pane does not fit.
- [x] **3.3** Reflow scale uses **`transform-origin: top center`** inside a **flex-centered** strip; clip height **`contentHeight * reflowScale`**.
- [x] **3.4** Reflow wrapper uses **`minHeight: contentHeight * reflowScale`**.

- [ ] **3.6** **Manual:** spot-check blur/tap targets on phones after releases.

---

## Phase 4 — Responsive tokens (medium effort)

**Outcome:** Same logical grid uses smaller physical pixels on narrow screens, **reducing how often reflow is needed** and keeping wrapped layouts shorter. Still no horizontal scroll.

- [x] **4.1** **720px** canvas content width breakpoint (`NARROW_TOKEN_BREAKPOINT_PX`).
- [x] **4.2** **`effectiveTileSize`**: `small` below breakpoint, else config size — **display + collision** in grid use this (non-persistent).
- [x] **4.3** **`handleAddPane`** uses **`getEffectiveTileSizeForCanvasWidth`** (shared with `DashboardGrid`) so **`findNextPaneGridPosition`** / collision match on-screen tokens.
- [x] **4.4** No separate persisted mobile density.

---

## Phase 5 — Wrap-down reflow (large, product milestone) — **primary narrow-viewport strategy**

**Outcome:** When `availableWidth < contentWidth`, **recompute pane positions** (or a derived “presentation grid”) so panes **continue on the next row** instead of extending right. Vertical scroll only. This is the main mechanism that honors **no horizontal scroll**.

- [x] **5.1** **Row-major** on logical grid `(y, then x)` via **`sortPanesForReflow`**.
- [x] **5.2** **Ephemeral** layout only (`computeReflowRows` + flex rows); YAML unchanged.
- [x] **5.3** Add-pane placement uses **effective tile size** from **`viewportLayout.ts`** (not raw config alone).
- [x] **5.4** **Drag/resize/reorder disabled** when reflow active + amber **banner** in edit mode. **Superseded for UX by Phase 7** (edit should not stay on reflow when the user needs to arrange panes).

---

## Phase 7 — Edit mode: logical grid + scroll (no soft-lock)

**Problem:** Users who lay out panes **sparsely** at full width, then switch to a **smaller width preset** or narrow window, hit **reflow + interaction lock**: the amber banner appears and pane drag / resize / app reorder stop. Reflow is **ephemeral** and does not match **YAML grid coordinates**, so locking was a safety choice — but it **blocks legitimate editing**.

**Pattern (industry):** Treat the **saved grid** as **document space** while editing (Figma / whiteboards: pan & zoom or scroll the canvas). **Reflow stays the default for viewing** when not editing.

**Outcome:** In **edit mode**, when `needsReflow` would be true, **do not** switch to reflow presentation. Render the **absolute** pane grid (`(x,y)` × step), set the grid region’s **`minWidth`** to the logical canvas extent, and use **`overflow-x: auto`** on that scroll container so users can reach off-screen panes. **Drag, resize, and app reorder** use the same code paths as wide view — no coordinate mismatch. **Exit edit** → return to reflow when content is still wider than the canvas.

**Tasks**

- [ ] **7.1** **`DashboardGrid`:** Gate reflow: e.g. `useReflowPresentation = needsReflow && !editMode` (name as implemented). Compute reflow only when presentation needs it, or compute and ignore when editing — pick one for clarity and perf.
- [ ] **7.2** **`interactionLocked`:** `false` whenever reflow presentation is off (`!useReflowPresentation`). Remove the **amber banner** for the “locked while wrapped” case when edit uses scroll; optional short hint: “Layout is wider than the window — scroll horizontally to reach panes.”
- [ ] **7.3** **Scroll container:** Ensure **`minWidth` / `minHeight`** for the absolute grid match logical content size when `width > containerContentWidth` and `editMode`, and **`overflow-x: auto`** applies to the correct inner wrapper (no `main`-level horizontal scroll).
- [ ] **7.4** **Optional polish:** Scroll dragged pane into view on drag start; minimap / fit-width zoom — deferred.
- [ ] **7.5** **Tests:** `editMode` + `width > canvas` keeps absolute layout and does **not** set interaction locked; reflow + lock unchanged when `!editMode`.
- [ ] **7.6** **Manual QA:** Wide sparse layout → shrink preset while **Done** (reflow OK) → **Edit** (scroll, drag pane, resize, app reorder) → **Done** (reflow again).

**Non-goals (for this phase):** Enabling drag **during** reflow without a defined mapping from flex order ↔ grid; silent rewriting of `(x,y)` on resize.

---

## Phase 6 — Polish & QA

- [x] **6.1** **Safe areas:** dashboard shell (`Dashboard.tsx`) uses **`padding*`: `max(0px, env(safe-area-inset-*, 0px))`** on the outer `pane-grain` container.
- [x] **6.2** **`min-h-0` / `flex-1`** on shell + main + canvas; shell **`minHeight: max(100%, 100dvh)`** for mobile viewport height.
- [x] **6.3** **Regression (manual):** (1) desktop grid — pane drag, resize, app drag, settings save; (2) narrow / reflow — no horizontal scroll, wrapped order; (3) width modes preset/custom/full; (4) add pane on narrow canvas. **Phase 7:** (2) split — **viewing:** reflow, no horizontal scroll; **edit:** horizontal scroll inside canvas, **no** lock/banner. **Automated:** `reflowLayout`, `viewportLayout` unit tests.

---

## Suggested order of execution

1. Complete **Phase 1** (containment, no horizontal escape hatch).  
2. **Phase 2** — measure available vs content width (required for reflow decisions).  
3. **Phase 5** (core) — implement **wrap-down reflow** as the default answer to narrow viewports.  
4. **Phase 4** — denser tokens to reduce wrap frequency / total height.  
5. **Phase 3** — optional **scale** only where reflow + tokens are not enough.  
6. **Phase 6** — polish.  
7. **Phase 7** — edit-mode scroll + no reflow presentation (fixes soft-lock after wide → narrow).

---

## Open decisions (fill in as you go)

| Decision | Options | Notes |
|----------|---------|--------|
| Reflow persistence | Ephemeral mapping vs second saved layout | Ephemeral avoids YAML churn; second layout is explicit user control. |
| Edit mode on small screens | **Phase 7:** absolute grid + horizontal scroll in canvas while editing; reflow when not editing | Reflow + drag without a grid↔flex mapping is unsafe; scroll preserves YAML semantics. |
| When to apply Phase 3 scale | Never / only &lt; N px / user toggle | Prefer exhausting wrap + token shrink first. |
| Breakpoint source | `window`, `container`, or config | Container matches actual canvas width. |

---

## Revision

| Date | Change |
|------|--------|
| 2026-03-28 | Initial plan from responsive investigation. |
| 2026-03-28 | No horizontal scroll; wrap downward primary, scale secondary; Phase 1/2/5/ order updated. |
| 2026-03-29 | Implemented Phases 1–5 (core), 3 (partial), 4 (partial), 6 (partial): reflow, `useElementWidth`, narrow `small` tokens, reflow scale, interaction lock. |
| 2026-03-29 | `viewportLayout` + add-pane alignment; reflow **top center** scale; safe-area padding + **`100dvh`** shell; docs QA checklist. |
| 2026-03-29 | **Phase 7** added: edit-mode exception to “no horizontal scroll”; principles + Phases 1, 3, 5, 6 cross-links; implementation checklist (scroll logical grid, drop soft-lock while editing). |
