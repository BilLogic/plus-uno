# PLUS Design System - Guidelines

This folder contains the core guidelines and reference documents for the PLUS design system. Always reference these documents when generating code or designing UI components.

## Files in This Folder

### 1. `coding-standards.md`
**Project rules and coding standards**
- Code style guidelines (JavaScript, CSS/SCSS, HTML)
- Design system usage rules
- Component creation patterns
- Best practices and anti-patterns
- File structure and naming conventions

**When to reference:**
- Setting up a new component or file
- Writing JavaScript, CSS, or HTML code
- Following coding best practices
- Understanding project structure

### 2. `token-reference.md`
**Complete token reference guide**
- All available color tokens (Material Design 3)
- All spacing tokens (semantic system)
- Typography tokens
- Layout tokens (breakpoints)
- Usage guidelines and examples
- Quick reference patterns

**When to reference:**
- Selecting colors for UI elements
- Choosing spacing values (padding, margins, gaps)
- Setting border radius values
- Selecting typography styles
- Setting layout breakpoints

### 3. `terminology.md`
**UI component types and terminology**
- Definitions of Elements, Cards, Sections, Modals, Surfaces, Surface Containers
- Characteristics and examples of each component type
- Token usage for each component type
- Decision tree for determining component type
- Surface color hierarchy
- Code examples for each component type

**When to reference:**
- Designing a specific type of UI component
- Determining which tokens to use
- Understanding component hierarchy
- Selecting appropriate surface colors

## Usage Workflow

### When Designing UI Components

1. **Determine Component Type**
   - Reference `terminology.md` to identify the component type (Element, Card, Section, Modal, Surface, Surface Container)

2. **Select Tokens**
   - Reference `token-reference.md` for available tokens
   - Use tokens that match the component type from `terminology.md`

3. **Follow Coding Standards**
   - Reference `coding-standards.md` for code style and patterns
   - Use existing components when possible
   - Follow naming conventions

4. **Generate Code**
   - Use semantic tokens (never primitives or hardcoded values)
   - Follow Material Design 3 color roles
   - Include proper accessibility attributes
   - Ensure responsive design

## Quick Links

- **Token Reference**: `token-reference.md`
- **Terminology**: `terminology.md`
- **Coding Standards**: `coding-standards.md`
- **Component Library**: `../components/docs/COMPONENTS.md`
- **Design Patterns**: `../docs/DESIGN_PATTERNS.md`

## Related Documentation

- **Components**: `../components/docs/` - Component library documentation
- **Tokens**: `../tokens/docs/` - Token system documentation
- **Design Patterns**: `../docs/DESIGN_PATTERNS.md` - Design patterns and examples
- **Development Standards**: `../docs/DEV_STANDARDS.md` - Detailed development guidelines

