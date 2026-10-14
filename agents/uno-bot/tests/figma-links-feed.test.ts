// The merged-PR feed for Dev Mode links: which merged PRs reach the queue,
// and with which components.

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { feedMergedPrs, type FeedDeps, type MergedPull, type SeenMark } from "../src/figma-links/feed";
import type { QueuedPrLinks } from "../src/figma-links/queue";
import type { DevLinkRegistry } from "../src/figma-links/links";

const REGISTRY: DevLinkRegistry = {
  components: {
    Button: { code: { source: "design-system/src/components/actions/Button/Button.jsx" } },
    Checkbox: { code: { source: "design-system/src/components/forms-and-inputs/Checkbox.jsx" } },
    Footer: { code: { source: "design-system/src/specs/Universal/Sections/Footer/Footer.jsx" } },
  },
};

const pull = (number: number, mergedAt: string): MergedPull => ({
  number,
  url: `https://github.com/BilLogic/plus-uno/pull/${number}`,
  mergedAt,
});

function world(opts: {
  pulls: MergedPull[];
  files: Record<number, string[]>;
  mark?: SeenMark | null;
  /** The page came back full, its oldest pull updated then. */
  full?: string;
  failing?: number[];
}) {
  let queue: QueuedPrLinks[] = [];
  let mark: SeenMark | null = opts.mark === undefined ? { mergedAt: "2026-10-13T00:00:00Z", number: 0 } : opts.mark;
  const filesAsked: number[] = [];
  const deps: FeedDeps = {
    mergedPulls: async () => ({
      pulls: opts.pulls,
      full: !!opts.full,
      oldestUpdatedAt: opts.full ?? opts.pulls.map((p) => p.mergedAt).sort()[0] ?? null,
    }),
    pullFiles: async (n) => {
      filesAsked.push(n);
      if (opts.failing?.includes(n)) throw new Error("GitHub 502");
      return opts.files[n] ?? [];
    },
    registry: async () => REGISTRY,
    queue: { read: async () => queue, write: async (q) => void (queue = q) },
    mark: { read: async () => mark, write: async (m) => void (mark = m) },
  };
  return { deps, queue: () => queue, mark: () => mark, filesAsked };
}

describe("the merged-PR feed", () => {
  it("a merged PR touching two component folders queues a link for each component", async () => {
    const w = world({
      pulls: [pull(1300, "2026-10-14T10:00:00Z")],
      files: {
        1300: [
          "design-system/src/components/actions/Button/Button.jsx",
          "design-system/src/components/actions/Button/Button.stories.jsx",
          "design-system/src/components/forms-and-inputs/Checkbox.scss",
        ],
      },
    });
    await feedMergedPrs(w.deps);
    assert.deepEqual(w.queue(), [
      { pr: { number: 1300, url: "https://github.com/BilLogic/plus-uno/pull/1300" }, components: ["Button", "Checkbox"] },
    ]);
  });

  it("a merged PR touching nothing under components queues nothing, and is not read again", async () => {
    const w = world({
      pulls: [pull(1301, "2026-10-14T10:00:00Z")],
      files: { 1301: ["agents/uno-bot/src/index.ts", "design-system/src/specs/Universal/Sections/Footer/Footer.jsx"] },
    });
    await feedMergedPrs(w.deps);
    assert.deepEqual(w.queue(), []);
    assert.deepEqual(w.mark(), { mergedAt: "2026-10-14T10:00:00Z", number: 1301 });
  });

  it("a PR already seen queues nothing and its files are not read", async () => {
    const w = world({
      pulls: [pull(1302, "2026-10-14T10:00:00Z")],
      files: { 1302: ["design-system/src/components/actions/Button/Button.jsx"] },
      mark: { mergedAt: "2026-10-14T10:00:00Z", number: 1302 },
    });
    const { summary } = await feedMergedPrs(w.deps);
    assert.deepEqual(w.queue(), []);
    assert.deepEqual(w.filesAsked, []);
    assert.match(summary, /no PR merged since the last run/);
  });

  it("a folder no registry component sits in is skipped and named in the run note", async () => {
    const w = world({
      pulls: [pull(1303, "2026-10-14T10:00:00Z")],
      files: { 1303: ["design-system/src/components/_internal/Footer/Footer.jsx"] },
    });
    const { summary } = await feedMergedPrs(w.deps);
    assert.deepEqual(w.queue(), []);
    assert.match(summary, /#1303: no registry component for _internal\/Footer, skipped/);
  });

  it("a first run marks the newest merge and queues nothing", async () => {
    const w = world({
      pulls: [pull(1305, "2026-10-14T11:00:00Z"), pull(1304, "2026-10-14T10:00:00Z")],
      files: { 1305: ["design-system/src/components/actions/Button/Button.jsx"] },
      mark: null,
    });
    await feedMergedPrs(w.deps);
    assert.deepEqual(w.queue(), []);
    assert.deepEqual(w.filesAsked, []);
    assert.deepEqual(w.mark(), { mergedAt: "2026-10-14T11:00:00Z", number: 1305 });
  });

  it("reads at most FILES_PER_RUN PRs, oldest first, and leaves the rest behind the mark", async () => {
    const pulls = [1, 2, 3, 4, 5, 6, 7].map((i) => pull(1310 + i, `2026-10-14T1${i}:00:00Z`)).reverse();
    const w = world({ pulls, files: {} });
    const { summary } = await feedMergedPrs(w.deps);
    assert.deepEqual(w.filesAsked, [1311, 1312, 1313, 1314, 1315]);
    assert.deepEqual(w.mark(), { mergedAt: "2026-10-14T15:00:00Z", number: 1315 });
    assert.match(summary, /2 more merged PR\(s\) wait for the next run/);
  });

  it("counts as waiting only the PRs after the one whose files failed", async () => {
    const pulls = [1, 2, 3, 4].map((i) => pull(1320 + i, `2026-10-14T1${i}:00:00Z`));
    const w = world({ pulls, files: {}, failing: [1322] });
    const { summary } = await feedMergedPrs(w.deps);
    assert.deepEqual(w.filesAsked, [1321, 1322]);
    assert.deepEqual(w.mark(), { mergedAt: "2026-10-14T11:00:00Z", number: 1321 }, "the mark stops before the failed PR");
    assert.match(summary, /#1322: files not read, kept for the next run/);
    assert.match(summary, /2 more merged PR\(s\) wait for the next run/);
  });

  it("a full page that does not reach back to the mark says PRs merged in the gap may be missed", async () => {
    const w = world({
      pulls: [pull(1331, "2026-10-14T12:00:00Z")],
      files: { 1331: ["design-system/src/components/actions/Button/Button.jsx"] },
      full: "2026-10-14T09:00:00Z",
    });
    const { summary } = await feedMergedPrs(w.deps);
    assert.deepEqual(w.queue().map((q) => q.pr.number), [1331], "what the page holds is still read");
    assert.match(summary, /PRs merged between 2026-10-13T00:00:00Z and 2026-10-14T09:00:00Z may be missing/);
  });

  it("a full page that reaches back past the mark covers every merge since, and says nothing of a gap", async () => {
    const w = world({ pulls: [pull(1332, "2026-10-14T12:00:00Z")], files: {}, full: "2026-10-12T09:00:00Z" });
    const { summary } = await feedMergedPrs(w.deps);
    assert.doesNotMatch(summary, /may be missing/);
  });
});
