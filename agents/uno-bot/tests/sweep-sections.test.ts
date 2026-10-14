// A job's hand-off to the sweep's morning post: kept by place in the run's
// storage, claimed by a report, and kept, marked card by card, until its job
// has staged what showed.

import { test } from "node:test";
import assert from "node:assert/strict";

import { aloneKeyOf, handedSection, isAloneKey, sectionHandOffIn } from "../src/sweep/sections";

function memoryStorage() {
  const map = new Map<string, unknown>();
  return {
    map,
    get: async <T>(key: string) => structuredClone(map.get(key)) as T | undefined,
    put: async (key: string, value: unknown) => void map.set(key, structuredClone(value)),
    delete: async (key: string) => map.delete(key),
  };
}

const DATE = "2026-10-14";
const TOP = { channel: "C0UNIVERSAL", threadTs: null };

function section(storage = memoryStorage()) {
  const handOff = sectionHandOffIn<{ ids: string[] }>(storage, "weekly");
  const calls: string[] = [];
  const port = handedSection({
    source: "weekly",
    date: DATE,
    handOff,
    cardsOf: (value) => ({
      cards: value.ids.map((id) => ({ person: null, item: { id, title: id, body: "", open: { label: "Open", url: "https://example.com" } } })),
      whole: true,
      says: (ids) => `${ids.length} found.`,
    }),
    posted: async (value, _place, shown) => void calls.push(`posted ${shown.join(",")} of ${value.ids.join(",")}`),
    notPosted: async (_value, _place, why) => void calls.push(`not posted: ${why}`),
  });
  return { storage, handOff, port, calls };
}

test("a hand-off keeps one value a place a morning, under its job's key", async () => {
  const s = section();
  await s.handOff.put(DATE, TOP, { ids: ["a"] });
  await s.handOff.put(DATE, TOP, { ids: ["a", "b"] });
  assert.deepEqual([...s.storage.map.keys()], [`section:weekly:${DATE}`]);
  const [place] = await s.port.waiting();
  assert.equal(place!.source, "weekly");
  assert.deepEqual(place!.cards.map((c) => c.item.id), ["a", "b"]);
  assert.equal(place!.whole, true);
});

test("a claimed place is not waiting, is found by its report's key, and comes back when given back", async () => {
  const s = section();
  await s.handOff.put(DATE, TOP, { ids: ["a"] });
  const [place] = await s.port.waiting();
  await s.port.claim(place!, `${DATE}:card`);
  assert.deepEqual(await s.port.waiting(), []);
  assert.equal((await s.port.claimed(`${DATE}:card`))?.channel, TOP.channel);
  assert.deepEqual(await s.port.stranded(DATE), [], "a report's claim is the sweep's to finish");
  await s.port.unclaim(`${DATE}:card`);
  assert.equal((await s.port.waiting()).length, 1);
});

test("a message of sections alone that never finished is stranded until posted", async () => {
  const s = section();
  await s.handOff.put(DATE, TOP, { ids: ["a"] });
  const [place] = await s.port.waiting();
  const key = aloneKeyOf(DATE, TOP);
  assert.ok(isAloneKey(key));
  await s.port.claim(place!, key);
  assert.deepEqual((await s.port.stranded(DATE)).map((p) => p.cardKey), [key]);

  await s.port.posted(place!, ["a"], { ts: "1.0", text: "" });
  assert.deepEqual(s.calls, ["posted a of a"]);
  assert.equal(s.storage.map.size, 0, "cleared once it staged");
  // Twice is once.
  await s.port.posted(place!, ["a"], { ts: "1.0", text: "" });
  await s.port.notPosted(place!, "late");
  assert.deepEqual(s.calls, ["posted a of a"]);
});

test("a stop part-way through staging keeps the place, and the retry carries on from the marks", async () => {
  const storage = memoryStorage();
  const handOff = sectionHandOffIn<{ ids: string[] }>(storage, "weekly");
  const staged: string[] = [];
  let stopAfter = 1;
  const port = handedSection({
    source: "weekly",
    date: DATE,
    handOff,
    cardsOf: (value) => ({
      cards: value.ids.map((id) => ({ person: null, item: { id, title: id, body: "", open: { label: "Open", url: "https://example.com" } } })),
      says: (ids) => `${ids.length} found.`,
    }),
    posted: async (_value, _place, shown, _report, progress) => {
      for (const id of shown) {
        if (progress.done.has(id)) continue;
        if (stopAfter-- <= 0) throw new Error("subrequest budget");
        staged.push(id);
        await progress.mark(id, true);
      }
    },
    notPosted: async () => {},
  });
  await handOff.put(DATE, TOP, { ids: ["a", "b", "c"] });
  const [place] = await port.waiting();
  await port.claim(place!, aloneKeyOf(DATE, TOP));
  await assert.rejects(port.posted(place!, ["a", "b"], { ts: "1.0", text: "" }));
  assert.deepEqual(staged, ["a"]);
  assert.equal((await port.stranded(DATE)).length, 1, "still claimed, for the retry");

  stopAfter = 9;
  await port.posted(place!, ["a", "b"], { ts: "1.0", text: "" });
  assert.deepEqual(staged, ["a", "b"], "a is not staged twice");
  assert.equal(storage.map.size, 0);
});
