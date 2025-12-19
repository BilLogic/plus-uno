# @tutors.plus/design-system

PLUS Design System package for Figma Make.

## Installation

```bash
npm install @tutors.plus/design-system react-bootstrap bootstrap @fortawesome/fontawesome-free @fontsource/lato @fontsource/merriweather-sans @fontsource/open-sans @fontsource/source-code-pro
```

## Usage

```jsx
import { Button, Alert, Badge } from '@tutors.plus/design-system';
// 1. Import Fonts
import '@fontsource/lato/300.css';
import '@fontsource/lato/400.css';
import '@fontsource/lato/700.css';
import '@fontsource/merriweather-sans/300.css';
import '@fontsource/merriweather-sans/400.css';
import '@fontsource/merriweather-sans/700.css';
import '@fontsource/open-sans/400.css';
import '@fontsource/open-sans/600.css';
import '@fontsource/source-code-pro/300.css';

// 2. Import CSS (Bootstrap, Icons, Design System)
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
import '@tutors.plus/design-system/styles';

// 3. Import Components

function App() {
  return (
    <div>
      <Button variant="primary">Click me</Button>
      <Alert variant="success">Success!</Alert>
      <Badge>New</Badge>
    </div>
  );
}
```

## Available Components

- **Accordion** - Collapsible content panels
- **Alert** - Status messages (success, warning, error, info)
- **Badge** - Status indicators and labels
- **Breadcrumb** - Navigation path indicators
- **Button** - Action triggers (primary, secondary, tonal, text)
- **ButtonGroup** - Grouped button layouts

## Design Tokens

Always use CSS variables for styling:

```css
.custom-element {
  background: var(--color-surface-container);
  color: var(--color-on-surface);
  padding: var(--size-element-pad-x-md);
}
```

## Guidelines

See the `guidelines/` folder for detailed AI instructions on using this design system with Figma Make.
