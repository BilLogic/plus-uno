#!/usr/bin/env node
/**
 * Phase-3b IA migration: normalize specs/ folder names to the spec grammar
 * `specs/<Area>/(<Phase>/)<Type>/<Component>` — Title Case phases/types,
 * PascalCase (no spaces/parens) component folders — and rewrite all imports.
 * See docs/plans/2026-07-12-001-feat-ds-docs-ia-upgrade-plan.md.
 *
 * Usage: node scripts/migrate-specs-folders.mjs [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';

const DRY = process.argv.includes('--dry');
const SRC = 'design-system/src';
const SPECS = path.join(SRC, 'specs');

const EXPLICIT = new Map([
  ['specs/Admin/Group Admin', 'Group'],
  ['specs/Admin/Session Admin', 'Session'],
  ['specs/Admin/Student Admin', 'Student'],
  ['specs/Admin/Tutor Admin', 'Tutor'],
  ['specs/Training/onboarding', 'Onboarding'],
  ['specs/Training/TrainingLessons', 'Lessons'],
  ['specs/Toolkit/pre-session', 'Pre-Session'],
  ['specs/Toolkit/in-session', 'In-Session'],
  ['specs/Toolkit/post-session', 'Post-Session'],
]);
const TYPE_DIRS = new Set(['elements', 'cards', 'tables', 'modals', 'sections', 'pages']);

const pascal = (name) =>
  name
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');

/** decide the new basename for a dir (or null = unchanged) */
function newName(origSrcRelPath, base, depthUnderToolkitPhase) {
  if (EXPLICIT.has(origSrcRelPath)) return EXPLICIT.get(origSrcRelPath);
  if (depthUnderToolkitPhase === 0 && TYPE_DIRS.has(base))
    return base.charAt(0).toUpperCase() + base.slice(1);
  if (/[ ()]/.test(base)) return pascal(base);
  return null;
}

// ---- build sequential rename rules (shallow-first; keys use transformed parents) ----
const rules = []; // { fromRel, toRel } src-relative
(function walk(origRel, newRel, toolkitPhaseDepth) {
  const abs = path.join(SRC, ...origRel.split('/').slice(0)); // orig on disk
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    if (!e.isDirectory()) continue;
    const childOrig = `${origRel}/${e.name}`;
    const isPhase = EXPLICIT.has(childOrig) && childOrig.startsWith('specs/Toolkit/');
    const nn = newName(childOrig, e.name, toolkitPhaseDepth);
    const childNewBase = nn ?? e.name;
    const childNewRel = `${newRel}/${childNewBase}`;
    if (nn && nn !== e.name) rules.push({ fromRel: `${newRel}/${e.name}`, toRel: childNewRel });
    walk(childOrig, childNewRel, isPhase ? 0 : toolkitPhaseDepth >= 0 ? toolkitPhaseDepth + 1 : -1);
  }
})('specs', 'specs', -1);

// mapping: apply rules in order to a src-relative path
function mapRel(rel) {
  let p = rel;
  for (const { fromRel, toRel } of rules) {
    if (p === fromRel || p.startsWith(fromRel + '/')) p = toRel + p.slice(fromRel.length);
  }
  return p;
}

console.log(`${rules.length} folder renames planned:`);
rules.forEach((r) => console.log(`  ${r.fromRel}  →  ${r.toRel}`));

// ---- rewrite imports (same machinery as migrate-folder-structure) ----
const SCAN_ROOTS = ['design-system/src', 'src', 'prototypes', '.storybook', 'scripts'];
const files = [];
(function collect(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name.startsWith('.git')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) collect(p);
    else if (['.js', '.jsx', '.ts', '.tsx', '.mdx', '.scss', '.css'].some((x) => e.name.endsWith(x)))
      files.push(p);
  }
})('.');
const scanned = files.filter((f) => SCAN_ROOTS.some((r) => f === r || f.startsWith(r + path.sep)));

const toPosix = (p) => p.split(path.sep).join('/');
const srcRelOf = (repoRel) =>
  repoRel === SRC ? '' : repoRel.startsWith(SRC + '/') ? repoRel.slice(SRC.length + 1) : null;

let rewrites = 0;
const samples = [];
for (const file of scanned) {
  const fileRel = toPosix(file);
  const isScss = fileRel.endsWith('.scss') || fileRel.endsWith('.css');
  const fileSrcRel = srcRelOf(fileRel);
  const fileDirOld = fileSrcRel === null ? null : path.posix.dirname(fileSrcRel || '.');
  const fileDirNew = fileDirOld === null ? null : mapRel(fileDirOld === '.' ? '' : fileDirOld);

  const RE = isScss
    ? /(@(?:import|use|forward)\s+)(['"])([^'"\n]+)\2/g
    : /((?:from\s+|import\s+|import\(|require\()\s*)(['"])([^'"\n]+)\2/g;

  const srcTxt = fs.readFileSync(file, 'utf8');
  let dirty = false;
  const out = srcTxt.replace(RE, (whole, lead, q, spec) => {
    let targetOld = null;
    if (spec.startsWith('@/')) targetOld = spec.slice(2);
    else if (spec.startsWith('./') || spec.startsWith('../')) {
      const abs = path.posix.normalize(path.posix.join(path.posix.dirname(fileRel), spec));
      targetOld = srcRelOf(abs);
      if (targetOld === null) return whole;
    } else return whole;

    const targetNew = mapRel(targetOld);
    const fileMoved = fileDirNew !== null && fileDirNew !== (fileDirOld === '.' ? '' : fileDirOld);
    if (targetNew === targetOld && !(fileMoved && !spec.startsWith('@/'))) return whole;

    let next;
    if (spec.startsWith('@/')) next = '@/' + targetNew;
    else {
      const fromDir = fileDirNew ?? null;
      if (fromDir === null) {
        let rel = path.posix.relative(path.posix.dirname(fileRel), SRC + '/' + targetNew);
        if (!rel.startsWith('.')) rel = './' + rel;
        next = rel;
      } else {
        let rel = path.posix.relative(fromDir, targetNew);
        if (!rel.startsWith('.')) rel = './' + rel;
        next = isScss ? rel : rel.startsWith('../../') ? '@/' + targetNew : rel;
      }
    }
    if (next === spec) return whole;
    dirty = true;
    rewrites++;
    if (samples.length < 30) samples.push(`${fileRel}: ${spec} → ${next}`);
    return `${lead}${q}${next}${q}`;
  });
  if (dirty && !DRY) fs.writeFileSync(file, out);
}
console.log(`\n${DRY ? '[dry] ' : ''}${rewrites} import rewrites`);
console.log(samples.join('\n'));

// ---- physical renames (rules are shallow-first; keys already use renamed parents) ----
if (!DRY) {
  for (const { fromRel, toRel } of rules) {
    const A = path.join(SRC, fromRel), B = path.join(SRC, toRel);
    if (!fs.existsSync(A)) { console.warn(`skip missing ${fromRel}`); continue; }
    if (A.toLowerCase() === B.toLowerCase() && A !== B) {
      fs.renameSync(A, A + '__tmp'); fs.renameSync(A + '__tmp', B);
    } else fs.renameSync(A, B);
  }
  console.log('renames done.');
}
