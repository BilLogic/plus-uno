# Setup Guide

## Installation

Install the design system package and peer dependencies:

```bash
npm install @tutors.plus/design-system react-bootstrap
```

## Required Dependencies (CDN)

Add these to your `index.html` `<head>`:

```html
<!-- Fonts via Google Fonts CDN -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700&family=Merriweather+Sans:wght@300;400;700&family=Open+Sans:wght@400;600&family=Source+Code+Pro:wght@300&display=swap" rel="stylesheet">

<!-- Bootstrap CSS -->
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">

<!-- Font Awesome Icons -->
<link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css" rel="stylesheet">
```

## React Imports

```jsx
// Import design system styles and components
import '@tutors.plus/design-system/styles';
import { Button, Alert, Badge, Accordion } from '@tutors.plus/design-system';
```

## Font Families

| Usage | Font Family | Weights |
|-------|-------------|---------|
| Headlines (H1-H6) | Lato | 300, 400, 700 |
| Body Text (B1-B3) | Merriweather Sans | 300, 400, 700 |
| UI Text | Open Sans | 400, 600 |
| Code Blocks | Source Code Pro | 300 |

## Critical Rules

1. **Load CDN resources first** - Fonts and Bootstrap must load before design system CSS
2. **Design system CSS last** - It overrides Bootstrap defaults
3. **Use named imports** - Import components by name from the package

## Minimal Example

```jsx
import React from 'react';
import '@tutors.plus/design-system/styles';
import { Button, Alert } from '@tutors.plus/design-system';

function App() {
  return (
    <div style={{ padding: 'var(--size-section-pad-x-lg)' }}>
      <Alert style="info" title="Welcome">
        This is a PLUS Design System application.
      </Alert>
      <Button style="primary">Get Started</Button>
    </div>
  );
}

export default App;
```
