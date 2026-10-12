// Dev Mode links on the registry's components (#891 § C), on named
// dependencies: uno-bot's first write into a Figma file, and so the first to go
// through Review.
//
//   • THE POST — `runDevLinksPost`: read the registry and the links the
//     components' library components already carry (one Tier 2 read per file:
//     two files hold all 68), then post ONE Review card: a named component's,
//     a batch card listing every component a run of several still has to
//     link, or a merged library PR's. Cards post where the Figma Review-card
//     setting says. Posting writes nothing to Figma.
//   • THE WRITE — `writeDevLinks`, the card's one operation past Approve:
//     read the nodes' links again, rename a Code link still under its old
//     name, add only what is still missing (a re-run or a second card never
//     doubles one), and leave one labelled comment on a component's first
//     library component the first time it gets its links — unless that
//     comment is already there. Every step re-reads what Figma has, so a write
//     may stop between any two calls and the next one carries on.
//   • THE CARRY-ON — a batch's write is more calls than one invocation holds
//     (a comment each, on Workers Free's 50). `approveDevLinks` writes what
//     this press can and hands the rest to a runner job; `runDevLinksWriteJob`
//     carries on with a fresh budget each time, and replies in the card's
//     thread once the last link is in. Nothing ends partial without a line
//     saying so.
//
// Which components a run may name, and when the 68 may run at all, is
// `./gate.ts`.
//
// PURE: `Env` enters in `./env.ts`.

import { isSubrequestBudgetError, rethrowIfBudget } from "../net";
import { FigmaRateLimitError, type FigmaClient, type FigmaDevResource } from "../figma/client";
import type { PendingProposal, ThreadState } from "../thread-state/index";
import { renderProposalCard } from "../slack/proposal-render";
import {
  decisionReport,
  itemProposal,
  markNotStaged,
  reportRecord,
  type ReportMessage,
  type ReportStore,
} from "../slack/decision-cards";
import {
  componentOfLink,
  devLinkTargets,
  linkedBefore,
  planDevLinks,
  wantedLinks,
  type DevLink,
  type DevLinkPlan,
  type DevLinkRegistry,
} from "./links";
import {
  DEV_LINKS_NOT_STAGED,
  DEV_LINKS_REVISION_REFUSAL,
  devLinksCard,
  devLinksCardWords,
  devLinksCarryOn,
  devLinksComment,
  devLinksFinished,
  devLinksGaveUp,
  devLinksItem,
  devLinksItemId,
  devLinksNotCarried,
  devLinksParent,
  devLinksStopped,
  isDevLinksComment,
  type DevLinksBatchEntry,
  type DevLinksSubject,
  type DevLinksWrite,
} from "./copy";

export type { DevLinkRegistry } from "./links";

/** How long a card stays decidable. */
export const DEV_LINKS_CARD_TTL_MS = 3 * 24 * 60 * 60 * 1000;

/** What a run is asked for. */
export type DevLinksRequest =
  | { components: readonly string[] }
  | { all: true }
  | { pr: { number: number; url: string }; components: readonly string[] };

export interface DevLinksDeps {
  /** component-registry.json, as the repo has it. */
  registry(): Promise<DevLinkRegistry>;
  figma: Pick<FigmaClient, "devResources">;
  /** `owner/name`: where the Code links point. */
  repo: string;
  /** The channel's member ids — who may decide a card — or null when Slack would not say. */
  members(): Promise<string[] | null>;
  /** Post top level. */
  post(message: ReportMessage): Promise<{ ok: boolean; ts?: string }>;
  /** Edit a posted message in place. */
  edit(ts: string, message: ReportMessage): Promise<void>;
  reports: ReportStore & Pick<ThreadState, "putReport">;
  stage(proposal: PendingProposal): Promise<void>;
  /** Cards already posted and still open, by card id: when each closes (epoch ms). */
  carded: Store<Record<string, number> | null>;
  /** What this invocation has left (`net.ts` `budgetHeadroom`); unbounded when absent. */
  headroom?(): { d1Queries: number; subrequests: number };
  channel: string;
  now(): number;
}

interface Store<T> {
  read(): Promise<T>;
  write(value: T): Promise<void>;
}

/** D1 queries the card may record: its staged event, and one it supersedes. */
const CARD_D1 = 2;
/** Subrequests the card takes: the post, its report record, the proposal and its event. */
const CARD_SUBREQUESTS = 4;

export interface DevLinksResult {
  posted: boolean;
  /** Cards staged: 0 or 1. */
  cards: number;
  summary: string;
  /** Nothing posted for a reason a later run may not meet: Figma, Slack or the post failed. */
  retry?: true;
}

/** The card's write, and what it is for. */
interface Planned {
  subject: DevLinksSubject;
  write: DevLinksWrite;
}

/** The Dev Mode links already on these nodes, read once per file. */
async function existingLinks(
  figma: Pick<FigmaClient, "devResources">,
  nodes: ReadonlyArray<{ fileKey: string; nodeId: string }>,
  spend: () => void = () => {},
): Promise<FigmaDevResource[]> {
  const byFile = new Map<string, Set<string>>();
  for (const n of nodes) byFile.set(n.fileKey, (byFile.get(n.fileKey) ?? new Set()).add(n.nodeId));
  const found: FigmaDevResource[] = [];
  for (const [fileKey, ids] of byFile) {
    spend();
    found.push(...(await figma.devResources(fileKey, [...ids])).dev_resources);
  }
  return found;
}

/** What a plan leaves on Figma: what it adds, and what it renames to. */
const changesOf = (plan: DevLinkPlan): DevLink[] => [
  ...plan.add,
  ...plan.rename.map(({ file_key, node_id, name, url }) => ({ file_key, node_id, name, url })),
];

/**
 * Post the Review card a request needs.
 *
 * @param deps - The registry, the Figma client, the channel and the store
 * @param request - One component, several or all of them (one batch card), or a merged PR's
 * @param opts - `dryRun` reads and plans, and posts and stages nothing
 */
export async function runDevLinksPost(deps: DevLinksDeps, request: DevLinksRequest, opts: { dryRun?: boolean } = {}): Promise<DevLinksResult> {
  const targets = devLinkTargets(await deps.registry(), deps.repo);
  const names = "all" in request ? [...targets.keys()] : [...new Set(request.components)];
  const unknown = names.filter((n) => !targets.has(n));
  const chosen = names.flatMap((n) => targets.get(n) ?? []);
  const notes: string[] = [];
  if (unknown.length) notes.push(`not in the registry, so no links: ${unknown.join(", ")}`);
  if (!chosen.length) return { posted: false, cards: 0, summary: notes.join("; ") || "no components asked for" };

  let existing: FigmaDevResource[];
  try {
    existing = await existingLinks(
      deps.figma,
      chosen.flatMap((t) => t.nodeIds.map((nodeId) => ({ fileKey: t.fileKey, nodeId }))),
    );
  } catch (err) {
    rethrowIfBudget(err);
    return { posted: false, cards: 0, retry: true, summary: `Figma's links unread, so nothing posted: ${err instanceof Error ? err.message : String(err)}` };
  }

  const now = deps.now();
  const carded = Object.fromEntries(Object.entries((await deps.carded.read()) ?? {}).filter(([, closes]) => closes > now));
  let planned: Planned | null = null;
  const already: string[] = [];
  const atCap: string[] = [];
  const open: string[] = [];
  if ("pr" in request) {
    const links: DevLink[] = [];
    const named: string[] = [];
    for (const t of chosen) {
      const plan = planDevLinks(wantedLinks(t, [{ kind: "pr", ...request.pr }]), existing);
      if (plan.atCap.length) atCap.push(t.component);
      if (plan.add.length) {
        links.push(...plan.add);
        named.push(t.component);
      } else if (!plan.atCap.length) already.push(t.component);
    }
    const subject: DevLinksSubject = { kind: "pr", ...request.pr, components: named };
    if (links.length && carded[devLinksItemId(subject)]) open.push(`PR #${request.pr.number}`);
    else if (links.length) planned = { subject, write: { links, introduce: [] } };
  } else {
    // A run naming one component gets that component's card; any more, one batch card.
    const single = "components" in request && chosen.length === 1;
    const write: Required<DevLinksWrite> = { links: [], introduce: [], renames: 0 };
    const entries: DevLinksBatchEntry[] = [];
    let figmaUrl = "";
    for (const t of chosen) {
      const plan = planDevLinks(wantedLinks(t, [{ kind: "code" }, { kind: "storybook" }]), existing);
      if (plan.atCap.length) atCap.push(t.component);
      const changes = changesOf(plan);
      if (!changes.length) {
        if (!plan.atCap.length) already.push(t.component);
        continue;
      }
      const own: DevLinksSubject = { kind: "component", component: t.component, figmaUrl: t.figmaUrl, storybook: t.storybook };
      if (carded[devLinksItemId(own)]) {
        open.push(t.component);
        continue;
      }
      figmaUrl ||= t.figmaUrl;
      write.links.push(...changes);
      write.renames += plan.rename.length;
      if (!linkedBefore(t.component, existing, t.nodeIds)) write.introduce.push({ file_key: t.fileKey, node_id: changes[0]!.node_id, component: t.component });
      entries.push({ component: t.component, adds: [...new Map(plan.add.map((l) => [l.name, { name: l.name, url: l.url }])).values()], renamed: plan.rename.length > 0 });
      if (single) planned = { subject: own, write };
    }
    if (!single && entries.length) {
      const subject: DevLinksSubject = { kind: "batch", figmaUrl, components: entries };
      if (carded[devLinksItemId(subject)]) open.push("the batch");
      else planned = { subject, write };
    }
  }
  if (already.length) notes.push(`already linked: ${already.join(", ")}`);
  if (atCap.length) notes.push(`at Figma's 10 links, so some held back: ${atCap.join(", ")}`);
  if (open.length) notes.push(`card already open: ${open.join(", ")}`);
  const tail = notes.length ? ` — ${notes.join("; ")}` : "";

  if (!planned) return { posted: false, cards: 0, summary: `nothing to add${tail}` };
  if (opts.dryRun) return { posted: false, cards: 0, summary: `would post 1 card for ${planned.write.links.length} link(s)${tail}` };

  const members = await deps.members();
  if (!members) return { posted: false, cards: 0, retry: true, summary: `the channel's members unread, so nothing posted${tail}` };

  // The card stages whole or not at all: a run without the budget for it
  // posts nothing, and the next run offers it.
  const room = deps.headroom?.() ?? { d1Queries: Infinity, subrequests: Infinity };
  if (room.d1Queries < CARD_D1 || room.subrequests < CARD_SUBREQUESTS) {
    return { posted: false, cards: 0, retry: true, summary: `no budget left this run, so nothing posted${tail}` };
  }

  const { subject, write } = planned;
  const report = decisionReport([devLinksItem(subject, write)], devLinksParent(subject));
  const sent = await deps.post({ text: report.text, blocks: report.blocks });
  if (!sent.ok || !sent.ts) return { posted: false, cards: 0, retry: true, summary: `the message did not post${tail}` };
  const ts = sent.ts;
  const recorded = await deps.reports.putReport(reportRecord(deps.channel, ts, report, DEV_LINKS_CARD_TTL_MS)).then(
    () => true,
    () => false,
  );
  try {
    if (!recorded) throw new Error("no report record");
    await deps.stage(stagedDevLinks(deps.channel, ts, ts, subject, write, members));
  } catch (err) {
    rethrowIfBudget(err);
    const marked = recorded ? await markNotStaged(deps.reports, ts, [devLinksItemId(subject)], DEV_LINKS_NOT_STAGED).catch(() => null) : null;
    if (marked) await deps.edit(ts, marked).catch(() => {});
    return { posted: true, cards: 0, retry: true, summary: `the card posted but did not stage${tail}` };
  }
  carded[devLinksItemId(subject)] = now + DEV_LINKS_CARD_TTL_MS;
  await deps.carded.write(carded);
  return { posted: true, cards: 1, summary: `posted 1 card for ${write.links.length} link(s)${tail}` };
}

/**
 * The card as ThreadState stages it: the one item of its message.
 *
 * @param channel - Where it posted
 * @param threadTs - The message: the thread
 * @param messageTs - The message the card is in
 * @param subject - What it is for
 * @param write - The links it adds
 * @param confirmers - Who may decide it
 */
export function stagedDevLinks(
  channel: string,
  threadTs: string,
  messageTs: string,
  subject: DevLinksSubject,
  write: DevLinksWrite,
  confirmers: readonly string[],
): PendingProposal {
  const card = devLinksCard(subject, write);
  const operations = card.operations;
  return {
    operations,
    toolName: operations[0]!.toolName,
    input: operations[0]!.input,
    channel,
    threadTs,
    replyTs: threadTs,
    ...itemProposal(messageTs, devLinksItemId(subject)),
    proposalText: renderProposalCard(card).text,
    // Nobody asked: the Worker staged it.
    requesterUserId: "",
    ttlMs: DEV_LINKS_CARD_TTL_MS,
    confirmers: [...confirmers],
    stated: devLinksCardWords(DEV_LINKS_CARD_TTL_MS / 3_600_000),
    refuseRevision: DEV_LINKS_REVISION_REFUSAL,
  };
}

const isText = (v: unknown): v is string => typeof v === "string" && v.length > 0;

/** The operation's input, checked; null when it is not one a card stages. */
function writeOf(input: Record<string, unknown>): DevLinksWrite | null {
  const { links, introduce } = input;
  if (!Array.isArray(links) || !links.length || !Array.isArray(introduce)) return null;
  const ok =
    links.every((l: Record<string, unknown>) => isText(l?.file_key) && isText(l?.node_id) && isText(l?.name) && isText(l?.url)) &&
    introduce.every((i: Record<string, unknown>) => isText(i?.file_key) && isText(i?.node_id) && isText(i?.component));
  return ok ? { links: links as DevLink[], introduce: introduce as DevLinksWrite["introduce"] } : null;
}

/** Links one add call carries. */
const ADD_CHUNK = 50;

/** Thrown when a step has spent its calls: the next step carries on. */
const SPENT = Symbol("spent");

/** One step of a write, as it came back. */
interface WriteStep {
  added: number;
  renamed: number;
  already: number;
  commented: string[];
  /** The step spent its calls before the write was done. */
  left: boolean;
  problems: string[];
  notes: string[];
  /** Once done: what the card's write left on Figma. */
  total: { links: number; components: number; comments: number };
}

/**
 * One step of a card's write, within `calls` Figma calls. Every step
 * re-reads what Figma has, so it may stop between any two calls.
 */
async function writeStep(
  figma: Pick<FigmaClient, "devResources" | "addDevResources" | "updateDevResources" | "comments" | "postComment">,
  write: DevLinksWrite,
  calls: number,
): Promise<WriteStep> {
  let room = calls;
  const spend = () => {
    if (room < 1) throw SPENT;
    room -= 1;
  };
  const step: WriteStep = { added: 0, renamed: 0, already: 0, commented: [], left: false, problems: [], notes: [], total: { links: 0, components: 0, comments: 0 } };
  try {
    const existing = await existingLinks(
      figma,
      write.links.map((l) => ({ fileKey: l.file_key, nodeId: l.node_id })),
      spend,
    );
    const plan = planDevLinks(write.links, existing);
    step.already = plan.present.length;
    const landed = new Set([...plan.present, ...plan.rename].map((l) => `${l.file_key}|${l.node_id}|${componentOfLink(l.name)}`));

    if (plan.rename.length) {
      spend();
      const updated = await figma.updateDevResources(plan.rename.map(({ id, name, url }) => ({ id, name, url })));
      step.renamed = updated.links_updated.length;
      step.problems.push(...updated.errors.map((e) => e.error));
    }
    for (let i = 0; i < plan.add.length; i += ADD_CHUNK) {
      spend();
      const created = await figma.addDevResources(plan.add.slice(i, i + ADD_CHUNK));
      step.added += created.links_created.length;
      for (const r of created.links_created) landed.add(`${r.file_key}|${r.node_id}|${componentOfLink(r.name)}`);
      step.problems.push(...created.errors.map((e) => e.error));
    }
    if (plan.atCap.length) step.problems.push(`${plan.atCap.length} link(s) held back: the component already has Figma's 10`);

    // A component's comment goes on once its links are on its first library
    // component, and only if it is not there already.
    const due = write.introduce.filter((i) => landed.has(`${i.file_key}|${i.node_id}|${i.component}`));
    let comments = 0;
    for (const fileKey of new Set(due.map((i) => i.file_key))) {
      spend();
      const there = (await figma.comments(fileKey)).comments;
      for (const i of due.filter((d) => d.file_key === fileKey)) {
        if (there.some((c) => isDevLinksComment(c.message, i.component))) {
          comments += 1;
          continue;
        }
        spend();
        try {
          await figma.postComment(i.file_key, devLinksComment(i.component), { node_id: i.node_id, node_offset: { x: 0, y: 0 } });
          step.commented.push(i.component);
          comments += 1;
        } catch (err) {
          rethrowIfBudget(err);
          if (err instanceof FigmaRateLimitError) throw err;
          step.notes.push(`the comment on ${i.component} did not post: ${err instanceof Error ? err.message : String(err)}`);
        }
      }
    }
    step.total = {
      links: plan.present.length + step.renamed + step.added,
      components: new Set(write.links.map((l) => componentOfLink(l.name))).size,
      comments,
    };
  } catch (err) {
    if (err !== SPENT) throw err;
    step.left = true;
  }
  return step;
}

/** A step as the executor's JSON result. */
function resultOf(step: WriteStep, extra: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    ok: step.problems.length === 0,
    added: step.added,
    renamed: step.renamed,
    already: step.already,
    commented: step.commented,
    ...(step.left ? { left: true } : {}),
    ...(step.problems.length ? { error: step.problems.join("; ") } : {}),
    ...(step.notes.length ? { notes: step.notes } : {}),
    ...extra,
  };
}

const NOT_A_CARD = JSON.stringify({ ok: false, error: "a Dev Mode links card needs links and introduce" });

/**
 * A card's write — renames, adds and the first-time comment — within `calls`
 * Figma calls when given. `left: true` says it stopped there; calling it again
 * carries on, and a finished write called again adds nothing.
 *
 * @param figma - The one Figma client
 * @param input - The operation's input: `links` and `introduce`
 * @param opts - `calls`: the most Figma calls this step may make
 * @returns The executor's JSON result
 */
export async function writeDevLinks(
  figma: Pick<FigmaClient, "devResources" | "addDevResources" | "updateDevResources" | "comments" | "postComment">,
  input: Record<string, unknown>,
  opts: { calls?: number } = {},
): Promise<string> {
  const write = writeOf(input);
  if (!write) return NOT_A_CARD;
  return JSON.stringify(resultOf(await writeStep(figma, write, opts.calls ?? Infinity)));
}

/** The rest of an approved write, waiting for a fresh budget. */
export interface DevLinksWriteJob {
  kind: "figma-dev-links-write";
  input: Record<string, unknown>;
  channel: string;
  /** Where the finishing reply goes: the card's message. */
  threadTs?: string;
  /** When Approve handed it on, epoch ms. */
  since: number;
}

/**
 * Approve on a card: write what this press can, and hand the rest to a
 * runner job, saying so. The body of the card's one operation (`DEV_LINKS_TOOL`).
 *
 * @param deps - The Figma client, the calls this press may make, and the hand-off
 * @param input - The operation's input
 * @param where - The card's channel, and the message to reply under
 * @returns The executor's JSON result
 */
export async function approveDevLinks(
  deps: {
    figma: Parameters<typeof writeDevLinks>[0];
    calls: number;
    handOff(job: DevLinksWriteJob): Promise<void>;
    now(): number;
  },
  input: Record<string, unknown>,
  where: { channel: string; replyTs?: string; threadTs?: string },
): Promise<string> {
  const write = writeOf(input);
  if (!write) return NOT_A_CARD;
  const step = await writeStep(deps.figma, write, Math.max(0, deps.calls));
  if (!step.left) return JSON.stringify(resultOf(step));
  const threadTs = where.replyTs ?? where.threadTs;
  try {
    await deps.handOff({ kind: "figma-dev-links-write", input, channel: where.channel, ...(threadTs ? { threadTs } : {}), since: deps.now() });
  } catch (err) {
    rethrowIfBudget(err);
    return JSON.stringify({ ...resultOf(step), ok: false, error: devLinksNotCarried(err instanceof Error ? err.message : String(err)) });
  }
  return JSON.stringify(resultOf(step, { message: devLinksCarryOn(step.added, step.renamed) }));
}

/** How long a handed-on write may keep coming back. */
const CARRY_ON_FOR_MS = 24 * 60 * 60 * 1000;

/**
 * The runner job: one more step of a handed-on write, with this invocation's
 * budget. `deferred` brings it back with a fresh one; once the last link is in
 * it replies in the card's thread.
 *
 * @param deps - The Figma client, the calls this invocation may make, and the reply
 * @param job - The handed-on write
 */
export async function runDevLinksWriteJob(
  deps: {
    figma: Parameters<typeof writeDevLinks>[0];
    calls(): number;
    reply(text: string): Promise<void>;
    now(): number;
  },
  job: DevLinksWriteJob,
): Promise<"handled" | "deferred"> {
  if (deps.now() - job.since > CARRY_ON_FOR_MS) {
    await deps.reply(devLinksGaveUp());
    return "handled";
  }
  const write = writeOf(job.input);
  if (!write) return "handled";
  let step: WriteStep;
  try {
    step = await writeStep(deps.figma, write, Math.max(0, deps.calls()));
  } catch (err) {
    if (isSubrequestBudgetError(err) || err instanceof FigmaRateLimitError) return "deferred";
    await deps.reply(devLinksStopped(err instanceof Error ? err.message : String(err)));
    return "handled";
  }
  if (step.left) return "deferred";
  const problems = [...step.problems, ...step.notes];
  await deps.reply(devLinksFinished(step.total, problems.length ? problems.join("; ") : undefined));
  return "handled";
}
