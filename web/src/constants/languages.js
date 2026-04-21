// Supported UI languages.
// Flags served from flagcdn.com (SVG, ~1KB each, cacheable).
// `code` matches ISO 639-1 (2 letters). `region` is used for the flag only.
export const SUPPORTED_LANGUAGES = [
  { code: "tr", label: "Türkçe",     flag: "tr" },
  { code: "en", label: "English",    flag: "gb" },
  { code: "de", label: "Deutsch",    flag: "de" },
  { code: "fr", label: "Français",   flag: "fr" },
  { code: "es", label: "Español",    flag: "es" },
  { code: "it", label: "Italiano",   flag: "it" },
  { code: "pt", label: "Português",  flag: "pt" },
  { code: "ru", label: "Русский",    flag: "ru" },
  { code: "ja", label: "日本語",      flag: "jp" },
  { code: "ar", label: "العربية",    flag: "sa" },
];

export const SUPPORTED_LANGUAGE_CODES = SUPPORTED_LANGUAGES.map((l) => l.code);

export const DEFAULT_LANGUAGE = "en";

export function flagUrl(region, size = "40x30") {
  return `https://flagcdn.com/${size}/${region}.png`;
}

// Detect browser language and match against supported. Falls back to EN.
export function detectBrowserLanguage() {
  if (typeof navigator === "undefined") return DEFAULT_LANGUAGE;
  const raw = (navigator.language || navigator.userLanguage || "").toLowerCase();
  const short = raw.slice(0, 2);
  return SUPPORTED_LANGUAGE_CODES.includes(short) ? short : DEFAULT_LANGUAGE;
}

// RTL languages — used for setting `dir="rtl"` on the document.
export const RTL_LANGUAGES = new Set(["ar"]);
