import { useQuery } from '@tanstack/react-query';
import { requestJson } from '../utils/helpers';

export function useItemDrops(uniqueName) {
  return useQuery({
    queryKey: ['itemDrops', uniqueName],
    queryFn: () => requestJson(`/api/items/drops/${encodeURIComponent(uniqueName)}`),
    enabled: !!uniqueName,
  });
}

export function useSearchItems(search, options = {}) {
  return useQuery({
    queryKey: ['searchItems', search, options.limit, options.primeOnly],
    queryFn: () => requestJson(`/api/items?search=${encodeURIComponent(search)}&limit=${options.limit || 30}${options.primeOnly ? '&primeOnly=true' : ''}`),
    enabled: search?.trim()?.length > 0,
  });
}

export function useSearchItemsInitial(search, enabled = true) {
  return useQuery({
    queryKey: ['searchItems', search || '__initial__'],
    queryFn: () => {
      const url = search?.trim()
        ? `/api/items?search=${encodeURIComponent(search)}&limit=40`
        : `/api/items?limit=40`;
      return requestJson(url);
    },
    enabled,
  });
}

export function useSearchComponents(search) {
  return useQuery({
    queryKey: ['searchComponents', search],
    queryFn: () => requestJson(`/api/items/components?search=${encodeURIComponent(search)}&limit=40`),
    enabled: search?.trim()?.length > 0,
  });
}
