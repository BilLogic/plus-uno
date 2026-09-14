// The tier union, alone in a file with no imports.
//
// It lives here rather than in routing.ts because the tier NAME is all the
// loop and the adapters need, and a type with no runtime cost should not decide
// what can be unit-tested: an import-free file can be named from the pure
// modules `tsconfig.test.json` compiles, dragging nothing behind it.
//
// A tier is HOW HARD TO THINK, named for effort and never for a model: these
// were "haiku" | "sonnet" | "opus" until 2026-08-07, Claude names on a Gemini
// deployment, and every model swap turned the name into a lie.
export type ModelTier = "chill" | "default" | "grind";
