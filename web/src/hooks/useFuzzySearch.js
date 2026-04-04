import Fuse from 'fuse.js';
import { useMemo } from 'react';

export function useFuzzySearch(items, keys, query, options = {}) {
  const fuse = useMemo(() => new Fuse(items, {
    keys,
    threshold: 0.3,
    includeScore: true,
    ...options,
  }), [items]);

  return useMemo(() => {
    if (!query?.trim()) return items;
    return fuse.search(query.trim()).map(r => r.item);
  }, [fuse, query, items]);
}
