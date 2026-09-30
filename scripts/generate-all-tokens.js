import fs from 'fs';
import path from 'path';

import { TOKEN_DIR } from '../design-system/src/lib/tokens-node.mjs';
import { compare, refusals } from './token-generation.mjs';

/**
 * The Figma exports the SCSS is generated FROM, and where the SCSS lands.
 * Both hang off `TOKEN_DIR` (#620/#621) rather than being spelled seven times,
 * so moving the token directory is one edit and the generator cannot end up
 * reading one tree and writing another.
 */
const SOURCE_DIR = `${TOKEN_DIR}/source`;
/**
 * A Figma colour ({r, g, b, a} in 0–1) as CSS: `#rrggbb` when opaque, `rgba()`
 * with the alpha at up to three places otherwise (0.08, not 0.080).
 */
function cssColor({ r, g, b, a = 1 }) {
    const byte = (n) => Math.round(n * 255);
    if (a < 1) return `rgba(${byte(r)}, ${byte(g)}, ${byte(b)}, ${+a.toFixed(3)})`;
    return '#' + [r, g, b].map((n) => byte(n).toString(16).padStart(2, '0')).join('');
}

/** `Social-Emotional` -> `social-emotional`, `on surface variant` -> `on-surface-variant`. */
const slug = (name) => name.trim().toLowerCase().replace(/\s+/g, '-');

/**
 * The accent families in the `colors / accent` collection, in the order the
 * stylesheet lists them.
 */
const ACCENT_FAMILIES = [
    'Primary', 'Secondary', 'Tertiary', 'Danger', 'Success', 'Warning', 'Info',
    'Social-Emotional', 'Mastering-Content', 'Advocacy', 'Relationship', 'Technology-Tools',
];

/**
 * Info is Tertiary under another name: Figma aliases `Info/*` to `Tertiary/*`,
 * so every Info token is written as a `var()` of its Tertiary twin. That also
 * covers the two Figma leaves as literals or not at all (`Info 08` is a literal
 * of the same value; there is no `Info Border Subtle`), and the generator
 * refuses if any Info variable stops resolving to its Tertiary twin's colour.
 */
const ALIASED_FAMILIES = { Info: 'Tertiary' };

/**
 * `Primary/Primary (Text)` -> `primary-text`, `Primary/State-layers/Primary
 * Container 08` -> `primary-container-state-08`, and so on, or `null` for a
 * variable this file does not carry: the `-icon`/`-border` roles and focus
 * rings (hand-maintained in `_color_roles.scss`), the `Proposal/*` candidates,
 * and stray leaves such as `Advocacy/on-surface` and the `Content` string.
 */
function accentToken(name) {
    const [family, ...rest] = name.split('/');
    if (!ACCENT_FAMILIES.includes(family) || rest.length === 0) return null;
    const f = slug(family);
    const leaf = rest.join('/');

    const state = leaf.match(/^State-layers\/(.+) (08|12|16)$/);
    if (state) {
        if (state[1] === family) return `${f}-state-${state[2]}`;
        if (state[1] === `${family} Container`) return `${f}-container-state-${state[2]}`;
        return null;
    }

    const roles = {
        [family]: f,
        [`${family} (Text)`]: `${f}-text`,
        [`On ${family}`]: `on-${f}`,
        [`${family} Container`]: `${f}-container`,
        [`On ${family} Container`]: `on-${f}-container`,
        [`Inverse ${family}`]: `inverse-${f}`,
        [`${family} Border Subtle`]: `${f}-border-subtle`,
    };
    return roles[leaf] ?? null;
}

/** The order a family's tokens are written in, base roles then state layers. */
function familyOrder(f) {
    const levels = ['08', '12', '16'];
    return {
        roles: [f, `${f}-text`, `on-${f}`, `${f}-container`, `on-${f}-container`, `inverse-${f}`, `${f}-border-subtle`],
        states: [...levels.map((l) => `${f}-state-${l}`), ...levels.map((l) => `${f}-container-state-${l}`)],
    };
}

/**
 * `Neutral Colors/Alternative/surface-dim` -> `surface-dim`,
 * `State-layers/on surface/opacity-0_08` -> `on-surface-state-08`, or `null`
 * for the `Surface roles/*` aliases, which are not part of this file.
 */
function neutralToken(name) {
    const state = name.match(/^State-layers\/(.+)\/opacity-0_(08|12|16)$/);
    if (state) return `${slug(state[1])}-state-${state[2]}`;
    const role = name.match(/^Neutral Colors\/(?:Surface container\/|Alternative\/)?([^/]+)$/);
    return role ? slug(role[1]) : null;
}

const NEUTRAL_GROUPS = {
    'Surface': ['surface', 'on-surface'],
    'Surface Variant': ['surface-variant', 'on-surface-variant'],
    'Outline': ['outline', 'outline-variant'],
    'Surface Containers': ['surface-container-lowest', 'surface-container-low', 'surface-container', 'surface-container-high', 'surface-container-highest'],
    'Alternative Surfaces': ['surface-dim', 'surface-bright', 'scrim', 'disabled-opacity', 'inverse-surface', 'inverse-on-surface'],
};

const NEUTRAL_STATE_BASES = [
    'surface', 'outline', 'surface-variant', 'inverse-surface', 'shadow', 'outline-variant',
    'surface-container-highest', 'surface-container-high', 'surface-container',
    'surface-container-low', 'surface-container-lowest', 'surface-bright', 'surface-dim',
    'on-surface', 'on-surface-variant',
];

/**
 * Not a Figma variable: the M3 disabled-content opacity. Figma applies it as
 * a layer opacity rather than a variable, and components read it from here.
 */
const CODE_ONLY_NEUTRALS = { 'disabled-opacity': '0.38' };

/**
 * `{token: cssValue}` for one collection, through `toToken`. Two variables that
 * land on one token must agree (`Neutral Colors/on-surface` and `Neutral
 * Colors/Surface container/on-surface` do); a disagreement is a refusal, not a
 * last-one-wins.
 */
function collectColors(collection, toToken, file) {
    const mode = Object.keys(collection.modes)[0];
    const map = {};
    for (const v of collection.variables) {
        if (v.resolvedType !== 'COLOR') continue;
        const token = toToken(v.name);
        if (!token) continue;
        const resolved = v.resolvedValuesByMode[mode];
        if (!resolved || resolved.r === undefined) {
            throw new Error(`${file}: ${v.name} has no resolved colour. Export it with every alias resolved.`);
        }
        const value = cssColor(resolved);
        if (map[token] !== undefined && map[token] !== value) {
            throw new Error(`${file}: two variables map to --color-${token} with different values (${map[token]}, ${value}).`);
        }
        map[token] = value;
    }
    return map;
}

/**
 * Process and generate colors SCSS
 */
function generateColorsSCSS() {
    const accent = JSON.parse(fs.readFileSync(`${SOURCE_DIR}/colors _ accent.json`, 'utf8'));
    const neutral = JSON.parse(fs.readFileSync(`${SOURCE_DIR}/colors _ neutral.json`, 'utf8'));

    const accentMap = collectColors(accent, accentToken, 'colors _ accent.json');
    const neutralMap = collectColors(neutral, neutralToken, 'colors _ neutral.json');

    let scss = `/**
 * Material Design 3 Color Tokens
 * Generated from Figma design system
 * Follows M3 color role guidance: https://m3.material.io/styles/color/roles
 */

:root {
    /* ============================================
       ACCENT COLORS - Material Design 3 Roles
       ============================================ */
`;

    for (const family of ACCENT_FAMILIES) {
        const f = slug(family);
        const { roles, states } = familyOrder(f);
        const target = ALIASED_FAMILIES[family];
        const line = (token) => {
            if (!target) return accentMap[token] === undefined ? '' : `    --color-${token}: ${accentMap[token]};\n`;
            const twin = token.replace(f, slug(target));
            if (accentMap[twin] === undefined) return '';
            if (accentMap[token] !== undefined && accentMap[token] !== accentMap[twin]) {
                throw new Error(
                    `colors _ accent.json: --color-${token} is ${accentMap[token]} but --color-${twin} is ` +
                    `${accentMap[twin]}. ${family} is written as an alias of ${target}; they have to agree.`,
                );
            }
            return `    --color-${token}: var(--color-${twin});\n`;
        };
        const note = target ? `    /* ${family} aliases to ${target} */\n` : '';
        scss += `\n    /* ${family} Colors */\n${note}${roles.map(line).join('')}`;
        scss += `\n    /* ${family} State Layers */\n${note}${states.map(line).join('')}`;
    }

    scss += `
    /* ============================================
       NEUTRAL COLORS - Material Design 3
       ============================================ */
`;

    const neutralValues = { ...neutralMap, ...CODE_ONLY_NEUTRALS };
    for (const [group, keys] of Object.entries(NEUTRAL_GROUPS)) {
        scss += `\n    /* ${group} */\n`;
        for (const key of keys) {
            if (neutralValues[key] !== undefined) scss += `    --color-${key}: ${neutralValues[key]};\n`;
        }
    }

    scss += `
    /* ============================================
       NEUTRAL STATE LAYERS
       ============================================ */
`;
    for (const base of NEUTRAL_STATE_BASES) {
        const keys = ['08', '12', '16'].map((l) => `${base}-state-${l}`).filter((k) => neutralMap[k] !== undefined);
        if (!keys.length) continue;
        scss += `\n    /* ${base} */\n`;
        for (const key of keys) scss += `    --color-${key}: ${neutralMap[key]};\n`;
    }

    /*
     * Anything the maps produced that no list above placed. Written rather than
     * dropped, so a new Figma role shows up in the diff instead of vanishing.
     */
    const placed = new Set([
        ...ACCENT_FAMILIES.flatMap((f) => Object.values(familyOrder(slug(f))).flat()),
        ...Object.values(NEUTRAL_GROUPS).flat(),
        ...NEUTRAL_STATE_BASES.flatMap((b) => ['08', '12', '16'].map((l) => `${b}-state-${l}`)),
    ]);
    const unplaced = Object.entries({ ...accentMap, ...neutralMap }).filter(([k]) => !placed.has(k));
    if (unplaced.length) {
        scss += `\n    /* Unsorted (add these to an order list in generate-all-tokens.js) */\n`;
        for (const [key, value] of unplaced) scss += `    --color-${key}: ${value};\n`;
    }

    scss += `}\n`;

    return scss;
}

/**
 * Generate primitives SCSS
 */
function generatePrimitivesSCSS() {
    const primitives = JSON.parse(fs.readFileSync(`${SOURCE_DIR}/size _ primitive.json`, 'utf8'));
    const mode = Object.keys(primitives.modes)[0];

    let scss = `/**
 * Primitive Size Tokens
 * Base values used to build semantic tokens
 * DO NOT USE DIRECTLY - Use semantic tokens instead
 */

:root {
    /* Spacing Primitives */\n`;

    const spacing = [];
    const radius = [];
    const stroke = [];

    primitives.variables.forEach(v => {
        const val = v.valuesByMode[mode];
        if (val === undefined || val === null) return;

        const resolved = v.resolvedValuesByMode[mode];
        const value = resolved?.resolvedValue ?? val;

        const name = v.name.toLowerCase().replace(/\//g, '-');

        if (name.includes('spacing') || name.includes('space-')) {
            spacing.push({ name, value });
        } else if (name.includes('radius')) {
            radius.push({ name, value });
        } else if (name.includes('stroke')) {
            stroke.push({ name, value });
        }
    });

    // Sort and output spacing
    spacing.sort((a, b) => {
        const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');
        return numA - numB;
    });

    spacing.forEach(item => {
        const varName = item.name.replace(/^spacing\//, '').replace(/^small\//, '').replace(/^medium\//, '').replace(/^large\//, '');
        scss += `    --size-${varName}: ${item.value}px;\n`;
    });

    scss += `\n    /* Border Radius Primitives */\n`;
    radius.sort((a, b) => {
        const numA = parseInt(a.name.match(/\d+/)?.[0] || '0');
        const numB = parseInt(b.name.match(/\d+/)?.[0] || '0');
        return numA - numB;
    });

    radius.forEach(item => {
        const varName = item.name.replace(/^border\/radius\//, '').replace(/^border\/radius\//, '');
        scss += `    --size-${varName}: ${item.value}px;\n`;
    });

    scss += `\n    /* Stroke/Border Width Primitives */\n`;
    stroke.sort((a, b) => {
        const numA = parseFloat(a.name.match(/\d+\.?\d*/)?.[0] || '0');
        const numB = parseFloat(b.name.match(/\d+\.?\d*/)?.[0] || '0');
        return numA - numB;
    });

    stroke.forEach(item => {
        const varName = item.name.replace(/^border\/stroke\//, '');
        scss += `    --size-${varName}: ${item.value}px;\n`;
    });

    scss += `}\n`;

    return scss;
}

/**
 * Generate semantic tokens SCSS
 */
function generateSemanticsSCSS() {
    const semantics = JSON.parse(fs.readFileSync(`${SOURCE_DIR}/size _ semantics.json`, 'utf8'));
    const mode = Object.keys(semantics.modes)[0];

    let scss = `/**
 * Semantic Spacing Tokens
 * These are the tokens designers and developers should use
 * Organized by component layer: Elements, Cards, Sections, Modals, Surfaces, Surface Containers
 */

:root {
`;

    // Organize by layer
    const layers = {
        'element': [],
        'card': [],
        'section': [],
        'modal': [],
        'surface': [],
        'surface-container': [],
        'table': [],
    };

    semantics.variables.forEach(v => {
        const val = v.valuesByMode[mode];
        if (!val) return;

        const resolved = v.resolvedValuesByMode[mode];
        let value;

        if (val.type === 'VARIABLE_ALIAS') {
            value = resolved?.resolvedValue;
        } else {
            value = val;
        }

        if (value === undefined || value === null) return;

        const name = v.name.toLowerCase().replace(/\//g, '-');
        let layer = null;

        if (name.startsWith('element')) layer = 'element';
        else if (name.startsWith('card')) layer = 'card';
        else if (name.startsWith('section')) layer = 'section';
        else if (name.startsWith('modal')) layer = 'modal';
        else if (name.startsWith('surface-container')) layer = 'surface-container';
        else if (name.startsWith('surface') && !name.includes('container')) layer = 'surface';
        else if (name.startsWith('table')) layer = 'table';

        if (layer && layers[layer]) {
            layers[layer].push({ name, value });
        }
    });

    // Add missing semantic tokens (additive only - never modify existing)
    // Check if element-radius-pill exists, if not add it
    const elementLayer = layers['element'] || [];
    const hasRadiusPill = elementLayer.some(item =>
        item.name.includes('element-radius-pill') ||
        item.name.includes('radius-pill') ||
        item.name === 'element-radius-pill'
    );

    if (!hasRadiusPill) {
        // Get primitive value for radius-1000 (999px)
        let radiusPillValue = 999; // Default fallback
        try {
            const primitives = JSON.parse(fs.readFileSync(`${SOURCE_DIR}/size _ primitive.json`, 'utf8'));
            const primitiveMode = Object.keys(primitives.modes)[0];
            const radius1000 = primitives.variables.find(v => {
                const name = v.name.toLowerCase();
                return name.includes('radius-1000') || name.includes('radius/radius-1000');
            });
            if (radius1000) {
                const val = radius1000.valuesByMode[primitiveMode];
                const resolved = radius1000.resolvedValuesByMode[primitiveMode];
                radiusPillValue = resolved?.resolvedValue ?? val ?? 999;
            }
        } catch (e) {
            console.warn('Warning: Could not read primitives file, using default 999px for radius-pill');
        }

        // Add to element layer array so it gets processed naturally
        layers['element'].push({
            name: 'element-radius-pill',
            value: radiusPillValue
        });
    }

    // Output by layer
    const layerOrder = ['element', 'card', 'section', 'modal', 'surface', 'surface-container', 'table'];
    const layerLabels = {
        'element': 'Elements Layer',
        'card': 'Cards Layer',
        'section': 'Sections Layer',
        'modal': 'Modals Layer',
        'surface': 'Surfaces Layer',
        'surface-container': 'Surface Containers Layer',
        'table': 'Table Tokens',
    };

    layerOrder.forEach(layer => {
        if (layers[layer].length > 0) {
            scss += `\n    /* ${layerLabels[layer]} */\n`;

            // Sort: padding first, then gap, then radius, then border
            const sorted = layers[layer].sort((a, b) => {
                const order = ['pad-x', 'pad-y', 'gap', 'radius', 'stroke', 'border'];
                const aType = order.findIndex(o => a.name.includes(o));
                const bType = order.findIndex(o => b.name.includes(o));
                if (aType !== bType) return aType - bType;
                return a.name.localeCompare(b.name);
            });

            sorted.forEach(item => {
                const varName = item.name;
                // Add comment for radius-pill token
                const comment = varName === 'element-radius-pill'
                    ? ' /* Fully rounded (pill shape) */'
                    : '';
                scss += `    --size-${varName}: ${item.value}px;${comment}\n`;
            });
        }
    });

    scss += `}\n`;

    return scss;
}

/**
 * Generate layout tokens SCSS
 */
function generateLayoutSCSS() {
    const layout = JSON.parse(fs.readFileSync(`${SOURCE_DIR}/size _ layout.json`, 'utf8'));

    let scss = `/**
 * Layout Tokens
 * Breakpoints, containers, and column widths
 */

:root {
    /* Breakpoints */\n`;

    // Extract breakpoints
    const breakpoints = {};
    layout.variables.forEach(v => {
        if (v.name.includes('Breakpoints')) {
            const modes = v.valuesByMode;
            Object.entries(modes).forEach(([modeKey, value]) => {
                if (typeof value === 'number') {
                    const modeName = layout.modes[modeKey];
                    if (!breakpoints[modeName]) breakpoints[modeName] = {};
                    if (v.name.includes('min')) {
                        breakpoints[modeName].min = value;
                    } else if (v.name.includes('max')) {
                        breakpoints[modeName].max = value;
                    }
                }
            });
        }
    });

    // Output breakpoints
    Object.entries(breakpoints).forEach(([mode, { min, max }]) => {
        if (min) scss += `    --breakpoint-${mode.toLowerCase()}-min: ${min}px;\n`;
        if (max) scss += `    --breakpoint-${mode.toLowerCase()}-max: ${max}px;\n`;
    });

    scss += `\n    /* App shell + content grid (mirrors the Figma size/layout collection) */\n`;
    scss += `    --layout-sidebar-width: 164px; /* SideNav fixed width */\n`;
    scss += `    --layout-grid-gap: 8px; /* content-grid gutter (= --size-element-gap-sm); col-* spans assume this */\n`;

    // Content-grid column spans (12 cols, 8px gutter) at each breakpoint minimum.
    // Main content width: MD 672 / LG 748 / XL 1164 (= viewport − outer pad − SideNav − gap − surface pad).
    const contentWidths = { md: 672, lg: 748, xl: 1164 };
    const colSpans = (w) => {
        const col1 = (w - 8 * 11) / 12;
        return Array.from({ length: 12 }, (_, i) => +(col1 * (i + 1) + 8 * i).toFixed(2));
    };
    scss += `\n    /* Content-grid column spans — MD (768) values; LG/XL override below */\n`;
    colSpans(contentWidths.md).forEach((v, i) => { scss += `    --col-${i + 1}: ${v}px;\n`; });
    scss += `}\n`;
    scss += `\n@media (min-width: 1024px) {\n    :root {\n`;
    colSpans(contentWidths.lg).forEach((v, i) => { scss += `        --col-${i + 1}: ${v}px;\n`; });
    scss += `    }\n}\n`;
    scss += `\n@media (min-width: 1440px) {\n    :root {\n`;
    colSpans(contentWidths.xl).forEach((v, i) => { scss += `        --col-${i + 1}: ${v}px;\n`; });
    scss += `    }\n}\n`;

    return scss;
}

/**
 * Validate generated SCSS files to ensure no primitive tokens are used
 */
function validateSemanticTokens(scssContent, filename) {
    // List of primitive token patterns that should NOT appear in semantic files
    const primitivePatterns = [
        /--size-spacing-/,
        /--size-border-radius-radius-/,
        /--size-border-stroke-stroke-/,
    ];

    const errors = [];
    primitivePatterns.forEach(pattern => {
        const matches = scssContent.match(new RegExp(pattern, 'g'));
        if (matches) {
            matches.forEach(match => {
                errors.push(`Primitive token found in ${filename}: ${match}`);
            });
        }
    });

    return errors;
}


// Generate all files
//
// EVERY FILE IS BUILT IN MEMORY FIRST. This used to write each one as it was
// produced, immediately below a warning that said generation was "DISABLED to
// protect existing tokens" — a `console.warn` with no return and no exit, so
// the protection it announced did not exist. One run on 2026-08-29 took
// `_colors.scss` from 195 colour tokens to 5 and reported success. See
// `scripts/token-generation.mjs` for the rule and the measurement.
console.log('Generating token SCSS files...');

const OUT_DIR = TOKEN_DIR;
const built = [
    { file: '_colors.scss', generated: generateColorsSCSS() },
    { file: '_primitives.scss', generated: generatePrimitivesSCSS() },
    { file: '_spacing_semantics.scss', generated: generateSemanticsSCSS() },
    { file: '_layout.scss', generated: generateLayoutSCSS() },
].map((entry) => ({
    ...entry,
    committed: fs.existsSync(path.join(OUT_DIR, entry.file))
        ? fs.readFileSync(path.join(OUT_DIR, entry.file), 'utf8')
        : '',
}));

const comparisons = compare(built);
const refused = refusals(comparisons);
const force = process.argv.includes('--force');
const dryRun = process.argv.includes('--dry-run');

for (const c of comparisons) {
    const delta = c.after - c.before;
    const sign = delta > 0 ? `+${delta}` : `${delta}`;
    console.log(`   ${c.file.padEnd(24)} ${String(c.before).padStart(4)} -> ${String(c.after).padStart(4)} (${sign})`);
}

if (refused.length && !force) {
    console.error('\n❌ Refusing to write. A generator may not shrink the thing it generates.\n');
    for (const line of refused) console.error(`   ${line}`);
    console.error(
        `\n   The source JSONs under ${SOURCE_DIR}/ no longer\n` +
        '   resolve to the full library — export them from Figma with every\n' +
        '   variable resolved, then run this again. Nothing was written.\n' +
        '\n   `--force` writes anyway, and is for a deliberate REMOVAL of tokens.\n' +
        '   It is not the way past an incomplete export.\n',
    );
    process.exit(1);
}

if (dryRun) {
    console.log('\n--dry-run: nothing written. No file would lose a token.');
    process.exit(0);
}

for (const { file, generated } of built) {
    fs.writeFileSync(path.join(OUT_DIR, file), generated);
    console.log(`✅ Generated ${OUT_DIR}/${file}`);
}

if (refused.length && force) {
    console.warn(`\n⚠️  --force: wrote anyway, deleting ${refused.length} file(s) worth of tokens.`);
}

console.log('\n✅ All token files generated successfully!');
/*
 * `validateSemanticTokens` is still not run — see the commented-out block above.
 * This line used to read "✅ Validation passed: No primitive tokens found in
 * semantic files", printed unconditionally beside a validation that had been
 * commented out, which is a claim rather than a result. The validation would
 * report 48 findings today: `_spacing_semantics.scss` uses `--size-spacing-*`
 * throughout, which is the pattern it forbids. Turning it on means deciding
 * whether that pattern is wrong or the rule is; neither is decided here, and
 * neither is served by printing that it passed.
 */
console.log('ℹ️  Semantic-token validation is DISABLED (48 known findings). Not run, not passed.');

