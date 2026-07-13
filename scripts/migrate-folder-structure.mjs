#!/usr/bin/env node
/**
 * Phase-3 IA migration: physically regroup design-system folders and rewrite
 * every import (JS alias `@/`, JS relative, SCSS @import) against the move map.
 * See docs/plans/2026-07-12-001-feat-ds-docs-ia-upgrade-plan.md.
 *
 * Usage: node scripts/migrate-folder-structure.mjs [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';

const DRY = process.argv.includes('--dry');
const REPO = process.cwd();
const SRC = 'design-system/src';

// ---------- move map (paths relative to design-system/src) ----------
const GROUPS = {
  actions: ['Button', 'ButtonGroup'],
  'forms-and-inputs': ['Dropdown', 'RichTextEditor'],
  'layout-and-structure': [
    'Accordion', 'Card', 'Carousel', 'Collapse', 'Divider', 'Jumbotron', 'ListGroup', 'MediaObject',
  ],
  messaging: ['Alert', 'Modal', 'Toast'],
  navigation: ['Breadcrumb', 'NavPills', 'NavTabs', 'Pagination', 'Scrollspy', 'SidebarTab'],
  overlays: ['Popover', 'Tooltip'],
  'status-and-loading': ['Badge', 'Progress', 'Spinner'],
  _internal: [
    'CompetencyBadge', 'Footer', 'LoadingGif', 'Logo', 'Navbar', 'PageLayout', 'Section',
    'SessionAvailabilitySnackbar', 'SessionManagementSnackbar', 'Sidebar', 'StaticBadgeSmart',
    'Table', 'UserAvatar', 'layout', 'training',
  ],
};

/** old rel dir (under src) -> new rel dir */
const MOVES = new Map();
for (const [group, names] of Object.entries(GROUPS))
  for (const n of names) MOVES.set(`components/${n}`, `components/${group}/${n}`);
MOVES.set('forms', 'components/forms-and-inputs');
MOVES.set('DataViz/Comparison', 'dataviz/comparison');
MOVES.set('DataViz/Correlation', 'dataviz/correlation');
MOVES.set('DataViz/Distribution', 'dataviz/distribution');
MOVES.set('DataViz/Other', 'dataviz/flow-and-relationships');
MOVES.set('DataViz/PartToWhole', 'dataviz/part-to-whole');
MOVES.set('DataViz/Temporal', 'dataviz/temporal');
MOVES.set('DataViz', 'dataviz'); // catch-all for DataViz/index.js etc.

const MOVE_PREFIXES = [...MOVES.keys()].sort((a, b) => b.length - a.length);

/** map a src-relative posix path through the move table (longest prefix wins) */
function mapRel(rel) {
  for (const old of MOVE_PREFIXES) {
    if (rel === old || rel.startsWith(old + '/'))
      return MOVES.get(old) + rel.slice(old.length);
  }
  return rel;
}

// ---------- collect files ----------
const SCAN_ROOTS = ['design-system/src', 'src', 'playground', '.storybook'];
const JS_EXT = ['.js', '.jsx', '.ts', '.tsx', '.mdx'];
const files = [];
(function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name === 'dist' || e.name.startsWith('.git')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if ([...JS_EXT, '.scss', '.css'].some((x) => e.name.endsWith(x))) files.push(p);
  }
})(REPO && '.');
const scanned = files.filter((f) => SCAN_ROOTS.some((r) => f === r || f.startsWith(r + path.sep)));

// ---------- rewrite ----------
const toPosix = (p) => p.split(path.sep).join('/');
const srcAbs = toPosix(SRC);

/** src-relative posix path of a repo file, or null if outside design-system/src */
const srcRel = (repoRelPosix) =>
  repoRelPosix === srcAbs ? '' :
  repoRelPosix.startsWith(srcAbs + '/') ? repoRelPosix.slice(srcAbs.length + 1) : null;

let rewrites = 0;
const samples = [];

for (const file of scanned) {
  const fileRel = toPosix(file);
  const isScss = fileRel.endsWith('.scss') || fileRel.endsWith('.css');
  const fileSrcRel = srcRel(fileRel);
  const fileDirOldSrcRel = fileSrcRel === null ? null : path.posix.dirname(fileSrcRel || '.');
  const fileDirNewSrcRel = fileDirOldSrcRel === null ? null : mapRel(fileDirOldSrcRel === '.' ? '' : fileDirOldSrcRel);

  const RE = isScss
    ? /(@(?:import|use|forward)\s+)(['"])([^'"\n]+)\2/g
    : /((?:from\s+|import\s+|import\(|require\()\s*)(['"])([^'"\n]+)\2/g;

  const src = fs.readFileSync(file, 'utf8');
  let dirty = false;
  const out = src.replace(RE, (whole, lead, q, spec) => {
    let targetOldSrcRel = null;

    if (spec.startsWith('@/')) {
      targetOldSrcRel = spec.slice(2);
    } else if (spec.startsWith('./') || spec.startsWith('../')) {
      // resolve against the file's OLD repo-relative dir
      const abs = path.posix.normalize(path.posix.join(path.posix.dirname(fileRel), spec));
      targetOldSrcRel = srcRel(abs);
      if (targetOldSrcRel === null) return whole; // resolves outside design-system/src
    } else {
      return whole; // bare module specifier
    }

    const targetNewSrcRel = mapRel(targetOldSrcRel);
    const targetMoved = targetNewSrcRel !== targetOldSrcRel;
    const fileMoved = fileDirNewSrcRel !== null && fileDirNewSrcRel !== (fileDirOldSrcRel === '.' ? '' : fileDirOldSrcRel);
    if (!targetMoved && !(fileMoved && (spec.startsWith('./') || spec.startsWith('../')))) return whole;

    let next;
    if (isScss) {
      // scss cannot use the vite alias — always relative from the file's NEW location
      const fromDir = fileDirNewSrcRel ?? path.posix.dirname(fileRel); // non-src scss keeps repo-rel math
      const target = fileDirNewSrcRel !== null ? targetNewSrcRel : path.posix.join(srcAbs, targetNewSrcRel);
      let rel = path.posix.relative(fromDir, target);
      if (!rel.startsWith('.')) rel = './' + rel;
      next = rel;
    } else if (spec.startsWith('@/')) {
      next = '@/' + targetNewSrcRel;
    } else {
      // relative JS import: keep relative if it stays inside the file's new dir subtree, else alias
      const fromDir = fileDirNewSrcRel;
      if (fromDir === null) {
        // file outside src (e.g. .storybook) importing into src: recompute relative
        let rel = path.posix.relative(path.posix.dirname(fileRel), path.posix.join(srcAbs, targetNewSrcRel));
        if (!rel.startsWith('.')) rel = './' + rel;
        next = rel;
      } else {
        let rel = path.posix.relative(fromDir, targetNewSrcRel);
        if (!rel.startsWith('.')) rel = './' + rel;
        next = rel.startsWith('../') ? '@/' + targetNewSrcRel : rel;
      }
    }

    if (next === spec) return whole;
    dirty = true;
    rewrites++;
    if (samples.length < 40) samples.push(`${fileRel}\n    ${spec}  →  ${next}`);
    return `${lead}${q}${next}${q}`;
  });

  if (dirty && !DRY) fs.writeFileSync(file, out);
}

console.log(`${DRY ? '[dry] ' : ''}${rewrites} import rewrites in ${scanned.length} scanned files`);
console.log(samples.join('\n'));

// ---------- physical moves ----------
if (!DRY) {
  const mv = (a, b) => {
    const A = path.join(SRC, a), B = path.join(SRC, b);
    if (!fs.existsSync(A)) { console.warn(`skip (missing): ${a}`); return; }
    fs.mkdirSync(path.dirname(B), { recursive: true });
    if (A.toLowerCase() === B.toLowerCase() && A !== B) {
      fs.renameSync(A, A + '__tmp'); fs.renameSync(A + '__tmp', B); // case-only rename
    } else {
      fs.renameSync(A, B);
    }
    console.log(`moved ${a} → ${b}`);
  };

  // 1. forms first (so Dropdown/RichTextEditor can join it)
  mv('forms', 'components/forms-and-inputs');
  // 2. component regrouping
  for (const [group, names] of Object.entries(GROUPS))
    for (const n of names) mv(`components/${n}`, `components/${group}/${n}`);
  // 3. dataviz (case-only base rename, then category renames)
  mv('DataViz', 'dataviz');
  mv('dataviz/Comparison', 'dataviz/comparison');
  mv('dataviz/Correlation', 'dataviz/correlation');
  mv('dataviz/Distribution', 'dataviz/distribution');
  mv('dataviz/Other', 'dataviz/flow-and-relationships');
  mv('dataviz/PartToWhole', 'dataviz/part-to-whole');
  mv('dataviz/Temporal', 'dataviz/temporal');
  console.log('done.');
}
