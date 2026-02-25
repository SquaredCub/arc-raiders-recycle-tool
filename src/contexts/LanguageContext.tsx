import { useCallback, useMemo, useState, type ReactNode } from "react";
import {
  detectInitialLanguage,
  STORAGE_KEY,
  type LanguageCode,
} from "../localization/languageUtils";
import { UI_STRINGS, type UIStringKey } from "../localization/uiStrings";
import {
  LanguageContext,
  type LanguageContextType,
} from "./LanguageContextDefinition";

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [language, setLanguageState] =
    useState<LanguageCode>(detectInitialLanguage);

  const setLanguage = useCallback((lang: LanguageCode) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }, []);

  const translateUI = useCallback(
    (key: UIStringKey): string => {
      const entry = UI_STRINGS[key];
      if (!entry) return key;
      return entry[language] ?? entry.en;
    },
    [language],
  );

  const value: LanguageContextType = useMemo(
    () => ({ language, setLanguage, translateUI }),
    [language, setLanguage, translateUI],
  );

  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
};
