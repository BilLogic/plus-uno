// A Figma library publish, end to end on fakes: the end-of-day poll finds it,
// the morning post drafts one intake and one #plus-universal card, the Gate
// resolves that card for the channel's members only, and the tracker links
// the implementation PR back and closes the intake on merge.
//
// The Figma side is a recorded /components + /versions pair served by the
// shared fake Figma (`src/figma/in-memory.ts`), and run through the same
// parsers the Worker uses (`componentsFrom`, `versionsFrom`), so the diff is
// the real one. Slack, GitHub and KV are the jobs' named dependencies.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { componentsFrom, pollFigmaLibrary, type PollDeps, type Snapshot } from "../src/figma-poll";
import { FigmaRequestError, type FigmaComponentsResponse, type FigmaVersionsResponse } from "../src/figma/client";
import { createInMemoryFigma } from "../src/figma/in-memory";
import type { FigmaNode } from "../src/integrations/figma-reading";
import { SubrequestBudgetError } from "../src/net";
import { draftPublishIntake, type ComponentRegistry, type LibraryChangeSet } from "../src/figma-library/draft";
import { LIBRARY_CARD_TTL_MS, postLibraryFindings, type PostDeps } from "../src/figma-library/post";
import { implementPrTitle, trackLibraryIntakes, type TrackDeps, type TrackedPublish } from "../src/figma-library/track";
import { resolveSignal, type GateSignal, type GateVerdict } from "../src/gate/index";
import { createInMemoryThreadState, type PendingProposal, type ReportItemState, type ThreadState } from "../src/thread-state/index";
import { implementPayload } from "../src/tools/implement";
import type { RefreshOwed } from "../src/figma-library/snapshot-refresh";
import type { CardMessage } from "../src/slack/button-door";
import { runReviewDecision, type ReviewDoorDeps } from "../src/slack/review-door";
import { recordingViews } from "./helpers/recording-slack";
import { recordingDelivery } from "../src/turn/index";
import { cardWords } from "./helpers/card-message";
import { messageBlocksRefusal } from "./helpers/slack-block-rules";

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
  const owed = kv<RefreshOwed | null>(null);
  const figma = createInMemoryFigma();
  figma.seedFile(FILE_KEY, { components: today, versions: VERSIONS });
  const deps: PollDeps = {
    figma,
    snapshot,
    findings,
    owed,
    fileKey: FILE_KEY,
    now: () => Date.UTC(2026, 8, 29, 22, 0),
  };
  return { deps, snapshot, findings, figma, owed };
}

/** Yesterday's publish only: the version the snapshot already knows. */
const KNOWN_VERSION_ONLY: FigmaVersionsResponse = { versions: [VERSIONS.versions![2]!] };

/** One node per component in `library`, each with one text layer `label`. */
function nodesOf(library: FigmaComponentsResponse, label: (nodeId: string) => string): Record<string, FigmaNode> {
  return Object.fromEntries(
    componentsFrom(library).map((c) => [c.nodeId, { name: c.name, type: "COMPONENT", children: [{ type: "TEXT", characters: label(c.nodeId) }] }]),
  );
}

/** The morning post on fakes, staging into a real in-memory ThreadState. */
function postDeps(findings: LibraryChangeSet[], opts: { refuseTables?: boolean } = {}) {
  const threadState = createInMemoryThreadState({ now: () => Date.UTC(2026, 8, 30, 14, 0) });
  const posts: Array<{ text: string; blocks: unknown[] }> = [];
  const refused: Array<{ text: string; blocks: unknown[] }> = [];
  const replies: Array<{ ts: string; text: string }> = [];
  const staged: PendingProposal[] = [];
  const edits: Array<{ text: string; blocks: unknown[] }> = [];
  const store = { findings: kv(findings), tracked: kv<TrackedPublish[]>([]), unpublished: kv<LibraryChangeSet | null>(null) };
  const deps: PostDeps = {
    ...store,
    registry: async () => REGISTRY,
    members: async () => MEMBERS,
    async post(message) {
      // Slack's verdict on the blocks, as the live API gives it.
      const why = messageBlocksRefusal(message.blocks);
      const table = message.blocks.some((b) => (b as { type?: string }).type === "data_table");
      if (why || (opts.refuseTables && table)) {
        refused.push(message);
        return { ok: false };
      }
      posts.push(message);
      return { ok: true, ts: `1790000000.00000${posts.length}` };
    },
    async reply(ts, text) {
      replies.push({ ts, text });
    },
    async stage(proposal) {
      staged.push(proposal);
      await threadState.putProposal(proposal);
    },
    reports: threadState,
    async edit(_ts, message) {
      edits.push(message);
    },
    channel: CHANNEL,
    now: () => Date.UTC(2026, 8, 30, 14, 0),
  };
  return { deps, posts, refused, replies, staged, edits, threadState, store };
}

/** A change set with no new version: an Accordion variant renamed, and
 *  nothing published. */
async function foundEditOnly(): Promise<LibraryChangeSet> {
  const edited: FigmaComponentsResponse = {
    meta: { components: [variant("k-acc-1", "State=Closed", "10:1", "accordion", "13667:6004"), ...BEFORE.meta!.components!.slice(1)] },
  };
  const { deps, findings, figma } = pollDeps(edited);
  figma.seedFile(FILE_KEY, { versions: KNOWN_VERSION_ONLY });
  await pollFigmaLibrary(deps);
  assert.equal(findings.value.length, 1);
  assert.deepEqual(findings.value[0]!.versions, []);
  return findings.value[0]!;
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
    // Sparkline is new to the library; Badge only gained a variant.
    assert.deepEqual(changeSet!.newComponentIds, ["400:1"]);
    assert.deepEqual(changeSet!.removedComponentIds, []);
    assert.deepEqual(result.pending, 1);
    assert.deepEqual(snapshot.value?.versionIds, ["2210000000000000002", "2210000000000000003", "2210000000000000001"]);
  });

  it("records a component as removed only when none of its variants is left", async () => {
    // Yesterday's Tooltip is gone, and one of the two Accordion variants.
    const shrunk: FigmaComponentsResponse = {
      meta: { components: BEFORE.meta!.components!.filter((c) => c.key !== "k-tip-1" && c.key !== "k-acc-2") },
    };
    const { deps, findings } = pollDeps(shrunk);
    await pollFigmaLibrary(deps);
    const [changeSet] = findings.value;
    assert.deepEqual(changeSet!.deleted.map((c) => c.name).sort(), ["Placement=top", "State=Expanded"]);
    assert.deepEqual(changeSet!.removedComponentIds, ["300:1"]);
    assert.deepEqual(changeSet!.newComponentIds, []);
    const intake = draftPublishIntake(changeSet!, REGISTRY);
    assert.deepEqual(intake.rows.map((r) => [r.figmaName, r.change]), [
      ["accordion", "updated"],
      ["tooltip", "removed"],
    ]);
  });

  it("finds nothing on a quiet day, and posts nothing the next morning", async () => {
    const { deps, findings, figma } = pollDeps(BEFORE);
    // Same components, and the only new version is the one already known.
    figma.seedFile(FILE_KEY, { versions: KNOWN_VERSION_ONLY });
    const result = await pollFigmaLibrary(deps);
    assert.equal(result.summary, "no changes since last check");
    assert.deepEqual(findings.writes, []);

    const morning = postDeps(findings.value);
    const posted = await postLibraryFindings(morning.deps);
    assert.equal(posted.posted, 0);
    assert.deepEqual(morning.posts, []);
    assert.deepEqual(morning.staged, []);
  });

  it("asks Figma twice on a quiet day: the library's components and its versions", async () => {
    const { deps, figma } = pollDeps(BEFORE);
    figma.seedFile(FILE_KEY, { versions: KNOWN_VERSION_ONLY });
    await pollFigmaLibrary(deps);
    assert.deepEqual(
      figma.calls().map((c) => [c.method, c.args[0]]),
      [
        ["components", FILE_KEY],
        ["versions", FILE_KEY],
      ],
    );
  });

  it("writes nothing on a dry run", async () => {
    const { deps, snapshot, findings } = pollDeps(AFTER);
    await pollFigmaLibrary(deps, { dryRun: true });
    assert.deepEqual(findings.writes, []);
    assert.deepEqual(snapshot.writes, []);
  });

  it("finds a change the metadata does not show, through the node hashes", async () => {
    const snapshot = kv<Snapshot | null>(null);
    const findings = kv<LibraryChangeSet[]>([]);
    const figma = createInMemoryFigma();
    figma.seedFile(FILE_KEY, { components: BEFORE, versions: KNOWN_VERSION_ONLY, nodes: nodesOf(BEFORE, () => "Label") });
    const deps: PollDeps = { figma, snapshot, findings, fileKey: FILE_KEY, now: () => Date.UTC(2026, 8, 29, 22, 0) };

    // The first poll stores the baseline: four components, one /nodes call.
    await pollFigmaLibrary(deps);
    assert.equal(Object.keys(snapshot.value!.nodeHashes).length, 4);

    // A publish that changes the small Badge's look and no component's name.
    figma.seedFile(FILE_KEY, { versions: VERSIONS, nodes: nodesOf(BEFORE, (id) => (id === "20:1" ? "Label, bolder" : "Label")) });
    const result = await pollFigmaLibrary(deps);
    assert.equal(result.modified, 1);
    assert.deepEqual(findings.value[0]!.modified.map((c) => c.name), ["Size=sm"]);
    assert.deepEqual(
      figma.calls().filter((c) => c.method === "nodes").map((c) => c.args[2]),
      [{ geometry: "paths" }, { geometry: "paths" }],
    );
  });

  it("leaves out a hash chunk Figma refuses, and still advances", async () => {
    const { deps, snapshot, figma } = pollDeps(BEFORE);
    figma.failNext("nodes", new FigmaRequestError(500, "Figma nodes 500: Internal error"));
    const result = await pollFigmaLibrary(deps);
    assert.match(result.summary, /versions:1/);
    assert.deepEqual(snapshot.value?.nodeHashes, {});
    assert.deepEqual(snapshot.value?.versionIds, ["2210000000000000002", "2210000000000000003", "2210000000000000001"]);
  });

  it("stops on a budget stop in the hashes before writing anything, so the retry still sees the publish", async () => {
    const { deps, snapshot, findings, figma } = pollDeps(BEFORE);
    figma.failNext("nodes", new SubrequestBudgetError(38));
    await assert.rejects(pollFigmaLibrary(deps), SubrequestBudgetError);
    assert.deepEqual(snapshot.writes, []);
    assert.deepEqual(findings.writes, []);
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

  it("counts a component new only when the library had none of it — a new variant is an update", async () => {
    const changeSet = await foundPublish();
    assert.deepEqual(draftPublishIntake(changeSet, REGISTRY).rows.map((r) => [r.figmaName, r.change]), [
      ["accordion", "updated"],
      ["badge", "updated"],
      ["sparkline", "new"],
    ]);
    // A change set kept from before the poll recorded ids is judged by its
    // variants: every one of Badge's changed variants is new, so it reads new.
    const { newComponentIds: _n, removedComponentIds: _r, ...older } = changeSet;
    assert.deepEqual(draftPublishIntake(older, REGISTRY).rows.map((r) => r.change), ["updated", "new", "new"]);
  });
});

// ── The morning post ─────────────────────────────────────────────────────────

describe("the morning post", () => {
  const VERSION = "2210000000000000002";
  const LIBRARY = `https://www.figma.com/design/${FILE_KEY}`;

  it("posts the publish as one shared decision card over the table of changed components", async () => {
    const morning = postDeps([await foundPublish()]);
    const result = await postLibraryFindings(morning.deps);
    assert.equal(result.posted, 1);
    assert.equal(morning.posts.length, 1);
    const posted = morning.posts[0]!;
    const blocks = posted.blocks as Array<Record<string, any>>;
    assert.deepEqual(blocks.map((b) => b.type), ["section", "card", "data_table"]);

    // The parent line: what the job found, one plain sentence.
    assert.equal(blocks[0]!.text.text, 'coco published "Badge sizes + accordion copy" to the library: 3 components changed, 2 of them have code.');
    assert.match(posted.text, /^coco published "Badge sizes \+ accordion copy" to the library/);

    const card = blocks[1]!;
    assert.equal(card.title.text, "Badge sizes + accordion copy");
    assert.equal(card.subtitle.text, "coco · Sep 29");
    assert.equal(card.body.text, "1 new, 2 updated. Accordion and Badge have code that can be drafted to match.");
    assert.match(card.icon.image_url, /figma\.com/);
    assert.deepEqual(
      card.actions.map((a: any) => [a.text.text, a.url ?? a.action_id]),
      [
        ["Review", `uno_decision_review:${VERSION}`],
        ["Open library", LIBRARY],
        ["View version", `${LIBRARY}?version-id=${VERSION}`],
      ],
    );

    const table = blocks[2]!;
    assert.equal(table.caption, "3 components changed: 1 new, 2 updated.");
    const text = (cell: any) => cell.text ?? cell.elements[0].elements[0].text;
    assert.deepEqual(
      table.rows.map((row: any[]) => row.map(text)),
      [
        ["Component", "Change", "Code"],
        ["accordion", "updated", "Accordion"],
        ["badge", "updated", "Badge"],
        ["sparkline", "new", "No code mapping yet"],
      ],
    );
    assert.equal(table.rows[1][0].elements[0].elements[0].url, "https://www.figma.com/design/x?node-id=13667-6004");

    // No gate of its own: no ✅/⛔ footer, nothing to type.
    for (const words of [posted.text, JSON.stringify(blocks)]) {
      assert.doesNotMatch(words, /:white_check_mark:|:no_entry:|✅|⛔|\bdrop \d|\bskip\b|intake only/i);
    }
    // The table names every component, so nothing spills into the thread.
    assert.deepEqual(morning.replies, []);
    assert.deepEqual(morning.store.findings.value, []);
  });

  it("stages the card as the report's one item: Approve files the intake and drafts every mapped component", async () => {
    const morning = postDeps([await foundPublish()]);
    await postLibraryFindings(morning.deps);
    const ts = "1790000000.000001";
    const card = morning.staged[0]!;
    assert.deepEqual(card.item, { messageTs: ts, id: VERSION });
    assert.equal(card.proposalTs, `${ts}#${VERSION}`);
    assert.equal(card.channel, CHANNEL);
    assert.deepEqual(card.operations?.map((op) => op.toolName), ["github_issue_create", "component_implement"]);
    assert.deepEqual(card.operations?.[1]!.input, { component: "Accordion, Badge", library_publish: VERSION });
    assert.equal("onCancel" in card, false, "Reject runs nothing");
    assert.deepEqual(card.confirmers, MEMBERS);
    assert.equal(card.ttlMs, LIBRARY_CARD_TTL_MS);
    assert.equal(LIBRARY_CARD_TTL_MS, 72 * 60 * 60 * 1000);
    assert.deepEqual(card.stated, {
      cancelled: "Rejected, nothing filed",
      expired:
        "That card closed after 72 h with no decision, so nothing was drafted. " +
        "I file its intake the morning after, so the publish isn't lost.",
    });
    // The pop-up's text: the publish and its components, with no footer.
    assert.match(card.proposalText, /^• \*Has code:\* accordion, badge$/m);
    assert.doesNotMatch(card.proposalText, /:white_check_mark:|:no_entry:/);

    // Its record, where a decision lands, keeps the table under the card.
    const record = await morning.threadState.getReport(ts);
    assert.equal(record?.entries[0]!.id, VERSION);
    assert.equal((record?.after?.[0] as { type?: string })?.type, "data_table");

    // Tracked to its outcome: the item, the components it dispatches and the
    // draft an expiry files.
    const tracked = morning.store.tracked.value[0]!;
    assert.equal(tracked.item, VERSION);
    assert.equal(tracked.ts, ts);
    assert.equal(tracked.implement, "Accordion, Badge");
    assert.equal(tracked.draft?.title, "Figma library publish: Badge sizes + accordion copy — 3 components");
  });

  it("says plainly when the library was edited and not published, and offers no Review", async () => {
    const morning = postDeps([await foundEditOnly()]);
    const result = await postLibraryFindings(morning.deps);
    assert.equal(result.posted, 1);
    assert.equal(
      morning.posts[0]!.text,
      [
        `*Library edited, not published.* 1 component's name or description changed in the <https://www.figma.com/design/${FILE_KEY}|library>, with no new version: accordion.`,
        "Nothing to build yet. I'll post again when a version is published.",
      ].join("\n"),
    );
    // No button row, nothing staged, nothing to track, and it waits no more.
    assert.ok(!JSON.stringify(morning.posts[0]!.blocks).includes('"actions"'), JSON.stringify(morning.posts[0]!.blocks));
    assert.deepEqual(morning.staged, []);
    assert.deepEqual(morning.store.tracked.value, []);
    assert.deepEqual(morning.store.findings.value, []);
    // Kept, to ride into the next publish's card.
    assert.deepEqual(morning.store.unpublished.value?.modified.map((c) => c.name), ["State=Closed"]);
  });

  it("carries an unpublished edit into the next publish's card, as it promised", async () => {
    // A Tooltip description edited with no version, then — the next morning —
    // a publish that touches three other components.
    const tooltip = componentsFrom(BEFORE).find((c) => c.key === "k-tip-1")!;
    const edit: LibraryChangeSet = {
      detectedAt: "2026-09-28T22:00:00Z",
      fileKey: FILE_KEY,
      versions: [],
      created: [],
      modified: [{ ...tooltip, description: "Now with an arrow" }],
      deleted: [],
      newComponentIds: [],
      removedComponentIds: [],
    };
    const day1 = postDeps([edit]);
    await postLibraryFindings(day1.deps);
    assert.match(day1.posts[0]!.text, /^\*Library edited, not published\.\*/);

    const day2 = postDeps([await foundPublish()]);
    day2.store.unpublished = kv(day1.store.unpublished.value);
    day2.deps.unpublished = day2.store.unpublished;
    await postLibraryFindings(day2.deps);
    const blocks = day2.posts[0]!.blocks as Array<Record<string, any>>;
    assert.match(blocks[0]!.text.text, /: 4 components changed, 3 of them have code\.$/);
    assert.equal(blocks[1]!.body.text, "1 new, 3 updated. Accordion, Badge and Tooltip have code that can be drafted to match.");
    // The intake and the dispatch carry it too, and nothing waits any more.
    assert.match(String(day2.staged[0]!.operations![0]!.input.body), /tooltip/);
    assert.equal(day2.staged[0]!.operations![1]!.input.component, "Accordion, Badge, Tooltip");
    assert.equal(day2.store.unpublished.value, null);
  });

  /** The publish with sixty more unmapped components, each a new set. */
  async function bigPublish(): Promise<LibraryChangeSet> {
    const changeSet = await foundPublish();
    const extra = Array.from({ length: 60 }, (_, i) => ({
      key: `k-extra-${i}`,
      name: "Default",
      description: "",
      nodeId: `50:${i}`,
      containingFrame: `extra component number ${i}`,
      setNodeId: `500:${i}`,
    }));
    return {
      ...changeSet,
      created: [...changeSet.created, ...extra],
      newComponentIds: [...(changeSet.newComponentIds ?? []), ...extra.map((c) => c.setNodeId)],
    };
  }

  it("posts the card without its table when Slack refuses it, and the list goes in the thread", async () => {
    const morning = postDeps([await bigPublish()], { refuseTables: true });
    await postLibraryFindings(morning.deps);
    assert.equal(morning.refused.length, 1);
    assert.equal(morning.posts.length, 1);
    const blocks = morning.posts[0]!.blocks as Array<Record<string, any>>;
    assert.deepEqual(blocks.map((b) => b.type), ["section", "card"]);
    assert.equal(morning.staged.length, 1);
    assert.equal((await morning.threadState.getReport("1790000000.000001"))?.after, undefined, "never redrawn with a table it did not post");
    assert.equal(morning.replies.length, 1);
    assert.match(morning.replies[0]!.text, /^All 63 components in this publish:/);
  });

  it("names every component in the table, however long the list", async () => {
    const morning = postDeps([await bigPublish()]);
    await postLibraryFindings(morning.deps);
    const table = (morning.posts[0]!.blocks as Array<Record<string, any>>).find((b) => b.type === "data_table")!;
    assert.equal(table.rows.length, 64);
    const names = JSON.stringify(table.rows);
    for (const name of ["accordion", "badge", "sparkline", "extra component number 0", "extra component number 59"]) {
      assert.ok(names.includes(name), name);
    }
    assert.deepEqual(morning.replies, []);
    // The pop-up's text caps its list instead.
    assert.match(morning.staged[0]!.proposalText, /\*No code mapping yet:\* .* and \d+ more$/m);
  });

  it("says on the card when it could not be staged, with nothing to review", async () => {
    const morning = postDeps([await foundPublish()]);
    morning.deps.stage = async () => {
      throw new Error("DO unavailable");
    };
    await postLibraryFindings(morning.deps);
    assert.equal(morning.edits.length, 1);
    const card = (morning.edits[0]!.blocks as Array<Record<string, any>>)[1]!;
    assert.match(card.subtitle.text, /^Couldn't be staged for review/);
    assert.deepEqual(card.actions.map((a: any) => a.text.text), ["Open library", "View version"]);
    // Still tracked, so its intake is filed when its window closes.
    assert.equal(morning.store.tracked.value.length, 1);
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

// ── Deciding the card ────────────────────────────────────────────────────────

describe("the library card in Review", () => {
  async function stagedCard() {
    const morning = postDeps([await foundPublish()]);
    await postLibraryFindings(morning.deps);
    return { threadState: morning.threadState, card: morning.staged[0]! };
  }

  /** A Submit from the Review pop-up, and what it ran and redrew. */
  async function submit(threadState: ThreadState, card: PendingProposal, decision: "confirm" | "cancel", userId = MEMBERS[0]!) {
    const ran: GateVerdict[] = [];
    const updates: Array<{ ts: string; message: CardMessage }> = [];
    const deps: ReviewDoorDeps = {
      threadState,
      views: recordingViews({ alreadyOpen: ["V1"] }).client,
      delivery: () => recordingDelivery(),
      applyVerdict: async (v) => {
        ran.push(v);
        return (v.execute?.operations ?? []).map((op) => ({ toolName: op.toolName, ok: true, result: "{}", message: "Done." }));
      },
      updateCard: async (_channel, ts, message) => void updates.push({ ts, message }),
      restage: async () => {},
      revise: async () => {},
      now: () => Date.UTC(2026, 8, 30, 15, 0),
    };
    await runReviewDecision({ viewId: "V1", channel: CHANNEL, messageTs: card.proposalTs, userId, decision }, deps);
    return { ran, updates };
  }

  it("runs nothing on a Submit from someone outside #plus-universal", async () => {
    const { threadState, card } = await stagedCard();
    const { ran } = await submit(threadState, card, "confirm", OUTSIDER);
    assert.equal(ran.filter((v) => v.execute).length, 0);
    assert.equal((await threadState.getProposalByTs(card.proposalTs)).state, "found");
  });

  it("is not decided by a ✅ on its message or typed in its thread", async () => {
    const { threadState, card } = await stagedCard();
    const ts = card.item!.messageTs;
    const signals: GateSignal[] = [
      { kind: "reaction", messageTs: ts, channel: CHANNEL, thread: ts, glyph: "white_check_mark", userId: MEMBERS[0]! },
      { kind: "typed", channel: CHANNEL, thread: ts, text: "✅", userId: MEMBERS[0]! },
    ];
    for (const signal of signals) {
      const verdict = await resolveSignal(signal, { threadState });
      assert.equal(verdict.execute, undefined, signal.kind);
    }
    assert.equal((await threadState.getProposalByTs(card.proposalTs)).state, "found");
  });

  it("Approve files the intake and dispatches the implementation for every mapped component", async () => {
    const { threadState, card } = await stagedCard();
    const { ran, updates } = await submit(threadState, card, "confirm");
    const execute = ran[0]!.execute!;
    assert.deepEqual(execute.operations.map((op) => op.toolName), ["github_issue_create", "component_implement"]);
    assert.match(String(execute.operations[0]!.input.body), /uno-bot:figma-publish:2210000000000000002/);

    // The dispatch the executor would send, from where the card was approved.
    const ts = card.item!.messageTs;
    assert.deepEqual(implementPayload(execute.operations[1]!.input, execute), {
      ok: true,
      component: "Accordion, Badge",
      payload: {
        component: "Accordion, Badge",
        notes: undefined,
        thread_ts: ts,
        channel: CHANNEL,
        message_ts: ts,
        figma_version_id: "2210000000000000002",
      },
    });

    // The report's message, drawn again: who approved, View, and the table.
    assert.equal(updates.length, 1);
    assert.equal(updates[0]!.ts, ts);
    const blocks = updates[0]!.message.blocks as Array<Record<string, any>>;
    assert.deepEqual(blocks.map((b) => b.type), ["section", "card", "data_table"]);
    assert.match(blocks[1]!.subtitle.text, /^Approved by <@U0MEMBER1> · written/);
    assert.equal(blocks[1]!.body.text, "Written: the intake, and code drafts started for Accordion and Badge.");
    assert.deepEqual(blocks[1]!.actions.map((a: any) => a.text.text), ["View", "Open library", "View version"]);
  });

  it("Reject files nothing", async () => {
    const { threadState, card } = await stagedCard();
    const { ran, updates } = await submit(threadState, card, "cancel");
    assert.equal(ran.length, 1);
    assert.equal(ran[0]!.decision, "cancel");
    assert.equal(ran[0]!.execute, undefined, "no intake, no dispatch");
    const blocks = updates[0]!.message.blocks as Array<Record<string, any>>;
    assert.equal(blocks[1]!.subtitle.text, "Rejected by <@U0MEMBER1>");
    assert.equal(blocks[1]!.body.text, "Nothing written.");
    assert.equal(blocks.at(-1)!.type, "data_table");
  });
});

describe("the implement payload", () => {
  const slack = { channel: "C1", threadTs: "1.1", userMsgTs: "1.2" };

  it("still needs a PRD when the model asks for a component", () => {
    assert.equal(implementPayload({ component: "Badge" }, slack).ok, false);
    assert.equal(implementPayload({ component: "Badge", notion_prd_url: "https://www.notion.so/x-0123456789abcdef0123456789abcdef" }, slack).ok, true);
  });

  it("ignores library_publish on a card someone requested — the model cannot skip its PRD", () => {
    const fromModel = { ...slack, requestedBy: "U0DESIGNR" };
    const built = implementPayload({ component: "Badge", library_publish: "123" }, fromModel);
    assert.equal(built.ok, false);
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

  type Pulls = Awaited<ReturnType<TrackDeps["github"]["recentPulls"]>>;
  type Intakes = Awaited<ReturnType<TrackDeps["github"]["recentIntakes"]>>;
  /** The card's intake, filed by a ✅ or a ⛔ — and one that is not its. */
  const DECIDED: Intakes = [
    { number: 801, url: "https://github.com/o/r/issues/801", body: "unrelated" },
    { number: 870, url: "https://github.com/o/r/issues/870", body: `${card().marker}\n\n## What was published` },
  ];
  /** `pulls` is the recent-pulls window; `byNumber` is every PR GitHub has. */
  function trackDeps(pulls: Pulls, tracked = [card()], byNumber: Pulls = pulls, intakes: Intakes = DECIDED) {
    const calls: string[] = [];
    const edits: Array<{ text: string; note: string }> = [];
    const store = kv(tracked);
    const deps: TrackDeps = {
      tracked: store,
      github: {
        recentIntakes: async () => intakes,
        recentPulls: async () => pulls,
        pull: async (number) => byNumber.find((p) => p.number === number) ?? null,
        comment: async (issue, body) => {
          calls.push(`comment #${issue}: ${body}`);
        },
        close: async (issue) => {
          calls.push(`close #${issue}`);
        },
        intakesSince: async () => ({ intakes, complete: true }),
        fileIntake: async (draft, from) => {
          calls.push(`file "${draft.title}" from ${from.channel}/${from.ts}`);
          return { number: 990, url: "https://github.com/o/r/issues/990" };
        },
      },
      reports: createInMemoryThreadState(),
      postToThread: async (channel, ts, text) => {
        calls.push(`thread ${channel}/${ts}: ${text}`);
      },
      closeCard: async (channel, ts, message) => {
        const { text, note } = cardWords(message);
        calls.push(`edit ${channel}/${ts}: ${note}`);
        edits.push({ text, note });
      },
      now: () => POSTED_AT + 24 * 60 * 60 * 1000,
    };
    return { deps, calls, edits, store };
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
      `thread ${CHANNEL}/1790000000.000001: PR open: <https://github.com/o/r/pull/880|#880>. Linked from the <https://github.com/o/r/issues/870|intake>.`,
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
    // One 🎉, naming what now matches the library.
    assert.ok(
      calls.includes(
        `thread ${CHANNEL}/1790000000.000001: :tada: <https://github.com/o/r/pull/880|#880> merged, so Accordion and Badge match the library. Closed the <https://github.com/o/r/issues/870|intake>.`,
      ),
      calls.join("\n"),
    );
    assert.deepEqual(store.value, []);
  });

  it("says a PR closed without merging leaves the intake open, and stops tracking", async () => {
    const { deps, calls, store } = trackDeps([pr({ state: "closed", merged: false })]);
    const result = await trackLibraryIntakes(deps);
    assert.equal(result.dropped, 1);
    assert.equal(
      calls.at(-1),
      `thread ${CHANNEL}/1790000000.000001: <https://github.com/o/r/pull/880|#880> closed without merging. The <https://github.com/o/r/issues/870|intake> stays open for the next try.`,
    );
    assert.ok(!calls.includes("close #870"));
    assert.deepEqual(store.value, []);
  });

  it("ignores a PR for another list, or one opened before the card", async () => {
    const { deps, calls } = trackDeps([pr({ title: implementPrTitle("Badge") }), pr({ createdAt: "2026-09-01T00:00:00Z" })]);
    await trackLibraryIntakes(deps);
    assert.deepEqual(calls, []);
  });

  it("sees a linked PR merge after it has left the recent-pulls window", async () => {
    const linkedCard = { ...card(), intake: { number: 870, url: "https://github.com/o/r/issues/870" }, pr: { number: 880, url: "https://github.com/o/r/pull/880" } };
    const { deps, calls, store } = trackDeps([], [linkedCard], [pr({ state: "closed", merged: true })]);
    const result = await trackLibraryIntakes(deps);
    assert.equal(result.closed, 1);
    assert.ok(calls.includes("close #870"));
    assert.deepEqual(store.value, []);
  });

  it("gives each PR to one card when two publishes dispatch the same components", async () => {
    const older = card();
    const newer = { ...card(), key: "2210000000000000009", marker: "<!-- uno-bot:figma-publish:2210000000000000009 -->", ts: "1790000000.000002", postedAt: POSTED_AT + 60 * 60 * 1000 };
    const first = pr();
    const second = { ...pr({ createdAt: "2026-09-30T16:30:00Z" }), number: 881, url: "https://github.com/o/r/pull/881" };
    const { deps, store } = trackDeps([second, first], [older, newer]);
    await trackLibraryIntakes(deps);
    assert.deepEqual(store.value.map((t) => [t.key, t.pr?.number]), [
      [older.key, 880],
      [newer.key, 881],
    ]);
  });

  it("lets a card with no PR go after two weeks", async () => {
    const { deps, store } = trackDeps([]);
    deps.now = () => POSTED_AT + 15 * 24 * 60 * 60 * 1000;
    const result = await trackLibraryIntakes(deps);
    assert.equal(result.dropped, 1);
    assert.deepEqual(store.value, []);
  });
});

describe("a library card nobody decides", () => {
  const POSTED_AT = Date.UTC(2026, 8, 30, 14, 0);
  const HOUR = 60 * 60 * 1000;
  const CARD_TEXT = '*Library published: "Badge sizes"* by coco · <https://x|view version>\n\n:white_check_mark: files the intake.';
  const undecided = (over: Partial<TrackedPublish> = {}): TrackedPublish => ({
    key: "2210000000000000002",
    marker: "<!-- uno-bot:figma-publish:2210000000000000002 -->",
    channel: CHANNEL,
    ts: "1790000000.000001",
    postedAt: POSTED_AT,
    implement: "Accordion, Badge",
    draft: { title: "Figma library publish: Badge sizes — 3 components", body: "<!-- uno-bot:figma-publish:2210000000000000002 -->\n\n## What was published" },
    cardText: CARD_TEXT,
    ...over,
  });

  /** The tracker over GitHub with no intake carrying the card's marker. */
  function world(tracked: TrackedPublish[], now: number, reports: ThreadState = createInMemoryThreadState({ now: () => now })) {
    const calls: string[] = [];
    const edits: Array<{ text: string; note: string }> = [];
    const closed: Array<Array<Record<string, any>>> = [];
    const store = kv(tracked);
    const deps: TrackDeps = {
      tracked: store,
      github: {
        recentIntakes: async () => [{ number: 801, url: "https://github.com/o/r/issues/801", body: "unrelated" }],
        recentPulls: async () => [],
        pull: async () => null,
        comment: async (issue, body) => {
          calls.push(`comment #${issue}: ${body}`);
        },
        close: async (issue) => {
          calls.push(`close #${issue}`);
        },
        intakesSince: async () => ({ intakes: [{ number: 801, url: "https://github.com/o/r/issues/801", body: "unrelated" }], complete: true }),
        fileIntake: async (draft, from) => {
          calls.push(`file "${draft.title}" from ${from.channel}/${from.ts}`);
          return { number: 990, url: "https://github.com/o/r/issues/990" };
        },
      },
      reports,
      postToThread: async (channel, ts, text) => {
        calls.push(`thread ${channel}/${ts}: ${text}`);
      },
      closeCard: async (channel, ts, message) => {
        calls.push(`edit ${channel}/${ts}`);
        edits.push(cardWords(message));
        closed.push(message.blocks as Array<Record<string, any>>);
      },
      now: () => now,
    };
    return { deps, calls, edits, closed, store };
  }

  /** A card posted as the shared decision card, its record in the store. */
  async function sharedCard(state?: ReportItemState) {
    const posted = postDeps([await foundPublish()]);
    await postLibraryFindings(posted.deps);
    const tracked = posted.store.tracked.value[0]!;
    if (state) await posted.threadState.updateReport(tracked.ts, { id: tracked.item!, state });
    return { tracked, reports: posted.threadState };
  }

  it("files the intake once its 72 hours pass, closes its card with no decision and says so in its thread", async () => {
    const { tracked, reports } = await sharedCard();
    const { deps, calls, closed, store } = world([tracked], tracked.postedAt + 73 * HOUR, reports);
    const result = await trackLibraryIntakes(deps);
    assert.equal(result.expired, 1);
    assert.deepEqual(calls, [
      `file "${tracked.draft!.title}" from ${CHANNEL}/${tracked.ts}`,
      `edit ${CHANNEL}/${tracked.ts}`,
      `thread ${CHANNEL}/${tracked.ts}: No decision in 72 h. I filed the <https://github.com/o/r/issues/990|intake> so the publish isn't lost.`,
    ]);
    const [, card, table] = closed[0]!;
    assert.equal(card!.subtitle.text, "Closed, no decision");
    assert.deepEqual(card!.actions.map((a: any) => a.text.text), ["View", "Open library", "View version"]);
    assert.equal(table!.type, "data_table");
    assert.deepEqual(store.value, []);
  });

  it("files nothing for a card rejected in Review, and stops following it", async () => {
    const { tracked, reports } = await sharedCard({ kind: "rejected", by: "U0MEMBER1" });
    const { deps, calls, store } = world([tracked], tracked.postedAt + 73 * HOUR, reports);
    const result = await trackLibraryIntakes(deps);
    assert.equal(result.expired, 0);
    assert.equal(result.dropped, 1);
    assert.deepEqual(calls, []);
    assert.deepEqual(store.value, []);
  });

  it("closes a card posted with its release card on those blocks", async () => {
    const release = [{ type: "section", text: { type: "mrkdwn", text: "release" } }];
    const { deps, closed } = world([undecided({ cardBlocks: release })], POSTED_AT + 73 * HOUR);
    await trackLibraryIntakes(deps);
    assert.equal(closed.length, 1);
    assert.deepEqual(closed[0]![0], release[0], "its own blocks lead");
    assert.match(JSON.stringify(closed[0]!.at(-1)), /No decision in 72 h/);
    assert.equal(closed[0]!.filter((b) => b.type === "actions").length, 0);
  });

  it("files the intake and closes the card once its 72 hours pass, and only once", async () => {
    const { deps, calls, edits, store } = world([undecided()], POSTED_AT + 73 * HOUR);
    const result = await trackLibraryIntakes(deps);
    assert.equal(result.expired, 1);
    assert.deepEqual(calls, [
      `file "Figma library publish: Badge sizes — 3 components" from ${CHANNEL}/1790000000.000001`,
      `edit ${CHANNEL}/1790000000.000001`,
    ]);
    // The card keeps its words and gains #886's closing line.
    assert.deepEqual(edits, [
      { text: CARD_TEXT, note: "_No decision in 72 h. Filed the <https://github.com/o/r/issues/990|intake> so it isn't lost._" },
    ]);
    assert.deepEqual(store.value, []);

    const again = world(store.value, POSTED_AT + 97 * HOUR);
    await trackLibraryIntakes(again.deps);
    assert.deepEqual(again.calls, []);
  });

  it("leaves a card alone while it can still be decided", async () => {
    const { deps, calls, store } = world([undecided()], POSTED_AT + 71 * HOUR);
    const result = await trackLibraryIntakes(deps);
    assert.equal(result.expired, 0);
    assert.deepEqual(calls, []);
    assert.equal(store.value.length, 1);
  });

  it("leaves a decided card alone: its intake carries the marker", async () => {
    const { deps, calls } = world([undecided()], POSTED_AT + 73 * HOUR);
    deps.github.recentIntakes = async () => [
      { number: 870, url: "https://github.com/o/r/issues/870", body: `${undecided().marker}\n\n## What was published` },
    ];
    const result = await trackLibraryIntakes(deps);
    assert.equal(result.expired, 0);
    assert.ok(!calls.some((c) => c.startsWith("file") || c.startsWith("edit")), calls.join("\n"));
  });

  it("has nothing to file for a card tracked before it kept its draft, and lets it age out", async () => {
    const { draft: _d, cardText: _c, ...legacy } = undecided();
    const { deps, calls, store } = world([legacy], POSTED_AT + 73 * HOUR);
    const result = await trackLibraryIntakes(deps);
    assert.equal(result.expired, 0);
    assert.deepEqual(calls, []);
    assert.equal(store.value.length, 1);
  });

  it("tries again tomorrow when the filing fails, and edits nothing", async () => {
    const { deps, calls, store } = world([undecided()], POSTED_AT + 73 * HOUR);
    deps.github.fileIntake = async () => {
      throw new Error("GitHub issues 502");
    };
    const result = await trackLibraryIntakes(deps);
    assert.equal(result.expired, 0);
    assert.deepEqual(calls, []);
    assert.equal(store.value.length, 1);
  });

  it("tries the edit again the next morning when it fails, and files nothing twice", async () => {
    const first = world([undecided()], POSTED_AT + 73 * HOUR);
    first.deps.closeCard = async () => {
      throw new Error("ratelimited");
    };
    const result = await trackLibraryIntakes(first.deps);
    assert.equal(result.expired, 1);
    assert.equal(first.calls.filter((c) => c.startsWith("file")).length, 1);
    // The filing is on record before the edit was tried.
    assert.equal(first.store.writes.length, 2);
    assert.deepEqual(first.store.writes[0]![0]!.intake, { number: 990, url: "https://github.com/o/r/issues/990" });
    assert.equal(first.store.value[0]!.closePending, true);

    const next = world(first.store.value, POSTED_AT + 97 * HOUR);
    await trackLibraryIntakes(next.deps);
    assert.deepEqual(next.calls, [`edit ${CHANNEL}/1790000000.000001`], "the edit only — no second intake");
    assert.equal(next.edits[0]!.note, "_No decision in 72 h. Filed the <https://github.com/o/r/issues/990|intake> so it isn't lost._");
    assert.deepEqual(next.store.value, []);
  });

  it("files nothing when a wider look finds the card's intake after all", async () => {
    const { deps, calls, store } = world([undecided()], POSTED_AT + 73 * HOUR);
    // The morning's one page missed it; every intake since the card holds it.
    deps.github.intakesSince = async () => ({
      intakes: [{ number: 870, url: "https://github.com/o/r/issues/870", body: `${undecided().marker}\n\n## What was published` }],
      complete: true,
    });
    const result = await trackLibraryIntakes(deps);
    assert.equal(result.expired, 0);
    assert.deepEqual(calls, []);
    assert.deepEqual(store.value[0]!.intake, { number: 870, url: "https://github.com/o/r/issues/870" });
  });

  it("files nothing when there are too many intakes since the card to be sure", async () => {
    const { deps, calls, store } = world([undecided()], POSTED_AT + 73 * HOUR);
    deps.github.intakesSince = async () => ({ intakes: [], complete: false });
    const result = await trackLibraryIntakes(deps);
    assert.equal(result.expired, 0);
    assert.deepEqual(calls, []);
    assert.equal(store.value.length, 1);
  });

  it("files and edits nothing on a dry run", async () => {
    const { deps, calls } = world([undecided()], POSTED_AT + 73 * HOUR);
    const result = await trackLibraryIntakes(deps, { dryRun: true });
    assert.equal(result.expired, 1);
    assert.deepEqual(calls, []);
  });
});

describe("the refresh a publish owes the repo's snapshot (#898)", () => {
  const FOUND_AT = "2026-09-29T22:00:00.000Z";

  it("owes one refresh for a publish, recorded before the poll moves its snapshot on", async () => {
    const { deps, owed, snapshot } = pollDeps(AFTER);
    const result = await pollFigmaLibrary(deps);
    assert.deepEqual(owed.value, { versionIds: ["2210000000000000002", "2210000000000000003"], unlabelled: ["2210000000000000003"], since: FOUND_AT });
    assert.equal(result.refreshOwed, 2);

    // A poll stopped before its snapshot write still left the refresh owed.
    const again = pollDeps(AFTER);
    again.deps.snapshot.write = async () => {
      throw new Error("KV down");
    };
    await assert.rejects(pollFigmaLibrary(again.deps), /KV down/);
    assert.deepEqual(again.owed.value?.versionIds, ["2210000000000000002", "2210000000000000003"]);
    assert.equal(snapshot.value?.versionIds[0], "2210000000000000002");
  });

  it("owes nothing more when the same publish is seen again: a retry merges, a finished poll never sees it", async () => {
    const stopped = pollDeps(AFTER);
    const write = stopped.deps.snapshot.write;
    stopped.deps.snapshot.write = async () => {
      throw new Error("KV down");
    };
    await assert.rejects(pollFigmaLibrary(stopped.deps));
    stopped.deps.snapshot.write = write;
    await pollFigmaLibrary(stopped.deps);
    assert.deepEqual(stopped.owed.value?.versionIds, ["2210000000000000002", "2210000000000000003"], "the retry merged the same ids");

    await pollFigmaLibrary(stopped.deps);
    assert.equal(stopped.owed.writes.length, 2, "the finished poll's snapshot knows the version: nothing new is owed");
  });

  it("owes two publishes found on two days, newest first, from the first one's date", async () => {
    const { deps, owed, figma } = pollDeps(AFTER);
    await pollFigmaLibrary(deps);
    figma.seedFile(FILE_KEY, {
      versions: {
        versions: [
          { id: "2210000000000000004", label: "Spacing tokens", description: "", created_at: "2026-09-30T20:00:00Z", user: { handle: "coco" } },
          ...VERSIONS.versions!,
        ],
      },
    });
    deps.now = () => Date.UTC(2026, 8, 30, 22, 0);
    await pollFigmaLibrary(deps);
    assert.deepEqual(owed.value, { versionIds: ["2210000000000000004", "2210000000000000002", "2210000000000000003"], unlabelled: ["2210000000000000003"], since: FOUND_AT });
  });

  it("owes nothing for a library edited with no new version, or a quiet day", async () => {
    const edited: FigmaComponentsResponse = {
      meta: { components: [variant("k-acc-1", "State=Closed", "10:1", "accordion", "13667:6004"), ...BEFORE.meta!.components!.slice(1)] },
    };
    const edit = pollDeps(edited);
    edit.figma.seedFile(FILE_KEY, { versions: KNOWN_VERSION_ONLY });
    const result = await pollFigmaLibrary(edit.deps);
    assert.equal(edit.findings.value.length, 1, "the edit is still a finding");
    assert.equal(edit.owed.value, null, "but nothing was published");
    assert.equal(result.refreshOwed, undefined);

    const quiet = pollDeps(BEFORE);
    quiet.figma.seedFile(FILE_KEY, { versions: KNOWN_VERSION_ONLY });
    await pollFigmaLibrary(quiet.deps);
    assert.equal(quiet.owed.value, null);
  });

  it("owes a refresh for a publish left with no label or description, and posts no card for it", async () => {
    const unlabelled = pollDeps(BEFORE);
    unlabelled.figma.seedFile(FILE_KEY, {
      versions: {
        versions: [
          { id: "2210000000000000006", label: null, description: null, created_at: "2026-09-29T21:00:00Z", user: { handle: "bill" } },
          VERSIONS.versions![2]!,
        ],
      },
    });
    const result = await pollFigmaLibrary(unlabelled.deps);
    assert.deepEqual(unlabelled.owed.value, { versionIds: ["2210000000000000006"], unlabelled: ["2210000000000000006"], since: FOUND_AT });
    assert.equal(result.refreshOwed, 1);
    assert.deepEqual(unlabelled.findings.value, [], "the release card still counts labelled publishes only");

    await pollFigmaLibrary(unlabelled.deps);
    assert.equal(unlabelled.owed.writes.length, 1, "the next poll knows the version: nothing new is owed");
  });

  it("says what it would owe on a dry run, and writes nothing", async () => {
    const { deps, owed } = pollDeps(AFTER);
    const result = await pollFigmaLibrary(deps, { dryRun: true });
    assert.equal(result.refreshOwed, 2);
    assert.deepEqual(owed.writes, []);
  });
});
