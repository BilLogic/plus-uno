// The one place production's Figma client is built, and the one file in the
// module that takes `Env`.
//
// ONE CLIENT PER `Env`, not one per call site, because the pacing lives in the
// client (`rest.ts`). A turn can read up to 12 frames through `source_read`,
// render two for vision and one for a card's preview; a client built at each
// of those sites would start each with a full burst and pace nothing. The
// runner hands every job the Durable Object's own `env`, so this is one client
// — one set of buckets — per Durable Object instance, and one per isolate for
// the fetch handler. Metering is still per invocation: `countedFetch` reads
// the meter when a call is sent, not when the client was built.

import type { Env } from "../types";
import type { FigmaClient } from "./client";
import { createFigmaRestClient } from "./rest";

const clients = new WeakMap<Env, FigmaClient>();

/**
 * The Worker's Figma client, or undefined when it has no token.
 *
 * @param env - Worker bindings
 */
export function figmaClientFor(env: Env): FigmaClient | undefined {
  if (!env.FIGMA_ACCESS_TOKEN) return undefined;
  let client = clients.get(env);
  if (!client) {
    client = createFigmaRestClient({ token: env.FIGMA_ACCESS_TOKEN });
    clients.set(env, client);
  }
  return client;
}
