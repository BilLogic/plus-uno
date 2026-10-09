// The morning run's `figma-library-post` job: each change set the end-of-day
// poll found becomes ONE message in #plus-universal — a release card, a
// result table of the changed components and the proposal card's decision
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
// THE CARD. Its batch files the intake (`github_issue_create`) and, when any
// changed component maps to code, dispatches `figma-implement.yml` for all of
// them (`component_implement` carrying `library_publish`). It is staged the way
// a turn stages one — `ThreadState.putProposal` — with no turn behind it, so
// Gate resolves it on every door like any other card, with two terms of its
// own:
//   • `confirmers` — the channel's members, read here at staging time. The
//     design-ops team is whoever is in #plus-universal, so no variable names
//     them; someone who joins later is not on this card.
//   • `ttlMs` — 72 hours: a Friday publish still has Monday.
// And one thing no turn's card has: `onCancel`, the intake operation. A ⛔
// declines the implementation, not the record of the publish, so it files the
// intake only (the card says so). Gate has no "cancel but do part" of its own;
// `PendingProposal.onCancel` is that path, and only this card sets it.
//
// The card mentions the publisher by their Figma handle — the versions API
// gives a handle and no email, so there is no Slack id to resolve it to.
//
// A read that fails — the registry, the members — posts nothing and keeps the
// findings for tomorrow: a card whose every row read "no code mapping", or one
// nobody could confirm, would be worse than a day's wait.
//
// Subrequest math, per job: the registry (1) and the channel's members (at
// most 3 pages), then per change set one post, and — only when the card had to
// cap its list — the full list in its thread, a reply per ~3,500 chars of
// names (about 200 names each); the staging is a Durable Object hop and KV is
// the internal bucket. The poll keeps at most `MAX_FINDINGS` (5) change sets
// waiting: with no list to spill that is 1 + 3 + 5 = 9, and even five cards
// each spilling three replies come to 1 + 3 + 5 × 4 = 24, under the lookup
// ceiling of 38.
//
// Named dependencies; `Env` enters in `figma-library/env.ts`.

import type { PendingProposal, ProposalOperation } from "../thread-state/index";
import type { ProposalCard } from "../turn/index";
import { proposalCardBlocks, renderProposalCard } from "../slack/proposal-render";
import { textSections } from "../slack/render";
import { rethrowIfBudget } from "../net";
import {
  draftPublishIntake,
  editedNotPublished,
  libraryCardWords,
  mergeChangeSets,
  publishCard,
  type ComponentRegistry,
  type LibraryChangeSet,
  type PublishCardCopy,
  type PublishIntake,
} from "./draft";
import type { TrackedPublish } from "./track";
import { releaseBlocks } from "./release";

/** How long the card stays confirmable. */
export const LIBRARY_CARD_TTL_MS = 72 * 60 * 60 * 1000;

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
  /** Post a reply in a card's thread — the full list, when the card capped it. */
  reply(ts: string, text: string): Promise<void>;
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
 * The card's batch: the intake, then the dispatch when anything maps to code.
 *
 * @param intake - The drafted intake
 */
export function libraryOperations(intake: PublishIntake): { operations: ProposalOperation[]; onCancel: ProposalOperation[] } {
  const file: ProposalOperation = { toolName: "github_issue_create", input: { title: intake.title, body: intake.body } };
  const operations: ProposalOperation[] = [file];
  if (intake.implement.length && intake.versionId) {
    operations.push({
      toolName: "component_implement",
      input: { component: intake.implement.join(", "), library_publish: intake.versionId },
    });
  }
  return { operations, onCancel: [file] };
}

/**
 * The card as data: a `stated` card, whose lead is the publish and its
 * components and whose one footer says what ✅ and ⛔ each do — both
 * operations named, which is why it carries no plan (#886 § 3.1).
 *
 * @param changeSet - What the poll found
 * @param intake - Its drafted intake
 */
export function libraryCard(
  changeSet: LibraryChangeSet,
  intake: PublishIntake,
  operations: ProposalOperation[] = libraryOperations(intake).operations,
  copy: PublishCardCopy = publishCard(changeSet, intake, LIBRARY_CARD_TTL_MS / 3_600_000),
): ProposalCard {
  return {
    kind: "stated",
    verb: operations.length > 1 ? "file this intake and start the implementation" : "file this intake",
    lead: copy.lead,
    footer: copy.footer,
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
    const copy = publishCard(changeSet, intake, LIBRARY_CARD_TTL_MS / 3_600_000);
    const { operations, onCancel } = libraryOperations(intake);
    const card = renderProposalCard(libraryCard(changeSet, intake, operations, copy));
    // The release card and the table of changed components lead, and the
    // decision — what ✅ and ⛔ do, and Review — stays last. Slack refusing
    // them posts the card as text, which is the whole card on its own.
    const release = releaseBlocks(changeSet, intake);
    let sent = { ok: false } as { ok: boolean; ts?: string };
    let listed = false;
    // The blocks it went up with, kept on the record so a decision or a gate
    // note edits its line onto them rather than onto the text alone.
    let ownBlocks: unknown[] | undefined;
    if (release.length) {
      const blocks = [...release, ...proposalCardBlocks(copy.footer)];
      sent = await deps.post({ text: card.text, blocks });
      if (sent.ok) ownBlocks = blocks;
      listed = sent.ok && release.some((b) => b.type === "data_table");
      if (!sent.ok) console.warn(`[figma-library] release blocks for ${intake.key} refused — posting the card as text`);
    }
    if (!sent.ok) sent = await deps.post({ text: card.text, blocks: proposalCardBlocks(card.text) });
    if (!sent.ok || !sent.ts) {
      console.error(`[figma-library] post for ${intake.key} failed — kept for tomorrow`);
      break;
    }
    const ts = sent.ts;
    try {
      await deps.stage({
        operations,
        toolName: operations[0]!.toolName,
        input: operations[0]!.input,
        channel: deps.channel,
        threadTs: ts,
        replyTs: ts,
        userMsgTs: ts,
        proposalTs: ts,
        proposalText: card.text,
        ...(ownBlocks ? { proposalBlocks: ownBlocks } : {}),
        // Nobody asked: the Worker staged it.
        requesterUserId: "",
        ttlMs: LIBRARY_CARD_TTL_MS,
        confirmers: [...members],
        onCancel,
        // Its own words at the gate: a ⛔ is "intake only", not a request to
        // stage it again, and nobody can "ask again" for a publish.
        stated: libraryCardWords(intake, LIBRARY_CARD_TTL_MS / 3_600_000),
      });
    } catch (err) {
      // The message is up; posting it again tomorrow would make two. Its ✅
      // will say it was already resolved, which is where a person asks.
      console.error(`[figma-library] card for ${intake.key} posted but not staged: ${err instanceof Error ? err.message : String(err)}`);
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
      cardText: card.text,
      ...(ownBlocks ? { cardBlocks: ownBlocks } : {}),
    });
    waiting.shift();
    posted += 1;
    await deps.tracked.write(tracked);
    await deps.findings.write(waiting);
    if (carried) {
      carried = null;
      await deps.unpublished.write(null);
    }
    // The card capped its list to stay one readable post; the whole list goes
    // in its thread — after the card is on record, so a stop here can never
    // post the card twice. A reply that fails is logged (the intake carries
    // every row); a budget stop ends the job, and the rest wait for its retry.
    // The table names every component already, so the list goes in the thread
    // only when no table did.
    for (const text of listed ? [] : copy.overflow) {
      await deps.reply(ts, text).catch((err: unknown) => {
        rethrowIfBudget(err);
        console.error(`[figma-library] full list for ${intake.key} not posted: ${err instanceof Error ? err.message : String(err)}`);
      });
    }
  }
  const verb = opts.dryRun ? "would post" : "posted";
  return { posted, pending: waiting.length, summary: `${verb} ${posted}, ${waiting.length} waiting` };
}
