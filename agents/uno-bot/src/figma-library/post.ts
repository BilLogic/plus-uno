// The morning run's `figma-library-post` job: each change set the end-of-day
// poll found becomes ONE message in #plus-universal — the summary and a
// proposal card — with the drafted intake behind it.
//
// A CHANGE WITH NO PUBLISHED VERSION posts no card (#886 § 3.1): the library
// was edited, not published, so there is nothing to build and nothing to
// decide. It says so in one plain message, files nothing, stages nothing and
// is not tracked.
//
// THE CARD. Its batch files the intake (`github_issue_create`) and, when any
// changed component maps to code, dispatches `figma-implement.yml` for all of
// them (`component_implement` carrying `library_publish`). It is staged the way
// a turn stages one — `ThreadState.putProposal` — with no turn behind it, so
// Gate resolves it on all four doors like any other card, with two terms of its
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
import {
  draftPublishIntake,
  editedNotPublished,
  publishCard,
  type ComponentRegistry,
  type LibraryChangeSet,
  type PublishCardCopy,
  type PublishIntake,
} from "./draft";
import type { TrackedPublish } from "./track";

/** How long the card stays confirmable. */
export const LIBRARY_CARD_TTL_MS = 72 * 60 * 60 * 1000;

export interface PostDeps {
  findings: { read(): Promise<LibraryChangeSet[]>; write(findings: LibraryChangeSet[]): Promise<void> };
  tracked: { read(): Promise<TrackedPublish[]>; write(tracked: TrackedPublish[]): Promise<void> };
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
  while (waiting.length) {
    const changeSet = waiting[0]!;
    const intake = draftPublishIntake(changeSet, registry);
    if (opts.dryRun) {
      waiting.shift();
      posted += 1;
      continue;
    }
    if (!intake.versionId) {
      // Edited, not published: said plainly, and nothing to decide.
      const text = editedNotPublished(changeSet, intake);
      const sent = await deps.post({ text, blocks: textSections(text) });
      if (!sent.ok) {
        console.error(`[figma-library] post for ${intake.key} failed — kept for tomorrow`);
        break;
      }
      waiting.shift();
      posted += 1;
      await deps.findings.write(waiting);
      continue;
    }
    const copy = publishCard(changeSet, intake, LIBRARY_CARD_TTL_MS / 3_600_000);
    const { operations, onCancel } = libraryOperations(intake);
    const card = renderProposalCard(libraryCard(changeSet, intake, operations, copy));
    const sent = await deps.post({ text: card.text, blocks: proposalCardBlocks(card.text) });
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
        // Nobody asked: the Worker staged it.
        requesterUserId: "",
        ttlMs: LIBRARY_CARD_TTL_MS,
        confirmers: [...members],
        onCancel,
      });
    } catch (err) {
      // The message is up; posting it again tomorrow would make two. Its ✅
      // will say it was already resolved, which is where a person asks.
      console.error(`[figma-library] card for ${intake.key} posted but not staged: ${err instanceof Error ? err.message : String(err)}`);
    }
    // The card capped its list to stay one readable post; the whole list
    // goes in its thread. A reply that fails is logged — the intake carries
    // every row too — and the card is not posted again.
    for (const text of copy.overflow) {
      await deps.reply(ts, text).catch((err: unknown) => {
        console.error(`[figma-library] full list for ${intake.key} not posted: ${err instanceof Error ? err.message : String(err)}`);
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
      cardText: card.text,
    });
    waiting.shift();
    posted += 1;
    await deps.tracked.write(tracked);
    await deps.findings.write(waiting);
  }
  const verb = opts.dryRun ? "would post" : "posted";
  return { posted, pending: waiting.length, summary: `${verb} ${posted}, ${waiting.length} waiting` };
}
