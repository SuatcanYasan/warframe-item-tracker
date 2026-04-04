import { useAppStore } from "../stores/appStore";
import { translate } from "../constants/i18n";
import useItemI18n from "./useItemI18n";

export function useTranslate() {
  const language = useAppStore((s) => s.language);
  const t = (key, params) => translate(language, key, params);
  const tin = useItemI18n(language);
  return { t, tin, language };
}
