#!/usr/bin/env node
/**
 * `npm run push:figma-color` — push the generated color spec into a Figma file,
 * and check a file against it.
 *
 * WHAT IT PUSHES. `design-system/src/tokens/color/figma-spec.json`, which
 * `npm run generate:color-tokens` writes: the `color / primitives`,
 * `color / foundations` and `opacity` collections and the three
 * `elevation/shadow/*` effect styles. For color, Figma is downstream of the repo
 * (ADR-035), so the spec is the only input and nothing here reads a value from
 * Figma to decide what to write.
 *
 * WHY IT PRINTS RATHER THAN WRITES. Writing variables needs the Plugin API: the
 * REST route is Enterprise-only and this account is not offered its scopes (see
 * `snapshot-figma-variables.mjs`, which prints its probe for the same reason).
 * So every mode of this script prints a Plugin API script for somebody, or an
 * agent's `use_figma` call, to run inside the target file. Each one is under the
 * MCP's 50,000-character limit.
 *
 * WHAT A PUSH GUARANTEES.
 *   - Upsert by name. A collection, mode, variable or effect style is found by
 *     its name and updated in place, or created when absent — so a re-run, or a
 *     retry after a batch failed halfway, converges instead of duplicating.
 *   - Never deletes. Nothing absent from the spec is removed or renamed; the
 *     drift check reports it, and `--diff` names it `extra`, for a person to
 *     decide.
 *   - Order matters only across batches: primitives before the foundations that
 *     alias them, foundations before the effect styles bound to them.
 *
 * WHAT THE DRIFT CHECK COMPARES. Every spec variable reduces to one record —
 * type, scopes, hidden flag, description, WEB code syntax and the value in each
 * spec mode (an alias by target collection and name, or a literal) — and the
 * record to a short hash. Hashes fall into 64 buckets by name. The probe carries
 * the spec's bucket hashes into the file, computes the same from the live
 * variables with the SAME functions (their source is embedded, not re-typed),
 * and returns the counts, the mode names, the effect-style bindings and the live
 * contents of any bucket that differs; `--diff` turns that into named missing,
 * extra and changed variables. A full dump of ~760 variables would not fit back
 * through a tool result, and 760 hashes would not fit comfortably into one; 192
 * buckets do. It is not a harness check: it needs a live Figma session, which no
 * CI job has.
 *
 * Usage:
 *   npm run push:figma-color -- --list            the batches, in run order
 *   npm run push:figma-color -- --batch N         print batch N's Plugin API script
 *   npm run push:figma-color -- --probe           print the drift-check script
 *   npm run push:figma-color -- --diff FILE       name what differs, from the
 *                                                 probe's returned JSON in FILE
 *   ... --out DIR                                 write every batch and the probe
 *                                                 to DIR instead of printing one
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { isEntry } from './lib/findings.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
export const SPEC_PATH = 'design-system/src/tokens/color/figma-spec.json';

/** The MCP's limit is 50,000 characters; the headroom absorbs the runtime prelude. */
export const MAX_SCRIPT_CHARS = 42000;

export function readSpec(root = REPO_ROOT) {
  return JSON.parse(fs.readFileSync(path.join(root, SPEC_PATH), 'utf8'));
}

/** FNV-1a, 32-bit, as 8 hex digits. Embedded in the probe beside `fingerprint`. */
export function fnv(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return ('0000000' + h.toString(16)).slice(-8);
}

/**
 * One variable as a comparable record. Runs in Node AND inside Figma (its
 * source is embedded in the probe), so it uses nothing but plain JavaScript and
 * takes an already-normalized shape:
 *   { type, scopes, hidden, description, web, values: [{alias: 'coll:name'} | {color} | {float}] }
 */
export function fingerprint(rec) {
  const r4 = (n) => Math.round(n * 10000) / 10000;
  const vals = rec.values.map((v) => {
    if (v == null) return 'missing';
    if (v.alias != null) return 'a:' + v.alias;
    if (v.color != null) return 'c:' + [v.color.r, v.color.g, v.color.b, v.color.a == null ? 1 : v.color.a].map(r4).join(',');
    return 'f:' + r4(v.float);
  });
  return fnv(JSON.stringify([rec.type, rec.scopes.slice().sort(), !!rec.hidden, rec.description || '', rec.web || '', vals]));
}

/**
 * Figma stores a description HTML-escaped: set `table's` and the Plugin API
 * reads back `table&#39;s` (and `>` as `&gt;`), measured on 2026-10-25. The
 * probe reads descriptions through this before comparing, so the escaping is not
 * drift; the UI shows the plain text.
 */
export function unescapeHtml(s) {
  return String(s || '')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Variables hashed into a fixed number of buckets by name, each bucket the hash
 * of its sorted `name=fingerprint` lines. The probe carries 64 of these per
 * collection instead of ~760 per-variable hashes, so it stays small enough to
 * paste; a missing, extra or changed variable moves exactly one bucket, and the
 * probe then lists that bucket's live variables for `--diff` to name.
 */
export const BUCKETS = 64;
export function bucketOf(name) {
  return parseInt(fnv(name), 16) % 64;
}
export function bucketHashes(entries) {
  const lines = Array.from({ length: 64 }, () => []);
  for (const [name, fp] of entries) lines[bucketOf(name)].push(name + '=' + fp);
  return lines.map((l) => fnv(l.sort().join('\n')));
}

/**
 * A variable's Figma type. The spec writes `type` only for the shadow geometry;
 * the opacity variables carry a bare number and no type, so a number is FLOAT.
 */
export function typeOf(v) {
  if (v.type) return v.type;
  const first = v.values ? Object.values(v.values)[0] : { value: v.value };
  return first && typeof first.value === 'number' ? 'FLOAT' : 'COLOR';
}

/** The spec's record for one variable, in the shape `fingerprint` takes. */
export function specRecord(collection, v) {
  const type = typeOf(v);
  const values = collection.modes.map((mode) => {
    const raw = v.values ? v.values[mode] : { value: v.value };
    if (raw == null) return null;
    if (raw.alias) return { alias: `${raw.alias}:${raw.name}` };
    return type === 'FLOAT' ? { float: raw.value } : { color: raw.value };
  });
  return {
    type,
    scopes: v.scopes || [],
    hidden: !!v.hiddenFromPublishing,
    description: v.description || '',
    web: (v.codeSyntax && v.codeSyntax.WEB) || '',
    values,
  };
}

/* ------------------------------------------------------------------ push -- */

/**
 * The runtime every push batch shares. `D` is the batch's data:
 *   { parts: [{ collection: {name, modes, hidden}, alias, scopeSets, strings, vars: [...] }], effectStyles: [...] }
 * `vars` is the spec's variables packed by `pack()` below — the spec's own JSON
 * repeats its keys on every value and would need twice the batches; effect
 * styles carry the spec's layers as they are.
 */
const PUSH_RUNTIME = String.raw`
const derivedWeb = __DERIVED_WEB__;
const stateOf = __STATE_OF__;
const unpack = (part) => part.vars.map(([name, t, si, h, d, web, vals]) => ({
  name, type: t ? 'FLOAT' : 'COLOR', scopes: part.scopeSets[si], hiddenFromPublishing: !!h,
  description: typeof d === 'string' ? d : (d[0] === 1 ? stateOf(name) : d[0]) + (d[1] == null ? '' : ' PLUS: ' + part.strings[d[1]]),
  codeSyntax: web === 1 ? { WEB: derivedWeb(name) } : web ? { WEB: web } : null,
  values: Object.fromEntries(part.collection.modes.map((m, i) => {
    const x = vals[i];
    return [m, typeof x === 'string' ? { alias: part.alias, name: x } : { value: Array.isArray(x) ? { r: x[0], g: x[1], b: x[2], a: x[3] } : x }];
  })),
}));
const out = { collections: {}, created: 0, updated: 0, effectStyles: [], errors: [] };
const localCols = await figma.variables.getLocalVariableCollectionsAsync();
const allVars = await figma.variables.getLocalVariablesAsync();
const colName = {};
for (const c of localCols) colName[c.id] = c.name;
const byKey = {};
for (const v of allVars) byKey[colName[v.variableCollectionId] + ':' + v.name] = v;
for (const part of D.parts || []) {
  const spec = part.collection;
  let col = localCols.find((c) => c.name === spec.name);
  if (!col) {
    col = figma.variables.createVariableCollection(spec.name);
    col.renameMode(col.modes[0].modeId, spec.modes[0]);
    localCols.push(col);
    colName[col.id] = col.name;
  }
  for (const m of spec.modes) if (!col.modes.some((x) => x.name === m)) col.addMode(m);
  if (spec.hidden !== undefined && col.hiddenFromPublishing !== spec.hidden) col.hiddenFromPublishing = spec.hidden;
  const modeId = {};
  for (const m of col.modes) modeId[m.name] = m.modeId;
  out.collections[spec.name] = { id: col.id, modes: col.modes.map((m) => m.name) };
  for (const s of unpack(part)) {
    const type = s.type || 'COLOR';
    let v = byKey[spec.name + ':' + s.name];
    if (v && v.resolvedType !== type) { out.errors.push(s.name + ': is ' + v.resolvedType + ', spec says ' + type); continue; }
    if (!v) { v = figma.variables.createVariable(s.name, col, type); byKey[spec.name + ':' + s.name] = v; out.created++; } else out.updated++;
    v.scopes = s.scopes || [];
    v.description = s.description || '';
    v.hiddenFromPublishing = !!s.hiddenFromPublishing;
    if (s.codeSyntax && s.codeSyntax.WEB) v.setVariableCodeSyntax('WEB', s.codeSyntax.WEB);
    for (const mode of spec.modes) {
      const raw = s.values ? s.values[mode] : { value: s.value };
      if (raw.alias) {
        const target = byKey[raw.alias + ':' + raw.name];
        if (!target) { out.errors.push(s.name + ' [' + mode + ']: no ' + raw.alias + ' / ' + raw.name); continue; }
        v.setValueForMode(modeId[mode], figma.variables.createVariableAlias(target));
      } else v.setValueForMode(modeId[mode], raw.value);
    }
  }
}
if (D.effectStyles) {
  const styles = await figma.getLocalEffectStylesAsync();
  const fKey = 'color / foundations:';
  const firstValue = (v) => {
    let val = v.valuesByMode[Object.keys(v.valuesByMode)[0]];
    while (val && val.type === 'VARIABLE_ALIAS') { const t = Object.values(byKey).find((x) => x.id === val.id); val = t.valuesByMode[Object.keys(t.valuesByMode)[0]]; }
    return val;
  };
  for (const s of D.effectStyles) {
    let style = styles.find((x) => x.name === s.name);
    const isNew = !style;
    if (!style) style = figma.createEffectStyle();
    style.name = s.name;
    style.description = s.description || '';
    const effects = [];
    for (const layer of s.layers) {
      const vars = {};
      for (const [field, name] of Object.entries(layer.bind)) {
        vars[field] = byKey[fKey + name];
        if (!vars[field]) out.errors.push(s.name + ': no variable ' + name);
      }
      if (Object.values(vars).some((x) => !x)) continue;
      let e = {
        type: layer.type, visible: true, blendMode: 'NORMAL', showShadowBehindNode: false,
        color: firstValue(vars.color), offset: { x: firstValue(vars.offsetX), y: firstValue(vars.offsetY) },
        radius: firstValue(vars.radius), spread: firstValue(vars.spread),
      };
      for (const field of Object.keys(vars)) e = figma.variables.setBoundVariableForEffect(e, field, vars[field]);
      effects.push(e);
    }
    style.effects = effects;
    out.effectStyles.push({ name: s.name, id: style.id, created: isNew, layers: effects.length });
  }
}
return out;
`;

/** The CSS name a foundations variable takes by rule: `color/text/default` -> `var(--ds-text)`. */
export function derivedWeb(name) {
  return 'var(--ds-' + name.replace(/^color\//, '').replace(/\/default$/, '').split('/').join('-') + ')';
}

/** Atlassian's description for a state token: `color/link/pressed` -> `Pressed state of color.link`. */
export function stateOf(name) {
  const p = name.split('/');
  const last = p.pop();
  return last[0].toUpperCase() + last.slice(1) + ' state of ' + p.join('.');
}

const runtime = PUSH_RUNTIME.replace('__DERIVED_WEB__', () => derivedWeb.toString()).replace('__STATE_OF__', () => stateOf.toString());
const pushScript = (label, data) =>
  `// push:figma-color — ${label}. Generated from ${SPEC_PATH}; safe to re-run.\nconst D = ${JSON.stringify(data)};\n${runtime}`;

const collectionHeader = (c) => ({ name: c.name, modes: c.modes, hidden: c.hiddenFromPublishing });

/**
 * One variable as the array the runtime's `unpack` reads:
 *   [name, isFloat, scopeSetIndex, hidden, description, web, valuePerMode]
 * where a value is a string (an alias into the part's one alias collection), a
 * number (FLOAT) or [r, g, b, a] (COLOR). What a rule can rebuild is not sent:
 * `web` is 1 when `derivedWeb(name)` gives it and 0 when there is none; a
 * description is a string, or [head, tail] with head 1 for `stateOf(name)` and
 * tail an index into the part's `strings` (the PLUS deviation after " PLUS: ",
 * which repeats across a family).
 */
export function pack(collection, v, scopeSets, aliasCollection, strings = []) {
  const type = typeOf(v);
  if (type !== 'COLOR' && type !== 'FLOAT') throw new Error(`${v.name}: unsupported type ${type}`);
  const key = JSON.stringify(v.scopes || []);
  let si = scopeSets.findIndex((x) => JSON.stringify(x) === key);
  if (si < 0) si = scopeSets.push(v.scopes || []) - 1;
  const vals = collection.modes.map((mode) => {
    const raw = v.values ? v.values[mode] : { value: v.value };
    if (raw == null) throw new Error(`${v.name}: no value for mode ${mode}`);
    if (raw.alias) {
      if (raw.alias !== aliasCollection) throw new Error(`${v.name}: aliases ${raw.alias}, the part aliases ${aliasCollection}`);
      return raw.name;
    }
    if (type === 'FLOAT') return raw.value;
    const c = raw.value;
    return [c.r, c.g, c.b, c.a == null ? 1 : c.a];
  });
  const web = (v.codeSyntax && v.codeSyntax.WEB) || '';
  const full = v.description || '';
  const cut = full.indexOf(' PLUS: ');
  const head = cut < 0 ? full : full.slice(0, cut);
  let tail = null;
  if (cut >= 0) {
    const t = full.slice(cut + ' PLUS: '.length);
    tail = strings.indexOf(t);
    if (tail < 0) tail = strings.push(t) - 1;
  }
  const h = head && head === stateOf(v.name) ? 1 : head;
  const desc = h === head && tail === null ? head : [h, tail];
  return [v.name, type === 'FLOAT' ? 1 : 0, si, v.hiddenFromPublishing ? 1 : 0, desc, web === '' ? 0 : web === derivedWeb(v.name) ? 1 : web, vals];
}

/** The one collection a collection's aliases point into, or null when it has none. */
function aliasTarget(c) {
  const targets = new Set();
  for (const v of c.variables) for (const raw of Object.values(v.values || {})) if (raw.alias) targets.add(raw.alias);
  if (targets.size > 1) throw new Error(`${c.name} aliases ${targets.size} collections; pack() takes one`);
  return [...targets][0] || null;
}

/**
 * The spec cut into batches, each a whole script under MAX_SCRIPT_CHARS, in the
 * order they must run. A collection's variables split across batches when they
 * do not fit; every batch re-declares its collection header, so any batch can be
 * re-run alone once its predecessors have run once.
 */
export function batches(spec) {
  const parts = [];
  for (const c of spec.collections) {
    const alias = aliasTarget(c);
    const newPart = () => ({ collection: collectionHeader(c), alias, scopeSets: [], strings: [], vars: [] });
    let part = newPart();
    for (const v of c.variables) {
      const trial = { ...part, scopeSets: [...part.scopeSets], strings: [...part.strings], vars: [...part.vars] };
      trial.vars.push(pack(c, v, trial.scopeSets, alias, trial.strings));
      if (part.vars.length && pushScript('', { parts: [trial] }).length > MAX_SCRIPT_CHARS) {
        parts.push(part);
        part = newPart();
        part.vars.push(pack(c, v, part.scopeSets, alias, part.strings));
      } else part = trial;
    }
    if (part.vars.length) parts.push(part);
  }
  // Small parts ride along with the batch before them when they fit.
  const merged = [];
  for (const p of parts) {
    const prev = merged[merged.length - 1];
    if (prev && pushScript('', { parts: [...prev.parts, p] }).length <= MAX_SCRIPT_CHARS) prev.parts.push(p);
    else merged.push({ parts: [p] });
  }
  merged.push({ effectStyles: spec.effectStyles });
  return merged.map((data, i) => {
    const what = data.effectStyles
      ? `${data.effectStyles.length} effect styles`
      : data.parts.map((p) => `${p.collection.name} ×${p.vars.length}`).join(', ');
    const label = `batch ${i + 1} of ${merged.length}: ${what}`;
    return { label, script: pushScript(label, data) };
  });
}

/* ----------------------------------------------------------------- probe -- */

const PROBE_RUNTIME = String.raw`
const fnv = __FNV__;
const unescapeHtml = __UNESCAPE_HTML__;
const fingerprint = __FINGERPRINT__;
const bucketOf = __BUCKET_OF__;
const bucketHashes = __BUCKET_HASHES__;
const DETAIL = 4;
const out = { collections: {}, differs: [], effectStyles: {} };
const cols = await figma.variables.getLocalVariableCollectionsAsync();
const vars = await figma.variables.getLocalVariablesAsync();
const colName = {};
for (const c of cols) colName[c.id] = c.name;
const byId = {};
for (const v of vars) byId[v.id] = v;
for (const spec of E.collections) {
  const col = cols.find((c) => c.name === spec.name);
  if (!col) { out.collections[spec.name] = { found: false }; continue; }
  const modeIdByName = {};
  for (const m of col.modes) modeIdByName[m.name] = m.modeId;
  const live = vars.filter((v) => v.variableCollectionId === col.id).map((v) => ({
    name: v.name,
    rec: {
      type: v.resolvedType, scopes: v.scopes, hidden: v.hiddenFromPublishing, description: unescapeHtml(v.description),
      web: (v.codeSyntax && v.codeSyntax.WEB) || '',
      values: spec.modes.map((m) => {
        const val = v.valuesByMode[modeIdByName[m]];
        if (val == null) return null;
        if (val.type === 'VARIABLE_ALIAS') { const t = byId[val.id]; return { alias: t ? colName[t.variableCollectionId] + ':' + t.name : 'unresolved:' + val.id }; }
        return typeof val === 'number' ? { float: val } : { color: val };
      }),
    },
  }));
  for (const l of live) l.fp = fingerprint(l.rec);
  const got = bucketHashes(live.map((l) => [l.name, l.fp]));
  const bad = [];
  for (let b = 0; b < got.length; b++) if (got[b] !== spec.buckets[b]) bad.push(b);
  for (const b of bad.slice(0, DETAIL)) out.differs.push({ collection: spec.name, bucket: b, live: live.filter((l) => bucketOf(l.name) === b) });
  out.collections[spec.name] = {
    found: true, variables: live.length, expected: spec.count,
    modes: col.modes.map((m) => m.name), expectedModes: spec.modes,
    hidden: col.hiddenFromPublishing, expectedHidden: spec.hidden,
    bucketsDiffering: bad,
    allScopesCount: live.filter((l) => l.rec.scopes.indexOf('ALL_SCOPES') >= 0).length,
    withWebSyntax: live.filter((l) => l.rec.web).length,
  };
}
const styles = await figma.getLocalEffectStylesAsync();
for (const s of E.effectStyles) {
  const style = styles.find((x) => x.name === s.name);
  if (!style) { out.effectStyles[s.name] = { found: false }; continue; }
  const layers = style.effects.map((e) => {
    const b = {};
    // A fixed key order, the same as expectation().
    for (const [f, a] of Object.entries(e.boundVariables || {}).sort((x, y) => (x[0] < y[0] ? -1 : 1))) b[f] = byId[a.id] ? byId[a.id].name : 'unresolved';
    return { type: e.type, bind: b };
  });
  out.effectStyles[s.name] = { found: true, description: unescapeHtml(style.description) === s.description, match: JSON.stringify(layers) === JSON.stringify(s.layers), layers: layers.length };
}
out.ok = Object.values(out.collections).every((c) => c.found && !c.bucketsDiffering.length && c.variables === c.expected && c.hidden === c.expectedHidden && JSON.stringify(c.modes) === JSON.stringify(c.expectedModes))
  && Object.values(out.effectStyles).every((s) => s.found && s.description && s.match);
return out;
`;

/** Every spec variable's fingerprint, by collection. */
export function specFingerprints(spec) {
  return Object.fromEntries(spec.collections.map((c) => [c.name, c.variables.map((v) => [v.name, fingerprint(specRecord(c, v)), specRecord(c, v)])]));
}

/** What the probe carries in: bucket hashes per collection and effect-style bindings. */
export function expectation(spec) {
  const fps = specFingerprints(spec);
  return {
    collections: spec.collections.map((c) => ({
      name: c.name,
      modes: c.modes,
      hidden: !!c.hiddenFromPublishing,
      count: c.variables.length,
      buckets: bucketHashes(fps[c.name].map(([n, fp]) => [n, fp])),
    })),
    effectStyles: spec.effectStyles.map((s) => ({
      name: s.name,
      description: s.description || '',
      layers: s.layers.map((l) => ({ type: l.type, bind: Object.fromEntries(Object.keys(l.bind).sort().map((k) => [k, l.bind[k]])) })),
    })),
  };
}

export function probeScript(spec) {
  const runtime = PROBE_RUNTIME.replace('__FNV__', () => fnv.toString())
    .replace('__UNESCAPE_HTML__', () => unescapeHtml.toString())
    .replace('__FINGERPRINT__', () => fingerprint.toString())
    .replace('__BUCKET_OF__', () => bucketOf.toString())
    .replace('__BUCKET_HASHES__', () => bucketHashes.toString());
  return `// push:figma-color — drift check. Generated from ${SPEC_PATH}; read-only.\nconst E = ${JSON.stringify(expectation(spec))};\n${runtime}`;
}

/**
 * Names what a probe's differing buckets hold: `missing` (in the spec, not the
 * file), `extra` (in the file, not the spec) and `changed`, each changed entry
 * with both records. Takes the probe's returned JSON.
 */
export function diff(spec, probe) {
  const fps = specFingerprints(spec);
  const result = { missing: [], extra: [], changed: [], undetailed: [] };
  for (const [name, c] of Object.entries(probe.collections)) {
    const shown = new Set(probe.differs.filter((d) => d.collection === name).map((d) => d.bucket));
    for (const b of c.bucketsDiffering || []) if (!shown.has(b)) result.undetailed.push(`${name} bucket ${b}`);
  }
  for (const d of probe.differs) {
    const want = new Map((fps[d.collection] || []).filter(([n]) => bucketOf(n) === d.bucket).map(([n, fp, rec]) => [n, { fp, rec }]));
    const got = new Map(d.live.map((l) => [l.name, l]));
    for (const [n] of want) if (!got.has(n)) result.missing.push(`${d.collection} / ${n}`);
    for (const [n, l] of got) {
      if (!want.has(n)) result.extra.push(`${d.collection} / ${n}`);
      else if (want.get(n).fp !== l.fp) result.changed.push({ name: `${d.collection} / ${n}`, spec: want.get(n).rec, live: l.rec });
    }
  }
  return result;
}

/* ------------------------------------------------------------------- cli -- */

function cli(argv) {
  const spec = readSpec();
  const all = batches(spec);
  const arg = (flag) => {
    const i = argv.indexOf(flag);
    return i >= 0 ? argv[i + 1] : undefined;
  };
  const outDir = arg('--out');
  if (outDir) {
    fs.mkdirSync(outDir, { recursive: true });
    all.forEach((b, i) => fs.writeFileSync(path.join(outDir, `batch-${i + 1}.js`), b.script));
    fs.writeFileSync(path.join(outDir, 'probe.js'), probeScript(spec));
    console.log(`Wrote ${all.length} batches and probe.js to ${outDir}. Run the batches in order, then the probe.`);
    return 0;
  }
  const diffFile = arg('--diff');
  if (diffFile) {
    const d = diff(spec, JSON.parse(fs.readFileSync(diffFile, 'utf8')));
    console.log(JSON.stringify(d, null, 2));
    return d.missing.length || d.extra.length || d.changed.length || d.undetailed.length ? 1 : 0;
  }
  if (argv.includes('--probe')) {
    process.stdout.write(probeScript(spec));
    return 0;
  }
  const n = arg('--batch');
  if (n !== undefined) {
    const b = all[Number(n) - 1];
    if (!b) {
      console.error(`No batch ${n}; there are ${all.length}.`);
      return 1;
    }
    process.stdout.write(b.script);
    return 0;
  }
  all.forEach((b) => console.log(`${b.label}  (${b.script.length} chars)`));
  console.log('\nRun each with --batch N inside the target file, in order; then --probe.');
  return 0;
}

if (isEntry(import.meta.url)) process.exitCode = cli(process.argv.slice(2));
