// Which glyph a task card carries — the Slack side of an estate.
//
// The tool table names the estate a lookup reads and stops there, because five
// readers that are not Slack read it too. Turning that name into a picture is
// this file's job: an estate maps to one of Slack's built-in icon names, and
// the card's `icon` is Slack's icon object for it. This is the one place that
// object is built; the stream chunk (`api.ts`) and the static plan's
// `task_card` (`plan-block.ts`) both carry it as it leaves here, through
// `cardLinks`.
//
// NAMED ICONS ONLY. Slack takes `{type: "icon", name}` with a built-in name and
// refuses everything else — an image URL, a `url`, an `image` element, an
// emoji, a name it does not know (docs/connectors/slack.md § Task cards). Every
// name below was accepted by production Slack on 2026-10-07.
//
// A PURE module: no Env.

import type { Estate, TaskCardWords } from "../agent/tool-table";
import { readLinkOf } from "../agent/task-card-readout";
import { estateOfUrl } from "./estate-hosts";

/** The built-in names a card's icon is drawn from. */
export type SlackGlyph = "book" | "map" | "code" | "comment" | "cube" | "image" | "globe";

/** A card's icon, as Slack takes it on a `task_update` chunk and a `task_card`. */
export interface SlackIcon {
  readonly type: "icon";
  readonly name: SlackGlyph;
}

const GLYPHS: Readonly<Record<Estate, SlackGlyph>> = {
  notion: "book",
  blueprint: "map",
  github: "code",
  slack: "comment",
  storybook: "cube",
  figma: "image",
};

/** The glyph for a read link whose host is none of the estates. */
const ANY_LINK: SlackGlyph = "globe";

/**
 * The icon a tool's card carries, or undefined for none.
 *
 * @param estate - The estate the tool table names for the tool
 * @param args - The call's arguments; a tool whose estate is `"link"` takes
 *   the estate of the link it reads (`readLinkOf`), the same link its card's
 *   details name, and a link on no estate's host takes the globe
 */
export function estateIcon(estate: TaskCardWords["estate"], args: Record<string, unknown>): SlackIcon | undefined {
  if (estate === null) return undefined;
  const which = estate === "link" ? estateOfUrl(readLinkOf(args)) : estate;
  return { type: "icon", name: which ? GLYPHS[which] : ANY_LINK };
}
