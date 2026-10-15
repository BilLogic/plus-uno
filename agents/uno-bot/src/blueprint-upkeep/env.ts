// Blueprint upkeep bound to `Env` — the only file in the folder that names it.
//
// What each port becomes:
//   • the Roadmap: one status query on `Design Status: Shipped` or `Dev
//     Status: Deployed`, narrowed to cards edited since the cursor
//     (`queryRowsWithAnyStatus`), one page of 100;
//   • the evidence: the card's page text and its PRD's (`readNotionPage`,
//     through `cardEvidence`);
//   • the gate's search: `search_blueprint`'s read (`searchBlueprint`);
//   • the path read: five anon-key PostgREST reads of uno-blueprint — the
//     matched cell's path, then that path, its cells, lanes and ordered steps
//     (`PATH_READ_COST`);
//   • the model: the Worker's provider (`selectProvider`), one tier a call;
//   • the owner: the card's first Contributor, through the Team Members
//     directory then by name (card follow-ups' `peopleFor`);
//   • the place: card follow-ups' ladder (`cardPlace`);
//   • the lead: `LEAD_USER_ID`, the deployment's lead, the other confirmer;
//   • the state: one JSON record in HARNESS_KV; each card's weighed mark a
//     key of its own there, kept for good; each revision thread a key too;
//   • a turn's milestone comparison: the same gate, search and path read, and
//     the thread's store for its once-per-scenario claim; the offer under it
//     drafts on the same provider;
//   • a drawn proposal's thread → rows record: `blueprint_proposals` in the
//     usage database (`proposalRecordsFor`); the Roadmap card a thread's PRD
//     created, a HARNESS_KV key a thread for 45 days, so a proposal drawn
//     after its PRD is linked as it is kept (`./link.ts`);
//   • a linked card's proposals: one D1 query, then each variant path read
//     (5) and, at a deploy, the path it was drawn beside by its id (4) —
//     three path reads at most, inside `MATCH_COST`;
//   • a drawn proposal's removal: a ✅ card posted under the proposal's
//     thread and staged as a revision card is (`proposalOfferDepsFor`), on a
//     removal ask there or from the morning's `blueprint-proposal-offer`
//     check — one post, one staging and a few D1 queries an offer
//     (`./proposal-cleanup.ts`).
//
// Budget (ADR-022), against the 38-subrequest lookup ceiling of one alarm,
// each job sized by cost, not by a count (`./budget.ts`).
// A match job: the Roadmap query (1, the first job only) and the model's
// token (1), then per card a deploy's promotion try — the path read (5) —
// and, failing that, the page and up to three block pages (4), its one PRD
// the same (4), the judgement (1), the search (≤3) and a Slack lookup or two
// for the owner: `MATCH_COST` (20) at the worst. A draft job: the token,
// then per path the path read (5) and the draft, grind then default (2):
// `DRAFT_COST` (7). A job starts a card or a path only while the alarm's
// headroom covers that worst case: after the first job's 2, 36 is left, so
// one PRD-heavy card (20) leaves 16 and fills its job, while a light card
// leaves room for another; across `MATCH_JOBS` that is six PRD-heavy cards a
// night at the least. A card that still overruns stops on the ceiling and its
// job is deferred, the cards before it kept. What a night's jobs do not reach
// waits on the cursor and the queue for the next.

import type { Env } from "../types";
import { budgetHeadroom, charge, countedFetch } from "../net";
import { getBotIdentity, postMessage, updateMessage } from "../slack/api";
import type { SlackMessageEvent } from "../slack/types";
import { ladderChannelsFor } from "../destination/env";
import { reportRecord } from "../slack/decision-cards";
import { redraftRevision } from "./revise";
import { selectProvider } from "../agent/run-agent";
import { channelIdsFor } from "../destination/env";
import { queryRowsWithAnyStatus, readNotionPage } from "../integrations/notion";
import { searchBlueprint, isBlueprintConfigured } from "../integrations/blueprint";
import { cellUrl } from "../integrations/blueprint-link";
import { ENTITY_STATUSES, type EntityStatus } from "../blueprint-write/index";
import { kvJson } from "../figma-poll";
import { measured } from "../sweep/env";
import { sectionHandOffIn, type SweepSection } from "../sweep/sections";
import { cardPlace } from "../follow-through/run";
import { peopleFor } from "../follow-through/env";
import { recordProposalEvents, stagedEvent, supersededEvents } from "../usage/index";
import { proposalEventLogFor } from "../usage/production";
import { threadStateFor } from "../thread-state/production";
import type { JobContext } from "../scheduled/runs";
import type { PendingProposal } from "../thread-state/index";
import { serviceChangeGate } from "./gate";
import { COMPARISON_SUBREQUESTS, milestoneComparison, type MilestoneComparison } from "./milestone";
import { DELIVERY_RESERVE } from "../agent/loop-policy";
import type { ThreadState } from "../thread-state/index";
import type { PathToday } from "./draft";
import { draftProposal, drawnProposalOf, PROPOSAL_OFFER_SUBREQUESTS, type ProposalDrafter } from "./proposal";
import { createD1ProposalRecords } from "./proposal-records-d1";
import { keepProposalLinks, prdCardOf, type ThreadCards } from "./link";
import type { ProposalRecords } from "./proposal-records";
import { isRemoveRequest, offerAgedRemovals, offerRequestedRemoval, type OfferDeps } from "./proposal-cleanup";
import { proposalCardBlocks, renderProposalCard } from "../slack/proposal-render";
import type { OperationOutcome } from "../gate/index";
import { cardEvidence } from "./evidence";
import { stageOf, STAGES } from "./stages";
import {
  draftMatched,
  handOverRevisions,
  matchShipped,
  postOverflow,
  replanRows,
  revisionSection,
  UPKEEP_SECTION,
  type RevisionHanded,
  type RevisionThread,
  type RevisionThreads,
  type ShippedCard,
  type ShippedDeps,
  type ShippedReport,
  type UpkeepState,
  type WeighedMarks,
} from "./job";

const STATE_KV_KEY = "blueprint-upkeep:state";
const WEIGHED_PREFIX = "blueprint-upkeep:weighed:";
const THREAD_PREFIX = "blueprint-upkeep:thread:";
const THREAD_CARD_PREFIX = "blueprint-upkeep:thread-card:";
/** How long a thread's PRD card is remembered for a proposal drawn after it. */
const THREAD_CARD_TTL_S = 45 * 24 * 60 * 60;
const EMPTY: UpkeepState = { cursor: null, read: null, matched: [], waiting: [] };

const stateFor = (env: Env) => kvJson<UpkeepState>(env, STATE_KV_KEY, EMPTY);

/** Each card weighed, one key a card and status, never expiring. */
function weighedOn(kv: KVNamespace): WeighedMarks {
  return {
    async has(key) {
      charge(1, "kv");
      return (await kv.get(`${WEIGHED_PREFIX}${key}`)) !== null;
    },
    async add(key) {
      charge(1, "kv");
      await kv.put(`${WEIGHED_PREFIX}${key}`, String(Date.now()));
    },
  };
}

/** Each revision thread, kept a day past its cards' window. */
export function revisionThreadsOn(kv: KVNamespace): RevisionThreads {
  const key = (channel: string, ts: string) => `${THREAD_PREFIX}${channel}:${ts}`;
  return {
    async read(channel, ts) {
      charge(1, "kv");
      return kv.get<RevisionThread>(key(channel, ts), "json");
    },
    async write(thread) {
      charge(1, "kv");
      const ttl = Math.max(60, Math.ceil((thread.expiresAt - Date.now()) / 1000) + 24 * 60 * 60);
      await kv.put(key(thread.channel, thread.ts), JSON.stringify(thread), { expirationTtl: ttl });
    },
  };
}

/** One line in a thread. */
async function postLine(env: Env, channel: string, threadTs: string, text: string): Promise<void> {
  const res = await postMessage(env, { channel, thread_ts: threadTs, text });
  if (!res.ok) throw new Error(`thread line not posted (${String(res.error ?? "unknown")})`);
}

async function shippedSince(env: Env, since: string): Promise<ShippedCard[]> {
  if (!env.NOTION_ROADMAP_DB_ID) throw new Error("NOTION_ROADMAP_DB_ID not configured");
  const { rows } = await queryRowsWithAnyStatus(env, env.NOTION_ROADMAP_DB_ID, [STAGES.designed, STAGES.deployed], 100, {
    timestamp: "last_edited_time",
    last_edited_time: { on_or_after: since },
  });
  return rows.flatMap((row) => {
    const stage = stageOf(row.values);
    if (!stage) return [];
    return [
      {
        pageId: row.id,
        url: row.url,
        title: row.title,
        number: row.number ?? null,
        stage,
        pillars: row.values["Product Pillar"] ?? [],
        contributors: row.persons.Contributor ?? [],
        lastEditedAt: Date.parse(row.lastEditedTime) || 0,
      },
    ];
  });
}

/** One anon-key PostgREST read of uno-blueprint. */
async function rest<T>(env: Env, table: string, qs: string): Promise<T[]> {
  const base = env.SUPABASE_URL!.replace(/\/+$/, "");
  const res = await countedFetch(`${base}/rest/v1/${table}?${qs}`, {
    headers: { apikey: env.SUPABASE_ANON_KEY!, authorization: `Bearer ${env.SUPABASE_ANON_KEY!}` },
  });
  if (!res.ok) throw new Error(`blueprint ${table} read failed (${res.status})`);
  return (await res.json()) as T[];
}

const asStatus = (v: unknown): EntityStatus => (ENTITY_STATUSES.includes(v as EntityStatus) ? (v as EntityStatus) : "live");

/**
 * Today's path holding a cell: its scenario, its status, its lanes and steps
 * in order, and every cell on it.
 *
 * @param env - Worker bindings
 * @param cellId - A cell the gate matched
 */
export async function readPathOf(env: Env, cellId: string): Promise<PathToday | null> {
  if (!isBlueprintConfigured(env)) return null;
  const id = encodeURIComponent(cellId);
  const [held] = await rest<{ path_id: string }>(env, "cells", `select=path_id&id=eq.${id}`);
  if (!held) return null;
  return readPathById(env, held.path_id, cellId);
}

/**
 * A path by its own id, as `readPathOf` reads it: four reads.
 *
 * @param env - Worker bindings
 * @param id - The path's id
 * @param fallbackCell - The cell its link opens on when the path has none
 */
export async function readPathById(env: Env, id: string, fallbackCell?: string): Promise<PathToday | null> {
  if (!isBlueprintConfigured(env)) return null;
  const pathId = encodeURIComponent(id);
  const [[path], cells, lanes, steps] = await Promise.all([
    rest<{ id: string; name: string; status: string; scenario_id: string | null; scenarios: { name: string } | null }>(
      env,
      "paths",
      `select=id,name,status,scenario_id,scenarios(name)&id=eq.${pathId}`,
    ),
    rest<{ id: string; lane_id: string; step_id: string; content: string | null; status: string }>(
      env,
      "cells",
      `select=id,lane_id,step_id,content,status&path_id=eq.${pathId}`,
    ),
    rest<{ id: string; name: string; position: number }>(env, "lanes", `select=id,name,position&path_id=eq.${pathId}&order=position`),
    rest<{ position: number; steps: { id: string; name: string } | null }>(env, "path_steps", `select=position,steps(id,name)&path_id=eq.${pathId}&order=position`),
  ]);
  if (!path) return null;
  const stepOrder = steps.flatMap((s) => (s.steps ? [{ id: s.steps.id, name: s.steps.name }] : []));
  const at = (stepId: string) => stepOrder.findIndex((s) => s.id === stepId);
  const laneAt = (laneId: string) => lanes.findIndex((l) => l.id === laneId);
  const ordered = [...cells].sort((a, b) => at(a.step_id) - at(b.step_id) || laneAt(a.lane_id) - laneAt(b.lane_id));
  const first = ordered[0]?.id ?? fallbackCell;
  const link = first ? cellUrl(env.BLUEPRINT_APP_URL, first) : undefined;
  return {
    pathId: path.id,
    ...(path.scenario_id ? { scenarioId: path.scenario_id } : {}),
    scenario: path.scenarios?.name ?? "",
    path: path.name,
    status: asStatus(path.status),
    lanes: lanes.map((l) => ({ id: l.id, name: l.name })),
    steps: stepOrder,
    cells: ordered.map((c) => ({ id: c.id, laneId: c.lane_id, stepId: c.step_id, content: c.content ?? "", status: asStatus(c.status) })),
    ...(link ? { link } : {}),
  };
}

/**
 * One end-of-day match job (`blueprint-shipped-N`) on `Env`.
 *
 * @param env - Worker bindings
 * @param opts - `dryRun` keeps nothing
 */
export async function runShippedMatchOnEnv(env: Env, opts: JobContext): Promise<ShippedReport> {
  const deps = shippedDepsFor(env);
  return typeof deps === "string" ? { drafted: 0, summary: deps } : matchShipped(deps, opts);
}

/**
 * One end-of-day draft job (`blueprint-draft-N`) on `Env`.
 *
 * @param env - Worker bindings
 * @param opts - `dryRun` keeps nothing
 */
export async function runShippedDraftOnEnv(env: Env, opts: JobContext): Promise<ShippedReport> {
  const deps = shippedDepsFor(env);
  return typeof deps === "string" ? { drafted: 0, summary: deps } : draftMatched(deps, opts);
}

/** The end-of-day jobs' dependencies on `Env`, or why there are none. */
function shippedDepsFor(env: Env): ShippedDeps | string {
  if (!env.NOTION_ROADMAP_DB_ID || !env.NOTION_API_KEY) return "Notion not configured — read skipped";
  if (!isBlueprintConfigured(env)) return "uno-blueprint not configured — read skipped";
  if (!env.HARNESS_KV) return "HARNESS_KV not bound — nowhere to keep revisions; read skipped";
  const provider = selectProvider(env);
  const people = peopleFor(env);
  const config = channelIdsFor(env);
  const proposals = proposalRecordsFor(env);
  return (
    {
      roadmap: { shippedSince: (since) => measured(() => shippedSince(env, since)) },
      evidence: (card) => cardEvidence((pageId) => measured(() => readNotionPage(env, pageId)), card.pageId),
      gate: serviceChangeGate({ provider, search: async (q) => (await measured(() => searchBlueprint(env, q))).rows }),
      readPath: (cellId) => measured(() => readPathOf(env, cellId)),
      readPathById: (pathId) => measured(() => readPathById(env, pathId)),
      ...(proposals ? { proposals } : {}),
      provider,
      async ownerOf(card) {
        const first = card.contributors[0];
        return first ? people.slackIdForNotionUser(first.id, first.name) : null;
      },
      placeOf: (card) => cardPlace(card, config),
      leadId: env.LEAD_USER_ID?.trim() || null,
      state: stateFor(env),
      weighed: weighedOn(env.HARNESS_KV),
      meter: { headroom: budgetHeadroom },
      now: () => Date.now(),
    }
  );
}

/**
 * The morning hand-over on `Env`.
 *
 * @param env - Worker bindings
 * @param opts - The morning run
 */
export async function runRevisionPostOnEnv(env: Env, opts: JobContext): Promise<{ summary: string }> {
  if (!env.HARNESS_KV) return { summary: "HARNESS_KV not bound — nothing handed over" };
  return handOverRevisions(
    {
      state: stateFor(env),
      ...(opts.runStorage ? { handOff: sectionHandOffIn<RevisionHanded>(opts.runStorage, UPKEEP_SECTION) } : {}),
      date: opts.runDate,
    },
    opts,
  );
}

/**
 * The revisions' section of the sweep's morning message, or undefined without
 * KV or the run's storage.
 *
 * @param env - Worker bindings
 * @param opts - The morning run
 */
export function revisionSectionFor(env: Env, opts: JobContext): SweepSection | undefined {
  if (!env.HARNESS_KV || !opts.runStorage) return undefined;
  return revisionSection(
    {
      state: stateFor(env),
      stage: (proposal) => stageRevisionCard(env, proposal),
      threads: revisionThreadsOn(env.HARNESS_KV),
      post: (channel, threadTs, text) => postLine(env, channel, threadTs, text),
      now: () => Date.now(),
    },
    sectionHandOffIn<RevisionHanded>(opts.runStorage, UPKEEP_SECTION),
    opts.runDate,
  );
}

/** Stage a revision card the Worker posted, and record it as staged. */
async function stageRevisionCard(env: Env, proposal: PendingProposal): Promise<void> {
  const { retired } = await threadStateFor(env).putProposal(proposal);
  const now = Date.now();
  await recordProposalEvents(proposalEventLogFor(env), [
    ...supersededEvents(retired, now, "worker"),
    stagedEvent({ proposal, at: now, via: "worker", channelStored: true }),
  ]);
}

/**
 * The morning's thread job (`blueprint-revision-thread`) on `Env`: the cards
 * a carousel had no room for, up in its thread.
 *
 * @param env - Worker bindings
 * @param opts - The morning run
 */
export async function runRevisionThreadOnEnv(env: Env, opts: JobContext): Promise<{ summary: string }> {
  if (!env.HARNESS_KV) return { summary: "HARNESS_KV not bound — nothing to put in a thread" };
  const store = threadStateFor(env);
  return postOverflow(
    {
      state: stateFor(env),
      async postReport(channel, threadTs, report, ttlMs) {
        const res = await postMessage(env, { channel, thread_ts: threadTs, text: report.text, blocks: report.blocks });
        if (!res.ok || !res.ts) throw new Error(`thread report not posted (${String(res.error ?? "unknown")})`);
        await store.putReport(reportRecord(channel, res.ts, report, ttlMs));
        return res.ts;
      },
      stage: (proposal) => stageRevisionCard(env, proposal),
      threads: revisionThreadsOn(env.HARNESS_KV),
      post: (channel, threadTs, text) => postLine(env, channel, threadTs, text),
      meter: { headroom: budgetHeadroom },
      date: opts.runDate,
      now: () => Date.now(),
    },
    opts,
  );
}

// ── A reply in a revision thread ─────────────────────────────────────────────

/**
 * Whether a message may correct a revision card, by its shape alone: a
 * person's reply, with text, in a thread of a channel the posting ladder
 * posts in. Reads nothing.
 *
 * @param env - Worker bindings
 * @param event - The message
 */
export function isRevisionReplyCandidate(env: Env, event: SlackMessageEvent): boolean {
  if (!env.HARNESS_KV || !event.thread_ts || event.thread_ts === event.ts || !ladderChannelsFor(env).includes(event.channel)) return false;
  if (event.bot_id || !event.user || (event.subtype && event.subtype !== "thread_broadcast")) return false;
  return !!event.text?.trim();
}

/**
 * Whether a thread holds revision cards still decidable. One KV read.
 *
 * @param env - Worker bindings
 * @param channel - The reply's channel
 * @param threadTs - The reply's thread
 */
export async function isRevisionThread(env: Env, channel: string, threadTs: string): Promise<boolean> {
  if (!env.HARNESS_KV) return false;
  const thread = await revisionThreadsOn(env.HARNESS_KV).read(channel, threadTs);
  return !!thread && thread.expiresAt > Date.now();
}

/**
 * A queued reply in a revision thread: redraft the card it corrects. Runs at
 * the head of the thread's job (`slack/message-job.ts`).
 *
 * @param env - Worker bindings
 * @param event - The message
 * @returns Whether it was a correction, handled — the turn is then skipped
 */
export async function handleRevisionReplyOnEnv(env: Env, event: SlackMessageEvent): Promise<boolean> {
  if (!isRevisionReplyCandidate(env, event)) return false;
  const store = threadStateFor(env);
  const events = proposalEventLogFor(env);
  const bot = (await getBotIdentity(env))?.userId;
  return redraftRevision(
    {
      threads: revisionThreadsOn(env.HARNESS_KV!),
      async card(key) {
        const found = await store.getProposalByTs(key);
        return found.state === "found" ? found.proposal : null;
      },
      readPath: (cellId) => measured(() => readPathOf(env, cellId)),
      provider: selectProvider(env),
      reports: store,
      async edit(channel, ts, message) {
        await updateMessage(env, { channel, ts, text: message.text, blocks: message.blocks, ...(message.metadata ? { metadata: message.metadata } : {}) });
      },
      post: (channel, threadTs, text) => postLine(env, channel, threadTs, text),
      stage: (proposal) => stageRevisionCard(env, proposal),
      async restore(proposal) {
        const { retired } = await store.putProposal(proposal);
        await recordProposalEvents(events, supersededEvents(retired, Date.now(), "worker"));
      },
      async retire(ts) {
        await store.retireProposal(ts);
      },
      clearRevising: (ts) => store.clearRevising(ts),
      superseded: (tss) => recordProposalEvents(events, supersededEvents(tss, Date.now(), "worker")),
      replan: (record) => replanRows(stateFor(env), record),
      now: () => Date.now(),
    },
    {
      channel: event.channel,
      threadTs: event.thread_ts!,
      user: event.user!,
      text: event.text ?? "",
      mentionsBot: !!bot && (event.text ?? "").includes(`<@${bot}>`),
    },
  );
}

/**
 * The milestone comparison and the offer under it on `Env`, as turn
 * dependencies; none where the blueprint is not configured. Each spends its
 * calls only when the turn still has them beside its delivery reserve.
 *
 * @param env - Worker bindings
 * @param threadState - The turn's store, which keeps the once-per-thread claim
 */
export function milestoneComparisonOn(
  env: Env,
  threadState: ThreadState,
): { milestoneComparison?: MilestoneComparison; proposalDraft?: ProposalDrafter } {
  if (!isBlueprintConfigured(env)) return {};
  return {
    proposalDraft: draftProposal({
      provider: selectProvider(env),
      affordable: () => budgetHeadroom().subrequests >= PROPOSAL_OFFER_SUBREQUESTS + DELIVERY_RESERVE,
    }),
    milestoneComparison: milestoneComparison({
      gate: serviceChangeGate({ provider: selectProvider(env), search: async (q) => (await searchBlueprint(env, q)).rows }),
      readPath: (cellId) => readPathOf(env, cellId),
      firstInThread: (ref, scenario) => threadState.claimComparison(ref, scenario),
      affordable: () => budgetHeadroom().subrequests >= COMPARISON_SUBREQUESTS + DELIVERY_RESERVE,
    }),
  };
}

/** The thread → rows records, or null without the usage database. */
export function proposalRecordsFor(env: Pick<Env, "USAGE_DB">): ProposalRecords | null {
  return env.USAGE_DB ? createD1ProposalRecords({ db: env.USAGE_DB }) : null;
}

/** The Roadmap card a thread's PRD created, one KV key a thread. */
function threadCardsOn(kv: KVNamespace): ThreadCards {
  const key = (channel: string, ts: string) => `${THREAD_CARD_PREFIX}${channel}:${ts}`;
  return {
    async cardOf(channel, ts) {
      charge(1, "kv");
      return kv.get(key(channel, ts));
    },
    async remember(channel, ts, cardId) {
      charge(1, "kv");
      await kv.put(key(channel, ts), cardId, { expirationTtl: THREAD_CARD_TTL_S });
    },
  };
}

/**
 * Keep what a decided card means for its thread's proposals (`./link.ts`):
 * what a proposal offer drew on the blueprint, and the link to the Roadmap
 * card the thread's PRD created. Nothing for any other card, a ⛔ or a write
 * that did not land. Best-effort: a failure is logged, and the rows, the PRD
 * and the thread's reply stand.
 *
 * @param env - Carries USAGE_DB and HARNESS_KV
 * @param proposal - The decided card
 * @param outcomes - What its batch ran; undefined for a ⛔
 */
export async function recordDrawnProposalFor(
  env: Env,
  proposal: PendingProposal,
  outcomes: readonly OperationOutcome[] | undefined,
): Promise<void> {
  if (!drawnProposalOf(proposal, outcomes, Date.now()) && !prdCardOf(outcomes)) return;
  const records = proposalRecordsFor(env);
  if (!records) return;
  await keepProposalLinks({ records, threadCards: env.HARNESS_KV ? threadCardsOn(env.HARNESS_KV) : null, now: () => Date.now() }, proposal, outcomes);
}

// ── A drawn proposal's removal ───────────────────────────────────────────────

/** A message's text without its @-mentions, as the removal ask is read. */
const unmentioned = (text: string | undefined) => (text ?? "").replace(/<@[A-Z0-9]+(?:\|[^>]*)?>/g, " ").trim();

/** The removal doors' ports on `Env`, or null without the usage database. */
function proposalOfferDepsFor(env: Env): OfferDeps | null {
  const records = proposalRecordsFor(env);
  if (!records) return null;
  return {
    records,
    async postCard(p, card) {
      const rendered = renderProposalCard(card);
      const sent = await postMessage(env, {
        channel: p.channel,
        thread_ts: p.replyTs,
        text: rendered.text,
        blocks: rendered.blocks ?? proposalCardBlocks(rendered.text),
      });
      return sent.ok && sent.ts ? { ts: sent.ts, text: rendered.text } : null;
    },
    stage: (proposal) => stageRevisionCard(env, proposal),
    linkOf: (p) => (p.cellIds[0] ? cellUrl(env.BLUEPRINT_APP_URL, p.cellIds[0]) : undefined),
  };
}

/**
 * Whether a message may ask to remove a proposal, by its shape alone: a
 * person's message, in a thread or a DM, that reads as a short removal ask
 * (`isRemoveRequest`). Reads nothing.
 *
 * @param env - Worker bindings
 * @param event - The message
 * @param isDm - Whether the message is in a DM, where the whole DM is one conversation
 */
export function isWithdrawRequestCandidate(env: Env, event: SlackMessageEvent, isDm: boolean): boolean {
  if (!env.USAGE_DB || !isBlueprintConfigured(env)) return false;
  if (event.bot_id || !event.user || (event.subtype && event.subtype !== "thread_broadcast")) return false;
  if (!isDm && (!event.thread_ts || event.thread_ts === event.ts)) return false;
  return isRemoveRequest(unmentioned(event.text));
}

/**
 * A removal ask in a proposal's conversation: a ✅ card for each proposal the
 * sender drew there. Runs at the head of the thread's job.
 *
 * @param env - Worker bindings
 * @param event - The message
 * @param conversation - The conversation key the proposal was recorded under
 * @returns Whether it was a removal ask, handled — the turn is then skipped
 */
export async function handleWithdrawRequestOnEnv(env: Env, event: SlackMessageEvent, conversation: string): Promise<boolean> {
  const deps = proposalOfferDepsFor(env);
  if (!deps || !event.user) return false;
  return offerRequestedRemoval(deps, { channel: event.channel, threadTs: conversation, user: event.user, text: unmentioned(event.text) });
}

/**
 * The morning's removal offers (`blueprint-proposal-offer`) on `Env`.
 *
 * @param env - Worker bindings
 * @param opts - `dryRun` posts and marks nothing
 */
export async function runProposalOffersOnEnv(env: Env, opts: JobContext): Promise<{ summary: string }> {
  if (!isBlueprintConfigured(env)) return { summary: "uno-blueprint not configured — no removal offered" };
  const deps = proposalOfferDepsFor(env);
  if (!deps) return { summary: "USAGE_DB not bound — no drawn proposals to look at" };
  return offerAgedRemovals({ ...deps, now: () => Date.now(), meter: { headroom: budgetHeadroom } }, { dryRun: opts.dryRun });
}
