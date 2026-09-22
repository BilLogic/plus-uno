// Finding a teammate by name — the read a relayed DM stands on.
//
// "Send this to Coco" names a person, and a DM needs a user id. The lookup is
// driven here through a fake directory passed by name: what is asserted is who
// comes back for a name and what the model is told to do with them — one
// match is shown as a mention to check, several are a question, none is said
// plainly — never how the pages were walked.
import { test } from "node:test";
import assert from "node:assert/strict";

import { findSlackUsers, type SlackDirectory } from "../src/tools/slack-people";
import type { SlackUserInfo } from "../src/slack/api";

const person = (id: string, real: string, display = "", extra: Partial<SlackUserInfo> = {}): SlackUserInfo => ({
  id,
  name: real.toLowerCase().replace(/\s+/g, "."),
  real_name: real,
  profile: { display_name: display, title: `${real}'s title` },
  ...extra,
});

function directory(pages: SlackUserInfo[][], opts: { error?: string } = {}): SlackDirectory & { reads: number } {
  const dir = {
    reads: 0,
    async listUsers(cursor?: string) {
      dir.reads++;
      if (opts.error) return { ok: false, error: opts.error };
      const page = cursor ? Number(cursor) : 0;
      return {
        ok: true,
        members: pages[page] ?? [],
        ...(page + 1 < pages.length ? { next_cursor: String(page + 1) } : {}),
      };
    },
  };
  return dir;
}

const TEAM = [
  person("U0COCO", "Colette Chen", "Coco"),
  person("U0MERYEM", "Meryem Aydin"),
  person("U0BILL", "Bill Guo"),
];

test("one match comes back as a mention to check", async () => {
  const result = JSON.parse(await findSlackUsers(directory([TEAM]), "coco"));
  assert.equal(result.ok, true);
  assert.deepEqual(result.matches.map((m: { id: string }) => m.id), ["U0COCO"]);
  assert.equal(result.matches[0].mention, "<@U0COCO>");
  assert.match(result.note, /<@id>|mention/i);
});

test("a first name, a surname or a display name each find the person, whatever the case or accent", async () => {
  const team = [person("U0JOSE", "José Álvarez", "Pepe")];
  for (const name of ["José", "jose", "alvarez", "Pepe"]) {
    const result = JSON.parse(await findSlackUsers(directory([team]), name));
    assert.deepEqual(result.matches.map((m: { id: string }) => m.id), ["U0JOSE"], name);
  }
});

test("a name inside a word is not a match", async () => {
  // "ryem" must not find Meryem through a letter run in the middle of a
  // word — only the start of a name counts.
  const result = JSON.parse(await findSlackUsers(directory([TEAM]), "ryem"));
  assert.deepEqual(result.matches, []);
});

test("a name that matches several people is a question, with each of them named", async () => {
  const team = [...TEAM, person("U0COCO2", "Coco Martin")];
  const result = JSON.parse(await findSlackUsers(directory([team]), "Coco"));
  assert.deepEqual(result.matches.map((m: { id: string }) => m.id).sort(), ["U0COCO", "U0COCO2"]);
  assert.match(result.note, /ask which/i);
  assert.match(result.note, /stage nothing|don't stage|do not stage/i);
});

test("nobody by that name is said plainly, with no near miss offered as the person", async () => {
  const result = JSON.parse(await findSlackUsers(directory([TEAM]), "Zed"));
  assert.equal(result.ok, true);
  assert.deepEqual(result.matches, []);
  assert.match(result.note, /never guess/i);
});

test("deactivated accounts and bots are not people to send to", async () => {
  const team = [
    person("U0GONE", "Coco Former", "", { deleted: true }),
    person("B0BOT", "Coco Bot", "", { is_bot: true }),
    person("USLACKBOT", "Slackbot"),
    ...TEAM,
  ];
  const result = JSON.parse(await findSlackUsers(directory([team]), "coco"));
  assert.deepEqual(result.matches.map((m: { id: string }) => m.id), ["U0COCO"]);
});

test("the whole directory is searched, past the first page", async () => {
  const result = JSON.parse(await findSlackUsers(directory([[TEAM[1]!, TEAM[2]!], [TEAM[0]!]]), "coco"));
  assert.deepEqual(result.matches.map((m: { id: string }) => m.id), ["U0COCO"]);
  assert.equal(result.complete, true);
});

test("a directory too big to read whole says the search was partial", async () => {
  const pages = Array.from({ length: 12 }, (_, i) => [person(`U0P${i}`, `Person ${i}`)]);
  const dir = directory(pages);
  const result = JSON.parse(await findSlackUsers(dir, "nobody"));
  assert.equal(result.complete, false);
  assert.ok(dir.reads < pages.length, "stops at its page cap");
  assert.match(result.note, /part of the workspace/i);
});

test("a directory Slack refused is an error the model can say, not an empty result", async () => {
  const result = JSON.parse(await findSlackUsers(directory([TEAM], { error: "missing_scope" }), "coco"));
  assert.equal(result.ok, false);
  assert.match(result.error, /missing_scope/);
});

test("a blank name is refused before any read", async () => {
  const dir = directory([TEAM]);
  const result = JSON.parse(await findSlackUsers(dir, "  "));
  assert.equal(result.ok, false);
  assert.equal(dir.reads, 0);
});
