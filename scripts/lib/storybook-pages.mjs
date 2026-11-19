/** Static Storybook page metadata, shared by checks, generators and docs lookup. */
import fs from 'node:fs';
import path from 'node:path';

import { storybookId } from './storybook-id.mjs';
import { trackedFiles } from './tracked-sources.mjs';

const DS_SRC = 'design-system/src';
const toPosix = (file) => file.split(path.sep).join('/');
const strings = (text) => [...text.matchAll(/['"]([^'"]*)['"]/g)].map((m) => m[1]);

/** A module specifier from `fromFile` to a file on disk, repo-relative, or null. `@/` is the design-system source. */
export function resolveStorybookSource(root, fromFile, spec) {
  let base;
  if (spec.startsWith('.')) base = path.resolve(root, path.dirname(fromFile), spec);
  else if (spec.startsWith('@/')) base = path.join(root, DS_SRC, spec.slice(2));
  else return null;
  const tries = [base, ...['.jsx', '.js', '.tsx', '.ts'].map((x) => base + x), ...['index.jsx', 'index.js'].map((x) => path.join(base, x))];
  const file = tries.find((f) => fs.existsSync(f) && fs.statSync(f).isFile());
  return file ? toPosix(path.relative(root, file)) : null;
}

/** What a stories file's meta names as its `component`: `{source}` when the import resolves to one file, else `{name}`. */
function storiesComponent(root, storiesFile) {
  const text = fs.readFileSync(path.join(root, storiesFile), 'utf8');
  const ident = text.match(/(?:^|[{,\s])component:\s*([A-Z]\w*)\s*(?:,|\}|$)/m)?.[1];
  if (!ident) return null;
  for (const m of text.matchAll(/import\s+([^;]+?)\s+from\s+['"]([^'"]+)['"]/g)) {
    const [clause, spec] = [m[1], m[2]];
    const def = clause.match(/^\s*([A-Za-z_$][\w$]*)/)?.[1];
    const named = [...(clause.match(/\{([^}]*)\}/)?.[1] ?? '').split(',')].map((p) => p.trim().split(/\s+as\s+/)).find(([orig, local]) => (local ?? orig) === ident);
    if (def !== ident && !named) continue;
    let file = resolveStorybookSource(root, storiesFile, spec);
    let exported = def === ident ? 'default' : named[0];
    // A folder index: follow its re-export of the name, a few hops at most; still an index, it is a barrel.
    for (let hop = 0; hop < 4 && file && /\/index\.jsx?$/.test(file); hop++) {
      const pattern =
        exported === 'default'
          ? String.raw`\{\s*default\b[^}]*\}`
          : String.raw`\{[^}]*\b(?:default\s+as\s+${exported}|${exported})\b[^}]*\}`;
      const reexport = fs.readFileSync(path.join(root, file), 'utf8').match(new RegExp(String.raw`export\s*${pattern}\s*from\s*['"]([^'"]+)['"]`));
      if (reexport && exported !== 'default' && new RegExp(String.raw`\bdefault\s+as\s+${exported}\b`).test(reexport[0])) exported = 'default';
      file = reexport ? resolveStorybookSource(root, file, reexport[1]) : null;
    }
    if (file && /\/index\.jsx?$/.test(file)) file = null;
    return file ? { source: file } : { name: named ? named[0] : ident };
  }
  return null;
}

/** The literal title in a story default export, excluding example data before it. */
export function storyMetaTitle(source) {
  const meta = storyMeta(source);
  return meta.match(/\btitle:\s*['"]([^'"]+)['"]/)?.[1] ?? null;
}

function storyMeta(source) {
  const direct = source.match(/export\s+default\s*\{/);
  if (direct) return source.slice(direct.index + direct[0].length);
  const name = source.match(/export\s+default\s+(\w+)/)?.[1];
  return name ? source.slice(source.search(new RegExp(`(?:const|let|var)\\s+${name}\\s*=`))) : '';
}

/** A source-only title read, for callers that do not have a repository path. */
export function storybookTitle(source) {
  return source.match(/<Meta\b[^>]*?\btitle\s*=\s*['"]([^'"]+)['"]/)?.[1] ?? storyMetaTitle(source);
}

/** Read literal Meta props without evaluating the page. Unresolved metadata is null. */
export function readStorybookPage(repoRoot, file) {
  file = toPosix(path.relative(repoRoot, path.resolve(repoRoot, file)));
  const source = fs.readFileSync(path.join(repoRoot, file), 'utf8');
  const meta = source.match(/<Meta\b([^>]*)>/)?.[1] ?? '';
  const isStory = /\.stories\.[jt]sx?$/.test(file);
  const of = meta.match(/\bof\s*=\s*\{\s*([\w$]+)\s*\}/)?.[1];
  const imported = of && [...source.matchAll(/import\s+\*\s+as\s+([\w$]+)\s+from\s+['"]([^'"]+)['"]/g)].find((m) => m[1] === of)?.[2];
  const storiesFile = isStory ? file : imported ? resolveStorybookSource(repoRoot, file, imported) : null;
  const storiesSource = isStory ? source : storiesFile ? fs.readFileSync(path.join(repoRoot, storiesFile), 'utf8') : '';
  const title = storybookTitle(isStory ? '' : source) ?? storyMetaTitle(storiesSource);
  const component = storiesFile ? storiesComponent(repoRoot, storiesFile) : null;
  const docsName = meta.match(/\bname\s*=\s*['"]([^'"]+)['"]/)?.[1] ?? 'Docs';
  const tags = [...new Set([
    ...strings(storyMeta(storiesSource).match(/\btags:\s*\[([^\]]*)\]/)?.[1] ?? ''),
    ...strings(meta.match(/\btags\s*=\s*\{\s*\[([^\]]*)\]/)?.[1] ?? ''),
  ])];
  return {
    file, title, categoryRoot: title?.split('/')[0] ?? null,
    docsId: title ? storybookId(title, docsName) : null, docsName, tags,
    storiesFile, componentSource: component?.source ?? null, componentName: component?.name ?? null,
  };
}

/** Every authored MDX and stories file under the design-system source, in path order. */
export function scanStorybookPages(repoRoot) {
  return trackedFiles(repoRoot, [DS_SRC], { untracked: true, skipHidden: true })
    .filter((file) => /(?:\.mdx|\.stories\.[jt]sx?)$/.test(file) && !/ \d+\.mdx$/.test(file))
    .sort()
    .map((file) => readStorybookPage(repoRoot, file));
}
