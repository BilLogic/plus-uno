// A shipped card's evidence: the card's own words, then its PRD's (spec:
// inputs are Roadmap cards and their PRDs).
//
// WHERE A CARD'S PRD IS. A Roadmap card holds its PRD as an inline subpage
// titled `PRD…` (the project hub's Pages section), or links one from its body
// on a line that says PRD. The subpage wins; a link is followed only when
// there is none. Only a Notion page is read — a Figma or Google link on a PRD
// line is not a PRD.
//
// BUDGET (ADR-022). One PRD a card, `MAX_PRDS`: a page read is up to four
// subrequests, and the job weighs cards inside one alarm's ceiling. A PRD that
// cannot be read leaves the card's own words; a spent budget still stops the
// job.
//
// PURE: the page read is a port.

import { rethrowIfBudget } from "../net";
import { parseNotionPageId } from "../integrations/notion";

/** PRD pages read for one card. */
export const MAX_PRDS = 1;
/** The card's own share of the evidence when a PRD follows it: the gate and
 *  the draft each read the first 6,000 characters. */
const CARD_SHARE = 2_500;

/** A Notion page as the evidence reads it: `readNotionPage`'s shape. */
export interface EvidencePage {
  title: string;
  text: string;
  subpages: Array<{ id: string; title: string }>;
  blocks: Array<{ text: string; links: string[] }>;
}

const PRD_TITLE = /^prd\b/i;
const PRD_LINE = /\bprd\b/i;

/**
 * The PRD pages a card points at, as Notion page ids: its `PRD…` subpages,
 * else the Notion pages linked from a line that says PRD.
 *
 * @param page - The card's page
 * @param selfId - The card's own id, never its own PRD
 */
export function prdIdsOf(page: EvidencePage, selfId: string): string[] {
  const self = selfId.replace(/-/g, "").toLowerCase();
  const subpages = page.subpages.filter((s) => PRD_TITLE.test(s.title.trim())).map((s) => s.id.replace(/-/g, "").toLowerCase());
  const linked = page.blocks
    .filter((b) => PRD_LINE.test(b.text))
    .flatMap((b) => b.links)
    .filter((url) => /notion\.(so|site|com)/i.test(url))
    .map((url) => parseNotionPageId(url))
    .filter((id): id is string => !!id);
  const ids = subpages.length ? subpages : linked;
  return [...new Set(ids)].filter((id) => id !== self).slice(0, MAX_PRDS);
}

/**
 * A card's evidence: its page text, then each PRD's under its title.
 *
 * @param read - Reads one Notion page by id
 * @param pageId - The card's page id
 */
export async function cardEvidence(read: (pageId: string) => Promise<EvidencePage>, pageId: string): Promise<string> {
  const card = await read(pageId);
  const prds: string[] = [];
  for (const id of prdIdsOf(card, pageId)) {
    try {
      const prd = await read(id);
      if (prd.text.trim()) prds.push(`PRD — ${prd.title}:\n${prd.text}`);
    } catch (err) {
      rethrowIfBudget(err);
      console.error(`[blueprint-upkeep] a PRD of ${pageId} not read: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  if (!prds.length) return card.text;
  return [card.text.slice(0, CARD_SHARE), ...prds].join("\n\n");
}
