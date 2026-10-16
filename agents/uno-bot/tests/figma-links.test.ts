// Dev Mode links on the registry's components, end to end on fakes: a run
// posts one Review card per component that still needs its Code and
// Storybook links, Approve writes exactly those links through the one Figma
// client and leaves one labeled comment the first time, and the morning
// hands one card for the components that PRs merged into main changed.
//
// What an outsider sees: which cards post where, what each would write,
// what lands in Figma after Approve, and that a second run adds nothing.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { createInMemoryFigma, type InMemoryFigma } from "../src/figma/in-memory";
import { FigmaRateLimitError, type FigmaDevResource } from "../src/figma/client";
import { devLinksComment } from "../src/figma-links/copy";
import {
  runDevLinksPost,
  writeDevLinks,
  approveDevLinks,
  runDevLinksWriteJob,
  DEV_LINKS_IDLE_STEPS,
  type DevLinksWriteJob,
  type DevLinkRegistry,
  type DevLinksDeps,
  DEV_LINKS_CARD_TTL_MS,
  type CardedMark,
} from "../src/figma-links/run";
import { devLinksRequestOf } from "../src/figma-links/gate";
import { devLinksDebugChannel } from "../src/figma-links/env";
import { DEV_LINKS_SECTION, devLinksSection, handOverDevLinks, type DevLinksHanded, type DevLinksMorningDeps } from "../src/figma-links/morning";
import type { MergedPull, SeenMark } from "../src/figma-links/feed";
import { planDevLinksCard } from "../src/figma-links/run";
import { sectionHandOffIn } from "../src/sweep/sections";
import { runSweepJob } from "../src/sweep/run";
import { memoryRunStorage, sweepHarness } from "./helpers/sweep-harness";
import { figmaDevLinksProbe } from "../src/diagnostics/probes/figma";
import type { Env } from "../src/types";
import { isOwnComment } from "../src/figma-ask/trigger";
import { itemProposal, settleItem } from "../src/slack/decision-cards";
import { runReviewDecision, type ReviewDoorDeps } from "../src/slack/review-door";
import type { CardMessage } from "../src/slack/button-door";
import { recordingDelivery } from "../src/turn/index";
import { recordingViews } from "./helpers/recording-slack";
import { notified } from "./helpers/notified";
import { createInMemoryThreadState, type PendingProposal, type ReportItemState } from "../src/thread-state/index";

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
  const carded: { value: Record<string, CardedMark> | null } = { value: null };
  let n = 0;
  const deps: DevLinksDeps = {
    registry: async () => REGISTRY,
    figma,
    repo: REPO,
    members: async () => (opts.members === undefined ? [BILL] : opts.members),
    post: async (message) => {
      posts.push({ ...message });
      n += 1;
      return { ok: true, ts: `1760360400.00000${n}` };
    },
    edit: async () => {},
    reports: store,
    stage: async (proposal) => {
      staged.push(proposal);
      await store.putProposal(proposal);
    },
    carded: { read: async () => carded.value, write: async (v) => void (carded.value = v) },
    channel: CHANNEL,
    now: () => NOW,
  };
  return { deps, figma, store, posts, staged, carded };
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
      { file_key: LIB, node_id: "33:2470", name: "Code (plus-uno): Button", url: BUTTON_CODE },
      { file_key: LIB, node_id: "33:2470", name: "Storybook: Button", url: BUTTON_STORYBOOK },
      { file_key: LIB, node_id: "979:20977", name: "Code (plus-uno): Button", url: BUTTON_CODE },
      { file_key: LIB, node_id: "979:20977", name: "Storybook: Button", url: BUTTON_STORYBOOK },
    ]);
    assert.deepEqual(w.figma.writes(), [], "posting the card writes nothing to Figma");
  });
});

const link = (node: string, name: string, url: string, file = LIB, id = `${node}-${name}`): FigmaDevResource => ({ id, file_key: file, node_id: node, name, url });

describe("a re-run", () => {
  it("adds no duplicate: a component whose links are all there gets no card", async () => {
    const figma = seeded([
      link("33:2470", "Code (plus-uno): Button", BUTTON_CODE),
      link("33:2470", "Storybook: Button", BUTTON_STORYBOOK),
      link("979:20977", "Code (plus-uno): Button", BUTTON_CODE),
      link("979:20977", "Storybook: Button", BUTTON_STORYBOOK),
    ]);
    const w = world({ figma });
    const result = await runDevLinksPost(w.deps, { components: ["Button"] });
    assert.equal(result.posted, false);
    assert.match(result.summary, /already linked: Button/);
    assert.deepEqual(w.posts, []);
  });

  it("offers only what is missing, and no comment once the component has had its links", async () => {
    const w = world({ figma: seeded([link("33:2470", "Code (plus-uno): Button", BUTTON_CODE), link("979:20977", "Old name", BUTTON_STORYBOOK)]) });
    await runDevLinksPost(w.deps, { components: ["Button"] });
    assert.deepEqual(linksOf(w.staged[0]!), [
      { file_key: LIB, node_id: "33:2470", name: "Storybook: Button", url: BUTTON_STORYBOOK },
      { file_key: LIB, node_id: "979:20977", name: "Code (plus-uno): Button", url: BUTTON_CODE },
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

describe("the Code link's new name", () => {
  const OLD = [
    link("33:2470", "Code: Button", BUTTON_CODE, LIB, "old-1"),
    link("33:2470", "Storybook: Button", BUTTON_STORYBOOK, LIB, "sb-1"),
    link("979:20977", "Code: Button", BUTTON_CODE, LIB, "old-2"),
    link("979:20977", "Storybook: Button", BUTTON_STORYBOOK, LIB, "sb-2"),
  ];

  it("a Code link uno-bot added under the old name gets a card that renames it, and no comment", async () => {
    const w = world({ figma: seeded(OLD) });
    const result = await runDevLinksPost(w.deps, { components: ["Button"] });
    assert.equal(result.cards, 1, result.summary);
    assert.deepEqual(linksOf(w.staged[0]!), [
      { file_key: LIB, node_id: "33:2470", name: "Code (plus-uno): Button", url: BUTTON_CODE },
      { file_key: LIB, node_id: "979:20977", name: "Code (plus-uno): Button", url: BUTTON_CODE },
    ]);
    assert.deepEqual((w.staged[0]!.operations![0]!.input as { introduce: unknown[] }).introduce, []);
    const [c] = cardsIn(w.posts[0]!.blocks!);
    assert.equal(c!.body.text, "Renames 2 links in Dev Mode on 2 library components.");
  });

  it("Approve renames the link in place — same link, same URL, new name — rather than adding a second", async () => {
    const figma = seeded(OLD);
    const w = world({ figma });
    await runDevLinksPost(w.deps, { components: ["Button"] });
    const result = JSON.parse(await writeDevLinks(figma, w.staged[0]!.operations![0]!.input)) as Record<string, unknown>;
    assert.deepEqual(result, { ok: true, added: 0, renamed: 2, already: 0, commented: [] });
    assert.deepEqual(
      (await figma.devResources(LIB)).dev_resources.map((r) => [r.id, r.name]),
      [
        ["old-1", "Code (plus-uno): Button"],
        ["sb-1", "Storybook: Button"],
        ["old-2", "Code (plus-uno): Button"],
        ["sb-2", "Storybook: Button"],
      ],
    );
    assert.deepEqual((await figma.comments(LIB)).comments, []);
    const after = await runDevLinksPost(world({ figma }).deps, { components: ["Button"] });
    assert.match(after.summary, /already linked: Button/);
  });

  it("a link someone else named, on the same URL, is left as it is", async () => {
    const w = world({ figma: seeded([link("33:2470", "Source", BUTTON_CODE), link("33:2470", "Storybook: Button", BUTTON_STORYBOOK), link("979:20977", "Source", BUTTON_CODE), link("979:20977", "Storybook: Button", BUTTON_STORYBOOK)]) });
    const result = await runDevLinksPost(w.deps, { components: ["Button"] });
    assert.match(result.summary, /already linked: Button/);
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

  it("every registry component goes on ONE batch card, which lists each component and its links", async () => {
    const w = world();
    const result = await runDevLinksPost(w.deps, { all: true });
    assert.equal(result.cards, 1, result.summary);
    assert.equal(w.posts.length, 1);
    assert.equal(w.posts[0]!.text.split("\n")[0], "Dev Mode links for 3 components are ready for Review, on one card.");
    assert.deepEqual(notified(w.posts[0]!), [], "anyone can settle Dev Mode links: nobody is tagged");
    const [c] = cardsIn(w.posts[0]!.blocks!);
    assert.equal(c!.title.text, "3 components");
    assert.equal(w.staged.length, 1);
    const card = w.staged[0]!;
    assert.equal(card.item!.id, "links-batch");
    const chip = linksOf(card).filter((l) => l.file_key === SPECS);
    assert.deepEqual(
      chip.map((l) => [l.name, l.url]),
      [
        ["Code (plus-uno): OptionChip", "https://github.com/BilLogic/plus-uno/blob/main/design-system/src/specs/Toolkit/Post-Session/Elements/OptionChip/OptionChip.jsx"],
        ["Storybook: OptionChip", "https://plus-uno.netlify.app/storybook/?path=/docs/specs-toolkit-post-session-elements-option-chip--toolkit-docs-optionchip"],
      ],
    );
    assert.equal(linksOf(card).length, 8);
    assert.deepEqual(
      (card.operations![0]!.input as { introduce: Array<{ component: string }> }).introduce.map((i) => i.component),
      ["Button", "Badge", "OptionChip"],
    );
    for (const name of ["Button", "Badge", "OptionChip"]) assert.ok(card.proposalText.includes(`*${name}*`), name);
    assert.ok(card.proposalText.includes(`<${BUTTON_CODE}|Code (plus-uno)>`), card.proposalText);
  });

  it("a second batch run while the card is open posts nothing; a component whose own card is open stays off the batch", async () => {
    const w = world();
    await runDevLinksPost(w.deps, { components: ["Button"] });
    const batch = await runDevLinksPost(w.deps, { all: true });
    assert.equal(batch.cards, 1);
    assert.match(batch.summary, /card already open: Button/);
    assert.ok(linksOf(w.staged[1]!).every((l) => !l.name.endsWith(": Button")));
    const again = await runDevLinksPost(w.deps, { all: true });
    assert.equal(again.posted, false);
    assert.match(again.summary, /card already open: .*the batch/);
  });

  it("all 68 on one card: Approve writes them in steps through the one Figma client, each step within its calls, and never adds or comments twice", async () => {
    const sixtyEight: DevLinkRegistry = {
      components: Object.fromEntries(
        Array.from({ length: 68 }, (_, i) => [`C${i}`, { code: { source: `src/C${i}.jsx`, storybookId: `c${i}--docs` }, figma: { fileKey: LIB, sets: [{ componentSetNodeId: `1:${i}` }] } }]),
      ),
    };
    const w = world();
    w.deps.registry = async () => sixtyEight;
    const posted = await runDevLinksPost(w.deps, { all: true });
    assert.equal(posted.cards, 1);
    const input = w.staged[0]!.operations![0]!.input;
    const steps: Array<{ ok: boolean; added: number; commented: string[]; left?: true }> = [];
    for (let i = 0; i < 10; i++) {
      const before = w.figma.calls().length;
      const step = JSON.parse(await writeDevLinks(w.figma, input, { calls: 30 })) as (typeof steps)[number];
      assert.ok(w.figma.calls().length - before <= 30, "a step spends no more than its calls");
      assert.equal(step.ok, true);
      steps.push(step);
      if (!step.left) break;
    }
    assert.ok(steps.length > 1, "it took more than one step");
    assert.equal(steps.at(-1)!.left, undefined);
    assert.equal(steps.reduce((n, s) => n + s.added, 0), 136);
    assert.equal(steps.flatMap((s) => s.commented).length, 68);
    assert.equal((await w.figma.devResources(LIB)).dev_resources.length, 136);
    assert.equal((await w.figma.comments(LIB)).comments.length, 68);
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

  it("a debug route's card posts in a test channel, never the Figma Review-card channel", () => {
    const env = { PLUS_DESIGN_CHANNEL_ID: "C_DESIGN", FIGMA_ASK_CHANNEL_ID: "C_ASK", TEST_CHANNEL_IDS: "C_SANDBOX, C_OTHER" } as Env;
    assert.equal(devLinksDebugChannel(env), "C_SANDBOX");
    assert.deepEqual(devLinksDebugChannel({ ...env, TEST_CHANNEL_IDS: "" }), { refused: "no TEST_CHANNEL_IDS — a debug route's card posts only in a test channel" });
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

  it("runs the card's one operation, which adds exactly its links and one labeled comment on the first library component", async () => {
    const { w, decide, ran } = await posted();
    await decide("confirm");
    assert.equal(ran.length, 1);
    assert.equal(ran[0]!.toolName, "figma_dev_links");
    const result = JSON.parse(await writeDevLinks(w.figma, ran[0]!.input)) as Record<string, unknown>;
    assert.deepEqual(result, { ok: true, added: 4, renamed: 0, already: 0, commented: ["Button"] });
    const on = (await w.figma.devResources(LIB)).dev_resources.map((r) => [r.node_id, r.name, r.url]);
    assert.deepEqual(on, [
      ["33:2470", "Code (plus-uno): Button", BUTTON_CODE],
      ["33:2470", "Storybook: Button", BUTTON_STORYBOOK],
      ["979:20977", "Code (plus-uno): Button", BUTTON_CODE],
      ["979:20977", "Storybook: Button", BUTTON_STORYBOOK],
    ]);
    const comments = (await w.figma.comments(LIB)).comments;
    assert.equal(comments.length, 1);
    assert.ok(isOwnComment(comments[0]!.message), comments[0]!.message);
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

describe("a decided card stops counting as open", () => {
  /** Decide one item of a posted report, as the Review pop-up records it. */
  const settle = (w: ReturnType<typeof world>, ts: string, id: string, state: ReportItemState) => settleItem(w.store, { messageTs: ts, id }, state, NOW);

  it("a re-run before the card is decided still says it is open, and posts nothing", async () => {
    const w = world();
    await runDevLinksPost(w.deps, { components: ["Button"] });
    const again = await runDevLinksPost(w.deps, { components: ["Button"] });
    assert.equal(again.posted, false);
    assert.match(again.summary, /card already open: Button/);
    assert.equal(w.posts.length, 1);
  });

  it("once Approved in Review, a re-run with links still to write posts a new card", async () => {
    const w = world();
    await runDevLinksPost(w.deps, { components: ["Button"] });
    const deps: ReviewDoorDeps = {
      threadState: w.store,
      views: recordingViews({ alreadyOpen: ["V1"] }).client,
      delivery: () => recordingDelivery(),
      applyVerdict: async () => [],
      updateCard: async () => {},
      restage: async () => {},
      revise: async () => {},
      now: () => NOW,
    };
    await runReviewDecision({ viewId: "V1", channel: CHANNEL, messageTs: itemProposal(FIRST_TS, "links-Button").proposalTs, userId: BILL, decision: "confirm" }, deps);
    const again = await runDevLinksPost(w.deps, { components: ["Button"] });
    assert.equal(again.cards, 1, again.summary);
    assert.equal(w.posts.length, 2);
  });

  for (const [name, state] of [
    ["Needs changes", { kind: "changes-asked", by: BILL }],
    ["Reject", { kind: "rejected", by: BILL }],
  ] as const) {
    it(`once decided with ${name}, a re-run posts a new card`, async () => {
      const w = world();
      await runDevLinksPost(w.deps, { components: ["Button"] });
      await settle(w, FIRST_TS, "links-Button", state);
      const again = await runDevLinksPost(w.deps, { components: ["Button"] });
      assert.equal(again.cards, 1, again.summary);
    });
  }

  it("a batch card decided lets the next batch run post", async () => {
    const w = world();
    await runDevLinksPost(w.deps, { all: true });
    assert.match((await runDevLinksPost(w.deps, { all: true })).summary, /card already open: the batch/);
    await settle(w, FIRST_TS, "links-batch", { kind: "approved", by: BILL, at: NOW });
    const again = await runDevLinksPost(w.deps, { all: true });
    assert.equal(again.cards, 1, again.summary);
  });

  it("a component's decided card no longer keeps it off the batch", async () => {
    const w = world();
    await runDevLinksPost(w.deps, { components: ["Button"] });
    await settle(w, FIRST_TS, "links-Button", { kind: "rejected", by: BILL });
    const batch = await runDevLinksPost(w.deps, { all: true });
    assert.doesNotMatch(batch.summary, /already open/);
    assert.ok(linksOf(w.staged[1]!).some((l) => l.name.endsWith(": Button")));
  });

  it("a card past its time stops counting as open", async () => {
    const w = world();
    await runDevLinksPost(w.deps, { components: ["Button"] });
    w.deps.now = () => NOW + DEV_LINKS_CARD_TTL_MS + 1;
    const again = await runDevLinksPost(w.deps, { components: ["Button"] });
    assert.equal(again.cards, 1, again.summary);
  });
});

/** Run a handed-on write the way the runner does: a deferred job comes back as it handed itself on. */
async function steps(deps: Parameters<typeof runDevLinksWriteJob>[0], job: DevLinksWriteJob, most = 20): Promise<string[]> {
  const outcomes: string[] = [];
  for (let i = 0; i < most; i++) {
    const outcome = await runDevLinksWriteJob(deps, job);
    if (outcome === "handled") return [...outcomes, "handled"];
    outcomes.push("deferred");
    job = outcome.deferred;
  }
  return outcomes;
}

describe("Approve on the batch card", () => {
  const twelve: DevLinkRegistry = {
    components: Object.fromEntries(
      Array.from({ length: 12 }, (_, i) => [`C${i}`, { code: { source: `src/C${i}.jsx`, storybookId: `c${i}--docs` }, figma: { fileKey: LIB, sets: [{ componentSetNodeId: `1:${i}` }] } }]),
    ),
  };
  async function batch() {
    const w = world();
    w.deps.registry = async () => twelve;
    await runDevLinksPost(w.deps, { all: true });
    return { w, input: w.staged[0]!.operations![0]!.input };
  }

  it("writes what this press can, hands the rest on to carry on later, and says so", async () => {
    const { w, input } = await batch();
    const handed: DevLinksWriteJob[] = [];
    const result = JSON.parse(
      await approveDevLinks({ figma: w.figma, calls: 6, handOff: async (job) => void handed.push(job), now: () => NOW }, input, { channel: CHANNEL, replyTs: FIRST_TS }),
    ) as { ok: boolean; message: string; left?: true };
    assert.equal(result.ok, true);
    assert.equal(result.left, true);
    assert.match(result.message, /a reply in this thread says when/);
    // What this press commented goes with the job, so no later step posts it again.
    assert.deepEqual(handed, [{ kind: "figma-dev-links-write", input, channel: CHANNEL, threadTs: FIRST_TS, since: NOW, commented: ["C0", "C1", "C2"] }]);
  });

  it("a hand-off that fails is said, never left silent", async () => {
    const { w, input } = await batch();
    const result = JSON.parse(
      await approveDevLinks({ figma: w.figma, calls: 6, handOff: async () => { throw new Error("runner down"); }, now: () => NOW }, input, { channel: CHANNEL, replyTs: FIRST_TS }),
    ) as { ok: boolean; error: string };
    assert.equal(result.ok, false);
    assert.match(result.error, /the rest did not start/);
  });

  it("a write that fits writes it all at once and hands nothing on", async () => {
    const { w, input } = await batch();
    const handed: unknown[] = [];
    const result = JSON.parse(await approveDevLinks({ figma: w.figma, calls: 100, handOff: async (j) => void handed.push(j), now: () => NOW }, input, { channel: CHANNEL })) as { added: number; left?: true };
    assert.equal(result.added, 24);
    assert.equal(result.left, undefined);
    assert.deepEqual(handed, []);
  });

  it("the job carries on with a fresh budget each time, and when the last link is in says so in the thread", async () => {
    const { w, input } = await batch();
    const replies: string[] = [];
    const job: DevLinksWriteJob = { kind: "figma-dev-links-write", input, channel: CHANNEL, threadTs: FIRST_TS, since: NOW };
    const deps = { figma: w.figma, calls: () => 6, reply: async (text: string) => void replies.push(text), now: () => NOW };
    const outcomes = await steps(deps, job);
    assert.equal(outcomes.at(-1), "handled");
    assert.ok(outcomes.length > 2);
    assert.deepEqual(replies, ["The rest of the Dev Mode links are in: 24 links on 12 components, with 12 comments."]);
    assert.equal((await w.figma.devResources(LIB)).dev_resources.length, 24);
    assert.equal((await w.figma.comments(LIB)).comments.length, 12);
  });

  it("once every link is in and Figma reads its comments back as :goat:, the job finishes and never comments twice", async () => {
    const { w, input } = await batch();
    // The incident (2026-10-12): every link landed, then each step re-posted the comments.
    const replies: string[] = [];
    const deps = { figma: w.figma, calls: () => 30, reply: async (text: string) => void replies.push(text), now: () => NOW };
    const outcomes = await steps(deps, { kind: "figma-dev-links-write", input, channel: CHANNEL, threadTs: FIRST_TS, since: NOW });
    assert.equal(outcomes.at(-1), "handled");
    const comments = (await w.figma.comments(LIB)).comments;
    assert.ok(comments.every((c) => c.message.startsWith(":goat:: Added Dev Mode links to ")), "Figma holds them as shortcodes");
    assert.equal(comments.length, 12);
    assert.equal(new Set(comments.map((c) => c.client_meta?.node_id)).size, 12);
    assert.match(replies.at(-1)!, /24 links on 12 components, with 12 comments/);
  });

  it("a comment the job posted is never posted again, though Figma's read misses it", async () => {
    const { w, input } = await batch();
    const blind = { ...w.figma, comments: async () => ({ comments: [] }) } as unknown as typeof w.figma;
    const replies: string[] = [];
    const outcomes = await steps(
      { figma: blind, calls: () => 6, reply: async (t: string) => void replies.push(t), now: () => NOW },
      { kind: "figma-dev-links-write", input, channel: CHANNEL, threadTs: FIRST_TS, since: NOW },
    );
    assert.equal(outcomes.at(-1), "handled");
    const posted = w.figma.calls().filter((c) => c.method === "postComment").map((c) => (c.args[2] as { node_id: string }).node_id);
    assert.equal(posted.length, 12);
    assert.equal(new Set(posted).size, 12, "one comment per component");
    assert.match(replies.at(-1)!, /with 12 comments/);
  });

  it("a component whose comment is already on Figma twice stops the job, which says so in the thread and posts nothing more", async () => {
    const { w, input } = await batch();
    const finish = { figma: w.figma, calls: () => 100, reply: async () => {}, now: () => NOW };
    await steps(finish, { kind: "figma-dev-links-write", input, channel: CHANNEL, since: NOW });
    await w.figma.postComment(LIB, devLinksComment("C3"), { node_id: "1:3", node_offset: { x: 0, y: 0 } });
    const before = w.figma.writes().length;
    const replies: string[] = [];
    const outcome = await runDevLinksWriteJob(
      { figma: w.figma, calls: () => 100, reply: async (t) => void replies.push(t), now: () => NOW },
      { kind: "figma-dev-links-write", input, channel: CHANNEL, threadTs: FIRST_TS, since: NOW },
    );
    assert.equal(outcome, "handled");
    assert.equal(w.figma.writes().length, before, "nothing more written");
    assert.equal(replies.length, 1);
    assert.match(replies[0]!, /stopped/);
    assert.match(replies[0]!, /C3/);
  });

  it("a job that lands nothing new step after step stops and says so, rather than coming back all day", async () => {
    const { w, input } = await batch();
    const stuck = {
      ...w.figma,
      addDevResources: async () => {
        throw new FigmaRateLimitError("Figma 429", 60_000);
      },
    } as unknown as typeof w.figma;
    const replies: string[] = [];
    const outcomes = await steps(
      { figma: stuck, calls: () => 30, reply: async (t: string) => void replies.push(t), now: () => NOW },
      { kind: "figma-dev-links-write", input, channel: CHANNEL, threadTs: FIRST_TS, since: NOW },
      50,
    );
    assert.equal(outcomes.at(-1), "handled");
    assert.equal(outcomes.length, DEV_LINKS_IDLE_STEPS);
    assert.equal(replies.length, 1);
    assert.match(replies[0]!, /stopped/);
  });

  it("a job past a day stops, and says what never landed", async () => {
    const { w, input } = await batch();
    const replies: string[] = [];
    const job: DevLinksWriteJob = { kind: "figma-dev-links-write", input, channel: CHANNEL, threadTs: FIRST_TS, since: NOW - 25 * 3_600_000 };
    const outcome = await runDevLinksWriteJob({ figma: w.figma, calls: () => 6, reply: async (t) => void replies.push(t), now: () => NOW }, job);
    assert.equal(outcome, "handled");
    assert.deepEqual(w.figma.writes(), []);
    assert.equal(replies.length, 1);
    assert.match(replies[0]!, /stopped after a day/);
  });
});

describe("the morning's card, on the sweep's #plus-design message", () => {
  const DESIGN = "C0DESIGN";
  const DATE = "2026-10-14";
  const BUTTON_FILE = "design-system/src/components/actions/Button/Button.jsx";
  const merged = (number: number, mergedAt: string): MergedPull => ({ number, url: `https://github.com/${REPO}/pull/${number}`, mergedAt });
  const START: SeenMark = { mergedAt: "2026-10-10T00:00:00Z", number: 1 };

  function morningWorld(opts: { pulls?: MergedPull[]; files?: Record<number, string[]>; mark?: SeenMark | null; on?: boolean } = {}) {
    const w = world();
    const through = { value: opts.mark === undefined ? START : opts.mark };
    const mark = { read: async () => through.value, write: async (v: SeenMark | null) => void (through.value = v) };
    const handOff = sectionHandOffIn<DevLinksHanded>(memoryRunStorage(), DEV_LINKS_SECTION);
    const pulls = opts.pulls ?? [merged(7, "2026-10-13T15:00:00Z")];
    const filesAsked: number[] = [];
    const deps: DevLinksMorningDeps = {
      on: opts.on ?? true,
      feed: {
        mergedPulls: async () => ({ pulls, full: false, oldestUpdatedAt: pulls.map((p) => p.mergedAt).sort()[0] ?? null }),
        pullFiles: async (n) => {
          filesAsked.push(n);
          return opts.files?.[n] ?? [BUTTON_FILE];
        },
        registry: w.deps.registry,
        mark,
      },
      plan: (request) => planDevLinksCard(w.deps, request),
      members: async () => [BILL],
      handOff,
      channel: DESIGN,
      date: DATE,
      now: () => NOW,
    };
    const section = devLinksSection({ reports: w.store, stage: (p) => w.deps.stage(p), edit: async () => {}, carded: w.deps.carded, mark, now: () => NOW }, handOff, DATE);
    const h = sweepHarness({ channels: {}, now: NOW, runDate: DATE, threadState: w.store });
    h.deps.sections = [section];
    const run = async () => {
      const handed = await handOverDevLinks(deps);
      await runSweepJob({ key: "sweep-post", kind: "sweep-post" }, h.deps);
      return handed;
    };
    return { w, h, deps, through, run, filesAsked };
  }

  it("a PR merged into main that changed a component goes up as one card on the morning's one message, and the mark moves past it", async () => {
    const m = morningWorld();
    const handed = await m.run();
    assert.match(handed.summary, /handed a card for 4 link\(s\) from 1 merged PR/);
    assert.equal(m.h.posted.length, 1);
    assert.equal(m.h.posted[0]!.channel, DESIGN);
    assert.match(m.h.posted[0]!.text, /Dev Mode links for Button are ready for Review\./);
    assert.equal(m.w.staged.length, 1);
    assert.deepEqual(m.w.staged[0]!.confirmers, [BILL]);
    assert.deepEqual(m.through.value, { mergedAt: "2026-10-13T15:00:00Z", number: 7 });
    assert.ok(m.w.carded.value?.["links-Button"]);

    // The next morning: nothing new merged, nothing goes up.
    const again = await handOverDevLinks(m.deps);
    assert.match(again.summary, /no PR merged since the last run/);
  });

  it("a merged PR that changed no component moves the mark at once and hands nothing over", async () => {
    const m = morningWorld({ files: { 7: ["agents/uno-bot/src/index.ts"] } });
    await m.run();
    assert.equal(m.h.posted.length, 0);
    assert.deepEqual(m.through.value, { mergedAt: "2026-10-13T15:00:00Z", number: 7 });
  });

  it("waits while FIGMA_DEV_LINKS is off, reading nothing, and the first morning only marks the newest merge", async () => {
    const off = morningWorld({ on: false });
    assert.match((await off.run()).summary, /wait until FIGMA_DEV_LINKS is on/);
    assert.equal(off.h.posted.length, 0);
    assert.deepEqual(off.filesAsked, []);

    const first = morningWorld({ mark: null });
    assert.match((await first.run()).summary, /starting after #7/);
    assert.equal(first.h.posted.length, 0);
    assert.deepEqual(first.through.value, { mergedAt: "2026-10-13T15:00:00Z", number: 7 });
  });

  it("a card that does not stage leaves the mark, so the next morning plans it again", async () => {
    const m = morningWorld();
    m.w.deps.stage = async () => Promise.reject(new Error("DO down"));
    await m.run();
    assert.equal(m.h.posted.length, 1);
    assert.deepEqual(m.through.value, START);
  });
});
