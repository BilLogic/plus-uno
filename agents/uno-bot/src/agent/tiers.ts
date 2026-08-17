// The tier union, alone in a file with no imports.
//
// It lives here rather than in routing.ts because routing.ts imports
// loop-shared, which imports the Workers type graph — so anything that wanted
// just the TYPE dragged the whole Worker into the node-only test build. A type
// with no runtime cost should not decide what can be unit-tested.
//
// A tier is HOW HARD TO THINK, named for effort and never for a model: these
// were "haiku" | "sonnet" | "opus" until 2026-08-07, Claude names on a Gemini
// deployment, and every model swap turned the name into a lie.
export type ModelTier = "chill" | "default" | "grind";
