// Who may change a staged card, said to someone who may not. The turn, a
// Figma comment decision's thread and a blueprint revision's thread each
// refuse a revision from outside the card's confirmers with these words.
//
// PURE.

/**
 * What a person outside a card's confirmer set is told when their message
 * would have revised it. Names who can, since that is who to ask; only a Slack
 * user id is mentioned.
 *
 * @param confirmers - The card's confirmers
 * @param userId - Who tried
 */
export function revisionRefusal(confirmers: readonly string[], userId: string): string {
  const id = /^[UW][A-Z0-9]{2,20}$/;
  const to = id.test(userId) ? `<@${userId}> ` : "";
  const who = confirmers.filter((c) => id.test(c)).map((c) => `<@${c}>`);
  const names = who.length <= 1 ? who.join("") : `${who.slice(0, -1).join(", ")} or ${who[who.length - 1]}`;
  return who.length
    ? `:warning: ${to}Only ${names} can change this proposal, so it stays as it is — ask one of them if it needs a change.`
    : `:warning: ${to}Nobody here can change this proposal, so it stays as it is.`;
}
