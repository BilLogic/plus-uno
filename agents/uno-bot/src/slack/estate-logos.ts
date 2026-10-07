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
import { readLinkOf } from "../agent/task-card-readout";
import { estateOfUrl } from "./estate-hosts";

/** Where the logos are served from. */
export const ESTATE_LOGO_BASE = "https://plus-uno.netlify.app/uno-bot/estate-logos";

const LOGOS: Partial<Record<Estate, string>> = {
  github: `${ESTATE_LOGO_BASE}/github.png`,
  slack: `${ESTATE_LOGO_BASE}/slack.png`,
  figma: `${ESTATE_LOGO_BASE}/figma.png`,
};

/**
 * The logo URL a tool's card carries, or undefined for none.
 *
 * @param estate - The estate the tool table names for the tool, or null
 * @param args - The call's arguments; a tool naming no estate takes the estate
 *   of the link it reads (`readLinkOf`), the same link its card's details name
 */
export function estateLogo(estate: Estate | null, args: Record<string, unknown>): string | undefined {
  const which = estate ?? estateOfUrl(readLinkOf(args));
  return which ? LOGOS[which] : undefined;
}
