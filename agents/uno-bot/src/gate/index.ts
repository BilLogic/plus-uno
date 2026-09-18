// The module's front door: the signal, the verdict, the one function that
// turns one into the other, and the doors that apply it.
//
// Import from here rather than from `./gate`, so that where a piece lives
// stays the module's business — the same boundary `turn/index.ts` and
// `thread-state/index.ts` keep. Nothing Slack-shaped or `Env`-facing is
// re-exported: Gate's front door is Gate's vocabulary, and everything on it is
// a thing the Node suite can drive.
export * from "./gate";
export * from "./reactions";
export * from "./reaction-door";
export * from "./run-batch";
