// Answer cards, as Slack's `card` and `carousel` blocks.
//
// The turn hands over the cards as DATA (`turn/answer-cards.ts`) and this is
// where they become Slack's: one card stands alone, two to ten ride in a
// carousel. Each card carries its title, its subtitle, up to 3 link buttons
// and the logo of the estate its own link leads to. No hero image: Figma frame
// renders would need re-hosting first.
//
// THE LOGOS are PNG images Slack fetches by URL — a card's `icon` takes an
// image element, and Slack does not render an SVG one. Ours are served from
// the plus-uno site (`public/uno-bot/logos/`): PLUS from the brand guide's
// brandmark, uno-blueprint from its site icon, GitHub and Slack drawn from the
// Bootstrap Icons glyphs the repo already carries. Storybook is our own design
// system's, so it carries the PLUS mark. Figma and Notion have no glyph in the
// repo that we may redistribute, so they take the favicon Google serves for
// their domain, which Slack renders. A link on no estate's host carries the
// PLUS mark.
//
// The buttons are `url` buttons with no action_id: navigation the browser
// handles, so Slack has no interaction to deliver.
//
// Pure: no Env, no client. The rules the blocks are held to in the suite are
// in `tests/helpers/slack-block-rules.ts`.

import type { Estate } from "../agent/tool-table";
import type { AnswerCard, AnswerCards } from "../turn/answer-cards";
import { estateOfUrl } from "./estate-hosts";

/** A card's logo: what it is called, and where Slack fetches it. */
export interface Logo {
  name: string;
  url: string;
}

/** Where our own logos are served: the plus-uno site's `public/` dir. */
export const LOGO_HOST = "https://plus-uno.netlify.app/uno-bot/logos/";

const ours = (name: string, file: string): Logo => ({ name, url: `${LOGO_HOST}${file}` });
const favicon = (name: string, domain: string): Logo => ({
  name,
  url: `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
});

/** Each estate's logo, and PLUS's beside them. */
export const LOGOS: Readonly<Record<Estate | "plus", Logo>> = {
  plus: ours("PLUS", "plus.png"),
  blueprint: ours("uno-blueprint", "uno-blueprint.png"),
  github: ours("GitHub", "github.png"),
  slack: ours("Slack", "slack.png"),
  figma: favicon("Figma", "figma.com"),
  notion: favicon("Notion", "notion.so"),
  storybook: ours("Storybook", "plus.png"),
};

/**
 * The logo a link's card carries: its estate's, or the PLUS mark for a link on
 * no estate's host.
 *
 * @param url - The card's own link
 */
export function logoFor(url: string): Logo {
  const estate = estateOfUrl(url);
  return estate ? LOGOS[estate] : LOGOS.plus;
}

const plain = (text: string) => ({ type: "plain_text", text });

/** One `card` block. */
export function cardBlock(card: AnswerCard): Record<string, unknown> {
  const logo = logoFor(card.links[0]!.url);
  return {
    type: "card",
    icon: { type: "image", image_url: logo.url, alt_text: logo.name },
    title: plain(card.title),
    ...(card.subtitle ? { subtitle: plain(card.subtitle) } : {}),
    actions: card.links.map((link) => ({ type: "button", text: plain(link.label), url: link.url })),
  };
}

/**
 * The block for an answer's cards: one `card`, or a `carousel` of them.
 *
 * @param cards - The cards, 1 to 10
 */
export function answerCardsBlock(cards: AnswerCards): Record<string, unknown> {
  return carouselOf(cards.cards.map(cardBlock));
}

/**
 * One `card` alone, or two to ten in a `carousel`.
 *
 * @param cards - The `card` blocks, 1 to 10
 */
export function carouselOf(cards: Record<string, unknown>[]): Record<string, unknown> {
  return cards.length === 1 ? cards[0]! : { type: "carousel", elements: cards };
}
