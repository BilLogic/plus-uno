# Component Library Reference

This file is a fast lookup for where components live and how to discover usage.

## Primary Source Locations

- Core components: `packages/plus-ds/src/components`
- Form components: `packages/plus-ds/src/forms`
- Data visualization: `packages/plus-ds/src/DataViz`
- Higher-level specs/compositions: `packages/plus-ds/src/specs`

## Authoritative Exports

- Package entry: `packages/plus-ds/src/index.js`
- Components export barrel: `packages/plus-ds/src/components/index.js`
- Forms export barrel: `packages/plus-ds/src/forms/index.js`

## How to Find the Right Component

1. Start in guidelines:
- `packages/plus-ds/guidelines/overview-components.md`
- `packages/plus-ds/guidelines/reference/component-index.md`

2. Verify props and behavior in source:
- `{Component}/{Component}.jsx`
- `{Component}/{Component}.scss`
- `{Component}/{Component}.stories.jsx`

3. Check composition usage:
- `packages/plus-ds/src/specs/**`

## Representative Component Families

Common interactive components:
- Button, ButtonGroup, Alert, Badge, Modal, Table, Tooltip, Toast, Dropdown, NavTabs, NavPills, Pagination

Common form controls:
- Input, Textarea, Select, Checkbox, Radio, Switch, DatePicker, NumberInput, FileUpload

Common composition patterns:
- Login and Toolkit specs in `packages/plus-ds/src/specs/Login` and `packages/plus-ds/src/specs/Toolkit`

## Storybook Discovery Paths

Story globs are configured in `.storybook/main.js`:
- `../packages/plus-ds/src/**/*.stories.{js,jsx,ts,tsx}`
- `../playground/prototyping/**/*.stories.{js,jsx,ts,tsx}`

Use Storybook first to inspect available variants and controls.
