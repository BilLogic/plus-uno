// The SECOND test runner, scoped to one file on purpose (#493, spec #490).
//
// `npm test` stays on `node --test`: 458 assertions over pure modules that need
// no runtime, and paying for workerd on all of them would be a tax on every
// test in the repository. Exactly one suite genuinely needs Cloudflare's
// runtime — the ThreadState conformance suite run against the Durable Object
// adapter, where the thing under test IS Durable Object RPC, SQLite storage and
// the input gate that makes "the delete is the claim" true. miniflare runs the
// real workerd binary, so a pass here is evidence about production rather than
// about a mock.
//
// `include` names each file. If another workerd test is ever justified it
// should be a deliberate edit here, with a reason, not a glob that quietly
// grows. The second is the UsageLog conformance suite (ADR-030), for the same
// reason as the first: what is under test is the D1 adapter against real
// SQLite with the real migrations applied, which no Node fake is evidence
// about. The third is the sweep records suite, for the same reason and on the
// same database (migrations/usage/0002_sweep.sql), and the fourth the commitment
// records suite (0006_commitments.sql). Their `USAGE_DB` binding
// comes from wrangler.toml like the rest;
// miniflare backs it with a local, per-run D1 and never contacts the account.
// The migrations are read here, in Node, and handed to the test as the
// `USAGE_MIGRATIONS` binding, because the Workers runtime has no filesystem.
// The fifth is the metric queries suite: every query file in queries/usage/ is
// run against that same migrated local D1, seeded, with its numbers asserted —
// a query is SQL for D1's SQLite, and only that SQLite is evidence it runs.
// The files are read here too, as the `METRIC_QUERIES` binding.
//
// The wrangler config is the source of the bindings: the THREAD_STATE Durable
// Object binding, the `new_sqlite_classes` migration and
// `compatibility_date = "2026-05-01"` (which is what makes Durable Object RPC
// available) are read from wrangler.toml rather than restated here, so the test
// runs against the deployment's own configuration.
//
// Shape note: @cloudflare/vitest-pool-workers ≥ 0.22 (vitest 4/5) is a VITE
// PLUGIN — `cloudflareTest()` in `plugins`, not `defineWorkersConfig` with
// `test.poolOptions.workers`, which is the pre-0.22 form most examples online
// still show.
import { readdirSync, readFileSync } from "node:fs";

import { cloudflareTest, readD1Migrations } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

const usageMigrations = await readD1Migrations("./migrations/usage");
const metricQueries = Object.fromEntries(
  readdirSync("./queries/usage")
    .filter((f) => f.endsWith(".sql"))
    .map((f) => [f.replace(/\.sql$/, ""), readFileSync(`./queries/usage/${f}`, "utf8")]),
);

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.toml" },
      miniflare: { bindings: { USAGE_MIGRATIONS: usageMigrations, METRIC_QUERIES: metricQueries } },
    }),
  ],
  test: {
    include: [
      "tests/workerd/thread-state.conformance.test.ts",
      "tests/workerd/usage-log.conformance.test.ts",
      "tests/workerd/sweep-records.conformance.test.ts",
      "tests/workerd/commitment-records.conformance.test.ts",
      "tests/workerd/metric-queries.test.ts",
    ],
  },
});
