// Dev Mode links on the registry's components, end to end on fakes: a run
// posts one Review card per component that still needs its Code and
// Storybook links, Approve writes exactly those links through the one Figma
// client and leaves one labelled comment the first time, and a merged
// library PR's link is offered the same way.
//
// What an outsider sees: which cards post where, what each would write,
// what lands in Figma after Approve, and that a second run adds nothing.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { createInMemoryFigma, type InMemoryFigma } from "../src/figma/in-memory";
import type { FigmaDevResource } from "../src/figma/client";
import {
  runDevLinksPost,
  writeDevLinks,
  type DevLinkRegistry,
  type DevLinksDeps,
} from "../src/figma-links/run";
import { devLinksRequestOf } from "../src/figma-links/gate";
import { figmaDevLinksProbe } from "../src/diagnostics/probes/figma";
import type { Env } from "../src/types";
import { D1QueryBudgetError, D1_QUERY_CAP } from "../src/net";
import { FIGMA_LABEL } from "../src/figma-ask/trigger";
import { itemProposal } from "../src/slack/decision-cards";
import { runReviewDecision, type ReviewDoorDeps } from "../src/slack/review-door";
import type { CardMessage } from "../src/slack/button-door";
import { recordingDelivery } from "../src/turn/index";
import { recordingViews } from "./helpers/recording-slack";
import { createInMemoryThreadState, type PendingProposal } from "../src/thread-state/index";
import { trackLibraryIntakes, implementPrTitle, type TrackDeps, type TrackedPublish } from "../src/figma-library/track";
import { runQueuedPrLinks, type QueuedPrLinks } from "../src/figma-links/queue";

const CHANNEL = "D0APTB20SK0";
const BILL = "U03FYQJRQHX";
const LIB = "zAecJNRdvJzAUOcjV32tRX";
const SPECS = "W0qzhXWxFsMwSJzkdV2yal";
const REPO = "BilLogic/plus-uno";
const FIRST_TS = "1760360400.000001";
const NOW = Number(FIRST_TS) * 1000 + 60_000;

/** A slice of the real registry: Button's verified sets and its docs page, Badge, and a spec component in the other file. */
const REGISTRY: DevLinkRegistry = {
  components: {
    Button: {
      code: { source: "design-system/src/components/actions/Button/Button.jsx", storybookId: "components-actions-button--docs" },
      figma: {
        fileKey: LIB,
        sets: [
          { componentSetNodeId: "3497:19482", status: "docs-page", url: "https://www.figma.com/design/LIB?node-id=3497-19482" },
          { componentSetNodeId: "33:2470", status: "verified", url: "https://www.figma.com/design/LIB?node-id=33-2470" },
          { componentSetNodeId: "979:20977", status: "verified" },
        ],
      },
    },
    Badge: {
      code: { source: "design-system/src/components/status-and-loading/Badge/Badge.jsx", storybookId: "components-status-and-loading-badge--docs" },
      figma: { fileKey: LIB, sets: [{ componentSetNodeId: "25:568", status: "verified" }] },
    },
    OptionChip: {
      code: {
        source: "design-system/src/specs/Toolkit/Post-Session/Elements/OptionChip/OptionChip.jsx",
        storybookId: "specs-toolkit-post-session-elements-option-chip--toolkit-docs-optionchip",
      },
      figma: { fileKey: SPECS, sets: [{ componentSetNodeId: "10661:10292" }] },
    },
  },
};

const BUTTON_CODE = "https://github.com/BilLogic/plus-uno/blob/main/design-system/src/components/actions/Button/Button.jsx";
const BUTTON_STORYBOOK = "https://plus-uno.netlify.app/storybook/?path=/docs/components-actions-button--docs";

interface Posted {
  text: string;
  blocks?: unknown[];
  threadTs?: string;
}

function world(opts: { figma?: InMemoryFigma; members?: string[] | null } = {}) {
  const figma = opts.figma ?? seeded();
  const store = createInMemoryThreadState({ now: () => NOW });
  const posts: Posted[] = [];
  const staged: PendingProposal[] = [];
  const marked: string[] = [];
  const carded: { value: Record<string, number> | null } = { value: null };
  let n = 0;
  const deps: DevLinksDeps = {
    registry: async () => REGISTRY,
    figma,
    repo: REPO,
    members: async () => (opts.members === undefined ? [BILL] : opts.members),
    post: async (message, threadTs) => {
      posts.push({ ...message, ...(threadTs ? { threadTs } : {}) });
      n += 1;
      return { ok: true, ts: `1760360400.00000${n}` };
    },
    edit: async () => {},
    reports: store,
    stage: async (proposal) => {
      staged.push(proposal);
      await store.putProposal(proposal);
    },
    markThread: async (ts) => void marked.push(ts),
    carded: { read: async () => carded.value, write: async (v) => void (carded.value = v) },
    channel: CHANNEL,
    now: () => NOW,
  };
  return { deps, figma, store, posts, staged, marked, carded };
}

/** A Figma with the two files seeded, and these links already on them. */
function seeded(links: FigmaDevResource[] = []): InMemoryFigma {
  const figma = createInMemoryFigma({ now: () => NOW });
  figma.seedFile(LIB, { devResources: links.filter((l) => l.file_key === LIB) });
  figma.seedFile(SPECS, { devResources: links.filter((l) => l.file_key === SPECS) });
  return figma;
}

type Card = { title: { text: string }; subtitle?: { text: string }; body: { text: string }; actions: Array<{ text: { text: string }; url?: string }> };
function cardsIn(blocks: unknown[]): Card[] {
  const second = blocks[1] as { type: string; elements?: Card[] } & Card;
  return second.type === "carousel" ? second.elements! : [second];
}

const linksOf = (p: PendingProposal) => (p.operations![0]!.input as { links: Array<{ file_key: string; node_id: string; name: string; url: string }> }).links;

describe("a run for one component", () => {
  it("posts one Review card where the Figma Review-card setting says, offering Code and Storybook links on each of its library components", async () => {
    const w = world({ figma: seeded() });
    const result = await runDevLinksPost(w.deps, { components: ["Button"] });
    assert.equal(result.posted, true, result.summary);
    assert.equal(w.posts.length, 1);
    const [c] = cardsIn(w.posts[0]!.blocks!);
    assert.equal(c!.title.text, "Button");
    assert.equal(w.staged.length, 1);
    assert.equal(w.staged[0]!.channel, CHANNEL);
    assert.deepEqual(w.staged[0]!.confirmers, [BILL]);
    assert.deepEqual(linksOf(w.staged[0]!), [
      { file_key: LIB, node_id: "33:2470", name: "Code: Button", url: BUTTON_CODE },
      { file_key: LIB, node_id: "33:2470", name: "Storybook: Button", url: BUTTON_STORYBOOK },
      { file_key: LIB, node_id: "979:20977", name: "Code: Button", url: BUTTON_CODE },
      { file_key: LIB, node_id: "979:20977", name: "Storybook: Button", url: BUTTON_STORYBOOK },
    ]);
    assert.deepEqual(w.figma.writes(), [], "posting the card writes nothing to Figma");
  });
});

const link = (node: string, name: string, url: string, file = LIB, id = `${node}-${name}`): FigmaDevResource => ({ id, file_key: file, node_id: node, name, url });

describe("a re-run", () => {
  it("adds no duplicate: a component whose links are all there gets no card", async () => {
    const figma = seeded([
      link("33:2470", "Code: Button", BUTTON_CODE),
      link("33:2470", "Storybook: Button", BUTTON_STORYBOOK),
      link("979:20977", "Code: Button", BUTTON_CODE),
      link("979:20977", "Storybook: Button", BUTTON_STORYBOOK),
    ]);
    const w = world({ figma });
    const result = await runDevLinksPost(w.deps, { components: ["Button"] });
    assert.equal(result.posted, false);
    assert.match(result.summary, /already linked: Button/);
    assert.deepEqual(w.posts, []);
  });

  it("offers only what is missing, and no comment once the component has had its links", async () => {
    const w = world({ figma: seeded([link("33:2470", "Code: Button", BUTTON_CODE), link("979:20977", "Old name", BUTTON_STORYBOOK)]) });
    await runDevLinksPost(w.deps, { components: ["Button"] });
    assert.deepEqual(linksOf(w.staged[0]!), [
      { file_key: LIB, node_id: "33:2470", name: "Storybook: Button", url: BUTTON_STORYBOOK },
      { file_key: LIB, node_id: "979:20977", name: "Code: Button", url: BUTTON_CODE },
    ]);
    assert.deepEqual((w.staged[0]!.operations![0]!.input as { introduce: unknown[] }).introduce, []);
  });

  it("holds back what would pass Figma's 10 links on a component, and says so", async () => {
    const ten = Array.from({ length: 10 }, (_, i) => link("25:568", `Other ${i}`, `https://example.com/${i}`));
    const w = world({ figma: seeded(ten) });
    const result = await runDevLinksPost(w.deps, { components: ["Badge"] });
    assert.equal(result.posted, false);
    assert.match(result.summary, /at Figma's 10 links.*Badge/);
  });
});

describe("only registry components", () => {
  it("a name the registry does not map gets no card, and the summary names it", async () => {
    const w = world();
    const result = await runDevLinksPost(w.deps, { components: ["Banner"] });
    assert.equal(result.posted, false);
    assert.match(result.summary, /not in the registry, so no links: Banner/);
    assert.deepEqual(w.posts, []);
  });

  it("every registry component gets a card, each in its own file", async () => {
    const w = world();
    const result = await runDevLinksPost(w.deps, { all: true });
    assert.equal(result.cards, 3);
    assert.equal(w.posts.length, 1);
    assert.equal(w.posts[0]!.text.split("\n")[0], "Dev Mode links for 3 components are ready for Review.");
    const chip = w.staged.find((p) => p.item!.id === "links-OptionChip")!;
    assert.deepEqual(
      linksOf(chip).map((l) => [l.file_key, l.url]),
      [
        [SPECS, "https://github.com/BilLogic/plus-uno/blob/main/design-system/src/specs/Toolkit/Post-Session/Elements/OptionChip/OptionChip.jsx"],
        [SPECS, "https://plus-uno.netlify.app/storybook/?path=/docs/specs-toolkit-post-session-elements-option-chip--toolkit-docs-optionchip"],
      ],
    );
  });

  it("past ten, the first message carries ten and its thread the rest", async () => {
    const many: DevLinkRegistry = {
      components: Object.fromEntries(
        Array.from({ length: 12 }, (_, i) => [`C${i}`, { code: { source: `src/C${i}.jsx`, storybookId: `c${i}--docs` }, figma: { fileKey: LIB, sets: [{ componentSetNodeId: `1:${i}` }] } }]),
      ),
    };
    const w = world();
    w.deps.registry = async () => many;
    await runDevLinksPost(w.deps, { all: true });
    assert.equal(w.posts.length, 2);
    assert.equal(w.posts[0]!.text.split("\n")[0], "Dev Mode links for 12 components are ready for Review: 10 here, the rest in the thread.");
    assert.equal(w.posts[1]!.threadTs, FIRST_TS);
    assert.equal(w.posts[1]!.text.split("\n")[0], "Components 11–12 of 12.");
    assert.equal(w.staged.length, 12);
    assert.deepEqual(w.marked, [FIRST_TS]);
  });

  it("all 68 fit no one invocation's D1 budget: each run stages what its budget allows, and the next run carries on without re-offering a card", async () => {
    const sixtyEight: DevLinkRegistry = {
      components: Object.fromEntries(
        Array.from({ length: 68 }, (_, i) => [`C${i}`, { code: { source: `src/C${i}.jsx`, storybookId: `c${i}--docs` }, figma: { fileKey: LIB, sets: [{ componentSetNodeId: `1:${i}` }] } }]),
      ),
    };
    const w = world();
    w.deps.registry = async () => sixtyEight;
    // One invocation's meter: each staged card records one D1 event, and the cap is 40.
    let d1 = 0;
    w.deps.headroom = () => ({ d1Queries: D1_QUERY_CAP - d1, subrequests: 1000 });
    const stage = w.deps.stage;
    w.deps.stage = async (p) => {
      if (d1 >= D1_QUERY_CAP) throw new D1QueryBudgetError(D1_QUERY_CAP);
      d1 += 1;
      await stage(p);
    };
    const runs: string[] = [];
    for (let i = 0; i < 6 && w.staged.length < 68; i++) {
      d1 = 0;
      const result = await runDevLinksPost(w.deps, { all: true });
      runs.push(result.summary);
      assert.ok(d1 <= D1_QUERY_CAP);
    }
    assert.equal(w.staged.length, 68, runs.join("\n"));
    assert.equal(new Set(w.staged.map((p) => p.item!.id)).size, 68, "no card offered twice");
    assert.ok(runs.length > 1, "it took more than one invocation");
    assert.match(runs[0]!, /left for the next run/);
    const again = await runDevLinksPost(w.deps, { all: true });
    assert.equal(again.posted, false);
    assert.match(again.summary, /card already open/);
  });

  it("the registry carries a source file and a Storybook id for every component, and each source file exists", () => {
    const root = join(process.cwd(), "..", "..");
    const registry = JSON.parse(readFileSync(join(root, "design-system", "figma", "component-registry.json"), "utf8")) as DevLinkRegistry;
    const names = Object.keys(registry.components);
    assert.equal(names.length, 68);
    for (const name of names) {
      const code = registry.components[name]!.code!;
      assert.ok(code.source && existsSync(join(root, code.source)), `${name}: ${code.source}`);
      assert.match(code.storybookId ?? "", /^[a-z0-9-]+--[a-z0-9-]+$/, name);
    }
    assert.equal(registry.components.Button!.code!.storybookId, "components-actions-button--docs");
  });
});

describe("when a run may go", () => {
  it("until FIGMA_DEV_LINKS is on: Button alone, the live check's component", () => {
    assert.deepEqual(devLinksRequestOf({ component: "Button" }, undefined), { request: { components: ["Button"] } });
    assert.ok("refused" in devLinksRequestOf({ component: "Badge" }, undefined));
    assert.ok("refused" in devLinksRequestOf({ component: "Button,Badge" }, ""));
    assert.ok("refused" in devLinksRequestOf({ all: true }, "off"));
    assert.ok("refused" in devLinksRequestOf({}, "on"));
  });

  it("the debug route rehearses unless asked to post", async () => {
    const probe = async (query: string) => {
      const url = new URL(`https://w/debug/figma-dev-links?${query}`);
      const report = await figmaDevLinksProbe({} as Env, url, new Request(url));
      return (report as { body: { dryRun: boolean } }).body.dryRun;
    };
    assert.equal(await probe("component=Button"), true);
    assert.equal(await probe("component=Button&post=1"), false);
  });

  it("once it is on: all of them, or several named", () => {
    assert.deepEqual(devLinksRequestOf({ all: true }, "on"), { request: { all: true } });
    assert.deepEqual(devLinksRequestOf({ component: "Button, Badge" }, " ON "), { request: { components: ["Button", "Badge"] } });
  });
});

describe("Approve on a card", () => {
  async function posted(figma = seeded()) {
    const w = world({ figma });
    await runDevLinksPost(w.deps, { components: ["Button"] });
    const updates: Array<{ ts: string; message: CardMessage }> = [];
    const ran: Array<{ toolName: string; input: Record<string, unknown> }> = [];
    const deps: ReviewDoorDeps = {
      threadState: w.store,
      views: recordingViews({ alreadyOpen: ["V1"] }).client,
      delivery: () => recordingDelivery(),
      applyVerdict: async (v) => {
        ran.push(...((v.execute?.operations ?? []) as typeof ran));
        return [];
      },
      updateCard: async (_c, ts, message) => void updates.push({ ts, message }),
      restage: async () => {},
      revise: async () => {},
      now: () => NOW,
    };
    const decide = (decision: "confirm" | "cancel", userId = BILL) =>
      runReviewDecision({ viewId: "V1", channel: CHANNEL, messageTs: itemProposal(FIRST_TS, "links-Button").proposalTs, userId, decision }, deps);
    return { w, decide, ran, updates };
  }

  it("runs the card's one operation, which adds exactly its links and one labelled comment on the first library component", async () => {
    const { w, decide, ran } = await posted();
    await decide("confirm");
    assert.equal(ran.length, 1);
    assert.equal(ran[0]!.toolName, "figma_dev_links");
    const result = JSON.parse(await writeDevLinks(w.figma, ran[0]!.input)) as Record<string, unknown>;
    assert.deepEqual(result, { ok: true, added: 4, already: 0, commented: ["Button"] });
    const on = (await w.figma.devResources(LIB)).dev_resources.map((r) => [r.node_id, r.name, r.url]);
    assert.deepEqual(on, [
      ["33:2470", "Code: Button", BUTTON_CODE],
      ["33:2470", "Storybook: Button", BUTTON_STORYBOOK],
      ["979:20977", "Code: Button", BUTTON_CODE],
      ["979:20977", "Storybook: Button", BUTTON_STORYBOOK],
    ]);
    const comments = (await w.figma.comments(LIB)).comments;
    assert.equal(comments.length, 1);
    assert.equal(comments[0]!.message.split("\n")[0], FIGMA_LABEL);
    assert.deepEqual(comments[0]!.client_meta, { node_id: "33:2470", node_offset: { x: 0, y: 0 } });

    // The same operation again — a second card, or a retry — adds nothing, and comments once only.
    const again = JSON.parse(await writeDevLinks(w.figma, ran[0]!.input)) as { added: number; already: number; commented: string[] };
    assert.deepEqual([again.added, again.already, again.commented], [0, 4, []]);
    assert.equal((await w.figma.comments(LIB)).comments.length, 1);
  });

  it("Reject writes nothing", async () => {
    const { w, decide, ran } = await posted();
    await decide("cancel");
    assert.deepEqual(ran, []);
    assert.deepEqual(w.figma.writes(), []);
  });

  it("only a member of the Review channel can decide it", async () => {
    const { decide, ran, updates } = await posted();
    await decide("confirm", "U0OUTSIDE");
    assert.deepEqual(ran, []);
    assert.deepEqual(updates, []);
  });

  it("links held back at Figma's 10 are reported, and the rest still land", async () => {
    const figma = seeded();
    const w = world({ figma });
    await runDevLinksPost(w.deps, { components: ["Button"] });
    // Filled up between the card and the Approve.
    figma.seedFile(LIB, { devResources: Array.from({ length: 10 }, (_, i) => link("979:20977", `Other ${i}`, `https://example.com/${i}`)) });
    const result = JSON.parse(await writeDevLinks(figma, w.staged[0]!.operations![0]!.input)) as { ok: boolean; added: number; error: string };
    assert.equal(result.ok, false);
    assert.equal(result.added, 2);
    assert.match(result.error, /2 link\(s\) held back/);
  });

  it("an input that is not a card's is refused", async () => {
    assert.equal(JSON.parse(await writeDevLinks(seeded(), { links: [] })).ok, false);
  });
});

describe("a merged library PR", () => {
  const PR = { number: 1200, url: "https://github.com/BilLogic/plus-uno/pull/1200" };

  it("the tracker hands the merged PR and its components on", async () => {
    const card: TrackedPublish = { key: "k", marker: "m", channel: "C1", ts: "1.1", postedAt: NOW - 86_400_000, implement: "Button, Badge", pr: PR };
    const handed: unknown[] = [];
    let tracked = [card];
    const deps: TrackDeps = {
      tracked: { read: async () => tracked, write: async (t) => void (tracked = t) },
      github: {
        recentIntakes: async () => [],
        recentPulls: async () => [],
        pull: async () => ({ ...PR, title: implementPrTitle("Button, Badge"), createdAt: "2026-10-10T00:00:00Z", state: "closed", merged: true }),
        comment: async () => {},
        close: async () => {},
        intakesSince: async () => ({ intakes: [], complete: true }),
        fileIntake: async () => ({ number: 1, url: "u" }),
      },
      postToThread: async () => {},
      reports: createInMemoryThreadState({ now: () => NOW }),
      closeCard: async () => {},
      merged: async (pr, components) => void handed.push({ pr, components }),
      now: () => NOW,
    };
    await trackLibraryIntakes(deps);
    assert.deepEqual(handed, [{ pr: PR, components: ["Button", "Badge"] }]);
  });

  it("one card adds the PR's link to each mapped component it names, plainly named", async () => {
    const w = world();
    const result = await runDevLinksPost(w.deps, { pr: PR, components: ["Button", "Banner"] });
    assert.equal(result.cards, 1);
    assert.match(result.summary, /not in the registry, so no links: Banner/);
    assert.equal(w.posts[0]!.text.split("\n")[0], "PR #1200 merged, so its link is ready for Review on Button in Dev Mode.");
    assert.deepEqual(linksOf(w.staged[0]!), [
      { file_key: LIB, node_id: "33:2470", name: "PR #1200: Button", url: PR.url },
      { file_key: LIB, node_id: "979:20977", name: "PR #1200: Button", url: PR.url },
    ]);
  });

  it("the queue waits while FIGMA_DEV_LINKS is off, and posts and empties once it is on", async () => {
    let queue: QueuedPrLinks[] = [{ pr: PR, components: ["Button"] }];
    const asked: unknown[] = [];
    const deps = {
      queue: { read: async () => queue, write: async (q: QueuedPrLinks[]) => void (queue = q) },
      post: async (request: unknown) => {
        asked.push(request);
        return { posted: true, cards: 1, summary: "posted 1 card(s)" };
      },
    };
    const held = await runQueuedPrLinks({ ...deps, on: false });
    assert.match(held.summary, /1 merged PR waiting/);
    assert.deepEqual(asked, []);
    assert.equal(queue.length, 1);

    await runQueuedPrLinks({ ...deps, on: true });
    assert.deepEqual(asked, [{ pr: PR, components: ["Button"] }]);
    assert.deepEqual(queue, []);
  });
});
