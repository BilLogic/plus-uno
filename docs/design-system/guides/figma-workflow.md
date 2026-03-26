# Guide: Figma Workflow

**Context**: Syncing design tokens and components from Figma.
**Layer**: Guide (Deep Dive)

## 1. Accessing Figma Files

### Common Locations
*   **PLUS - Universal**: Team Universal's design system.
*   **PLUS - Toolkit**: Toolkit components.

### Using Figma MCP (required when user provides a Figma link)

**When the user provides a Figma link**, follow the full implement-design workflow. See `.agent/references/figma-mcp-guide.md` for the complete 7-step workflow and all available MCP tools.

Quick reference (minimum required steps):
1.  **Get design context**: Extract component designs and specifications for the selected node/frame.
2.  **Get screenshot**: Capture the design so layout and visuals can be matched.
3.  **Get metadata** (as needed): Understand component structure and file organization.
4.  **Download assets**: Retrieve images/icons/SVGs from the MCP assets endpoint.
5.  **Translate to PLUS conventions**: Map to PLUS tokens and components (see `.agent/references/figma-token-mapping.md`).
6.  **Validate**: Compare implementation against the captured screenshot.

If Figma MCP is unavailable, say so and ask for a screenshot or export.

## 2. Extraction Process

### Design Tokens
Extract the following from Figma:
*   **Colors**: Primary, secondary, neutral, and SMART competency colors.
*   **Typography**: Font families, sizes, weights, and line heights.
*   **Spacing**: Within/between component spacing.
*   **Sizes**: Border radius, border widths.

### Component Specifications
*   **Variants**: Filled, outline, text, sizes.
*   **States**: Hover, active, focus, disabled.
*   **Structure**: Layout, spacing, typography.

## 3. Automatic Token Syncing

The design system supports automatic syncing of tokens from Figma via GitHub Actions.

### Setup
1.  **Figma API Token**: Get from Figma settings.
2.  **File Key**: Get from Figma file URL.
3.  **GitHub Secrets**: Add `FIGMA_FILE_KEY` and `FIGMA_ACCESS_TOKEN`.

### How It Works
1.  **Daily Sync**: GitHub Actions runs daily.
2.  **Manual Sync**: Run `npm run sync:tokens`.
3.  **Generation**: SCSS files are generated in `design-system/src/tokens/`.

### Manual Sync (Fallback)
1.  Export JSON tokens from Figma to `new tokens/`.
2.  Run `npm run generate:tokens`.

## 4. Mapping Figma to Code

| Figma | CSS Token |
| :--- | :--- |
| `Primary/500` | `var(--color-primary)` |
| `Display 1` | `var(--font-size-display1)` |
| `Spacing/16` | `var(--size-spacing-between-components-3)` |
