import i18n from "i18next";
import { initReactI18next } from "react-i18next";

// Import translation files
import koCommon from "./locales/ko/common.json";
import koNavigation from "./locales/ko/navigation.json";
import koAuth from "./locales/ko/auth.json";
import koProject from "./locales/ko/project.json";
import koStudio from "./locales/ko/studio.json";
import koHome from "./locales/ko/home.json";

import enCommon from "./locales/en/common.json";
import enNavigation from "./locales/en/navigation.json";
import enAuth from "./locales/en/auth.json";
import enProject from "./locales/en/project.json";
import enStudio from "./locales/en/studio.json";
import enHome from "./locales/en/home.json";

export type Locale = "ko" | "en";
export type TranslationNamespace = "common" | "navigation" | "auth" | "project" | "studio" | "home";

export const defaultLocale: Locale = "ko";
export const supportedLocales: Locale[] = ["ko", "en"];

const resources = {
  ko: {
    common: koCommon,
    navigation: koNavigation,
    auth: koAuth,
    project: koProject,
    studio: koStudio,
    home: koHome,
  },
  en: {
    common: enCommon,
    navigation: enNavigation,
    auth: enAuth,
    project: enProject,
    studio: enStudio,
    home: enHome,
  },
};

export function initI18n(locale: Locale = defaultLocale) {
  if (!i18n.isInitialized) {
    i18n.use(initReactI18next).init({
      lng: locale,
      fallbackLng: defaultLocale,
      resources,
      defaultNS: "common",
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
  } else {
    i18n.changeLanguage(locale);
  }

  return i18n;
}

export { i18n };
