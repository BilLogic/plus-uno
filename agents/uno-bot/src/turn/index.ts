// The module's front door: the turn, its request and outcome, the Delivery
// port and the recording adapter.
//
// Import from here rather than from `./turn` or `./delivery` directly, so that
// where a piece lives stays the module's business.
//
// THE ONE EXCEPTION is Slack's Delivery ENVELOPE (`slack/slack-delivery.ts`),
// which is deliberately NOT re-exported: it is where `Env` becomes the
// adapter's named dependencies, so it necessarily holds `Env`, `api.ts` and
// `assistant.ts`. Turn's front door is Turn's vocabulary, and one Slack
// envelope on it would make every importer of this file a caller of the Slack
// client — the same boundary `thread-state/index.ts` keeps, for the same
// reason. The Worker pays the import path instead. The adapter the envelope
// builds (`slack/delivery-adapter.ts`) takes its Slack client by name and is
// driven by the Node suite (#594); it is not re-exported either, because which
// Slack renders a turn is Slack's business rather than Turn's.
// `env-deps.ts` is the other deliberate omission, for the same reason from the
// other direction: it is where `Env` becomes `TurnDeps` for both callers, so it
// necessarily names `Env`. A caller that HAS an `Env` imports it by path.
export * from "./turn";
export * from "./delivery";
export * from "./request";
export * from "./antecedent";
