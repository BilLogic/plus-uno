// Which logo a task card carries — the Slack side of an estate.
//
// The tool table names the estate a lookup reads and stops there, because five
// readers that are not Slack read it too. Turning that name into a picture is
// this file's job: an estate maps to an image URL, and the card's `icon` is
// that URL (`{type: "icon", name: <url>}`, built by the client in `api.ts`).
//
// The images live on the production site under one path the repo owns —
// `public/uno-bot/estate-logos/` is copied to the site root by the Vite build —
// so a card's logo never depends on a third-party CDN. Each is a Font Awesome
// Free brand glyph (`fa-brands`, CC BY 4.0) drawn white on a tile of the
// brand's colour, so it reads on both Slack themes; the SVG beside each PNG is
// its source. An estate with no Font Awesome Free glyph on hand has no entry,
// and its cards go without a logo rather than with a broken one.

import type { Estate } from "../agent/tool-table";

/** Where the logos are served from. */
export const ESTATE_LOGO_BASE = "https://plus-uno.netlify.app/uno-bot/estate-logos";

const LOGOS: Partial<Record<Estate, string>> = {
  github: `${ESTATE_LOGO_BASE}/github.png`,
  slack: `${ESTATE_LOGO_BASE}/slack.png`,
  figma: `${ESTATE_LOGO_BASE}/figma.png`,
};

/** A read link's estate, from its host — for the one tool whose estate is
 *  whatever the link it was handed points at. */
function estateOfUrl(raw: unknown): Estate | null {
  if (typeof raw !== "string") return null;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^www\./, "");
  if (host === "github.com" || host.endsWith(".github.com") || host === "raw.githubusercontent.com") return "github";
  if (host === "figma.com" || host.endsWith(".figma.com")) return "figma";
  if (host.endsWith(".slack.com") || host === "slack.com") return "slack";
  if (host === "notion.so" || host.endsWith(".notion.so") || host.endsWith(".notion.site")) return "notion";
  return null;
}

/**
 * The logo URL a tool's card carries, or undefined for none.
 *
 * @param estate - The estate the tool table names for the tool, or null
 * @param args - The call's arguments; a tool naming no estate that was handed a
 *   `url` takes the estate of that link
 */
export function estateLogo(estate: Estate | null, args: Record<string, unknown>): string | undefined {
  const which = estate ?? estateOfUrl(args.url);
  return which ? LOGOS[which] : undefined;
}
