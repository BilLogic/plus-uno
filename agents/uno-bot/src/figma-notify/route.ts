// POST /figma/events — where Figma's notifications land (#895).
//
// Figma sends a passcode, not a signature: the value given when the
// subscription was created, echoed in every delivery's body. So the route reads
// the body, compares the passcode, and only then reads anything else. In order:
//
//   1. A body over 1 MB is 413.
//   2. No passcode, a wrong one, a body that is not JSON, or no secret set on
//      the Worker is 401, and nothing is queued or written. NEVER 400: Figma's
//      docs say a 400 for a wrong passcode "will immediately stop the webhook",
//      so a forged or misrouted call answered 400 could switch off a real
//      subscription. A 401 to Figma itself (a passcode rotated on one side
//      only) shows up as failed deliveries in `figma-subscriptions.yml status`.
//   3. A PING — what a new subscription sends — is 200 and a log line.
//   4. An event type nobody subscribed to, or a file event missing what its id
//      needs, is 200 and a log line: a retry would carry the same body.
//   5. The runner claims the event's id and queues one job, in one step
//      (`runner/queue.ts` `enqueueThreadJobOnce`):
//        • already claimed — a redelivery — is 200 and nothing else;
//        • a refused enqueue is 503, with nothing recorded, so Figma's next
//          retry (5 min, 30 min, 3 h) is a first delivery again;
//        • queued: the KV note is written (`event.ts`), then 200.
//      A note that fails to write is logged and still answered 200. The job is
//      queued, and a 503 now would only make Figma deliver it a second time;
//      the nightly backstop (#896) is what catches a change whose note never
//      landed.
//
// Figma counts a slow answer as a failure, so the route does three things at
// most — one Durable Object hop and two KV calls — and leaves the work to the
// job. That is also its whole spend against the invocation's budget, and the
// answer is a status code rather than a deferral, so there is no budget stop
// for it to pass on.
//
// Env-free: the passcode, the runner and KV arrive by name (`env.ts`).

import { timingSafeEqualStr } from "../diagnostics/auth";
import { eventIdOf, jobOf, noteFor, readFigmaEvent, type FigmaEventJob, type FigmaNote } from "./event";

/** The largest body read. Figma's own are a few KB. */
export const MAX_BODY_BYTES = 1_000_000;

/** The KV notes, as the route reads and writes them. */
export interface FigmaNotes {
  get(key: string): Promise<{ at: string } | null>;
  put(key: string, value: { at: string }, ttlS: number): Promise<void>;
}

export interface FigmaEventsDeps {
  /** `FIGMA_WEBHOOK_PASSCODE`. Unset, every delivery is refused. */
  passcode: string | undefined;
  /** Claim `eventId` and queue its job: "queued", or "seen" for a redelivery.
   *  Throws when the runner refused. */
  enqueueOnce(eventId: string, job: FigmaEventJob): Promise<"queued" | "seen">;
  notes: FigmaNotes;
  now(): number;
}

function answer(status: number, body: string): Response {
  return new Response(body, { status, headers: { "content-type": "text/plain; charset=utf-8" } });
}

const ok = (): Response => answer(200, "ok");
const unauthorized = (): Response => answer(401, "unauthorized");

function messageOf(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

/**
 * One Figma delivery, answered.
 *
 * @param request - The inbound request
 * @param deps - The passcode, the runner, the notes and the clock
 */
export async function handleFigmaEvents(request: Request, deps: FigmaEventsDeps): Promise<Response> {
  if (Number(request.headers.get("content-length") ?? 0) > MAX_BODY_BYTES) return answer(413, "too large");
  const raw = await request.text();
  if (raw.length > MAX_BODY_BYTES) return answer(413, "too large");

  if (!deps.passcode) {
    console.error("[figma-notify] refused a delivery: FIGMA_WEBHOOK_PASSCODE is not set on the Worker");
    return unauthorized();
  }
  let payload: unknown;
  try {
    payload = JSON.parse(raw);
  } catch {
    console.warn("[figma-notify] refused a delivery: the body is not JSON");
    return unauthorized();
  }
  const given = payload && typeof payload === "object" ? (payload as { passcode?: unknown }).passcode : undefined;
  if (typeof given !== "string" || !timingSafeEqualStr(given, deps.passcode)) {
    console.warn(`[figma-notify] refused a delivery: ${typeof given === "string" ? "wrong" : "no"} passcode`);
    return unauthorized();
  }

  const event = readFigmaEvent(payload as Record<string, unknown>);
  if (!event) {
    console.warn("[figma-notify] a file event without the ids it needs — answered and dropped");
    return ok();
  }
  if (event.type === "PING") {
    console.log(`[figma-notify] PING from webhook ${event.webhookId}`);
    return ok();
  }
  if (event.type === "OTHER") {
    console.log(`[figma-notify] ${event.eventType} from webhook ${event.webhookId} — not subscribed, dropped`);
    return ok();
  }

  const eventId = eventIdOf(event);
  let claimed: "queued" | "seen";
  try {
    claimed = await deps.enqueueOnce(eventId, jobOf(event, eventId));
  } catch (err) {
    console.error(`[figma-notify] ${eventId} not queued, so Figma will retry: ${messageOf(err)}`);
    return answer(503, "try again");
  }
  if (claimed === "seen") {
    console.log(`[figma-notify] ${eventId} again — a redelivery, nothing to do`);
    return ok();
  }

  try {
    await writeNote(deps.notes, noteFor(event, deps.now()));
  } catch (err) {
    console.error(`[figma-notify] ${eventId} queued, but its note was not written: ${messageOf(err)}`);
  }
  console.log(`[figma-notify] ${eventId} on ${event.fileKey} queued`);
  return ok();
}

/**
 * Write a note when it says something new: a commented-that-day note only
 * when the file has none for the day, a last-change note only when it is
 * later than the one there.
 *
 * @returns Whether it wrote
 */
export async function writeNote(notes: FigmaNotes, note: FigmaNote): Promise<boolean> {
  const current = await notes.get(note.key);
  if (current) {
    if (note.write === "if-absent") return false;
    const was = Date.parse(current.at);
    if (Number.isFinite(was) && Date.parse(note.at) <= was) return false;
  }
  await notes.put(note.key, { at: note.at }, note.ttlS);
  return true;
}
