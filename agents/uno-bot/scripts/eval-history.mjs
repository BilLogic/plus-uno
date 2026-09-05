// How the eval runner threads one turn's outcome into the history it SENDS to
// the next turn — and what a case may assert about that history (#426).
//
// Extracted from run-evals.mjs so the threading rule can be tested without a
// live Worker. It mirrors production's boundary in two places:
//
//   * slack/events.ts writes the turn's outcome to DO history — the reply text
//     for a text turn, the OUTCOME MARKER for a resolved proposal (R5 reads
//     that marker to refuse re-carding a cancelled action) — and, on the USER
//     turn that opened the request, the names `read_reference` served that
//     turn as `references` (turnReferences). The names only: the text was that
//     turn's tool result and ended with it.
//   * agent/provider-conversation.ts turns each name back into a one-line
//     stub when the next turn's conversation is built.
//
// So the history this runner sends is the history the bot actually sees, and a
// case can assert on it — `expectHistory` on a later turn — that the receipt
// travelled and the text did not.

/** Distinct reference names the route reported as SERVED (hits) this turn. */
function referencesOf(resp) {
  const list = Array.isArray(resp?.references) ? resp.references : [];
  return [...new Set(list.filter((n) => typeof n === "string" && n.trim()))];
}

/**
 * Append one turn's outcome to `history` the way production records it, and
 * return the pending proposal the next turn should see (or null).
 *
 * @param {Array<{role:string, content:string, references?:string[]}>} history — mutated in place
 * @param {string} prompt — the user text of this turn
 * @param {object} resp — the /debug/eval response for this turn
 * @param {{toolName:string, input:object}|null} pending — the proposal pending BEFORE this turn
 * @returns {{toolName:string, input:object}|null} the proposal pending AFTER this turn
 */
export function threadTurn(history, prompt, resp, pending) {
  const r = resp?.result;
  const references = referencesOf(resp);
  // The receipt rides the user turn, as in production (events.ts appendHistory
  // for the user message carries `references`) — never the text.
  history.push({ role: "user", content: prompt, ...(references.length ? { references } : {}) });
  if (r?.kind === "text") {
    history.push({ role: "assistant", content: r.text ?? "" });
    return pending;
  }
  if (r?.kind === "proposal") {
    history.push({ role: "assistant", content: `(staged a ${r.toolName} proposal awaiting confirmation)` });
    return { toolName: r.toolName, input: r.input ?? {} };
  }
  if (r?.kind === "resolved") {
    // Production writes the OUTCOME MARKER to DO history, not the friendly
    // text (agent/resolve-proposal.ts) — and slack/events.ts reads that marker
    // to refuse re-carding a cancelled action. Mirror it here or the headless
    // history is not the history the bot actually sees (R5).
    const marker =
      r.decision === "cancel"
        ? `(Cancelled the proposed ${pending?.toolName ?? "action"} — nothing was done.)`
        : (r.messageToUser ?? `(${r.decision})`);
    history.push({ role: "assistant", content: marker });
    return null;
  }
  return pending;
}

/** What the runner sent — the compact record kept in the transcript, so a
 *  reviewer can see the size and the receipts without the judge paying for
 *  the whole history twice. */
export function sentSummary(history) {
  return {
    historyTurns: history.length,
    historyChars: JSON.stringify(history).length,
    references: history.flatMap((t) => (Array.isArray(t.references) ? t.references : [])),
  };
}

/**
 * Deterministic checks on the history SENT to a turn.
 *
 * `expectHistory: { references?: string[], maxChars?: number }`
 *   - every named reference must sit on some history turn's `references`
 *     receipt (the name, where production carries it — not the text);
 *   - the serialized history must be at most `maxChars`. A method is ~10k
 *     chars, so a bound well under that plus the thread is what proves the
 *     text did not travel; a bound is a property of the case, not the runner.
 *
 * @returns {string[]} failures, empty when the history passes
 */
export function checkHistory(spec, history) {
  const want = spec?.expectHistory;
  if (!want) return [];
  const failures = [];
  const sent = Array.isArray(history) ? history : [];
  const carried = sent.flatMap((t) => (Array.isArray(t.references) ? t.references : []));
  for (const name of want.references ?? []) {
    if (!carried.includes(name)) {
      failures.push(
        `history sent carries no reference receipt for '${name}' (receipts: ${carried.length ? carried.join(", ") : "none"})`,
      );
    }
  }
  if (Number.isInteger(want.maxChars)) {
    const chars = JSON.stringify(sent).length;
    if (chars > want.maxChars) {
      failures.push(`history sent is ${chars} chars (max ${want.maxChars}) — a fetched text is riding the thread`);
    }
  }
  return failures;
}
