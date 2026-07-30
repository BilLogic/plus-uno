// Minimal declaration for the ONE Node built-in this Worker imports.
//
// The alternative is pulling in @types/node wholesale, which Cloudflare's docs
// suggest alongside nodejs_compat — but it globally overrides setTimeout to
// return Node's `Timeout` object when workerd actually returns a number. That
// makes `timer.unref()` typecheck and then throw at runtime: a compiler blessing
// a lie about the runtime, bought to import one class. This is the narrow
// purchase instead.
declare module "node:async_hooks" {
  export class AsyncLocalStorage<T> {
    run<R>(store: T, fn: () => R): R;
    getStore(): T | undefined;
  }
}
