// The morning's read of merged library PRs (`closedPulls`): page after page of
// the repo's closed pulls, newest update first, until a page reaches back past
// the mark — so a busy stretch of more than one page loses no PR.
//
// `net.ts` binds `fetch` when it is first evaluated, so the stub goes onto
// `globalThis` here, at load, and the code under test is imported lazily.
import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { Env } from "../src/types";

const pages: unknown[][] = [];
const asked: number[] = [];
globalThis.fetch = (async (input: RequestInfo | URL) => {
  const page = Number(new URL(String(input)).searchParams.get("page") ?? "1");
  asked.push(page);
  return Response.json(pages[page - 1] ?? []);
}) as typeof fetch;

const env = { GITHUB_TOKEN: "ghp-test" } as unknown as Env;
const entry = { repo: "BilLogic/plus-uno" } as never;

/** `n` closed pulls numbered from `from`, each updated at `updated`. */
const pulls = (from: number, n: number, updated: string) =>
  Array.from({ length: n }, (_, i) => ({
    number: from + i,
    title: `feat: Figma DS update — C${from + i}`,
    html_url: `https://github.com/BilLogic/plus-uno/pull/${from + i}`,
    merged_at: updated,
    updated_at: updated,
  }));

const read = async (since: string) => {
  const { githubLibraryReads } = await import("../src/integrations/github.js");
  return githubLibraryReads(env, entry).closedPulls(since);
};

describe("closedPulls", () => {
  it("pages past 30 until a page reaches back past the mark", async () => {
    pages.splice(0, pages.length, pulls(1, 30, "2026-10-13T12:00:00Z"), pulls(31, 30, "2026-10-12T12:00:00Z"), [
      ...pulls(61, 5, "2026-10-11T12:00:00Z"),
      ...pulls(66, 25, "2026-10-01T12:00:00Z"),
    ]);
    asked.length = 0;
    const found = await read("2026-10-10T00:00:00Z");
    assert.deepEqual(asked, [1, 2, 3], "the third page reaches back past the mark");
    assert.equal(found.filter((p) => p.mergedAt! > "2026-10-10T00:00:00Z").length, 65, "every PR merged after the mark");
  });

  it("stops at a short page, and at its page bound", async () => {
    const { MAX_PULL_PAGES } = await import("../src/integrations/github.js");
    pages.splice(0, pages.length, pulls(1, 7, "2026-10-13T12:00:00Z"));
    asked.length = 0;
    await read("2026-10-10T00:00:00Z");
    assert.deepEqual(asked, [1]);

    pages.splice(0, pages.length, ...Array.from({ length: MAX_PULL_PAGES + 2 }, (_, i) => pulls(i * 30 + 1, 30, "2026-10-13T12:00:00Z")));
    asked.length = 0;
    await read("2026-10-10T00:00:00Z");
    assert.equal(asked.length, MAX_PULL_PAGES);
  });
});
