import fs from 'fs';
import path from 'path';

import { TOKEN_DIR } from '../design-system/src/lib/tokens-node.mjs';
import { tokenDeclarationPattern } from '../design-system/src/lib/tokens.mjs';
import { compare, refusals } from './token-generation.mjs';
import { FRAME_LAYER_COLLECTIONS, frameLayerFile, frameLayerFolder, frameLayerToken } from './lib/frame-layer-collections.mjs';
import { TYPOGRAPHY_FILE, TYPOGRAPHY_FOLDERS, typographyFolder, typographyToken } from './lib/typography-collection.mjs';

/**
 * The Figma exports the SCSS is generated FROM, and where the SCSS lands.
 * Both hang off `TOKEN_DIR` rather than being spelled seven times, so moving
 * the token directory is one edit and the generator cannot end up reading one
 * tree and writing another.
 */
const SOURCE_DIR = `${TOKEN_DIR}/source`;

/**
 * One export from `SOURCE_DIR` and its mode ids. `oneMode` is for the
 * collections this generator reads a single value from: a second mode there is
 * a refusal, not a silent read of whichever mode happens to come first.
 */
function readSource(file, { oneMode = false } = {}) {
    const json = JSON.parse(fs.readFileSync(`${SOURCE_DIR}/${file}`, 'utf8'));
    const modes = Object.keys(json.modes);
    if (oneMode && modes.length !== 1) {
        throw new Error(
            `${file}: ${modes.length} modes (${Object.values(json.modes).join(', ')}). ` +
            'This collection is written as one set of values; say which mode is the stylesheet before reading it.',
        );
    }
    return { json, modes };
}

/**
 * Every exception constant below is checked against the export it excuses.
 * An override Figma now agrees with, or a code-only name Figma now has, is
 * no longer an exception, and keeping it would hide the next real difference.
 * Each such case lands here and the run refuses before writing anything.
 */
const staleExceptions = [];
const stale = (constant, message) => staleExceptions.push(`${constant}: ${message}`);

/**
 * A name as a token: `Social-Emotional` -> `social-emotional`,
 * `Spacing/Small/space-000` -> `spacing-small-space-000`.
 */
const slug = (name) => name.trim().toLowerCase().replace(/\s*\/\s*/g, '-').replace(/\s+/g, '-');

/** The state-layer opacities, in the order they are written. */
const STATE_LEVELS = ['08', '12', '16'];

/**
 * A Figma color ({r, g, b, a} in 0–1) as CSS: `#rrggbb` when opaque, `rgba()`
 * with the alpha at up to three places otherwise (0.08, not 0.080).
 */
function cssColor({ r, g, b, a = 1 }) {
    const byte = (n) => Math.round(n * 255);
    if (a < 1) return `rgba(${byte(r)}, ${byte(g)}, ${byte(b)}, ${+a.toFixed(3)})`;
    return '#' + [r, g, b].map((n) => byte(n).toString(16).padStart(2, '0')).join('');
}

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
 * refuses if any Info variable stops resolving to its Tertiary twin's color.
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

    const state = leaf.match(new RegExp(`^State-layers/(.+) (${STATE_LEVELS.join('|')})$`));
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
    return {
        roles: [f, `${f}-text`, `on-${f}`, `${f}-container`, `on-${f}-container`, `inverse-${f}`, `${f}-border-subtle`],
        states: [...STATE_LEVELS.map((l) => `${f}-state-${l}`), ...STATE_LEVELS.map((l) => `${f}-container-state-${l}`)],
    };
}

/**
 * `Neutral Colors/Alternative/surface-dim` -> `surface-dim`,
 * `State-layers/on surface/opacity-0_08` -> `on-surface-state-08`, or `null`
 * for the `Surface roles/*` aliases, which are not part of this file.
 */
function neutralToken(name) {
    const state = name.match(new RegExp(`^State-layers/(.+)/opacity-0_(${STATE_LEVELS.join('|')})$`));
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
function collectColors(file, toToken) {
    const { json, modes: [mode] } = readSource(file, { oneMode: true });
    const map = {};
    for (const v of json.variables) {
        if (v.resolvedType !== 'COLOR') continue;
        const token = toToken(v.name);
        if (!token) continue;
        const resolved = v.resolvedValuesByMode[mode];
        if (!resolved || resolved.r === undefined) {
            throw new Error(`${file}: ${v.name} has no resolved color. Export it with every alias resolved.`);
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
    const accentMap = collectColors('colors _ accent.json', accentToken);
    const neutralMap = collectColors('colors _ neutral.json', neutralToken);

    const neutralNames = new Set(readSource('colors _ neutral.json').json.variables.map((v) => neutralToken(v.name)));
    for (const key of Object.keys(CODE_ONLY_NEUTRALS)) {
        if (neutralNames.has(key)) stale('CODE_ONLY_NEUTRALS', `--color-${key} is now a Figma variable; read it from the export.`);
    }

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
        const keys = STATE_LEVELS.map((l) => `${base}-state-${l}`).filter((k) => neutralMap[k] !== undefined);
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
        ...NEUTRAL_STATE_BASES.flatMap((b) => STATE_LEVELS.map((l) => `${b}-state-${l}`)),
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

/** A size in CSS: `8px`, `1.5px`, `1023.98px`. */
const px = (n) => `${+Number(n).toFixed(2)}px`;

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
    const { json, modes: [mode] } = readSource('size _ primitive.json', { oneMode: true });
    const byId = {};
    for (const v of json.variables) {
        const value = v.resolvedValuesByMode[mode];
        if (typeof value !== 'number') throw new Error(`size _ primitive.json: ${v.name} has no numeric value.`);
        byId[v.id] = { token: slug(v.name), value };
    }
    return byId;
}

/**
 * Generate primitives SCSS
 */
function generatePrimitivesSCSS() {
    const primitives = Object.values(primitiveTokens());
    const figmaNames = new Set(primitives.map((p) => p.token));
    for (const token of Object.values(CODE_ONLY_PRIMITIVES).flatMap(Object.keys)) {
        if (figmaNames.has(token)) stale('CODE_ONLY_PRIMITIVES', `--size-${token} is now a Figma variable; read it from the export.`);
    }

    const groups = { spacing: [], radius: [], stroke: [] };
    for (const { token, value } of primitives) {
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
 * where the Figma export in `source/` still says radius-50 (2px). Storybook
 * won that conflict, and Figma's `Element/radius-sm` now points at radius-100,
 * so the next `sync:tokens` makes this override stale and the check below
 * asks for it to be deleted. `surface-container-gap-md` is space-300 (16px)
 * where Figma's `Surface Container/gap-md` is space-600 (32px).
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

/** The semantic layers in the order they are written. */
const SEMANTIC_LAYERS = [
    { prefix: 'element', heading: 'Elements Layer' },
    { prefix: 'card', heading: 'Cards Layer' },
    { prefix: 'section', heading: 'Sections Layer' },
    { prefix: 'modal', heading: 'Modals Layer' },
    { prefix: 'surface', heading: 'Surfaces Layer' },
    { prefix: 'surface-container', heading: 'Surface Containers Layer' },
    { prefix: 'table', heading: 'Table Tokens' },
];

/**
 * Within a layer, tokens are written by kind in this order, then by size with
 * `-full` last. A token of a kind not listed here is a refusal.
 */
const SEMANTIC_KINDS = ['cell-x', 'cell-y', 'cell-gap', 'pad-x', 'pad-y', 'gap', 'radius', 'stroke', 'border'];

/**
 * Generate semantic tokens SCSS
 */
function generateSemanticsSCSS() {
    const primitives = primitiveTokens();
    const primitiveNames = new Set(Object.values(primitives).map((p) => p.token));
    const { json, modes: [mode] } = readSource('size _ semantics.json', { oneMode: true });

    const figmaNames = new Set(json.variables.map((v) => slug(v.name)));
    for (const token of SEMANTICS_NOT_WRITTEN) {
        if (!figmaNames.has(token)) stale('SEMANTICS_NOT_WRITTEN', `Figma no longer has ${token}; drop it from the list.`);
    }
    for (const token of Object.keys(CODE_ONLY_SEMANTICS)) {
        if (figmaNames.has(token)) stale('CODE_ONLY_SEMANTICS', `--size-${token} is now a Figma variable; read it from the export.`);
    }

    const values = {};
    for (const v of json.variables) {
        const token = slug(v.name);
        if (SEMANTICS_NOT_WRITTEN.has(token)) continue;
        const val = v.valuesByMode[mode];
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
    for (const [token, primitive] of Object.entries(SEMANTIC_OVERRIDES)) {
        if (values[token] === undefined) {
            stale('SEMANTIC_OVERRIDES', `Figma has no ${token}; it belongs in CODE_ONLY_SEMANTICS.`);
        } else if (values[token] === `var(--size-${primitive})`) {
            stale('SEMANTIC_OVERRIDES', `Figma's ${token} is now ${values[token]}, the same as the override; delete the override.`);
        }
    }
    for (const [token, primitive] of Object.entries({ ...CODE_ONLY_SEMANTICS, ...SEMANTIC_OVERRIDES })) {
        if (!primitiveNames.has(primitive) && !(primitive in CODE_ONLY_PRIMITIVES.spacing)) {
            throw new Error(`generate-all-tokens.js: --size-${token} points at --size-${primitive}, which is not generated.`);
        }
        values[token] = `var(--size-${primitive})`;
    }

    const byLayer = Object.fromEntries(SEMANTIC_LAYERS.map(({ prefix }) => [prefix, []]));
    for (const token of Object.keys(values)) {
        // Longest prefix first, so `surface-container-*` is not read as `surface-*`.
        const layer = SEMANTIC_LAYERS.filter(({ prefix }) => token.startsWith(`${prefix}-`))
            .sort((a, b) => b.prefix.length - a.prefix.length)[0];
        if (!layer) throw new Error(`size _ semantics.json: no layer for --size-${token}.`);
        byLayer[layer.prefix].push(token);
    }
    const kind = (token, prefix) => {
        const rest = token.slice(prefix.length + 1);
        const index = SEMANTIC_KINDS.findIndex((k) => rest === k || rest.startsWith(`${k}-`));
        if (index < 0) throw new Error(`size _ semantics.json: --size-${token} is none of SEMANTIC_KINDS.`);
        return index;
    };
    const full = (t) => (t.endsWith('-full') ? 1 : 0);

    let scss = `/**
 * Semantic Spacing Tokens
 * These are the tokens designers and developers should use
 * Organized by component layer: Elements, Cards, Sections, Modals, Surfaces, Surface Containers
 */

:root {
`;
    for (const { prefix, heading } of SEMANTIC_LAYERS) {
        const tokens = byLayer[prefix].sort((a, b) => kind(a, prefix) - kind(b, prefix) || full(a) - full(b) || a.localeCompare(b));
        if (!tokens.length) continue;
        scss += `\n    /* ${heading} */\n`;
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
 * Layout tokens the stylesheet declares that Figma does not have, with the
 * comment each is written with and `figmaName`, the slug the variable would
 * have in `size / layout` (whose names slug to `grid-*`, `breakpoints-*` and
 * so on, never `layout-*`). The SideNav is a fixed 164px wide; Figma draws it
 * at that width but has no variable for it.
 */
const CODE_ONLY_LAYOUT = {
    'layout-sidebar-width': { value: 164, note: 'SideNav fixed width', figmaName: 'grid-sidebar-width' },
};

/**
 * Stacking layers. Figma has no z-index, so these are code's alone and are
 * written unitless. The overlay layer sits above a modal (Bootstrap's 1055)
 * and level with its popovers, so a list opened from a field inside a modal
 * is not covered by it.
 */
const CODE_ONLY_LAYERS = {
    'layout-z-index-overlay': { value: 1070, note: 'floating listboxes and menus; above a modal' },
};

/**
 * Fixed dimensions Figma draws but has no variable for, written in px with
 * `figmaName`, the slug the variable would have in `size / layout`. The
 * spacing scale is pads, gaps and radii, so a box's own width (a checkbox, a
 * calendar day) has no semantic token to bind to; these are those widths,
 * named once so the components that share one stay in step.
 */
const CODE_ONLY_DIMENSIONS = {
    'layout-max-width-listbox': { value: 320, note: 'widest a field or button popup grows; a popup with columns is exempt', figmaName: 'max-widths-listbox' },
    'layout-width-join-row': { value: 520, note: 'Home Join button with the session Select beside it', figmaName: 'widths-join-row' },
    'layout-width-option-menu': { value: 240, note: 'the "…" menu on a TagInput row (Figma _Option menu)', figmaName: 'widths-option-menu' },
    'layout-control-checkbox': { value: 18, note: 'checkbox box', figmaName: 'controls-checkbox' },
    'layout-control-radio': { value: 12, note: 'radio dot', figmaName: 'controls-radio' },
    'layout-calendar-day-sm': { value: 28, note: 'calendar day, small picker', figmaName: 'calendar-day-sm' },
    'layout-calendar-day-md': { value: 36, note: 'calendar day, medium picker', figmaName: 'calendar-day-md' },
    'layout-calendar-day-lg': { value: 44, note: 'calendar day, large picker', figmaName: 'calendar-day-lg' },
    'layout-calendar-nav': { value: 32, note: 'calendar previous and next month buttons', figmaName: 'calendar-nav' },
};

/**
 * The semantic token the grid gutter is documented as equal to. The note is
 * checked, not trusted: Figma's `Grid/content-gutter` and this token's
 * resolved value have to match.
 */
const GRID_GAP_EQUALS = 'element-gap-sm';

/**
 * Generate layout tokens SCSS
 *
 * Reads `Breakpoints/*`, `Columns/*`, `Grid/content-gutter`, `Min Heights/*`
 * and `Max Heights/*`. Not written yet: `Display/*`, `Grid/columns`,
 * `Grid/viewport-gutter` and `Grid/viewport-margin`.
 *
 * `Min Heights/listbox` is `--layout-min-height-listbox`. A height the modes
 * agree on is written once; one that differs by breakpoint is written at its
 * first mode and overridden in each wider breakpoint's block, as the column
 * spans are.
 */
function generateLayoutSCSS() {
    const { json } = readSource('size _ layout.json');
    const figmaNames = new Set(json.variables.map((v) => slug(v.name)));
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
    for (const [key, value] of Object.entries(BREAKPOINT_OVERRIDES)) {
        if (breakpoints[key] === undefined) stale('BREAKPOINT_OVERRIDES', `Figma has no ${key}; it belongs in CODE_ONLY_BREAKPOINTS.`);
        else if (breakpoints[key] === value) stale('BREAKPOINT_OVERRIDES', `Figma's ${key} is now ${value}, the same as the override; delete the override.`);
    }
    for (const key of Object.keys(CODE_ONLY_BREAKPOINTS)) {
        if (breakpoints[key] !== undefined) stale('CODE_ONLY_BREAKPOINTS', `Figma now has ${key}; read it from the export.`);
    }
    for (const [token, { figmaName }] of Object.entries(CODE_ONLY_LAYOUT)) {
        if (figmaNames.has(figmaName)) stale('CODE_ONLY_LAYOUT', `Figma now has ${figmaName}; read --${token} from the export.`);
    }
    for (const [token, { figmaName }] of Object.entries(CODE_ONLY_DIMENSIONS)) {
        if (figmaNames.has(figmaName)) stale('CODE_ONLY_DIMENSIONS', `Figma now has ${figmaName}; read --${token} from the export.`);
    }
    Object.assign(breakpoints, BREAKPOINT_OVERRIDES, CODE_ONLY_BREAKPOINTS);

    const gutter = variable('Grid/content-gutter');
    const gutters = new Set(modes.map(gutter));
    if (gutters.size !== 1) throw new Error('size _ layout.json: Grid/content-gutter differs by mode; --layout-grid-gap is one value.');
    const gridGap = [...gutters][0];

    const semantics = readSource('size _ semantics.json', { oneMode: true });
    const twin = semantics.json.variables.find((v) => slug(v.name) === GRID_GAP_EQUALS);
    const twinValue = twin?.resolvedValuesByMode[semantics.modes[0]];
    if (twinValue !== gridGap) {
        stale('GRID_GAP_EQUALS', `Grid/content-gutter is ${gridGap} but ${GRID_GAP_EQUALS} is ${twinValue}; the note no longer holds.`);
    }

    const columns = (mode, indent) =>
        Array.from({ length: 12 }, (_, i) => `${indent}--col-${i + 1}: ${px(variable(`Columns/col-${i + 1}`)(mode))};\n`).join('');

    const heights = json.variables
        .map((v) => ({ v, match: /^(Min|Max) Heights\/(.+)$/.exec(v.name) }))
        .filter(({ match }) => match)
        .map(({ v, match }) => ({
            token: `layout-${match[1].toLowerCase()}-height-${slug(match[2])}`,
            figma: v.name,
            at: (mode) => v.resolvedValuesByMode[mode.id],
        }))
        .sort((a, b) => a.token.localeCompare(b.token));
    const varies = (h) => new Set(modes.map(h.at)).size > 1;
    const heightLines = (mode, indent, only) =>
        heights.filter(only).map((h) => `${indent}--${h.token}: ${px(h.at(mode))}; /* Figma ${h.figma} */\n`).join('');

    let scss = `/**
 * Layout Tokens
 * Breakpoints, containers, and column widths
 */

:root {
    /* Breakpoints */
${Object.entries(breakpoints).map(([k, v]) => `    --breakpoint-${k}: ${px(v)};\n`).join('')}
    /* App shell + content grid */
${Object.entries(CODE_ONLY_LAYOUT).map(([token, { value, note }]) => `    --${token}: ${px(value)}; /* ${note}; not a Figma variable (CODE_ONLY_LAYOUT) */\n`).join('')}\
    --layout-grid-gap: ${px(gridGap)}; /* Figma Grid/content-gutter (= --size-${GRID_GAP_EQUALS}); col-* spans assume this */

    /* Stacking layers; not Figma variables (CODE_ONLY_LAYERS) */
${Object.entries(CODE_ONLY_LAYERS).map(([token, { value, note }]) => `    --${token}: ${value}; /* ${note} */\n`).join('')}
    /* Min and max heights — ${modes[0].key.toUpperCase()} values where they differ by breakpoint */
${heightLines(modes[0], '    ', () => true)}
    /* Fixed dimensions; not Figma variables (CODE_ONLY_DIMENSIONS) */
${Object.entries(CODE_ONLY_DIMENSIONS).map(([token, { value, note }]) => `    --${token}: ${px(value)}; /* ${note} */\n`).join('')}
    /* Content-grid column spans — ${modes[0].key.toUpperCase()} values; wider breakpoints override below */
${columns(modes[0], '    ')}}
`;
    for (const mode of modes.slice(1)) {
        scss += `\n@media (min-width: ${px(breakpoints[`${mode.key}-min`])}) {\n    :root {\n${heightLines(mode, '        ', varies)}${columns(mode, '        ')}    }\n}\n`;
    }
    return scss;
}

/*
 * THE NEW SCALES
 *
 * The collections the layout, token and type system adds beside the old
 * `size / *` ones: spacing / primitives (space, radius, stroke and size,
 * hidden in Figma) and spacing / foundations, whose folders are Size (common
 * Height/Width plus Item, Row, Label, Field, Icon, Image), Element and Border.
 * They carry their own CSS names, so the old tokens keep resolving while each
 * use moves across.
 *
 * Nothing here derives a name. Each variable's WEB code syntax in Figma is its
 * CSS name, so a variable without one is a refusal rather than a guess, and
 * an alias is written as a `var()` of its target's code syntax, which keeps
 * "category tokens point at the common scales" true in the stylesheet too.
 */

/** The exports, in the order they are written; an alias may point at any of them. */
const SCALE_COLLECTIONS = [
    { file: 'spacing _ primitives.json', heading: 'spacing / primitives (hidden in Figma; point semantic tokens at these, not components)' },
    { file: 'spacing _ foundations.json', heading: 'spacing / foundations' },
];

/**
 * The variables with each folder kept together at every depth, folders in the
 * order they first appear. Figma adds a new variable at the end of its
 * collection, so without this `Size/Width/1900` would land after `Size/Image`
 * instead of beside the other widths.
 */
function byFolder(variables, depth = 0) {
    const groups = new Map();
    for (const v of variables) {
        const parts = v.name.split('/');
        const key = depth < parts.length - 1 ? parts[depth].trim() : '';
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(v);
    }
    return [...groups].flatMap(([key, vs]) => (key ? byFolder(vs, depth + 1) : vs));
}

/** `var(--element-pad-x-sm)` -> `--element-pad-x-sm`, or `null` when it is not a `var()` of one name. */
const webName = (syntax) => /^var\((--[a-z0-9-]+)\)$/.exec(syntax ?? '')?.[1] ?? null;

/**
 * Generate the new scales SCSS
 */
function generateScalesSCSS() {
    const sources = SCALE_COLLECTIONS.map(({ file, heading }) => ({ file, heading, ...readSource(file, { oneMode: true }) }));
    const nameById = {};
    const seen = new Set();
    for (const { file, json } of sources) {
        for (const v of json.variables) {
            const name = webName(v.codeSyntax?.WEB);
            if (!name) throw new Error(`${file}: ${v.name} has no WEB code syntax of the form var(--name). Set it in Figma and export again.`);
            if (seen.has(name)) throw new Error(`${file}: ${name} is the code syntax of two variables.`);
            seen.add(name);
            nameById[v.id] = name;
        }
    }

    let scss = `/**
 * Scale Tokens
 * Generated from the spacing / primitives and spacing / foundations collections in Figma.
 * Each name is the variable's WEB code syntax; an alias is a var() of its target.
 */

:root {
`;
    for (const { file, heading, json, modes: [mode] } of sources) {
        scss += `\n    /* ${heading} */\n`;
        let folder = null;
        for (const v of byFolder(json.variables)) {
            // A comment at each top-level folder (Space, Radius … Size, Element, Border).
            const top = v.name.split('/')[0];
            if (top !== folder) scss += `    /* ${(folder = top)} */\n`;
            const value = v.valuesByMode[mode];
            let css;
            if (value?.type === 'VARIABLE_ALIAS') {
                if (!nameById[value.id]) throw new Error(`${file}: ${v.name} aliases ${value.id}, which none of the scale exports holds.`);
                css = `var(${nameById[value.id]})`;
            } else if (typeof value === 'number') {
                css = px(value);
            } else {
                throw new Error(`${file}: ${v.name} has neither an alias nor a number.`);
            }
            scss += `    ${nameById[v.id]}: ${css};\n`;
        }
    }
    return `${scss}}\n`;
}

/*
 * FRAME AND LAYER TOKENS
 *
 * The sets listed in `scripts/lib/frame-layer-collections.mjs`, which also
 * says how a variable's code name is made. They sit beside the `size / *`
 * tokens above under new names, so nothing that reads an old name changes
 * until it is moved. Each variable's Figma code syntax has to name the same
 * token, so the name a designer copies from Figma is the one code declares,
 * and every alias resolves into the scales above.
 */

/** The modes `spacing / layout` takes, named as `size _ layout.json` names the breakpoint each starts at. */
const FRAME_LAYER_MODES = ['Medium (768px)', 'Large (1024px)', 'X-Large (1440px)'];

/**
 * Figma variables with no CSS: the template switch that shows the docked
 * sidebar layer. Code docks the sidebar with a media query instead.
 */
const FIGMA_ONLY_FRAME_LAYERS = new Set(['sidebar-docked']);

/** Figma numbers that are counts, not lengths, so CSS takes them without a unit. */
const UNITLESS_FRAME_LAYERS = new Set(['columns']);

/**
 * Tokens code needs that Figma cannot hold: a height relative to the screen,
 * and a popover's gap to its trigger, which Figma draws by hand. `figmaName`
 * is the variable that would replace each one.
 */
const CODE_ONLY_FRAME_LAYERS = {
    'layout-max-height-modal': {
        value: 'calc(100dvh - 2 * var(--overlay-pad-y))',
        note: 'a Hug modal grows to it; a Fill modal sits at it',
        figmaName: 'Modal/max-height-modal (Spacing / Layout)',
    },
    'popover-offset': {
        value: 'var(--space-025)',
        note: 'gap from a popover to its trigger',
        figmaName: 'Popover/Placement/offset',
    },
};

/** Under this screen height the overlay pads 24 above and below, not 64. Code only. */
const SHORT_SCREEN = { maxHeight: 639.98, token: 'overlay-pad-y', value: 'var(--space-150)' };

/**
 * Generate the frame and layer tokens SCSS
 */
function generateFrameLayersSCSS() {
    // Aliases point into the scales; each is written as a var() of its
    // target's code syntax, the way generateScalesSCSS writes its own.
    const scaleName = {};
    for (const { file } of SCALE_COLLECTIONS) {
        for (const v of readSource(file).json.variables) scaleName[v.id] = webName(v.codeSyntax?.WEB);
    }

    const layout = readSource('size _ layout.json').json;
    const minWidth = layout.variables.find((v) => v.name === 'Breakpoints/min width');
    const layoutModeIds = Object.fromEntries(Object.entries(layout.modes).map(([id, name]) => [name, id]));
    const startsAt = (mode) => {
        const id = layoutModeIds[mode];
        if (!id) throw new Error(`size _ layout.json: no "${mode}" mode.`);
        return minWidth.resolvedValuesByMode[id];
    };

    const declared = new Map();
    const blocks = new Map(); // breakpoint min-width -> lines
    let root = '';

    for (const { name: collection, heading } of FRAME_LAYER_COLLECTIONS) {
        const file = frameLayerFile(collection);
        const { json } = readSource(file);
        const modes = Object.entries(json.modes).map(([id, name]) => {
            if (Object.keys(json.modes).length > 1 && !FRAME_LAYER_MODES.includes(name)) {
                throw new Error(`${file}: unknown mode "${name}". Modes are ${FRAME_LAYER_MODES.join(' · ')}.`);
            }
            return { id, name };
        });
        root += `\n    /* ${heading} */\n`;
        let folder = null;

        for (const v of byFolder(json.variables)) {
            const leaf = v.name.split('/').pop();
            if (v.resolvedType === 'BOOLEAN') {
                if (!FIGMA_ONLY_FRAME_LAYERS.has(leaf)) {
                    throw new Error(`${file}: ${v.name} is a boolean, which CSS cannot hold. List it in FIGMA_ONLY_FRAME_LAYERS.`);
                }
                continue;
            }
            const token = frameLayerToken(collection, v.name);
            if (v.codeSyntax?.WEB !== `var(--${token})`) {
                throw new Error(`${file}: ${v.name} has Figma code syntax ${v.codeSyntax?.WEB ?? '(none)'}, but code declares --${token}.`);
            }
            if (declared.has(token)) throw new Error(`${file}: ${v.name} and ${declared.get(token)} are both --${token}.`);
            declared.set(token, `${file} ${v.name}`);
            if (frameLayerFolder(v.name) !== folder) {
                folder = frameLayerFolder(v.name);
                root += `    /* ${folder} */\n`;
            }

            const css = (mode) => {
                const val = v.valuesByMode[mode.id];
                if (val?.type === 'VARIABLE_ALIAS') {
                    if (!scaleName[val.id]) throw new Error(`${file}: ${v.name} aliases ${val.id}, which none of the scale exports holds.`);
                    return `var(${scaleName[val.id]})`;
                }
                if (typeof val === 'number') return UNITLESS_FRAME_LAYERS.has(leaf) ? String(val) : px(val);
                if (val?.r !== undefined) return cssColor(val);
                throw new Error(`${file}: ${v.name} has no value at ${mode.name}.`);
            };
            const values = modes.map(css);

            root += `    --${token}: ${values[0]};\n`;
            for (let i = 1; i < modes.length; i++) {
                if (values[i] === values[i - 1]) continue;
                const at = startsAt(modes[i].name);
                if (!blocks.has(at)) blocks.set(at, '');
                blocks.set(at, blocks.get(at) + `        --${token}: ${values[i]};\n`);
            }
        }
    }

    for (const [token, { figmaName }] of Object.entries(CODE_ONLY_FRAME_LAYERS)) {
        if (declared.has(token)) stale('CODE_ONLY_FRAME_LAYERS', `Figma now has --${token} (${figmaName}); read it from the export.`);
    }
    if (!declared.has(SHORT_SCREEN.token)) {
        stale('SHORT_SCREEN', `Figma no longer has --${SHORT_SCREEN.token}; the short-screen override has nothing to override.`);
    }

    let scss = `/**
 * Frame and Layer Tokens
 * Generated from the spacing / layout, spacing / patterns and color / patterns
 * sets in Figma. spacing / layout has modes Medium (768px) · Large (1024px) ·
 * X-Large (1440px): the Medium value is in :root, wider modes override below.
 *
 * The derived Layout rows (pad-left-container, width-content, width-column,
 * width-modal-*) are each mode's value at its screen width, 768 · 1024 · 1440,
 * the same numbers Figma's modes hold. Between those widths they step rather
 * than follow the screen, so code that needs the exact width at any screen
 * computes it from the rules instead of reading these.
 */

:root {
${root.slice(1)}
    /* Code only; not Figma variables (CODE_ONLY_FRAME_LAYERS) */
${Object.entries(CODE_ONLY_FRAME_LAYERS).map(([token, { value, note }]) => `    --${token}: ${value}; /* ${note} */\n`).join('')}}
`;
    for (const at of [...blocks.keys()].sort((a, b) => a - b)) {
        scss += `\n@media (min-width: ${px(at)}) {\n    :root {\n${blocks.get(at)}    }\n}\n`;
    }
    scss += `\n/* A short screen pads modals 24 above and below; code only (SHORT_SCREEN) */
@media (max-height: ${px(SHORT_SCREEN.maxHeight)}) {
    :root {
        --${SHORT_SCREEN.token}: ${SHORT_SCREEN.value};
    }
}
`;
    return scss;
}

/*
 * TYPE TOKENS
 *
 * The `typography` collection is one collection in four folders: `Font size/*`
 * and `Line height/*` (hidden from publishing, named by rem × 100),
 * `Family/*` and `Weight/*`. Beside it in the export are the text styles that
 * bind every property to one of those variables. Code takes the plain spec
 * names: `Weight/medium` is `--type-weight-medium`, and `Heading/large` is
 * `--heading-large`, a `font` shorthand built from the same variables the
 * style binds, so a family is written once, in its token.
 */

/** A size in rem, from Figma's px: `12` -> `0.75rem`. */
const rem = (n) => `${+(Number(n) / 16).toFixed(4)}rem`;

/** How each kind of typography value is written in CSS; families take their fallbacks below. */
const TYPE_VALUE = { size: rem, weight: String, family: null };

/**
 * A type variable's CSS name and folder, from `scripts/lib/typography-collection.mjs`.
 * The name is checked against the variable's own WEB code syntax, so Figma's
 * Dev Mode and the stylesheet cannot name one token two ways.
 */
function typeToken(v) {
    const folder = typographyFolder(v.name);
    if (!folder) throw new Error(`${TYPOGRAPHY_FILE}: ${v.name} is none of ${TYPOGRAPHY_FOLDERS.map((f) => `${f.figma}*`).join(', ')}.`);
    const token = typographyToken(v.name);
    if (v.codeSyntax?.WEB !== `var(${token})`) {
        throw new Error(`${TYPOGRAPHY_FILE}: ${v.name} has code syntax ${v.codeSyntax?.WEB}; it is written as var(${token}).`);
    }
    return { token, folder };
}

/**
 * The faces after the Figma family in each stack. Figma holds one family name;
 * a stylesheet needs a chain that ends in a CSS generic, UNQUOTED: a quoted
 * `"sans-serif"` is a family nothing is called, so the chain simply ends
 * (`check:font-families`). The body stack keeps the Open Sans step
 * `--font-family-body` already had.
 */
const FAMILY_FALLBACKS = {
    'Family/heading': ['sans-serif'],
    'Family/body': ['"Open Sans"', 'sans-serif'],
};

/**
 * Text styles code has and Figma does not. Code is relative to the text around
 * it (Atlassian's `font.code`: 0.875em, weight 400, line height 1), which a
 * Figma text style cannot express, so it is code only.
 */
const CODE_ONLY_TYPE_STYLES = {
    'Code': 'var(--type-weight-regular) 0.875em / 1 var(--font-family-code)',
};

/** The style groups in the order they are written. */
const TYPE_STYLE_GROUPS = ['Heading', 'Body', 'Metric'];

/**
 * Generate type tokens SCSS
 */
function generateTypeSCSS() {
    const { json, modes: [mode] } = readSource(TYPOGRAPHY_FILE, { oneMode: true });
    if (!Array.isArray(json.textStyles)) {
        throw new Error(
            `${TYPOGRAPHY_FILE}: no textStyles. The REST variables endpoint does not return styles; ` +
            'export the collection with its bound text styles from the plugin.',
        );
    }
    const byId = new Map(json.variables.map((v) => [v.id, v]));

    const declarations = new Map(TYPOGRAPHY_FOLDERS.map((f) => [f, []]));
    for (const v of json.variables) {
        const { token, folder } = typeToken(v);
        const raw = v.valuesByMode[mode];
        const write = TYPE_VALUE[folder.kind];
        let value;
        if (write) {
            value = write(raw);
        } else {
            const fallback = FAMILY_FALLBACKS[v.name];
            if (!fallback) throw new Error(`${TYPOGRAPHY_FILE}: ${v.name} has no FAMILY_FALLBACKS entry.`);
            value = [`"${raw}"`, ...fallback].join(', ');
        }
        declarations.get(folder).push({ token, value, px: raw });
    }
    for (const name of Object.keys(FAMILY_FALLBACKS)) {
        if (!json.variables.some((v) => v.name === name)) stale('FAMILY_FALLBACKS', `Figma has no ${name}.`);
    }

    const styles = [];
    for (const style of json.textStyles) {
        const group = TYPE_STYLE_GROUPS.indexOf(style.name.split('/')[0]);
        if (group < 0) throw new Error(`${TYPOGRAPHY_FILE}: ${style.name} is in no TYPE_STYLE_GROUPS group.`);
        const part = (field) => {
            const v = byId.get(style.boundVariables?.[field]);
            if (!v) throw new Error(`${TYPOGRAPHY_FILE}: ${style.name} ${field} is not bound to a type variable.`);
            return `var(${typeToken(v).token})`;
        };
        styles.push({
            group,
            token: `--${slug(style.name)}`,
            value: `${part('fontWeight')} ${part('fontSize')} / ${part('lineHeight')} ${part('fontFamily')}`,
        });
    }
    for (const name of Object.keys(CODE_ONLY_TYPE_STYLES)) {
        if (json.textStyles.some((s) => s.name === name || s.name.startsWith(`${name}/`))) {
            stale('CODE_ONLY_TYPE_STYLES', `Figma now has a ${name} style; read it from the export.`);
        }
    }

    const block = (items) => items.map(({ token, value }) => `    ${token}: ${value};\n`).join('');
    const [sizes, lineHeights, families, weights] = TYPOGRAPHY_FOLDERS.map((f) => declarations.get(f));
    const bySize = (items) => [...items].sort((a, b) => a.px - b.px);

    return `/**
 * Type Tokens
 * Generated from the Figma \`typography\` collection and its bound text styles.
 * A text style is a \`font\` shorthand: weight, size / line height, family.
 */

:root {
    /* Font size primitives (hidden in Figma; named by rem × 100) */
${block(bySize(sizes))}
    /* Line height primitives (hidden in Figma; named by rem × 100) */
${block(bySize(lineHeights))}
    /* Families */
${block(families)}
    /* Weights */
${block(bySize(weights))}
    /* Text styles */
${block([...styles].sort((a, b) => a.group - b.group))}
    /* Code only (CODE_ONLY_TYPE_STYLES) */
${block(Object.entries(CODE_ONLY_TYPE_STYLES).map(([name, value]) => ({ token: `--${slug(name)}`, value })))}}
`;
}

// Generate all files
//
// EVERY FILE IS BUILT IN MEMORY FIRST. This used to write each one as it was
// produced, immediately below a warning that said generation was "DISABLED to
// protect existing tokens" — a `console.warn` with no return and no exit, so
// the protection it announced did not exist. One run on 2026-08-29 took
// `_colors.scss` from 195 color tokens to 5 and reported success. See
// `scripts/token-generation.mjs` for the rule and the measurement.
console.log('Generating token SCSS files...');

const OUT_DIR = TOKEN_DIR;
let generated;
try {
    generated = [
        { file: '_colors.scss', generated: generateColorsSCSS() },
        { file: '_primitives.scss', generated: generatePrimitivesSCSS() },
        { file: '_spacing_semantics.scss', generated: generateSemanticsSCSS() },
        { file: '_layout.scss', generated: generateLayoutSCSS() },
        { file: '_scales.scss', generated: generateScalesSCSS() },
        { file: '_frame_layers.scss', generated: generateFrameLayersSCSS() },
        { file: '_type.scss', generated: generateTypeSCSS() },
    ];
} catch (error) {
    console.error(`\n❌ Generation failed. ${error.message}\n   Nothing was written.\n`);
    process.exit(1);
}

/*
 * One name, one file. The frame and layer tokens carry the spec's names with
 * no family prefix, so nothing but this keeps one of them from landing on a
 * name another generated file already declares; whichever loaded second would
 * win silently.
 */
{
    const owner = new Map();
    for (const { file, generated: css } of generated) {
        for (const [, name] of css.matchAll(tokenDeclarationPattern('--'))) {
            if (owner.has(name) && owner.get(name) !== file) {
                console.error(`\n❌ ${name} is declared in both ${owner.get(name)} and ${file}. Nothing was written.\n`);
                process.exit(1);
            }
            owner.set(name, file);
        }
    }
}

if (staleExceptions.length) {
    console.error('\n❌ Stale exception. These exceptions no longer describe a difference from Figma:\n');
    for (const line of staleExceptions) console.error(`   ${line}`);
    console.error(
        '\n   Update the constant in scripts/generate-all-tokens.js so it only lists\n' +
        '   real differences, then run this again. Nothing was written.\n',
    );
    process.exit(1);
}

const built = generated.map((entry) => ({
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

