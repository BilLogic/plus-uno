// The DM sweep's front door: the detector, its words, and its three entry
// points. `./env.ts` is deliberately NOT re-exported — it is where `Env`
// becomes the dependencies, the boundary `sweep/index.ts` keeps.
export * from "./detector";
export * from "./copy";
export * from "./run";
export * from "./active";
