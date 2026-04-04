# Plan: Tile-based edit canvas (overlay + pane placement)

## Goal

One coherent **canvas grid** and **pane placement model** where:

- **App tiles are the constant** (per preset): `tileSize`, `tileGap`, insets, header, label band, etc. live in `layoutConstants` and surface as **`LayoutTokens`** via `getLayoutTokens(...)`.
- **Everything else is derived** from those values: tile pitch, content phase, pane footprint, overlay period, collision bounds—**no parallel pixel ladders** (no “medium-only” literals in the UI).
- **Background lines** use tile pitch **plus** the same **guttering** as inside a pane (`gridInsetX` / `gridInsetY`, `headerHeight`, `tileGap` rhythm), with correct **phase** (not a naive repeat from `(0,0)`).
- **Panes snap** to that lattice so outer edges and inner tile columns/rows match the overlay.

---

## How settings and viewport fit in (this must stay true)

This is already how the app is wired; the tile-grid work **must preserve and lean on it**:

1. **User setting:** `config.appLayout.size` → `small` | `medium` | `large` (Settings).
2. **Effective preset on screen:** `getEffectiveTileSizeForCanvasWidth(containerContentWidth, config.appLayout.size)` — e.g. narrow canvas can **downsize** to `small` while the saved setting stays `medium`.
3. **Single math input:** `tokens = getLayoutTokens(effectiveTileSize)`.

**Rule:** Overlay, pane origin, drag snap, collision, reflow, extent, and `getPaneMetrics` must all use the **same** `tokens` (or the same `effectiveTileSize` resolved the same way as `DashboardGrid`). When the user changes tile size in settings **or** the window crosses the narrow threshold, **every** derived step (`tileStepX/Y`, phases, footprints) **recomputes**—the grid **upscales or downscales** with the preset because it is **defined by `tokens`**, not by fixed pixel constants in components.

**API / tests:** Any function that takes `TileSizePreset` or `tokens` today should keep doing so; new helpers like `getDashboardCanvasGridSpec(tokens)` take **`LayoutTokens`**, not a loose preset, so call sites pass the **same** object `DashboardGrid` already builds.

---

## Why multiples of 8

`layoutConstants` use an **8px rhythm** (e.g. `TILE_GAP_PX`, `PANE_GAP_PX`, `GRID_INSET_*`, tile sizes 48/56/64) so **derived** lengths (pitches, phases, footprints) stay **integer** and stay aligned across panes and the overlay. The plan does **not** replace that with floats or per-component magic numbers—**derive** from constants only.

---

## Concepts (all from `LayoutTokens`)

| Quantity | Meaning | From tokens |
|----------|---------|-------------|
| **Tile column pitch** | Icon column + horizontal gutter | `getAppColPitch` = `tileSize + tileGap` |
| **Tile row pitch** | App row + vertical gutter | `getAppRowPitch` = `appCellHeight + tileGap` |
| **Content phase X** | Global X where column 0 of the *app matrix* starts if pane top-left is `(0,0)` | `gridInsetX` |
| **Content phase Y** | Global Y where row 0 of the *app matrix* starts | `headerHeight + gridInsetY` |
| **Inter-pane gutter** | Space between pane footprints | `paneGap` |

**Overlay:** repeat period = `tileStepX` / `tileStepY` from tokens; **`background-position`** (or equivalent) encodes **content phase** so lines match tile gutters inside a reference pane at the origin.

**Placement:** pane top-left `(paneLeft, paneTop)` such that content origin `(paneLeft + gridInsetX, paneTop + headerHeight + gridInsetY)` lies on the global tile lattice (see modulo rules below). **Adjacent panes:** `prevLeft + footprintWidth + paneGap` (snapped to lattice if needed).

**Modulo (lattice alignment):**

- `paneLeft ≡ 0 (mod tileColumnPitch)` ⇒ first column phase matches `gridInsetX`.
- `paneTop ≡ 0 (mod tileRowPitch)` ⇒ vertical phase matches `headerHeight + gridInsetY`.

---

## Tasks

### 1 — `paneMath`: canvas grid spec from `LayoutTokens`

Add `getDashboardCanvasGridSpec(tokens: LayoutTokens)` returning at least:

- `tileStepX`, `tileStepY` (from `getAppColPitch` / `getAppRowPitch`)
- `contentOriginX` = `tokens.gridInsetX`
- `contentOriginY` = `tokens.headerHeight + tokens.gridInsetY`

JSDoc: **only** contract for overlay phase + snap phases; **must** receive the same `tokens` as `DashboardGrid` (so preset/viewport changes flow through automatically).

### 2 — Edit overlay: pitch + phase + gutters

In `DashboardGrid`, drive overlay from **`getDashboardCanvasGridSpec(tokens)`** (not ad-hoc locals). Set repeat periods and **`background-position`** so lines align with in-pane tile gutters; verify at **small** and **large** presets (settings + narrow viewport → `small`).

### 3 — Replace macro placement steps with tile-based snap

Evolve `getPaneOrigin` (or add `getPaneOriginForTileGrid`) so indices map to pixel positions on the **tile** lattice (task 6 for stored indices). Use **only** values from `tokens` / `getDashboardCanvasGridSpec`.

### 4 — Footprint on the lattice

`getPaneMetrics` (or successor): footprint and natural sizes **derived** from `appColumns`/`appRows` + tokens; outer box **lattice-consistent** (snap rules as needed). No literals outside `layoutConstants` / `paneMath`.

### 5 — Drag, collision, reflow, extent (same `effectiveTileSize`)

Update consumers that still assume macro `stepX`/`stepY` for **placement**. Every path uses **`getLayoutTokens(effectiveTileSize)`** matching `DashboardGrid` (including `getEffectiveTileSizeForCanvasWidth` when canvas width is known).

- `getPaneDragPreview`, `isValidPanePlacement` / `collision.ts`, reflow/extent helpers, `fixDashboardLayout` as needed.
- **Tests:** cover at least two presets (e.g. `small` + `medium`) so regressions in “grid scales with settings” are caught.

### 6 — Data migration / compatibility

Stored `pane.position` today is macro-based. Define migration or versioned mapping so layouts survive; after migration, indices should mean **tile-grid** cells (or document pixel model—prefer one formula from tokens).

### 7 — QA / acceptance

- Change **tile size in Settings**: overlay and panes **scale** consistently; no orphaned hardcoded spacing.
- **Narrow window** (`getEffectiveTileSizeForCanvasWidth` → `small`): same invariants as wide + `medium`.
- Edit overlay aligns with **PaneCard** inner grid at all presets.
- `paneGap` and insets match **constants** visually.

### 8 — Remove dead macro placement

After tile placement ships: deprecate/remove **`getPanePlacementSteps`** for dashboard use and **`PANE_CELL_WIDTH`/`HEIGHT`** for placement if nothing else needs them—or redefine them **purely** as derivatives of tile math if still useful.

---

## Out of scope (unless pulled in)

- **Per-pane** tile size (still one global preset + effective preset per dashboard).
- View-mode flex reflow coordinate system (may still consume `tokens`; not the same as edit canvas lattice).

## Done so far (partial)

- Edit overlay **repeat period** uses tile pitch from tokens; **phase alignment** and **tile-based pane snap** are **not** done; placement is still macro `stepX`/`stepY`. Completing tasks **1–6** finishes the intended model end-to-end, including **settings-driven rescaling** via `tokens`.
