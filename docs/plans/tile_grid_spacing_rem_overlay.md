# Plan: Tile padding, gap, rem-based rhythm, and edit overlay alignment

## Goals

1. **Horizontal rhythm** — Left/right inset for the app grid matches the pane title row (same value in view and edit modes, all breakpoints).
2. **Tile gap** — Increase gutter between app tiles by **2px** (current `TILE_GAP_PX` 8 → **10**), updating all derived math (`getAppColPitch`, `getAppRowPitch`, `getPaneMetrics`, tests, backend YAML only if we document pixel layout—no schema change).
3. **Rem/em** — Adopt a consistent approach for **visual** spacing and typography; keep **layout geometry** that drag/collision/reflow use numerically correct.
4. **Edit overlay** — Background grid should **read as aligned** with pane **outer** edges and tile rhythm, with visible **guttering** between major cells (not just 1px hairlines).

---

## Rem / em: is it a good idea?

**Yes, selectively.**

| Use rem/em well | Keep in px (or CSS → measured px) |
|-----------------|-------------------------------------|
| Padding, gaps, radii, header height in **CSS** (`padding`, `gap`, `border-radius`) | Drag snap, collision AABB, `getPaneMetrics`, pane positions stored as grid indices × step |
| Typography (`text-sm`, `rem` font sizes) | `repeating-linear-gradient` **background** sizes in `DashboardGrid` (CSS accepts `rem`; must match token math or use same vars) |
| A **single source** like `:root { --pane-pad-x: 0.75rem; --tile-gap: 0.625rem; }` | Any value that must match **JS and CSS** without drift |

**Caveats**

- **Pointer math** (`clientX` / `deltaX`) is in **device pixels**. Layout must resolve to px before hit-testing and grid rounding.
- **Changing root font size** (accessibility) should scale chrome; **icon tile sizes** might stay slightly more stable if tied to `rem`, or stay in px for crisp bitmap/icons—product choice. This plan recommends **rem for padding/gaps**, keep **tile icon box** on the existing preset ladder (small/medium/large) possibly still expressed in px from design tokens unless you later derive tile size from `rem` too.
- Avoid **em** for horizontal layout inside components with mixed font sizes—it compounds unpredictably. Prefer **rem** or **px** for layout.

**Recommended pattern**

1. Define **layout CSS variables** on the dashboard root (e.g. `.dashboard-canvas` or `#root` scoped): `--pane-pad-x`, `--pane-pad-y-content`, `--tile-gap`, `--header-height`.
2. Keep **`layoutConstants.ts`** as the **authoritative numbers for JS** during the transition, but **derive them from the same numeric intent** as the CSS vars (document: “at 16px root, `--pane-pad-x: 0.75rem` ↔ 12px in TS”).
3. **Phase 2 (optional follow-up):** Read `getComputedStyle(el).getPropertyValue('--tile-gap')` once per resize and feed `getLayoutTokens`—only if we need live root scaling without duplicate constants.

---

## Phase 1 — Padding + tile gap (behavior + visuals) — **done**

- **`GRID_INSET_X_PX` = 12** — matches header **`px-3`** (0.75rem at 16px root); edit mode no longer uses `px-2` / `sm:` split.
- **`TILE_GAP_PX` = 10** — +2px between app tiles; all pitch/metrics/tests updated.
- **`PANE_CELL_WIDTH_BY_PRESET`** — computed as natural **3-column** width: `2 * GRID_INSET_X + 3 * tile + 2 * TILE_GAP` per preset (188 / 212 / 236).

---

## Phase 2 — Rem-based tokens (styling layer)

1. Add **`frontend/src/styles/dashboard-layout.css`** (or a Tailwind `@layer` block) with `:root` / scope:

   ```css
   .dashboard-layout-scope {
     --pane-pad-x: 0.75rem;
     --pane-pad-y-top: 1rem;   /* if we align GRID_INSET_Y to a rem scale */
     --header-height: 2.25rem; /* 36px @ 16px */
     --tile-gap: 0.625rem;     /* 10px @ 16px */
   }
   ```

2. Wire **PaneCard** header + optional content wrapper to `padding-left/right: var(--pane-pad-x)` **or** Tailwind arbitrary `px-[length(var(--pane-pad-x))]` so CSS and future scaling stay aligned.

3. **TypeScript** — Either:
   - **A (minimal):** Keep exporting px from `layoutConstants` with a one-line comment “equals `var(--tile-gap)` at 16px root”, or  
   - **B (stronger):** `export const REM_ROOT_PX = 16` and `export const tileGapPx = 0.625 * REM_ROOT_PX` (still a single compile-time number unless we measure).

4. **Do not** convert collision/drag to `em`—only **sync** their inputs with the rem-backed design tokens.

---

## Phase 3 — Edit overlay: pane edges + guttering

### 3.1 Problem

- Overlay uses `getDashboardCanvasGridSpec`: phase `contentOriginX/Y` aligns the **inner** app grid to the pattern, while **pane** `left/top` are multiples of **tile step** from **pane outer** origin `(0,0)` on the canvas.
- So **outer** pane left/top often **do not** sit on the same lines as the **first tile** column—by design of the old phase—and **outer right/bottom** are not generally multiples of step because pane width/height are **tight natural** sizes.

### 3.2 Target behavior

1. **Corners** — At least **pane top-left** (for any pane at `gx,gy` with integer grid indices) should coincide with a **major** grid intersection used for snapping.
2. **Guttering** — Repeating pattern should read as **cells with margin** (e.g. subtle filled cell vs darker gutter), not only 1px lines on every step.

### 3.3 Implementation sketch

**A. Dual-phase overlay (recommended)**

- **Layer 1 — “Snap grid”** (optional, low opacity): period = `(tileStepX, tileStepY)`, **`backgroundPosition: 0 0`** so lines pass through **pane origin** multiples `(gx * stepX, gy * stepY)`. This aligns with **`getPaneCanvasOriginPixels`**.
- **Layer 2 — “Cell + gutter”**: either:
  - `background-size: tileStepX tileStepY` with a **linear-gradient** that draws a **rounded rect** or inset border leaving **transparent gutter** (e.g. 2px or `0.125rem`) on the inside of each repeat, or  
  - Two gradients: vertical/horizontal lines at **coarser** interval (full tile+gap) with **gap** between drawn segments.

**B. Inner tile alignment**

- After (A), **inner** tile centers won’t match Layer 1 lines unless tile step divides content area. Compensate with **pane-local** optional second pattern **inside** `PaneCard` in edit mode only (already partially there)—**or** accept that global snap grid is **outer**-aligned and inner grid is handled by the pane’s own faint grid (already exists).

**C. Outer right/bottom**

- If product requires **outer right** on a vertical line: reintroduce **horizontal only** outer snap: `paneWidth = gridSpanX * tileStepX` with **distributed column gaps** (existing `getAppColPitchDistributed`) so there is **no empty horizontal band**—only wider gutters between tiles. **Do not** reintroduce vertical slack band; vertical outer alignment stays **natural height** unless we find a step that divides natural height without slack (separate analysis).

**Files**

- `frontend/src/components/dashboard/DashboardGrid.tsx` — overlay `div`: two backgrounds, `backgroundBlendMode` / stacked divs.
- `frontend/src/features/layout/paneMath.ts` — possibly split **`getDashboardCanvasGridSpec`** into:
  - `getDashboardSnapGridSpec` — origin `(0,0)`, step = tile pitch (placement-aligned).
  - `getPaneContentPhase(tokens)` — for in-pane debug grid only.
- **Tests** — snapshot or pixel tests optional; manual QA in edit mode.

---

## Implementation order

| Step | Work |
|------|------|
| 1 | `GRID_INSET_X` + header padding unified; `TILE_GAP_PX` +2; fix tests |
| 2 | CSS variables + rem-based padding on pane chrome; TS constants documented / derived from same scale |
| 3 | Overlay: snap grid at (0,0) + guttered cell pattern; optional horizontal outer snap for right-edge alignment |
| 4 | Manual pass: drag/resize collision, narrow viewport (`getEffectiveTileSize`), reflow presentation |

---

## Out of scope (defer)

- Migrating **tile icon pixel sizes** (48/56/64) to rem without a full redesign.
- Backend config versioning for layout (still client-only layout).
- Changing stored pane grid semantics (still tile indices × step).

---

## Success criteria

- Title and first/last app columns share the **same** horizontal inset at all breakpoints used.
- Tile-to-tile gap is **+2px** vs current production constants.
- Dashboard shell uses **rem-backed** vars for shared padding/gap where practical; JS layout stays consistent with those values at default root.
- Edit overlay: pane **origins** line up with the **snap grid**; pattern shows **visible gutters**; no return of the **vertical slack footer**.
