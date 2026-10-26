// A design-system component's Storybook docs page, for a path in the harness
// repo (#1563).
//
// uno-bot cannot read Storybook, so it never has a Storybook link of its own:
// one it wrote was made up, and a made-up id is a dead page. `github_read`
// hands this one back beside a component's files, so the link the answer
// cites is one a lookup returned. The map is the registry's, baked at deploy
// (`scripts/generate-storybook-docs.mjs`).
//
// PURE.

import { STORYBOOK_DOCS } from "../generated/storybook-docs";

/** Where the live Storybook's docs pages open. */
const STORYBOOK_BASE = "https://plus-uno.netlify.app/storybook/";

/** A component's docs page, named as a Sources box names it. */
export interface StorybookDoc {
  title: string;
  url: string;
}

/**
 * The docs page of the component a repo path belongs to: any path in a
 * component's own folder, or a flat component's files named for it. Null for
 * any other path.
 *
 * @param path - A repo path, as `github_read` read it
 * @param docs - The baked map; the default is the deployed one
 */
export function storybookDocFor(path: string, docs: ReadonlyArray<readonly [string, string, string]> = STORYBOOK_DOCS): StorybookDoc | null {
  const clean = path.trim().replace(/^\/+/, "");
  if (!clean) return null;
  // A folder read names the folder without its slash.
  const asDir = clean.endsWith("/") ? clean : `${clean}/`;
  let best: readonly [string, string, string] | null = null;
  for (const entry of docs) {
    const [prefix] = entry;
    if ((clean.startsWith(prefix) || asDir === prefix) && (!best || prefix.length > best[0].length)) best = entry;
  }
  if (!best) return null;
  const [, name, id] = best;
  return { title: `Storybook: ${name}`, url: `${STORYBOOK_BASE}?path=/docs/${id}` };
}
