// Which estate a link lives on, from its host (and, on our own site, its
// path) — the rule that decides whether
// a source may ride on a card at all (`card-sources.ts`). Two hand-written
// copies had once drifted on which GitHub content host counted; one table
// keeps that from happening again.
//
// A PURE module: no Env.

import type { Estate } from "../agent/tool-table";

/** Each estate's hosts, each matched as the host itself or any subdomain of it
 *  (so `www.figma.com` and `raw.githubusercontent.com` need no row of their own). */
const ESTATE_HOSTS: ReadonlyArray<readonly [Estate, readonly string[]]> = [
  ["github", ["github.com", "githubusercontent.com"]],
  ["figma", ["figma.com"]],
  ["slack", ["slack.com"]],
  ["notion", ["notion.so", "notion.site"]],
];

/** The estates our own Netlify site serves, each under a path prefix of the
 *  one host — so a link to it says which estate it is by its path, not its
 *  host. Other paths there are prototypes and previews: no estate. */
const OWN_SITE = "plus-uno.netlify.app";
const OWN_SITE_PATHS: ReadonlyArray<readonly [Estate, string]> = [
  ["storybook", "/storybook"],
  ["blueprint", "/blueprint"],
];

const isHost = (host: string, domain: string): boolean => host === domain || host.endsWith(`.${domain}`);
const underPath = (path: string, prefix: string): boolean => path === prefix || path.startsWith(`${prefix}/`);

/**
 * The estate a host belongs to, or null for one that is none of them.
 *
 * @param host - A URL's hostname
 */
export function estateOfHost(host: string): Estate | null {
  const h = host.toLowerCase();
  return ESTATE_HOSTS.find(([, domains]) => domains.some((d) => isHost(h, d)))?.[0] ?? null;
}

/**
 * The estate an http(s) link lives on, or null — not a string, not a URL, not
 * http(s), or a host that is no estate.
 *
 * @param raw - The link, as a tool's arguments or result carried it
 */
export function estateOfUrl(raw: unknown): Estate | null {
  if (typeof raw !== "string") return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.hostname.toLowerCase() === OWN_SITE) {
    return OWN_SITE_PATHS.find(([, prefix]) => underPath(url.pathname, prefix))?.[0] ?? null;
  }
  return estateOfHost(url.hostname);
}
