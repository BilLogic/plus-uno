/**
 * Which model the blueprint index is built with — read from the database,
 * not from a constant in this Worker.
 *
 * WHY IT IS NOT A CONSTANT. A vector index and the caller that searches it
 * have to agree on one model, and the database already refuses the pairing
 * when they do not: `search_blueprint` raises `embedding model mismatch`
 * against `semantic_search.index_meta`. That refusal is the safety property,
 * and it is also the problem — a constant here means the model can only be
 * changed by deploying this Worker and swapping the index in the same
 * instant. Between those two events every search fails.
 *
 * Reading the row instead removes the instant. The index names its model, the
 * Worker embeds with whatever it names, and a swap is one transaction in the
 * database with no deploy beside it.
 *
 * THE CACHE, and why a mismatch clears it. One REST read per search would be
 * a round trip on the hot path for a value that changes about once a year, so
 * the answer is held for a few minutes. That leaves exactly one window: the
 * seconds after a swap, where this Worker still believes the old model. The
 * caller is expected to hand that failure back here — `forgetIndexModel()` —
 * and retry once, which turns the window into one retried search rather than
 * a few minutes of failures.
 *
 * A read that fails does NOT fail the search. It falls back to the model the
 * credentials imply, which is what this Worker did before this module
 * existed: a search that still answers is worth more than one that refuses
 * because a metadata read timed out.
 */
import { embedModelName, type EmbedCredentials } from "../vertex/embed-model";

/** How long a resolved model is trusted. */
const TTL_MS = 5 * 60 * 1000;

/** The `semantic_search` schema is not the REST default; PostgREST needs telling. */
const SCHEMA = "semantic_search";

type Cached = { model: string; at: number };

const cache = new Map<string, Cached>();

/** The mismatch the database raises when caller and index disagree. */
export const MISMATCH = "embedding model mismatch";

/** True iff this error is the index refusing the caller's declared model. */
export function isModelMismatch(error: unknown): boolean {
  return error instanceof Error && error.message.includes(MISMATCH);
}

/**
 * Drop what is cached for `source`, so the next resolve reads the row again.
 *
 * @param source - the `index_meta` source, e.g. `blueprint`
 */
export function forgetIndexModel(source = "blueprint"): void {
  cache.delete(source);
}

/**
 * The model the named index is built with.
 *
 * @param env - credentials, used only for the fallback
 * @param base - the Supabase URL
 * @param key - the REST key to read with
 * @param source - the `index_meta` source, e.g. `blueprint`
 * @param signal - abort signal for the read
 */
export async function resolveIndexModel(
  env: EmbedCredentials,
  base: string,
  key: string,
  source = "blueprint",
  signal?: AbortSignal,
): Promise<string> {
  const held = cache.get(source);
  if (held && Date.now() - held.at < TTL_MS) return held.model;

  try {
    const url = `${base}/rest/v1/index_meta?select=model&source=eq.${encodeURIComponent(source)}`;
    const res = await fetch(url, {
      headers: { apikey: key, authorization: `Bearer ${key}`, "accept-profile": SCHEMA },
      signal,
    });
    if (res.ok) {
      const rows = (await res.json().catch(() => [])) as Array<{ model?: unknown }>;
      const model = rows[0]?.model;
      if (typeof model === "string" && model) {
        cache.set(source, { model, at: Date.now() });
        return model;
      }
    }
  } catch {
    // Falls through to the credential-implied model below.
  }
  return embedModelName(env);
}

/**
 * The `index_meta` source a search function reads.
 *
 * The candidate functions are generated as `search_blueprint_<suffix>` and
 * read `blueprint_<suffix>`, so the suffix carries straight across. A name
 * this does not recognise falls back to the live index rather than inventing
 * a source, which is the same answer the constant used to give.
 *
 * @param rpcName - the search function being called
 */
export function indexSource(rpcName: string): string {
  const suffix = rpcName.startsWith("search_blueprint")
    ? rpcName.slice("search_blueprint".length)
    : "";
  return suffix ? `blueprint${suffix}` : "blueprint";
}
