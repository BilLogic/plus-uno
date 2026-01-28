# PLUS Context Levels

Components are organized in hierarchical context levels. Load the relevant level based on what you're working on.

## Level 1: Elements (Atomic)

Fundamental building blocks. Smallest reusable units.

| Component | Purpose |
|-----------|---------|
| `Button` | Action triggers |
| `Badge` | Status indicators, counts |
| `Input` | Text entry |
| `Checkbox` | Boolean selection |
| `Radio` | Single selection from group |
| `Select` | Dropdown selection |
| `Switch` | Toggle on/off |
| `Range` | Slider input |
| `Rating` | Star ratings |

**Location**: `new-ds/forms/`, `new-ds/components/`

---

## Level 2: Cards (Grouped Content)

Containers for related content.

| Pattern | Purpose |
|---------|---------|
| ProfileCard | User information display |
| DataCard | Metric or data display |
| ActionCard | Card with action buttons |
| MediaCard | Card with image/video |

**Location**: `packages/plus-ds/src/specs/*/Cards/`

---

## Level 3: Sections (Layout Regions)

Major regions within a page.

| Pattern | Purpose |
|---------|---------|
| HeroSection | Page header with title/CTA |
| ListSection | Scrollable list of items |
| StatsSection | Dashboard metrics |
| FormSection | Grouped form fields |

**Location**: `packages/plus-ds/src/specs/*/Sections/`

---

## Level 4: Tables (Tabular Data)

Data grids with sorting, pagination, filtering.

| Pattern | Purpose |
|---------|---------|
| DataTable | Standard data grid |
| Pagination | Page navigation |
| TableFilters | Column filtering |

**Location**: `packages/plus-ds/src/specs/*/Tables/`

---

## Level 5: Modals (Overlays)

Floating overlays for focused interactions.

| Pattern | Purpose |
|---------|---------|
| Modal | Dialog windows |
| Toast | Brief notifications |
| Popover | Contextual info bubbles |
| Tooltip | Hover hints |

**Location**: `new-ds/components/`, `packages/plus-ds/src/specs/*/Modals/`

---

## Level 6: Pages (Full Compositions)

Complete page templates.

| Pattern | Purpose |
|---------|---------|
| LoginPage | Authentication |
| DashboardPage | Overview/home |
| ProfilePage | User profile |
| SettingsPage | Configuration |

**Location**: `packages/plus-ds/src/specs/*/Pages/`
