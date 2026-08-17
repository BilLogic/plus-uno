// Which footer an outgoing reply gets.
//
// Slack asks for an LLM disclaimer. Attaching it to EVERY message — including
// "Got it, cancelled" — is how people learn to skip it on the messages that
// actually carry claims. The playbook's rule: substantive answers get the
// footer, acknowledgements get nothing, and anything unrecognised falls back to
// the footer rather than to silence.
//
// The RELAY decides, not the model. The judgement is exactly the part a model
// would sometimes get wrong, and we already know everything needed to classify.
//
// THREE kinds, not two. A DRAFT is the one case where the standard footer is
// actively wrong rather than merely noisy: "LLM-written · check before acting"
// describes something the bot is telling you, but a draft is something YOU are
// about to send under YOUR name. The risk being warned about is different, so
// the warning is different.

export type FooterKind = "full" | "draft" | "none";

/** Below this, with no links and no structure, a reply is an acknowledgement:
 *  "Got it", "Cancelled", "Noted — thanks". There is nothing in it to check. */
const ACK_MAX_CHARS = 220;

/**
 * Classify a reply body.
 *
 * Biased toward "full" on purpose — a disclaimer on an acknowledgement is
 * noise, but a missing disclaimer on a factual answer is the failure the
 * footer exists to prevent. Every signal of substance wins.
 *
 * `hint` is set by the RELAY, never inferred from the text: the draft shortcut
 * knows it asked for a draft. Sniffing for a fenced code block would misfire
 * both ways — an ordinary answer can contain one, and a one-line draft need
 * not. A hint of "draft" wins outright; a draft is a draft however short it is.
 */
export function footerKindFor(body: string, hint?: FooterKind): FooterKind {
  if (hint === "draft") return "draft";

  const text = body.trim();
  if (!text) return "full";

  // Any citation, link, or list means it is making checkable claims.
  const hasLink = /<https?:\/\/[^>]+>/.test(text) || /https?:\/\//.test(text);
  const hasList = /(^|\n)\s*[•\-\d]/.test(text);
  const isLong = text.length > ACK_MAX_CHARS;
  if (hasLink || hasList || isLong) return "full";

  return "none";
}

/** The context line for each footer kind. Empty string = no context block.
 *  Short on purpose: a footer people actually read beats a complete one they
 *  skip. */
export function footerNoteFor(kind: FooterKind): string {
  if (kind === "full") return "_LLM-written · check before acting_";
  // Names the actual risk: this goes out as THEM, not as the bot. "Read it
  // first" is the instruction; "your name" is why.
  if (kind === "draft") return "_Draft — sends under your name, so read it first_";
  return "";
}
