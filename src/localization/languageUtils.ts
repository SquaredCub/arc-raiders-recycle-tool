import type { LocalizedText } from "../generated/types";

export type LanguageCode = keyof LocalizedText;

export interface SupportedLanguage {
  code: LanguageCode;
  label: string;
}

// All supported languages for the picker UI
// "kr" is excluded — it's a legacy duplicate; Korean users select "ko-KR"
export const SUPPORTED_LANGUAGES: SupportedLanguage[] = [
  { code: "en", label: "English" },
  { code: "da", label: "Dansk" },
  { code: "de", label: "Deutsch" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
  { code: "he", label: "עברית" },
  { code: "hr", label: "Hrvatski" },
  { code: "it", label: "Italiano" },
  { code: "ja", label: "日本語" },
  { code: "ko-KR", label: "한국어" },
  { code: "no", label: "Norsk" },
  { code: "pl", label: "Polski" },
  { code: "pt", label: "Português" },
  { code: "pt-BR", label: "Português (Brasil)" },
  { code: "ru", label: "Русский" },
  { code: "sr", label: "Српски" },
  { code: "tr", label: "Türkçe" },
  { code: "uk", label: "Українська" },
  { code: "zh-CN", label: "简体中文" },
  { code: "zh-TW", label: "繁體中文" },
];

const VALID_CODES = new Set<string>(SUPPORTED_LANGUAGES.map((l) => l.code));

export const STORAGE_KEY = "arc-recycle-language";

/**
 * Resolve a navigator.language string to a supported LanguageCode.
 * Tries exact match, then Korean special case, then prefix match, then "en".
 */
export const resolveLanguageCode = (browserLang: string): LanguageCode => {
  // Exact match
  if (VALID_CODES.has(browserLang)) return browserLang as LanguageCode;

  // Korean special case: "ko" or "ko-*" → "ko-KR"
  if (browserLang === "ko" || browserLang.startsWith("ko-"))
    return "ko-KR";

  // Prefix match: "en-US" → "en", "de-AT" → "de"
  const prefix = browserLang.split("-")[0];
  if (VALID_CODES.has(prefix)) return prefix as LanguageCode;

  return "en";
};

/**
 * Get localized text with Korean fallback logic + English fallback.
 * For Korean: tries ko-KR → kr → en.
 * For others: tries language → en.
 */
export const getLocalizedText = (
  localized: LocalizedText,
  language: LanguageCode,
): string => {
  if (language === "ko-KR") {
    return localized["ko-KR"] ?? localized["kr"] ?? localized.en ?? "";
  }
  return localized[language] ?? localized.en ?? "";
};

/**
 * Detect initial language: localStorage → navigator.languages → "en"
 */
export const detectInitialLanguage = (): LanguageCode => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && VALID_CODES.has(stored)) return stored as LanguageCode;

  const browserLangs = navigator.languages ?? [navigator.language];
  for (const lang of browserLangs) {
    const resolved = resolveLanguageCode(lang);
    if (resolved !== "en") return resolved;
  }
  return resolveLanguageCode(browserLangs[0] ?? "en");
};
