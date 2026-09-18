// Reading a model's tool input, without a runtime.
//
// `collectStrings` lived in `agent/preflight.ts`, which imports `Env` and the
// design-system component list — so every module that wanted to look at the
// strings in a tool payload dragged that whole graph behind it. The reason this
// header used to give for the split, that `tsconfig.test.json` "could compile
// none of them", was not the reason and is now plainly not: the test compile is
// a glob over `src/**` and types the Workers globals beside the Node ones
// (#595). The reason that holds is the graph itself — Turn's proposal-card path
// wants one pure function over a payload, not the component list — so it lives
// on its own, import-free. `preflight.ts` re-exports it, so no caller changed.

/** All string values in the payload, one level deep into arrays/objects —
 *  enough to see summary, link, section bodies, recipients. */
export function collectStrings(input: Record<string, unknown>): string[] {
  const out: string[] = [];
  for (const v of Object.values(input)) {
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) {
      for (const item of v) {
        if (typeof item === "string") out.push(item);
        else if (item && typeof item === "object") {
          for (const nested of Object.values(item as Record<string, unknown>)) {
            if (typeof nested === "string") out.push(nested);
          }
        }
      }
    } else if (v && typeof v === "object") {
      for (const nested of Object.values(v as Record<string, unknown>)) {
        if (typeof nested === "string") out.push(nested);
      }
    }
  }
  return out;
}
