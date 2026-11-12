import fs from 'fs';
import path from 'path';

import { TOKEN_DIR } from '../design-system/src/lib/tokens-node.mjs';
import { tokenDeclarationPattern } from '../design-system/src/lib/tokens.mjs';
import { compare, refusals } from './token-generation.mjs';
import { FRAME_LAYER_COLLECTIONS, frameLayerFile, frameLayerFolder, frameLayerToken } from './lib/frame-layer-collections.mjs';
import { dropRetired } from './lib/tokens/retire.mjs';
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

/**
 * A Figma color ({r, g, b, a} in 0–1) as CSS: `#rrggbb` when opaque, `rgba()`
 * with the alpha at up to three places otherwise (0.08, not 0.080).
 */
function cssColor({ r, g, b, a = 1 }) {
    const byte = (n) => Math.round(n * 255);
    if (a < 1) return `rgba(${byte(r)}, ${byte(g)}, ${byte(b)}, ${+a.toFixed(3)})`;
    return '#' + [r, g, b].map((n) => byte(n).toString(16).padStart(2, '0')).join('');
}

/** A size in CSS: `8px`, `1.5px`, `1023.98px`. */
const px = (n) => `${+Number(n).toFixed(2)}px`;

/*
 * THE SCALES
 *
 * Two collections: spacing / primitives (space, radius, stroke and size,
 * hidden in Figma) and spacing / foundations, whose folders are Size (common
 * Height/Width plus Item, Row, Label, Field, Icon, Image), Element and Border.
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
 * Generate the scales SCSS
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
 * says how a variable's code name is made. Each variable's Figma code syntax has to name the same
 * token, so the name a designer copies from Figma is the one code declares,
 * and every alias resolves into the scales above.
 */

/** The modes `spacing / layout` takes, each named with the screen width it starts at. */
const FRAME_LAYER_MODES = ['Medium (768px)', 'Large (1024px)', 'X-Large (1440px)'];

/**
 * Figma variables with no CSS: the template switch that shows the docked
 * sidebar layer. Code docks the sidebar with a media query instead.
 */
const FIGMA_ONLY_FRAME_LAYERS = new Set(['sidebar-docked']);

/** Figma numbers that are counts, not lengths, so CSS takes them without a unit. */
const UNITLESS_FRAME_LAYERS = new Set(['columns']);

/**
 * Figma values that stand in for "no limit", which a variable cannot hold:
 * every mode needs a number. Code writes `none` wherever the variable holds
 * its stand-in, so X-Large has no maximum screen width.
 */
const NO_LIMIT_FRAME_LAYERS = { 'max-width-screen': 10000 };

/**
 * Tokens code needs that Figma cannot hold: a height relative to the screen,
 * and a popover's gap to its trigger, which Figma draws by hand. `figmaName`
 * is the variable that would replace each one.
 */
const CODE_ONLY_FRAME_LAYERS = {
    'popover-offset': {
        value: 'var(--space-025)',
        note: 'gap from a popover to its trigger',
        figmaName: 'Popover/Placement/offset',
    },
    // The Frame's own stacking steps around the navigation layer, named so
    // Frame.scss does arithmetic on none of them.
    'frame-layer-edge': { value: 'calc(var(--layer-navigation) - 1)', note: 'the hover strips that peek a closed Sidebar or Panel', figmaName: 'Layer/frame-edge' },
    'frame-layer-sidebar': { value: 'var(--layer-navigation)', note: 'the raised Sidebar', figmaName: 'Layer/frame-sidebar' },
    'frame-layer-topbar-start': { value: 'calc(var(--layer-navigation) + 1)', note: 'the Topbar start, above a raised Sidebar', figmaName: 'Layer/frame-topbar-start' },
    'frame-layer-blanket': { value: 'calc(var(--layer-navigation) + 2)', note: "the overlay Panel's Backdrop", figmaName: 'Layer/frame-blanket' },
    'frame-layer-panel-peek': { value: 'calc(var(--layer-navigation) + 3)', note: 'a peeking or overlay Panel, above its Backdrop', figmaName: 'Layer/frame-panel-peek' },
    'frame-layer-splitter': { value: '1', note: "local to the Panel's own stacking context, not a step on the navigation scale: the splitter's hit strip", figmaName: 'Layer/frame-splitter' },
    'frame-layer-docked-edge': { value: '1', note: "local to the Frame's row, not a step on the navigation scale: lifts a docked Sidebar so its 1px edge lies over the Page's first pixel", figmaName: 'Layer/frame-docked-edge' },
};

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
    // A frame or layer token may also alias another one, as Drawer/width-drawer-*
    // alias Modal/width-modal-*: it is written as a var() of that token, so it
    // follows the target at every mode.
    const frameLayerName = {};
    for (const { name: collection } of FRAME_LAYER_COLLECTIONS) {
        for (const v of readSource(frameLayerFile(collection)).json.variables) {
            if (v.resolvedType !== 'BOOLEAN') frameLayerName[v.id] = `--${frameLayerToken(collection, v.name)}`;
        }
    }

    // A mode names the screen width it starts at: `Large (1024px)` -> 1024.
    const startsAt = (mode) => {
        const width = /\((\d+)px\)/.exec(mode)?.[1];
        if (!width) throw new Error(`spacing / layout: mode "${mode}" names no width.`);
        return Number(width);
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
                    const target = scaleName[val.id] ?? frameLayerName[val.id];
                    if (!target) throw new Error(`${file}: ${v.name} aliases ${val.id}, which none of the scale or frame and layer exports holds.`);
                    return `var(${target})`;
                }
                if (typeof val === 'number') {
                    if (NO_LIMIT_FRAME_LAYERS[leaf] === val) return 'none';
                    return UNITLESS_FRAME_LAYERS.has(leaf) ? String(val) : px(val);
                }
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
    for (const leaf of Object.keys(NO_LIMIT_FRAME_LAYERS)) {
        if (![...declared.values()].some((where) => where.endsWith(`/${leaf}`))) {
            stale('NO_LIMIT_FRAME_LAYERS', `no variable ends in ${leaf}; its stand-in has nothing to stand in for.`);
        }
    }

    let scss = `/**
 * Frame and Layer Tokens
 * Generated from the spacing / layout, spacing / patterns and color / patterns
 * sets in Figma. spacing / layout has modes Medium (768px) · Large (1024px) ·
 * X-Large (1440px): the Medium value is in :root, wider modes override below.
 *
 * The derived Layout rows (width-content, width-column,
 * width-column-screen, width-modal-*) are each mode's value at its screen width, 768 · 1024 · 1440,
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
const em = (n) => `${+(Number(n) / 100).toFixed(4)}em`;
const TYPE_VALUE = { size: rem, weight: String, tracking: em, family: null };

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
 * (`check:font-families`). Each Noto face falls back to a local face resized
 * to its metrics (`_fonts.scss`).
 */
const FAMILY_FALLBACKS = {
    'Family/heading': ['"Noto Sans Fallback"', 'sans-serif'],
    'Family/heading-serif': ['"Noto Serif Fallback"', 'serif'],
    'Family/body': ['"Noto Sans Fallback"', 'sans-serif'],
    'Family/code': ['ui-monospace', '"SF Mono"', 'Menlo', 'Consolas', 'monospace'],
    'Family/brand-heading': ['"Noto Serif Fallback"', 'serif'],
    'Family/brand-body': ['"Noto Sans Fallback"', 'sans-serif'],
};

/**
 * Text styles code has and Figma does not. Code is relative to the text around
 * it (Atlassian's `font.code`: 0.875em, weight 400, line height 1), which a
 * Figma text style cannot express, so it is code only.
 */
const CODE_ONLY_TYPE_STYLES = {
    'Code': 'var(--type-weight-regular) 0.875em / 1 var(--type-family-code)',
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

    const percentSpacing = (style) => {
        const ls = style.letterSpacing;
        if (!ls || ls.unit !== 'PERCENT' || ls.value === 0) return undefined;
        const match = json.variables.find((v) => v.name.startsWith('Letter spacing/') && v.valuesByMode?.[mode] === ls.value);
        if (!match) throw new Error(`${TYPOGRAPHY_FILE}: ${style.name} has letter spacing ${ls.value}% and no Letter spacing variable holds it.`);
        return match.id;
    };

    const styles = [];
    for (const style of json.textStyles) {
        const group = TYPE_STYLE_GROUPS.indexOf(style.name.split('/')[0]);
        if (group < 0) throw new Error(`${TYPOGRAPHY_FILE}: ${style.name} is in no TYPE_STYLE_GROUPS group.`);
        const part = (field) => {
            const v = byId.get(style.boundVariables?.[field]);
            if (!v) throw new Error(`${TYPOGRAPHY_FILE}: ${style.name} ${field} is not bound to a type variable.`);
            return `var(${typeToken(v).token})`;
        };
        // A variable bound to letter spacing renders in pixels in Figma, so the
        // library holds the percent on the style and the variable of the same
        // value names it here.
        const spacing = style.boundVariables?.letterSpacing ?? percentSpacing(style);
        if (spacing) {
            styles.push({
                group,
                token: `--${slug(style.name)}-tracking`,
                value: `var(${typeToken(byId.get(spacing)).token})`,
            });
        }
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
    const [sizes, lineHeights, families, weights, tracking] = TYPOGRAPHY_FOLDERS.map((f) => declarations.get(f));
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
    /* Letter spacing (a \`font\` shorthand cannot carry it; a text style that has one gets a \`-tracking\` companion) */
${block(bySize(tracking))}
    /* Text styles */
${block([...styles].sort((a, b) => a.group - b.group))}
    /* Code only (CODE_ONLY_TYPE_STYLES) */
${block(Object.entries(CODE_ONLY_TYPE_STYLES).map(([name, value]) => ({ token: `--${slug(name)}`, value })))}}

/* One class per text style, for markup with no stylesheet of its own: <p className="body-default">. */
${textStyleClasses(styles)}`;
}

/** A `.name { font: var(--name) }` rule per text style; a style with tracking carries it too. */
function textStyleClasses(styles) {
    const tracked = new Set(styles.filter((s) => s.token.endsWith('-tracking')).map((s) => s.token.replace(/-tracking$/, '')));
    return [...styles]
        .filter((s) => !s.token.endsWith('-tracking'))
        .sort((a, b) => a.group - b.group)
        .map(({ token }) => {
            const name = token.slice(2);
            const spacing = tracked.has(token) ? ` letter-spacing: var(${token}-tracking);` : '';
            return `.${name} { font: var(${token});${spacing} }\n`;
        })
        .join('');
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
        { file: '_scales.scss', generated: dropRetired(generateScalesSCSS()) },
        { file: '_frame_layers.scss', generated: dropRetired(generateFrameLayersSCSS()) },
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

