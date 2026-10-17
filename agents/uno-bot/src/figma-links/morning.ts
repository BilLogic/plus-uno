// `figma-dev-links-post` — the morning's Dev Mode links card, handed to the
// sweep's one message in #plus-design as a section of it (`../sweep/sections.ts`).
//
// THE SOURCE is the PRs merged into main that changed a design-system
// component (`./feed.ts`): their components may need their Code and
// Storybook links in Dev Mode. The feed reads those merged since the last
// one carded (`SEEN_KV_KEY`); the first morning only sets that mark, so
// nothing from before it is offered.
//
// THE HAND-OVER, before the sweep's post, while `FIGMA_DEV_LINKS` is on: the
// components those PRs named, planned as one card (`planDevLinksCard` — a
// component's own, or a batch), with #plus-design's members to decide it. It
// posts nothing: the channel gets one message a morning.
//
// THE SECTION, on that message: a line, then the card, sharing the carousel's
// ten. Once the message is up the card stages as its own proposal, Approve
// writes its links (`./run.ts`), and the mark moves past those PRs. A card
// that did not show, or did not stage, leaves the mark where it was, so the
// next morning plans it again.
//
// PURE: `Env` enters in `./env.ts`.

import { rethrowIfBudget } from "../net";
import type { PendingProposal } from "../thread-state/index";
import { markNotStaged, type ReportMessage, type ReportStore } from "../slack/decision-cards";
import { handedSection, type SectionHandOff, type SweepSection } from "../sweep/sections";
import { DEV_LINKS_NOT_STAGED, devLinksItem, devLinksItemId, devLinksParent } from "./copy";
import { readMergedPrs, type FeedDeps, type SeenMark } from "./feed";
import { markCarded, stagedDevLinks, type DevLinksDeps, type DevLinksPlan, type DevLinksRequest, type PlannedDevLinks } from "./run";

/** The section's name on the sweep's morning post. */
export const DEV_LINKS_SECTION = "figma-dev-links";

/** The last merged PR whose links were carded (`./feed.ts` `SeenMark`), in HARNESS_KV. */
export const SEEN_KV_KEY = "figma-links:prs-seen";

interface Store<T> {
  read(): Promise<T>;
  write(value: T): Promise<void>;
}

/** What the hand-over leaves for #plus-design's top. */
export interface DevLinksHanded extends PlannedDevLinks {
  confirmers: string[];
  /** The latest merge the card covers: where the mark moves once it stages. */
  through: SeenMark;
}

export interface DevLinksMorningDeps {
  /** Whether `FIGMA_DEV_LINKS` is on: until it is, the PRs wait. */
  on: boolean;
  /** The merged PRs' reads and the mark (`./feed.ts`). */
  feed: FeedDeps;
  plan(request: DevLinksRequest): Promise<DevLinksPlan>;
  /** #plus-design's member ids, or null when Slack would not say. */
  members(): Promise<string[] | null>;
  /** The morning run's hand-off; absent on a rehearsal. */
  handOff?: SectionHandOff<DevLinksHanded>;
  channel: string;
  /** The morning's date. */
  date: string;
  now(): number;
}

/**
 * The morning's hand-over of a Dev Mode links card for the PRs merged into
 * main since the last one carded that changed a component.
 *
 * @param deps - The setting, the feed and its mark, the plan, the members and the hand-off
 * @param opts - `dryRun` reads and plans, and hands over and keeps nothing
 */
export async function handOverDevLinks(deps: DevLinksMorningDeps, opts: { dryRun?: boolean } = {}): Promise<{ summary: string }> {
  if (!deps.on) return { summary: "merged PRs wait until FIGMA_DEV_LINKS is on" };
  const fed = await readMergedPrs(deps.feed, opts);
  const latest = fed.through;
  if (!latest) return { summary: fed.summary };
  const merged = fed.prs;
  if (!fed.components.length) {
    // Nothing among them to link: those PRs are done with.
    if (!opts.dryRun) await deps.feed.mark.write(latest);
    return { summary: fed.summary };
  }
  const { planned, tail, stopped } = await deps.plan({ components: fed.components });
  if (stopped) return { summary: `${stopped} — kept for tomorrow` };
  if (!planned) {
    // Nothing left to link: those PRs are done with.
    if (!opts.dryRun) await deps.feed.mark.write(latest);
    return { summary: `nothing to add for ${merged.length} merged PR(s)${tail}` };
  }
  const members = await deps.members();
  if (!members?.length) return { summary: `#plus-design's members unread — kept for tomorrow${tail}` };
  const counted = `a card for ${planned.write.links.length} link(s) from ${merged.length} merged PR(s)${tail}`;
  if (opts.dryRun || !deps.handOff) return { summary: `would hand ${counted} to the morning post` };
  await deps.handOff.put(deps.date, { channel: deps.channel, threadTs: null }, { ...planned, confirmers: members, through: latest });
  return { summary: `handed ${counted} to the morning post` };
}

export interface DevLinksSectionDeps extends Pick<DevLinksDeps, "carded"> {
  reports: ReportStore;
  stage(proposal: PendingProposal): Promise<void>;
  /** Edit the morning's message in place. */
  edit(ts: string, message: ReportMessage): Promise<void>;
  /** The feed's mark (`./feed.ts`). */
  mark: Store<SeenMark | null>;
  now(): number;
}

/**
 * The Dev Mode links card as a section of the sweep's morning message in
 * #plus-design: its line, then its one card. Once the message is up the card
 * stages, is kept as posted, and the mark moves past the PRs it covers; one
 * that did not show or did not stage leaves the mark, and comes back the next
 * morning.
 *
 * @param deps - The staging, the record, the edit, the posted cards and the mark
 * @param handOff - The morning run's hand-off
 * @param date - The morning's date
 */
export function devLinksSection(deps: DevLinksSectionDeps, handOff: SectionHandOff<DevLinksHanded>, date: string): SweepSection {
  return handedSection<DevLinksHanded>({
    source: DEV_LINKS_SECTION,
    date,
    handOff,
    cardsOf(value) {
      return {
        cards: [{ person: null, item: devLinksItem(value.subject, value.write) }],
        // The card's staging, the posted cards and the mark, and an edit when
        // it did not stage.
        cost: (shown) => ({ subrequests: shown.length ? 4 : 0, d1Queries: shown.length * 2 }),
        says: () => devLinksParent(value.subject),
      };
    },
    async posted(value, place, shown, report, progress) {
      const id = devLinksItemId(value.subject);
      if (!shown.includes(id)) return;
      let staged = progress.done.get(id);
      if (staged === undefined) {
        try {
          await deps.stage(stagedDevLinks(place.channel, report.ts, report.ts, value.subject, value.write, value.confirmers));
          staged = true;
        } catch (err) {
          rethrowIfBudget(err);
          console.error(`[figma-links] the card posted but did not stage: ${err instanceof Error ? err.message : String(err)}`);
          staged = false;
        }
        await progress.mark(id, staged);
      }
      if (staged) {
        await markCarded(deps, id, report.ts, deps.now());
        await deps.mark.write(value.through);
        return;
      }
      const marked = await markNotStaged(deps.reports, report.ts, [id], DEV_LINKS_NOT_STAGED).catch((err: unknown) => {
        rethrowIfBudget(err);
        return null;
      });
      if (marked) await deps.edit(report.ts, marked).catch(rethrowIfBudget);
    },
    async notPosted(_value, _place, why) {
      // The mark has not moved: the next morning plans the card again.
      console.error(`[figma-links] the morning message did not carry the card (${why}) — kept for tomorrow`);
    },
  });
}
