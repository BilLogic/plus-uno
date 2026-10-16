// The weekly Figma tidy-up, end to end on fakes: Monday's read jobs list the
// teams' stage folders, and the post job checks each file against its
// Roadmap cards, then hands the week to the sweep's morning message, where it
// is a section of Review cards whose pop-up answers are "Moved it" and
// "Leave as is".
//
// What an outsider sees: which files are flagged and what each card tells the
// owner to do, who is mentioned where, what is remembered from week to week,
// and when nothing posts at all.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createInMemoryFigma } from "../src/figma/in-memory";
import { createFigmaRestClient, FIGMA_PER_MINUTE } from "../src/figma/rest";
import type { FigmaTeam } from "../src/figma-notify/teams";
import {
  runTidyPost,
  runTidyRead,
  tidySection,
  TIDY_SECTION,
  type TidyCard,
  type TidyHanded,
  type TidyListing,
  type TidyMemory,
  type TidyPostDeps,
  type TidyRefs,
  type TidySkips,
} from "../src/figma-tidy/run";
import { runSweepJob } from "../src/sweep/index";
import { sectionHandOffIn } from "../src/sweep/sections";
import { memoryRunStorage, sweepHarness } from "./helpers/sweep-harness";
import { likelyCard, projectWords } from "../src/figma-tidy/checks";
import { leaveAsIs } from "../src/figma-tidy/run";
import { figmaReviewChannel } from "../src/figma-tidy/env";
import type { Env } from "../src/types";
import { planRun, TIDY_JOBS } from "../src/scheduled/runs";
import { itemProposal } from "../src/slack/decision-cards";
import { runReviewDecision, type ReviewDoorDeps } from "../src/slack/review-door";
import type { CardMessage } from "../src/slack/button-door";
import { recordingDelivery } from "../src/turn/index";
import { recordingViews } from "./helpers/recording-slack";
import { messageBlocksRefusal } from "./helpers/slack-block-rules";
import { notified } from "./helpers/notified";
import { createInMemoryThreadState, type PendingProposal, type ThreadState } from "../src/thread-state/index";

const CHANNEL = "C03FC8AS69K";
const MEMBERS = ["U0SARAH", "U0MERYEM", "U0BILL"];
const NOW = 1760360400000 + 10 * 60_000;
/** The sweep's morning message, as the harness posts it. */
const MSG = `${Math.floor(NOW / 1000)}.900001`;
const RUN_DATE = "2026-10-12";

const UNIVERSAL: FigmaTeam = { name: "Universal", id: "100" };
const MISC: FigmaTeam = { name: "MISC", id: "900" };

/** Universal's five stage folders, as the probe found them. */
const FOLDERS = [
  { id: "u-play", name: "🕹️ Playground" },
  { id: "u-wip", name: "⏳ WIP" },
  { id: "u-dev", name: "Under-Dev" },
  { id: "u-specs", name: "📐 Specs" },
  { id: "u-arch", name: "🗂️ Archive" },
];

const file = (folderId: string, key: string, name: string) => ({ team: "Universal", folderId, key, name });

/** A finished listing of Universal. */
function listing(files: ReturnType<typeof file>[]): TidyListing {
  return {
    runDate: RUN_DATE,
    tasks: [],
    folders: FOLDERS.map((f) => ({ team: "Universal", ...f })),
    files,
  };
}

const card = (
  number: number,
  designStatus: string,
  owner: string | null,
  devStatus: string | null = null,
  title = `Card ${number} work`,
  designers: string[] = [],
): TidyCard => ({
  number,
  title,
  url: `https://www.notion.so/card-${number}`,
  designStatus,
  devStatus,
  owner,
  designers,
});

function box<T>(initial: T) {
  const b = { value: initial, writes: 0 };
  return {
    b,
    store: {
      read: async () => b.value,
      write: async (v: T) => {
        b.value = v;
        b.writes += 1;
      },
    },
  };
}

interface Posted {
  text: string;
  blocks: unknown[];
  threadTs: string | null;
}

/**
 * A Monday: the hand-over (`runTidyPost`), then — unless a rehearsal — the
 * sweep's post with the week as its section, on one ThreadState. `posts`
 * are the sweep's messages.
 */
function postWorld(opts: {
  files: ReturnType<typeof file>[];
  cards?: TidyCard[];
  likely?: Record<string, TidyCard>;
  memory?: TidyMemory | null;
  refs?: TidyRefs | null;
  skips?: TidySkips | null;
  waiting?: TidyHanded | null;
  store?: ThreadState;
  runDate?: string;
  now?: number;
}) {
  const store = opts.store ?? createInMemoryThreadState({ now: () => opts.now ?? NOW });
  const staged: PendingProposal[] = [];
  const marked: string[] = [];
  const memory = box<TidyMemory | null>(opts.memory ?? null);
  const list = box<TidyListing | null>(listing(opts.files));
  const refs = box<TidyRefs | null>(opts.refs ?? null);
  const skips = box<TidySkips | null>(opts.skips ?? null);
  const waiting = box<TidyHanded | null>(opts.waiting ?? null);
  const runDate = opts.runDate ?? RUN_DATE;
  const handOff = sectionHandOffIn<TidyHanded>(memoryRunStorage(), TIDY_SECTION);
  const deps: TidyPostDeps = {
    listing: list.store,
    memory: memory.store,
    refs: refs.store,
    skips: skips.store,
    waiting: waiting.store,
    roadmap: {
      cards: async (numbers) => (opts.cards ?? []).filter((c) => numbers.includes(c.number)),
      likely: async (project) => opts.likely?.[project] ?? null,
    },
    members: async () => [...MEMBERS],
    handOff,
    channel: CHANNEL,
    runDate,
    now: () => opts.now ?? NOW,
  };
  const hooks = {
    stage: async (proposal: PendingProposal) => {
      staged.push(proposal);
      await store.putProposal(proposal);
    },
  };
  const section = tidySection(
    {
      memory: memory.store,
      waiting: waiting.store,
      edit: async () => {},
      reports: store,
      stage: (p) => hooks.stage(p),
      markThread: async (ts) => void marked.push(ts),
    },
    handOff,
    runDate,
  );
  const h = sweepHarness({ channels: {}, now: opts.now ?? NOW, runDate, threadState: store });
  h.deps.sections = [section];
  const posts = h.posted as Posted[];
  /** The hand-over, then the sweep's post unless a rehearsal. */
  const run = async (o: { dryRun?: boolean } = {}) => {
    const result = await runTidyPost(deps, o);
    if (!o.dryRun) await runSweepJob({ key: "sweep-post", kind: "sweep-post" }, h.deps);
    return result;
  };
  return { deps, run, hooks, posts, staged, memory, list, store, marked, skips, waiting };
}

type Card = {
  title: { text: string };
  subtitle?: { text: string };
  body: { text: string };
  actions: Array<{ text: { text: string }; url?: string }>;
};
function cardsIn(blocks: unknown[]): Card[] {
  const second = blocks[1] as { type: string; elements?: Card[] } & Card;
  return second.type === "carousel" ? second.elements! : [second];
}

describe("the checks", () => {
  it("a file in WIP whose card shipped is flagged, with the exact folder to move it to", async () => {
    const w = postWorld({
      files: [file("u-wip", "F1", "AI Indicator / Card 733 / Sarah")],
      cards: [card(733, "Shipped", "U0SARAH")],
    });
    await w.run();
    assert.equal(w.posts.length, 1, "one message: the morning's");
    const reply = w.posts[0]!;
    assert.equal(reply.threadTs, null);
    assert.equal(messageBlocksRefusal(reply.blocks), null);
    assert.match(JSON.stringify(reply.blocks[0]), /<@U0SARAH>, 1 file needs a tidy\./);
    assert.match(JSON.stringify(reply.blocks[0]), /Figma tidy-up for the week of Oct 12: 1 new item\./);
    assert.deepEqual(notified(reply), ["U0SARAH"], "the owner is pinged from the main text");
    const [c] = cardsIn(reply.blocks);
    assert.equal(c!.title.text, "AI Indicator / Card 733 / Sarah");
    assert.equal(c!.subtitle!.text, "<@U0SARAH> · Wrong folder · Card 733");
    assert.equal(c!.body.text, "In ⏳ WIP, but Card 733 is Shipped. Move it to Universal › 📐 Specs.");
    assert.deepEqual(c!.actions.map((a) => a.text.text), ["Review", "Open file", "Card 733"]);
    assert.equal(c!.actions[1]!.url, "https://www.figma.com/design/F1");
    assert.equal(c!.actions[2]!.url, "https://www.notion.so/card-733");
  });
});

describe("the checks, each case", () => {
  /** Every card posted, by title. */
  async function bodies(files: ReturnType<typeof file>[], cards: TidyCard[] = [], likely: Record<string, TidyCard> = {}) {
    const w = postWorld({ files, cards, likely });
    await w.run();
    const out: Record<string, { subtitle: string; body: string; buttons: string[] }> = {};
    for (const p of w.posts) {
      for (const c of cardsIn(p.blocks!)) out[c.title.text] = { subtitle: c.subtitle!.text, body: c.body.text, buttons: c.actions.map((a) => a.text.text) };
    }
    return { out, w };
  }

  it("each Design Status and Dev Status maps to its folder", async () => {
    const { out } = await bodies(
      [
        file("u-specs", "P", "Play / Card 1 / A"),
        file("u-play", "W", "Wip / Card 2 / A"),
        file("u-wip", "D", "Dev / Card 3 / A"),
        file("u-wip", "X", "Deployed / Card 4 / A"),
        file("u-specs", "R", "Gone / Card 5 / A"),
      ],
      [
        card(1, "Need PRD / Under Playground", "U0SARAH"),
        card(2, "Under Review", "U0SARAH"),
        card(3, "Under Dev", "U0SARAH"),
        card(4, "WIP", "U0SARAH", "Deployed"),
        card(5, "Archived", "U0SARAH"),
      ],
    );
    assert.equal(out["Play / Card 1 / A"]!.body, "In 📐 Specs, but Card 1 is Need PRD / Under Playground. Move it to Universal › 🕹️ Playground.");
    assert.equal(out["Wip / Card 2 / A"]!.body, "In 🕹️ Playground, but Card 2 is Under Review. Move it to Universal › ⏳ WIP.");
    assert.equal(out["Dev / Card 3 / A"]!.body, "In ⏳ WIP, but Card 3 is Under Dev. Move it to Universal › Under-Dev.");
    assert.equal(out["Deployed / Card 4 / A"]!.body, "In ⏳ WIP, but Card 4 is deployed. Move it to Universal › 📐 Specs.");
    assert.equal(out["Gone / Card 5 / A"]!.body, "In 📐 Specs, but Card 5 is Archived. Move it to Universal › 🗂️ Archive.");
  });

  it("Under-Dev work in Specs is not flagged, nor a file already where its card says", async () => {
    const { out, w } = await bodies(
      [file("u-specs", "D", "Dev / Card 3 / A"), file("u-dev", "E", "Dev2 / Card 6 / A"), file("u-wip", "F", "Wip / Card 2 / A")],
      [card(3, "Under Dev", "U0SARAH"), card(6, "Under Dev", "U0SARAH"), card(2, "WIP", "U0SARAH")],
    );
    assert.deepEqual(out, {});
    assert.deepEqual(w.posts, [], "nothing to tidy posts nothing");
  });

  it("an unknown card is flagged, with a likely card suggested by the project's name", async () => {
    const likely = card(812, "WIP", null, null, "AI Indicator v2");
    const { out } = await bodies([file("u-wip", "U", "AI Indicator / Card 9999 / Sarah"), file("u-wip", "N", "Mystery / Card 9998 / Sarah")], [], {
      "AI Indicator": likely,
    });
    assert.deepEqual(out["AI Indicator / Card 9999 / Sarah"], {
      subtitle: "Unknown card · Card 9999",
      body: 'Card 9999 isn\'t on the Roadmap. Likely Card 812, "AI Indicator v2".',
      buttons: ["Review", "Open file", "Card 812"],
    });
    assert.equal(out["Mystery / Card 9998 / Sarah"]!.body, "Card 9998 isn't on the Roadmap, and no card's name matches the project.");
    assert.deepEqual(out["Mystery / Card 9998 / Sarah"]!.buttons, ["Review", "Open file"]);
  });

  it("a file on no card is told to go to Archive, unless it is a library, template or kit, or already there", async () => {
    const { out } = await bodies([
      file("u-wip", "L", "Old Onboarding / Legacy / flows"),
      file("u-wip", "K", "Design System (S23)"),
      file("u-wip", "T", "Handoff Template"),
      file("u-arch", "A", "Retired thing"),
    ]);
    assert.deepEqual(Object.keys(out), ["Old Onboarding / Legacy / flows"]);
    assert.deepEqual(out["Old Onboarding / Legacy / flows"], {
      subtitle: "Not on an active card",
      body: "Not on an active card, and not in 🗂️ Archive. Move it to Universal › 🗂️ Archive.",
      buttons: ["Review", "Open file"],
    });
  });

  it("MISC's files and Marketing files are exempt, and so is a folder that is not a stage folder", async () => {
    const w = postWorld({ files: [] });
    const l = listing([
      { team: "MISC", folderId: "m-wip", key: "M", name: "Workshop" },
      file("u-wip", "MK", "Launch / Marketing / Sam"),
      file("u-odd", "O", "Whatever"),
    ]);
    l.folders.push({ team: "MISC", id: "m-wip", name: "WIP" }, { team: "Universal", id: "u-odd", name: "Sandbox" });
    w.list.b.value = l;
    await w.run();
    assert.deepEqual(w.posts, []);
  });

  it("the likely card is the Roadmap title sharing the most of the project's words", () => {
    const cards = [card(1, "WIP", null, null, "AI tutor indicator"), card(2, "WIP", null, null, "Session Indicator Redesign"), card(3, "WIP", null, null, "Payments")];
    assert.equal(likelyCard("Session Indicator", cards)?.number, 2);
    assert.equal(likelyCard("Billing", cards), null);
    assert.deepEqual(projectWords("AI Indicator / x"), ["indicator"]);
  });

  it("a file for several cards may sit with any of them, and is told the least advanced one's folder", async () => {
    const { out } = await bodies(
      [file("u-wip", "M1", "Pair / Card 10 & 11 / A"), file("u-arch", "M2", "Pair2 / Card 12 & 13 / A")],
      [card(10, "Shipped", "U0SARAH"), card(11, "WIP", "U0SARAH"), card(12, "Shipped", "U0SARAH"), card(13, "Under Dev", "U0SARAH")],
    );
    assert.equal(out["Pair / Card 10 & 11 / A"], undefined);
    assert.equal(out["Pair2 / Card 12 & 13 / A"]!.body, "In 🗂️ Archive, but Card 13 is Under Dev. Move it to Universal › Under-Dev.");
  });
});

describe("the title check", () => {
  const refs = (cards: number[], modified = "2026-10-01T00:00:00Z"): TidyRefs => ({ F1: { modified, cards } });

  it("a title missing a card its pages or Cover reference gets the exact suggested title", async () => {
    const w = postWorld({
      files: [file("u-wip", "F1", "AI Indicator / Card 733 / Sarah")],
      cards: [card(733, "WIP", "U0SARAH"), card(812, "WIP", "U0MERYEM"), card(1002, "WIP", null)],
      refs: refs([1002, 733, 812]),
    });
    await w.run();
    assert.equal(w.posts.length, 1);
    assert.match(JSON.stringify(w.posts[0]!.blocks![0]), /<@U0SARAH>, 1 file needs a tidy\./);
    const [c] = cardsIn(w.posts[0]!.blocks!);
    assert.equal(c!.subtitle!.text, "<@U0SARAH> · Title misses a card · Card 812");
    assert.equal(
      c!.body.text,
      'Its pages or Cover name Card 812 and Card 1002, which the title leaves out. Rename it to "AI Indicator / Card 733 & 812 & 1002 / Sarah".',
    );
    assert.deepEqual(c!.actions.map((a) => a.text.text), ["Review", "Open file", "Card 812"]);
  });

  it("a title with no designers segment gets one, from its cards' designer Contributors", async () => {
    const w = postWorld({
      files: [file("u-wip", "F1", "AI Indicator / Card 733")],
      cards: [card(733, "WIP", "U0SARAH", null, "AI", ["Sarah"]), card(812, "WIP", "U0MERYEM", null, "AI", ["Meryem", "Sarah"])],
      refs: refs([812]),
    });
    await w.run();
    const [c] = cardsIn(w.posts[0]!.blocks!);
    assert.match(c!.body.text, /Rename it to "AI Indicator \/ Card 733 & 812 \/ Sarah & Meryem"\.$/);
  });

  it("a card the Roadmap doesn't have, or one the title already names, is not suggested", async () => {
    const w = postWorld({
      files: [file("u-wip", "F1", "AI Indicator / Card 733 / Sarah")],
      cards: [card(733, "WIP", "U0SARAH")],
      refs: refs([733, 4444]),
    });
    await w.run();
    assert.deepEqual(w.posts, []);
  });

  it("a title naming no card gets one, and is not told to go to Archive when its pages name an active card", async () => {
    const w = postWorld({
      files: [file("u-wip", "F1", "Onboarding / Sarah")],
      cards: [card(812, "WIP", "U0MERYEM")],
      refs: refs([812]),
    });
    await w.run();
    const all = w.posts.flatMap((p) => cardsIn(p.blocks!));
    assert.equal(all.length, 1);
    assert.match(all[0]!.body.text, /Rename it to "Onboarding \/ Card 812 \/ Sarah"\.$/);
    assert.match(JSON.stringify(w.posts[0]!.blocks![0]), /<@U0MERYEM>/);
  });
});

describe("an item left as is", () => {
  const files = [file("u-wip", "F1", "AI Indicator / Card 733 / Sarah")];
  const cards = [card(733, "Shipped", "U0SARAH"), card(734, "Shipped", "U0SARAH")];

  it("is silenced on later runs, and not counted open", async () => {
    const w = postWorld({ files, cards, skips: { "F1|wrong-folder": "733" } });
    const result = await w.run();
    assert.deepEqual(w.posts, []);
    assert.equal(result.summary, "nothing to tidy");
  });

  it("opens again once the file's card changes, and is forgotten", async () => {
    const w = postWorld({
      files: [file("u-wip", "F1", "AI Indicator / Card 734 / Sarah")],
      cards,
      skips: { "F1|wrong-folder": "733", "F9|title": "1" },
    });
    await w.run();
    assert.equal(cardsIn(w.posts[0]!.blocks)[0]!.subtitle!.text, "<@U0SARAH> · Wrong folder · Card 734");
    assert.deepEqual(w.skips.b.value, { "F9|title": "1" });
  });
});

describe("the post", () => {
  const many = (n: number, owner: string, base: number) =>
    Array.from({ length: n }, (_, i) => ({ f: file("u-wip", `${owner}${i}`, `P${base + i} / Card ${base + i} / x`), c: card(base + i, "Shipped", owner) }));

  /** The opener's words: the message's first block. */
  const opener = (message: Posted) => (message.blocks[0] as { text: { text: string } }).text.text;

  it("hands the week over and posts nothing of its own", async () => {
    const w = postWorld({ files: [file("u-wip", "F1", "AI Indicator / Card 733 / Sarah")], cards: [card(733, "Shipped", "U0SARAH")] });
    const result = await runTidyPost(w.deps);
    assert.equal(result.posted, false);
    assert.equal(result.summary, "handed 1 card(s) for 1 owner(s), 1 new, 0 still open to the morning post");
    assert.deepEqual(w.posts, []);
    assert.equal(w.memory.b.writes, 0, "nothing remembered until it shows");
  });

  it("one section of the morning's message: a bullet per owner, each mentioned once, the unassigned last, the week's line, and every card in the carousel", async () => {
    const sarah = many(4, "U0SARAH", 100);
    const meryem = many(2, "U0MERYEM", 200);
    const w = postWorld({
      files: [sarah[0]!.f, file("u-wip", "Z", "Loose file"), ...meryem.map((s) => s.f), ...sarah.slice(1).map((s) => s.f)],
      cards: [...sarah, ...meryem].map((s) => s.c),
    });
    await w.run();
    assert.equal(w.posts.length, 1, "one message, at the channel's top");
    const message = w.posts[0]!;
    assert.equal(message.threadTs, null);
    assert.equal(
      opener(message),
      "• <@U0SARAH>, 4 files need a tidy.\n• <@U0MERYEM>, 2 files need a tidy.\n• 1 file has no owner I could find.\n• Figma tidy-up for the week of Oct 12: 7 new items.",
    );
    assert.deepEqual(notified(message), ["U0SARAH", "U0MERYEM"]);
    assert.deepEqual(
      cardsIn(message.blocks).map((c) => c.title.text),
      [...sarah.map((s) => s.f.name), ...meryem.map((s) => s.f.name), "Loose file"],
      "grouped by owner, in bullet order",
    );
    assert.match(cardsIn(message.blocks)[4]!.subtitle!.text, /^<@U0MERYEM> · /, "each card's subtitle tags its owner");
    assert.deepEqual(w.marked, [MSG], "the thread is marked, so replies there are not all turns");
    assert.equal(w.staged.length, 7);
    for (const p of w.staged) assert.equal(p.item!.messageTs, MSG);
  });

  it("a single-owner week reads as its owner's line and the week's", async () => {
    const sarah = many(7, "U0SARAH", 100);
    const w = postWorld({ files: sarah.map((s) => s.f), cards: sarah.map((s) => s.c) });
    await w.run();
    assert.match(opener(w.posts[0]!), /<@U0SARAH>, 7 files need a tidy\./);
    const loose = postWorld({ files: [file("u-wip", "Z", "Loose file"), file("u-wip", "Y", "Other loose")] });
    await loose.run();
    assert.match(opener(loose.posts[0]!), /2 files have no owner I could find\./);
    assert.deepEqual(notified(loose.posts[0]!), [], "no owner, nobody pinged");
  });

  it("more than ten: ten cards, filled round-robin across owners with the unassigned last, and each bullet counts what waits", async () => {
    const sarah = many(8, "U0SARAH", 100);
    const meryem = many(5, "U0MERYEM", 200);
    const w = postWorld({
      files: [...sarah.map((s) => s.f), file("u-wip", "Z", "Loose file"), file("u-wip", "Y", "Other loose"), ...meryem.map((s) => s.f)],
      cards: [...sarah, ...meryem].map((s) => s.c),
    });
    await w.run();
    assert.equal(w.posts.length, 1);
    const message = w.posts[0]!;
    assert.equal(
      opener(message),
      [
        "• <@U0SARAH>, 8 files need a tidy. Here are 4; 4 more come in the next report.",
        "• <@U0MERYEM>, 5 files need a tidy. Here are 4; 1 more come in the next report.",
        "• 2 files have no owner I could find.",
        "• Figma tidy-up for the week of Oct 12: 15 new items.",
      ].join("\n"),
    );
    assert.deepEqual(
      cardsIn(message.blocks).map((c) => c.title.text),
      [...sarah.slice(0, 4).map((s) => s.f.name), ...meryem.slice(0, 4).map((s) => s.f.name), "Loose file", "Other loose"],
    );
    assert.equal(Object.keys(w.memory.b.value!.shown).length, 10, "an item that did not show is not remembered");
    assert.equal(w.waiting.b.value!.shown.length, 5, "what did not show waits for the next morning");

    // Tuesday: no listing of its own, so the week's five that had no room go up.
    const tuesday = postWorld({ files: [], memory: w.memory.b.value, waiting: w.waiting.b.value, runDate: "2026-10-13" });
    await tuesday.run();
    assert.equal(
      opener(tuesday.posts[0]!),
      [
        "• <@U0SARAH>, 4 files need a tidy.",
        "• <@U0MERYEM>, 1 file needs a tidy.",
        "• More from the Figma tidy-up for the week of Oct 12: 5 items that did not fit before.",
      ].join("\n"),
    );
    assert.equal(cardsIn(tuesday.posts[0]!.blocks).length, 5);
    assert.equal(Object.keys(tuesday.memory.b.value!.shown).length, 15);
    assert.equal(tuesday.waiting.b.value, null, "nothing left waiting");

    const next = postWorld({ files: w.list.b.value!.files, cards: [...sarah, ...meryem].map((s) => s.c), memory: w.memory.b.value, runDate: "2026-10-19" });
    next.list.b.value!.runDate = "2026-10-19";
    next.waiting.b.value = w.waiting.b.value;
    await next.run();
    assert.equal(opener(next.posts[0]!), "• <@U0SARAH>, 4 files need a tidy.\n• <@U0MERYEM>, 1 file needs a tidy.\n• Figma tidy-up for the week of Oct 19: 5 new items, and 10 still open from earlier weeks.");
    assert.equal(next.waiting.b.value, null, "a new week replaces what an earlier one left waiting");
  });

  it("every owner gets a card before anyone gets a second", async () => {
    const owners = Array.from({ length: 11 }, (_, i) => `U0OWNER${String.fromCharCode(65 + i)}`);
    const all = owners.flatMap((o, i) => many(2, o, 100 + i * 10));
    const w = postWorld({ files: all.map((s) => s.f), cards: all.map((s) => s.c) });
    await w.run();
    const lines = opener(w.posts[0]!).split("\n");
    assert.equal(lines.length, 12);
    assert.equal(lines[0], "• <@U0OWNERA>, 2 files need a tidy. Here is 1; 1 more come in the next report.");
    assert.equal(lines[10], "• <@U0OWNERK>, 2 files need a tidy. They come in the next report.");
    assert.equal(cardsIn(w.posts[0]!.blocks).length, 10);
  });

  it("a DM run tags nobody, and names each owner in plain text", async () => {
    const sarah = many(2, "U0SARAH", 100);
    const meryem = many(1, "U0MERYEM", 200);
    const w = postWorld({
      files: [...sarah.map((s) => s.f), ...meryem.map((s) => s.f), file("u-wip", "Z", "Loose file")],
      cards: [...sarah.map((s) => ({ ...s.c, ownerName: "Sarah Lee" })), ...meryem.map((s) => ({ ...s.c, ownerName: "Meryem Ali" }))],
    });
    w.deps.channel = "D0APTB20SK0";
    await w.run();
    assert.equal(w.posts.length, 1);
    assert.doesNotMatch(JSON.stringify(w.posts[0]), /<@/);
    assert.match(opener(w.posts[0]!), /^• Sarah Lee, 2 files need a tidy\.\n• Meryem Ali, 1 file needs a tidy\.\n• 1 file has no owner I could find\./);
    assert.match(cardsIn(w.posts[0]!.blocks)[0]!.subtitle!.text, /^Sarah Lee · /, "the subtitle names the owner too");
  });

  it("stages each card as its own proposal, answered Moved it or Leave as is, by the channel's members, for 24 weekday hours", async () => {
    const w = postWorld({ files: [file("u-wip", "F1", "AI Indicator / Card 733 / Sarah")], cards: [card(733, "Shipped", "U0SARAH")] });
    await w.run();
    assert.equal(w.staged.length, 1);
    const [p] = w.staged;
    assert.equal(p!.proposalTs, itemProposal(MSG, "wrong-folder-F1-733").proposalTs);
    assert.equal(p!.threadTs, MSG);
    assert.deepEqual(p!.confirmers, MEMBERS);
    // Staged Monday 09:10 ET: live until Tuesday 09:10 ET.
    const stored = await w.store.getProposalByTs(p!.proposalTs);
    assert.ok(stored.state === "found");
    assert.equal(stored.createdAt + stored.proposal.ttlMs!, Date.parse("2025-10-14T13:10:00Z"));
    assert.deepEqual(
      p!.choices!.map((c) => [c.label, c.verdict]),
      [
        ["Moved it", "cancel"],
        ["Leave as is", "confirm"],
      ],
    );
    assert.match(p!.proposalText, /Move it to Universal › 📐 Specs/);
    assert.doesNotMatch(`${p!.proposalText} ${p!.refuseRevision}`, /:white_check_mark:|:no_entry:|✅|⛔|\bdrop\b|\bskip\b|\bdispute\b|the Figma\b/);
  });

  it("repeat items don't reappear as new: the next week counts them still open", async () => {
    const files = [file("u-wip", "F1", "AI Indicator / Card 733 / Sarah")];
    const cards = [card(733, "Shipped", "U0SARAH")];
    const first = postWorld({ files, cards });
    await first.run();
    const memory = first.memory.b.value;
    assert.deepEqual(memory, { shown: { "F1|wrong-folder|733": RUN_DATE }, open: 1 });

    const next = postWorld({
      files: [...files, file("u-wip", "F2", "New / Card 734 / Sarah")],
      cards: [...cards, card(734, "Shipped", "U0SARAH")],
      memory,
      runDate: "2026-10-19",
    });
    next.list.b.value!.runDate = "2026-10-19";
    await next.run();
    assert.match(opener(next.posts[0]!), /Figma tidy-up for the week of Oct 19: 1 new item, and 1 still open from earlier weeks\./);
    assert.deepEqual(cardsIn(next.posts[0]!.blocks).map((c) => c.title.text), ["New / Card 734 / Sarah"]);
  });

  it("a fingerprint is forgotten after five weeks", async () => {
    const old = postWorld({
      files: [file("u-wip", "F1", "AI Indicator / Card 733 / Sarah")],
      cards: [card(733, "Shipped", "U0SARAH")],
      memory: { shown: { "F1|wrong-folder|733": "2026-09-07" }, open: 1 },
    });
    await old.run();
    assert.match(opener(old.posts[0]!), /Figma tidy-up for the week of Oct 12: 1 new item\./);
  });

  it("a week with nothing new posts nothing, even with items still open", async () => {
    const w = postWorld({
      files: [file("u-wip", "F1", "AI Indicator / Card 733 / Sarah")],
      cards: [card(733, "Shipped", "U0SARAH")],
      memory: { shown: { "F1|wrong-folder|733": "2026-10-05" }, open: 1 },
    });
    const result = await w.run();
    assert.equal(result.posted, false);
    assert.deepEqual(w.posts, []);
    assert.equal(w.memory.b.value!.open, 1);
  });

  it("the week everything is fixed says one all-clear on the morning's message, then goes quiet", async () => {
    const w = postWorld({ files: [], memory: { shown: { "F1|wrong-folder|733": "2026-10-05" }, open: 12 } });
    await w.run();
    assert.equal(w.posts.length, 1);
    assert.match(w.posts[0]!.text, /\*Figma tidy-up: all clear\* 🎉 Last week's 12 items are fixed\. Nice work\./);
    assert.equal(w.memory.b.value!.open, 0);

    const after = postWorld({ files: [], memory: w.memory.b.value, runDate: "2026-10-19" });
    after.list.b.value!.runDate = "2026-10-19";
    await after.run();
    assert.deepEqual(after.posts, []);
  });

  it("hands nothing over when the listing is not this week's or stopped short, and a dry run hands over and remembers nothing", async () => {
    const stale = postWorld({ files: [file("u-wip", "Z", "Loose")], runDate: "2026-10-19" });
    assert.match((await stale.run()).summary, /no listing for this week/);
    const short = postWorld({ files: [file("u-wip", "Z", "Loose")] });
    short.list.b.value!.tasks.push({ kind: "folder", team: "Universal", folderId: "u-specs" });
    assert.match((await short.run()).summary, /stopped short/);
    for (const w of [stale, short]) assert.deepEqual(w.posts, []);

    const dry = postWorld({ files: [file("u-wip", "Z", "Loose")] });
    const r = await dry.run({ dryRun: true });
    assert.match(r.summary, /would hand 1 card/);
    assert.deepEqual(dry.posts, []);
    assert.deepEqual(dry.staged, []);
    assert.equal(dry.memory.b.writes, 0);
  });

  it("a card that does not stage is not remembered, and waits for the next morning", async () => {
    const w = postWorld({ files: [file("u-wip", "F1", "AI Indicator / Card 733 / Sarah")], cards: [card(733, "Shipped", "U0SARAH")] });
    w.hooks.stage = async () => Promise.reject(new Error("DO down"));
    await w.run();
    assert.deepEqual(w.memory.b.value!.shown, {});
    assert.deepEqual(w.waiting.b.value!.shown.map((x) => x.finding.file.key), ["F1"]);
  });
});

describe("answering a card in its Review", () => {
  async function answered() {
    const w = postWorld({ files: [file("u-wip", "F1", "AI Indicator / Card 733 / Sarah")], cards: [card(733, "Shipped", "U0SARAH")] });
    await w.run();
    const updates: Array<{ ts: string; message: CardMessage }> = [];
    const ran: unknown[] = [];
    const views = recordingViews({ alreadyOpen: ["V1"] });
    const deps: ReviewDoorDeps = {
      threadState: w.store,
      views: views.client,
      delivery: () => recordingDelivery(),
      applyVerdict: async (v) => {
        ran.push(...(v.execute?.operations ?? []));
        return [];
      },
      updateCard: async (_c, ts, message) => void updates.push({ ts, message }),
      restage: async () => {},
      revise: async () => {},
      now: () => NOW,
    };
    const answer = (choice: string, userId = "U0SARAH") =>
      runReviewDecision(
        { viewId: "V1", channel: CHANNEL, messageTs: itemProposal(MSG, "wrong-folder-F1-733").proposalTs, userId, decision: "cancel", choice },
        deps,
      );
    return { answer, updates, ran };
  }

  it("Moved it closes the card with who answered, and writes nothing", async () => {
    const { answer, updates, ran } = await answered();
    await answer("moved");
    assert.deepEqual(ran, []);
    const [c] = cardsIn(updates.at(-1)!.message.blocks);
    assert.match(c!.subtitle!.text, /Moved it/);
    assert.match(c!.subtitle!.text, /<@U0SARAH>/);
  });

  it("Leave as is runs the card's one operation, which keeps the item quiet until the file's cards change", async () => {
    const { answer, updates, ran } = await answered();
    await answer("leave");
    assert.deepEqual(ran, [{ toolName: "figma_tidy_up", input: { file_key: "F1", check: "wrong-folder", card: 733, cards: "733" } }]);
    const [c] = cardsIn(updates.at(-1)!.message.blocks);
    assert.match(c!.subtitle!.text, /Left as is/);
    assert.equal(c!.body.text, "Not raised again until the file's cards change.");

    const skips = box<TidySkips | null>({ "F2|title": "9" });
    const result = JSON.parse(await leaveAsIs(skips.store, (ran[0] as { input: Record<string, unknown> }).input)) as { ok: boolean };
    assert.equal(result.ok, true);
    assert.deepEqual(skips.b.value, { "F2|title": "9", "F1|wrong-folder": "733" });
    assert.equal(JSON.parse(await leaveAsIs(skips.store, { file_key: "F1" })).ok, false, "an input without its check is refused");
  });

  it("only a channel member can answer", async () => {
    const { answer, updates } = await answered();
    await answer("moved", "U0OUTSIDE");
    assert.deepEqual(updates, []);
  });
});

describe("where it posts", () => {
  it("where the Figma Review-card setting says, else #plus-design", () => {
    assert.equal(figmaReviewChannel({ PLUS_DESIGN_CHANNEL_ID: CHANNEL, FIGMA_ASK_CHANNEL_ID: "D0APTB20SK0" } as Env), "D0APTB20SK0");
    assert.equal(figmaReviewChannel({ PLUS_DESIGN_CHANNEL_ID: CHANNEL, FIGMA_ASK_CHANNEL_ID: " " } as Env), CHANNEL);
    assert.equal(figmaReviewChannel({ PLUS_DESIGN_CHANNEL_ID: CHANNEL } as Env), CHANNEL);
    assert.equal(figmaReviewChannel({} as Env), null);
  });
});

describe("the read", () => {
  it("lists every team but MISC, folder by folder, across jobs when the budget runs short, and finishes once", async () => {
    const figma = createInMemoryFigma();
    figma.seedTeam(UNIVERSAL.id, FOLDERS);
    for (const f of FOLDERS) figma.seedFolder(f.id, [{ key: `k-${f.id}`, name: `File in ${f.name}`, last_modified: "2026-10-01T00:00:00Z" }]);
    figma.seedTeam(MISC.id, [{ id: "m1", name: "WIP" }]);
    const store = box<TidyListing | null>(null);
    let headroom = 3 * 3; // three listings' worth
    const deps = {
      figma: {
        teamFolders: async (id: string) => {
          headroom -= 3;
          return figma.teamFolders(id);
        },
        folderFiles: async (id: string) => {
          headroom -= 3;
          return figma.folderFiles(id);
        },
        file: (key: string) => figma.file(key),
      },
      teams: [UNIVERSAL, MISC],
      listing: store.store,
      refs: box<TidyRefs | null>(null).store,
      meter: { headroom: () => ({ subrequests: headroom }) },
      runDate: RUN_DATE,
    };
    const first = await runTidyRead(deps);
    assert.equal(first.listed, 3);
    assert.equal(first.left, 3);
    headroom = 100;
    const second = await runTidyRead(deps);
    assert.equal(second.left, 0);
    assert.equal(store.b.value!.files.length, 5);
    assert.deepEqual(store.b.value!.folders.map((f) => f.team), Array(5).fill("Universal"), "MISC is never listed");
    const third = await runTidyRead(deps);
    assert.equal(third.listed, 0, "a finished week lists nothing more");
  });

  it("reads a changed file's page names and Cover text for the cards they name, once per change, within the job's budget", async () => {
    const figma = createInMemoryFigma();
    figma.seedTeam(UNIVERSAL.id, [FOLDERS[1]!, FOLDERS[4]!]);
    const at = "2026-10-01T00:00:00Z";
    figma.seedFolder("u-wip", [
      { key: "F1", name: "AI Indicator / Card 733 / Sarah", last_modified: at },
      { key: "F2", name: "Other / Card 5 / Sarah", last_modified: at },
      { key: "F3", name: "Third / Card 6 / Sarah", last_modified: at },
      { key: "K", name: "Design System (S23)", last_modified: at },
    ]);
    figma.seedFolder("u-arch", [{ key: "A", name: "Old / Card 1 / Sarah", last_modified: at }]);
    const page = (id: string, name: string, children: unknown[] = []) => ({ id, name, type: "CANVAS", children });
    figma.seedFile("F1", {
      document: {
        type: "DOCUMENT",
        children: [
          page("0:1", "- - - 🖼️ Cover - - -", [
            { id: "1:1", type: "FRAME", name: "Cover", children: [{ id: "1:2", type: "TEXT", characters: "Cards 733 & 812" }] },
          ]),
          page("0:2", "- - - 📐 Specs - - -", [{ id: "2:1", type: "TEXT", characters: "Card 4040 is not on the Cover" }]),
          page("0:3", "Card 1002 flows"),
        ],
      } as never,
    });
    figma.seedFile("F2", { document: { type: "DOCUMENT", children: [page("0:1", "Flows")] } as never });
    figma.seedFile("F3", { document: { type: "DOCUMENT", children: [page("0:1", "Card 9 flows")] } as never });
    const listingStore = box<TidyListing | null>(null);
    const refs = box<TidyRefs | null>({ F2: { modified: at, cards: [] }, GONE: { modified: at, cards: [1] } });
    let headroom = 100;
    const deps = {
      figma: {
        teamFolders: (id: string) => figma.teamFolders(id),
        folderFiles: (id: string) => figma.folderFiles(id),
        file: async (key: string, o?: { depth?: number; ids?: readonly string[] }) => {
          headroom -= 3;
          return figma.file(key, o);
        },
      },
      teams: [UNIVERSAL],
      listing: listingStore.store,
      refs: refs.store,
      meter: { headroom: () => ({ subrequests: headroom }) },
      runDate: RUN_DATE,
    };
    // The listing first, with no room for any page read.
    headroom = 5;
    let lists = 0;
    deps.figma.folderFiles = (id: string) => {
      lists += 1;
      return figma.folderFiles(id);
    };
    while (listingStore.b.value?.tasks.length !== 0) {
      headroom = 5;
      await runTidyRead(deps);
    }
    assert.equal(figma.calls().filter((c) => c.method === "file").length, 0);
    headroom = 3 * 3; // one file's two reads, and no third
    const first = await runTidyRead(deps);
    assert.deepEqual(refs.b.value, { F1: { modified: at, cards: [1002, 733, 812] }, F2: { modified: at, cards: [] } }, "a file the listing no longer has is forgotten");
    assert.match(first.summary, /next job/);
    headroom = 100;
    await runTidyRead(deps);
    assert.deepEqual((refs.b.value as TidyRefs).F3, { modified: at, cards: [9] });
    const read = figma.calls().filter((c) => c.method === "file").map((c) => c.args[0]);
    assert.deepEqual(read, ["F1", "F1", "F3"], "unchanged, Archive and kit files are not read; a file with no Cover is one read");
    await runTidyRead(deps);
    assert.equal(figma.calls().filter((c) => c.method === "file").length, 3, "a finished week reads nothing more");
    assert.ok(lists > 0);
  });

  it("keeps Tier 1 within Figma's pacing across all of Monday's read jobs", async () => {
    const clock = { t: 0 };
    const tier1: number[] = [];
    let used = 0;
    const at = "2026-10-01T00:00:00Z";
    const files = Array.from({ length: 60 }, (_, i) => ({ key: `F${i}`, name: `Project ${i} / Card ${i + 1} / Sarah`, last_modified: at }));
    const pages = [
      { id: "0:1", name: "- - - 🖼️ Cover - - -", type: "CANVAS", children: [{ id: "1:1", type: "TEXT", characters: "Card 1" }] },
      { id: "0:2", name: "Flows", type: "CANVAS" },
    ];
    // One client for every job, as `figmaClientFor` keeps one per Env; its
    // sleep moves the clock, so the pacing is what spaces the calls.
    const figma = createFigmaRestClient({
      token: "t",
      now: () => clock.t,
      sleep: async (ms) => void (clock.t += ms),
      transport: async (url) => {
        used += 1;
        const path = new URL(url).pathname;
        if (path.startsWith("/v1/files/")) tier1.push(clock.t);
        const body =
          path === `/v2/teams/${UNIVERSAL.id}/folders`
            ? { folders: [FOLDERS[1]] }
            : path === `/v2/folders/${FOLDERS[1]!.id}/files`
              ? { files }
              : { document: { type: "DOCUMENT", children: pages } };
        return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
      },
    });
    const refs = box<TidyRefs | null>(null);
    const listingStore = box<TidyListing | null>(null);
    for (let job = 0; job < TIDY_JOBS; job++) {
      used = 0;
      // Each job an alarm with a fresh 50; lookups stop at 38.
      await runTidyRead({
        figma,
        teams: [UNIVERSAL],
        listing: listingStore.store,
        refs: refs.store,
        meter: { headroom: () => ({ subrequests: 38 - used }) },
        runDate: RUN_DATE,
      });
    }
    assert.ok(tier1.length > 20, "the page reads ran");
    for (const start of tier1) {
      const inMinute = tier1.filter((t) => t >= start && t < start + 60_000).length;
      assert.ok(inMinute <= FIGMA_PER_MINUTE[1], `${inMinute} Tier 1 calls in the minute from ${start} ms`);
    }
  });

  it("reads on Monday's morning run only, and hands over every morning, after every read", () => {
    const reads = Array.from({ length: TIDY_JOBS }, (_, i) => `figma-tidy-read-${i + 1}`);
    const monday = planRun("morning", Date.parse("2026-10-12T13:00:00Z"));
    const tidy = monday.jobs.filter((j) => j.kind === "figma-tidy-read" || j.kind === "figma-tidy-post");
    assert.deepEqual(tidy.map((j) => j.key), [...reads, "figma-tidy-post"]);
    assert.deepEqual(tidy.at(-1)!.after, reads);
    const tuesday = planRun("morning", Date.parse("2026-10-13T13:00:00Z"));
    assert.deepEqual(tuesday.jobs.filter((j) => j.kind.startsWith("figma-tidy")).map((j) => j.key), ["figma-tidy-post"]);
    assert.equal(planRun("end-of-day", Date.parse("2026-10-13T10:00:00Z")).jobs.some((j) => j.kind.startsWith("figma-tidy")), false);
  });
});
