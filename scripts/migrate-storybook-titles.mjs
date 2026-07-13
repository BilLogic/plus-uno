#!/usr/bin/env node
/**
 * One-shot codemod: rewrite Storybook titles to the v2 IA
 * (docs/plans/2026-07-12-001-feat-ds-docs-ia-upgrade-plan.md).
 *
 * Rewrites `title: '...'` in *.stories.jsx and `title="..."` in <Meta> of *.mdx.
 * Only titles matching a known mapping/prefix rule are touched; everything else
 * (story-arg `title:` props etc.) is left alone and reported.
 *
 * Usage: node scripts/migrate-storybook-titles.mjs [--dry]
 */
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(process.cwd(), 'design-system/src');
const DRY = process.argv.includes('--dry');

// ---------- display-name maps ----------

const COMPONENT_GROUP = {
  Button: ['Actions', 'Button'],
  ButtonGroup: ['Actions', 'Button group'],
  Dropdown: ['Forms and inputs', 'Dropdown'],
  RichTextEditor: ['Forms and inputs', 'Rich text editor'],
  Accordion: ['Layout and structure', 'Accordion'],
  Card: ['Layout and structure', 'Card'],
  Carousel: ['Layout and structure', 'Carousel'],
  Collapse: ['Layout and structure', 'Collapse'],
  Divider: ['Layout and structure', 'Divider'],
  Jumbotron: ['Layout and structure', 'Jumbotron'],
  ListGroup: ['Layout and structure', 'List group'],
  MediaObject: ['Layout and structure', 'Media object'],
  Alert: ['Messaging', 'Alert'],
  Modal: ['Messaging', 'Modal'],
  Toast: ['Messaging', 'Toast'],
  Breadcrumb: ['Navigation', 'Breadcrumb'],
  NavPills: ['Navigation', 'Nav pills'],
  NavTabs: ['Navigation', 'Nav tabs'],
  Pagination: ['Navigation', 'Pagination'],
  Scrollspy: ['Navigation', 'Scrollspy'],
  SidebarTab: ['Navigation', 'Sidebar tab'],
  Popover: ['Overlays', 'Popover'],
  Tooltip: ['Overlays', 'Tooltip'],
  Badge: ['Status and loading', 'Badge'],
  Loading: ['Status and loading', 'Loading'],
  Progress: ['Status and loading', 'Progress'],
  Spinner: ['Status and loading', 'Loading'],
};

const FORMS_RENAME = {
  'Choice Grid': 'Choice grid',
  'Date Picker': 'Date picker',
  'File Upload': 'File upload',
  'Input Group': 'Input group',
  'Label and Caption': 'Label & caption',
  'Multiple Choice': 'Multiple choice',
  'Number Input': 'Number input',
  'Time Picker': 'Time picker',
  'Textarea ver 2': null, // → Deprecated/Textarea ver 2
};

const STYLES_TO_FOUNDATIONS = {
  Icons: 'Iconography',
  Colors: 'Color',
  Layout: 'Layout & grid',
  Typography: 'Typography',
  Elevation: 'Elevation',
  Introduction: 'Introduction',
};

const DATAVIZ_CATEGORY = {
  Comparison: 'Comparison',
  Correlation: 'Correlation',
  Distribution: 'Distribution',
  Other: 'Flow & relationships',
  PartToWhole: 'Part-to-whole',
  Temporal: 'Temporal',
};

const CHART_SPECIAL = { XRangeChart: 'X-range chart' };
const sentenceCase = (name) => {
  if (CHART_SPECIAL[name]) return CHART_SPECIAL[name];
  const words = name.replace(/([a-z0-9])([A-Z])/g, '$1 $2').split(' ');
  return words
    .map((w, i) => (i === 0 ? w : w.toLowerCase()))
    .join(' ');
};

// ---------- title mapper ----------

function mapTitle(t) {
  // Getting started
  if (t === 'PLUS Docs/Introduction' || t.startsWith('PLUS Docs/'))
    return t.replace(/^PLUS Docs\//, 'Getting started/');

  // Patterns (before generic Styles handling)
  if (t.startsWith('Styles/Patterns/')) {
    const rest = t.slice('Styles/Patterns/'.length);
    return `Patterns/${rest === 'SurfaceContainer' ? 'Surface container' : rest}`;
  }
  if (t === 'Styles/Patterns') return 'Patterns/Introduction';

  // Foundations
  if (t.startsWith('Styles/')) {
    const rest = t.slice('Styles/'.length);
    if (STYLES_TO_FOUNDATIONS[rest]) return `Foundations/${STYLES_TO_FOUNDATIONS[rest]}`;
    return `Foundations/${rest}`;
  }
  if (t === 'Assets/Logo') return 'Foundations/Logos';
  if (t === 'Assets/Images') return 'Foundations/Imagery';

  // Components (base library)
  const comp = /^Components\/([^/]+)(\/.*)?$/.exec(t);
  if (comp) {
    const [, name, rest = ''] = comp;
    const hit = COMPONENT_GROUP[name];
    if (hit) return `Components/${hit[0]}/${hit[1]}${rest}`;
    return null; // unknown base component — report
  }

  // Forms → Components/Forms and inputs
  const form = /^Forms\/([^/]+)(\/.*)?$/.exec(t);
  if (form) {
    const [, name, rest = ''] = form;
    if (name in FORMS_RENAME && FORMS_RENAME[name] === null)
      return `Deprecated/${name}${rest}`;
    const display = FORMS_RENAME[name] ?? name;
    return `Components/Forms and inputs/${display}${rest}`;
  }

  // Data visualizations
  const dv = /^Data Visualizations\/([^/]+)\/([^/]+)(\/.*)?$/.exec(t);
  if (dv) {
    const [, cat, chart, rest = ''] = dv;
    const newCat = DATAVIZ_CATEGORY[cat] ?? cat;
    return `Data visualizations/${newCat}/${sentenceCase(chart)}${rest}`;
  }

  // Specs
  if (t.startsWith('Specs/')) {
    let s = t;
    // area overview pages (bare area titles)
    const bare = {
      'Specs/Universal': 'Specs/Universal/Overview',
      'Specs/Profile': 'Specs/Profile/Overview',
      'Specs/Toolkit': 'Specs/Toolkit/Overview',
      'Specs/Training': 'Specs/Training/Overview',
      'Specs/Admin': 'Specs/Admin/Overview',
      'Specs/Login': 'Specs/Login/Overview',
      'Specs/Home': 'Specs/Home/Overview',
      'Specs/Admin/Tutor Admin': 'Specs/Admin/Tutor/Overview',
      'Specs/Admin/Session Admin': 'Specs/Admin/Session/Overview',
      'Specs/Admin/Student Admin': 'Specs/Admin/Student/Overview',
      'Specs/Admin/Group Admin': 'Specs/Admin/Group/Overview',
    };
    if (bare[s]) return bare[s];
    // Admin sub-area rename
    s = s
      .replace(/^Specs\/Admin\/Tutor Admin\//, 'Specs/Admin/Tutor/')
      .replace(/^Specs\/Admin\/Session Admin\//, 'Specs/Admin/Session/')
      .replace(/^Specs\/Admin\/Student Admin\//, 'Specs/Admin/Student/')
      .replace(/^Specs\/Admin\/Group Admin\//, 'Specs/Admin/Group/');
    // Training lessons rename
    s = s.replace(/^Specs\/Training\/TrainingLessons\//, 'Specs/Training/Lessons/');
    // Toolkit phase casing fix
    s = s
      .replace(/^Specs\/Toolkit\/Pre-session\//, 'Specs/Toolkit/Pre-Session/')
      .replace(/^Specs\/Toolkit\/In-session\//, 'Specs/Toolkit/In-Session/')
      .replace(/^Specs\/Toolkit\/Post-session\//, 'Specs/Toolkit/Post-Session/');
    return s === t ? t : s; // returning t means "valid, unchanged"
  }

  return null; // not a taxonomy title (story-arg title props, legacy strays)
}

// ---------- walk & rewrite ----------

const exts = ['.stories.jsx', '.stories.js', '.stories.tsx', '.mdx'];
const files = [];
(function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (exts.some((x) => e.name.endsWith(x))) files.push(p);
  }
})(ROOT);

const TITLE_RE = /(title(?:\s*:\s*|\s*=\s*))(['"])([^'"\n]+)\2/g;
let changed = 0;
const unmatched = new Map();
const rewrites = new Map();

for (const file of files) {
  const src = fs.readFileSync(file, 'utf8');
  let dirty = false;
  const out = src.replace(TITLE_RE, (whole, lead, q, title) => {
    // Only consider CSF meta / MDX Meta titles: they contain a slash or are known bare titles.
    const next = mapTitle(title);
    if (next === null) {
      if (/^(Components|Forms|Styles|Assets|PLUS Docs|Data Visualizations|Specs)\b/.test(title)) {
        unmatched.set(title, path.relative(ROOT, file));
      }
      return whole;
    }
    if (next === title) return whole;
    dirty = true;
    changed++;
    rewrites.set(title, next);
    return `${lead}${q}${next}${q}`;
  });
  if (dirty && !DRY) fs.writeFileSync(file, out);
}

console.log(`${DRY ? '[dry-run] ' : ''}${changed} title rewrites across ${files.length} scanned files`);
console.log('\n--- sample rewrites ---');
[...rewrites].slice(0, 200).forEach(([a, b]) => console.log(`${a}  →  ${b}`));
if (unmatched.size) {
  console.log('\n--- UNMATCHED taxonomy-looking titles (review manually) ---');
  [...unmatched].forEach(([t, f]) => console.log(`${t}   (${f})`));
}
