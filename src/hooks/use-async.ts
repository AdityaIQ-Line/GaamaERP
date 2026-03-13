import * as React from "react"

// ─── Types ────────────────────────────────────────────────────────────────────

export type AsyncStatus = "idle" | "loading" | "success" | "error"

export interface AsyncState<T> {
  /** The resolved data, or `undefined` if not yet loaded */
  data: T | undefined
  /** True while the async function is running */
  loading: boolean
  /** The error thrown by the async function, or `undefined` */
  error: Error | undefined
  /** Granular status string — useful for conditional rendering */
  status: AsyncStatus
}

export interface UseAsyncReturn<T, Args extends unknown[]> extends AsyncState<T> {
  /**
   * Run the async function.
   * Returns the resolved value, or `undefined` if it threw.
   */
  execute: (...args: Args) => Promise<T | undefined>
  /** Reset state back to idle */
  reset: () => void
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * `useAsync` — wraps any async function with loading / error / data state.
 *
 * Pass `{ immediate: true }` to run the function on mount (no-arg functions only).
 *
 * @example
 * ```tsx
 * // Manual trigger (e.g. button click)
 * const { data, loading, error, execute } = useAsync(fetchUser)
 *
 * const handleLoad = () => execute(userId)
 *
 * // Auto-run on mount
 * const { data, loading } = useAsync(fetchSettings, { immediate: true })
 * ```
 */
export function useAsync<T, Args extends unknown[] = []>(
  asyncFn: (...args: Args) => Promise<T>,
  options: { immediate?: boolean } = {}
): UseAsyncReturn<T, Args> {
  const { immediate = false } = options

  const [state, setState] = React.useState<AsyncState<T>>({
    data: undefined,
    loading: immediate,
    error: undefined,
    status: immediate ? "loading" : "idle",
  })

  // Keep a stable ref so execute() never goes stale inside callbacks
  const asyncFnRef = React.useRef(asyncFn)
  React.useEffect(() => {
    asyncFnRef.current = asyncFn
  }, [asyncFn])

  // Guard against setting state after unmount
  const mountedRef = React.useRef(true)
  React.useEffect(() => {
    mountedRef.current = true
    return () => { mountedRef.current = false }
  }, [])

  const execute = React.useCallback(async (...args: Args): Promise<T | undefined> => {
    setState({ data: undefined, loading: true, error: undefined, status: "loading" })
    try {
      const result = await asyncFnRef.current(...args)
      if (mountedRef.current) {
        setState({ data: result, loading: false, error: undefined, status: "success" })
      }
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      if (mountedRef.current) {
        setState({ data: undefined, loading: false, error, status: "error" })
      }
      return undefined
    }
  }, [])

  const reset = React.useCallback(() => {
    setState({ data: undefined, loading: false, error: undefined, status: "idle" })
  }, [])

  // Auto-run on mount when `immediate` is true
  React.useEffect(() => {
    if (immediate) {
      execute(...([] as unknown as Args))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return { ...state, execute, reset }
}
