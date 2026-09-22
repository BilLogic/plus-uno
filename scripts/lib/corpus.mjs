/**
 * The corpus — the harness's one reader of repo files.
 *
 * Seven questions the checks and generators used to answer privately, in one
 * place: which documents exist under a path, which directories do, WHAT A FILE
 * SAYS, where a document's frontmatter stops, which markdown links it carries,
 * what it reads like with those links reduced to their text, and what its
 * heading outline is.
 *
 * `text` is the seventh and the plainest, and it is exported for the same
 * reason as the other six rather than for a new one: a caller that listed a
 * file through `documents` and then read it with its own `fs.readFileSync` has
 * half a reader of its own, and half a reader is where a second root comes
 * from — the one it resolves the relative path against. `text` takes the same
 * `root` as the walk, so the listing and the read cannot disagree about which
 * tree they are looking at (#620). The callers that still pair `documents`
 * with a private `readFileSync` are unconverted, not endorsed.
 *
 * TWO MODES, BECAUSE A GENERATOR AND A GUARD WANT OPPOSITE THINGS of an
 * unreadable directory. The default walk is forgiving; `strict: true` throws on
 * a directory it cannot read and lets one unresolvable entry cost only itself,
 * which is what a check that reports a number needs — see `walk` below.
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
 * `scripts/check-doc-links.mjs` owns the pointer passes. `links()` is
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
 * The GENERATED harness bundle, which is not an authored document.
 *
 * It is assembled from documents the sweeps already read at their own paths,
 * so every pointer and every link inside it is a second copy — and one that
 * resolves from the bundle's directory rather than the source's, which invents
 * misses that no author can fix. Both `check-doc-links.mjs` and
 * `check-pointers.mjs` exclude it, which is two checks with the same rule and
 * so one home for it, per this module's own header.
 */
export const GENERATED_BUNDLE = /^agents\/uno-bot\/harness-bundle\.md$/;

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
 * @param {(name: string) => boolean} [opts.skipEntry] skip an entry by name,
 *   file or directory — the shape a sweep needs for `__fixture` names another
 *   test is planting in the live tree right now.
 * @param {boolean} [opts.strict] never under-sweep: see § Strict below.
 * @returns {string[]} root-relative posix paths, sorted.
 */
export function documents(target, opts = {}) {
  const {
    root = REPO_ROOT,
    ext = DEFAULT_EXTENSIONS,
    ignore = IGNORED_DIRS,
    skipDotDirs = true,
    skipEntry = null,
    strict = false,
  } = opts;

  const rel = toPosix(target === '' ? '.' : target).replace(/^\.\//, '');
  const keep = (p) => ext === null || ext.some((e) => p.endsWith(e));
  const how = { ignore, skipDotDirs, skipEntry, strict };

  if (!isGlob(rel)) {
    const abs = path.join(root, rel);
    let st;
    try {
      st = fs.statSync(abs);
    } catch (err) {
      // An ABSENT target is normal in both modes — a sweep names roots that not
      // every tree has. Anything else, under `strict`, is the walk failing to
      // see what it is about to vouch for.
      if (strict && err.code !== 'ENOENT') throw err;
      return [];
    }
    if (st.isFile()) return keep(rel) ? [rel] : [];
    return walk(root, rel === '.' ? '' : rel, how)
      .filter(keep)
      .sort();
  }

  // A glob: walk the literal prefix, match the whole pattern against the path.
  const segments = rel.split('/');
  const firstGlob = segments.findIndex(isGlob);
  const prefix = segments.slice(0, firstGlob).join('/');
  // An ABSENT prefix is the absent target of the branch above, spelled as a
  // glob: a sweep names roots that not every tree has. Strict is about a
  // directory that exists and cannot be read, not about one that is not there.
  if (prefix !== '' && !fs.existsSync(path.join(root, prefix))) return [];
  const re = globToRegExp(rel);
  return walk(root, prefix, how)
    .filter((p) => re.test(p) && keep(p))
    .sort();
}

/**
 * Every directory under a directory.
 *
 * The same walk and the same ignore rules as `documents`, answering the other
 * question a checker asks of a tree: `check:skill-overlap` needs the skill
 * folders (`recursive: false`), and `check:doc-identifiers` needs every folder
 * NAME under the design system, because a group folder — `forms-and-inputs` —
 * is a real identifier in this repo spelled exactly like a kebab-case enum
 * value it must not be confused with.
 *
 * @param {string} target repo-relative directory.
 * @param {object} [opts] as `documents`, minus `ext`, plus:
 * @param {boolean} [opts.recursive] descend (default true); false lists the
 *   immediate children only.
 * @returns {string[]} root-relative posix paths, sorted.
 */
export function directories(target, opts = {}) {
  const {
    root = REPO_ROOT,
    ignore = IGNORED_DIRS,
    skipDotDirs = true,
    skipEntry = null,
    strict = false,
    recursive = true,
  } = opts;

  const rel = toPosix(target === '' ? '.' : target).replace(/^\.\//, '');
  const base = rel === '.' ? '' : rel;
  const out = [];
  const descend = (at) => {
    const abs = at === '' ? root : path.join(root, at);
    let entries;
    try {
      entries = fs.readdirSync(abs, { withFileTypes: true });
    } catch (err) {
      if (strict) throw err;
      return;
    }
    for (const entry of entries) {
      if (!resolveIsDirectory(entry, path.join(abs, entry.name), strict)) continue;
      if (skipEntry && skipEntry(entry.name)) continue;
      if (ignore.has(entry.name)) continue;
      if (skipDotDirs && entry.name.startsWith('.')) continue;
      const child = at === '' ? entry.name : `${at}/${entry.name}`;
      out.push(child);
      if (recursive) descend(child);
    }
  };
  descend(base);
  return out.sort();
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

/**
 * Every file under `rel`, as root-relative posix paths.
 *
 * ── Strict ──
 * The default walk is forgiving: an unreadable directory yields nothing and the
 * sweep carries on. That is right for a generator, which fails on its own
 * output, and wrong for a guard, which reports a number: a check that cannot
 * read a directory it claims to have read, and then passes over a corpus one
 * directory short, is the silent-under-sweep defect #429 measured at 324 files
 * where the tree held 325. So `strict` splits the two failure modes that the
 * forgiving walk conflates:
 *
 *   - an unreadable DIRECTORY (EACCES, and any other readdir error) THROWS, so
 *     the caller stops rather than vouching for what it could not see;
 *   - an unresolvable ENTRY — a broken symlink, or a file a parallel test
 *     deleted between the listing and the stat — costs only itself.
 *
 * ── Symlinks ──
 * Both modes stat a symlink rather than trusting the dirent: `withFileTypes`
 * describes the LINK, so a linked directory would otherwise be pushed as a
 * document and a dangling link as a file with nothing behind it. A linked
 * directory is walked like any other — which is what lets a test build its
 * fixture root under `mkdtemp` and link the source trees it only reads, instead
 * of copying them or planting fixtures in the live tree. A dangling link costs
 * only itself in both modes; any other stat error (EACCES, ELOOP) is strict's
 * to throw and the forgiving walk's to skip, the same split as an unreadable
 * directory. Neither walk keeps a visited set, so a link to itself or to an
 * ancestor recurses until the stack gives out: no tree this repo reads holds
 * one, and a fixture root should link a real tree, not a cycle.
 */
function walk(root, rel, how, out = []) {
  const { ignore, skipDotDirs, skipEntry, strict } = how;
  const abs = rel === '' ? root : path.join(root, rel);
  let entries;
  try {
    entries = fs.readdirSync(abs, { withFileTypes: true });
  } catch (err) {
    if (strict) throw err;
    return out;
  }
  for (const entry of entries) {
    if (skipEntry && skipEntry(entry.name)) continue;
    const child = rel === '' ? entry.name : `${rel}/${entry.name}`;
    const isDirectory = resolveIsDirectory(entry, path.join(root, child), strict);
    if (isDirectory === null) continue;
    if (isDirectory) {
      if (ignore.has(entry.name)) continue;
      if (skipDotDirs && entry.name.startsWith('.')) continue;
      walk(root, child, how, out);
    } else {
      out.push(child);
    }
  }
  return out;
}

/**
 * Whether a dirent is a directory once a symlink is followed: true, false, or
 * null for a dangling link (skip it). Only a symlink is stat'd; a plain entry
 * answers from the dirent. See § Symlinks on `walk`.
 */
function resolveIsDirectory(entry, abs, strict) {
  if (!entry.isSymbolicLink()) return entry.isDirectory();
  try {
    return fs.statSync(abs).isDirectory();
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    if (strict) throw err;
    return null;
  }
}

/**
 * WHAT A FILE SAYS. A path in, its text out.
 *
 * Deliberately NOT path-or-text like `textOf` below, and deliberately not
 * forgiving: a caller here is holding a path it means to read, so an
 * unreadable one throws rather than coming back as its own name. It is any
 * file, not only a document — the token stylesheets are read through this —
 * because the reason to have one reader is the root, not the extension.
 *
 * @param {string} target repo-relative or absolute path.
 * @param {{root?: string}} [opts] the tree to read; defaults to this repo's root.
 * @returns {string}
 */
export function text(target, { root = REPO_ROOT } = {}) {
  if (typeof target !== 'string') {
    throw new TypeError('corpus: text() takes a path');
  }
  return fs.readFileSync(path.isAbsolute(target) ? target : path.join(root, target), 'utf8');
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
      if (fs.statSync(abs).isFile()) return text(abs);
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
 * A block SEQUENCE and a nested MAPPING are read only when a caller asks
 * (`structured: true`), because the two readings are not compatible: without
 * it `trigger_types:` is an empty scalar, which is what every guard that only
 * wants `summary:` and `embodiment:` has always seen. The Actions loader is
 * the caller that needs the other reading — `references_when:` is a mapping it
 * dispatches on, and `trigger_types:` a list whose items carry `# comments`.
 * Comment-stripping lives THERE and only there: `summary:` in
 * `docs/connectors/slack.md` names a channel `#plus-universal`, and a parser
 * that took `#` for a comment everywhere would silently truncate it.
 *
 * @param {string} input a file path or the document text.
 * @param {object} [opts]
 * @param {string} [opts.root] root for a relative path.
 * @param {boolean} [opts.allowLeadingComment] let the fence open below leading
 *   lines rather than at byte 0 — the `docs/knowledge/` house style puts the
 *   `<!-- Tier: 2 -->` marker above it.
 * @param {boolean} [opts.structured] read `key:` + indented lines as a list or
 *   a mapping instead of as an empty scalar.
 * @returns {{meta: Record<string, unknown>, body: string, raw: string|null}}
 *   `raw` is the block's own text, fences excluded — what a generator needs to
 *   re-emit frontmatter VERBATIM — and null when there is no terminated block.
 */
export function frontmatter(input, opts = {}) {
  const { allowLeadingComment = false, structured = false } = opts;
  const text = textOf(input, opts).replace(/^﻿/, '');
  let open = -1;
  if (/^---\r?\n/.test(text)) open = 0;
  else if (allowLeadingComment) {
    const m = /\n---\r?\n/.exec(text);
    if (m) open = m.index + 1;
  }
  if (open === -1) return { meta: {}, body: text, raw: null };
  const start = text.indexOf('\n', open) + 1;
  const close = text.indexOf('\n---', start);
  if (close === -1) return { meta: {}, body: text, raw: null };
  const raw = text.slice(start, close).replace(/\r$/, '');
  return {
    meta: parseFields(raw.split(/\r?\n/), { structured }),
    body: text.slice(close + 4).replace(/^(\r?\n)+/, ''),
    raw,
  };
}

const KEY_LINE = /^([A-Za-z_][A-Za-z0-9_-]*):\s*(.*)$/;

/**
 * Minimal YAML read for the shapes this repo uses. Not a general parser — a
 * real one would be a dependency for four fields, and an unsupported shape
 * throws rather than silently returning undefined.
 */
function parseFields(lines, { structured = false } = {}) {
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
    } else if (structured && raw === '') {
      const items = [];
      const nested = {};
      while (i + 1 < lines.length && (lines[i + 1].startsWith('  ') || lines[i + 1].trim() === '')) {
        const sub = lines[++i];
        // A comment-only line is a continuation of the line above's comment —
        // `trigger_types` in the Actions prompts wraps one over two lines.
        if (!sub.trim() || sub.trim().startsWith('#')) continue;
        const seq = /^\s+-\s+(.+?)\s*(?:#.*)?$/.exec(sub);
        if (seq) {
          items.push(unquote(key, seq[1]));
          continue;
        }
        const kv = /^\s+([A-Za-z_][\w-]*)\s*:\s*(.+?)\s*(?:#.*)?$/.exec(sub);
        if (kv) nested[kv[1]] = unquote(kv[1], kv[2]);
      }
      out[key] = items.length > 0 ? items : nested;
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
 * pointer, and `scripts/check-doc-links.mjs` owns that pass.
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
 * The same links, REMOVED rather than collected: `[text](target)` → `text`.
 *
 * The other thing a reader does with a link — `check:cross-repo` shingles
 * prose, and a link is one word wearing a URL, so the target is dropped and
 * the label kept. Deliberately not `links()` inside-out: no code span is
 * blanked first, because a recorded word count is a number that must not move
 * when this helper replaces the regex it was recorded with.
 *
 * @param {string} text the document text (never a path — this is a transform).
 * @returns {string}
 */
export function stripLinks(text) {
  return text.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
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
