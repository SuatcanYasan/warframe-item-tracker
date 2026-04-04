import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import useItemI18n from "./useItemI18n";
import { useAppStore } from "../stores/appStore";

export function useTranslate() {
  const { t: i18nT, i18n: i18nInstance } = useTranslation();
  const language = useAppStore((s) => s.language);

  useEffect(() => {
    if (i18nInstance.language !== language) {
      i18nInstance.changeLanguage(language);
    }
  }, [language, i18nInstance]);

  const t = (key, params) => i18nT(key, params);
  const tin = useItemI18n(language);

  return { t, tin, language };
}
