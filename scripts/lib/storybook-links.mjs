/**
 * The Storybook ids a file links to. Pure: `check-storybook-links.mjs` does
 * the reading and compares each id with a built `index.json`.
 *
 * A link takes five shapes in this repo: `?path=/docs/<id>` and
 * `?path=/story/<id>`, a `<DocsLink id story>` in an MDX page, a registry
 * `"storybookId"`, and an `iframe.html?id=<id>` embed. An id assembled at run
 * time (`foundations-${id}--docs`) cannot be read from source and is skipped.
 */

const ID = '[a-z0-9][a-z0-9-]*(?:--[a-z0-9-]+)?';
// An id the source cuts short with `${` is a template, not a link.
const END = '(?![\\w$-]|\\$\\{)';

const PATH_LINK = new RegExp(`path=/(?:docs|story)/(${ID})${END}`, 'g');
const STORYBOOK_ID = new RegExp(`"storybookId"\\s*:\\s*"(${ID})"`, 'g');
const IFRAME_ID = new RegExp(`iframe\\.html\\?(?:[^"'\`\\s)]*&)?id=(${ID})${END}`, 'g');
const DOCS_LINK = /<DocsLink\s+id="([a-z0-9-]+)"(?:\s+story="([a-z0-9-]+)")?/g;

/** Paths whose Storybook ids are a record or a test fixture, not a link a reader follows. */
const NOT_LINKS = [/^docs\/plans\//, /^docs\/adr\//, /^agents\/uno-bot\/tests\//, /(^|\/)package-lock\.json$/, /(^|\/)node_modules\//];

export const isLinkable = (file) => !NOT_LINKS.some((pattern) => pattern.test(file));

/** @returns {{ id: string, line: number }[]} */
export function storybookLinks(text) {
  const found = [];
  const lineAt = (offset) => text.slice(0, offset).split('\n').length;
  for (const pattern of [PATH_LINK, STORYBOOK_ID, IFRAME_ID]) {
    for (const match of text.matchAll(pattern)) found.push({ id: match[1], line: lineAt(match.index) });
  }
  for (const match of text.matchAll(DOCS_LINK)) {
    found.push({ id: `${match[1]}--${match[2] ?? 'docs'}`, line: lineAt(match.index) });
  }
  // An id cut short at a hyphen (`components-…`) is a prefix named in prose.
  return found.filter((link) => !link.id.endsWith('-')).sort((a, b) => a.line - b.line);
}
