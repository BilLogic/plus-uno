// The commitment store on `Env`: the records in the usage database
// (`USAGE_DB`), the wording in HARNESS_KV under `commitment:text:<id>`, each
// with an expiry past the commitment's last possible reminder.
//
// Apart from `./env.ts` because the turn's `reminder_set` tool reaches it too,
// and a tool body must not import the agent entry `./env.ts` pulls in for the
// model provider.

import type { Env } from "../types";
import { charge } from "../net";
import { createD1CommitmentRecords } from "./d1";
import type { CommitmentStore, CommitmentText, CommitmentTexts } from "./store";

const TEXT_KV_PREFIX = "commitment:text:";

/** Both halves, or null when either binding is missing. */
export function commitmentStoreFor(env: Env): CommitmentStore | null {
  if (!env.USAGE_DB || !env.HARNESS_KV) return null;
  return { ...createD1CommitmentRecords({ db: env.USAGE_DB }), ...kvTexts(env.HARNESS_KV) };
}

/** The wording in KV, one key per commitment, each with its own expiry. */
function kvTexts(kv: KVNamespace): CommitmentTexts {
  return {
    async text(id) {
      charge(1, "kv");
      return (await kv.get<CommitmentText>(`${TEXT_KV_PREFIX}${id}`, "json")) ?? null;
    },
    async saveText(id, text, until) {
      charge(1, "kv");
      // KV takes an absolute expiry in seconds, at least a minute out.
      const expiration = Math.max(Math.ceil(until / 1000), Math.ceil(Date.now() / 1000) + 120);
      await kv.put(`${TEXT_KV_PREFIX}${id}`, JSON.stringify(text), { expiration });
    },
  };
}
