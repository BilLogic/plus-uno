// Dev Mode links on the registry's components (#891 § C), on named
// dependencies: uno-bot's first write into a Figma file, and so the first to go
// through Review.
//
//   • THE POST — `runDevLinksPost`: read the registry and the links the
//     components' library components already carry (one Tier 2 read per file:
//     two files hold all 68), then post one Review card per component that
//     still lacks a link — or, for a merged library PR, one card that adds the
//     PR's link to every component it names. Cards post where the Figma
//     Review-card setting says; a run with more than ten posts the rest in the
//     first message's thread, ten to a reply. Posting writes nothing to Figma.
//   • THE WRITE — `writeDevLinks`, the card's one operation past Approve:
//     read the nodes' links again, add only what is still missing (a re-run
//     or a second card never doubles one), and leave one labelled comment on
//     a component's first library component the first time it gets its links.
//
// Which components a run may name, and when the 68 may run at all, is
// `./gate.ts`.
//
// PURE: `Env` enters in `./env.ts`.

import { rethrowIfBudget } from "../net";
import type { FigmaClient, FigmaDevResource } from "../figma/client";
import type { PendingProposal, ThreadState } from "../thread-state/index";
import { renderProposalCard } from "../slack/proposal-render";
import {
  decisionReport,
  itemProposal,
  markNotStaged,
  MAX_REPORT_ITEMS,
  reportRecord,
  type ReportMessage,
  type ReportStore,
} from "../slack/decision-cards";
import {
  devLinkTargets,
  linkedBefore,
  planDevLinks,
  wantedLinks,
  type DevLink,
  type DevLinkRegistry,
  type DevLinkTarget,
} from "./links";
import {
  DEV_LINKS_NOT_STAGED,
  DEV_LINKS_REVISION_REFUSAL,
  devLinksBatchLine,
  devLinksCard,
  devLinksCardWords,
  devLinksComment,
  devLinksItem,
  devLinksItemId,
  devLinksParent,
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
  /** Post top level, or in a thread. */
  post(message: ReportMessage, threadTs?: string): Promise<{ ok: boolean; ts?: string }>;
  /** Edit a posted message in place. */
  edit(ts: string, message: ReportMessage): Promise<void>;
  reports: ReportStore & Pick<ThreadState, "putReport">;
  stage(proposal: PendingProposal): Promise<void>;
  /** Mark the first message's thread, so replies there are not all turns. */
  markThread(ts: string): Promise<void>;
  channel: string;
}

export interface DevLinksResult {
  posted: boolean;
  /** Cards staged. */
  cards: number;
  summary: string;
  /** Nothing posted for a reason a later run may not meet: Figma, Slack or the post failed. */
  retry?: true;
}

/** One card's write, and what it is for. */
interface Planned {
  subject: DevLinksSubject;
  write: DevLinksWrite;
}

/** The Dev Mode links already on these targets' library components, by file. */
async function existingLinks(figma: DevLinksDeps["figma"], targets: readonly DevLinkTarget[]): Promise<FigmaDevResource[]> {
  const byFile = new Map<string, Set<string>>();
  for (const t of targets) byFile.set(t.fileKey, new Set([...(byFile.get(t.fileKey) ?? []), ...t.nodeIds]));
  const found: FigmaDevResource[] = [];
  for (const [fileKey, ids] of byFile) found.push(...(await figma.devResources(fileKey, [...ids])).dev_resources);
  return found;
}

/**
 * Post the Review cards a request needs.
 *
 * @param deps - The registry, the Figma client, the channel and the store
 * @param request - Named components, all of them, or a merged PR's
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
    existing = await existingLinks(deps.figma, chosen);
  } catch (err) {
    rethrowIfBudget(err);
    return { posted: false, cards: 0, retry: true, summary: `Figma's links unread, so nothing posted: ${err instanceof Error ? err.message : String(err)}` };
  }

  const planned: Planned[] = [];
  const already: string[] = [];
  const full: string[] = [];
  if ("pr" in request) {
    const links: DevLink[] = [];
    const named: string[] = [];
    for (const t of chosen) {
      const plan = planDevLinks(wantedLinks(t, [{ kind: "pr", ...request.pr }]), existing);
      if (plan.full.length) full.push(t.component);
      if (plan.add.length) {
        links.push(...plan.add);
        named.push(t.component);
      } else if (!plan.full.length) already.push(t.component);
    }
    if (links.length) planned.push({ subject: { kind: "pr", ...request.pr, components: named }, write: { links, introduce: [] } });
  } else {
    for (const t of chosen) {
      const plan = planDevLinks(wantedLinks(t, [{ kind: "code" }, { kind: "storybook" }]), existing);
      if (plan.full.length) full.push(t.component);
      if (!plan.add.length) {
        if (!plan.full.length) already.push(t.component);
        continue;
      }
      const introduce = linkedBefore(t.component, existing, t.nodeIds) ? [] : [{ file_key: t.fileKey, node_id: plan.add[0]!.node_id, component: t.component }];
      planned.push({
        subject: { kind: "component", component: t.component, figmaUrl: t.figmaUrl, storybook: t.storybook },
        write: { links: plan.add, introduce },
      });
    }
  }
  if (already.length) notes.push(`already linked: ${already.join(", ")}`);
  if (full.length) notes.push(`at Figma's 10 links, so some held back: ${full.join(", ")}`);
  const tail = notes.length ? ` — ${notes.join("; ")}` : "";

  if (!planned.length) return { posted: false, cards: 0, summary: `nothing to add${tail}` };
  if (opts.dryRun) return { posted: false, cards: 0, summary: `would post ${planned.length} card(s)${tail}` };

  const members = await deps.members();
  if (!members) return { posted: false, cards: 0, retry: true, summary: `the channel's members unread, so nothing posted${tail}` };

  const chunks: Planned[][] = [];
  for (let i = 0; i < planned.length; i += MAX_REPORT_ITEMS) chunks.push(planned.slice(i, i + MAX_REPORT_ITEMS));
  const subjects = planned.map((p) => p.subject);
  let threadTs: string | undefined;
  let staged = 0;
  for (const [n, chunk] of chunks.entries()) {
    const line = n === 0 ? devLinksParent(subjects, chunk.length) : devLinksBatchLine(n * MAX_REPORT_ITEMS + 1, n * MAX_REPORT_ITEMS + chunk.length, planned.length);
    const report = decisionReport(
      chunk.map((p) => devLinksItem(p.subject, p.write)),
      line,
    );
    const sent = await deps.post({ text: report.text, blocks: report.blocks }, threadTs);
    if (!sent.ok || !sent.ts) {
      if (n === 0) return { posted: false, cards: 0, retry: true, summary: `the first message did not post${tail}` };
      continue;
    }
    const ts = sent.ts;
    if (n === 0) {
      threadTs = ts;
      if (chunks.length > 1) await deps.markThread(ts).catch((err: unknown) => rethrowIfBudget(err));
    }
    const recorded = await deps.reports.putReport(reportRecord(deps.channel, ts, report, DEV_LINKS_CARD_TTL_MS)).then(
      () => true,
      () => false,
    );
    const failed: string[] = [];
    for (const p of chunk) {
      try {
        if (!recorded) throw new Error("no report record");
        await deps.stage(stagedDevLinks(deps.channel, threadTs ?? ts, ts, p.subject, p.write, members));
        staged += 1;
      } catch (err) {
        rethrowIfBudget(err);
        failed.push(devLinksItemId(p.subject));
      }
    }
    if (failed.length) {
      const marked = recorded ? await markNotStaged(deps.reports, ts, failed, DEV_LINKS_NOT_STAGED).catch(() => null) : null;
      if (marked) await deps.edit(ts, marked).catch(() => {});
    }
  }
  return { posted: true, cards: staged, summary: `posted ${staged} card(s)${tail}` };
}

/**
 * One card as ThreadState stages it: one item of its message.
 *
 * @param channel - Where it posted
 * @param threadTs - The first message: the thread
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
  return ok ? (input as unknown as DevLinksWrite) : null;
}

/**
 * Approve on a card: add its links that are still missing, then the first
 * time a component gets its links, one labelled comment on its first library
 * component. The body of the card's one operation (`DEV_LINKS_TOOL`).
 *
 * @param figma - The one Figma client
 * @param input - The operation's input: `links` and `introduce`
 * @returns The executor's JSON result
 */
export async function writeDevLinks(
  figma: Pick<FigmaClient, "devResources" | "addDevResources" | "postComment">,
  input: Record<string, unknown>,
): Promise<string> {
  const write = writeOf(input);
  if (!write) return JSON.stringify({ ok: false, error: "a Dev Mode links card needs links and introduce" });

  const byFile = new Map<string, Set<string>>();
  for (const l of write.links) byFile.set(l.file_key, new Set([...(byFile.get(l.file_key) ?? []), l.node_id]));
  const existing: FigmaDevResource[] = [];
  for (const [fileKey, ids] of byFile) existing.push(...(await figma.devResources(fileKey, [...ids])).dev_resources);

  const plan = planDevLinks(write.links, existing);
  const created = plan.add.length ? await figma.addDevResources(plan.add) : { links_created: [], errors: [] };

  const commented: string[] = [];
  const notes: string[] = [];
  for (const i of write.introduce) {
    const nodes = write.links.filter((l) => l.file_key === i.file_key).map((l) => l.node_id);
    const own = existing.filter((r) => r.file_key === i.file_key);
    if (linkedBefore(i.component, own, nodes)) continue;
    if (!created.links_created.some((r) => r.file_key === i.file_key && nodes.includes(r.node_id))) continue;
    try {
      await figma.postComment(i.file_key, devLinksComment(i.component), { node_id: i.node_id, node_offset: { x: 0, y: 0 } });
      commented.push(i.component);
    } catch (err) {
      rethrowIfBudget(err);
      notes.push(`the comment on ${i.component} did not post: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  const refused = created.errors.map((e) => e.error);
  const held = plan.full.length ? [`${plan.full.length} link(s) held back: the component already has Figma's 10`] : [];
  const problems = [...refused, ...held];
  return JSON.stringify({
    ok: problems.length === 0,
    added: created.links_created.length,
    already: plan.present.length,
    commented,
    ...(problems.length ? { error: problems.join("; ") } : {}),
    ...(notes.length ? { notes } : {}),
  });
}
