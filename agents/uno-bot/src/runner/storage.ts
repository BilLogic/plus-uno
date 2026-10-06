// The AgentRunner's storage port, and the in-memory runner behind it.
//
// The queue (./queue.ts) needs six calls from a Durable Object's storage: a
// keyed get, put and delete, a prefix list in key order, and the one alarm's get
// and set.
// Stated here as an interface, the production storage satisfies it as it
// stands — `DurableObjectStorage` has every one of these, so the runner passes
// `state.storage` straight in — and the in-memory adapter below satisfies it
// for the Node suite, which is what lets the ordering rules be tested at all.
//
// The in-memory alarm is a value the test takes: `takeAlarm()` returns the
// time it was set for and clears it, which is what the runtime does before it
// calls `alarm()`. Free of Workers globals, like the queue.

/** The slice of Durable Object storage the runner's queue uses. */
export interface RunnerStorage {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
  delete(key: string): Promise<boolean>;
  /** Entries under `prefix`, in ascending key order, at most `limit`. */
  list<T>(options: { prefix: string; limit?: number }): Promise<Map<string, T>>;
  getAlarm(): Promise<number | null>;
  setAlarm(scheduledTime: number): Promise<void>;
}

/** The in-memory runner's storage, plus the hand the test fires alarms with. */
export interface InMemoryRunnerStorage extends RunnerStorage {
  /** The pending alarm's time, cleared — `null` when none is set. */
  takeAlarm(): number | null;
}

/** A fresh, empty in-memory runner storage. */
export function createInMemoryRunnerStorage(): InMemoryRunnerStorage {
  const entries = new Map<string, unknown>();
  let alarm: number | null = null;
  return {
    async get<T>(key: string) {
      return entries.has(key) ? (structuredClone(entries.get(key)) as T) : undefined;
    },
    async put<T>(key: string, value: T) {
      // A structured copy, as Durable Object storage keeps: a caller mutating
      // what it put must not change what is stored.
      entries.set(key, structuredClone(value));
    },
    async delete(key: string) {
      return entries.delete(key);
    },
    async list<T>({ prefix, limit }: { prefix: string; limit?: number }) {
      const keys = [...entries.keys()].filter((k) => k.startsWith(prefix)).sort();
      const out = new Map<string, T>();
      for (const key of keys.slice(0, limit ?? keys.length)) {
        out.set(key, structuredClone(entries.get(key)) as T);
      }
      return out;
    },
    async getAlarm() {
      return alarm;
    },
    async setAlarm(scheduledTime: number) {
      alarm = scheduledTime;
    },
    takeAlarm() {
      const at = alarm;
      alarm = null;
      return at;
    },
  };
}
