import { createContext } from "react";
import type { LanguageCode } from "../localization/languageUtils";
import type { UIStringKey } from "../localization/uiStrings";

export interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  translateUI: (key: UIStringKey) => string;
}

export const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);
