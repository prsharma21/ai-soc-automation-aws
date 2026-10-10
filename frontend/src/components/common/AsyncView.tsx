import type { ReactNode } from "react";
import type { AsyncState } from "@/hooks/useAsync";
import { ErrorState } from "./ErrorState";
import { LoadingState } from "./LoadingState";

interface AsyncViewProps<T> {
  state: AsyncState<T> & { reload: () => void };
  errorTitle: string;
  loading?: ReactNode;
  children: (data: T) => ReactNode;
}

/**
 * Renders loading, error, or content for a `useAsync` result. When a reload
 * fails after data was shown, the error is displayed instead of stale data.
 */
export function AsyncView<T>({ state, errorTitle, loading, children }: AsyncViewProps<T>) {
  if (state.status === "error") {
    return <ErrorState title={errorTitle} message={state.error.message} onRetry={state.reload} />;
  }
  if (state.data === undefined) {
    return <>{loading ?? <LoadingState />}</>;
  }
  return <>{children(state.data)}</>;
}
