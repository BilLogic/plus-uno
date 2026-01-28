---
name: prototyping
description: Creates quick visual prototypes for exploration and testing. Use when the user asks to "prototype", "mock up", "demo", "try this out", or wants a quick visual without production polish. Works with lo-fi sketches, wireframes, or verbal descriptions.
---

# Prototyping

Rapid visual exploration before production.

## Input Types

| Fidelity | Examples | MCP? |
|----------|----------|------|
| Lo-fi | Hand sketches, screenshots, verbal descriptions | No |
| Mid-fi | Wireframes, rough Figma frames | No |

For hi-fi Figma designs, use the [building](../building/SKILL.md) skill instead.

## Protocol

1. Confirm what you're prototyping
2. Use existing components from `packages/plus-ds/src/`
3. Create in `playground/prototyping/[designer-name]/`
4. Focus on visual fidelity, not production-ready code
5. Document assumptions

## Directory Structure

```
playground/prototyping/
├── bill/
│   ├── login-page/
│   │   └── index.html
│   └── signup-page/
│       └── index.html
└── [designer-name]/
    └── [prototype-name]/
        └── index.html
```

## Template

Use this HTML template for prototypes:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>[Prototype Name]</title>
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Merriweather+Sans:wght@300;400;700&display=swap" rel="stylesheet">
  
  <!-- Bootstrap 5.3 -->
  <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
  
  <!-- Font Awesome -->
  <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet">
  
  <!-- PLUS Styles -->
  <link href="/dist/css/main.css" rel="stylesheet">
</head>
<body>
  <!-- Prototype content here -->
  
  <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>
```

## Coding Guidelines

- Use PLUS token CSS variables (not hardcoded values)
- Prefer existing components over custom HTML
- It's OK to use placeholder images (`https://placehold.co/600x400`)
- Comment assumptions in the code

## References

- [Context Levels](../foundations/context-levels.md)
- [Tokens](../foundations/tokens.md)
