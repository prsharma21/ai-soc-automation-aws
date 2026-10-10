import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";

/**
 * Keeps list filters in the URL so views are shareable and survive refresh.
 * Values equal to their default are omitted from the URL. Changing any key
 * other than `page` resets `page` to its default.
 */
export function useQueryState<T extends Record<string, string>>(defaults: T) {
  const [searchParams, setSearchParams] = useSearchParams();

  const values = useMemo(() => {
    const result = { ...defaults };
    for (const key of Object.keys(defaults) as (keyof T & string)[]) {
      const fromUrl = searchParams.get(key);
      if (fromUrl !== null) result[key] = fromUrl as T[typeof key];
    }
    return result;
  }, [defaults, searchParams]);

  const setValues = useCallback(
    (changes: Partial<T>) => {
      setSearchParams(
        (previous) => {
          const next = new URLSearchParams(previous);
          const touchesFilters = Object.keys(changes).some((key) => key !== "page");
          const merged: Record<string, string | undefined> = { ...changes };
          if (touchesFilters && "page" in defaults && !("page" in changes)) merged.page = defaults.page;
          for (const [key, value] of Object.entries(merged)) {
            if (value === undefined || value === defaults[key]) next.delete(key);
            else next.set(key, value);
          }
          return next;
        },
        { replace: true },
      );
    },
    [defaults, setSearchParams],
  );

  const reset = useCallback(() => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous);
        Object.keys(defaults).forEach((key) => next.delete(key));
        return next;
      },
      { replace: true },
    );
  }, [defaults, setSearchParams]);

  const isFiltered = useMemo(
    () => (Object.keys(defaults) as (keyof T)[]).some((key) => key !== "page" && values[key] !== defaults[key]),
    [defaults, values],
  );

  return { values, setValues, reset, isFiltered };
}
