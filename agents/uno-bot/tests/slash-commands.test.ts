import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { handleSlashCommand } from "../src/slack/commands";
import { SLASH_STOP_RECEIPT } from "../src/slack/stop-doors";
import type { Env } from "../src/types";

// The three slash commands are system controls — /grind and /chill set an
// effort mode, /stop cancels — and the manifest declares exactly those three.
// Each test reads the synchronous ephemeral reply; the work behind it runs in
// ctx.waitUntil, which this fake swallows so no test reaches Slack.

const ctx = {
  waitUntil: (p: Promise<unknown>) => void p.catch(() => {}),
  passThroughOnException: () => {},
} as unknown as ExecutionContext;

const env = {} as Env;

function form(command: string, text = ""): URLSearchParams {
  return new URLSearchParams({
    command,
    text,
    user_id: "U123",
    channel_id: "C123",
    response_url: "",
  });
}

async function reply(command: string, text = ""): Promise<string> {
  const res = handleSlashCommand(env, form(command, text), ctx);
  const body = (await res.json()) as { response_type: string; text: string };
  assert.equal(body.response_type, "ephemeral");
  return body.text;
}

function manifestCommands(): string[] {
  const yaml = readFileSync(resolve(process.cwd(), "slack-app-manifest.yaml"), "utf8");
  const section = yaml.split("\n  slash_commands:")[1]?.split(/\n  [a-z_]+:/)[0] ?? "";
  return [...section.matchAll(/- command:\s*(\S+)/g)].map((m) => m[1]!);
}

test("the manifest declares exactly /grind, /chill and /stop", () => {
  assert.deepEqual(manifestCommands().sort(), ["/chill", "/grind", "/stop"]);
});

test("/stop answers with the stop receipt", async () => {
  assert.equal(await reply("/stop"), SLASH_STOP_RECEIPT);
});

test("/grind with a question takes a harder run", async () => {
  assert.equal(await reply("/grind", "is the badge spec current?"), "Taking a harder run at that — watch the thread.");
});

test("/chill with a question keeps it quick", async () => {
  assert.equal(await reply("/chill", "who owns card 12?"), "Keeping it quick — watch the thread.");
});

test("/grind and /chill without a question answer with usage", async () => {
  assert.match(await reply("/grind"), /^Usage: `\/grind <your question>`/);
  assert.match(await reply("/chill"), /^Usage: `\/chill <your question>`/);
});

test("a retired skill command gets the unknown-command reply and starts nothing", async () => {
  let started = 0;
  const counting = {
    waitUntil: () => void started++,
    passThroughOnException: () => {},
  } as unknown as ExecutionContext;
  const res = handleSlashCommand(env, form("/uno-research", "what is open?"), counting);
  const body = (await res.json()) as { text: string };
  assert.match(body.text, /isn't a command I know/);
  assert.match(body.text, /`\/grind` · `\/chill` · `\/stop`/);
  assert.equal(started, 0);
});
