// The morning run's `figma-library-post` job: each change set the end-of-day
// poll found becomes ONE message in #plus-universal, on the shared decision
// card (`slack/decision-cards.ts`) — a parent line saying who published what,
// one card for the publish, and the table of changed components under it
// (`release.ts`) — with the drafted intake behind it.
//
// A CHANGE WITH NO PUBLISHED VERSION posts no card (#886 § 3.1): the library
// was edited, not published, so there is nothing to build and nothing to
// decide. It says so in one plain message, files nothing, stages nothing and
// is not tracked — but it is KEPT (`unpublished`), and the next publish's card
// carries it (`mergeChangeSets`), which is what its "I'll post again when a
// version is published" promises. The poll cannot tell an autosave from a
// publish left without a description (`versionsFrom`), and its snapshot has
// already moved past the change, so without this a real publish read as an
// edit would never reach a card.
//
// THE CARD. A publish is one decision, so it is one card, not one per
// component. Its Review opens the publish in the pop-up: Approve files the
// intake (`github_issue_create`) and, when any changed component maps to code,
// dispatches `figma-implement.yml` for every one of them (`component_implement`
// carrying `library_publish`); Reject files nothing. Open goes to the library,
// and View version to the publish. It is staged as the report's one item
// (`itemProposal`), with no turn behind it, and two terms of its own:
//   • `confirmers` — the channel's members, read here at staging time. The
//     design-ops team is whoever is in #plus-universal, so no variable names
//     them; someone who joins later is not on this card.
//   • `ttlMs` — 72 hours: a Friday publish still has Monday.
// The report's record keeps the table (`after`), so a decision redraws the
// card and the table stays under it.
//
// The card names the publisher by their Figma handle — the versions API gives
// a handle and no email, so there is no Slack id to resolve it to.
//
// A read that fails — the registry, the members — posts nothing and keeps the
// findings for tomorrow: a card whose every row read "no code mapping", or one
// nobody could confirm, would be worse than a day's wait.
//
// Subrequest math, per job: the registry (1) and the channel's members (at
// most 3 pages), then per change set one post — two when Slack refuses its
// table — an edit when its staging failed, and, only when no table went up,
// the full list in its thread, a reply per ~3,500 chars of names (about 200
// names each). Its record and its staging are Durable Object hops and KV is
// the internal bucket. The poll keeps at most `MAX_FINDINGS` (5) change sets
// waiting: with a table each that is 1 + 3 + 5 = 9, and even five cards each
// refused, unstaged and spilling three replies come to 1 + 3 + 5 × 6 = 34,
// under the lookup ceiling of 38.
//
// Named dependencies; `Env` enters in `figma-library/env.ts`.

import type { PendingProposal, ProposalOperation, ThreadState } from "../thread-state/index";
import type { ProposalCard } from "../turn/index";
import { renderProposalCard } from "../slack/proposal-render";
import { textSections } from "../slack/render";
import { decisionReport, itemProposal, markNotStaged, reportMessage, reportRecord, type DecisionReport, type ReportMessage } from "../slack/decision-cards";
import { rethrowIfBudget } from "../net";
import {
  componentListMessages,
  draftPublishIntake,
  editedNotPublished,
  libraryCardWords,
  mergeChangeSets,
  publishLead,
  releaseItem,
  releaseParent,
  type ComponentRegistry,
  type LibraryChangeSet,
  type PublishIntake,
} from "./draft";
import type { TrackedPublish } from "./track";
import { componentTableBlock } from "./release";

/** How long the card stays confirmable. */
export const LIBRARY_CARD_TTL_MS = 72 * 60 * 60 * 1000;

/** A card whose staging failed says this in place of who and when; the
 *  tracker still files its intake when its window closes. */
export const NOT_STAGED = "Couldn't be staged for review. I file its intake when its 72 h are up, so the publish isn't lost.";

export interface PostDeps {
  findings: { read(): Promise<LibraryChangeSet[]>; write(findings: LibraryChangeSet[]): Promise<void> };
  tracked: { read(): Promise<TrackedPublish[]>; write(tracked: TrackedPublish[]): Promise<void> };
  /** Edits posted as "edited, not published", merged, waiting to ride into
   *  the next publish's card. */
  unpublished: { read(): Promise<LibraryChangeSet | null>; write(changeSet: LibraryChangeSet | null): Promise<void> };
  /** component-registry.json, or null when it could not be read. */
  registry(): Promise<ComponentRegistry | null>;
  /** The channel's member ids, or null when Slack would not say. */
  members(): Promise<string[] | null>;
  /** Post one top-level message in the channel. */
  post(message: { text: string; blocks: unknown[] }): Promise<{ ok: boolean; ts?: string }>;
  /** Edit a posted message in place (`chat.update`). */
  edit(ts: string, message: ReportMessage): Promise<void>;
  /** Post a reply in a card's thread — the full list, when no table went up. */
  reply(ts: string, text: string): Promise<void>;
  /** Where a report's record is kept, and each decision lands. */
  reports: Pick<ThreadState, "putReport" | "updateReport" | "getReport" | "getProposalByTs">;
  /** Stage the card, as a turn's staging does. */
  stage(proposal: PendingProposal): Promise<void>;
  channel: string;
  now(): number;
}

export interface PostResult {
  /** Cards posted — or, on a dry run, drafted and not posted. */
  posted: number;
  pending: number;
  summary: string;
}

/**
 * Approve's batch: the intake, then the dispatch when anything maps to code.
 *
 * @param intake - The drafted intake
 */
export function libraryOperations(intake: PublishIntake): ProposalOperation[] {
  const operations: ProposalOperation[] = [{ toolName: "github_issue_create", input: { title: intake.title, body: intake.body } }];
  if (intake.implement.length && intake.versionId) {
    operations.push({
      toolName: "component_implement",
      input: { component: intake.implement.join(", "), library_publish: intake.versionId },
    });
  }
  return operations;
}

/**
 * The card as the Review pop-up shows it: a `stated` card whose lead is the
 * publish and its components, with its two operations as fields and no
 * footer — the pop-up's Approve and Reject are the decision.
 *
 * @param changeSet - What the poll found
 * @param intake - Its drafted intake
 */
export function libraryCard(changeSet: LibraryChangeSet, intake: PublishIntake, operations: ProposalOperation[] = libraryOperations(intake)): ProposalCard {
  return {
    kind: "stated",
    verb: operations.length > 1 ? "file this intake and start the implementation" : "file this intake",
    lead: publishLead(changeSet, intake),
    footer: "",
    fields: [
      { label: "intake", value: intake.title },
      ...(operations.length > 1 ? [{ label: "implement", value: intake.implement.join(", ") }] : []),
    ],
    caveats: [],
    operations,
  };
}

/**
 * Post every waiting change set, oldest first.
 *
 * @param deps - Reads, the post and the staging
 * @param opts - `dryRun` drafts and reads, and posts, stages and writes nothing
 */
export async function postLibraryFindings(deps: PostDeps, opts: { dryRun?: boolean } = {}): Promise<PostResult> {
  const findings = await deps.findings.read();
  if (!findings.length) return { posted: 0, pending: 0, summary: "no library changes waiting" };

  const [registry, members] = await Promise.all([deps.registry(), deps.members()]);
  if (!registry || !members) {
    const missing = [!registry ? "the component registry" : "", !members ? "the channel's members" : ""].filter(Boolean);
    console.error(`[figma-library] could not read ${missing.join(" or ")} — ${findings.length} change set(s) kept for tomorrow`);
    return { posted: 0, pending: findings.length, summary: `kept ${findings.length}: ${missing.join(", ")} unread` };
  }

  let posted = 0;
  const waiting = [...findings];
  const tracked = await deps.tracked.read();
  let carried = await deps.unpublished.read();
  while (waiting.length) {
    const found = waiting[0]!;
    if (opts.dryRun) {
      waiting.shift();
      posted += 1;
      continue;
    }
    if (!found.versions.length) {
      // Edited, not published: said plainly, and nothing to decide. The edit
      // is kept to ride into the next publish's card — the poll's snapshot has
      // already moved past it, so nothing else would bring it back.
      const text = editedNotPublished(found, draftPublishIntake(found, registry));
      const sent = await deps.post({ text, blocks: textSections(text) });
      if (!sent.ok) {
        console.error("[figma-library] edited-not-published post failed — kept for tomorrow");
        break;
      }
      carried = carried ? mergeChangeSets(carried, found) : found;
      await deps.unpublished.write(carried);
      waiting.shift();
      posted += 1;
      await deps.findings.write(waiting);
      continue;
    }
    // A publish: any edit announced before it is part of it now.
    const changeSet = carried ? mergeChangeSets(carried, found) : found;
    const intake = draftPublishIntake(changeSet, registry);
    const operations = libraryOperations(intake);
    const item = releaseItem(changeSet, intake);
    const parent = releaseParent(changeSet, intake);
    // The card, then the table under it. Slack refusing the table posts the
    // card alone, and the list goes in the thread instead.
    const table = componentTableBlock(intake);
    let report: DecisionReport = decisionReport([item], parent, table ? { after: [table] } : {});
    let sent = await deps.post({ text: report.text, blocks: report.blocks });
    if (!sent.ok && table) {
      console.warn(`[figma-library] table for ${intake.key} refused — posting the card alone`);
      report = decisionReport([item], parent);
      sent = await deps.post({ text: report.text, blocks: report.blocks });
    }
    if (!sent.ok || !sent.ts) {
      console.error(`[figma-library] post for ${intake.key} failed — kept for tomorrow`);
      break;
    }
    const ts = sent.ts;
    const listed = !!report.after;
    if (!(await stageCard(deps, ts, report, item.id, changeSet, intake, operations, members))) {
      // The message is up; posting it again tomorrow would make two. It says
      // it has nothing to review, and its intake is still filed at expiry.
      const marked =
        (await markNotStaged(deps.reports, ts, [item.id], NOT_STAGED).catch(() => null)) ??
        reportMessage({
          ...reportRecord(deps.channel, ts, report, LIBRARY_CARD_TTL_MS),
          entries: [{ id: item.id, item, state: { kind: "not-staged", note: NOT_STAGED } }],
        });
      await deps.edit(ts, marked).catch((err: unknown) => {
        rethrowIfBudget(err);
        console.error(`[figma-library] card for ${intake.key} not staged, and not edited to say so: ${err instanceof Error ? err.message : String(err)}`);
      });
    }
    tracked.push({
      key: intake.key,
      marker: intake.marker,
      channel: deps.channel,
      ts,
      postedAt: deps.now(),
      implement: operations.length > 1 ? intake.implement.join(", ") : null,
      // Kept for an expiry nobody decides: the tracker files this draft and
      // closes this card (`figma-library/track.ts`).
      draft: { title: intake.title, body: intake.body },
      item: item.id,
    });
    waiting.shift();
    posted += 1;
    await deps.tracked.write(tracked);
    await deps.findings.write(waiting);
    if (carried) {
      carried = null;
      await deps.unpublished.write(null);
    }
    // No table went up, so the whole list goes in the thread — after the card
    // is on record, so a stop here can never post the card twice. A reply that
    // fails is logged (the intake carries every row); a budget stop ends the
    // job, and the rest wait for its retry.
    for (const text of listed || !intake.rows.length ? [] : componentListMessages(intake)) {
      await deps.reply(ts, text).catch((err: unknown) => {
        rethrowIfBudget(err);
        console.error(`[figma-library] full list for ${intake.key} not posted: ${err instanceof Error ? err.message : String(err)}`);
      });
    }
  }
  const verb = opts.dryRun ? "would post" : "posted";
  return { posted, pending: waiting.length, summary: `${verb} ${posted}, ${waiting.length} waiting` };
}

/**
 * Keep the report's record and stage its one item; whether both went
 * through. A budget stop ends the job.
 */
async function stageCard(
  deps: PostDeps,
  ts: string,
  report: DecisionReport,
  id: string,
  changeSet: LibraryChangeSet,
  intake: PublishIntake,
  operations: ProposalOperation[],
  members: readonly string[],
): Promise<boolean> {
  try {
    await deps.reports.putReport(reportRecord(deps.channel, ts, report, LIBRARY_CARD_TTL_MS));
    await deps.stage({
      operations,
      toolName: operations[0]!.toolName,
      input: operations[0]!.input,
      channel: deps.channel,
      threadTs: ts,
      replyTs: ts,
      ...itemProposal(ts, id),
      // What Review shows: the publish and every component.
      proposalText: renderProposalCard(libraryCard(changeSet, intake, operations)).text,
      // Nobody asked: the Worker staged it.
      requesterUserId: "",
      ttlMs: LIBRARY_CARD_TTL_MS,
      confirmers: [...members],
      // Its own words at the gate: Reject files nothing, and nobody can "ask
      // again" for a publish.
      stated: libraryCardWords(intake, LIBRARY_CARD_TTL_MS / 3_600_000),
    });
    return true;
  } catch (err) {
    rethrowIfBudget(err);
    console.error(`[figma-library] card for ${intake.key} posted but not staged: ${err instanceof Error ? err.message : String(err)}`);
    return false;
  }
}
