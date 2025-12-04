# Pattern: Sections

**Context**: Large layout blocks for organizing page content.
**Layer**: 3 (Layout)

## 1. Design Pattern (Intent)
**Vocabulary**:
*   **Section**: A major vertical division of a page.
*   **Jumbotron**: A large hero area for key messaging.
*   **List Group**: A vertical list of items.
*   **Carousel**: A rotating slideshow of content.
*   **Collapse**: A toggleable visibility container.

**Usage Rules**:
*   **Section**: Use to separate distinct topics (e.g., "Features", "Pricing").
*   **Jumbotron**: Use at the top of a landing page.
*   **List Group**: Use for navigation menus or simple data lists.

## 2. Component API (Implementation)

### Layout Blocks
```javascript
// Section
PlusInterface.createSection({
    title: "Section Title",
    content: "HTML or Components",
    background: "light" // light, dark, white
});

// Jumbotron
PlusInterface.createJumbotron({
    title: "Welcome",
    lead: "This is a hero unit.",
    action: { text: "Learn More", onClick: () => {} }
});
```

### Content Groups
```javascript
// ListGroup
PlusInterface.createListGroup({
    items: ["Item 1", "Item 2", "Item 3"],
    active: 0 // index of active item
});

// Carousel
PlusInterface.createCarousel({
    slides: [
        { src: "img1.jpg", caption: "Slide 1" },
        { src: "img2.jpg", caption: "Slide 2" }
    ]
});

// Collapse
PlusInterface.createCollapse({
    trigger: "Toggle Me",
    content: "Hidden content..."
});
```

## 2. Design Tokens (Sections Layer)

### Spacing (Padding)
| Token | Value | Usage |
| :--- | :--- | :--- |
| `var(--size-section-pad-sm)` | 16px | Compact sections |
| `var(--size-section-pad-md)` | 24px | Standard sections (Default) |
| `var(--size-section-pad-lg)` | 36px | Hero sections / Spacious |

### Gaps (Between Children)
| Token | Value | Usage |
| :--- | :--- | :--- |
| `var(--size-section-gap-sm)` | 8px | Dense layout |
| `var(--size-section-gap-md)` | 16px | Standard layout |
| `var(--size-section-gap-lg)` | 24px | Spacious layout |

### Radius
| Token | Value | Usage |
| :--- | :--- | :--- |
| `var(--size-section-radius-sm)` | 8px | Compact sections |
| `var(--size-section-radius-md)` | 8px | Standard sections |
| `var(--size-section-radius-lg)` | 16px | Hero sections |
