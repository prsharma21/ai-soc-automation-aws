import { useCallback, useEffect, useRef, useState, type DependencyList } from "react";

export type AsyncState<T> =
  | { status: "loading"; data: T | undefined; error: undefined }
  | { status: "success"; data: T; error: undefined }
  | { status: "error"; data: T | undefined; error: Error };

/**
 * Runs `loader` whenever `deps` change. Previous data is kept during reloads so
 * tables don't flash, and stale responses from superseded requests are ignored.
 */
export function useAsync<T>(loader: () => Promise<T>, deps: DependencyList) {
  const [state, setState] = useState<AsyncState<T>>({ status: "loading", data: undefined, error: undefined });
  const [attempt, setAttempt] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    let cancelled = false;
    setState((previous) => ({ status: "loading", data: previous.data, error: undefined }));
    loaderRef
      .current()
      .then((data) => {
        if (!cancelled) setState({ status: "success", data, error: undefined });
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          setState((previous) => ({
            status: "error",
            data: previous.data,
            error: error instanceof Error ? error : new Error("Unexpected error"),
          }));
        }
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, attempt]);

  const reload = useCallback(() => setAttempt((value) => value + 1), []);

  return { ...state, reload, isInitialLoading: state.status === "loading" && state.data === undefined };
}
