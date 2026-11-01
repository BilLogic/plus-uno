// `GET /health/blueprint` — does every blueprint read this bot depends on still
// work?
//
// Public, boolean-only. Exists so the product repository's CI can fail loudly
// when a schema change breaks a bot read — the drift class that twice shipped
// as silent empty reads. Unlike `/debug/blueprint` (token-gated, carries
// response samples), this returns nothing but statuses: table names are
// public-read by design, and no row data leaves. Cached per isolate to keep a
// curl loop from amplifying into upstream reads.
import { BUILD } from "../../version";
import { BLUEPRINT_CONTRACT } from "../../generated/blueprint-contract";
import { countedFetch } from "../../net";
import {
  CELL_FALLBACK_SELECT,
  EDGE_SELECT_COLUMNS,
  TOUCHPOINTS_TABLE,
  TOUCHPOINT_SELECT,
} from "../../integrations/blueprint";
import type { ProbeRun } from "../probe";

interface ContractProbeBody {
  ok: boolean;
  build: string;
  probes: Record<string, boolean>;
}

let contractProbeCache: { at: number; body: ContractProbeBody } | null = null;

export const blueprintHealthProbe: ProbeRun = async (env) => {
  if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) {
    return { body: { ok: false, build: BUILD, error: "blueprint reads not configured" }, status: 503 };
  }
  const now = Date.now();
  if (contractProbeCache && now - contractProbeCache.at < 60_000) {
    return { body: { ...contractProbeCache.body }, status: contractProbeCache.body.ok ? 200 : 503 };
  }
  const base = env.SUPABASE_URL.replace(/\/+$/, "");
  const h = { apikey: env.SUPABASE_ANON_KEY, authorization: `Bearer ${env.SUPABASE_ANON_KEY}` };
  const probes: Record<string, boolean> = {};
  const probe = async (label: string, path: string, init?: RequestInit) => {
    try {
      const r = await countedFetch(`${base}${path}`, { ...init, headers: { ...h, ...(init?.headers ?? {}) } });
      probes[label] = r.ok;
    } catch {
      probes[label] = false;
    }
  };
  await probe("rpc_search_blueprint", "/rest/v1/rpc/search_blueprint", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ q: "tutor" }),
  });
  for (const t of BLUEPRINT_CONTRACT.botReadTables) {
    await probe(`table_${t}`, `/rest/v1/${t}?select=id&limit=1`);
  }
  // The exact selects the bot issues, not just table reachability — a
  // renamed column 400s here while bare selects stay green.
  //
  // IMPORTED, not restated. These probes were written as copies of the
  // selects and then stayed still while 20260820130000, 20260830190000 and
  // 20260830280000 renamed the columns underneath them, so the probe agreed
  // with a read that had stopped working. A copy of a select is a second
  // thing to keep correct; an import is the same thing.
  await probe("select_cells_spec", `/rest/v1/cells?select=${encodeURIComponent(CELL_FALLBACK_SELECT)}&limit=1`);
  await probe("select_edges_kind", `/rest/v1/cell_dependencies?select=${encodeURIComponent(EDGE_SELECT_COLUMNS)}&limit=1`);
  // Findings arrive through the search, not a table read: `audit_findings`
  // refuses the anon key since 20261101130000, and `search_blueprint` (security
  // definer) returns them on its `include` findings branch. So this asks the
  // RPC for that branch, the one route the bot has to them.
  const params = BLUEPRINT_CONTRACT.searchBlueprintParams;
  await probe("include_findings", `/rest/v1/rpc/${BLUEPRINT_CONTRACT.rpcs.searchBlueprint}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ [params.q]: "tutor", [params.include]: ["findings"] }),
  });
  // The touchpoint registry's select (#414), imported like the two selects above.
  // `table_touchpoints` comes from the botReadTables loop now that the
  // contract lists it; this is the fuller check — the columns the read names.
  await probe("select_touchpoints", `/rest/v1/${TOUCHPOINTS_TABLE}?select=${encodeURIComponent(TOUCHPOINT_SELECT)}&limit=1`);
  const body: ContractProbeBody = { ok: Object.values(probes).every(Boolean), build: BUILD, probes };
  contractProbeCache = { at: now, body };
  return { body: { ...body }, status: body.ok ? 200 : 503 };
};

/** Test/dev seam: drop the per-isolate cache. */
export function resetBlueprintHealthCache(): void {
  contractProbeCache = null;
}
