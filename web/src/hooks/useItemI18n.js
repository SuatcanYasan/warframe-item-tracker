import { useCallback, useEffect, useRef, useState } from "react";
import { requestJson } from "../utils/helpers";

export default function useItemI18n(language) {
  const cacheRef = useRef({});
  const [ready, setReady] = useState(language === "en");

  useEffect(() => {
    if (language === "en") {
      setReady(true);
      return;
    }

    if (cacheRef.current[language]) {
      setReady(true);
      return;
    }

    let cancelled = false;
    setReady(false);

    requestJson(`/api/i18n?lang=${encodeURIComponent(language)}`)
      .then((data) => {
        if (cancelled) return;
        cacheRef.current[language] = data.names || {};
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(true);
      });

    return () => { cancelled = true; };
  }, [language]);

  const translateItemName = useCallback(
    (uniqueName, fallbackName) => {
      if (language === "en") return fallbackName;
      const names = cacheRef.current[language];
      if (!names) return fallbackName;
      return names[uniqueName] || fallbackName;
    },
    [language, ready],
  );

  return translateItemName;
}
