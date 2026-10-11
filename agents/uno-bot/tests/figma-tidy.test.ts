// The weekly Figma tidy-up, end to end on fakes: Monday's read jobs list the
// teams' stage folders, and the post job checks each file against its
// Roadmap cards, then posts one parent line in the channel and one reply per
// owner, each a shared decision report of Review cards whose pop-up answers
// are "Moved it" and "Leave as is".
//
// What an outsider sees: which files are flagged and what each card tells the
// owner to do, who is mentioned where, what is remembered from week to week,
// and when nothing posts at all.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createInMemoryFigma } from "../src/figma/in-memory";
import type { FigmaTeam } from "../src/figma-notify/teams";
import {
  runTidyPost,
  runTidyRead,
  TIDY_CARD_TTL_MS,
  type TidyCard,
  type TidyListing,
  type TidyMemory,
  type TidyPostDeps,
} from "../src/figma-tidy/run";
import { likelyCard, projectWords } from "../src/figma-tidy/checks";
import { tidyChannel } from "../src/figma-tidy/env";
import type { Env } from "../src/types";
import { planRun, TIDY_JOBS } from "../src/scheduled/runs";
import { itemProposal } from "../src/slack/decision-cards";
import { runReviewDecision, type ReviewDoorDeps } from "../src/slack/review-door";
import type { CardMessage } from "../src/slack/button-door";
import { recordingDelivery } from "../src/turn/index";
import { recordingViews } from "./helpers/recording-slack";
import { messageBlocksRefusal } from "./helpers/slack-block-rules";
import { createInMemoryThreadState, type PendingProposal, type ThreadState } from "../src/thread-state/index";

const CHANNEL = "C03FC8AS69K";
const MEMBERS = ["U0SARAH", "U0MERYEM", "U0BILL"];
const PARENT = "1760360400.000001";
/** The first owner's reply, posted second. */
const REPLY = "1760360400.000002";
const NOW = Number(PARENT) * 1000 + 10 * 60_000;
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

const card = (number: number, designStatus: string, owner: string | null, devStatus: string | null = null, title = `Card ${number} work`): TidyCard => ({
  number,
  title,
  url: `https://www.notion.so/card-${number}`,
  designStatus,
  devStatus,
  owner,
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
  blocks?: unknown[];
  threadTs?: string;
}

function postWorld(opts: {
  files: ReturnType<typeof file>[];
  cards?: TidyCard[];
  likely?: Record<string, TidyCard>;
  memory?: TidyMemory | null;
  store?: ThreadState;
  runDate?: string;
  now?: number;
}) {
  const store = opts.store ?? createInMemoryThreadState({ now: () => opts.now ?? NOW });
  const posts: Posted[] = [];
  const staged: PendingProposal[] = [];
  const marked: string[] = [];
  const memory = box<TidyMemory | null>(opts.memory ?? null);
  const list = box<TidyListing | null>(listing(opts.files));
  let n = 0;
  const deps: TidyPostDeps = {
    listing: list.store,
    memory: memory.store,
    roadmap: {
      cards: async (numbers) => (opts.cards ?? []).filter((c) => numbers.includes(c.number)),
      likely: async (project) => opts.likely?.[project] ?? null,
    },
    members: async () => [...MEMBERS],
    post: async (message, threadTs) => {
      posts.push({ ...message, ...(threadTs ? { threadTs } : {}) });
      n += 1;
      return { ok: true, ts: n === 1 ? PARENT : `1760360400.00000${n}` };
    },
    edit: async () => {},
    reports: store,
    stage: async (proposal) => {
      staged.push(proposal);
      await store.putProposal(proposal);
    },
    markThread: async (ts) => void marked.push(ts),
    channel: CHANNEL,
    runDate: opts.runDate ?? RUN_DATE,
    now: () => opts.now ?? NOW,
  };
  return { deps, posts, staged, memory, list, store, marked };
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
    const result = await runTidyPost(w.deps);
    assert.equal(result.posted, true);
    assert.equal(w.posts.length, 2, "the parent line, then one reply for the owner");
    assert.match(w.posts[0]!.text, /^Figma tidy-up for the week of Oct 12: 1 new item\.$/);
    const reply = w.posts[1]!;
    assert.equal(reply.threadTs, PARENT);
    assert.equal(messageBlocksRefusal(reply.blocks!), null);
    assert.match(JSON.stringify(reply.blocks![0]), /<@U0SARAH>, 1 of your files needs a tidy\./);
    const [c] = cardsIn(reply.blocks!);
    assert.equal(c!.title.text, "AI Indicator / Card 733 / Sarah");
    assert.equal(c!.subtitle!.text, "Wrong folder · Card 733");
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
    await runTidyPost(w.deps);
    const out: Record<string, { subtitle: string; body: string; buttons: string[] }> = {};
    for (const p of w.posts.slice(1)) {
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
    await runTidyPost(w.deps);
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

describe("the post", () => {
  const many = (n: number, owner: string, base: number) =>
    Array.from({ length: n }, (_, i) => ({ f: file("u-wip", `${owner}${i}`, `P${base + i} / Card ${base + i} / x`), c: card(base + i, "Shipped", owner) }));

  it("one reply per owner, each mentioned once, five cards at most and the rest counted; the unassigned last", async () => {
    const sarah = many(7, "U0SARAH", 100);
    const meryem = many(1, "U0MERYEM", 200);
    const w = postWorld({
      files: [...sarah.map((s) => s.f), file("u-wip", "Z", "Loose file"), ...meryem.map((s) => s.f)],
      cards: [...sarah, ...meryem].map((s) => s.c),
    });
    await runTidyPost(w.deps);
    assert.equal(w.posts[0]!.text, "Figma tidy-up for the week of Oct 12: 9 new items.");
    const replies = w.posts.slice(1);
    assert.equal(replies.length, 3);
    const lines = replies.map((r) => JSON.stringify(r.blocks![0]));
    assert.match(lines[0]!, /<@U0SARAH>, 7 of your files need a tidy: here are 5, and 2 more next week\./);
    assert.equal(lines[0]!.match(/<@/g)!.length, 1, "mentioned once");
    assert.equal(cardsIn(replies[0]!.blocks!).length, 5);
    assert.match(lines[1]!, /<@U0MERYEM>, 1 of your files needs a tidy\./);
    assert.match(lines[2]!, /1 file has no owner I could find\./);
    assert.doesNotMatch(JSON.stringify(replies[2]), /<@/);
    for (const r of replies) assert.equal(r.threadTs, PARENT);
    assert.deepEqual(w.marked, [PARENT], "the thread is marked, so replies there are not all turns");
  });

  it("stages each card as its own proposal, answered Moved it or Leave as is, by the channel's members, for six days", async () => {
    const w = postWorld({ files: [file("u-wip", "F1", "AI Indicator / Card 733 / Sarah")], cards: [card(733, "Shipped", "U0SARAH")] });
    await runTidyPost(w.deps);
    assert.equal(w.staged.length, 1);
    const [p] = w.staged;
    assert.equal(p!.proposalTs, itemProposal(REPLY, "wrong-folder-F1-733").proposalTs);
    assert.equal(p!.threadTs, PARENT);
    assert.deepEqual(p!.confirmers, MEMBERS);
    assert.equal(p!.ttlMs, TIDY_CARD_TTL_MS);
    assert.deepEqual(
      p!.choices!.map((c) => [c.label, c.verdict]),
      [
        ["Moved it", "cancel"],
        ["Leave as is", "cancel"],
      ],
    );
    assert.match(p!.proposalText, /Move it to Universal › 📐 Specs/);
    assert.doesNotMatch(`${p!.proposalText} ${p!.refuseRevision}`, /:white_check_mark:|:no_entry:|✅|⛔|\bdrop\b|\bskip\b|\bdispute\b|the Figma\b/);
  });

  it("repeat items don't reappear as new: the next week counts them still open", async () => {
    const files = [file("u-wip", "F1", "AI Indicator / Card 733 / Sarah")];
    const cards = [card(733, "Shipped", "U0SARAH")];
    const first = postWorld({ files, cards });
    await runTidyPost(first.deps);
    const memory = first.memory.b.value;
    assert.deepEqual(memory, { shown: { "F1|wrong-folder|733": RUN_DATE }, open: 1 });

    const next = postWorld({
      files: [...files, file("u-wip", "F2", "New / Card 734 / Sarah")],
      cards: [...cards, card(734, "Shipped", "U0SARAH")],
      memory,
      runDate: "2026-10-19",
    });
    next.list.b.value!.runDate = "2026-10-19";
    await runTidyPost(next.deps);
    assert.equal(next.posts[0]!.text, "Figma tidy-up for the week of Oct 19: 1 new item, and 1 still open from earlier weeks.");
    assert.deepEqual(cardsIn(next.posts[1]!.blocks!).map((c) => c.title.text), ["New / Card 734 / Sarah"]);
  });

  it("an item held past an owner's five is new the next week, and a fingerprint is forgotten after five weeks", async () => {
    const sarah = many(6, "U0SARAH", 100);
    const w = postWorld({ files: sarah.map((s) => s.f), cards: sarah.map((s) => s.c) });
    await runTidyPost(w.deps);
    assert.equal(Object.keys(w.memory.b.value!.shown).length, 5);

    const old = postWorld({
      files: [file("u-wip", "F1", "AI Indicator / Card 733 / Sarah")],
      cards: [card(733, "Shipped", "U0SARAH")],
      memory: { shown: { "F1|wrong-folder|733": "2026-09-07" }, open: 1 },
    });
    await runTidyPost(old.deps);
    assert.equal(old.posts[0]!.text, "Figma tidy-up for the week of Oct 12: 1 new item.");
  });

  it("a week with nothing new posts nothing, even with items still open", async () => {
    const w = postWorld({
      files: [file("u-wip", "F1", "AI Indicator / Card 733 / Sarah")],
      cards: [card(733, "Shipped", "U0SARAH")],
      memory: { shown: { "F1|wrong-folder|733": "2026-10-05" }, open: 1 },
    });
    const result = await runTidyPost(w.deps);
    assert.equal(result.posted, false);
    assert.deepEqual(w.posts, []);
    assert.equal(w.memory.b.value!.open, 1);
  });

  it("the week everything is fixed posts one all-clear, then goes quiet", async () => {
    const w = postWorld({ files: [], memory: { shown: { "F1|wrong-folder|733": "2026-10-05" }, open: 12 } });
    await runTidyPost(w.deps);
    assert.equal(w.posts.length, 1);
    assert.equal(w.posts[0]!.text, "*Figma tidy-up: all clear* 🎉 Last week's 12 items are fixed. Nice work.");
    assert.equal(w.memory.b.value!.open, 0);

    const after = postWorld({ files: [], memory: w.memory.b.value, runDate: "2026-10-19" });
    after.list.b.value!.runDate = "2026-10-19";
    await runTidyPost(after.deps);
    assert.deepEqual(after.posts, []);
  });

  it("posts nothing when the listing is not this week's or stopped short, and a dry run posts, stages and remembers nothing", async () => {
    const stale = postWorld({ files: [file("u-wip", "Z", "Loose")], runDate: "2026-10-19" });
    assert.equal((await runTidyPost(stale.deps)).posted, false);
    const short = postWorld({ files: [file("u-wip", "Z", "Loose")] });
    short.list.b.value!.tasks.push({ kind: "folder", team: "Universal", folderId: "u-specs" });
    assert.equal((await runTidyPost(short.deps)).posted, false);
    for (const w of [stale, short]) assert.deepEqual(w.posts, []);

    const dry = postWorld({ files: [file("u-wip", "Z", "Loose")] });
    const r = await runTidyPost(dry.deps, { dryRun: true });
    assert.match(r.summary, /would post 1 card/);
    assert.deepEqual(dry.posts, []);
    assert.deepEqual(dry.staged, []);
    assert.equal(dry.memory.b.writes, 0);
  });

  it("a card that does not stage is not remembered, so it comes back next week", async () => {
    const w = postWorld({ files: [file("u-wip", "F1", "AI Indicator / Card 733 / Sarah")], cards: [card(733, "Shipped", "U0SARAH")] });
    w.deps.stage = async () => Promise.reject(new Error("DO down"));
    await runTidyPost(w.deps);
    assert.deepEqual(w.memory.b.value!.shown, {});
  });
});

describe("answering a card in its Review", () => {
  async function answered() {
    const w = postWorld({ files: [file("u-wip", "F1", "AI Indicator / Card 733 / Sarah")], cards: [card(733, "Shipped", "U0SARAH")] });
    await runTidyPost(w.deps);
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
        { viewId: "V1", channel: CHANNEL, messageTs: itemProposal(REPLY, "wrong-folder-F1-733").proposalTs, userId, decision: "cancel", choice },
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

  it("Leave as is closes it as left, and writes nothing", async () => {
    const { answer, updates, ran } = await answered();
    await answer("leave");
    assert.deepEqual(ran, []);
    const [c] = cardsIn(updates.at(-1)!.message.blocks);
    assert.match(c!.subtitle!.text, /Left as is/);
  });

  it("only a channel member can answer", async () => {
    const { answer, updates } = await answered();
    await answer("moved", "U0OUTSIDE");
    assert.deepEqual(updates, []);
  });
});

describe("where it posts", () => {
  it("where the Figma Review-card setting says, else #plus-design", () => {
    assert.equal(tidyChannel({ PLUS_DESIGN_CHANNEL_ID: CHANNEL, FIGMA_ASK_CHANNEL_ID: "D0APTB20SK0" } as Env), "D0APTB20SK0");
    assert.equal(tidyChannel({ PLUS_DESIGN_CHANNEL_ID: CHANNEL, FIGMA_ASK_CHANNEL_ID: " " } as Env), CHANNEL);
    assert.equal(tidyChannel({ PLUS_DESIGN_CHANNEL_ID: CHANNEL } as Env), CHANNEL);
    assert.equal(tidyChannel({} as Env), null);
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
      },
      teams: [UNIVERSAL, MISC],
      listing: store.store,
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

  it("is planned in Monday's morning run only, the post after every read", () => {
    const reads = Array.from({ length: TIDY_JOBS }, (_, i) => `figma-tidy-read-${i + 1}`);
    const monday = planRun("morning", Date.parse("2026-10-12T13:00:00Z"));
    const tidy = monday.jobs.filter((j) => j.kind === "figma-tidy-read" || j.kind === "figma-tidy-post");
    assert.deepEqual(tidy.map((j) => j.key), [...reads, "figma-tidy-post"]);
    assert.deepEqual(tidy.at(-1)!.after, reads);
    const tuesday = planRun("morning", Date.parse("2026-10-13T13:00:00Z"));
    assert.equal(tuesday.jobs.some((j) => j.kind.startsWith("figma-tidy")), false);
    assert.equal(planRun("end-of-day", Date.parse("2026-10-13T04:00:00Z")).jobs.some((j) => j.kind.startsWith("figma-tidy")), false);
  });
});
