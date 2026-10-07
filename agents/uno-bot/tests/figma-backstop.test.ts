// The nightly Figma backstop (#896): a folder listing across the teams that
// queues a file change no notification reported.
//
// What an outsider sees: which changes get queued, with which claim key; which
// notes are written; and that a sweep too big for one job's budget stops
// cleanly and is finished by the next job, or the next night, listing nothing
// twice. The Figma side is the shared in-memory fake, its listings seeded the
// way the conventions probe found the six teams (five top-level folders each);
// a meter counts each listing against the job's budget as the Worker's does.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { createInMemoryFigma, type InMemoryFigma } from "../src/figma/in-memory";
import { FigmaRequestError } from "../src/figma/client";
import { BACKSTOP_JOBS } from "../src/scheduled/runs";
import {
  FIRST_LOOK_BACK_MS,
  GRACE_MS,
  LISTING_COST,
  runBackstop,
  type BackstopDeps,
  type BackstopState,
} from "../src/figma-notify/backstop";
import { CHANGED_PREFIX, CHANGED_TTL_S, type FigmaEventJob } from "../src/figma-notify/event";
import type { FigmaTeam } from "../src/figma-notify/teams";
import { runBackstopOnEnv } from "../src/figma-notify/env";
import type { Env } from "../src/types";

const HOUR = 60 * 60 * 1000;
/** The end-of-day run: 00:00 ET on Oct 8, 2026. */
const MIDNIGHT = Date.parse("2026-10-08T04:00:00Z");
const iso = (ms: number) => new Date(ms).toISOString();

const UNIVERSAL: FigmaTeam = { name: "Universal", id: "1279226364199713409" };
const TRAINING: FigmaTeam = { name: "Training", id: "1279227480162592555" };

/** A Figma whose teams each hold `folders`, every folder seeded with `files`. */
function teamsWith(teams: readonly FigmaTeam[], folders: Record<string, Record<string, Array<{ key: string; at: number }>>>): InMemoryFigma {
  const figma = createInMemoryFigma();
  for (const team of teams) {
    const mine = folders[team.name] ?? {};
    figma.seedTeam(
      team.id,
      Object.keys(mine).map((id) => ({ id, name: id })),
    );
    for (const [id, files] of Object.entries(mine)) {
      figma.seedFolder(
        id,
        files.map((f) => ({ key: f.key, name: `file ${f.key}`, last_modified: iso(f.at) })),
      );
    }
  }
  return figma;
}

interface World {
  deps: BackstopDeps;
  queued: FigmaEventJob[];
  notes: Map<string, { at: string; ttlS: number }>;
  state(): BackstopState | null;
  /** External subrequests the job has left; each listing spends one. */
  budget: { left: number };
  clock: { now: number };
}

/** The backstop's dependencies over a fake Figma, KV maps and a fake runner. */
function world(figma: InMemoryFigma, teams: readonly FigmaTeam[], opts: { notes?: Record<string, number>; budget?: number; dryRun?: boolean } = {}): World {
  const queued: FigmaEventJob[] = [];
  const claimed = new Set<string>();
  const notes = new Map(Object.entries(opts.notes ?? {}).map(([key, at]) => [`${CHANGED_PREFIX}${key}`, { at: iso(at), ttlS: CHANGED_TTL_S }]));
  let saved: BackstopState | null = null;
  const budget = { left: opts.budget ?? Infinity };
  const clock = { now: MIDNIGHT };
  const spend = <T>(p: Promise<T>) => {
    budget.left -= 1;
    return p;
  };
  return {
    queued,
    notes,
    budget,
    clock,
    state: () => saved,
    deps: {
      figma: {
        teamFolders: (id, o) => spend(figma.teamFolders(id, o)),
        folderFiles: (id, o) => spend(figma.folderFiles(id, o)),
      },
      teams,
      state: {
        get: async () => (saved ? structuredClone(saved) : null),
        put: async (s) => void (saved = structuredClone(s)),
      },
      notes: {
        get: async (key) => (notes.has(key) ? { at: notes.get(key)!.at } : null),
        put: async (key, value, ttlS) => void notes.set(key, { at: value.at, ttlS }),
      },
      async enqueueOnce(eventId, job) {
        if (claimed.has(eventId)) return "seen";
        claimed.add(eventId);
        queued.push(job);
        return "queued";
      },
      meter: { headroom: () => ({ subrequests: budget.left }) },
      now: () => clock.now,
      ...(opts.dryRun ? { dryRun: true } : {}),
    },
  };
}

const JOB = { key: "figma-backstop-1" };
/** A change inside the first sweep's window: Oct 7, early afternoon ET. */
const AFTERNOON = MIDNIGHT - 10 * HOUR;

describe("the backstop catches what no notification reported", () => {
  it("queues a change with no note once, with its claim key and the backstop's mark, and writes its note (AC 2)", async () => {
    const figma = teamsWith([UNIVERSAL], { Universal: { F1: [{ key: "FILEA", at: AFTERNOON }] } });
    const w = world(figma, [UNIVERSAL]);
    const report = await runBackstop(JOB, w.deps);

    assert.deepEqual(w.queued, [
      { eventId: `backstop:FILEA:${iso(AFTERNOON)}`, type: "FILE_UPDATE", webhookId: "backstop", fileKey: "FILEA", at: iso(AFTERNOON), via: "backstop" },
    ]);
    assert.deepEqual(w.notes.get(`${CHANGED_PREFIX}FILEA`), { at: iso(AFTERNOON), ttlS: CHANGED_TTL_S });
    assert.deepEqual(report.missed, [{ fileKey: "FILEA", at: iso(AFTERNOON) }]);
    assert.equal(report.finished, true);
    assert.equal(w.state()!.sweep, null);
    assert.equal(w.state()!.lastUntil, MIDNIGHT - GRACE_MS);
    assert.match(report.summary, /listed 2 .*: 1 file\(s\) changed, 1 with no notification, queued; sweep finished$/);
  });

  it("queues nothing for a change its notification already covers", async () => {
    // FILE_UPDATE's time is when Figma sent it, about 30 minutes after the edit.
    const figma = teamsWith([UNIVERSAL], { Universal: { F1: [{ key: "FILEA", at: AFTERNOON }] } });
    const w = world(figma, [UNIVERSAL], { notes: { FILEA: AFTERNOON + 30 * 60 * 1000 } });
    const report = await runBackstop(JOB, w.deps);
    assert.deepEqual(w.queued, []);
    assert.equal(report.inWindow, 1);
    assert.deepEqual(report.missed, []);
  });

  it("queues a file notified once and edited again with no second notification", async () => {
    const figma = teamsWith([UNIVERSAL], { Universal: { F1: [{ key: "FILEA", at: AFTERNOON }] } });
    const w = world(figma, [UNIVERSAL], { notes: { FILEA: AFTERNOON - 3 * HOUR } });
    await runBackstop(JOB, w.deps);
    assert.deepEqual(w.queued.map((j) => j.fileKey), ["FILEA"]);
    assert.equal(w.notes.get(`${CHANGED_PREFIX}FILEA`)!.at, iso(AFTERNOON), "the note moves forward");
  });

  it("leaves a change from the run's last half hour for the next sweep, which queues it", async () => {
    const late = MIDNIGHT - 20 * 60 * 1000;
    const figma = teamsWith([UNIVERSAL], { Universal: { F1: [{ key: "FILEA", at: late }] } });
    const w = world(figma, [UNIVERSAL]);
    await runBackstop(JOB, w.deps);
    assert.equal(w.queued.length, 0, "it may still be notified");

    w.clock.now = MIDNIGHT + 24 * HOUR;
    await runBackstop(JOB, w.deps);
    assert.deepEqual(w.queued.map((j) => j.fileKey), ["FILEA"], "the next night's window holds it");
  });

  it("looks back only a day the first time, and from the last sweep's end after that", async () => {
    const figma = teamsWith([UNIVERSAL], {
      Universal: { F1: [{ key: "OLD", at: MIDNIGHT - GRACE_MS - FIRST_LOOK_BACK_MS - HOUR }, { key: "NEW", at: AFTERNOON }] },
    });
    const w = world(figma, [UNIVERSAL]);
    await runBackstop(JOB, w.deps);
    assert.deepEqual(w.queued.map((j) => j.fileKey), ["NEW"], "a change older than a day is not dredged up");

    // The next night: nothing new changed, so nothing is queued, the old one included.
    w.clock.now = MIDNIGHT + 24 * HOUR;
    const second = await runBackstop(JOB, w.deps);
    assert.equal(second.inWindow, 0);
    assert.equal(w.queued.length, 1);
  });

  it("lists, reads the notes and says what it would queue on a dry run, and queues and writes nothing", async () => {
    const figma = teamsWith([UNIVERSAL], { Universal: { F1: [{ key: "FILEA", at: AFTERNOON }] } });
    const w = world(figma, [UNIVERSAL], { dryRun: true });
    const report = await runBackstop(JOB, w.deps);
    assert.deepEqual(report.missed.map((m) => m.fileKey), ["FILEA"]);
    assert.match(report.summary, /would queue/);
    assert.deepEqual(w.queued, []);
    assert.equal(w.notes.size, 0);
    assert.equal(w.state(), null, "no progress is kept");
  });
});

describe("the backstop's budget (AC 3)", () => {
  /** Six teams of five folders, one changed file in each folder. */
  function sixTeams() {
    const teams = Array.from({ length: 6 }, (_, t): FigmaTeam => ({ name: `Team${t}`, id: `${1000 + t}` }));
    const folders = Object.fromEntries(
      teams.map((team, t) => [
        team.name,
        Object.fromEntries(Array.from({ length: 5 }, (_, f) => [`T${t}F${f}`, [{ key: `FILE${t}${f}`, at: AFTERNOON }]])),
      ]),
    );
    return { teams, figma: teamsWith(teams, folders) };
  }

  it("stops cleanly when the job's budget is nearly spent, keeps what is left, and the next job finishes it", async () => {
    const { teams, figma } = sixTeams();
    const w = world(figma, teams, { budget: 10 });

    const first = await runBackstop(JOB, w.deps);
    assert.equal(first.finished, false);
    assert.equal(first.listed, 10 - LISTING_COST + 1, "it stops while a listing's worth is left");
    assert.match(first.note ?? "", /budget is nearly spent/);
    assert.ok(w.state()!.sweep!.tasks.length > 0, "the rest is kept");

    // The next job: a fresh budget.
    const listedFirst = figma.calls().length;
    w.budget.left = 38;
    const second = await runBackstop({ key: "figma-backstop-2" }, w.deps);
    assert.equal(second.finished, true);
    assert.equal(figma.calls().length, 36, "6 team listings and 30 folder listings, none twice");
    assert.equal(figma.calls().length - listedFirst, second.listed);
    assert.equal(new Set(w.queued.map((j) => j.eventId)).size, 30);
    assert.equal(w.queued.length, 30, "every folder's change, once");
    assert.equal(w.state()!.lastUntil, MIDNIGHT - GRACE_MS);
  });

  it("fits the six teams in the end-of-day run's jobs at the Worker's ceiling", async () => {
    const { teams, figma } = sixTeams();
    const w = world(figma, teams);
    const reports = [];
    for (let i = 1; i <= BACKSTOP_JOBS; i++) {
      w.budget.left = 38;
      reports.push(await runBackstop({ key: `figma-backstop-${i}` }, w.deps));
    }
    assert.equal(reports[0]!.finished, true, "one job at the ceiling makes all 36");
    for (const later of reports.slice(1)) assert.equal(later.summary, "tonight's sweep has already finished");
    assert.equal(figma.calls().length, 36, "the later jobs list nothing");
  });

  it("resumes a sweep a night left unfinished, window and all, then starts the next from its end", async () => {
    const { teams, figma } = sixTeams();
    const w = world(figma, teams, { budget: 5 });
    await runBackstop(JOB, w.deps);
    const unfinished = w.state()!.sweep!;
    assert.deepEqual([unfinished.from, unfinished.until], [MIDNIGHT - GRACE_MS - FIRST_LOOK_BACK_MS, MIDNIGHT - GRACE_MS]);

    // The next night, a day later: the old sweep first, with its own window.
    w.clock.now = MIDNIGHT + 24 * HOUR;
    w.budget.left = Infinity;
    const resumed = await runBackstop(JOB, w.deps);
    assert.equal(resumed.finished, true);
    assert.equal(w.queued.length, 30, "nothing in the old window was lost");
    assert.equal(w.state()!.lastUntil, MIDNIGHT - GRACE_MS, "it ended where its own window did");

    // Then a fresh sweep, from there to the new night less its hour: no gap, no overlap.
    const fresh = await runBackstop(JOB, w.deps);
    assert.equal(fresh.inWindow, 0);
    assert.equal(w.state()!.lastUntil, MIDNIGHT + 24 * HOUR - GRACE_MS);
  });

  it("never lists a folder's change twice into the queue, even listed again after a stop", async () => {
    const figma = teamsWith([UNIVERSAL], { Universal: { F1: [{ key: "FILEA", at: AFTERNOON }] } });
    const w = world(figma, [UNIVERSAL]);
    // A job that stopped after queueing, before it could save: the next starts over.
    await runBackstop(JOB, w.deps);
    await w.deps.state.put({ sweep: null, lastUntil: null });
    w.notes.clear();
    await runBackstop(JOB, w.deps);
    assert.equal(w.queued.length, 1, "the runner's claim holds it to once");
  });
});

describe("the backstop when Figma or the runner says no", () => {
  it("skips a folder Figma says is gone, and finishes", async () => {
    const figma = teamsWith([UNIVERSAL], { Universal: { F1: [{ key: "FILEA", at: AFTERNOON }], F2: [{ key: "FILEB", at: AFTERNOON }] } });
    figma.failNext("folderFiles", new FigmaRequestError(404, "Figma folder files 404: Not found"));
    const w = world(figma, [UNIVERSAL]);
    const report = await runBackstop(JOB, w.deps);
    assert.equal(report.finished, true);
    assert.match(report.note ?? "", /404, so skipped/);
    assert.equal(w.queued.length, 1);
  });

  it("keeps a listing Figma refused for now, and stops, so the next job tries it again", async () => {
    const figma = teamsWith([UNIVERSAL, TRAINING], {
      Universal: { F1: [{ key: "FILEA", at: AFTERNOON }] },
      Training: { F2: [{ key: "FILEB", at: AFTERNOON }] },
    });
    figma.failNext("folderFiles", new FigmaRequestError(429, "Figma folder files 429: Too many requests"));
    const w = world(figma, [UNIVERSAL, TRAINING]);
    const first = await runBackstop(JOB, w.deps);
    assert.equal(first.finished, false);
    assert.match(first.note ?? "", /could not be listed .*429.* kept for the next job/);
    assert.deepEqual(w.state()!.sweep!.tasks[0], { kind: "folder", team: "Universal", folderId: "F1" });

    const second = await runBackstop({ key: "figma-backstop-2" }, w.deps);
    assert.equal(second.finished, true);
    assert.deepEqual(w.queued.map((j) => j.fileKey).sort(), ["FILEA", "FILEB"]);
  });

  it("keeps a folder whose job the runner refused, and writes no note for it", async () => {
    const figma = teamsWith([UNIVERSAL], { Universal: { F1: [{ key: "FILEA", at: AFTERNOON }] } });
    const w = world(figma, [UNIVERSAL]);
    const enqueue = w.deps.enqueueOnce;
    w.deps.enqueueOnce = async () => {
      throw new Error("the runner refused the enqueue: 500");
    };
    const first = await runBackstop(JOB, w.deps);
    assert.equal(first.finished, false);
    assert.equal(w.notes.size, 0, "no note, so the change still reads as missed");
    assert.match(first.note ?? "", /refused the job/);

    w.deps.enqueueOnce = enqueue;
    await runBackstop({ key: "figma-backstop-2" }, w.deps);
    assert.deepEqual(w.queued.map((j) => j.fileKey), ["FILEA"]);
  });

  it("does nothing, and keeps nothing, with no teams to list", async () => {
    const w = world(createInMemoryFigma(), []);
    const report = await runBackstop(JOB, w.deps);
    assert.equal(report.summary, "no teams to list");
    assert.equal(w.state(), null);
  });
});

describe("the backstop on the Worker's bindings", () => {
  const kv = {} as KVNamespace;
  const job = { key: "figma-backstop-1", kind: "figma-backstop" as const };

  it("says what it lacks, and spends nothing: no KV, no token, or teams it cannot read", async () => {
    const said = async (env: Partial<Env>) => (await runBackstopOnEnv(env as Env, job, { dryRun: false })).summary;
    assert.match(await said({}), /HARNESS_KV not bound/);
    assert.match(await said({ HARNESS_KV: kv }), /FIGMA_ACCESS_TOKEN not set/);
    assert.match(await said({ HARNESS_KV: kv, FIGMA_ACCESS_TOKEN: "t", FIGMA_TEAM_IDS: "Universal" }), /no backstop: FIGMA_TEAM_IDS: "Universal" is not name=id/);
    assert.match(await said({ HARNESS_KV: kv, FIGMA_ACCESS_TOKEN: "t", FIGMA_TEAM_IDS: " " }), /FIGMA_TEAM_IDS is empty/);
  });
});
