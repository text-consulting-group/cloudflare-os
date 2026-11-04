// Telemetry for Durable Object reset rejections.
//
// workerd tags rejections from a reset or disconnected DO with structured flags (jsg/util.c++):
// `retryable` ⇔ connection lost, `overloaded` ⇔ load shedding, and `durableObjectReset`
// whenever the object's incarnation died — the production storage-timeout reset arrives as
// `{remote, overloaded, durableObjectReset}`. The flags are attached natively in the calling
// Worker, so no message matching is needed. Local vitest-pool-workers aborts reject FLAGLESS
// (pinned by the "user-DO reset flags" integration test), so this predicate is unit-tested
// with synthetic production shapes.

import { createWorkshopLogger } from "./observability";

const logger = createWorkshopLogger("workshop.server");

/**
 * True for rejections caused by a DO reset or lost connection. These are requests that could make
 * sense to retry (although as of this writing, the code does not do so). `overloaded` is excluded
 * because when the DO is overloaded, retrying would make the problem worse.
 */
export function isDoResetError(e: unknown): boolean {
  if (typeof e !== "object" || e === null) return false;
  const flags = e as { durableObjectReset?: unknown; retryable?: unknown };
  return flags.durableObjectReset === true || flags.retryable === true;
}

/**
 * True for opaque workerd JSRPC failures ("internal error; reference = ..."). These wrap an
 * exception thrown on the far side of a nested RPC call and hide the original error. They can be
 * transient (output gate, connection blips, brief DO overload), so read-only calls may retry them
 * briefly (issue #31).
 */
export function isTransientInternalRpcError(e: unknown): boolean {
  return e instanceof Error && e.message.includes("internal error");
}

/** Wraps a DO stub so every method call observes DO-reset rejections for telemetry
 * (`user_do.reset.surfaced`, with the method name as the operation) and rethrows them
 * unchanged. Transient opaque JSRPC failures ("internal error") are retried up to 2 times
 * with a short backoff before giving up (issue #31). Otherwise transparent. Pass the caller's
 * logger so the log attributes the reset to the component (and context, e.g. gadgetId) that
 * observed it; defaults to the Worker's. */
export function wrapDoStubForTelemetry<T extends { id: DurableObjectId }>(
    stub: T, log: ReturnType<typeof createWorkshopLogger> = logger): T {
  return new Proxy(stub, {
    get(target, prop) {
      const value = Reflect.get(target, prop) as unknown;
      if (typeof value !== "function") return value;
      // Invoke through the stub (`target[prop](...)`) rather than `.apply` on the extracted
      // handle: native RPC method handles are themselves proxies, and touching `.apply` on one
      // is interpreted as a nested RPC property access (the DO then rejects a call to "apply").
      const methods = target as unknown as Record<PropertyKey, (...a: unknown[]) => unknown>;
      if (typeof prop !== "string") return (...args: unknown[]) => methods[prop](...args);
      return (...args: unknown[]) => {
        const call = () => methods[prop](...args);
        const result = call();
        if (typeof (result as PromiseLike<unknown> | undefined)?.then !== "function") return result;
        return (async () => {
          const maxAttempts = 3;
          let lastErr: unknown;
          for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
              return await (attempt === 1 ? result : call());
            } catch (e) {
              lastErr = e;
              if (isDoResetError(e)) {
                log.warn("user DO reset observed", {
                  event: "user_do.reset.surfaced",
                  operation: prop,
                  durableObjectId: target.id.toString(),
                  error: e,
                });
                throw e;  // DO resets are not retried: the object may need re-initialization.
              }
              if (!isTransientInternalRpcError(e) || attempt === maxAttempts) break;
              log.warn("DO RPC transient error, retrying", {
                event: "do_rpc.retry",
                operation: prop,
                sequence: attempt,
                durableObjectId: target.id.toString(),
                error: e,
              });
              await new Promise((resolve) => setTimeout(resolve, 50 * attempt));
            }
          }
          if (isDoResetError(lastErr)) throw lastErr;  // already logged above
          if (isTransientInternalRpcError(lastErr)) {
            log.error("DO RPC transient error exhausted retries", {
              event: "do_rpc.retry.exhausted",
              operation: prop,
              failureCount: maxAttempts,
              durableObjectId: target.id.toString(),
              error: lastErr,
            });
          }
          throw lastErr;
        })();
      };
    },
  });
}
