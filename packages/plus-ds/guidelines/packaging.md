# NPM Packaging Guidelines

This document outlines the process for building, versioning, and publishing the `@tutors.plus/design-system` package.

## Prerequisites
- Node.js (v18+)
- NPM authenticated with access to the `@tutors.plus` scope.

## Build Process
The package uses **Vite** for bundling.

1. **Clean & Build**:
   ```bash
   npm run build
   ```
   This command:
   - Compiles React components to ES Modules (`dist/index.esm.js`) and CommonJS (`dist/index.js`).
   - Generates TypeScript definitions (`dist/index.d.ts`).
   - Extracts and bundles CSS (`dist/design-system.css`).

2. **Verify Build**:
   Check the `dist/` directory to ensure all artifacts are present.

## Versioning
We use [calver](https://calver.org/) or experimental semantic versioning rules for pilot releases.

1. **Update Version**:
   Manually update the `version` field in `package.json`.
   ```json
   "version": "0.1.0-pilot.21"
   ```

2. **Commit Changes**:
   ```bash
   git add package.json
   git commit -m "chore: bump version to 0.1.0-pilot.21"
   ```

## Publishing
1. **Pre-Publish Check**:
   Ensure all tests pass and the build succeeds.
   ```bash
   npm run test
   npm run build
   ```

2. **Publish to NPM**:
   ```bash
   npm publish
   ```
   *Note: Ensure you are logged in via `npm login`.*

## Package Structure
- `src/`: Source code.
  - `components/`: Core UI components.
  - `forms/`: Form-specific components.
  - `DataViz/`: Charts and graphs.
  - `styles/`: Global styles and SCSS.
- `dist/`: Compiled output (ignored in git).
