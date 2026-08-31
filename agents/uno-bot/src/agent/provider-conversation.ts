export interface AgentImage {
  media_type: string;
  data: string;
}

interface ConversationHistoryTurn {
  role: "user" | "assistant";
  content: string;
  ts?: string;
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
  const turns: ProviderConversationTurn[] = history.map((turn) => ({
    role: turn.role,
    text: turn.content,
    ...(historicalImages?.images.length && turn.ts === historicalImages.turnTs
      ? { images: historicalImages.images }
      : {}),
  }));
  turns.push({
    role: "user",
    text: currentText,
    ...(currentImages.length ? { images: currentImages } : {}),
  });

  const merged: ProviderConversationTurn[] = [];
  for (const turn of turns) {
    const last = merged[merged.length - 1];
    if (last && last.role === turn.role && !last.images?.length && !turn.images?.length) {
      last.text = `${last.text}\n\n${turn.text}`;
    } else {
      merged.push(turn);
    }
  }
  while (merged.length && merged[0]!.role !== "user") merged.shift();
  return merged;
}
