// One timeout-guarded fetch, shared across the integrations. Replaces the
// hand-rolled AbortController + setTimeout + `finally clearTimeout` scaffold
// that was copy-pasted at ~13 call sites (review 2026-07-12). Workers have no
// per-fetch timeout, so without this a slow upstream can pin an invocation.
export async function fetchWithTimeout(
  input: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
