import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../stores/appStore";
import { RTL_LANGUAGES } from "../constants/languages";
import { loadAndChangeLanguage } from "../i18n";

export type TranslateFn = (key: string, params?: Record<string, unknown>) => string;

export interface TranslateBag {
  t: TranslateFn;
  language: string;
}

export function useTranslate(): TranslateBag {
  const { t: i18nT, i18n: i18nInstance } = useTranslation();
  const language = useAppStore((s) => s.language);

  useEffect(() => {
    if (i18nInstance.language !== language) {
      // loadAndChangeLanguage fetches the locale bundle on demand if
      // it isn't already loaded (only the initial language ships with
      // the entry chunk). Fire-and-forget — render uses whatever
      // bundle is active until the new one resolves.
      loadAndChangeLanguage(language);
    }
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("lang", language);
      document.documentElement.setAttribute("dir", RTL_LANGUAGES.has(language) ? "rtl" : "ltr");
    }
  }, [language, i18nInstance]);

  const t: TranslateFn = (key, params) => i18nT(key, params) as string;

  return { t, language };
}
