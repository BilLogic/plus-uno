// The note a ⛔ leaves in the conversation, and the one question the turn asks
// of it: was THIS action just cancelled?
//
// A cancelled card is not re-proposed on the model's own say-so (`turn/turn.ts`,
// gate idempotency). But a card whose verb names a different target — a
// share-out's place, an intake's repo — is a different card, and a redirect
// ("post it here instead") has to get one. So the note records that target,
// and only the same tool on the same target is held back. A note written
// before targets were recorded holds back the tool, as it always did.

const NOTE_RE = /\(Cancelled the proposed ([a-z_]+)(?: for ([^—)]+?))? — /;

/** The target a tool's card names on its verb, as it compares: a share-out's
 *  place, an intake's repo by name. `null` for a tool whose card names none. */
function targetOf(toolName: string, input: Record<string, unknown>): string | null {
  if (toolName === "shareout_post") return `place ${input.place === "here" ? "here" : "feedback_channel"}`;
  if (toolName === "github_issue_create") {
    const repo = typeof input.repo === "string" ? input.repo.trim().toLowerCase().split("/").pop() : "";
    return `repo ${repo || "default"}`;
  }
  return null;
}

/** What the conversation remembers of a ⛔: the tool and, when its card named
 *  one, the target. `context-state.ts` reads the tool back from the same note. */
export function cancelNote(toolName: string, input: Record<string, unknown>): string {
  const target = targetOf(toolName, input);
  return `(Cancelled the proposed ${toolName}${target ? ` for ${target}` : ""} — nothing was done.)`;
}

/** Whether `content` is a ⛔ note for this tool on this target. */
export function cancelledSame(content: string, toolName: string, input: Record<string, unknown>): boolean {
  const note = NOTE_RE.exec(content);
  if (!note || note[1] !== toolName) return false;
  return note[2] === undefined || note[2] === targetOf(toolName, input);
}
