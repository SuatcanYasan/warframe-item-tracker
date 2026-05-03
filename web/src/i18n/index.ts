import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { detectBrowserLanguage, DEFAULT_LANGUAGE } from "../constants/languages";

// i18n initialization with **lazy locale loading**. Previously all 10
// language JSONs were eager-imported into the entry bundle (~100 KB
// gzip wasted on translations the user will never read). Now only the
// detected/preferred language is loaded at startup; the other 9 sit in
// their own Vite chunks and are fetched on-demand when the user
// switches languages via loadAndChangeLanguage().
//
// Top-level await blocks main.tsx until the initial bundle resolves,
// so the first paint sees real translations (no key flash). Vite turns
// the template literal below into one chunk per matching JSON file.
const initialLang = detectBrowserLanguage();

async function loadLocale(lang: string) {
  return import(`../locales/${lang}.json`);
}

let initial;
try {
  initial = await loadLocale(initialLang);
} catch {
  initial = await loadLocale(DEFAULT_LANGUAGE);
}

await i18n.use(initReactI18next).init({
  resources: { [initialLang]: { translation: initial.default } },
  lng: initialLang,
  // Self-fallback keeps the bundle minimal — if a key is missing we
  // show the key string rather than fetching the English JSON to look
  // it up. Acceptable trade-off for our small payload.
  fallbackLng: initialLang,
  interpolation: { escapeValue: false, prefix: "{", suffix: "}" },
});

export async function loadAndChangeLanguage(targetLang: string): Promise<void> {
  if (!i18n.hasResourceBundle(targetLang, "translation")) {
    try {
      const data = await loadLocale(targetLang);
      i18n.addResourceBundle(targetLang, "translation", data.default);
    } catch {
      // Silent fall-through; i18n.changeLanguage will then use whatever
      // bundle is loaded or the fallback.
      // eslint-disable-next-line no-console
      console.warn(`[i18n] failed to load locale: ${targetLang}`);
    }
  }
  await i18n.changeLanguage(targetLang);
}

export default i18n;
