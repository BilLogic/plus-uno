/**
 * The corpus — the harness's one reader of repo files.
 *
 * Four questions the checks and generators used to answer privately, in one
 * place: which documents exist under a path, where a document's frontmatter
 * stops, which markdown links it carries, and what its heading outline is.
 *
 * IT LIVES HERE BECAUSE THE ANSWER DECIDES A NUMBER. This module absorbs
 * `scripts/lib/frontmatter.mjs`, whose header made the argument and which this
 * file now carries out: frontmatter addresses the tooling, not the model —
 * `agents/uno-bot/scripts/bundle-harness.mjs` strips it before assembly, which
 * is why the char budgets are measured on the bundled BODY and why
 * `check:negation`'s bundled scope counts the body too (#238). The two have to
 * agree on where the fence closes; a second parser that ended the block one
 * line later would charge the prompt for chars it never carries, or credit it
 * with prohibitions the model is never told. That is the one-rule-two-homes
 * defect #159 deleted for membership and #216 deleted for the bundled set, and
 * #503 deletes for reading a document at all.
 *
 * `embodimentOf` in `bundled-set.mjs` reads its one key through this, rather
 * than re-finding the fence with a regex of its own, for the same reason.
 *
 * Every function takes a root or an absolute path and never consults the
 * process's working directory (#469): a checker that takes a root can be
 * tested against a fixture tree instead of having fixtures planted in the live
 * one, which is what `corpus.test.mjs` does.
 *
 * What this module deliberately does NOT read: a backticked path. The house
 * pointer style — `` `docs/conventions/writing.md` `` — is not a link, and
 * `scripts/validate-doc-links.sh` owns the pointer passes. `links()` is
 * markdown links only, and blanks a code span that IS a whole link, since that
 * is a doc teaching Markdown rather than a link this repo owns.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/** The repo root, from this file's own location — never from `process.cwd()`. */
export const REPO_ROOT = path.resolve(HERE, '../..');

/**
 * Directories that hold no authored document, collected from the private
 * walkers this module replaces: `node_modules` and `.git` from every one of
 * them, `.claude` (worktrees, not code) and the build outputs from
 * `check-docs-dead-selectors.mjs`. One list, so that an added exclusion is one
 * edit rather than fourteen.
 */
export const IGNORED_DIRS = new Set([
  'node_modules',
  '.git',
  '.claude',
  'dist',
  'storybook-static',
  'coverage',
  '.test-build',
]);

/** Markdown, unless a caller says otherwise. `.mdx` is asked for by name. */
const DEFAULT_EXTENSIONS = ['.md'];

const toPosix = (p) => p.split(path.sep).join('/');
const isGlob = (p) => /[*?]/.test(p);

/**
 * Every document under a directory, a file, or a glob.
 *
 * @param {string} target repo-relative directory, file, or glob (`docs/**\/*.md`).
 * @param {object} [opts]
 * @param {string} [opts.root] the tree to read; defaults to this repo's root.
 * @param {string[]|null} [opts.ext] extensions to keep; `null` keeps every file.
 * @param {Set<string>} [opts.ignore] directory names to skip.
 * @param {boolean} [opts.skipDotDirs] skip `.foo/` directories (default true) —
 *   which is also what keeps a CI sibling checkout under `.sibling-repos/` from
 *   being read as part of this repo.
 * @returns {string[]} root-relative posix paths, sorted.
 */
export function documents(target, opts = {}) {
  const {
    root = REPO_ROOT,
    ext = DEFAULT_EXTENSIONS,
    ignore = IGNORED_DIRS,
    skipDotDirs = true,
  } = opts;

  const rel = toPosix(target === '' ? '.' : target).replace(/^\.\//, '');
  const keep = (p) => ext === null || ext.some((e) => p.endsWith(e));

  if (!isGlob(rel)) {
    const abs = path.join(root, rel);
    let st;
    try {
      st = fs.statSync(abs);
    } catch {
      return [];
    }
    if (st.isFile()) return keep(rel) ? [rel] : [];
    return walk(root, rel === '.' ? '' : rel, { ignore, skipDotDirs })
      .filter(keep)
      .sort();
  }

  // A glob: walk the literal prefix, match the whole pattern against the path.
  const segments = rel.split('/');
  const firstGlob = segments.findIndex(isGlob);
  const prefix = segments.slice(0, firstGlob).join('/');
  const re = globToRegExp(rel);
  return walk(root, prefix, { ignore, skipDotDirs })
    .filter((p) => re.test(p) && keep(p))
    .sort();
}

/** `**\/` spans directories, `*` and `?` stop at one. */
function globToRegExp(glob) {
  let out = '';
  for (let i = 0; i < glob.length; i++) {
    const c = glob[i];
    if (c === '*') {
      if (glob[i + 1] === '*') {
        // `**/` may also match nothing, so `docs/**/*.md` finds `docs/x.md`.
        if (glob[i + 2] === '/') {
          out += '(?:.*/)?';
          i += 2;
        } else {
          out += '.*';
          i += 1;
        }
      } else {
        out += '[^/]*';
      }
    } else if (c === '?') {
      out += '[^/]';
    } else {
      out += c.replace(/[.+^${}()|[\]\\]/g, '\\$&');
    }
  }
  return new RegExp(`^${out}$`);
}

/** Every file under `rel`, as root-relative posix paths. */
function walk(root, rel, { ignore, skipDotDirs }, out = []) {
  const abs = rel === '' ? root : path.join(root, rel);
  let entries;
  try {
    entries = fs.readdirSync(abs, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const child = rel === '' ? entry.name : `${rel}/${entry.name}`;
    if (entry.isDirectory()) {
      if (ignore.has(entry.name)) continue;
      if (skipDotDirs && entry.name.startsWith('.')) continue;
      walk(root, child, { ignore, skipDotDirs }, out);
    } else {
      out.push(child);
    }
  }
  return out;
}

/**
 * A document's text, whether the caller held the path or the contents.
 *
 * A single-line string that names a readable file is read; anything else is
 * already the text. A relative path is resolved against `opts.root`, never
 * against the working directory.
 */
function textOf(input, opts = {}) {
  if (typeof input !== 'string') {
    throw new TypeError('corpus: expected a file path or the document text');
  }
  if (!input.includes('\n') && input.length < 4096) {
    const abs = path.isAbsolute(input) ? input : path.join(opts.root ?? REPO_ROOT, input);
    try {
      if (fs.statSync(abs).isFile()) return fs.readFileSync(abs, 'utf8');
    } catch {
      /* not a path: it is the text */
    }
  }
  return input;
}

/**
 * A doc's frontmatter keys and the body beneath them.
 *
 * A file with no opening `---`, or with no closing fence, is all body and no
 * meta — the bundler has always treated an unterminated block as content
 * rather than guessing where it meant to end.
 *
 * The value shapes this repo actually uses, handled once: `key: value`, a
 * quoted value (the quotes are YAML syntax, not text), and a folded `>` or
 * literal `|` block, whose indented lines join into one line. An unquoted
 * `[…]` or `{…}` is REFUSED rather than returned: `argument-hint: [prd-required]
 * [fidelity]` was invalid YAML for months, because `[` opens a flow sequence
 * and two on one line is a parse error that takes the whole block down with
 * it — the skill registered with its description missing and nothing said so.
 *
 * @param {string} input a file path or the document text.
 * @param {{root?: string}} [opts] root for a relative path.
 * @returns {{meta: Record<string, string>, body: string}}
 */
export function frontmatter(input, opts = {}) {
  const text = textOf(input, opts).replace(/^﻿/, '');
  if (!/^---\r?\n/.test(text)) return { meta: {}, body: text };
  const start = text.indexOf('\n') + 1;
  const close = text.indexOf('\n---', start);
  if (close === -1) return { meta: {}, body: text };
  return {
    meta: parseFields(text.slice(start, close).split(/\r?\n/)),
    body: text.slice(close + 4).replace(/^(\r?\n)+/, ''),
  };
}

const KEY_LINE = /^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/;

/**
 * Minimal YAML read for the shapes this repo uses. Not a general parser — a
 * real one would be a dependency for four fields, and an unsupported shape
 * throws rather than silently returning undefined.
 */
function parseFields(lines) {
  const out = {};
  for (let i = 0; i < lines.length; i++) {
    const m = KEY_LINE.exec(lines[i]);
    if (!m) continue;
    const [, key, rawValue] = m;
    const raw = rawValue.trim();
    if (/^[>|][-+]?$/.test(raw)) {
      const folded = [];
      while (i + 1 < lines.length && /^\s+\S/.test(lines[i + 1])) folded.push(lines[++i].trim());
      out[key] = folded.join(' ');
    } else {
      out[key] = unquote(key, raw);
    }
  }
  return out;
}

function unquote(key, raw) {
  if (
    raw.length >= 2 &&
    ((raw.startsWith('"') && raw.endsWith('"')) || (raw.startsWith("'") && raw.endsWith("'")))
  ) {
    return raw.slice(1, -1);
  }
  if (/^[[{]/.test(raw)) {
    throw new Error(
      `frontmatter \`${key}: ${raw}\` starts with ${raw[0]} — YAML reads that as a ` +
        `sequence/mapping, not text. Quote the value.`,
    );
  }
  return raw;
}

/**
 * The markdown links in a document: `[text](target)`.
 *
 * A code span that IS a whole link is blanked first — `` `[label](url)` ``
 * inside backticks is a doc teaching Markdown syntax, not a link this repo
 * owns, and eight of them kept `check:docs` permanently red. Only such spans
 * are blanked, never every code span: the house link style is
 * [`path.md`](path.md), and blanking its label would leave `[]()`.
 *
 * A backticked path on its own is NOT a link and is not returned here; it is a
 * pointer, and `scripts/validate-doc-links.sh` owns that pass.
 *
 * @param {string} input a file path or the document text.
 * @param {{root?: string}} [opts] root for a relative path.
 * @returns {{text: string, target: string}[]} in document order.
 */
export function links(input, opts = {}) {
  const text = textOf(input, opts).replace(/`\[[^`]+\]\([^`]+\)`/g, '');
  return [...text.matchAll(/\[([^\]]+)\]\(([^)\s]+(?:\s+"[^"]*")?)\)/g)].map((m) => ({
    text: m[1],
    target: m[2].replace(/\s+"[^"]*"$/, ''),
  }));
}

/**
 * A page's heading outline.
 *
 * Frontmatter is read past rather than through, and a heading inside a fenced
 * block is not a section — a docs page that shows markdown in a fence would
 * otherwise report the example's headings as its own.
 *
 * @param {string} input a file path or the document text.
 * @param {{root?: string}} [opts] root for a relative path.
 * @returns {{depth: number, title: string}[]} in document order.
 */
export function mdxSections(input, opts = {}) {
  const text = textOf(input, opts).replace(/^﻿/, '');
  let body = text;
  if (/^---\r?\n/.test(body)) {
    const start = body.indexOf('\n') + 1;
    const close = body.indexOf('\n---', start);
    if (close !== -1) body = body.slice(close + 4);
  }
  const out = [];
  let inFence = false;
  for (const line of body.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{1,6})\s+(.+?)\s*#*\s*$/.exec(line);
    if (m) out.push({ depth: m[1].length, title: m[2].trim() });
  }
  return out;
}
