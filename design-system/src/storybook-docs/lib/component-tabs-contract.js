/**
 * The component tabs' contract — everything the tabs know that does not need a
 * browser to be true (#168, moved in-page by ADR-025).
 *
 * Four tabs over one component docs page: Examples · Code · Usage · Agent view.
 * All four are rendered by `../docs-tabs.jsx` INSIDE
 * the docs page, below the title. They used to be Storybook `types.TAB` addons
 * in the manager's preview toolbar; that toolbar lives in a different document
 * from `<Title />`, so it could never sit below the title, which is the whole
 * reason for the move. See docs/adr/025.
 *
 * Agent view shows the agent-facing file per component — the one flat file
 * `npm run generate:component-docs` writes — byte for byte (ADR-040). The tabs
 * read that file; nothing here writes to it or splits it.
 *
 * This module is pure on purpose: `design-system/tests/component-tabs-contract.test.js`
 * is the only place the tabs can be checked without a running Storybook. It
 * lives under `design-system/src/` rather than beside the old addon because the
 * preview resolves `@` to that root and cannot import from `.storybook/`.
 */

const COMPONENTS_ROOT = 'design-system/src/components';

/** Vite reports import paths as `./a/b.jsx`; the repo talks in `a/b.jsx`. */
const repoPath = (p) => String(p).replace(/\\/g, '/').replace(/^\.\//, '');

/** Ids are also URL query values (`?tab=plus-code`), so keep them slug-safe. */
export const TAB_IDS = {
  code: 'plus-code',
  usage: 'plus-usage',
  agent: 'plus-agent-view',
};

/**
 * Titles and order, declared once. Storybook no longer reads this — `previewTabs`
 * and the `types.TAB` registrations were deleted with the move — so this is
 * now the only declaration of the tab shape, consumed by `../docs-tabs.jsx`.
 *
 * `title` is the DEFAULT label. A page may rename its first tab when its first
 * face is not examples, as a token page's would read "All tokens" where Button
 * reads "Examples". Only the first tab is renameable: Code, Usage and Agent view
 * mean the same thing everywhere.
 *
 * `id` is `null` for Examples because Examples is the default tab and carries no
 * query param — matching the URLs the addon tabs produced, where
 * `?tab=plus-usage` selected Usage and no `tab` at all meant Examples.
 */
export const TABS = [
  { key: 'examples', id: null, title: 'Examples' },
  { key: 'code', id: TAB_IDS.code, title: 'Code' },
  { key: 'usage', id: TAB_IDS.usage, title: 'Usage' },
  { key: 'agent', id: TAB_IDS.agent, title: 'Agent view' },
];

/**
 * The docs pages that get a tab strip: every component, every pattern that
 * has a folder of its own, and any page named here BY NAME. Foundations pages
 * sit on the Foundation template, one reading page with no faces to switch
 * between, so the list is empty; adding a page has to be a deliberate edit,
 * not a heuristic that quietly widens.
 *
 * A pattern page is held by its PLACE, `patterns/<Name>/<Name>.mdx`, the same
 * way a component page is: those pages carry the component page's Usage spine
 * and props, and the generator writes their agent file beside them. The flat
 * pages directly under `patterns/` (Introduction, Heading outline) are reading
 * pages with no usage spine, so they stay untabbed.
 *
 * A rule is what the alternative would have to be, and there is none available:
 * all MDX pages in `design-system/src/` share the same `sb-ds-component-docs`
 * and `sb-ds-doc-section` wrappers and the same heading names, so markup cannot
 * tell a component page from a foundation page.
 */
export const TABBED_EXCEPTIONS = [];

const PATTERNS_ROOT = 'design-system/src/patterns';

/**
 * Whether a repo-relative MDX path is a docs page that gets a tab strip.
 * @param {string} file A repo-relative path, e.g. `design-system/src/components/forms-and-inputs/Button/Button.mdx`.
 * @returns {boolean}
 */
export function isTabbedDocsPage(file) {
  const path = repoPath(file);
  if (TABBED_EXCEPTIONS.includes(path)) return true;
  if (!path.endsWith('.mdx')) return false;
  if (path.startsWith(`${COMPONENTS_ROOT}/`)) return true;
  return path.startsWith(`${PATTERNS_ROOT}/`) && path.slice(PATTERNS_ROOT.length + 1).split('/').length === 2;
}

/** `Button.stories.jsx`, `Button.mdx` and `Button.jsx` all name the component `Button`. */
const componentNameOf = (file) => file.replace(/\.(stories|test)\.[jt]sx?$/, '').replace(/\.(mdx|[jt]sx?)$/, '');

/**
 * Where a Storybook entry sits in the repo, or `null` when it is not a
 * component. Derived from the entry's own `importPath` rather than its sidebar
 * title, because the path is what the generated docs are keyed by — the two
 * agree today, and if they ever stop, the path is the one that can be opened.
 *
 * Both component shapes the doc generator recognizes are handled: a nested
 * `<group>/<Name>/<Name>.jsx` documented in `<Name>/index.md`, and a flat
 * `<group>/<Name>.jsx` documented in `<group>/<Name>.md`.
 *
 * @param {{title?: string, importPath?: string}} [entry] A Storybook story or docs entry.
 * @returns {{name: string, group: string, dir: string, source: string,
 *   generatedDoc: string, groupIndex: string, entryFile: string} | null}
 */
export function componentIdentity(entry) {
  if (!entry || typeof entry.importPath !== 'string') return null;

  const entryFile = repoPath(entry.importPath);
  if (!entryFile.startsWith(`${COMPONENTS_ROOT}/`)) return null;

  const segments = entryFile.slice(COMPONENTS_ROOT.length + 1).split('/');
  const group = segments[0];
  const groupIndex = `${COMPONENTS_ROOT}/${group}/index.md`;

  // Nested: <group>/<Name>/<file>. The folder is the component, so a demo file
  // several levels down still resolves to the component that owns it.
  if (segments.length >= 3 && /^[A-Z]/.test(segments[1])) {
    const name = segments[1];
    const dir = `${COMPONENTS_ROOT}/${group}/${name}`;
    return {
      name,
      group,
      dir,
      source: `${dir}/${name}.jsx`,
      generatedDoc: `${dir}/index.md`,
      groupIndex,
      entryFile,
    };
  }

  // Flat: <group>/<Name>.jsx, documented beside itself.
  if (segments.length === 2 && /^[A-Z]/.test(segments[1])) {
    const name = componentNameOf(segments[1]);
    const dir = `${COMPONENTS_ROOT}/${group}`;
    return {
      name,
      group,
      dir,
      source: `${dir}/${name}.jsx`,
      generatedDoc: `${dir}/${name}.md`,
      groupIndex,
      entryFile,
    };
  }

  return null;
}


/**
 * The barrel a docs page's component is imported from: `@/components` for a
 * component page, `@/patterns` for a pattern page. Public code never imports
 * from a deep path.
 *
 * A pattern page names its barrel only when the pattern is its own export,
 * which is exactly when the generator wrote an agent file beside it. A
 * docs-only pattern page (Popups) documents no export of its own, so it shows
 * no import line rather than an import that does not resolve.
 *
 * @param {{importPath?: string}} [entry] The page's meta entry.
 * @param {boolean} [hasGeneratedDoc] Whether the page has an Agent view.
 * @returns {'@/patterns' | '@/components' | null}
 */
export function importSourceFor(entry, hasGeneratedDoc = true) {
  const file = entry && typeof entry.importPath === 'string' ? repoPath(entry.importPath) : '';
  if (!file.startsWith(`${PATTERNS_ROOT}/`)) return '@/components';
  return hasGeneratedDoc ? '@/patterns' : null;
}

/**
 * The import line the Code tab shows, from the barrel that exports it.
 *
 * @param {string | undefined} name The component's export name.
 * @param {string | null} [from] The barrel, as `importSourceFor` names it.
 * @returns {string | null} The line, or null when there is no name or no barrel.
 */
export function importLineFor(name, from = '@/components') {
  if (!name || typeof name !== 'string' || !from) return null;
  return `import { ${name} } from '${from}';`;
}

/**
 * The generated file an Agent view shows, as a repo path, or `null` when the
 * entry has none.
 *
 * Found through the docs page's Storybook meta: `importPath` is the stories
 * file the page's `<Meta of>` names (Storybook records it as the meta's
 * `parameters.fileName`). A component resolves through `componentIdentity`;
 * a pattern, PageLayout or the Logo has its file as `index.md` beside its
 * source, which the generator writes there.
 *
 * @param {{importPath?: string}} [entry]
 * @returns {string | null}
 */
export function generatedDocPathFor(entry) {
  const component = componentIdentity(entry);
  if (component) return component.generatedDoc;
  if (!entry || typeof entry.importPath !== 'string') return null;
  const file = repoPath(entry.importPath);
  if (!file.startsWith('design-system/src/') || file.startsWith(`${COMPONENTS_ROOT}/`)) return null;
  return `${file.slice(0, file.lastIndexOf('/'))}/index.md`;
}

/**
 * The tabs module imports every generated file through ONE raw
 * `import.meta.glob`, so no MDX page carries agent text. Vite keys that map by
 * the path relative to `docs-tabs.jsx`; this turns a key back into the repo
 * path `generatedDocPathFor` returns.
 *
 * @param {string} key A glob key, e.g. `../components/messaging/Modal/index.md`.
 * @returns {string}
 */
export function repoPathOfGlobKey(key) {
  return repoPath(key).replace(/^\.\.\//, 'design-system/src/');
}

/**
 * The entry from a raw glob for one docs page: the generated file's repo path,
 * the name it documents (its folder, or its file stem when filed flat) and its
 * glob value (the text when eager, a loader when lazy), or `null`.
 *
 * @template T
 * @param {Record<string, T>} modules The glob result.
 * @param {{importPath?: string}} [entry] The page's meta entry.
 * @returns {{path: string, name: string, value: T} | null}
 */
export function agentViewEntry(modules, entry) {
  const path = generatedDocPathFor(entry);
  if (!path) return null;
  for (const [key, value] of Object.entries(modules || {})) {
    if (repoPathOfGlobKey(key) !== path) continue;
    const parts = path.split('/');
    const file = parts[parts.length - 1];
    const name = file === 'index.md' ? parts[parts.length - 2] : file.replace(/\.md$/, '');
    return { path, name, value };
  }
  return null;
}

/**
 * The "Report a problem" link: a new GitHub issue on the repo, prefilled with
 * the component and the file it is about. Only those two strings go in the
 * URL — nothing about the reader.
 *
 * @param {string} name The component or pattern name.
 * @param {string} path The generated file's repo path.
 * @returns {string}
 */
export function reportProblemUrl(name, path) {
  const title = `Agent view: ${name} — `;
  const body = [
    `Component: ${name}`,
    `Generated file: \`${path}\``,
    '',
    'What is wrong or missing in what agents are told:',
    '',
  ].join('\n');
  const query = new URLSearchParams({ title, body });
  return `https://github.com/BilLogic/plus-uno/issues/new?${query.toString()}`;
}

/** A rule heading's trailing id, `{#rule-id}`, as the generated file writes it. */
const RULE_ID = /^(#{1,6} .*?)[ \t]*\{#([a-z0-9-]+)\}[ \t]*$/gm;

/**
 * The class of the id label `agentViewMarkdown` draws and `agentViewSlug` reads
 * back. `.storybook/storybook-overrides.css` styles it under the same name.
 */
export const RULE_ID_CLASS = 'sb-ds-agent-view__rule-id';
const RULE_ID_LABEL = new RegExp(`class="${RULE_ID_CLASS}">#([a-z0-9-]+)<`);

/**
 * The generated file prepared for the rendered Agent view: each rule heading's
 * `{#rule-id}` becomes a quiet id label under the heading text, so the reader
 * sees the rule id agents cite without the literal braces. The raw view and
 * Copy keep the file's own bytes; only this rendering changes.
 *
 * @param {string} text The generated file.
 * @returns {string}
 */
export function agentViewMarkdown(text) {
  return String(text).replace(RULE_ID, `$1 <span class="${RULE_ID_CLASS}">#$2</span>`);
}

/**
 * The heading anchor for the rendered Agent view: a rule heading's anchor is
 * its rule id, the one agents cite; any other heading keeps the renderer's own.
 *
 * @param {string} heading The heading's source text.
 * @param {(input: string) => string} fallback The renderer's own slug.
 * @returns {string}
 */
export function agentViewSlug(heading, fallback) {
  const id = String(heading).match(RULE_ID_LABEL);
  return id ? id[1] : fallback(heading);
}
