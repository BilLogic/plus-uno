/**
 * Generate the token agent view — design-system/agent-views/tokens/tokens.md.
 *
 * Usage:
 *   node scripts/generate-cheat-sheet.js
 *   node scripts/generate-cheat-sheet.js --check  (CI: fail if stale, write nothing)
 */

import fs from 'fs';
import path from 'path';
import {
    COLOR_ELEVATION_FILE,
    COLOR_PALETTE_FILE,
    COLOR_SEMANTIC_FILE,
    COLOR_TOKEN_DIR,
    TOKEN_DIR,
} from '../design-system/src/lib/tokens-node.mjs';
import { tokenDeclarationPattern } from '../design-system/src/lib/tokens.mjs';
import { AGENT_ROOT } from './agent-views-paths.js';
import { checkArtifacts, writeArtifacts } from './lib/generated-artifact.js';
import { buildTokensManifest, serializeManifest } from './lib/agent-manifests.mjs';

const ROOT_DIR = path.resolve(import.meta.dirname, '../');
const TOKENS_DIR = path.join(ROOT_DIR, TOKEN_DIR);
const COLOR_DIR = path.join(ROOT_DIR, COLOR_TOKEN_DIR);
const OUTPUT_TOKENS = path.join(AGENT_ROOT, 'tokens/tokens.md');
const OUTPUT_TOKENS_JSON = path.join(AGENT_ROOT, 'tokens.json');

/** Name → its first declared value, in name order. A token written once per mode keeps the first (light) value. */
function extractScssDeclarations(filePath) {
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf8');
    const first = new Map();
    const regex = tokenDeclarationPattern();
    let match;
    while ((match = regex.exec(content)) !== null) {
        if (!first.has(match[1])) first.set(match[1], match[2].trim());
    }
    return [...first.keys()].sort().map((name) => ({ name, value: first.get(name) }));
}

const isScalePrimitive = (name) => /^--(space|radius|stroke|size)-[0-9]/.test(name) || name === '--radius-full';

/**
 * The token view's sections, in its order, with the tier each sits on
 * (GLOSSARY § Token tier). The markdown lists names; tokens.json lists the
 * same names with tier, group and value. Component tokens live in each
 * component's own SCSS and are not part of this view.
 */
function tokenSections() {
    const t = (file) => extractScssDeclarations(path.join(TOKENS_DIR, file));
    const c = (file) => extractScssDeclarations(path.join(COLOR_DIR, file));
    const scales = t('_scales.scss');
    return [
        { group: 'Spacing Semantics', tier: 'semantic', tokens: t('_spacing_semantics.scss') },
        { group: 'Scale Tokens', tier: 'semantic', tokens: scales.filter((d) => !isScalePrimitive(d.name)) },
        { group: 'Frame and Layer Tokens', tier: 'pattern', tokens: t('_frame_layers.scss') },
        { group: 'Type Scale', tier: 'semantic', tokens: t('_type.scss') },
        { group: 'Typography Tokens', tier: 'semantic', tokens: t('_fonts.scss') },
        { group: 'Color Tokens (--ds-)', tier: 'semantic', tokens: c(COLOR_SEMANTIC_FILE) },
        { group: 'Elevation and Opacity Tokens (--ds-)', tier: 'semantic', tokens: c(COLOR_ELEVATION_FILE) },
        { group: 'Legacy Color Tokens', tier: 'semantic', tokens: t('_colors.scss') },
        { group: 'Elevation Tokens', tier: 'semantic', tokens: t('_elevation.scss') },
        { group: 'Color Primitives (--palette-)', tier: 'primitive', tokens: c(COLOR_PALETTE_FILE) },
        { group: 'Primitive Variables', tier: 'primitive', tokens: t('_primitives.scss') },
        { group: 'Scale Primitives', tier: 'primitive', tokens: scales.filter((d) => isScalePrimitive(d.name)) },
    ];
}

function renderTokensManifest(markdown) {
    const manifest = buildTokensManifest(tokenSections());
    // The two views must name the same tokens; a drift here is a generator bug.
    const inDoc = new Set(markdown.split('\n').filter((l) => /^--[a-z0-9-]+$/.test(l)));
    const inJson = new Set(manifest.tokens.map((x) => x.name));
    const missing = [...inDoc].filter((n) => !inJson.has(n));
    const extra = [...inJson].filter((n) => !inDoc.has(n));
    if (missing.length || extra.length) {
        throw new Error(`tokens.json and tokens.md disagree — only in md: ${missing.join(', ') || 'none'}; only in json: ${extra.join(', ') || 'none'}`);
    }
    return serializeManifest(manifest, 'npm run generate:agent');
}

function renderTokensDoc() {
    // Names come from the same sections tokens.json is built from, so the two
    // views cannot list different tokens.
    const names = Object.fromEntries(tokenSections().map((s) => [s.group, s.tokens.map((d) => d.name)]));
    const spacingTokens = names['Spacing Semantics'];
    const scaleFoundations = names['Scale Tokens'];
    const frameLayerTokens = names['Frame and Layer Tokens'];
    const typeTokens = names['Type Scale'];
    const fontTokens = names['Typography Tokens'];
    const dsColorTokens = names['Color Tokens (--ds-)'];
    const dsElevationTokens = names['Elevation and Opacity Tokens (--ds-)'];
    const colorTokens = names['Legacy Color Tokens'];
    const elevationTokens = names['Elevation Tokens'];
    const paletteTokens = names['Color Primitives (--palette-)'];
    const primitiveTokens = names['Primitive Variables'];
    const scalePrimitives = names['Scale Primitives'];

    let tokensDoc = `<!-- DO NOT EDIT BY HAND. Generated by npm run generate:agent -->\n`;
    tokensDoc += `<!-- Load when: styling with DS tokens | Route: design-system/guidelines/overview.md -->\n`;
    tokensDoc += `# PLUS DS — Tokens\n\n`;
    tokensDoc += `> **CRITICAL**: Never hardcode values. Use these exact token strings.\n\n`;
    tokensDoc += `Mirrors \`${TOKEN_DIR}/\`.\n\n`;

    tokensDoc += `## Spacing Semantics\n`;
    tokensDoc += `Use for padding, margin, and gaps.\n\n`;
    tokensDoc += "```css\n" + spacingTokens.join('\n') + "\n```\n\n";

    tokensDoc += `## Scale Tokens\n`;
    tokensDoc += `The new Size, Element and Border scales (spacing / foundations), beside the spacing semantics above until every use moves.\n\n`;
    tokensDoc += "```css\n" + scaleFoundations.join('\n') + "\n```\n\n";
    tokensDoc += `## Frame and Layer Tokens\n`;
    tokensDoc += `The page frame (\`--layout-*\`, per breakpoint) and the patterns on it: surface, section, card, table, overlay, modal, popover. These sit beside the spacing semantics above while uses move to them.\n\n`;
    tokensDoc += "```css\n" + frameLayerTokens.join('\n') + "\n```\n\n";
    tokensDoc += `## Type Scale\n`;
    tokensDoc += `The Atlassian scale, generated from Figma: \`font: var(--heading-large)\`. A button or tab label is \`--body-default\` with \`font-weight: var(--type-weight-medium)\`; there is no button style.\n\n`;
    tokensDoc += "```css\n" + typeTokens.join('\n') + "\n```\n\n";

    tokensDoc += `## Typography Tokens\n`;
    tokensDoc += `Use for font sizes, weights, and line heights.\n\n`;
    tokensDoc += "```css\n" + fontTokens.join('\n') + "\n```\n\n";

    tokensDoc += `## Color Tokens (\`--ds-\`)\n`;
    tokensDoc += `The Atlassian-shaped color set, generated from a plan into \`${COLOR_TOKEN_DIR}/\` with a value per mode (light, dark, and each with increased contrast). Name a token \`color.property.role.emphasis.state\` without \`color.\`: \`var(--ds-background-brand-bold)\`, \`var(--ds-text-subtle)\`, \`var(--ds-border-focused)\`. Never write one with a fallback (\`check:ds-fallbacks\`).\n\n`;
    tokensDoc += "```css\n" + dsColorTokens.join('\n') + "\n```\n\n";

    tokensDoc += `## Elevation and Opacity Tokens (\`--ds-\`)\n`;
    tokensDoc += `Shadows pair with the surface of the same level (\`--ds-shadow-raised\` with \`--ds-surface-raised\`); opacity dims a whole element.\n\n`;
    tokensDoc += "```css\n" + dsElevationTokens.join('\n') + "\n```\n\n";

    tokensDoc += `## Legacy Color Tokens\n`;
    tokensDoc += `The Material roles, still in use until components move to the \`--ds-\` set. Use semantic colors (never hex codes).\n\n`;
    tokensDoc += "```css\n" + colorTokens.join('\n') + "\n```\n\n";

    tokensDoc += `## Elevation Tokens\n`;
    tokensDoc += "```css\n" + elevationTokens.join('\n') + "\n```\n\n";

    tokensDoc += `## Color Primitives (\`--palette-\`)\n`;
    tokensDoc += `The ramps the \`--ds-\` tokens alias. Never name one in a component; a plan swap changes these values and nothing else.\n\n`;
    tokensDoc += "```css\n" + paletteTokens.join('\n') + "\n```\n\n";

    tokensDoc += `## Primitive Variables\n`;
    tokensDoc += `Base raw variables (only use if a semantic token doesn't exist).\n\n`;
    tokensDoc += "```css\n" + primitiveTokens.join('\n') + "\n```\n\n";

    tokensDoc += `## Scale Primitives\n`;
    tokensDoc += `The new primitives (spacing / primitives), named by rem × 100; point semantic tokens at these, not components.\n\n`;
    tokensDoc += "```css\n" + scalePrimitives.join('\n') + "\n```\n";
    return tokensDoc;
}

function main() {
    const check = process.argv.includes('--check');
    const doc = renderTokensDoc();
    const artifacts = [
        { file: OUTPUT_TOKENS, content: doc },
        { file: OUTPUT_TOKENS_JSON, content: renderTokensManifest(doc) },
    ];

    if (check) {
        if (!checkArtifacts(artifacts)) {
            console.error('  -> run `npm run generate:agent-views`');
            process.exit(1);
        }
        console.log('✓ agent views (tokens) up to date');
        return;
    }

    console.log('Generating agent views (tokens)...');
    writeArtifacts(artifacts);
    console.log(`\nToken agent view generated. Route via design-system/guidelines/overview.md`);
}

main();
