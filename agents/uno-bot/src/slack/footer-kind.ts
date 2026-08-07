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

export type FooterKind = "full" | "none";

/** Below this, with no links and no structure, a reply is an acknowledgement:
 *  "Got it", "Cancelled", "Noted — thanks". There is nothing in it to check. */
const ACK_MAX_CHARS = 220;

/**
 * Classify a reply body.
 *
 * Biased toward "full" on purpose — a disclaimer on an acknowledgement is
 * noise, but a missing disclaimer on a factual answer is the failure the
 * footer exists to prevent. Every signal of substance wins.
 */
export function footerKindFor(body: string): FooterKind {
  const text = body.trim();
  if (!text) return "full";

  // Any citation, link, or list means it is making checkable claims.
  const hasLink = /<https?:\/\/[^>]+>/.test(text) || /https?:\/\//.test(text);
  const hasList = /(^|\n)\s*[•\-\d]/.test(text);
  const isLong = text.length > ACK_MAX_CHARS;
  if (hasLink || hasList || isLong) return "full";

  return "none";
}
