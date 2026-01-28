# Templates

This directory contains curated templates organized by product pillar. These templates serve as complete page implementations based on the specs documentation in `design-system/specs/`. Each template folder contains documentation that replicates the page documentation from the corresponding specs folder.

## Structure

Templates are organized by product pillar matching the Figma design system sidebar:

- **admin/** - Admin-related templates (Tutors, Sessions, Students, Groups)
- **toolkit/** - Toolkit templates (Sessions, Slack)
- **login/** - Authentication and login templates
- **profile/** - User profile templates
- **home/** - Home/dashboard templates
- **training/** - Training templates (Lessons, Onboarding)
- **universal/** - Universal/shared component templates

Each template folder contains:
- `STRUCTURE.md` - Complete page documentation based on `design-system/specs/{pillar}/STRUCTURE.md`
- Template HTML/JS files implementing the documented pages

## Using Templates

1. **Review the STRUCTURE.md** in the template folder to understand the complete page structure
2. **Reference the specs documentation** at `../../design-system/specs/{pillar}/` for detailed component breakdowns
3. **Choose a template** from the appropriate product pillar directory
4. **Copy the template** to your `playground/prototyping/{your-name}/` directory
5. **Customize** the template for your specific prototype
6. **Start a local server** (see Local Development Server section below)
7. **Open in browser** and test your prototype
8. **Reference** the design system components and tokens

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

## Setup Requirements

### HTML Head Section

**ALWAYS include the following in your HTML `<head>` section:**

1. **Google Fonts** (REQUIRED) - Fonts must load before CSS:
```html
<!-- Google Fonts -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;600;700&family=Merriweather+Sans:wght@300;400;600;700&family=Open+Sans:wght@300;400;600;700&display=swap" rel="stylesheet">
```

2. **Bootstrap 4.6.2 CSS** (REQUIRED):
```html
<link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
```

3. **Font Awesome** (REQUIRED):
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
```

4. **PLUS Design System CSS** (REQUIRED):
```html
<!-- From playground/templates/{pillar}/: -->
<link rel="stylesheet" href="../../../dist/css/main.css">
```

5. **Highcharts** (OPTIONAL - Only if creating data visualizations):
```html
<!-- Include in <head> section -->
<script src="https://code.highcharts.com/highcharts.js"></script>
<script src="https://code.highcharts.com/modules/exporting.js"></script>
```

**Reference**: `playground/templates/universal/html-head-template.html` for complete HTML head template

### Component Import Paths

**ALWAYS use correct import paths** based on your prototype location:

- **From `playground/templates/{pillar}/`**: `"../../../design-system/components/index.js"`
- **From `playground/prototyping/{name}/`**: `"../../../../design-system/components/index.js"`
- **From root**: `"./design-system/components/index.js"`

**Example:**
```javascript
// From playground/templates/{pillar}/
import { PlusInterface, PlusSmartComponents } from "../../../design-system/components/index.js";
```

**ALWAYS include `type="module"`** in script tags:
```html
<script type="module" src="your-script.js"></script>
```

**Reference**: `develop/imports.md` for complete import path reference

### Highcharts Setup (If Using Data Visualizations)

If your prototype includes charts or graphs:

1. **Include Highcharts CDN** in HTML `<head>` section (see above)
2. **Place Highcharts scripts** before your custom JavaScript
3. **Use PLUS design tokens** for chart styling (colors, fonts)
4. **Reference**: `develop/standards.md` - Highcharts Setup section for complete setup guide

### Table Styling (If Using Tables)

If your prototype includes tables:

1. **ALWAYS use table design tokens** - never hardcode values
2. **Use proper HTML structure** - `<thead>`, `<tbody>`, `<th>`, `<td>`
3. **Reference**: `develop/standards.md` - Table Styling section for styling patterns
4. **Reference**: `templates/universal/table-example.html` for example implementation

## Template Structure

Each template directory should include:
- `STRUCTURE.md` - Complete page documentation based on specs (replicates `design-system/specs/{pillar}/STRUCTURE.md`)
- `index.html` - Main HTML file implementing the documented pages
- Template files - HTML/JS files for specific page implementations
- `README.md` - Template-specific documentation (if needed)

## Contributing Templates

When creating a new template:

1. **Reference the specs documentation** at `../../design-system/specs/{pillar}/STRUCTURE.md`
2. Create a new directory in the appropriate product pillar folder
3. **Copy and adapt the STRUCTURE.md** from the corresponding specs folder
4. Include all necessary files implementing the documented pages
5. Use design tokens consistently (never hardcode values)
6. Follow PLUS design patterns
7. Include comprehensive documentation
8. Test across browsers and screen sizes
9. Reference `../../develop/standards.md` for coding standards

## Best Practices

- Always use semantic design tokens from `../../design-system/styles/` (colors.md, layout.md, typography.md, icons.md, elevation.md)
- Follow component patterns from `../../design-system/components/overview.md`
- Use existing PLUS components when possible
- Include proper accessibility attributes
- Ensure responsive design
- Document any special requirements or dependencies

## Common Issues to Avoid

### Font Loading
- ❌ Missing Google Fonts links → Fonts default to system fonts
- ✅ Always include font links in `<head>` section before CSS

### Highcharts
- ❌ Missing Highcharts CDN → Charts don't render
- ✅ Always include Highcharts CDN in `<head>` when creating data visualizations

### Import Paths
- ❌ Wrong relative path → Components don't import
- ✅ Always verify import path based on prototype location

### Table Styling
- ❌ Hardcoded padding/spacing → Inconsistent styling
- ✅ Always use table design tokens (`--size-table-cell-x`, etc.)

**Reference**: `develop/standards.md` for complete checklist and coding standards

## See Also

- **Specs Documentation**: `../../design-system/specs/` - Complete page documentation for each product pillar
- **HTML Head Template**: `universal/html-head-template.html` - Standardized HTML head
- **Table Example**: `universal/table-example.html` - Table styling example
- **Coding Standards**: `../../develop/standards.md` - Coding standards, setup guides, and best practices
- **Import Paths**: `../../develop/imports.md` - Import path reference
- **Playground**: `../prototyping/` - For designer-specific prototyping
- **Design System**: `../../design-system/` - Component library and tokens
- **Token Documentation**: `../../design-system/styles/` - Complete token reference
- **Component Documentation**: `../../design-system/components/overview.md` - Component API documentation

