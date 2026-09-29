// A Figma library publish, end to end on fakes: the end-of-day poll finds it,
// the morning post drafts one intake and one #plus-universal card, the Gate
// resolves that card for the channel's members only, and the tracker links
// the implementation PR back and closes the intake on merge.
//
// The Figma side is a recorded /components + /versions pair, run through the
// same parsers the Worker uses (`componentsFrom`, `versionsFrom`), so the diff
// is the real one. Slack, GitHub and KV are the jobs' named dependencies.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  componentsFrom,
  pollFigmaLibrary,
  versionsFrom,
  type FigmaComponentsResponse,
  type FigmaVersionsResponse,
  type PollDeps,
  type Snapshot,
} from "../src/figma-poll";
import { draftPublishIntake, type ComponentRegistry, type LibraryChangeSet } from "../src/figma-library/draft";
import { LIBRARY_CARD_TTL_MS, postLibraryFindings, type PostDeps } from "../src/figma-library/post";
import { implementPrTitle, trackLibraryIntakes, type TrackDeps, type TrackedPublish } from "../src/figma-library/track";
import { resolveSignal, type GateSignal } from "../src/gate/index";
import { createInMemoryThreadState, type PendingProposal } from "../src/thread-state/index";
import { implementPayload } from "../src/tools/implement";

const FILE_KEY = "zAecJNRdvJzAUOcjV32tRX";
const CHANNEL = "C072E8SFLKV";
const MEMBERS = ["U0MEMBER1", "U0MEMBER2"];
const OUTSIDER = "U0OUTSIDE";

// ── The recording ────────────────────────────────────────────────────────────

const variant = (key: string, name: string, node: string, set: string, setNode: string, description = "") => ({
  key,
  name,
  description,
  node_id: node,
  containing_frame: { name: "Page frame", nodeId: "1:1", containingComponentSet: { name: set, nodeId: setNode } },
});

/** Yesterday's library: two Accordion variants, one Badge, one Tooltip. */
const BEFORE: FigmaComponentsResponse = {
  meta: {
    components: [
      variant("k-acc-1", "State=Collapsed", "10:1", "accordion", "13667:6004"),
      variant("k-acc-2", "State=Expanded", "10:2", "accordion", "13667:6004"),
      variant("k-badge-1", "Size=sm", "20:1", "badge", "200:1"),
      variant("k-tip-1", "Placement=top", "30:1", "tooltip", "300:1"),
    ],
  },
};

/** Today's: an Accordion variant renamed, a Badge variant added, a new
 *  Sparkline set nobody has mapped, and the Tooltip unchanged. */
const AFTER: FigmaComponentsResponse = {
  meta: {
    components: [
      variant("k-acc-1", "State=Closed", "10:1", "accordion", "13667:6004"),
      variant("k-acc-2", "State=Expanded", "10:2", "accordion", "13667:6004"),
      variant("k-badge-1", "Size=sm", "20:1", "badge", "200:1"),
      variant("k-badge-2", "Size=lg", "20:2", "badge", "200:1"),
      variant("k-spark-1", "Trend=up", "40:1", "sparkline", "400:1"),
      variant("k-tip-1", "Placement=top", "30:1", "tooltip", "300:1"),
      // An internal helper the ignore list drops.
      variant("k-helper", "_scratch", "90:1", "_scratch", "900:1"),
    ],
  },
};

const VERSIONS: FigmaVersionsResponse = {
  versions: [
    { id: "2210000000000000002", label: "Badge sizes + accordion copy", description: "Adds lg badge", created_at: "2026-09-29T20:10:00Z", user: { handle: "coco" } },
    { id: "2210000000000000003", label: null, description: null, created_at: "2026-09-29T19:00:00Z", user: { handle: "autosave" } },
    { id: "2210000000000000001", label: "Previous publish", description: "", created_at: "2026-09-20T12:00:00Z", user: { handle: "bill" } },
  ],
};

const REGISTRY: ComponentRegistry = {
  components: {
    Accordion: {
      code: { mdxPath: "design-system/src/components/layout-and-structure/Accordion/Accordion.mdx" },
      figma: { sets: [{ name: "accordion", componentSetNodeId: "13667:6004", url: "https://www.figma.com/design/x?node-id=13667-6004" }] },
    },
    Badge: {
      code: { mdxPath: "design-system/src/components/status-and-loading/Badge/Badge.mdx" },
      figma: { sets: [{ name: "badge", componentSetNodeId: "200:1" }] },
    },
    Tooltip: {
      code: { mdxPath: "design-system/src/components/messaging/Tooltip/Tooltip.mdx" },
      figma: { sets: [{ name: "tooltip", componentSetNodeId: "300:1" }] },
    },
  },
};

function kv<T>(initial: T) {
  let value = structuredClone(initial);
  const writes: T[] = [];
  return {
    async read() {
      return structuredClone(value);
    },
    async write(next: T) {
      value = structuredClone(next);
      writes.push(structuredClone(next));
    },
    get value() {
      return value;
    },
    writes,
  };
}

function pollDeps(today: FigmaComponentsResponse, findings = kv<LibraryChangeSet[]>([])) {
  const yesterday: Snapshot = {
    lastChecked: "2026-09-28T22:00:00Z",
    components: componentsFrom(BEFORE),
    versionIds: ["2210000000000000001"],
    nodeHashes: {},
  };
  const snapshot = kv<Snapshot | null>(yesterday);
  const deps: PollDeps = {
    figma: {
      components: async () => componentsFrom(today),
      versions: async () => versionsFrom(VERSIONS),
      nodeHashes: async () => ({}),
    },
    snapshot,
    findings,
    fileKey: FILE_KEY,
    now: () => Date.UTC(2026, 8, 29, 22, 0),
  };
  return { deps, snapshot, findings };
}

/** The morning post on fakes, staging into a real in-memory ThreadState. */
function postDeps(findings: LibraryChangeSet[]) {
  const threadState = createInMemoryThreadState({ now: () => Date.UTC(2026, 8, 30, 14, 0) });
  const posts: Array<{ text: string; blocks: unknown[] }> = [];
  const staged: PendingProposal[] = [];
  const store = { findings: kv(findings), tracked: kv<TrackedPublish[]>([]) };
  const deps: PostDeps = {
    ...store,
    registry: async () => REGISTRY,
    members: async () => MEMBERS,
    async post(message) {
      posts.push(message);
      return { ok: true, ts: `1790000000.00000${posts.length}` };
    },
    async stage(proposal) {
      staged.push(proposal);
      await threadState.putProposal(proposal);
    },
    channel: CHANNEL,
    now: () => Date.UTC(2026, 8, 30, 14, 0),
  };
  return { deps, posts, staged, threadState, store };
}

async function foundPublish(): Promise<LibraryChangeSet> {
  const { deps, findings } = pollDeps(AFTER);
  await pollFigmaLibrary(deps);
  assert.equal(findings.value.length, 1);
  return findings.value[0]!;
}

// ── The poll ─────────────────────────────────────────────────────────────────

describe("the end-of-day poll", () => {
  it("turns one publish touching three components into one change set, and advances the snapshot", async () => {
    const { deps, snapshot, findings } = pollDeps(AFTER);
    const result = await pollFigmaLibrary(deps);
    assert.equal(findings.value.length, 1);
    const [changeSet] = findings.value;
    assert.deepEqual(changeSet!.versions.map((v) => [v.id, v.user]), [["2210000000000000002", "coco"]]);
    assert.deepEqual(changeSet!.created.map((c) => c.name).sort(), ["Size=lg", "Trend=up"]);
    assert.deepEqual(changeSet!.modified.map((c) => c.name), ["State=Closed"]);
    assert.deepEqual(changeSet!.deleted, []);
    assert.deepEqual(result.pending, 1);
    assert.deepEqual(snapshot.value?.versionIds, ["2210000000000000002", "2210000000000000001"]);
  });

  it("finds nothing on a quiet day, and posts nothing the next morning", async () => {
    const { deps, findings } = pollDeps(BEFORE);
    // Same components, and the only new version is the one already known.
    deps.figma.versions = async () => versionsFrom({ versions: [VERSIONS.versions![2]!] });
    const result = await pollFigmaLibrary(deps);
    assert.equal(result.summary, "no changes since last check");
    assert.deepEqual(findings.writes, []);

    const morning = postDeps(findings.value);
    const posted = await postLibraryFindings(morning.deps);
    assert.equal(posted.posted, 0);
    assert.deepEqual(morning.posts, []);
    assert.deepEqual(morning.staged, []);
  });

  it("writes nothing on a dry run", async () => {
    const { deps, snapshot, findings } = pollDeps(AFTER);
    await pollFigmaLibrary(deps, { dryRun: true });
    assert.deepEqual(findings.writes, []);
    assert.deepEqual(snapshot.writes, []);
  });
});

// ── The draft ────────────────────────────────────────────────────────────────

describe("the drafted intake", () => {
  it("lists every changed component with its Figma link, code and proposed change", async () => {
    const intake = draftPublishIntake(await foundPublish(), REGISTRY);
    assert.deepEqual(intake.rows.map((r) => [r.figmaName, r.code?.name ?? null]), [
      ["accordion", "Accordion"],
      ["badge", "Badge"],
      ["sparkline", null],
    ]);
    assert.match(intake.body, /\| Accordion \| \[accordion\]\(https:\/\/www\.figma\.com\/design\/x\?node-id=13667-6004\) \| `design-system\/src\/components\/layout-and-structure\/Accordion\/` \| modified: 1 variant \|/);
    assert.match(intake.body, /Add the new variant\(s\) Size=lg to `Badge`/);
    assert.ok(intake.body.startsWith(intake.marker));
    assert.equal(intake.title, "Figma library publish: Badge sizes + accordion copy — 3 components");
    // The Tooltip did not change, so it is nowhere in the intake.
    assert.doesNotMatch(intake.body, /Tooltip/);
  });

  it("lists a registry miss as 'no code mapping' and invents nothing for it", async () => {
    const intake = draftPublishIntake(await foundPublish(), REGISTRY);
    const miss = intake.rows.find((r) => r.figmaName === "sparkline")!;
    assert.equal(miss.code, null);
    assert.match(intake.body, /\| sparkline \| \[sparkline\]\(https:\/\/www\.figma\.com\/design\/zAecJNRdvJzAUOcjV32tRX\?node-id=400-1\) \| no code mapping \| new: 1 variant \|/);
    assert.match(miss.proposal, /^no code mapping: .* no change is drafted/);
    assert.doesNotMatch(intake.body, /Sparkline\//);
    assert.deepEqual(intake.implement, ["Accordion", "Badge"]);
    assert.deepEqual(intake.unmapped, ["sparkline"]);
  });
});

// ── The morning post ─────────────────────────────────────────────────────────

describe("the morning post", () => {
  it("posts one #plus-universal message whose card files one intake and one dispatch", async () => {
    const morning = postDeps([await foundPublish()]);
    const result = await postLibraryFindings(morning.deps);
    assert.equal(result.posted, 1);
    assert.equal(morning.posts.length, 1);
    assert.equal(morning.staged.length, 1);

    const card = morning.staged[0]!;
    assert.equal(card.channel, CHANNEL);
    assert.deepEqual(card.operations?.map((op) => op.toolName), ["github_issue_create", "component_implement"]);
    assert.deepEqual(card.onCancel?.map((op) => op.toolName), ["github_issue_create"]);
    assert.deepEqual(card.confirmers, MEMBERS);
    assert.equal(card.ttlMs, LIBRARY_CARD_TTL_MS);
    assert.equal(LIBRARY_CARD_TTL_MS, 72 * 60 * 60 * 1000);
    assert.equal(card.proposalTs, card.replyTs);

    // The message names the publisher and says what each decision does.
    const text = morning.posts[0]!.text;
    assert.match(text, /published by \*coco\*/);
    assert.match(text, /no code mapping: sparkline/);
    assert.match(text, /files the intake only/);
    assert.match(text, /Any #plus-universal member can decide, for 72 hours/);
    assert.doesNotMatch(text, /Design System Updated|implement `/);

    // Nothing waits any more; the card is tracked.
    assert.deepEqual(morning.store.findings.value, []);
    assert.equal(morning.store.tracked.value.length, 1);
    assert.equal(morning.store.tracked.value[0]!.implement, "Accordion, Badge");
  });

  it("keeps the findings when the registry or the members cannot be read", async () => {
    for (const broken of ["registry", "members"] as const) {
      const morning = postDeps([await foundPublish()]);
      morning.deps[broken] = async () => null;
      await postLibraryFindings(morning.deps);
      assert.deepEqual(morning.posts, [], broken);
      assert.equal(morning.store.findings.value.length, 1, broken);
    }
  });

  it("posts nothing and stages nothing on a dry run", async () => {
    const morning = postDeps([await foundPublish()]);
    const result = await postLibraryFindings(morning.deps, { dryRun: true });
    assert.equal(result.posted, 1);
    assert.deepEqual(morning.posts, []);
    assert.deepEqual(morning.staged, []);
    assert.equal(morning.store.findings.value.length, 1);
  });
});

// ── The Gate on the card ─────────────────────────────────────────────────────

describe("the library card at the Gate", () => {
  async function stagedCard() {
    const morning = postDeps([await foundPublish()]);
    await postLibraryFindings(morning.deps);
    return { threadState: morning.threadState, card: morning.staged[0]! };
  }
  const react = (card: PendingProposal, glyph: string, userId: string): GateSignal => ({
    kind: "reaction",
    messageTs: card.proposalTs,
    channel: CHANNEL,
    thread: card.proposalTs,
    glyph,
    userId,
  });

  it("runs nothing on a ✅ from someone outside #plus-universal", async () => {
    const { threadState, card } = await stagedCard();
    const verdict = await resolveSignal(react(card, "white_check_mark", OUTSIDER), { threadState });
    assert.equal(verdict.outcome, "none");
    assert.equal(verdict.execute, undefined);
    assert.equal((await threadState.getProposalByTs(card.proposalTs)).state, "found");
  });

  it("files the intake and sends one dispatch with the right payload on a member's ✅", async () => {
    const { threadState, card } = await stagedCard();
    const verdict = await resolveSignal(react(card, "white_check_mark", MEMBERS[1]!), { threadState });
    assert.equal(verdict.outcome, "won");
    const ops = verdict.execute!.operations;
    assert.deepEqual(ops.map((op) => op.toolName), ["github_issue_create", "component_implement"]);
    assert.match(String(ops[0]!.input.body), /uno-bot:figma-publish:2210000000000000002/);

    // The dispatch the executor would send, from where the card was approved.
    const built = implementPayload(ops[1]!.input, {
      channel: verdict.execute!.channel,
      threadTs: verdict.execute!.threadTs,
      userMsgTs: verdict.execute!.userMsgTs,
    });
    assert.deepEqual(built, {
      ok: true,
      component: "Accordion, Badge",
      payload: {
        component: "Accordion, Badge",
        notes: undefined,
        thread_ts: card.proposalTs,
        channel: CHANNEL,
        message_ts: card.proposalTs,
        figma_version_id: "2210000000000000002",
      },
    });
  });

  it("files the intake only on a member's ⛔", async () => {
    const { threadState, card } = await stagedCard();
    const verdict = await resolveSignal(react(card, "no_entry", MEMBERS[0]!), { threadState });
    assert.equal(verdict.outcome, "won");
    assert.equal(verdict.decision, "cancel");
    assert.deepEqual(verdict.execute!.operations.map((op) => op.toolName), ["github_issue_create"]);
  });
});

describe("the implement payload", () => {
  const slack = { channel: "C1", threadTs: "1.1", userMsgTs: "1.2" };

  it("still needs a PRD when the model asks for a component", () => {
    assert.equal(implementPayload({ component: "Badge" }, slack).ok, false);
    assert.equal(implementPayload({ component: "Badge", notion_prd_url: "https://www.notion.so/x-0123456789abcdef0123456789abcdef" }, slack).ok, true);
  });

  it("refuses a list from the model, and a malformed name or version on the library path", () => {
    assert.equal(implementPayload({ component: "Badge, Button", notion_prd_url: "https://www.notion.so/0123456789abcdef0123456789abcdef" }, slack).ok, false);
    assert.equal(implementPayload({ component: "Badge; rm -rf", library_publish: "1" }, slack).ok, false);
    assert.equal(implementPayload({ component: "Badge", library_publish: "abc" }, slack).ok, false);
  });
});

// ── The tracker ──────────────────────────────────────────────────────────────

describe("the morning tracker", () => {
  const POSTED_AT = Date.UTC(2026, 8, 30, 14, 0);
  const card = (): TrackedPublish => ({
    key: "2210000000000000002",
    marker: "<!-- uno-bot:figma-publish:2210000000000000002 -->",
    channel: CHANNEL,
    ts: "1790000000.000001",
    postedAt: POSTED_AT,
    implement: "Accordion, Badge",
  });

  function trackDeps(pulls: Awaited<ReturnType<TrackDeps["github"]["recentPulls"]>>, tracked = [card()]) {
    const calls: string[] = [];
    const store = kv(tracked);
    const deps: TrackDeps = {
      tracked: store,
      github: {
        recentIntakes: async () => [
          { number: 801, url: "https://github.com/o/r/issues/801", body: "unrelated" },
          { number: 870, url: "https://github.com/o/r/issues/870", body: `${card().marker}\n\n## What was published` },
        ],
        recentPulls: async () => pulls,
        comment: async (issue, body) => {
          calls.push(`comment #${issue}: ${body}`);
        },
        close: async (issue) => {
          calls.push(`close #${issue}`);
        },
      },
      postToThread: async (channel, ts, text) => {
        calls.push(`thread ${channel}/${ts}: ${text}`);
      },
      now: () => POSTED_AT + 24 * 60 * 60 * 1000,
    };
    return { deps, calls, store };
  }
  const pr = (over: Partial<{ state: "open" | "closed"; merged: boolean; title: string; createdAt: string }> = {}) => ({
    number: 880,
    title: implementPrTitle("Accordion, Badge"),
    url: "https://github.com/o/r/pull/880",
    createdAt: "2026-09-30T15:00:00Z",
    state: "open" as const,
    merged: false,
    ...over,
  });

  it("links the opened PR in the intake and in the thread, once", async () => {
    const { deps, calls, store } = trackDeps([pr()]);
    const result = await trackLibraryIntakes(deps);
    assert.equal(result.linked, 1);
    assert.deepEqual(calls, [
      "comment #870: The implementation PR is open: https://github.com/o/r/pull/880",
      `thread ${CHANNEL}/1790000000.000001: :link: The implementation PR is open: <https://github.com/o/r/pull/880|#880> — linked in the intake <https://github.com/o/r/issues/870|#870>.`,
    ]);
    assert.deepEqual(store.value[0]!.pr, { number: 880, url: "https://github.com/o/r/pull/880" });

    // The next morning says nothing new about the same open PR.
    const again = trackDeps([pr()], store.value);
    await trackLibraryIntakes(again.deps);
    assert.deepEqual(again.calls, []);
  });

  it("closes the intake as incorporated when the PR merges, and stops tracking", async () => {
    const { deps, calls, store } = trackDeps([pr({ state: "closed", merged: true })]);
    const result = await trackLibraryIntakes(deps);
    assert.equal(result.closed, 1);
    assert.ok(calls.includes("close #870"));
    assert.ok(calls.some((c) => c.startsWith("comment #870: Incorporated by")));
    assert.deepEqual(store.value, []);
  });

  it("ignores a PR for another list, or one opened before the card", async () => {
    const { deps, calls } = trackDeps([pr({ title: implementPrTitle("Badge") }), pr({ createdAt: "2026-09-01T00:00:00Z" })]);
    await trackLibraryIntakes(deps);
    assert.deepEqual(calls, []);
  });

  it("lets a card with no PR go after two weeks", async () => {
    const { deps, store } = trackDeps([]);
    deps.now = () => POSTED_AT + 15 * 24 * 60 * 60 * 1000;
    const result = await trackLibraryIntakes(deps);
    assert.equal(result.dropped, 1);
    assert.deepEqual(store.value, []);
  });
});
