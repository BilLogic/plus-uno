// The ladder's channel ids from the Worker's config: one `PLUS_*_CHANNEL_ID`
// per role in wrangler.toml `[vars]`, and #uno-bot's, which is never a
// destination.

import type { Env } from "../types";
import { CHANNEL_ROLES, channelIdOf, type ChannelIds } from "./index";

/**
 * The channel ids as the Worker is configured; a blank one is unset.
 *
 * @param env - Worker bindings
 */
export function channelIdsFor(env: Env): ChannelIds {
  const set = (v: string | undefined) => v?.trim() || undefined;
  return {
    plusDesign: set(env.PLUS_DESIGN_CHANNEL_ID),
    plusUniversal: set(env.PLUS_UNIVERSAL_CHANNEL_ID),
    plusAdmin: set(env.PLUS_ADMIN_CHANNEL_ID),
    plusToolkit: set(env.PLUS_TOOLKIT_CHANNEL_ID),
    plusTraining: set(env.PLUS_TRAINING_CHANNEL_ID),
    plusMarketing: set(env.PLUS_MARKETING_CHANNEL_ID),
    unoBot: set(env.UNO_BOT_CHANNEL_ID),
  };
}

/**
 * Every channel the ladder may post a finding in with no thread: #plus-design
 * and each configured team channel. Never #uno-bot.
 *
 * @param env - Worker bindings
 */
export function ladderChannelsFor(env: Env): string[] {
  const ids = channelIdsFor(env);
  return CHANNEL_ROLES.flatMap((role) => channelIdOf(role, ids) ?? []);
}
