# Pane — Master Developer Execution Specification

---

# 1. Product Definition

## 1.1 Overview

Pane is a lightweight, self-hosted dashboard for organising application shortcuts into visually distinct, glass-styled **panes**. Configuration is stored as YAML; the Go backend serves the API and the built React UI from a single binary. Pane enables users to:

* organise applications into panes,
* position and resize panes,
* arrange apps within panes,
* and persist configuration via YAML.


---

## 1.2 Core Principle

Pane is a:

> **capacity-based dashboard system with structured layout and deterministic positioning**

This means:

* panes are sized by how many apps they contain,
* apps are positioned using logical coordinates,
* layout is constrained and predictable,
* visual consistency is prioritised.

---

## 1.3 Non-Goals

Pane is not:

* a freeform layout builder
* a website/page builder
* a database-driven application
* an infinitely configurable grid system

---

# 2. System Architecture

Pane consists of four layers:

## 2.1 Layout Engine

Responsible for:

* all layout math
* pane dimensions
* app positions
* grid spans

---

## 2.2 Interaction Engine

Responsible for:

* drag and resize behaviour
* pointer tracking
* preview states
* collision handling

---

## 2.3 Rendering Layer

Responsible for:

* UI components
* visual states
* edit mode overlays

---

## 2.4 Persistence Layer

Responsible for:

* YAML storage
* validation
* API
* atomic writes

---

# 3. Technology Stack

## Frontend

* React
* TypeScript
* Tailwind CSS
* CSS Grid

## Backend

* Go
* YAML-based storage
* REST API

## Deployment

* Single Docker container

---

# 4. Spatial System

## 4.1 Layout Tokens

```ts
paneCellSize = 140
paneGap = 8

tileSize = 48
tileGap = 18

panePaddingLeft = 16
panePaddingRight = 16
panePaddingTop = 18
panePaddingBottom = 18

headerHeight = 36
```

---

## 4.2 Rules

* All pane grid cells are square
* All app tiles are square
* Layout is derived from tokens only
* No arbitrary pixel placement

---

# 5. Pane Layout

## 5.1 Position

```yaml
position: "x,y"
```

---

## 5.2 Size

```yaml
appColumns: number
appRows: number
```

Minimum:

* columns ≥ 3
* rows ≥ 1

---

## 5.3 Dimensions

```ts
contentWidth =
  (appColumns * tileSize) +
  ((appColumns - 1) * tileGap)

contentHeight =
  (appRows * tileSize) +
  ((appRows - 1) * tileGap)

paneWidth =
  panePaddingLeft + contentWidth + panePaddingRight

paneHeight =
  headerHeight + panePaddingTop + contentHeight + panePaddingBottom
```

---

## 5.4 Grid Span

```ts
gridSpanX = ceil(paneWidth / paneCellSize)
gridSpanY = ceil(paneHeight / paneCellSize)
```

---

# 6. Pane Structure

```
Pane
 ├── Header
 └── Content
      └── App Grid
```

---

## 6.1 Content Origin

```ts
contentLeft = paneLeft + panePaddingLeft
contentTop  = paneTop + headerHeight + panePaddingTop
```

---

# 7. App Layout

## 7.1 Position

```yaml
position: "col,row"
```

---

## 7.2 Render Position

```ts
x = contentLeft + col * (tileSize + tileGap)
y = contentTop  + row * (tileSize + tileGap)
```

---

## 7.3 Rules

* Empty positions must persist
* No auto-packing
* Placement is deterministic

---

## 7.4 Collision

* Drop on occupied cell → swap

---

# 8. Interaction Engine

All interactions are pointer-driven.

---

## 8.1 Pointer Session

```ts
PointerSession {
  start
  current
  delta
}
```

---

## 8.2 Pane Drag

### Start

* capture pointer
* store start grid position

### Move

```ts
deltaGridX = round(deltaX / (paneCellSize + paneGap))
deltaGridY = round(deltaY / (paneCellSize + paneGap))
```

### End

* persist new `(x,y)` if valid

---

## 8.3 Pane Resize

### Horizontal

```ts
columnDelta = round(deltaX / (tileSize + tileGap))
```

### Vertical

```ts
rowDelta = round(deltaY / (tileSize + tileGap))
```

### Result

* update `appColumns`, `appRows`

---

## 8.4 App Drag

### Position Calculation

```ts
col = round((pointerX - contentLeft) / (tileSize + tileGap))
row = round((pointerY - contentTop) / (tileSize + tileGap))
```

### Behaviour

* empty → move
* occupied → swap

---

# 9. Visual System

## 9.1 Style

* glass skeuomorphic
* soft shadows
* translucent panes

---

## 9.2 Pane

* rounded corners
* subtle border
* layered depth

---

## 9.3 App Tile

* square tile
* label below
* no card container

---

## 9.4 Edit Mode

* grid overlay
* drag states
* resize handles

---

# 10. Settings

## Tabs

* General
* Layout
* Appearance
* Background
* About

---

## Layout Controls

* tile size preset only

---

## Presets

```ts
small:
  paneCell = 120
  tileSize = 40

medium:
  paneCell = 140
  tileSize = 48

large:
  paneCell = 160
  tileSize = 56
```

---

# 11. YAML Schema

```yaml
version: 1

title: "Dashboard"

layout:
  widthMode: preset
  maxWidth: 1200

appLayout:
  size: medium

appearance:
  accent: blue
  background: "#0F1115"

panes:
  - id: pane-1
    label: "My Apps"
    position: "0,0"
    appColumns: 3
    appRows: 2
    apps:
      - id: drive
        name: "Google Drive"
        position: "1,0"
        url: "https://drive.google.com"
        icon: "google-drive"
```

---

# 12. Backend

## Responsibilities

* YAML read/write
* validation
* API

---

## Save Strategy

* atomic writes only

---

# 13. API

* GET /api/config
* PUT /api/config
* POST /api/panes
* PUT /api/panes/:id
* DELETE /api/panes/:id
* POST /api/panes/:id/apps
* PUT /api/panes/:paneId/apps/:appId
* DELETE /api/panes/:paneId/apps/:appId

---

# 14. Deployment

* single Docker container
* Go serves frontend + API
* config mounted

---

# 15. Testing

Must test:

* layout math
* drag logic
* resize logic
* swap logic
* persistence

---

# 16. Execution Plan (Task-Based)

## Phase 1 — Foundation

* [x] Initialise frontend (React + TypeScript + Tailwind)
* [x] Initialise backend (Go module + HTTP server)
* [x] Define YAML schema structures
* [x] Implement config parsing and validation
* [x] Implement atomic file write logic
* [x] Implement coordinate parsing utilities

---

## Phase 2 — Layout Engine

* [x] Implement layout token system
* [x] Implement pane dimension calculations
* [x] Implement grid span calculations
* [x] Implement content origin calculations
* [x] Implement app render position calculations
* [x] Write unit tests for all layout math

---

## Phase 3 — Static Rendering

* [x] Render dashboard grid
* [x] Render panes using computed metrics
* [x] Render pane header and content regions
* [x] Render app tiles from logical positions
* [x] Implement basic styling

---

## Phase 4 — Pane Interaction

* [x] Implement pointer session tracking
* [x] Implement pane drag logic
* [x] Implement pane drag preview
* [x] Implement pane drop validation
* [x] Implement pane resize logic
* [x] Implement resize preview
* [x] Persist pane changes via API

---

## Phase 5 — App Interaction

* [x] Implement app drag logic
* [x] Implement grid position resolution
* [x] Implement empty drop behaviour
* [x] Implement swap-on-drop behaviour
* [x] Persist app updates via API
* [x] Preserve empty grid positions

---

## Phase 6 — Visual System

* [x] Implement glass pane styling
* [x] Implement app tile styling
* [x] Implement hover and drag states
* [x] Implement edit mode overlays
* [x] Implement delete actions

---

## Phase 7 — Settings

* [x] Build settings UI with tabs
* [x] Implement title editing
* [x] Implement tile size presets
* [x] Implement width modes
* [x] Apply layout recalculation on changes
* [x] Implement appearance settings
* [x] Implement background settings

---

## Phase 8 — API Integration

* [x] Finalise API endpoints
* [x] Connect frontend to backend
* [x] Implement error handling
* [x] Ensure persistence on all interactions

---

## Phase 9 — Testing & Hardening

* [x] Add unit tests for layout and interaction
* [x] Add integration tests for drag and resize flows
* [x] Validate YAML round-trip integrity
* [x] Handle invalid operations safely

---

## Phase 10 — Deployment & CI/CD

* [ ] Create Dockerfile (multi-stage build)
* [ ] Create Docker Compose example
* [ ] Implement CI pipeline (build + test)
* [ ] Implement release pipeline (Docker image)
* [ ] Write deployment documentation

---

# 17. Critical Guardrails

* [ ] Never store pixel coordinates
* [ ] Never allow freeform placement
* [ ] Never auto-pack apps
* [ ] Never expose low-level layout controls
* [ ] Always preserve logical positions
* [ ] Always base pane size on capacity

---

# Final Directive

Build Pane as:

> A **structured, deterministic dashboard system with controlled layout, predictable behaviour, and high visual quality.**

Do not compromise:

* layout correctness
* interaction consistency
* persistence reliability

