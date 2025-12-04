# Pattern: Cards

**Context**: Self-contained containers displaying information.
**Layer**: 2

**Context**: Containers for grouping related content and actions.
**Layer**: 2 (Composite)

## 1. Design Pattern (Intent)
**Vocabulary**:
*   **Card**: A flexible container with a header, body, and footer.
*   **Media Object**: A layout with an image/icon on the left and content on the right.
*   **Smart Card**: A card with built-in interactivity (e.g., hover effects, selection).

**Usage Rules**:
*   **Card**: Use for dashboards, profiles, or item details.
*   **Media Object**: Use for lists, comments, or notifications.
*   **Smart Card**: Use for clickable items in a grid.

## 2. Component API (Implementation)

### Standard Cards
```javascript
// Card
PlusInterface.createCard({
    header: "Card Title", // optional
    body: "Content goes here...",
    footer: "Action Area", // optional
    style: "default" // default, outlined, elevated
});
```

### Interactive Cards
```javascript
// SmartCard
PlusInterface.createSmartCard({
    title: "Clickable Item",
    subtitle: "Description",
    icon: "fas fa-star",
    onClick: () => {}
});
```

### Layouts
```javascript
// MediaObject
PlusInterface.createMediaObject({
    image: "path/to/img.jpg",
    title: "Media Title",
    description: "Content description...",
    alignment: "center" // top, center, bottom
});
```

## 2. Design Tokens (Cards Layer)

### Spacing (Padding)
| Token | Value | Usage |
| :--- | :--- | :--- |
| `var(--size-card-pad-sm)` | 16px | Compact cards |
| `var(--size-card-pad-md)` | 20px | Standard cards (Default) |
| `var(--size-card-pad-lg)` | 24px | Prominent cards |

### Gaps (Internal)
| Token | Value | Usage |
| :--- | :--- | :--- |
| `var(--size-card-gap-sm)` | 8px | Dense content |
| `var(--size-card-gap-md)` | 16px | Standard content |

### Radius
| Token | Value | Usage |
| :--- | :--- | :--- |
| `var(--size-card-radius-sm)` | 12px | Standard radius (Default) |
| `var(--size-card-radius-md)` | 16px | Large cards |

### Elevation
| Token | Value | Usage |
| :--- | :--- | :--- |
| `var(--elevation-light-1)` | Shadow 1 | Card at rest |
| `var(--elevation-light-2)` | Shadow 2 | Card on hover |
