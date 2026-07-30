// Timeout-guarded fetch, shared across the integrations. Replaces the
// hand-rolled AbortController + setTimeout + `finally clearTimeout` scaffold
// that was copy-pasted at ~13 call sites (review 2026-07-12).
//
// Now a thin alias over net.ts's countedFetch — the timeout guard moved there
// so that ONE function both counts and guards, and no call site can pick the
// counting-free variant by accident.
export { countedFetch as fetchWithTimeout } from "./net";
