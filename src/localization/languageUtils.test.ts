import { describe, it, expect, beforeEach } from "@jest/globals";
import {
  resolveLanguageCode,
  getLocalizedText,
  detectInitialLanguage,
  SUPPORTED_LANGUAGES,
  STORAGE_KEY,
} from "./languageUtils";
import type { LocalizedText } from "../generated/types";

describe("resolveLanguageCode", () => {
  it("returns exact match for supported language", () => {
    expect(resolveLanguageCode("fr")).toBe("fr");
    expect(resolveLanguageCode("de")).toBe("de");
    expect(resolveLanguageCode("pt-BR")).toBe("pt-BR");
    expect(resolveLanguageCode("zh-CN")).toBe("zh-CN");
  });

  it("resolves Korean variants to ko-KR", () => {
    expect(resolveLanguageCode("ko")).toBe("ko-KR");
    expect(resolveLanguageCode("ko-KR")).toBe("ko-KR");
    expect(resolveLanguageCode("ko-Hang")).toBe("ko-KR");
  });

  it("strips region suffix for prefix match", () => {
    expect(resolveLanguageCode("en-US")).toBe("en");
    expect(resolveLanguageCode("en-GB")).toBe("en");
    expect(resolveLanguageCode("de-AT")).toBe("de");
    expect(resolveLanguageCode("fr-CA")).toBe("fr");
    expect(resolveLanguageCode("es-MX")).toBe("es");
  });

  it("falls back to en for unknown languages", () => {
    expect(resolveLanguageCode("xx")).toBe("en");
    expect(resolveLanguageCode("xyz-ZZ")).toBe("en");
    expect(resolveLanguageCode("")).toBe("en");
  });
});

describe("getLocalizedText", () => {
  const mockText: LocalizedText = {
    en: "English",
    fr: "Français",
    de: "Deutsch",
    "ko-KR": "한국어 KR",
    kr: "한국어 KR legacy",
  } as LocalizedText;

  it("returns text for the requested language", () => {
    expect(getLocalizedText(mockText, "fr")).toBe("Français");
    expect(getLocalizedText(mockText, "de")).toBe("Deutsch");
  });

  it("falls back to English for missing language", () => {
    expect(getLocalizedText(mockText, "ja")).toBe("English");
  });

  it("returns ko-KR text when language is ko-KR", () => {
    expect(getLocalizedText(mockText, "ko-KR")).toBe("한국어 KR");
  });

  it("falls back ko-KR → kr → en", () => {
    const textWithOnlyKr = {
      en: "English",
      kr: "Korean legacy",
    } as LocalizedText;
    expect(getLocalizedText(textWithOnlyKr, "ko-KR")).toBe("Korean legacy");

    const textWithOnlyEn = { en: "English" } as LocalizedText;
    expect(getLocalizedText(textWithOnlyEn, "ko-KR")).toBe("English");
  });

  it("returns empty string when no text available", () => {
    const empty = {} as LocalizedText;
    expect(getLocalizedText(empty, "en")).toBe("");
  });
});

describe("detectInitialLanguage", () => {
  const mockStorage: Record<string, string> = {};

  beforeEach(() => {
    for (const key of Object.keys(mockStorage)) delete mockStorage[key];

    Object.defineProperty(globalThis, "localStorage", {
      value: {
        getItem: (key: string) => mockStorage[key] ?? null,
        setItem: (key: string, value: string) => { mockStorage[key] = value; },
        clear: () => { for (const key of Object.keys(mockStorage)) delete mockStorage[key]; },
      },
      writable: true,
      configurable: true,
    });

    Object.defineProperty(globalThis, "navigator", {
      value: {
        languages: ["en-US"],
        language: "en-US",
      },
      writable: true,
      configurable: true,
    });
  });

  it("returns stored language from localStorage", () => {
    mockStorage[STORAGE_KEY] = "fr";
    expect(detectInitialLanguage()).toBe("fr");
  });

  it("ignores invalid stored language", () => {
    mockStorage[STORAGE_KEY] = "invalid-lang";
    // Falls through to navigator.languages → resolves "en-US" → "en"
    expect(detectInitialLanguage()).toBe("en");
  });

  it("resolves from navigator.languages when no stored value", () => {
    Object.defineProperty(globalThis, "navigator", {
      value: { languages: ["de-AT", "en"], language: "de-AT" },
      writable: true,
      configurable: true,
    });
    expect(detectInitialLanguage()).toBe("de");
  });

  it("returns en when navigator has only English", () => {
    expect(detectInitialLanguage()).toBe("en");
  });
});

describe("SUPPORTED_LANGUAGES", () => {
  it("does not include legacy kr code", () => {
    expect(SUPPORTED_LANGUAGES.find((l) => l.code === "kr" as never)).toBeUndefined();
  });

  it("includes ko-KR for Korean", () => {
    expect(SUPPORTED_LANGUAGES.find((l) => l.code === "ko-KR")).toBeDefined();
  });

  it("includes English as first entry", () => {
    expect(SUPPORTED_LANGUAGES[0].code).toBe("en");
  });

  it("has unique codes", () => {
    const codes = SUPPORTED_LANGUAGES.map((l) => l.code);
    expect(new Set(codes).size).toBe(codes.length);
  });
});
