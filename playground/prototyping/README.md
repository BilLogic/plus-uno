# Prototyping

This directory is for designer-specific prototyping and experimentation. Each designer can create their own directory to work on prototypes without affecting the main codebase.

## Creating Your Prototype

1. Create a directory with your name (e.g., `playground/prototyping/bill/` or `playground/prototyping/victor/`)
2. Create a subdirectory for your prototype (e.g., `playground/prototyping/bill/figma-replication-test/`)
3. Create a `README.md` in your prototype directory to document your work
4. Start prototyping!

## Local Development Server

**By default, all prototypes should be hosted locally** to ensure proper module loading and asset resolution.

### Starting the Local Server

**IMPORTANT**: The server must be run from the **project root** (not the prototype directory) to ensure relative paths resolve correctly.

```bash
# From the project root
cd /path/to/plus-vibe-coding-starting-kit

# Option 1: Python 3 (recommended)
python3 -m http.server 8000

# Option 2: Python 2
python -m SimpleHTTPServer 8000

# Option 3: Node.js (if you have http-server installed)
npx http-server -p 8000
```

### Accessing Your Prototype

Once the server is running from the project root, access your prototype at:

```
http://localhost:8000/playground/prototyping/{your-name}/{prototype-name}/
```

**Example:**
```
http://localhost:8000/playground/prototyping/bill/figma-replication-test/
```

### Opening in Browser

Once the server is running:

1. **Open in Cursor Browser** (recommended):
   - The prototype will automatically open in Cursor's integrated browser
   - This allows for easy inspection and debugging

2. **Open in External Browser**:
   - Navigate to `http://localhost:8000` in your preferred browser
   - Use DevTools to inspect and debug

### Why Local Server?

- **ES6 Modules**: Required for `import` statements to work correctly
- **CORS**: Prevents cross-origin issues when loading assets
- **Path Resolution**: Ensures relative paths resolve correctly
- **Design Tokens**: CSS variables load properly from compiled CSS

### Quick Start Script

You can create a simple script to start the server:

```bash
#!/bin/bash
# start-server.sh
cd "$(dirname "$0")"
python3 -m http.server 8000
```

Make it executable:
```bash
chmod +x start-server.sh
./start-server.sh
```

## Structure

```
playground/
├── templates/                   # Curated templates organized by product pillar
│   ├── admin/
│   ├── home/
│   ├── login/
│   ├── profile/
│   ├── toolkit/
│   ├── training/
│   └── universal/
└── prototyping/                 # Designer-specific prototyping area
    └── {your-name}/             # Your prototyping directory
        └── {prototype-name}/    # Individual prototypes
            ├── index.html
            ├── styles.css (if needed)
            ├── script.js (if needed)
            └── README.md
```

## Best Practices

1. **Organize by feature**: Create subdirectories for different prototypes
2. **Document your work**: Include README.md files explaining your prototypes
3. **Use templates**: Start from templates in `../templates/` when appropriate
4. **Follow design system**: Always use PLUS design tokens and components
5. **Keep it clean**: Remove experimental code that didn't work out

## When to Use Prototyping vs Templates

- **Prototyping**: Use for experimentation, one-off prototypes, and personal exploration
- **Templates**: Use for reusable, curated templates that demonstrate complete page implementations based on specs documentation

## Moving to Templates

If your prototype becomes a useful template for others:

1. Clean up the code
2. Add comprehensive documentation
3. Move it to `../templates/{product-pillar}/`
4. Update the templates README

## Import Paths

**From `playground/prototyping/{designer}/{prototype}/`:**

```javascript
// Import path: 4 levels up to root
import { PlusInterface, PlusSmartComponents } from "../../../../design-system/components/index.js";
```

```html
<!-- CSS path: 4 levels up to root -->
<link rel="stylesheet" href="../../../../dist/css/main.css">
```

## Git Integration

By default, prototyping directories are ignored by git (see `.gitignore`). If you want to commit your prototyping work:

1. Remove the ignore pattern for your specific directory, OR
2. Use `git add -f playground/prototyping/{your-name}/` to force add

## See Also

- **Templates**: `../templates/` - Curated templates based on specs documentation
- **Design System**: `../../design-system/` - Component library and tokens
- **Specs Documentation**: `../../design-system/specs/` - Complete page documentation for each product pillar
- **Documentation**: `../../develop/` - Technical documentation
- **Guidelines**: `../../develop/standards.md` - Coding standards and best practices
- **Token Reference**: `../../design-system/styles/` - Complete token reference

