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

/**
 * Returns the CSS variable (`var(--chart-<hue>-*)`) for a 0-based rank from
 * biggest value (`0`) to smallest value (`count - 1`), spreading across the
 * whole ramp by `count` so the darkest tone (`boldest`) lands on rank `0` and
 * `subtler` lands on `count - 1`.
 *
 * @param {number} rank
 * @param {number} [count=4]
 * @param {string} [hue='blue']
 * @returns {string}
 */
export const sequentialTone = (rank, count = 4, hue = 'blue') => {
    const ramp = sequentialRamp(hue);
    const last = ramp.length - 1;
    if (count <= 1) return `var(${ramp[last]})`;
    const step = Math.round(((count - 1 - rank) / (count - 1)) * last);
    const stepIndex = Math.max(0, Math.min(last, step));
    return `var(${ramp[stepIndex]})`;
};

/**
 * Sorts `items` from most to least (stable, returning a new array); sorts only.
 *
 * @template T
 * @param {T[]} items
 * @param {(item: T, index: number) => number} [value]
 * @returns {T[]}
 */
export const mostToLeast = (items, value = (d) => d.y) =>
    items
        .map((item, index) => ({ item, index, val: value(item, index) }))
        .sort((a, b) => b.val - a.val || a.index - b.index)
        .map((entry) => entry.item);

/**
 * Ranks `items` by `value` (largest = rank `0`, ties keeping input order),
 * keeps the items in their input order, and sets `color` from
 * `sequentialTone(rank, items.length, hue)` so the darkest tone (`boldest`)
 * lands on the largest value.
 *
 * @template {object} T
 * @param {T[]} items
 * @param {string} [hue='blue']
 * @param {(item: T, index: number) => number} [value]
 * @returns {Array<T & { color: string }>}
 */
export const toneByRank = (items, hue = 'blue', value = (d) => d.y) => {
    const ranked = mostToLeast(
        items.map((_, index) => index),
        (index) => value(items[index], index),
    );
    const ranks = new Array(items.length);
    ranked.forEach((itemIndex, rank) => {
        ranks[itemIndex] = rank;
    });
    return items.map((item, index) => ({
        ...item,
        color: sequentialTone(ranks[index], items.length, hue),
    }));
};

/**
 * Reorders `categories` and each entry's `data` in `series` from most to least
 * through `mostToLeast`. The category order comes from `value` (default:
 * `(d) => d.y` on the first series' datum per category). Returns
 * `{ categories, series, order }`, where `order` is the new index order so
 * callers can reorder parallel arrays such as icons or colors.
 *
 * @param {{
 *   categories?: string[],
 *   series?: Array<{ data?: any[], [key: string]: any }>,
 *   value?: (datum: any, index: number) => number,
 * }} [options]
 * @returns {{ categories: string[], series: Array<any>, order: number[] }}
 */
export const sortCategories = ({
    categories = [],
    series = [],
    value = (d) => d.y,
} = {}) => {
    const firstData = series[0]?.data ?? [];
    const order = mostToLeast(
        categories.map((_, index) => index),
        (index) => value(firstData[index], index),
    );
    return {
        categories: order.map((i) => categories[i]),
        series: series.map((s) => ({
            ...s,
            data: Array.isArray(s.data) ? order.map((i) => s.data[i]) : s.data,
        })),
        order,
    };
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

