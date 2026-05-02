import { useQuery, type UseQueryResult } from "@tanstack/react-query";
import { requestJson } from "../utils/helpers";

interface SearchOptions {
  limit?: number;
  primeOnly?: boolean;
}

export function useItemDrops<T = unknown>(uniqueName: string | null | undefined): UseQueryResult<T> {
  return useQuery({
    queryKey: ["itemDrops", uniqueName],
    queryFn: () => requestJson<T>(`/api/items/drops/${encodeURIComponent(uniqueName!)}`),
    enabled: !!uniqueName,
  });
}

export function useSearchItems<T = unknown>(
  search: string,
  options: SearchOptions = {},
): UseQueryResult<T> {
  return useQuery({
    queryKey: ["searchItems", search, options.limit, options.primeOnly],
    queryFn: () =>
      requestJson<T>(
        `/api/items?search=${encodeURIComponent(search)}&limit=${options.limit || 30}${
          options.primeOnly ? "&primeOnly=true" : ""
        }`,
      ),
    enabled: (search?.trim()?.length || 0) > 0,
  });
}

export function useSearchItemsInitial<T = unknown>(
  search: string | null | undefined,
  enabled = true,
): UseQueryResult<T> {
  return useQuery({
    queryKey: ["searchItems", search || "__initial__"],
    queryFn: () => {
      const url = search?.trim()
        ? `/api/items?search=${encodeURIComponent(search)}&limit=40`
        : `/api/items?limit=40`;
      return requestJson<T>(url);
    },
    enabled,
  });
}

export function useSearchComponents<T = unknown>(search: string): UseQueryResult<T> {
  return useQuery({
    queryKey: ["searchComponents", search],
    queryFn: () => requestJson<T>(`/api/items/components?search=${encodeURIComponent(search)}&limit=40`),
    enabled: (search?.trim()?.length || 0) > 0,
  });
}
