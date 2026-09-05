import { referenceStub } from "../tools/read-reference";

export interface AgentImage {
  media_type: string;
  data: string;
}

interface ConversationHistoryTurn {
  role: "user" | "assistant";
  content: string;
  ts?: string;
  /** Names of the references `read_reference` served during the turn this
   *  message opened — the receipt, never the text (thread-state.ts HistoryTurn). */
  references?: string[];
}

export interface ProviderConversationTurn {
  role: "user" | "assistant";
  text: string;
  images?: AgentImage[];
}

export interface HistoricalImages {
  turnTs: string;
  images: AgentImage[];
}

export function buildProviderConversation(
  history: ConversationHistoryTurn[],
  currentText: string,
  currentImages: AgentImage[] = [],
  historicalImages?: HistoricalImages,
): ProviderConversationTurn[] {
  // THE HISTORY BOUNDARY (#423). A reference fetched in an earlier turn arrives
  // here as its name, and leaves as one stub line per name appended to the
  // turn that read it. The text itself was dropped when that turn ended: it
  // was a tool result in that turn's provider contents, and those are not
  // history — HistoryTurn carries text and receipts, and this is the receipt.
  // Stub over silence because the next turn then knows the method was
  // consulted (a correction turn can judge the prior reply as grounded) and
  // that a re-read is one cheap call; stub over text because ~50 chars beats
  // ~10k on every iteration of every later turn, outside the explicit cache.
  const turns: ProviderConversationTurn[] = history.map((turn) => ({
    role: turn.role,
    text: turn.references?.length
      ? `${turn.content}\n\n${turn.references.map(referenceStub).join("\n")}`
      : turn.content,
    ...(historicalImages?.images.length && turn.ts === historicalImages.turnTs
      ? { images: historicalImages.images }
      : {}),
  }));
  turns.push({
    role: "user",
    text: currentText,
    ...(currentImages.length ? { images: currentImages } : {}),
  });

  // Consecutive same-role turns are merged UNCONDITIONALLY, because the
  // provider rejects them — the invariant buildMessages has documented since it
  // was written ("Merges consecutive same-role turns (the API rejects them)").
  //
  // Guarding the merge on "neither turn has images" reads as protecting the
  // rehydrated image's anchor, but the anchor is the ROLE and the position, and
  // merging preserves both. What it actually did was emit two user messages in
  // a row for the shape this feature exists to serve: an image turn that no
  // assistant turn follows. That happens whenever the bot reacted instead of
  // replying (a reaction leaves no message, so buildThreadHistory rebuilds
  // nothing for it), and whenever one person posts the frame and another asks
  // about it. Both are ordinary; both would have 400d.
  const merged: ProviderConversationTurn[] = [];
  for (const turn of turns) {
    const last = merged[merged.length - 1];
    if (!last || last.role !== turn.role) {
      merged.push({ ...turn });
      continue;
    }
    last.text = `${last.text}\n\n${turn.text}`;
    // Images from both sides survive the merge, in turn order. The provider
    // renders every image block ahead of the text, so a merged turn shows all
    // of its images and then all of its words — which is what a person reading
    // two adjacent messages sees anyway.
    const images = [...(last.images ?? []), ...(turn.images ?? [])];
    if (images.length) last.images = images;
  }
  while (merged.length && merged[0]!.role !== "user") merged.shift();
  return merged;
}
