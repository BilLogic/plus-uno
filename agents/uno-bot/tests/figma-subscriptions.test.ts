// The subscription setup (#895), against the shared in-memory Figma.
//
// What an outsider sees: which subscriptions exist after a run, what the run
// says, and that a second run creates nothing. The fake answers as Figma does
// where it matters here — a team takes 20, a passcode reads back empty, and a
// webhook's delivery history is what was seeded.
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { createInMemoryFigma } from "../src/figma/in-memory";
import { FigmaRequestError, type FigmaWebhookRequest } from "../src/figma/client";
import {
  MAX_WEBHOOKS_PER_TEAM,
  SUBSCRIBABLE,
  WEBHOOK_DESCRIPTION,
  ensureSubscriptions,
  reportLines,
  statusLines,
  subscriptionStatus,
} from "../src/figma-notify/subscribe";
import { figmaTeamsFrom, selectTeams, type FigmaTeam } from "../src/figma-notify/teams";

const ENDPOINT = "https://uno-bot.example.workers.dev/figma/events";
const PASSCODE = "a-test-passcode-not-a-real-one";
const UNIVERSAL: FigmaTeam = { name: "Universal", id: "1279226364199713409" };
const TRAINING: FigmaTeam = { name: "Training", id: "1279227480162592555" };

describe("the teams", () => {
  it("are the six in wrangler.toml, Universal's id among them", () => {
    const toml = readFileSync(join(process.cwd(), "wrangler.toml"), "utf8");
    const line = /^FIGMA_TEAM_IDS = "([^"\r\n]*)"/m.exec(toml);
    assert.ok(line, "wrangler.toml [vars] has FIGMA_TEAM_IDS");
    const teams = figmaTeamsFrom(line[1]);
    assert.deepEqual(
      teams.map((t) => t.name),
      ["Universal", "Training", "Toolkit", "Admin", "Others", "MISC"],
    );
    assert.equal(teams[0]!.id, UNIVERSAL.id);
  });

  it("refuses an entry that is not name=id, or a team named twice", () => {
    assert.throws(() => figmaTeamsFrom("Universal=1279226364199713409,Training"), /"Training" is not name=id/);
    assert.throws(() => figmaTeamsFrom("Universal=12,universal=13"), /repeats Universal=12/);
    assert.throws(() => figmaTeamsFrom("Universal=12,Other=12"), /repeats/);
    assert.deepEqual(figmaTeamsFrom("  "), []);
  });

  it("are picked by name in any case, or all of them; a name it lacks creates nothing", () => {
    const teams = [UNIVERSAL, TRAINING];
    assert.deepEqual(selectTeams(teams, "universal"), [UNIVERSAL]);
    assert.deepEqual(selectTeams(teams, "Universal, Training, UNIVERSAL"), [UNIVERSAL, TRAINING]);
    assert.deepEqual(selectTeams(teams, "all"), teams);
    assert.throws(() => selectTeams(teams, "Univrsal"), /no team named "Univrsal"/);
    assert.throws(() => selectTeams(teams, " , "), /no team named/);
  });
});

describe("ensuring the subscriptions", () => {
  function figmaWith(...existing: Array<{ team: FigmaTeam; event: "FILE_COMMENT" | "FILE_UPDATE"; endpoint?: string }>) {
    const figma = createInMemoryFigma();
    return (async () => {
      for (const e of existing) {
        await figma.createWebhook({
          event_type: e.event,
          context: "team",
          context_id: e.team.id,
          endpoint: e.endpoint ?? ENDPOINT,
          passcode: "seeded",
        });
      }
      return figma;
    })();
  }

  it("lists what is missing and creates nothing on a read", async () => {
    const figma = await figmaWith();
    const report = await ensureSubscriptions({ figma, teams: [UNIVERSAL], events: ["FILE_COMMENT"], endpoint: ENDPOINT, create: false });
    assert.deepEqual(report.rows, [{ team: "Universal", event: "FILE_COMMENT", state: "missing" }]);
    assert.equal(report.stopped, false);
    assert.deepEqual(figma.writes(), []);
  });

  it("creates exactly #895's one subscription, ACTIVE, labelled, with the passcode — and a re-run creates none", async () => {
    const figma = await figmaWith();
    const first = await ensureSubscriptions({
      figma,
      teams: [UNIVERSAL],
      events: ["FILE_COMMENT"],
      endpoint: ENDPOINT,
      passcode: PASSCODE,
      create: true,
    });
    assert.deepEqual(first.rows.map((r) => [r.team, r.event, r.state, r.status]), [["Universal", "FILE_COMMENT", "created", "ACTIVE"]]);
    assert.deepEqual(figma.writes(), [
      {
        method: "createWebhook",
        args: [
          {
            event_type: "FILE_COMMENT",
            context: "team",
            context_id: UNIVERSAL.id,
            endpoint: ENDPOINT,
            passcode: PASSCODE,
            status: "ACTIVE",
            description: WEBHOOK_DESCRIPTION,
          },
          undefined,
        ],
      },
    ]);

    const again = await ensureSubscriptions({
      figma,
      teams: [UNIVERSAL],
      events: ["FILE_COMMENT"],
      endpoint: ENDPOINT,
      passcode: PASSCODE,
      create: true,
    });
    assert.deepEqual(again.rows.map((r) => r.state), ["exists"]);
    assert.equal(figma.writes().length, 1, "the re-run created nothing");
  });

  it("creates only what is missing across teams and events", async () => {
    const figma = await figmaWith({ team: UNIVERSAL, event: "FILE_COMMENT" });
    const report = await ensureSubscriptions({
      figma,
      teams: [UNIVERSAL, TRAINING],
      events: ["FILE_COMMENT", "FILE_UPDATE"],
      endpoint: ENDPOINT,
      passcode: PASSCODE,
      create: true,
    });
    assert.deepEqual(
      report.rows.map((r) => `${r.team} ${r.event} ${r.state}`),
      ["Universal FILE_COMMENT exists", "Universal FILE_UPDATE created", "Training FILE_COMMENT created", "Training FILE_UPDATE created"],
    );
  });

  it("brings the six teams to their 12 — the 11 #895 left — and a re-run creates none (#896)", async () => {
    const toml = readFileSync(join(process.cwd(), "wrangler.toml"), "utf8");
    const six = figmaTeamsFrom(/^FIGMA_TEAM_IDS = "([^"\r\n]*)"/m.exec(toml)![1]);
    // #895's one subscription is already there.
    const figma = await figmaWith({ team: UNIVERSAL, event: "FILE_COMMENT" });
    const run = (create: boolean) =>
      ensureSubscriptions({ figma, teams: selectTeams(six, "all"), events: SUBSCRIBABLE, endpoint: ENDPOINT, passcode: PASSCODE, create });
    const tally = (rows: { state: string }[]) => rows.reduce<Record<string, number>>((n, r) => ({ ...n, [r.state]: (n[r.state] ?? 0) + 1 }), {});

    assert.deepEqual(tally((await run(false)).rows), { exists: 1, missing: 11 });
    const made = await run(true);
    assert.deepEqual(tally(made.rows), { exists: 1, created: 11 });
    assert.equal(made.stopped, false);
    const again = await run(true);
    assert.deepEqual(tally(again.rows), { exists: 12 });
    assert.equal(figma.writes().length, 1 + 11, "the re-run created nothing");
    assert.equal(new Set(again.rows.map((r) => `${r.team} ${r.event}`)).size, 12, "one per team and event");
  });

  it("creates a team's first while it has room, refuses its second at Figma's limit, and stops", async () => {
    const figma = createInMemoryFigma();
    for (let i = 0; i < MAX_WEBHOOKS_PER_TEAM - 1; i++) {
      await figma.createWebhook({ event_type: "FILE_UPDATE", context: "team", context_id: TRAINING.id, endpoint: `https://x.example/${i}`, passcode: "p" });
    }
    const report = await ensureSubscriptions({ figma, teams: [TRAINING, UNIVERSAL], events: SUBSCRIBABLE, endpoint: ENDPOINT, passcode: PASSCODE, create: true });
    assert.deepEqual(report.rows.map((r) => `${r.team} ${r.event} ${r.state}`), ["Training FILE_COMMENT created", "Training FILE_UPDATE refused"]);
    assert.equal(report.stopped, true, "Universal is not tried");
  });

  it("lists a subscription pointing elsewhere and leaves it alone", async () => {
    const figma = await figmaWith({ team: UNIVERSAL, event: "FILE_COMMENT", endpoint: "https://old.example/hook" });
    const report = await ensureSubscriptions({ figma, teams: [UNIVERSAL], events: ["FILE_COMMENT"], endpoint: ENDPOINT, create: false });
    assert.deepEqual(report.rows.map((r) => r.state), ["missing"]);
    assert.equal(report.foreign.length, 1);
    assert.equal(report.foreign[0]!.endpoint, "https://old.example/hook");
    assert.match(reportLines(report, ENDPOINT).join("\n"), /pointing at https:\/\/old\.example\/hook, left as it is/);
  });

  it("refuses to create on a team already at Figma's limit, and stops there", async () => {
    const figma = createInMemoryFigma();
    for (let i = 0; i < MAX_WEBHOOKS_PER_TEAM; i++) {
      await figma.createWebhook({ event_type: "FILE_UPDATE", context: "team", context_id: UNIVERSAL.id, endpoint: `https://x.example/${i}`, passcode: "p" });
    }
    const report = await ensureSubscriptions({
      figma,
      teams: [UNIVERSAL, TRAINING],
      events: ["FILE_COMMENT"],
      endpoint: ENDPOINT,
      passcode: PASSCODE,
      create: true,
    });
    assert.deepEqual(report.rows.map((r) => r.state), ["refused"]);
    assert.equal(report.stopped, true);
    assert.equal(figma.writes().length, MAX_WEBHOOKS_PER_TEAM, "nothing more was created, on either team");
  });

  it("stops at the first failure, so setup cannot half-break across teams", async () => {
    const figma = await figmaWith();
    figma.failNext("createWebhook", new FigmaRequestError(403, "Figma webhook create 403: only team admins can create webhooks"));
    const report = await ensureSubscriptions({
      figma,
      teams: [UNIVERSAL, TRAINING],
      events: ["FILE_COMMENT"],
      endpoint: ENDPOINT,
      passcode: PASSCODE,
      create: true,
    });
    assert.deepEqual(report.rows.map((r) => [r.team, r.state]), [["Universal", "failed"]]);
    assert.match(report.rows[0]!.detail!, /403/);
    assert.equal(report.stopped, true);
    assert.equal(figma.writes().length, 0);
    assert.match(reportLines(report, ENDPOINT).join("\n"), /Stopped there/);
  });

  it("creates nothing without a usable passcode, before reading anything", async () => {
    const figma = await figmaWith();
    const base = { figma, teams: [UNIVERSAL], events: ["FILE_COMMENT" as const], endpoint: ENDPOINT, create: true };
    await assert.rejects(ensureSubscriptions(base), /FIGMA_WEBHOOK_PASSCODE is not set/);
    await assert.rejects(ensureSubscriptions({ ...base, passcode: "x".repeat(101) }), /longer than Figma's 100/);
    assert.deepEqual(figma.calls(), []);
  });

  it("never prints the passcode", async () => {
    const figma = await figmaWith();
    const report = await ensureSubscriptions({
      figma,
      teams: [UNIVERSAL],
      events: ["FILE_COMMENT"],
      endpoint: ENDPOINT,
      passcode: PASSCODE,
      create: true,
    });
    assert.ok(!reportLines(report, ENDPOINT).join("\n").includes(PASSCODE));
  });
});

describe("the deliveries", () => {
  const delivery = (sentAt: string, type: string, status: number | null, error?: string): FigmaWebhookRequest => ({
    webhook_id: "?",
    request_info: {
      endpoint: ENDPOINT,
      // What Figma records carries the passcode and the comment; none of it may print.
      payload: { event_type: type, passcode: PASSCODE, comment: [{ text: "a private comment" }] } as { event_type: string },
      sent_at: sentAt,
    },
    response_info: status === null ? null : { status, received_at: sentAt },
    ...(error ? { error_msg: error } : {}),
  });

  it("shows the PING and the first comment, newest first, and nothing of their payloads", async () => {
    const figma = createInMemoryFigma();
    const hook = await figma.createWebhook({ event_type: "FILE_COMMENT", context: "team", context_id: UNIVERSAL.id, endpoint: ENDPOINT, passcode: "p" });
    figma.seedWebhookRequests(hook.id, [
      delivery("2026-10-05T14:00:00Z", "PING", 200),
      delivery("2026-10-05T14:20:00Z", "FILE_COMMENT", 200),
      delivery("2026-10-05T14:25:00Z", "FILE_COMMENT", 401),
      delivery("2026-10-05T14:30:00Z", "FILE_COMMENT", null, "timed out"),
    ]);
    const status = await subscriptionStatus({ figma, teams: [UNIVERSAL], endpoint: ENDPOINT, limit: 3 });
    assert.deepEqual(status[0]!.deliveries, [
      { sentAt: "2026-10-05T14:30:00Z", type: "FILE_COMMENT", answered: "no answer", error: "timed out" },
      { sentAt: "2026-10-05T14:25:00Z", type: "FILE_COMMENT", answered: "401" },
      { sentAt: "2026-10-05T14:20:00Z", type: "FILE_COMMENT", answered: "200" },
    ]);
    const printed = statusLines(status, ENDPOINT).join("\n");
    assert.match(printed, /^Universal FILE_COMMENT \(webhook webhook-1, ACTIVE\):/);
    assert.ok(!printed.includes(PASSCODE) && !printed.includes("private comment"), printed);
  });

  it("says so when nothing points here, or a history cannot be read", async () => {
    const figma = createInMemoryFigma();
    assert.deepEqual(statusLines(await subscriptionStatus({ figma, teams: [UNIVERSAL], endpoint: ENDPOINT }), ENDPOINT), [
      `No subscription points at ${ENDPOINT} on these teams.`,
    ]);
    await figma.createWebhook({ event_type: "FILE_COMMENT", context: "team", context_id: UNIVERSAL.id, endpoint: ENDPOINT, passcode: "p" });
    figma.failNext("webhookRequests", new FigmaRequestError(429, "Figma webhook requests 429: rate limited"));
    const status = await subscriptionStatus({ figma, teams: [UNIVERSAL], endpoint: ENDPOINT });
    assert.match(status[0]!.detail!, /429/);
    assert.match(statusLines(status, ENDPOINT).join("\n"), /history unreadable/);
  });
});
