import fs from 'fs';
import path from 'path';

console.log('Restoring tokens from local backup and existing SCSS...');

// 1. Read the extracted_tokens.json (Source for Colors and Layout)
const extractedPath = path.join(process.cwd(), 'extracted_tokens.json');
if (!fs.existsSync(extractedPath)) {
    console.error('Error: extracted_tokens.json not found!');
    process.exit(1);
}
const extracted = JSON.parse(fs.readFileSync(extractedPath, 'utf8'));

// 2. Read existing SCSS files (Source for Primitives and Semantics)
const primitivesScssPath = path.join(process.cwd(), 'design-system/src/tokens/_primitives.scss');
const semanticsScssPath = path.join(process.cwd(), 'design-system/src/tokens/_spacing_semantics.scss');

let primitivesMap = {}; // cssVarName -> number value

// Helper: Ensure directory exists
const targetDir = path.join(process.cwd(), 'new tokens');
if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
}

// ==========================================
// Process COLORS
// ==========================================
function processColors() {
    console.log('Processing colors...');
    const accentVars = [];
    const neutralVars = [];

    extracted.colors.forEach(c => {
        const item = {
            id: c.name, // Mock ID
            name: c.path.replace(/\s+/g, '').replace(/&/g, '').replace(/\//g, '/'), // Clean path
            valuesByMode: { 'Default': c.value },
            resolvedValuesByMode: {
                'Default': {
                    resolvedValue: c.value,
                    // Mock RGBA for completeness if needed, but hex string usually suffices or hex parsing
                    r: 0, g: 0, b: 0, a: 1
                }
            }
        };

        // Basic hex to rgb parsing for the generator
        if (c.value.startsWith('#')) {
            const hex = c.value.substring(1);
            const r = parseInt(hex.substring(0, 2), 16) / 255;
            const g = parseInt(hex.substring(2, 4), 16) / 255;
            const b = parseInt(hex.substring(4, 6), 16) / 255;
            item.resolvedValuesByMode['Default'] = { r, g, b, a: 1 };
        }

        // Categorize
        const lowerPath = c.path.toLowerCase();
        if (lowerPath.includes('neutral') || lowerPath.includes('surface') || lowerPath.includes('outline')) {
            neutralVars.push(item);
        } else {
            accentVars.push(item);
        }
    });

    const standardModes = { 'Default': 'Default' };

    fs.writeFileSync(path.join(targetDir, 'colors _ accent.json'), JSON.stringify({
        modes: standardModes,
        variables: accentVars
    }, null, 2));

    fs.writeFileSync(path.join(targetDir, 'colors _ neutral.json'), JSON.stringify({
        modes: standardModes,
        variables: neutralVars
    }, null, 2));
}

// ==========================================
// Process PRIMITIVES (from SCSS)
// ==========================================
function processPrimitives() {
    console.log('Processing primitives from SCSS...');
    if (!fs.existsSync(primitivesScssPath)) {
        console.warn('Warning: _primitives.scss not found, skipping primitives restoration.');
        return;
    }

    const content = fs.readFileSync(primitivesScssPath, 'utf8');
    const variables = [];

    // Regex to match: --size-some-name: 12px;
    const regex = /--size-([a-zA-Z0-9-]+):\s*([0-9.]+)px;/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        const cssName = match[1]; // e.g. spacing-small-space-100
        const value = parseFloat(match[2]);

        primitivesMap[`--size-${cssName}`] = value;

        // Reconstruct Figma-like name from CSS name
        // e.g. spacing-small-space-100 -> Spacing/Small/Space 100
        const figmaName = cssName
            .replace(/-/g, '/')
            .replace(/spacing\//, 'Spacing/')
            .replace(/border\/radius\//, 'Border/Radius/')
            .replace(/border\/stroke\//, 'Border/Stroke/');

        variables.push({
            id: cssName,
            name: figmaName,
            valuesByMode: { 'Default': value },
            resolvedValuesByMode: { 'Default': { resolvedValue: value } }
        });
    }

    fs.writeFileSync(path.join(targetDir, 'size _ primitive.json'), JSON.stringify({
        modes: { 'Default': 'Default' },
        variables: variables
    }, null, 2));
}

// ==========================================
// Process SEMANTICS (from SCSS)
// ==========================================
function processSemantics() {
    console.log('Processing semantics from SCSS...');
    if (!fs.existsSync(semanticsScssPath)) {
        console.warn('Warning: _spacing_semantics.scss not found, skipping semantics restoration.');
        return;
    }

    const content = fs.readFileSync(semanticsScssPath, 'utf8');
    const variables = [];

    // Regex to match: --size-element-pad-x-lg: var(--size-spacing-medium-space-300);
    // OR: --size-element-pad-x-lg: 16px;
    const regex = /--size-([a-zA-Z0-9-]+):\s*(?:var\((--size-[a-zA-Z0-9-]+)\)|([0-9.]+)px);/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        const cssName = match[1];
        const tokenRef = match[2];
        const rawValue = match[3];

        let finalValue = 0;
        if (tokenRef) {
            finalValue = primitivesMap[tokenRef] || 0;
        } else if (rawValue) {
            finalValue = parseFloat(rawValue);
        }

        const figmaName = cssName.replace(/-/g, '/');

        variables.push({
            id: cssName,
            name: figmaName,
            valuesByMode: { 'Default': finalValue },
            resolvedValuesByMode: { 'Default': { resolvedValue: finalValue } }
        });
    }

    fs.writeFileSync(path.join(targetDir, 'size _ semantics.json'), JSON.stringify({
        modes: { 'Default': 'Default' },
        variables: variables
    }, null, 2));
}

// ==========================================
// Process LAYOUT
// ==========================================
function processLayout() {
    console.log('Processing layout...');
    const variables = [];

    if (extracted.layout) {
        extracted.layout.forEach(l => {
            // Basic pass-through of mock data structure
            // Layout structure in extracted_tokens is complex, simplified here
            variables.push({
                id: l.name,
                name: l.path.replace(/    Layout & Grid \/ /, ''),
                valuesByMode: { 'Default': 0 }, // Placeholder
                resolvedValuesByMode: { 'Default': { resolvedValue: 0 } }
            });
        });
    }

    // Add Breakpoints explicitly if possible, or leave empty if generate-tokens handles regex
    // Current generate-all-tokens expects specific naming for breakpoints.
    // For now, we write a minimal file to prevent errors.

    fs.writeFileSync(path.join(targetDir, 'size _ layout.json'), JSON.stringify({
        modes: { 'Default': 'Default' },
        variables: variables
    }, null, 2));
}

// Run All
processColors();
processPrimitives();
processSemantics();
processLayout();

console.log('✅ Restoration complete. JSON files written to "new tokens/".');
