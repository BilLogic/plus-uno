// The end-of-day library poll on fakes: what the DS file published since the
// last look, owed to the repo's copy of the snapshot as a refresh (#898). The
// Figma side is a recorded /versions body served by the shared fake Figma
// (`src/figma/in-memory.ts`), run through the parsers the Worker uses.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { pollFigmaLibrary, type PollDeps, type Snapshot } from "../src/figma-poll";
import type { FigmaVersionsResponse } from "../src/figma/client";
import { createInMemoryFigma } from "../src/figma/in-memory";
import type { RefreshOwed } from "../src/figma-library/snapshot-refresh";

const FILE_KEY = "zAecJNRdvJzAUOcjV32tRX";

const VERSIONS: FigmaVersionsResponse = {
  versions: [
    { id: "2210000000000000002", label: "Badge sizes + accordion copy", description: "Adds lg badge", created_at: "2026-09-29T20:10:00Z", user: { handle: "coco" } },
    { id: "2210000000000000003", label: null, description: null, created_at: "2026-09-29T19:00:00Z", user: { handle: "autosave" } },
    { id: "2210000000000000001", label: "Previous publish", description: "", created_at: "2026-09-20T12:00:00Z", user: { handle: "bill" } },
  ],
};

/** Yesterday's publish only: the version the snapshot already knows. */
const KNOWN_VERSION_ONLY: FigmaVersionsResponse = { versions: [VERSIONS.versions![2]!] };

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

function pollDeps(versions: FigmaVersionsResponse = VERSIONS, yesterday: Snapshot | null = { lastChecked: "2026-09-28T22:00:00Z", versionIds: ["2210000000000000001"] }) {
  const snapshot = kv<Snapshot | null>(yesterday);
  const owed = kv<RefreshOwed | null>(null);
  const figma = createInMemoryFigma();
  figma.seedFile(FILE_KEY, { versions });
  const deps: PollDeps = {
    figma,
    snapshot,
    owed,
    fileKey: FILE_KEY,
    now: () => Date.UTC(2026, 8, 29, 22, 0),
  };
  return { deps, snapshot, figma, owed };
}

describe("the end-of-day poll", () => {
  const FOUND_AT = "2026-09-29T22:00:00.000Z";

  it("seeds its snapshot on the first run and owes nothing", async () => {
    const { deps, snapshot, owed } = pollDeps(VERSIONS, null);
    const result = await pollFigmaLibrary(deps);
    assert.match(result.summary, /initialized snapshot: 3 recent version/);
    assert.deepEqual(snapshot.value?.versionIds, ["2210000000000000002", "2210000000000000003", "2210000000000000001"]);
    assert.equal(owed.value, null);
  });

  it("asks Figma once: the library's versions", async () => {
    const { deps, figma } = pollDeps(KNOWN_VERSION_ONLY);
    await pollFigmaLibrary(deps);
    assert.deepEqual(
      figma.calls().map((c) => c.method),
      ["versions"],
    );
  });

  it("owes one refresh for a publish, recorded before the poll moves its snapshot on", async () => {
    const { deps, owed, snapshot } = pollDeps();
    const result = await pollFigmaLibrary(deps);
    assert.deepEqual(owed.value, { versionIds: ["2210000000000000002", "2210000000000000003"], unlabelled: ["2210000000000000003"], since: FOUND_AT });
    assert.equal(result.refreshOwed, 2);

    // A poll stopped before its snapshot write still left the refresh owed.
    const again = pollDeps();
    again.deps.snapshot.write = async () => {
      throw new Error("KV down");
    };
    await assert.rejects(pollFigmaLibrary(again.deps), /KV down/);
    assert.deepEqual(again.owed.value?.versionIds, ["2210000000000000002", "2210000000000000003"]);
    assert.equal(snapshot.value?.versionIds[0], "2210000000000000002");
  });

  it("owes nothing more when the same publish is seen again: a retry merges, a finished poll never sees it", async () => {
    const stopped = pollDeps();
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
    const { deps, owed, figma } = pollDeps();
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

  it("owes nothing on a quiet day", async () => {
    const quiet = pollDeps(KNOWN_VERSION_ONLY);
    const result = await pollFigmaLibrary(quiet.deps);
    assert.equal(quiet.owed.value, null);
    assert.equal(result.refreshOwed, undefined);
    assert.equal(result.summary, "nothing published since last check");
  });

  it("owes a refresh for a publish left with no label or description", async () => {
    const unlabelled = pollDeps({
      versions: [
        { id: "2210000000000000006", label: null, description: null, created_at: "2026-09-29T21:00:00Z", user: { handle: "bill" } },
        VERSIONS.versions![2]!,
      ],
    });
    const result = await pollFigmaLibrary(unlabelled.deps);
    assert.deepEqual(unlabelled.owed.value, { versionIds: ["2210000000000000006"], unlabelled: ["2210000000000000006"], since: FOUND_AT });
    assert.equal(result.refreshOwed, 1);

    await pollFigmaLibrary(unlabelled.deps);
    assert.equal(unlabelled.owed.writes.length, 1, "the next poll knows the version: nothing new is owed");
  });

  it("reads a snapshot an older poll kept, components and all, by its version ids", async () => {
    const older = { lastChecked: "2026-09-28T22:00:00Z", components: [{ key: "k" }], versionIds: ["2210000000000000001"], nodeHashes: { "1:1": "h" } } as unknown as Snapshot;
    const { deps, owed, snapshot } = pollDeps(VERSIONS, older);
    await pollFigmaLibrary(deps);
    assert.deepEqual(owed.value?.versionIds, ["2210000000000000002", "2210000000000000003"]);
    assert.deepEqual(Object.keys(snapshot.value ?? {}).sort(), ["lastChecked", "versionIds"], "the old fields are dropped on the write");
  });

  it("says what it would owe on a dry run, and writes nothing", async () => {
    const { deps, owed, snapshot } = pollDeps();
    const result = await pollFigmaLibrary(deps, { dryRun: true });
    assert.equal(result.refreshOwed, 2);
    assert.deepEqual(owed.writes, []);
    assert.deepEqual(snapshot.writes, []);
  });
});
