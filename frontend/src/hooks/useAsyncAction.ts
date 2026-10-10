import { useCallback, useState } from "react";

/** Wraps a mutation so callers get a pending flag and the last error. */
export function useAsyncAction<Args extends unknown[], Result>(action: (...args: Args) => Promise<Result>) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const run = useCallback(
    async (...args: Args): Promise<Result> => {
      setPending(true);
      setError(null);
      try {
        return await action(...args);
      } catch (caught) {
        const normalized = caught instanceof Error ? caught : new Error("Unexpected error");
        setError(normalized);
        throw normalized;
      } finally {
        setPending(false);
      }
    },
    [action],
  );

  return { run, pending, error, resetError: () => setError(null) };
}
