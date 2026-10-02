// The Figma library's two morning jobs, bound to `Env` — the only file in the
// folder that names it. The post reads the registry from GitHub and the
// channel's members from Slack, posts the card, and stages it in ThreadState;
// the tracker reads GitHub and posts in the card's thread, and files and closes
// a card nobody decided. Findings and the tracked cards are JSON in HARNESS_KV
// beside the poll's snapshot.
//
// The repo is `GITHUB_REPO`, the harness repo: the registry lives there, the
// intake is filed there (`github_issue_create` with no `repo`), and
// `figma-implement.yml` opens its PR there.

import type { Env } from "../types";
import { conversationsMembers, getPermalink, postMessage, updateMessage } from "../slack/api";
import { proposalCardBlocks } from "../slack/proposal-render";
import { threadStateFor } from "../thread-state/production";
import { recordProposalEvents, stagedEvent, supersededEvents } from "../usage/index";
import { proposalEventLogFor } from "../usage/production";
import { githubIssueClient, githubIssueUpdateClient, githubLibraryReads, resolveRepoFor } from "../integrations/github";
import { INTAKE_LABELS, renderIssueBody } from "../tools/github-issue-render";
import { FINDINGS_KV_KEY, kvJson } from "../figma-poll";
import type { ComponentRegistry, LibraryChangeSet } from "./draft";
import { LIBRARY_CARD_TTL_MS, postLibraryFindings, type PostResult } from "./post";
import { windowInWords } from "../slack/copy-words";
import { rethrowIfBudget } from "../net";
import { trackLibraryIntakes, type TrackedPublish, type TrackResult } from "./track";

export const TRACKED_KV_KEY = "figma-poll:tracked";
/** Edits announced as "edited, not published", waiting for the next publish. */
const UNPUBLISHED_KV_KEY = "figma-poll:unpublished";
/** Who an expired card's intake was filed for, as its footer says it. */
const EXPIRED_REQUESTER = `the #plus-universal library card, after ${windowInWords(LIBRARY_CARD_TTL_MS / 3_600_000)} with no decision`;
export const REGISTRY_PATH = "design-system/figma/component-registry.json";
/** Pages of 200 members — a channel of up to 600 people. */
const MEMBER_PAGES = 3;

/**
 * A channel's member ids, or null when Slack would not say — or when there are
 * more than the pages read, since a card must not quietly leave out anyone who
 * may decide it. The design-ops team is whoever is in #plus-universal.
 *
 * @param env - Worker bindings
 * @param channel - The channel
 */
export async function channelMembers(env: Env, channel: string): Promise<string[] | null> {
  const ids: string[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < MEMBER_PAGES; page++) {
    const res = await conversationsMembers(env, channel, 200, cursor).catch(() => null);
    if (!res?.ok) return null;
    ids.push(...(res.members ?? []));
    cursor = res.response_metadata?.next_cursor || undefined;
    if (!cursor) return ids;
  }
  console.error(`[figma-library] ${channel} has more than ${MEMBER_PAGES * 200} members`);
  return null;
}

function trackedStore(env: Env) {
  return kvJson<TrackedPublish[]>(env, TRACKED_KV_KEY, []);
}

/**
 * The post job on `Env`.
 * @param env - Worker bindings
 * @param opts - `dryRun` posts, stages and writes nothing
 */
export async function runLibraryPost(env: Env, opts: { dryRun: boolean }): Promise<PostResult> {
  const channel = env.PLUS_UNIVERSAL_CHANNEL_ID?.trim();
  if (!channel) return { posted: 0, pending: 0, summary: "PLUS_UNIVERSAL_CHANNEL_ID not set — nothing posted" };
  const target = resolveRepoFor(env, undefined);
  return postLibraryFindings(
    {
      findings: kvJson<LibraryChangeSet[]>(env, FINDINGS_KV_KEY, []),
      tracked: trackedStore(env),
      unpublished: kvJson<LibraryChangeSet | null>(env, UNPUBLISHED_KV_KEY, null),
      async registry() {
        if (!target.ok) return null;
        try {
          const parsed = JSON.parse(await githubLibraryReads(env, target.entry).rawFile(REGISTRY_PATH)) as ComponentRegistry;
          return parsed && typeof parsed.components === "object" ? parsed : null;
        } catch (err) {
          console.warn(`[figma-library] registry unread: ${err instanceof Error ? err.message : String(err)}`);
          return null;
        }
      },
      members: () => channelMembers(env, channel),
      async post(message) {
        const res = await postMessage(env, { channel, text: message.text, blocks: message.blocks });
        return res.ok && res.ts ? { ok: true, ts: res.ts } : { ok: false };
      },
      async reply(ts, text) {
        const res = await postMessage(env, { channel, thread_ts: ts, text });
        if (!res.ok) throw new Error(res.error ?? "chat.postMessage failed");
      },
      async stage(proposal) {
        const { retired } = await threadStateFor(env).putProposal(proposal);
        // On the usage record like any card, staged by the Worker itself.
        await recordProposalEvents(proposalEventLogFor(env), [
          ...supersededEvents(retired, Date.now(), "worker"),
          // Always a channel card (#plus-universal).
          stagedEvent({ proposal, at: Date.now(), via: "worker", channelStored: true }),
        ]);
      },
      channel,
      now: () => Date.now(),
    },
    opts,
  );
}

/**
 * The tracker job on `Env`.
 * @param env - Worker bindings
 * @param opts - `dryRun` comments, closes, posts and writes nothing
 */
export async function runLibraryTrack(env: Env, opts: { dryRun: boolean }): Promise<TrackResult> {
  const target = resolveRepoFor(env, undefined);
  if (!target.ok) {
    return { linked: 0, closed: 0, dropped: 0, expired: 0, remaining: 0, summary: `no repo: ${target.error}` };
  }
  const reads = githubLibraryReads(env, target.entry);
  const writes = githubIssueUpdateClient(env, target.entry);
  const issues = githubIssueClient(env, target.entry);
  return trackLibraryIntakes(
    {
      tracked: trackedStore(env),
      github: {
        recentIntakes: (since) => reads.recentIntakes(since),
        recentPulls: () => reads.recentPulls(),
        pull: (number) => reads.pull(number),
        comment: async (issue, body) => {
          await writes.comment(issue, body);
        },
        close: (issue) => writes.setState(issue, "closed", "completed"),
        intakesSince: (since) => reads.intakesSince(since),
        // The ✅ path's filing, minus the ✅: the same labels, and the same
        // footer naming where it came from.
        async fileIntake(draft, card) {
          const permalink = await getPermalink(env, card.channel, card.ts).catch((err: unknown) => {
            rethrowIfBudget(err);
            return null;
          });
          return issues.createIssue({
            title: draft.title,
            body: renderIssueBody(draft, { requester: EXPIRED_REQUESTER, permalink }),
            labels: INTAKE_LABELS,
          });
        },
      },
      async postToThread(channel, ts, text) {
        await postMessage(env, { channel, thread_ts: ts, text });
      },
      async closeCard(channel, ts, text, note) {
        const res = await updateMessage(env, { channel, ts, text: `${text}\n${note}`, blocks: proposalCardBlocks(text, note) });
        if (!res.ok) throw new Error(res.error ?? "chat.update failed");
      },
      now: () => Date.now(),
    },
    opts,
  );
}
