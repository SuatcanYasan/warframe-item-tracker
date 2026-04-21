import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { requestJson } from "../utils/helpers";

// Module-level cache so every hook instance across all components sees the
// same data. useQuery on top of this deduplicates in-flight requests and
// holds the result in its own cache, so /api/i18n fires once per language
// per session instead of once per mounted component.
const namesCache = {};

export default function useItemI18n(language) {
  const enabled = language !== "en" && !namesCache[language];

  useQuery({
    queryKey: ["item-i18n", language],
    queryFn: async () => {
      const data = await requestJson(`/api/i18n?lang=${encodeURIComponent(language)}`);
      namesCache[language] = data.names || {};
      return namesCache[language];
    },
    enabled,
    staleTime: Infinity,
    gcTime: Infinity,
    retry: 1,
  });

  return useCallback(
    (uniqueName, fallbackName) => {
      if (language === "en") return fallbackName;
      const names = namesCache[language];
      if (!names) return fallbackName;
      return names[uniqueName] || fallbackName;
    },
    [language],
  );
}
