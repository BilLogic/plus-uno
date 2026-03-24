import fs from 'fs';
import path from 'path';

const ROOT_DIR = path.resolve(import.meta.dirname, '../');
const TOKENS_DIR = path.join(ROOT_DIR, 'design-system/src/tokens');
const COMPONENTS_INDEX = path.join(ROOT_DIR, 'design-system/src/components/index.js');
const ASSETS_DIR = path.join(ROOT_DIR, '.agent/assets');

// Output files (split for dynamic context loading)
const OUTPUT_COMPONENTS = path.join(ASSETS_DIR, 'cheat-components.md');
const OUTPUT_FORMS = path.join(ASSETS_DIR, 'cheat-forms.md');
const OUTPUT_TOKENS = path.join(ASSETS_DIR, 'cheat-tokens.md');
const OUTPUT_INDEX = path.join(ASSETS_DIR, 'PLUS_CHEAT_SHEET.md');

// 1. Extract SCSS Variables
function extractScssVariables(filePath) {
    if (!fs.existsSync(filePath)) return [];

    const content = fs.readFileSync(filePath, 'utf8');
    const variables = [];

    // Regex to match SCSS variables, e.g., --size-element-gap-md: ...;
    const regex = /(--[a-zA-Z0-9-]+):/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        variables.push(match[1]);
    }

    return [...new Set(variables)].sort(); // Deduplicate and sort
}

// 2. Extract Component Exports
function extractComponents() {
    if (!fs.existsSync(COMPONENTS_INDEX)) return [];

    const content = fs.readFileSync(COMPONENTS_INDEX, 'utf8');
    const components = [];

    // Regex to match exports like: export { default as Button }
    const regex = /export\s+\{.*as\s+([a-zA-Z0-9]+)\s*\}/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        components.push(match[1]);
    }

    return components.sort();
}

// 3. Extract Form Exports (from forms/index.js if it exists)
function extractForms() {
    const formsIndex = path.join(ROOT_DIR, 'design-system/src/forms/index.js');
    if (!fs.existsSync(formsIndex)) return [];

    const content = fs.readFileSync(formsIndex, 'utf8');
    const forms = [];

    const regex = /export\s+\{.*as\s+([a-zA-Z0-9]+)\s*\}/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        forms.push(match[1]);
    }

    return forms.sort();
}

function generateCheatSheet() {
    console.log('Generating PLUS DS Cheat Sheet (split files)...');

    // Token extraction
    const colorTokens = extractScssVariables(path.join(TOKENS_DIR, '_colors.scss'));
    const spacingTokens = extractScssVariables(path.join(TOKENS_DIR, '_spacing_semantics.scss'));
    const fontTokens = extractScssVariables(path.join(TOKENS_DIR, '_fonts.scss'));
    const primitiveTokens = extractScssVariables(path.join(TOKENS_DIR, '_primitives.scss'));
    const elevationTokens = extractScssVariables(path.join(TOKENS_DIR, '_elevation.scss'));

    // Component extraction
    const components = extractComponents();
    const forms = extractForms();

    // --- cheat-components.md ---
    let componentsDoc = `<!-- Load when: building UI with DS components -->\n`;
    componentsDoc += `# PLUS DS — Components\n\n`;
    componentsDoc += `> **CRITICAL**: Only use components listed here. If it's not listed, it DOES NOT EXIST.\n\n`;
    componentsDoc += `Import via \`@plus-ds/components\` or \`@/components/\`.\n\n`;
    componentsDoc += "```\n" + components.join('\n') + "\n```\n";
    fs.writeFileSync(OUTPUT_COMPONENTS, componentsDoc);
    console.log(`  ✓ ${OUTPUT_COMPONENTS}`);

    // --- cheat-forms.md ---
    let formsDoc = `<!-- Load when: building forms with DS form elements -->\n`;
    formsDoc += `# PLUS DS — Forms\n\n`;
    formsDoc += `> **CRITICAL**: Only use form components listed here.\n\n`;
    formsDoc += `Import via \`@plus-ds/forms\` or \`@/forms/\`.\n\n`;
    if (forms.length > 0) {
        formsDoc += "```\n" + forms.join('\n') + "\n```\n";
    } else {
        formsDoc += `_Form index not found. Check \`design-system/src/forms/\` for available form components._\n`;
    }
    fs.writeFileSync(OUTPUT_FORMS, formsDoc);
    console.log(`  ✓ ${OUTPUT_FORMS}`);

    // --- cheat-tokens.md ---
    let tokensDoc = `<!-- Load when: styling with DS tokens (spacing, typography, color, elevation) -->\n`;
    tokensDoc += `# PLUS DS — Tokens\n\n`;
    tokensDoc += `> **CRITICAL**: Never hardcode values. Use these exact token strings.\n\n`;

    tokensDoc += `## Spacing Semantics\n`;
    tokensDoc += `Use for padding, margin, and gaps.\n\n`;
    tokensDoc += "```css\n" + spacingTokens.join('\n') + "\n```\n\n";

    tokensDoc += `## Typography Tokens\n`;
    tokensDoc += `Use for font sizes, weights, and line heights.\n\n`;
    tokensDoc += "```css\n" + fontTokens.join('\n') + "\n```\n\n";

    tokensDoc += `## Color Tokens\n`;
    tokensDoc += `Use semantic colors (never hex codes).\n\n`;
    tokensDoc += "```css\n" + colorTokens.join('\n') + "\n```\n\n";

    tokensDoc += `## Elevation Tokens\n`;
    tokensDoc += "```css\n" + elevationTokens.join('\n') + "\n```\n\n";

    tokensDoc += `## Primitive Variables\n`;
    tokensDoc += `Base raw variables (only use if a semantic token doesn't exist).\n\n`;
    tokensDoc += "```css\n" + primitiveTokens.join('\n') + "\n```\n";
    fs.writeFileSync(OUTPUT_TOKENS, tokensDoc);
    console.log(`  ✓ ${OUTPUT_TOKENS}`);

    // --- PLUS_CHEAT_SHEET.md (index) ---
    let indexDoc = `# PLUS Cheat Sheet — Index\n\n`;
    indexDoc += `Load only the section you need:\n\n`;
    indexDoc += `- [Components](cheat-components.md) — ${components.length} UI components\n`;
    indexDoc += `- [Forms](cheat-forms.md) — Form elements\n`;
    indexDoc += `- [Tokens](cheat-tokens.md) — Spacing, typography, color, elevation tokens\n`;
    fs.writeFileSync(OUTPUT_INDEX, indexDoc);
    console.log(`  ✓ ${OUTPUT_INDEX} (index)`);

    console.log(`\nCheat sheet generated: 3 modules + 1 index`);
}

generateCheatSheet();
