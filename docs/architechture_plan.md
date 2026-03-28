# Pane — Recommended Project Architecture

## Repository Structure

```text
pane/
├── frontend/
│   ├── public/
│   │   └── icons/
│   ├── src/
│   │   ├── app/
│   │   │   ├── App.tsx
│   │   │   ├── routes.tsx
│   │   │   └── providers/
│   │   │       ├── QueryProvider.tsx
│   │   │       ├── ThemeProvider.tsx
│   │   │       └── SettingsProvider.tsx
│   │   ├── components/
│   │   │   ├── dashboard/
│   │   │   │   ├── Dashboard.tsx
│   │   │   │   ├── DashboardGrid.tsx
│   │   │   │   ├── PaneCard.tsx
│   │   │   │   ├── PaneHeader.tsx
│   │   │   │   ├── PaneContent.tsx
│   │   │   │   ├── AppTile.tsx
│   │   │   │   ├── AppTileLabel.tsx
│   │   │   │   ├── PaneResizeHandles.tsx
│   │   │   │   ├── EditOverlay.tsx
│   │   │   │   ├── DropIndicator.tsx
│   │   │   │   └── EmptyPositionHints.tsx
│   │   │   ├── settings/
│   │   │   │   ├── SettingsPage.tsx
│   │   │   │   ├── SettingsTabs.tsx
│   │   │   │   ├── GeneralTab.tsx
│   │   │   │   ├── LayoutTab.tsx
│   │   │   │   ├── AppearanceTab.tsx
│   │   │   │   ├── BackgroundTab.tsx
│   │   │   │   └── AboutTab.tsx
│   │   │   ├── forms/
│   │   │   │   ├── PaneForm.tsx
│   │   │   │   ├── AppForm.tsx
│   │   │   │   └── IconPicker.tsx
│   │   │   └── ui/
│   │   │       ├── Button.tsx
│   │   │       ├── Dialog.tsx
│   │   │       ├── Input.tsx
│   │   │       ├── Tabs.tsx
│   │   │       ├── Slider.tsx
│   │   │       └── Badge.tsx
│   │   ├── features/
│   │   │   ├── config/
│   │   │   │   ├── api.ts
│   │   │   │   ├── hooks.ts
│   │   │   │   ├── selectors.ts
│   │   │   │   └── types.ts
│   │   │   ├── panes/
│   │   │   │   ├── api.ts
│   │   │   │   ├── hooks.ts
│   │   │   │   ├── paneMath.ts
│   │   │   │   ├── paneSelectors.ts
│   │   │   │   └── paneValidation.ts
│   │   │   ├── apps/
│   │   │   │   ├── api.ts
│   │   │   │   ├── hooks.ts
│   │   │   │   ├── appMath.ts
│   │   │   │   ├── appSelectors.ts
│   │   │   │   └── appValidation.ts
│   │   │   ├── interaction/
│   │   │   │   ├── interactionStore.ts
│   │   │   │   ├── dragTypes.ts
│   │   │   │   ├── pointerSession.ts
│   │   │   │   ├── paneDrag.ts
│   │   │   │   ├── paneResize.ts
│   │   │   │   ├── appDrag.ts
│   │   │   │   ├── collision.ts
│   │   │   │   └── dropTargets.ts
│   │   │   ├── layout/
│   │   │   │   ├── tokens.ts
│   │   │   │   ├── presets.ts
│   │   │   │   ├── geometry.ts
│   │   │   │   ├── gridSpan.ts
│   │   │   │   ├── coordinates.ts
│   │   │   │   └── bounds.ts
│   │   │   └── appearance/
│   │   │       ├── themeTokens.ts
│   │   │       ├── themeClasses.ts
│   │   │       └── backgroundStyles.ts
│   │   ├── hooks/
│   │   │   ├── useDashboardConfig.ts
│   │   │   ├── useEditMode.ts
│   │   │   ├── usePointerCapture.ts
│   │   │   ├── usePaneMetrics.ts
│   │   │   └── useAppMetrics.ts
│   │   ├── lib/
│   │   │   ├── ids.ts
│   │   │   ├── format.ts
│   │   │   ├── coords.ts
│   │   │   ├── clamp.ts
│   │   │   ├── round.ts
│   │   │   └── asserts.ts
│   │   ├── styles/
│   │   │   ├── globals.css
│   │   │   ├── tokens.css
│   │   │   └── utilities.css
│   │   ├── tests/
│   │   │   ├── unit/
│   │   │   │   ├── geometry.test.ts
│   │   │   │   ├── gridSpan.test.ts
│   │   │   │   ├── paneMath.test.ts
│   │   │   │   ├── appMath.test.ts
│   │   │   │   └── collision.test.ts
│   │   │   └── integration/
│   │   │       ├── pane-drag.test.tsx
│   │   │       ├── pane-resize.test.tsx
│   │   │       ├── app-drag.test.tsx
│   │   │       └── settings.test.tsx
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
│
├── backend/
│   ├── cmd/
│   │   └── pane/
│   │       └── main.go
│   ├── internal/
│   │   ├── api/
│   │   │   ├── router.go
│   │   │   ├── middleware.go
│   │   │   ├── errors.go
│   │   │   ├── response.go
│   │   │   ├── config_handlers.go
│   │   │   ├── pane_handlers.go
│   │   │   ├── app_handlers.go
│   │   │   └── icon_handlers.go
│   │   ├── config/
│   │   │   ├── schema.go
│   │   │   ├── defaults.go
│   │   │   ├── validate.go
│   │   │   ├── normalise.go
│   │   │   ├── migrate.go
│   │   │   ├── parse_coords.go
│   │   │   └── version.go
│   │   ├── store/
│   │   │   ├── file_store.go
│   │   │   ├── atomic_write.go
│   │   │   └── locks.go
│   │   ├── service/
│   │   │   ├── config_service.go
│   │   │   ├── pane_service.go
│   │   │   ├── app_service.go
│   │   │   └── icon_service.go
│   │   ├── icons/
│   │   │   ├── index.go
│   │   │   ├── search.go
│   │   │   └── metadata.json
│   │   ├── model/
│   │   │   ├── config.go
│   │   │   ├── pane.go
│   │   │   ├── app.go
│   │   │   └── enums.go
│   │   └── util/
│   │       ├── ids.go
│   │       ├── slug.go
│   │       ├── url.go
│   │       └── log.go
│   ├── test/
│   │   ├── fixtures/
│   │   │   ├── valid/
│   │   │   └── invalid/
│   │   ├── config_validation_test.go
│   │   ├── pane_handlers_test.go
│   │   ├── app_handlers_test.go
│   │   └── atomic_write_test.go
│   ├── go.mod
│   └── go.sum
│
├── deploy/
│   ├── Dockerfile
│   ├── docker-compose.example.yml
│   └── nginx-not-required.md
│
├── docs/
│   ├── architecture.md
│   ├── config-schema.md
│   ├── api.md
│   ├── deployment.md
│   ├── theming.md
│   └── interaction-model.md
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       └── release.yml
│
├── examples/
│   └── config.yaml
├── .gitignore
├── README.md
└── Makefile
```

---

# Frontend Responsibilities by Area

## `features/layout`

Owns all render math. This folder should answer:

* How wide is a pane?
* How tall is a pane?
* How many outer grid cells does it span?
* Where does app `(col,row)` render?

Keep this pure and testable.

## `features/interaction`

Owns all temporary drag state:

* currently dragged pane/app
* hover target
* preview span
* pointer start and delta
* active resize edge/corner

This state must never become the persistence source of truth.

## `features/panes` and `features/apps`

Own CRUD logic, selectors, and validations that are specific to those entities.

## `components/dashboard`

Own visual rendering only:

* pane card
* header
* app tile
* overlays
* handles

These components should not own layout math beyond reading calculated values.

---

# Backend Responsibilities by Area

## `internal/model`

Canonical domain objects only.

## `internal/config`

Everything about parsing, validating, normalising, versioning, and coordinate handling.

## `internal/store`

Filesystem persistence only.
No business logic here beyond safe load/save.

## `internal/service`

Business logic for:

* creating panes
* moving panes
* resizing panes
* moving apps
* swapping apps
* deleting entities

## `internal/api`

Thin HTTP layer that calls services and returns structured errors.

---

# Recommended Data Flow

## Read Path

1. Frontend loads `/api/config`
2. Backend reads YAML
3. Backend validates + normalises
4. Frontend stores config in query/store
5. Layout math derives render values

## Write Path

1. User performs interaction
2. Frontend computes final logical values
3. Frontend sends minimal update payload
4. Backend validates requested change
5. Backend writes full YAML atomically
6. Frontend refreshes or updates cache

---

# Core Type Definitions

## Frontend Types

```ts
export type TileSizePreset = 'small' | 'medium' | 'large';
export type WidthMode = 'preset' | 'custom' | 'full';

export interface AppItem {
  id: string;
  name: string;
  position: string; // "col,row"
  url: string;
  icon: string;
  iconStyle?: string;
  iconColor?: string;
  openInNewTab?: boolean;
}

export interface PaneItem {
  id: string;
  label: string;
  position: string; // "x,y"
  appColumns: number;
  appRows: number;
  apps: AppItem[];
}

export interface DashboardConfig {
  version: number;
  title: string;
  layout: {
    widthMode: WidthMode;
    maxWidth?: number;
    customWidth?: number;
  };
  appLayout: {
    size: TileSizePreset;
  };
  appearance: {
    accent: string;
    background: string;
  };
  panes: PaneItem[];
}
```

---

# Layout Engine Contract

Create one source of truth function:

```ts
export interface LayoutTokens {
  paneCellSize: number;
  paneGap: number;
  tileSize: number;
  tileGap: number;
  panePaddingLeft: number;
  panePaddingRight: number;
  panePaddingTop: number;
  panePaddingBottom: number;
  headerHeight: number;
}

export interface PaneMetrics {
  paneWidth: number;
  paneHeight: number;
  contentWidth: number;
  contentHeight: number;
  gridSpanX: number;
  gridSpanY: number;
  contentLeftInset: number;
  contentTopInset: number;
}

export function getLayoutTokens(size: TileSizePreset): LayoutTokens;
export function getPaneMetrics(
  appColumns: number,
  appRows: number,
  tokens: LayoutTokens
): PaneMetrics;

export function getAppRenderPosition(
  col: number,
  row: number,
  tokens: LayoutTokens,
  paneLeft: number,
  paneTop: number
): { x: number; y: number };
```

Every renderer should consume these instead of redoing math.

---

# Drag and Resize Engine — Step-by-Step Plan

## 1. Shared Pointer Session Model

Create one pointer session structure used by pane drag, pane resize, and app drag.

```ts
export interface PointerPoint {
  x: number;
  y: number;
}

export interface PointerSession {
  pointerId: number;
  start: PointerPoint;
  current: PointerPoint;
  delta: PointerPoint;
}
```

Update this on every `pointermove`.

---

## 2. Interaction Store Shape

```ts
export type ActiveInteraction =
  | { type: 'none' }
  | {
      type: 'pane-drag';
      paneId: string;
      startGridX: number;
      startGridY: number;
      previewGridX: number;
      previewGridY: number;
      spanX: number;
      spanY: number;
    }
  | {
      type: 'pane-resize';
      paneId: string;
      edge: 'right' | 'bottom' | 'bottom-right';
      startColumns: number;
      startRows: number;
      previewColumns: number;
      previewRows: number;
    }
  | {
      type: 'app-drag';
      paneId: string;
      appId: string;
      startCol: number;
      startRow: number;
      previewCol: number;
      previewRow: number;
      collidedAppId?: string;
    };
```

This store is transient. It should be cleared on pointer end or cancel.

---

# Pane Drag Algorithm

## Goal

Move a pane from one dashboard grid position to another and persist final `x,y`.

## Start

On `pointerdown` in a pane drag zone:

* capture pointer
* parse pane position `"x,y"`
* compute current span from pane metrics
* store active interaction

## Move

On `pointermove`:

* compute pointer delta from start
* convert pixel delta into grid movement

```ts
deltaGridX = round(deltaX / (paneCellSize + paneGap))
deltaGridY = round(deltaY / (paneCellSize + paneGap))
previewGridX = clamp(minX, startGridX + deltaGridX, maxX)
previewGridY = clamp(minY, startGridY + deltaGridY, maxY)
```

Use the preview position for rendering a ghost pane or transform.

## Collision Strategy

Choose one and keep it consistent:

* recommended v1: allow overlapping preview but reject conflicting final placement unless swap/reflow logic exists
* better v1.1: find nearest free slot that fits the span

For the first implementation, keep it simple:

* if target area is occupied by another pane, show invalid state
* on drop, do not commit unless target is valid

## End

On `pointerup`:

* if target valid, persist `"previewGridX,previewGridY"`
* clear interaction

---

# Pane Resize Algorithm

## Goal

Change `appColumns` and `appRows`, not raw pixel size.

## Allowed Handles

Recommended:

* right
* bottom
* bottom-right

That keeps the maths predictable.

## Start

On handle `pointerdown`:

* store starting `appColumns`, `appRows`
* store pointer start

## Move

Translate pointer movement into column/row changes.

### Horizontal

```ts
stepX = tileSize + tileGap
columnDelta = round(deltaX / stepX)
previewColumns = max(3, startColumns + columnDelta)
```

### Vertical

```ts
stepY = tileSize + tileGap
rowDelta = round(deltaY / stepY)
previewRows = max(1, startRows + rowDelta)
```

### Combined

For bottom-right, update both.

## Preview

Recompute pane metrics using preview values and render resized shell live.

## End

Persist:

* `appColumns`
* `appRows`

If resizing would create invalid pane overlap, reject or clamp before save.

---

# App Drag Algorithm

## Goal

Move an app to a new logical `(col,row)` inside the same pane.

## Start

On app `pointerdown` in edit mode:

* capture pointer
* parse app position
* store start values

## Move

Convert pointer location to local pane content coordinates.

```ts
localX = pointerX - contentLeft
localY = pointerY - contentTop
```

Resolve nearest logical cell:

```ts
step = tileSize + tileGap
previewCol = round(localX / step)
previewRow = round(localY / step)
```

Clamp inside current pane bounds:

```ts
previewCol = clamp(0, previewCol, appColumns - 1)
previewRow = clamp(0, previewRow, appRows - 1)
```

## Collision

Look for another app already occupying preview cell.

```ts
collidedApp = apps.find(a => a.position === `${previewCol},${previewRow}` && a.id !== dragged.id)
```

If found:

* mark as swap target
* render target highlight

## End

On `pointerup`:

* if empty target: update dragged app position
* if occupied target: swap positions
* persist final app list

---

# App First-Available Position Algorithm

When creating a new app:

```ts
for row in 0..appRows-1
  for col in 0..appColumns-1
    if no app at (col,row)
      return (col,row)
```

If no position exists:

* either reject creation
* or offer to expand pane
* recommended v1: reject and show message

---

# Coordinate Parsing Helpers

Use dedicated helpers on both frontend and backend.

```ts
export function parseCoordPair(value: string): [number, number] {
  const match = /^(\d+),(\d+)$/.exec(value.trim());
  if (!match) throw new Error('Invalid coordinate format');
  return [Number(match[1]), Number(match[2])];
}

export function formatCoordPair(x: number, y: number): string {
  return `${x},${y}`;
}
```

Do not duplicate coordinate parsing logic across files.

---

# Rendering Strategy During Drag

## Pane Drag

Prefer:

* actual pane stays in place with lowered opacity
* ghost pane or transformed preview shows destination

## App Drag

Prefer:

* dragged tile follows pointer using `transform`
* destination cell gets highlighted
* swap target tile receives a clear visual state

This feels better than instantly teleporting tiles during move.

---

# Recommended Save Timing

Persist only on interaction completion:

* pane drag end
* pane resize end
* app drag end
* inline edit blur/enter
* delete confirm
* settings save

Do not save on every move event.

---

# Required Tests for Interaction Engine

## Unit

* [ ] Convert pane drag delta into grid delta correctly
* [ ] Convert resize pointer delta into row/column delta correctly
* [ ] Convert app pointer location into local `(col,row)` correctly
* [ ] Clamp app positions to pane bounds correctly
* [ ] Detect occupied app positions correctly
* [ ] Swap positions correctly

## Integration

* [ ] Drag pane to valid position and persist result
* [ ] Prevent pane drop into invalid occupied area
* [ ] Resize pane wider and persist updated `appColumns`
* [ ] Resize pane taller and persist updated `appRows`
* [ ] Drag app into empty cell and persist result
* [ ] Drag app onto occupied cell and swap successfully
* [ ] Preserve empty cells after moves

---

# Agent-Ready Build Order

## Phase A — Foundation

* [ ] Create frontend and backend project structure
* [ ] Implement shared config schema and types
* [ ] Implement layout token and metrics functions
* [ ] Implement coordinate parsing and formatting helpers

## Phase B — Static Rendering

* [ ] Render dashboard from loaded config
* [ ] Render pane shell from calculated metrics
* [ ] Render app tiles from logical coordinates
* [ ] Render settings page shell

## Phase C — Pane Interaction

* [ ] Implement pane drag interaction store
* [ ] Implement pane drag preview
* [ ] Implement pane drag validation
* [ ] Implement pane resize interaction store
* [ ] Implement pane resize preview
* [ ] Persist pane move and resize via API

## Phase D — App Interaction

* [ ] Implement app drag interaction store
* [ ] Implement local cell resolution logic
* [ ] Implement empty drop move logic
* [ ] Implement swap-on-drop logic
* [ ] Persist app moves via API

## Phase E — Visual Polish

* [ ] Add glass pane styling
* [ ] Add tile hover, drag, and delete states
* [ ] Add overlays, handles, and drop indicators
* [ ] Refine label spacing and clamp behaviour

## Phase F — Hardening

* [ ] Add unit tests for all layout and interaction maths
* [ ] Add integration tests for drag and resize flows
* [ ] Validate YAML round-trip behaviour
* [ ] Add error states for invalid drops and failed writes

---

# Final Engineering Rule

The persistent source of truth is always:

* pane `position`
* pane `appColumns`
* pane `appRows`
* app `position`

Everything else is derived at render time or exists only temporarily during interaction.