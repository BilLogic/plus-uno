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
import { plannedIntents } from './lib/token-intent.mjs';

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
 * same names with tier, group and value. The ladder's component tokens are
 * here; a component's private custom properties in its own SCSS are not.
 */
function tokenSections() {
    const t = (file) => extractScssDeclarations(path.join(TOKENS_DIR, file));
    const c = (file) => extractScssDeclarations(path.join(COLOR_DIR, file));
    const l = (file) => extractScssDeclarations(path.join(TOKENS_DIR, 'ladder', file));
    const scales = t('_scales.scss');
    // The ladder (ADR-038) comes first: it is what new code reads, and a name
    // another file also declares keeps its ladder tier.
    return [
        { group: 'Ladder Semantics', tier: 'semantic', tokens: l('_semantics.scss') },
        { group: 'Ladder Patterns', tier: 'pattern', tokens: l('_patterns.scss') },
        { group: 'Ladder Components', tier: 'component', tokens: l('_components.scss') },
        { group: 'Layers', tier: 'semantic', tokens: l('_layers.scss') },
        { group: 'Motion', tier: 'semantic', tokens: l('_motion.scss') },
        { group: 'Scale Tokens', tier: 'semantic', tokens: scales.filter((d) => !isScalePrimitive(d.name)) },
        { group: 'Frame and Layer Tokens', tier: 'pattern', tokens: t('_frame_layers.scss') },
        { group: 'Type Scale', tier: 'semantic', tokens: t('_type.scss') },
        { group: 'Color Tokens (--ds-)', tier: 'semantic', tokens: c(COLOR_SEMANTIC_FILE) },
        { group: 'Elevation and Opacity Tokens (--ds-)', tier: 'semantic', tokens: c(COLOR_ELEVATION_FILE) },
        { group: 'Color Primitives (--palette-)', tier: 'primitive', tokens: c(COLOR_PALETTE_FILE) },
        { group: 'Scale Primitives', tier: 'primitive', tokens: scales.filter((d) => isScalePrimitive(d.name)) },
    ];
}

const INTENTS = plannedIntents();

/** A hovered or pressed variant's intent only names its base, listed just above it, so tokens.md leaves it bare. */
const isStateOnly = (intent) => /^(?:the )?(?:hover|hovered|pressed) state (?:of|for) /i.test(intent);

/** One code-block line per token: the name, then its intent as a comment where the plan gives one. */
function tokenLines(tier, names) {
    return names
        .map((name) => {
            const intent = tier === 'primitive' ? '' : INTENTS.get(name);
            return intent && !isStateOnly(intent) ? `${name}  /* ${intent.replaceAll('*/', '')} */` : name;
        })
        .join('\n');
}

function renderTokensManifest(markdown) {
    const manifest = buildTokensManifest(tokenSections(), INTENTS);
    // The two views must name the same tokens; a drift here is a generator bug.
    const inDoc = new Set(markdown.split('\n').map((l) => l.match(/^(--[a-z0-9-]+)(?:\s+\/\*.*\*\/)?$/)?.[1]).filter(Boolean));
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
    const sections = tokenSections();
    const names = Object.fromEntries(sections.map((s) => [s.group, s.tokens.map((d) => d.name)]));
    const lines = Object.fromEntries(sections.map((s) => [s.group, tokenLines(s.tier, names[s.group])]));
    const ladderSemantics = lines['Ladder Semantics'];
    const ladderPatterns = lines['Ladder Patterns'];
    const ladderComponents = lines['Ladder Components'];
    const layerTokens = lines['Layers'];
    const motionTokens = lines['Motion'];
    const scaleFoundations = lines['Scale Tokens'];
    const frameLayerTokens = lines['Frame and Layer Tokens'];
    const typeTokens = lines['Type Scale'];
    const dsColorTokens = lines['Color Tokens (--ds-)'];
    const dsElevationTokens = lines['Elevation and Opacity Tokens (--ds-)'];
    const paletteTokens = lines['Color Primitives (--palette-)'];
    const scalePrimitives = lines['Scale Primitives'];

    let tokensDoc = `<!-- DO NOT EDIT BY HAND. Generated by npm run generate:agent -->\n`;
    tokensDoc += `<!-- Load when: styling with DS tokens | Route: design-system/guidelines/overview.md -->\n`;
    tokensDoc += `# PLUS DS — Tokens\n\n`;
    tokensDoc += `> **CRITICAL**: Never hardcode values. Use these exact token strings.\n\n`;
    tokensDoc += `Mirrors \`${TOKEN_DIR}/\`.\n\n`;
    tokensDoc += `A token a plan defines carries its intent as a comment: the place or situation it is for. Pick the token whose intent names your case. A hovered or pressed color variant follows its base. A bare token has no plan yet.\n\n`;

    tokensDoc += `## Ladder Semantics\n`;
    tokensDoc += `Start here for space, size and radius (ADR-038). A component reads its component token, else a pattern token, else one of these steps: \`--pad-x-*\` and \`--pad-y-*\` inside a control, \`--stack-*\` between stacked items, \`--inline-*\` between items in a row, \`--radius-*\` for corners. The primitives at the end of this file are what these resolve to.\n\n`;
    tokensDoc += "```css\n" + ladderSemantics + "\n```\n\n";

    tokensDoc += `## Ladder Patterns\n`;
    tokensDoc += `Space owned by a pattern: page, section, card, table, modal, drawer, popover. Inside a pattern, read its token before a semantics step.\n\n`;
    tokensDoc += "```css\n" + ladderPatterns + "\n```\n\n";

    tokensDoc += `## Ladder Components\n`;
    tokensDoc += `Tokens one component owns, named for it.\n\n`;
    tokensDoc += "```css\n" + ladderComponents + "\n```\n\n";

    tokensDoc += `## Layers\n`;
    tokensDoc += `Stacking order: \`z-index: var(--layer-modal)\`.\n\n`;
    tokensDoc += "```css\n" + layerTokens + "\n```\n\n";

    tokensDoc += `## Motion\n`;
    tokensDoc += `Durations and easings; reduced motion is handled at this layer.\n\n`;
    tokensDoc += "```css\n" + motionTokens + "\n```\n\n";

    tokensDoc += `## Scale Tokens\n`;
    tokensDoc += `The Size and Border scales (spacing / foundations): heights, widths, and the Icon, Image, Item, Row, Label and Field sizes.\n\n`;
    tokensDoc += "```css\n" + scaleFoundations + "\n```\n\n";
    tokensDoc += `## Frame and Layer Tokens\n`;
    tokensDoc += `The patterns on the page frame, per breakpoint: page, section, card, table, overlay, modal, popover.\n\n`;
    tokensDoc += "```css\n" + frameLayerTokens + "\n```\n\n";
    tokensDoc += `## Type Scale\n`;
    tokensDoc += `The text styles, generated from Figma: \`font: var(--heading-large)\`. A button or tab label is \`--body-default\` with \`font-weight: var(--type-weight-medium)\`; there is no button style.\n\n`;
    tokensDoc += "```css\n" + typeTokens + "\n```\n\n";

    tokensDoc += `## Color Tokens (\`--ds-\`)\n`;
    tokensDoc += `The color set, generated from a plan into \`${COLOR_TOKEN_DIR}/\` with a value per mode (light, dark, and each with increased contrast). Name a token \`color.property.role.emphasis.state\` without \`color.\`: \`var(--ds-background-brand-bold)\`, \`var(--ds-text-subtle)\`, \`var(--ds-border-focused)\`. Never write one with a fallback (\`check:ds-fallbacks\`).\n\n`;
    tokensDoc += "```css\n" + dsColorTokens + "\n```\n\n";

    tokensDoc += `## Elevation and Opacity Tokens (\`--ds-\`)\n`;
    tokensDoc += `Shadows pair with the surface of the same level (\`--ds-shadow-raised\` with \`--ds-surface-raised\`); opacity dims a whole element.\n\n`;
    tokensDoc += "```css\n" + dsElevationTokens + "\n```\n\n";

    tokensDoc += `## Color Primitives (\`--palette-\`)\n`;
    tokensDoc += `The ramps the \`--ds-\` tokens alias. Never name one in a component; a plan swap changes these values and nothing else.\n\n`;
    tokensDoc += "```css\n" + paletteTokens + "\n```\n\n";

    tokensDoc += `## Scale Primitives\n`;
    tokensDoc += `The primitives (spacing / primitives), named by rem × 100; point semantic tokens at these, not components.\n\n`;
    tokensDoc += "```css\n" + scalePrimitives + "\n```\n";
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
