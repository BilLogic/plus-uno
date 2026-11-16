/**
 * The data-viz palette: which `--chart-*` token does which job.
 *
 * Every chart color does one of four jobs, and each job has one source here:
 *
 * - identity (which series): `CATEGORICAL`, in order, never cycled, at most
 *   `CATEGORICAL_LIMIT` before the rest fold into "Other"; `SMART` for the
 *   five subjects;
 * - magnitude (how much): `sequentialRamp(hue)`, light to strong;
 * - polarity (which side of a baseline): `divergingRamp(low, high)`, two hues
 *   around a neutral midpoint;
 * - state (on track, at risk): `STATUS`, always with an icon or a label.
 *
 * Chart chrome (labels, grid, tooltip) is `CHROME`: text and border tokens,
 * never a chart color. The ramps and the series orders are held by
 * `check:color-system` (`scripts/lib/color/checks.mjs`), which names the same
 * tokens in the same order. Reading a token's value in the current color mode
 * is `colorMode.js`: this module only names tokens.
 */
const v = (name) => `var(--${name.startsWith('chart-') ? '' : 'ds-'}${name})`;

/** Atlassian's limit: past six series, group the smallest into "Other". */
export const CATEGORICAL_LIMIT = 6;

/** Series colors in assignment order. 7 and 8 exist for overflow only. */
export const CATEGORICAL = Array.from({ length: 8 }, (_, i) => v(`chart-categorical-${i + 1}`));

/** A single-series chart, and the de-emphasized comparison or reference line beside it. */
export const BRAND = v('chart-brand');
export const NEUTRAL = v('chart-neutral');

/**
 * The default color of series `index` of `count`: the brand chart color when
 * a chart has one series, as Atlassian defaults single-color charts, and the
 * categorical series in order otherwise.
 *
 * @param {number} index
 * @param {number} count
 * @returns {string}
 */
export const seriesColor = (index, count) => (count === 1 ? BRAND : CATEGORICAL[index % CATEGORICAL.length]);

/** Status marks. `bold` is the more extreme level of the same status (highest against high priority). */
export const STATUS = {
    success: v('chart-success'),
    successBold: v('chart-success-bold'),
    warning: v('chart-warning'),
    warningBold: v('chart-warning-bold'),
    danger: v('chart-danger'),
    dangerBold: v('chart-danger-bold'),
    information: v('chart-information'),
    informationBold: v('chart-information-bold'),
    discovery: v('chart-discovery'),
    discoveryBold: v('chart-discovery-bold'),
    todo: NEUTRAL,
};

/** The SMART subjects in S-M-A-R-T order, the order their chart colors are checked in. */
export const SMART_SUBJECTS = ['social-emotional', 'mastering-content', 'advocacy', 'relationship', 'technology-tools'];

/** A subject's series color, by subject. */
export const SMART = Object.fromEntries(SMART_SUBJECTS.map((s) => [s, v(`chart-smart-${s}`)]));

/** Chart chrome: what labels, lines and overlays wear. */
export const CHROME = {
    text: v('text'),
    textSubtle: v('text-subtle'),
    textSubtlest: v('text-subtlest'),
    textDisabled: v('text-disabled'),
    textInverse: v('text-inverse'),
    grid: v('border'),
    axis: v('border'),
    threshold: NEUTRAL,
    link: v('border-bold'),
    separator: v('border-inverse'),
    track: v('background-neutral'),
    tooltip: v('surface-overlay'),
    surface: v('surface'),
};

/** The hues with a chart ramp. */
export const HUES = ['blue', 'teal', 'green', 'lime', 'yellow', 'orange', 'red', 'magenta', 'purple', 'gray', 'brown'];

const EMPHASES = ['bold', 'bolder', 'boldest'];

/**
 * A sequential ramp for one hue, low to high, as token names: the subtler
 * accent fill, then the hue's three chart emphases. Each step sits further from
 * the surface than the last, so the strongest tone is the biggest value: darker
 * in light mode, lighter in dark.
 *
 * @param {string} [hue]
 * @returns {string[]}
 */
export const sequentialRamp = (hue = 'blue') => {
    if (!HUES.includes(hue)) throw new Error(`sequentialRamp: no chart ramp for "${hue}"`);
    return [`--ds-background-accent-${hue}-subtler`, ...EMPHASES.map((e) => `--chart-${hue}-${e}`)];
};

/** The neutral midpoint of every diverging ramp. */
export const DIVERGING_MIDPOINT = '--ds-background-accent-gray-subtler';

/**
 * A diverging ramp, as token names: `low` at its strongest, out to the neutral
 * midpoint, then `high` up to its strongest. Seven steps, three per arm. The
 * default pair, orange and blue, stays apart under every common color-vision
 * deficiency; never pair red with green.
 *
 * @param {string} [low]
 * @param {string} [high]
 * @returns {string[]}
 */
export const divergingRamp = (low = 'orange', high = 'blue') => {
    if (low === high) throw new Error('divergingRamp: the two arms need two hues');
    const arm = (hue) => sequentialRamp(hue).slice(1);
    return [...arm(low).reverse(), DIVERGING_MIDPOINT, ...arm(high)];
};

/**
 * Highcharts `colorAxis.stops` for a ramp, evenly spaced, each color resolved
 * by `resolve` (a colorAxis interpolates, so it needs real colors, not `var()`).
 *
 * @param {string[]} tokens
 * @param {(token: string) => string} resolve
 * @returns {Array<[number, string]>}
 */
export const rampStops = (tokens, resolve) =>
    tokens.map((token, i) => [tokens.length === 1 ? 0 : i / (tokens.length - 1), resolve(token)]);

const defaultValue = (item) => {
    if (typeof item === 'number') return item;
    if (!item || typeof item !== 'object') return 0;
    if (typeof item.y === 'number') return item.y;
    if (typeof item.value === 'number') return item.value;
    if (item.height !== undefined) return parseFloat(item.height);
    if (typeof item.high === 'number') return item.high;
    return 0;
};

const SEQUENTIAL_STEP_WEIGHT = {
    subtler: 0,
    bold: 1,
    bolder: 2,
    boldest: 3,
};

const parseSequentialToken = (color) => {
    if (typeof color !== 'string') return null;
    const match = color.match(/^var\(--(?:chart|ds-background-accent)-([a-z]+)-(subtler|bold|bolder|boldest)\)$/);
    if (!match) return null;
    return { hue: match[1], step: match[2], weight: SEQUENTIAL_STEP_WEIGHT[match[2]] };
};

/**
 * Returns the CSS variable (`var(--chart-<hue>-*)`) for a 0-based rank from
 * biggest value (`0`) to smallest value (`count - 1`), so the darkest tone
 * (`boldest`) always lands on the biggest value.
 *
 * @param {number} rankIndex
 * @param {number} [count=4]
 * @param {keyof typeof CHART_SEQUENCES.sequential} [hue='blue']
 * @returns {string}
 */
export const sequentialTone = (rankIndex, count = 4, hue = 'blue') => {
    const ramp = sequentialRamp(hue);
    const stepIndex = count <= 1 ? ramp.length - 1 : Math.max(0, ramp.length - 1 - rankIndex);
    return `var(${ramp[stepIndex]})`;
};

/**
 * Items sorted from most to least, the house order for categories. Pair it
 * with a sequential ramp and the strongest tone lands on the biggest value.
 * Pass `{ sort: false }` (or `false`) to keep input order for ordinal or
 * temporal axes while still placing the darkest sequential tone on the biggest value.
 *
 * @template T
 * @param {T[]} items
 * @param {((item: T, index: number) => number) | { sort?: boolean, hue?: string } | boolean} [value]
 * @param {{ sort?: boolean, hue?: string } | boolean} [options]
 * @returns {T[]}  a new array
 */
export const mostToLeast = (items = [], value = defaultValue, options = {}) => {
    let readValue = value;
    let opts = options;
    if (typeof value !== 'function') {
        opts = value ?? {};
        readValue = defaultValue;
    }
    const sort = typeof opts === 'boolean' ? opts : (opts?.sort ?? true);
    const hue = typeof opts === 'object' && opts !== null ? opts.hue : undefined;

    const indexed = items.map((item, index) => ({ item, index, val: readValue(item, index) }));
    const byValueDesc = [...indexed].sort((a, b) => b.val - a.val || a.index - b.index);
    const ordered = sort ? byValueDesc : indexed;

    const parsedColors = items.map((item) => (item && typeof item === 'object' ? parseSequentialToken(item.color) : null));
    const singleRampHue =
        !hue &&
        parsedColors.length > 1 &&
        parsedColors.every(Boolean) &&
        parsedColors.every((c) => c.hue === parsedColors[0].hue) &&
        new Set(parsedColors.map((c) => c.step)).size > 1
            ? parsedColors[0].hue
            : null;

    if (!hue && !singleRampHue) {
        return ordered.map((entry) => entry.item);
    }

    const rankByOriginalIndex = new Map();
    byValueDesc.forEach((entry, rankIndex) => {
        rankByOriginalIndex.set(entry.index, rankIndex);
    });

    if (hue) {
        return ordered.map((entry) => {
            const rankIndex = rankByOriginalIndex.get(entry.index) ?? 0;
            const color = sequentialTone(rankIndex, items.length, hue);
            return entry.item && typeof entry.item === 'object'
                ? { ...entry.item, color }
                : entry.item;
        });
    }

    const sortedRampColors = [...items]
        .map((item) => item.color)
        .sort((a, b) => (parseSequentialToken(b)?.weight ?? 0) - (parseSequentialToken(a)?.weight ?? 0));

    return ordered.map((entry) => {
        const rankIndex = rankByOriginalIndex.get(entry.index) ?? 0;
        return { ...entry.item, color: sortedRampColors[rankIndex] };
    });
};

/**
 * Sorts a category chart's `categories` and parallel `data` or `series` from
 * most to least through `mostToLeast` by default (`sort = true`). Pass
 * `sort = false` to keep the input order for ordinal or temporal axes.
 */
export const sortCategories = ({
    categories = [],
    data,
    series,
    value = defaultValue,
    sort = true,
    hue,
} = {}) => {
    if (!categories || categories.length === 0) {
        return {
            categories: [],
            data: Array.isArray(data) ? mostToLeast(data, value, { sort, hue }) : data,
            series,
        };
    }
    const entries = categories.map((category, index) => {
        const raw = Array.isArray(data)
            ? data[index]
            : Array.isArray(series) && series.length > 0 && Array.isArray(series[0]?.data)
                ? series[0].data[index]
                : undefined;
        return { category, index, val: value(raw, index) };
    });
    const ordered = mostToLeast(entries, (entry) => entry.val, { sort });
    const nextCategories = ordered.map((entry) => entry.category);
    const nextData = Array.isArray(data)
        ? mostToLeast(
            ordered.map((entry) => data[entry.index]),
            value,
            { sort: false, hue },
        )
        : data;
    const nextSeries = Array.isArray(series)
        ? series.map((s) => ({
            ...s,
            data: Array.isArray(s.data) ? ordered.map((entry) => s.data[entry.index]) : s.data,
        }))
        : series;
    return { categories: nextCategories, data: nextData, series: nextSeries };
};

const TOKENS_WITH_HOVERED = new Set([
    ...CATEGORICAL,
    BRAND,
    NEUTRAL,
    ...Object.values(STATUS),
    ...Object.values(SMART),
    ...HUES.flatMap((hue) => EMPHASES.map((e) => v(`chart-${hue}-${e}`))),
    v('background-brand-bold'),
    v('background-danger-bold'),
    v('background-neutral-subtle'),
    v('background-selected'),
]);

/**
 * Given a chart mark color (`var(--chart-*)` or `var(--ds-background-*)`),
 * returns its `-hovered` token (`var(--chart-*-hovered)`), or `null` when the
 * color is not a token with a `-hovered` step.
 *
 * @param {string} [color]
 * @returns {string | null}
 */
export const hoveredColor = (color) => {
    if (typeof color !== 'string' || !TOKENS_WITH_HOVERED.has(color)) return null;
    return `${color.slice(0, -1)}-hovered)`;
};

