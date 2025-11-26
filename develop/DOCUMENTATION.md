# PLUS Design System - Documentation Index

## Overview

This document serves as a navigation guide for all documentation in the PLUS Design System repository. Each documentation file has a specific purpose and can be loaded independently for dynamic context loading.

## Documentation Map

### Quick Start & Overview
- **[`README.md`](../README.md)** - Project overview, quick start guide, and links to detailed documentation
- **[`develop/overview.md`](overview.md)** - Development documentation overview

### Project Structure
- **[`develop/PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md)** - **Single source of truth** for complete project structure, directory organization, and file locations

### Coding Standards & Best Practices
- **[`develop/standards.md`](standards.md)** - **Single source of truth** for coding standards, setup guides, best practices, design patterns, and anti-patterns
- **[`.cursorrules`](../.cursorrules)** - Critical rules for Cursor AI agent (must-follow rules, quick reference to key files)

### Import Paths & Technical References
- **[`develop/imports.md`](imports.md)** - **Single source of truth** for component import path reference (all relative paths from different locations)
- **[`develop/FIGMA_DESIGN_SYSTEM.md`](FIGMA_DESIGN_SYSTEM.md)** - Figma integration guide and workflow
- **[`develop/FIGMA_TOKEN_MAPPING.md`](FIGMA_TOKEN_MAPPING.md)** - Figma to PLUS token mapping reference

### Design Tokens
- **[`design-system/styles/overview.md`](../design-system/styles/overview.md)** - Design token system overview and navigation
- **[`design-system/styles/colors.md`](../design-system/styles/colors.md)** - **Single source of truth** for color tokens (accent, neutral, state layers, SMART colors)
- **[`design-system/styles/layout.md`](../design-system/styles/layout.md)** - **Single source of truth** for layout and spacing tokens
- **[`design-system/styles/typography.md`](../design-system/styles/typography.md)** - **Single source of truth** for typography tokens
- **[`design-system/styles/icons.md`](../design-system/styles/icons.md)** - **Single source of truth** for icon tokens (Font Awesome sizing)
- **[`design-system/styles/elevation.md`](../design-system/styles/elevation.md)** - **Single source of truth** for elevation tokens (box-shadow values)

**Token SCSS Source Files:**
- **[`develop/tokens/`](tokens/)** - Token SCSS source files (infrastructure, not for direct reference)

### Components
- **[`design-system/components/overview.md`](../design-system/components/overview.md)** - **Single source of truth** for component API documentation, terminology, and types
- **[`design-system/README.md`](../design-system/README.md)** - Design system directory overview and usage

### Assets
- **[`design-system/assets/images/README.md`](../design-system/assets/images/README.md)** - Asset image organization and usage guidelines

## When to Read Which File

### For New Users / Getting Started
1. Start with **[`README.md`](../README.md)** for project overview
2. Read **[`develop/PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md)** to understand organization
3. Review **[`.cursorrules`](../.cursorrules)** for critical rules
4. Reference **[`develop/standards.md`](standards.md)** for coding standards

### For Component Development
1. **[`design-system/components/overview.md`](../design-system/components/overview.md)** - Component types and APIs
2. **[`develop/standards.md`](standards.md)** - Coding patterns and examples
3. **[`develop/imports.md`](imports.md)** - Import path reference
4. **[`design-system/styles/`](../design-system/styles/)** - Token reference for styling

### For Design Token Usage
1. **[`design-system/styles/overview.md`](../design-system/styles/overview.md)** - Token system overview
2. **[`design-system/styles/colors.md`](../design-system/styles/colors.md)** - Color tokens
3. **[`design-system/styles/layout.md`](../design-system/styles/layout.md)** - Spacing tokens
4. **[`design-system/styles/typography.md`](../design-system/styles/typography.md)** - Typography tokens
5. **[`design-system/styles/icons.md`](../design-system/styles/icons.md)** - Icon tokens
6. **[`design-system/styles/elevation.md`](../design-system/styles/elevation.md)** - Elevation tokens

### For Figma Integration
1. **[`develop/FIGMA_DESIGN_SYSTEM.md`](FIGMA_DESIGN_SYSTEM.md)** - Figma workflow and integration
2. **[`develop/FIGMA_TOKEN_MAPPING.md`](FIGMA_TOKEN_MAPPING.md)** - Token mapping reference
3. **[`.cursorrules`](../.cursorrules)** - Figma implementation priority rules

### For Prototyping
1. **[`README.md`](../README.md)** - Prototyping workflow
2. **[`develop/PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md)** - Prototyping directory structure
3. **[`develop/imports.md`](imports.md)** - Import paths for prototypes
4. **[`design-system/components/overview.md`](../design-system/components/overview.md)** - Component APIs

## Documentation Principles

### Single Source of Truth
Each topic has one primary documentation file:
- **Project Structure**: `develop/PROJECT_STRUCTURE.md`
- **Coding Standards**: `develop/standards.md`
- **Import Paths**: `develop/imports.md`
- **Component APIs**: `design-system/components/overview.md`
- **Token Reference**: `design-system/styles/*.md` (one file per token type)

### Cross-References
- Documentation files cross-reference each other using relative paths
- Avoid duplication - reference instead of copying content
- Use clear link text that describes what the linked file contains

### Progressive Disclosure
- Overview files provide high-level navigation
- Detailed files provide comprehensive information
- Examples and patterns are in standards.md and component docs

### Dynamic Context Loading
- Each documentation file can be loaded independently
- Files are structured to be useful without reading other files first
- Cross-references provide navigation paths when needed

## File Organization

### Root Level
- `README.md` - Project overview and quick start

### develop/ (Technical Documentation)
- `overview.md` - Development docs overview
- `PROJECT_STRUCTURE.md` - Complete project structure (single source of truth)
- `standards.md` - Coding standards and best practices (single source of truth)
- `imports.md` - Import path reference (single source of truth)
- `FIGMA_DESIGN_SYSTEM.md` - Figma integration guide
- `FIGMA_TOKEN_MAPPING.md` - Figma token mapping
- `DOCUMENTATION.md` - This file (documentation index)

### design-system/styles/ (Token Documentation)
- `overview.md` - Token system overview
- `colors.md` - Color tokens (single source of truth)
- `layout.md` - Layout/spacing tokens (single source of truth)
- `typography.md` - Typography tokens (single source of truth)
- `icons.md` - Icon tokens (single source of truth)
- `elevation.md` - Elevation tokens (single source of truth)

### design-system/components/ (Component Documentation)
- `overview.md` - Component APIs and terminology (single source of truth)

### design-system/ (Design System Overview)
- `README.md` - Design system directory overview

## Best Practices for Documentation Updates

1. **Update the single source of truth** - Don't duplicate information
2. **Update cross-references** - If you move or rename a file, update all references
3. **Keep overview files current** - Overview files should reflect current structure
4. **Use clear file names** - File names should indicate purpose
5. **Maintain this index** - Update this file when adding new documentation

## See Also

- **[`README.md`](../README.md)** - Project overview and quick start
- **[`develop/PROJECT_STRUCTURE.md`](PROJECT_STRUCTURE.md)** - Complete project structure
- **[`develop/standards.md`](standards.md)** - Coding standards and best practices

