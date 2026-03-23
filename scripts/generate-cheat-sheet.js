import fs from 'fs';
import path from 'path';

const ROOT_DIR = path.resolve(import.meta.dirname, '../');
const TOKENS_DIR = path.join(ROOT_DIR, 'design-system/src/tokens');
const COMPONENTS_INDEX = path.join(ROOT_DIR, 'design-system/src/components/index.js');
const OUTPUT_FILE = path.join(ROOT_DIR, '.agent/assets/PLUS_CHEAT_SHEET.md');

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

function generateCheatSheet() {
    console.log('Generating PLUS DS Cheat Sheet...');

    // Token extraction
    const colorTokens = extractScssVariables(path.join(TOKENS_DIR, '_colors.scss'));
    const spacingTokens = extractScssVariables(path.join(TOKENS_DIR, '_spacing_semantics.scss'));
    const fontTokens = extractScssVariables(path.join(TOKENS_DIR, '_fonts.scss'));
    const primitiveTokens = extractScssVariables(path.join(TOKENS_DIR, '_primitives.scss'));
    const elevationTokens = extractScssVariables(path.join(TOKENS_DIR, '_elevation.scss'));

    // Component extraction
    const components = extractComponents();

    let md = `# PLUS Design System: Universal AI Cheat Sheet\n\n`;
    md += `> **CRITICAL RULE**: You MUST use these exact token strings and component names. Do NOT guess or hallucinate any variants that are not literally listed in this file.\n\n`;

    md += `## 1. Available React Components\n`;
    md += `These are the official PLUS DS components available for import via \`@plus-ds/components\` or \`@plus-ds\` depending on your Vite alias. If a component is not listed here, it DOES NOT EXIST.\n\n`;
    md += "```\n" + components.join('\n') + "\n```\n\n";

    md += `## 2. Spacing Semantics\n`;
    md += `Use these strictly for padding, margin, and gaps. DO NOT use generic sizes like \`-base\`.\n\n`;
    md += "```css\n" + spacingTokens.join('\n') + "\n```\n\n";

    md += `## 3. Typography Tokens\n`;
    md += `Use these for font sizes, weights, and line heights.\n\n`;
    md += "```css\n" + fontTokens.join('\n') + "\n```\n\n";

    md += `## 4. Color Tokens\n`;
    md += `Use these semantic colors (never hex codes).\n\n`;
    md += "```css\n" + colorTokens.slice(0, 100).join('\n') + "\n... (and more)\n```\n\n";

    md += `## 5. Primitive Variables\n`;
    md += `Base raw variables (only use if a semantic token doesn't exist).\n\n`;
    md += "```css\n" + primitiveTokens.join('\n') + "\n```\n\n";

    fs.writeFileSync(OUTPUT_FILE, md);
    console.log(`Cheat sheet generated successfully at: ${OUTPUT_FILE}`);
}

generateCheatSheet();
