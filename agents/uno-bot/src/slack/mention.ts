// What a message says once the bot's own address is taken out of it.
//
// "<@uno-bot> send this to <@Coco>" is two mentions doing different jobs: the
// first summons the bot and carries no meaning, the second names the person
// the request is about. Only the first is noise. With the bot's identity
// unknown nothing is dropped — a stray address costs the model nothing, a
// missing recipient costs the request.
export function stripBotMentions(text: string, botUserId: string | undefined): string {
  if (!botUserId) return text.trim();
  return text.replace(new RegExp(`<@${botUserId}(?:\\|[^>]*)?>[ \\t]*`, "g"), "").trim();
}
