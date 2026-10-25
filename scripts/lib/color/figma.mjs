/**
 * The Figma spec: the variable collections and effect styles a Figma push
 * script consumes. Port of the reference generator's `figma.py`. Nothing here
 * writes to Figma.
 *
 * Collections:
 *   color / primitives   one mode, hidden from publishing, scopes [] (picked only through foundations)
 *   color / foundations  Light, Dark, Light IC, Dark IC; every value an alias to a primitive except
 *                        shadow layer colors and transparent, which are literal
 *   opacity              one mode
 * Effect styles: elevation/shadow/{raised,overlay,overflow}. Every field of every layer is bound to a
 * foundations variable (COLOR for the color, FLOAT for offsets, radius and spread), so shadows switch
 * with the mode.
 */

import { parseHex, pyRound } from './oklch.mjs';
import { dsName } from './emit.mjs';

const MODES = [['Light', 'light'], ['Dark', 'dark'], ['Light IC', 'light_ic'], ['Dark IC', 'dark_ic']];
const FILL = ['FRAME_FILL', 'SHAPE_FILL'];

function scopes(name) {
  if (name.startsWith('color.text') || name.startsWith('color.link')) return ['TEXT_FILL'];
  if (name.startsWith('color.icon')) return ['TEXT_FILL', 'SHAPE_FILL', 'STROKE_COLOR']; // Font Awesome glyphs are text
  if (name.startsWith('color.border')) return ['STROKE_COLOR'];
  if (name.startsWith('color.chart')) return [...FILL, 'STROKE_COLOR'];
  if (name.startsWith('elevation.shadow')) return ['EFFECT_COLOR'];
  return FILL; // backgrounds, surfaces, blanket, interaction, skeleton, utility
}

export function rgba(hex) {
  const { r, g, b, a } = parseHex(hex);
  const ch = (v) => pyRound(v / 255, 4);
  return { r: ch(r), g: ch(g), b: ch(b), a: pyRound(a === null ? 1 : a / 255, 4) };
}

/**
 * @param {string} plan  the plan key, recorded in the spec
 * @param {{rows: object[], shadows: object[], opacity: object[], palette: object}} semantics
 */
export function figmaSpec(plan, { rows, shadows, opacity, palette }) {
  const primitives = [];
  for (const [fam, steps] of Object.entries(palette)) {
    if (fam === 'shadow') continue; // geometry, emitted as the shadow variables below
    for (const [step, v] of Object.entries(steps)) {
      primitives.push({ name: `${fam}/${step}`, value: rgba(v.hex), scopes: [], hiddenFromPublishing: true });
    }
  }
  const names = rows.map((r) => r.name);
  // A token that is also a group (color.text and color.text.subtle) takes a /default leaf.
  const path = (n) => n.replaceAll('.', '/') + (names.some((m) => m.startsWith(`${n}.`)) ? '/default' : '');
  const found = [];
  for (const r of rows) {
    const values = {};
    for (const [label, k] of MODES) {
      const ref = r[`${k}_ref`];
      values[label] = ref !== 'transparent' ? { alias: 'color / primitives', name: ref.replaceAll('.', '/') } : { value: rgba('#00000000') };
    }
    const desc = (r.use || '') + (r.deviation ? ` PLUS: ${r.deviation}` : '');
    found.push({
      name: path(r.name),
      codeSyntax: { WEB: `var(${dsName(r.name)})` },
      scopes: scopes(r.name),
      hiddenFromPublishing: r.name.includes('.chart.') || r.name.includes('.code.') || r.name.endsWith('.code'),
      description: desc.trim(),
      values,
    });
  }

  const effects = [];
  for (const sh of shadows) {
    if (sh.name.split('.').length - 1 > 2) continue; // overflow.spread / .perimeter are the colors already inside overflow
    const base = sh.name.replaceAll('.', '/');
    const perMode = Object.fromEntries(
      MODES.map(([label, k]) => [label, sh[k].split(',').map((l) => l.trim())]),
    );
    const layers = [];
    for (let i = 0; i < perMode.Light.length; i++) {
      const variable = `${base}/layer-${i + 1}`;
      const geo = {};
      for (const label of Object.keys(perMode)) {
        const parts = perMode[label][i].split(/\s+/);
        const nums = parts.slice(0, -1).map((p) => Number(p.replace('px', '')));
        while (nums.length < 4) nums.push(0);
        geo[label] = { x: nums[0], y: nums[1], blur: nums[2], spread: nums[3] };
        let color = found.find((f) => f.name === variable);
        if (!color) {
          color = { name: variable, codeSyntax: {}, scopes: ['EFFECT_COLOR'], hiddenFromPublishing: true,
            description: `Layer ${i + 1} color of ${sh.name}; literal per mode, bound into the effect style.`, values: {} };
          found.push(color);
        }
        color.values[label] = { value: rgba(parts.at(-1)) };
      }
      // Every field is bound (setBoundVariableForEffect takes color, offsetX, offsetY, radius, spread),
      // so geometry can differ by mode: dark shadows are tighter and darker than light ones.
      const bind = { color: variable };
      for (const [field, key] of [['offsetX', 'x'], ['offsetY', 'y'], ['radius', 'blur'], ['spread', 'spread']]) {
        const fv = `${variable}/${field}`;
        found.push({ name: fv, type: 'FLOAT', codeSyntax: {}, scopes: ['EFFECT_FLOAT'], hiddenFromPublishing: true,
          description: `${field} of layer ${i + 1} of ${sh.name}.`,
          values: Object.fromEntries(Object.keys(geo).map((m) => [m, { value: geo[m][key] }])) });
        bind[field] = fv;
      }
      const same = (g, h) => g.x === h.x && g.y === h.y && g.blur === h.blur && g.spread === h.spread;
      layers.push({ type: 'DROP_SHADOW', bind, geometryDiffersByMode: Object.keys(geo).some((m) => !same(geo[m], geo.Light)) });
    }
    effects.push({ name: base, description: sh.use, layers });
  }
  const opacityVars = opacity.map((o) => ({ name: o.name.replaceAll('.', '/'), value: pyRound(Number(o.light) * 100), unit: 'percent', scopes: ['OPACITY'] }));
  return {
    plan,
    collections: [
      { name: 'color / primitives', modes: ['Value'], hiddenFromPublishing: true, variables: primitives },
      { name: 'color / foundations', modes: MODES.map(([m]) => m), variables: found },
      { name: 'opacity', modes: ['Value'], variables: opacityVars },
    ],
    effectStyles: effects,
  };
}
