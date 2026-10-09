// A sweep card, as Slack's blocks: its head line, one `card` per fix in a
// carousel, the page and thread words folded into a closed box, then how to
// confirm and the Review button.
//
// The sweep hands the fixes over as DATA (`ProposalCard.fixes`, built in
// `sweep/cards.ts` and `dm-watch/capture.ts`); the text copy stays the whole
// card, so the sweep's mark leads it and an untagged post is still read as a
// sweep card (`isSweepCardPost`). Each card is numbered as `drop N` names it —
// the number leads its title — and carries the page's link, its owner, what
// changes and an Open button. A body holds 200 characters, so a long change
// is clipped there and shown whole in the box: a person still confirms
// exactly what will be written.
//
// THE PLAIN RUNG. A card Slack's shapes cannot hold — a fix whose words pass
// a section's 3,000 characters, or more fixes than a box's 10 children —
// gets no blocks of its own, and posts as its text, as every card did before.
//
// Pure: no Env, no client. The rules the blocks are held to in the suite are
// in `tests/helpers/slack-block-rules.ts`.

import type { CardFix, CardFixes } from "../turn/index";
import { carouselOf, logoFor } from "./answer-cards-block";
import { textSections } from "./render";
import { foldedBox } from "./sources-box";
import { CARD_BODY_CHARS, CARD_TITLE_CHARS, MAX_REPORT_ITEMS, clip, plain } from "./decision-cards";

/** The closed box's title. */
export const FIX_DETAIL_TITLE = "Page says / thread says";

/** One fix's card. */
function fixCard(fix: CardFix, n: number): Record<string, unknown> {
  const logo = logoFor(fix.page.url);
  const title = `${n}. ${fix.page.title.replace(/\s+/g, " ").trim() || "untitled"}`;
  const by = [fix.owner ? `<@${fix.owner}>` : "", fix.note ?? ""].filter(Boolean).join(" · ");
  return {
    type: "card",
    icon: { type: "image", image_url: logo.url, alt_text: logo.name },
    title: plain(clip(title, CARD_TITLE_CHARS)),
    ...(by ? { subtitle: { type: "mrkdwn", text: by } } : {}),
    body: plain(clip(fix.change, CARD_BODY_CHARS)),
    actions: [
      { type: "button", text: plain("Open"), url: fix.page.url },
      ...(fix.where ? [{ type: "button", text: plain(fix.where.label), url: fix.where.url }] : []),
    ],
  };
}

/**
 * The card's blocks above its button row, or null for the plain rung.
 *
 * @param fixes - The card's fixes, its head and its tail
 * @param footer - The line every card ends on, above its button
 */
export function sweepCardBlocks(fixes: CardFixes, footer: string): unknown[] | null {
  const { items } = fixes;
  if (items.length === 0 || items.length > MAX_REPORT_ITEMS) return null;
  const details = items.map((fix) => textSections(fix.detail));
  // One section per fix, or the box would need more children than it holds.
  if (details.some((d) => d.length !== 1)) return null;
  return [
    ...textSections(fixes.head),
    carouselOf(items.map((fix, i) => fixCard(fix, i + 1))),
    foldedBox(FIX_DETAIL_TITLE, details.map((d) => d[0]!)),
    ...textSections(`${fixes.tail}\n${footer}`),
  ];
}
