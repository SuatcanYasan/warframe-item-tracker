import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { i18n as messages } from "../constants/i18n";

i18n.use(initReactI18next).init({
  resources: {
    tr: { translation: messages.tr },
    en: { translation: messages.en },
  },
  lng: "tr",
  fallbackLng: "tr",
  interpolation: {
    escapeValue: false,
    prefix: "{",
    suffix: "}",
  },
});

export default i18n;
