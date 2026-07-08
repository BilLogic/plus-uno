// Fire a repository_dispatch event against env.GITHUB_REPO. Returns ok=true
// on 204 (the only documented success); ok=false on any other status with
// the response body for diagnostics.

import type { Env } from "../types";

export interface DispatchResult {
  ok: boolean;
  status: number;
  body?: string;
}

export async function repositoryDispatch(
  env: Env,
  eventType: string,
  clientPayload: Record<string, unknown>,
): Promise<DispatchResult> {
  const url = `https://api.github.com/repos/${env.GITHUB_REPO}/dispatches`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      accept: "application/vnd.github+json",
      authorization: `Bearer ${env.GITHUB_TOKEN}`,
      "x-github-api-version": "2022-11-28",
      "content-type": "application/json",
      "user-agent": "uno-bot",
    },
    body: JSON.stringify({ event_type: eventType, client_payload: clientPayload }),
  });

  if (res.status === 204) return { ok: true, status: 204 };
  const body = await res.text().catch(() => "");
  console.warn(`[github] dispatch ${eventType} failed: ${res.status} ${body}`);
  return { ok: false, status: res.status, body };
}
