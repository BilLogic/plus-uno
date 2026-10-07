// Which estate a link lives on, from its host — the rule that decides whether
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

const isHost = (host: string, domain: string): boolean => host === domain || host.endsWith(`.${domain}`);

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
  return estateOfHost(url.hostname);
}
