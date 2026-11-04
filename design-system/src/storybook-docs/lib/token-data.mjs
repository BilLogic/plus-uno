/**
 * The data behind the Foundations pages' Color and Typography blocks.
 *
 * Every function reads the text of a generated token stylesheet and returns the
 * rows a Storybook block draws, so a page never restates a token by hand:
 * regenerate the tokens and the page follows. The stylesheets reach the browser
 * through Vite's `?raw` import (see `token-blocks.jsx`); the tests read the same
 * files from disk and hold these rows against `tokenCorpus`.
 *
 * Plain ESM with no Node-only import, so Vite bundles it and `vitest` loads it.
 */

/** The light-mode declarations: the first `{ … }` block of a token stylesheet, name to raw value. */
export function declarations(scss) {
  const text = scss.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const open = text.indexOf('{');
  const close = text.indexOf('}', open);
  const out = new Map();
  for (const [, name, value] of text.slice(open + 1, close).matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/g)) {
    out.set(name, value.trim());
  }
  return out;
}

const var_ = (token) => `var(${token})`;
const titleCase = (word) => word.charAt(0).toUpperCase() + word.slice(1);

/**
 * One ColorPalette row per accent hue: its four fills, quietest to loudest.
 * Hover and press steps are states of these, shown on the States section.
 *
 * @returns {{title: string, subtitle: string, colors: Record<string, string>}[]}
 */
export function accentGroups(scss) {
  const rows = new Map();
  for (const name of declarations(scss).keys()) {
    const m = name.match(/^--ds-background-accent-(.+)-(subtlest|subtler|subtle|bolder)$/);
    if (!m) continue;
    const [, hue, emphasis] = m;
    if (!rows.has(hue)) rows.set(hue, { title: titleCase(hue), subtitle: 'background / accent', colors: {} });
    rows.get(hue).colors[emphasis] = var_(name);
  }
  return [...rows.values()];
}

/**
 * The chart tokens, one row per job: a single series, categorical order,
 * status, SMART subject, and a sequential ramp for each hue. Hover steps are
 * left to the chart.
 *
 * @returns {{title: string, subtitle: string, colors: Record<string, string>}[]}
 */
export function chartGroups(scss) {
  const rows = new Map();
  const add = (key, title, subtitle, label, name) => {
    if (!rows.has(key)) rows.set(key, { title, subtitle, colors: {} });
    rows.get(key).colors[label] = var_(name);
  };
  for (const name of declarations(scss).keys()) {
    if (!name.startsWith('--ds-chart-') || name.endsWith('-hovered')) continue;
    const rest = name.slice('--ds-chart-'.length);
    let m;
    if (rest === 'brand' || rest === 'neutral') add('series', 'One series', 'chart / brand, neutral', rest, name);
    else if ((m = rest.match(/^categorical-(\d+)$/))) add('categorical', 'Categorical', 'chart / categorical, in order', m[1], name);
    else if ((m = rest.match(/^smart-(.+)$/))) add('smart', 'SMART subject', 'chart / smart', m[1], name);
    else if ((m = rest.match(/^(danger|warning|success|information|discovery)(-bold)?$/))) {
      add('status', 'Status', 'chart / status, with bold', rest, name);
    } else if ((m = rest.match(/^(.+)-(bold|bolder|boldest)$/))) {
      add(`sequential-${m[1]}`, `Sequential · ${m[1]}`, 'chart / hue, bold to boldest', m[2], name);
    } else add(`other-${rest}`, rest, 'chart', rest, name);
  }
  return [...rows.values()];
}

/**
 * The text styles grouped by what a Typeset block can draw at once: one family
 * and one weight. A style is the `font` shorthand `weight size / line-height
 * family`, so each group names its family and weight tokens and each style its
 * size and line-height tokens, resolved to their values.
 *
 * @returns {{title: string, family: string, familyToken: string, weightToken: string,
 *   styles: {token: string, sizeToken: string, size: string, lineHeight: string}[]}[]}
 */
export function typeGroups(scss) {
  const decl = declarations(scss);
  const resolve = (token) => decl.get(token);
  const families = new Map();
  for (const [name, value] of decl) {
    const m = name.match(/^--(heading|body|metric)-([a-z]+)$/);
    if (!m || name.endsWith('-tracking')) continue;
    const parts = value.match(/^var\((--type-weight-[a-z]+)\)\s+var\((--font-size-[0-9]+)\)\s*\/\s*var\((--line-height-[0-9]+)\)\s+var\((--type-family-[a-z-]+)\)$/);
    if (!parts) continue;
    const [, weightToken, sizeToken, lineToken, familyToken] = parts;
    const key = `${m[1]}|${familyToken}|${weightToken}`;
    if (!families.has(key)) {
      const family = resolve(familyToken).split(',')[0].replace(/["']/g, '').trim();
      families.set(key, { category: m[1], family, familyToken, weightToken, weight: resolve(weightToken), styles: [] });
    }
    families.get(key).styles.push({ token: name, name: m[2], sizeToken, size: resolve(sizeToken), lineHeight: resolve(lineToken) });
  }
  return [...families.values()].map((g) => {
    const first = g.styles[0].name;
    const last = g.styles[g.styles.length - 1].name;
    const cat = titleCase(g.category);
    return { ...g, title: first === last ? `${cat}/${first}` : `${cat}/${first} to ${cat}/${last}` };
  });
}
