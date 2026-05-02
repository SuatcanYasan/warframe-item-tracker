import Fuse, { type IFuseOptions } from "fuse.js";
import { useMemo } from "react";

export function useFuzzySearch<T>(
  items: T[],
  keys: string[],
  query: string | null | undefined,
  options: Partial<IFuseOptions<T>> = {},
): T[] {
  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys,
        threshold: 0.3,
        includeScore: true,
        ...options,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [items],
  );

  return useMemo(() => {
    if (!query?.trim()) return items;
    return fuse.search(query.trim()).map((r) => r.item);
  }, [fuse, query, items]);
}
