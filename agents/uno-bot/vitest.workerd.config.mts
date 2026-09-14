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
// `include` is a single file. If a second workerd test is ever justified it
// should be a deliberate edit here, with a reason, not a glob that quietly
// grows.
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
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [cloudflareTest({ wrangler: { configPath: "./wrangler.toml" } })],
  test: {
    include: ["tests/workerd/thread-state.conformance.test.ts"],
  },
});
