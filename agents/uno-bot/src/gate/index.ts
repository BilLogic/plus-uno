// The module's front door: the signal, the verdict, the one function that
// turns one into the other, and the doors that apply it.
//
// Import from here rather than from `./gate`, so that where a piece lives
// stays the module's business — the same boundary `turn/index.ts` and
// `thread-state/index.ts` keep. Nothing Workers-shaped is re-exported,
// because `tsconfig.test.json` compiles this file.
export * from "./gate";
export * from "./reaction-door";
export * from "./run-batch";
