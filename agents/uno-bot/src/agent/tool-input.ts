// Reading a model's tool input, without a runtime.
//
// `collectStrings` lived in `agent/preflight.ts`, which imports `Env` and the
// design-system component list — so every module that wanted to look at the
// strings in a tool payload dragged the whole Workers type graph behind it, and
// `tsconfig.test.json` could compile none of them. Turn's proposal-card path
// wants exactly this one function, so it lives on its own, import-free.
// `preflight.ts` re-exports it, so no existing caller changed.

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
