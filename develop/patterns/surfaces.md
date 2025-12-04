# Pattern: Surfaces & Containers

**Context**: Full screen layouts, Sidebars, Topbars.
**Layer**: 5 (Surfaces) & 6 (Surface Containers)

## 1. Component APIs

### `createSidebar(config)`
Vertical navigation drawer.
*   `items`: Array of navigation items.
*   `activeItem`: Currently selected item.

### `createTopBar(config)`
Horizontal application header.
*   `title`: Application title.
*   `actions`: Right-aligned action buttons.

### `createNavbar(config)`
Responsive navigation header.
*   `brand`: Brand logo/text.
*   `links`: Navigation links.

### `createScrollspy(config)`
Navigation that updates based on scroll position.
*   `target`: Element to spy on.
*   `nav`: Navigation element to update.

### Navigation
```javascript
// Navbar
PlusInterface.createNavbar({
    brand: "PLUS",
    links: [{ text: "Home", href: "/" }]
});

// Sidebar
PlusInterface.createSidebar({
    items: [
        { text: "Dashboard", icon: "fas fa-home", active: true },
        { text: "Settings", icon: "fas fa-cog" }
    ]
});

// TopBar
PlusInterface.createTopBar({
    title: "Page Title",
    actions: [{ icon: "fas fa-bell", onClick: () => {} }]
});
```

### Utilities
```javascript
// Scrollspy
PlusInterface.createScrollspy({
    target: "#content-id",
    items: [{ id: "section1", text: "Section 1" }]
});
```

## 2. Design Tokens

### Surfaces (Layer 5)
*Full screen / Organism layouts*

| Token | Value | Usage |
| :--- | :--- | :--- |
| `var(--size-surface-pad-x)` | 32px | Page horizontal padding |
| `var(--size-surface-pad-y)` | 24px | Page vertical padding |
| `var(--size-surface-radius)` | 16px | Page-level containers |

### Surface Containers (Layer 6)
*Top-level frames (Sidebar, Topbar)*

| Token | Value | Usage |
| :--- | :--- | :--- |
| `var(--size-surface-container-pad-x-md)` | 24px | Container padding |
| **No Radius** | 0px | Surface containers do NOT use radius |
