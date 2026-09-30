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

/*
 * SIZE TOKENS
 *
 * The three `size / *` collections are exported whole. Where the stylesheets
 * and Figma disagree, the stylesheets win for now and the disagreement is
 * written down here, one constant per kind, so that it is a stated exception
 * rather than a silent one. Each is a known difference from Figma, not a
 * decision that Figma is wrong.
 */

/** `Spacing/Small/space-000` -> `spacing-small-space-000`, `Surface Container/pad-x-sm` -> `surface-container-pad-x-sm`. */
const sizeSlug = (name) => name.trim().toLowerCase().replace(/\s*\/\s*/g, '-').replace(/\s+/g, '-');

/** A size in CSS: `8px`, `1.5px`, `1023.98px`. */
const px = (n) => `${+Number(n).toFixed(2)}px`;

function readSource(file) {
    const json = JSON.parse(fs.readFileSync(`${SOURCE_DIR}/${file}`, 'utf8'));
    return { json, modes: Object.keys(json.modes) };
}

/**
 * Primitives the stylesheet declares that Figma does not have. They are kept
 * because components read them (the larger spacing steps and the column-width
 * proxies each have a user).
 */
const CODE_ONLY_PRIMITIVES = {
    spacing: {
        'spacing-large-space-1200': 96,
        'spacing-large-space-1500': 120,
        'spacing-xlarge-space-2000': 160,
        'spacing-xlarge-space-2500': 200,
        'spacing-xlarge-space-5000': 400,
    },
    column: { 'column-xs': 60, 'column-sm': 80, 'column-md': 100, 'column-lg': 120 },
};

/** `{id: {token, value}}` for every Figma primitive, keyed by variable id so semantics can point at them. */
function primitiveTokens() {
    const { json, modes } = readSource('size _ primitive.json');
    const byId = {};
    for (const v of json.variables) {
        const value = v.resolvedValuesByMode[modes[0]];
        if (typeof value !== 'number') throw new Error(`size _ primitive.json: ${v.name} has no numeric value.`);
        byId[v.id] = { token: sizeSlug(v.name), value };
    }
    return byId;
}

/**
 * Generate primitives SCSS
 */
function generatePrimitivesSCSS() {
    const groups = { spacing: [], radius: [], stroke: [] };
    for (const { token, value } of Object.values(primitiveTokens())) {
        const group = token.startsWith('spacing-') ? 'spacing' : token.includes('-radius-') ? 'radius' : token.includes('-stroke-') ? 'stroke' : null;
        if (!group) throw new Error(`size _ primitive.json: no group for --size-${token}.`);
        groups[group].push({ token, value });
    }
    for (const [token, value] of Object.entries(CODE_ONLY_PRIMITIVES.spacing)) groups.spacing.push({ token, value });

    const step = ({ token }) => parseFloat(token.match(/(\d+(?:\.\d+)?)$/)[1]);
    const lines = (items) => items.sort((a, b) => step(a) - step(b)).map(({ token, value }) => `    --size-${token}: ${px(value)};\n`).join('');

    return `/**
 * Primitive Size Tokens
 * Base values used to build semantic tokens
 * DO NOT USE DIRECTLY - Use semantic tokens instead
 */

:root {
    /* Spacing Primitives */
${lines(groups.spacing)}
    /* Column Width Proxies (not Figma variables; see CODE_ONLY_PRIMITIVES) */
${Object.entries(CODE_ONLY_PRIMITIVES.column).map(([token, value]) => `    --size-${token}: ${px(value)};\n`).join('')}
    /* Border Radius Primitives */
${lines(groups.radius)}
    /* Stroke/Border Width Primitives */
${lines(groups.stroke)}}
`;
}

/**
 * Semantic tokens whose value differs from Figma's alias: token -> the
 * primitive it points at instead. `element-radius-sm` is radius-100 (4px)
 * where Figma's `Element/radius-sm` is radius-50 (2px); `surface-container-
 * gap-md` is space-300 (16px) where Figma's `Surface Container/gap-md` is
 * space-600 (32px).
 */
const SEMANTIC_OVERRIDES = {
    'element-radius-sm': 'border-radius-radius-100',
    'surface-container-gap-md': 'spacing-medium-space-300',
};

/** Semantic tokens the stylesheet declares that Figma does not have. */
const CODE_ONLY_SEMANTICS = {
    'surface-container-pad-x': 'spacing-medium-space-300',
    'surface-container-pad-y': 'spacing-medium-space-200',
    'table-radius-md': 'border-radius-radius-200',
    'table-radius-sm': 'border-radius-radius-150',
};

/**
 * Figma semantic variables not written yet. The Surface Container set is named
 * differently from the stylesheet's, and `Table/row-radius` aliases a spacing
 * primitive where the stylesheet has two radius tokens; adding them is a
 * separate change.
 */
const SEMANTICS_NOT_WRITTEN = new Set([
    'surface-container-pad-x-sm', 'surface-container-pad-x-md',
    'surface-container-pad-y-sm', 'surface-container-pad-y-md',
    'surface-container-gap-sm', 'surface-container-border',
    'table-row-radius',
]);

/**
 * Generate semantic tokens SCSS
 */
function generateSemanticsSCSS() {
    const primitives = primitiveTokens();
    const primitiveNames = new Set(Object.values(primitives).map((p) => p.token));
    const { json, modes } = readSource('size _ semantics.json');

    const values = {};
    for (const v of json.variables) {
        const token = sizeSlug(v.name);
        if (SEMANTICS_NOT_WRITTEN.has(token)) continue;
        const val = v.valuesByMode[modes[0]];
        if (val?.type === 'VARIABLE_ALIAS') {
            const target = primitives[val.id];
            if (!target) throw new Error(`size _ semantics.json: ${v.name} aliases ${val.id}, which is not a primitive.`);
            values[token] = `var(--size-${target.token})`;
        } else if (typeof val === 'number') {
            values[token] = px(val);
        } else {
            throw new Error(`size _ semantics.json: ${v.name} has neither an alias nor a number.`);
        }
    }
    for (const [token, primitive] of Object.entries({ ...CODE_ONLY_SEMANTICS, ...SEMANTIC_OVERRIDES })) {
        if (!primitiveNames.has(primitive) && !(primitive in CODE_ONLY_PRIMITIVES.spacing)) {
            throw new Error(`generate-all-tokens.js: --size-${token} points at --size-${primitive}, which is not generated.`);
        }
        values[token] = `var(--size-${primitive})`;
    }

    const layers = [
        ['element', 'Elements Layer'],
        ['card', 'Cards Layer'],
        ['section', 'Sections Layer'],
        ['modal', 'Modals Layer'],
        ['surface-container', 'Surface Containers Layer'],
        ['surface', 'Surfaces Layer'],
        ['table', 'Table Tokens'],
    ];
    const order = ['cell', 'pad-x', 'pad-y', 'gap', 'radius', 'stroke', 'border'];
    const kind = (token) => order.findIndex((o) => token.includes(`-${o}`));

    const byLayer = Object.fromEntries(layers.map(([layer]) => [layer, []]));
    for (const token of Object.keys(values)) {
        const layer = layers.find(([l]) => token.startsWith(`${l}-`));
        if (!layer) throw new Error(`size _ semantics.json: no layer for --size-${token}.`);
        byLayer[layer[0]].push(token);
    }

    let scss = `/**
 * Semantic Spacing Tokens
 * These are the tokens designers and developers should use
 * Organized by component layer: Elements, Cards, Sections, Modals, Surfaces, Surface Containers
 */

:root {
`;
    // Surfaces before Surface Containers in the output, as the stylesheet always had them.
    for (const layer of ['element', 'card', 'section', 'modal', 'surface', 'surface-container', 'table']) {
        const full = (t) => (t.endsWith('-full') ? 1 : 0);
        const tokens = byLayer[layer].sort((a, b) => kind(a) - kind(b) || full(a) - full(b) || a.localeCompare(b));
        if (!tokens.length) continue;
        scss += `\n    /* ${layers.find(([l]) => l === layer)[1]} */\n`;
        for (const token of tokens) scss += `    --size-${token}: ${values[token]};\n`;
    }
    scss += `}\n`;
    return scss;
}

/** Figma's layout mode names to breakpoint keys. */
const BREAKPOINT_KEYS = { 'Medium (768px)': 'md', 'Large (1024px)': 'lg', 'X-Large (1440px)': 'xl' };

/**
 * Breakpoints that differ from Figma or are not in it: Figma's X-Large ends at
 * 1800, the stylesheet at 1919.98 with an XXL step from 1920.
 */
const BREAKPOINT_OVERRIDES = { 'xl-max': 1919.98 };
const CODE_ONLY_BREAKPOINTS = { 'xxl-min': 1920 };

/**
 * Generate layout tokens SCSS
 *
 * Reads `Breakpoints/*`, `Columns/*` and `Grid/content-gutter`. Not written
 * yet: `Display/*`, `Grid/columns`, `Grid/viewport-gutter`,
 * `Grid/viewport-margin` and `Min Heights/*`.
 */
function generateLayoutSCSS() {
    const { json } = readSource('size _ layout.json');
    const modes = Object.entries(json.modes).map(([id, name]) => {
        if (!BREAKPOINT_KEYS[name]) throw new Error(`size _ layout.json: unknown mode "${name}".`);
        return { id, key: BREAKPOINT_KEYS[name] };
    });
    const variable = (name) => {
        const v = json.variables.find((x) => x.name === name);
        if (!v) throw new Error(`size _ layout.json: no ${name}.`);
        return (mode) => v.resolvedValuesByMode[mode.id];
    };

    const breakpoints = {};
    const min = variable('Breakpoints/min width');
    const max = variable('Breakpoints/max width');
    for (const mode of modes) {
        breakpoints[`${mode.key}-min`] = min(mode);
        breakpoints[`${mode.key}-max`] = max(mode);
    }
    Object.assign(breakpoints, BREAKPOINT_OVERRIDES, CODE_ONLY_BREAKPOINTS);

    const gutter = variable('Grid/content-gutter');
    const gutters = new Set(modes.map(gutter));
    if (gutters.size !== 1) throw new Error('size _ layout.json: Grid/content-gutter differs by mode; --layout-grid-gap is one value.');

    const columns = (mode, indent) =>
        Array.from({ length: 12 }, (_, i) => `${indent}--col-${i + 1}: ${px(variable(`Columns/col-${i + 1}`)(mode))};\n`).join('');

    let scss = `/**
 * Layout Tokens
 * Breakpoints, containers, and column widths
 */

:root {
    /* Breakpoints */
${Object.entries(breakpoints).map(([k, v]) => `    --breakpoint-${k}: ${px(v)};\n`).join('')}
    /* App shell + content grid (mirrors the Figma size/layout collection) */
    --layout-sidebar-width: 164px; /* SideNav fixed width */
    --layout-grid-gap: ${px([...gutters][0])}; /* content-grid gutter (= --size-element-gap-sm); col-* spans assume this */

    /* Content-grid column spans — ${modes[0].key.toUpperCase()} values; wider breakpoints override below */
${columns(modes[0], '    ')}}
`;
    for (const mode of modes.slice(1)) {
        scss += `\n@media (min-width: ${px(breakpoints[`${mode.key}-min`])}) {\n    :root {\n${columns(mode, '        ')}    }\n}\n`;
    }
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

