// The Turn harness — a whole Slack turn, without Slack.
//
// Three fakes and the real code between them: the recording Delivery, the
// in-memory ThreadState and a fake ModelProvider behind the REAL agent loop.
// So the model round-trip, the proposal gate, the judges and the history write
// are all exercised, and nothing is stubbed that a designer in Slack would
// rely on.
//
// SHARED, because the cases that catch the interesting bugs span more than one
// module. `tests/turn.test.ts` drives Turn's own behaviour; the flow tests
// (`tests/replaced-card-message.test.ts`, #583) drive Turn and then ask Gate
// what a person would be told — and they have to be looking at the same store
// a real thread would, or they prove nothing about production.
import { runLoop, type LoopBudget } from "../../src/agent/loop";
import { fakeProvider, type FakeProvider, type ScriptedReply } from "../../src/agent/providers/fake";
import { buildProviderConversation } from "../../src/agent/provider-conversation";
import {
  recordingDelivery,
  type RecordingDelivery,
  type TurnDeps,
  type TurnRequest,
} from "../../src/turn/index";
import { runOperations, type OperationOutcome } from "../../src/gate/index";
import {
  createInMemoryThreadState,
  type PendingProposal,
  type ThreadRef,
  type ThreadState,
} from "../../src/thread-state/index";

export const CHANNEL = "C1";
export const CONVERSATION = "1700000000.000100";
export const REF = { channel: CHANNEL, thread: CONVERSATION };

/** A meter that spends nothing: no case here is about the budget (that is
 *  `agent-loop.test.ts`), and a turn must not need one to run. */
const IDLE_BUDGET: LoopBudget = {
  used: () => 0,
  trips: () => 0,
  withLookupLimit: (_limit, fn) => fn(),
  isBudgetError: () => false,
  breakdown: () => "test",
};

export const PENDING: PendingProposal = {
  toolName: "notion_create",
  input: { title: "Reflection redesign" },
  channel: CHANNEL,
  threadTs: CONVERSATION,
  replyTs: CONVERSATION,
  userMsgTs: "1700000000.000090",
  proposalTs: "1700000000.000095",
  proposalText: "(the staged card)",
  requesterUserId: "U1",
};

export function request(over: Partial<TurnRequest> = {}): TurnRequest {
  return {
    userId: "U1",
    channel: CHANNEL,
    conversationTs: CONVERSATION,
    replyTs: CONVERSATION,
    userMsgTs: "1700000000.000200",
    surface: "channel",
    threaded: true,
    text: "how does a call-off reach a fill-in?",
    images: [],
    history: [],
    pending: null,
    ...over,
  };
}

export interface Harness {
  deps: TurnDeps;
  delivery: RecordingDelivery;
  threadState: ThreadState;
  provider: FakeProvider;
  /** Every proposal resolution the turn asked for, in order. */
  resolved: Array<{
    toolName: string;
    decision: "confirm" | "cancel";
    narrative?: string;
    /** Whether the verdict carried a tool to run — a decline carries none. */
    executed: boolean;
  }>;
  /** What the approved batch actually ran, when the case supplied an executor. */
  ran: OperationOutcome[];
  /** Every draft the judge was handed. */
  judged: string[];
  /** Tool names the loop actually executed. */
  executed: string[];
}

export function harness(opts: {
  replies?: ScriptedReply[];
  /** Stand in for the judge. Returning text revises the draft. */
  judge?: (draft: string) => { text: string; verdict: string };
  preflightAsk?: string;
  /** A refusal that depends on the call — what a real guard does. */
  preflightFor?: (toolName: string, input: Record<string, unknown>) => string | null;
  delivery?: RecordingDelivery;
  threadState?: ThreadState;
  toolResult?: string;
  /** Stand in for the side-effect tool table, so a case can fail one operation
   *  of a batch. Absent — as everywhere else here — nothing is executed. */
  executeOperation?: (operation: { toolName: string; input: Record<string, unknown> }) => Promise<string>;
  /**
   * The conversation key the loop reads the stop flag on, for a case about
   * cancellation. Production computes it from the conversation
   * (`run-agent.ts`), and the reader is the store itself — so a case presses
   * stop by writing the flag with `requestCancel` and the loop consumes it
   * exactly as it does in Slack. Absent, the turn cannot be cancelled, which
   * is every other case here.
   */
  cancelKey?: ThreadRef;
} = {}): Harness {
  const delivery = opts.delivery ?? recordingDelivery();
  const threadState = opts.threadState ?? createInMemoryThreadState();
  const provider = fakeProvider({ replies: opts.replies ?? [{ text: "Here is the answer." }] });
  const resolved: Harness["resolved"] = [];
  const ran: OperationOutcome[] = [];
  const judged: string[] = [];
  const executed: string[] = [];

  const deps: TurnDeps = {
    threadState,
    delivery,

    // The REAL loop, behind the fake provider: the turn's request reaches a
    // model through the same code production uses.
    async runAgent(req) {
      const result = await runLoop({
        provider,
        deps: {
          async executeUngatedTool(name) {
            executed.push(name);
            return opts.toolResult ?? JSON.stringify({ ok: true, rows: [] });
          },
          // The real store, as production wires it (`threadStateFor(env)`).
          threadState,
          budget: IDLE_BUDGET,
          // Wired as production wires it: the loop gets the first go at a
          // refusal, and only a call refused twice reaches the person.
          ...(req.preflight ? { preflight: req.preflight } : {}),
        },
        tier: req.tier,
        routeReason: req.routeReason,
        conversation: buildProviderConversation(
          req.history,
          req.userText,
          req.images ?? [],
          req.historicalImages,
        ),
        system: [{ text: "(harness)", stable: true }],
        tools: [],
        pending: req.pending,
        currentSenderId: req.currentSender.userId,
        cancelKey: opts.cancelKey ?? null,
        ...(req.onInterim ? { onInterim: req.onInterim } : {}),
      });
      return { result, tools: executed.slice(), references: [] };
    },

    async reviewDraft({ draft }) {
      judged.push(draft);
      return opts.judge ? opts.judge(draft) : { text: draft, verdict: "pass" };
    },

    async preflight(toolName, input) {
      const ask = opts.preflightFor?.(toolName, input) ?? opts.preflightAsk;
      return ask ? { ask } : null;
    },

    // The gate's EXECUTION port. The decision half is not a dependency: the
    // turn calls `resolveSignal` itself against the in-memory store, so what
    // arrives here is a verdict that has already won its claim.
    async applyVerdict(verdict) {
      if (verdict.outcome !== "won" || !verdict.proposal || !verdict.decision) return;
      resolved.push({
        toolName: verdict.proposal.toolName,
        decision: verdict.decision,
        ...(verdict.post ? { narrative: verdict.post.text } : {}),
        executed: verdict.execute !== undefined,
      });
      // The batch runner production's executor is built on, on a case's own
      // fake tool table — so "the whole batch runs, in order, past a failure"
      // is asserted through a Turn rather than against a helper.
      if (opts.executeOperation && verdict.execute) {
        ran.push(...(await runOperations(verdict.execute.operations, opts.executeOperation)));
      }
    },

    cards: {
      async notionUpdateBody() {
        return "• *Design Status:* `WIP` → `Ready for QA`";
      },
      async notionArchiveTargetNote() {
        return "• *Target:* A card — in Roadmap";
      },
      async implementDesignCard(_input, _userId, previewText) {
        return { text: `(figma card) ${previewText ?? ""}`, blocks: [{ type: "image" }] };
      },
    },

    async readAntecedent() {
      return [];
    },

    describeAssistantContext: () => null,
  };

  return { deps, delivery, threadState, provider, resolved, ran, judged, executed };
}

/** Posts a person would actually read, in order. */
export const postsOf = (delivery: RecordingDelivery): string[] => delivery.posted;

/**
 * Stage `PENDING` for real, in the store.
 *
 * A turn that resolves a proposal goes through Gate now, and Gate's claim is a
 * delete in the store — so a proposal that is only in the request and not in
 * the store reads as one somebody else already resolved. Which is correct: it
 * is the same record either way in production.
 */
export const stage = (h: Harness): Promise<void> => h.threadState.putProposal(PENDING).then(() => {});

/** The narrative Gate posts when the signal brought no words of its own. */
export const DEFAULT_CONFIRM_POST = "Got it — kicking that off.";
