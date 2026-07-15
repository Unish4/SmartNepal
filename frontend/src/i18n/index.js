import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import commonEN from "../locales/en/common.json";
import authEN from "../locales/en/auth.json";
import issuesEN from "../locales/en/issues.json";
import adminEN from "../locales/en/admin.json";
import fieldEN from "../locales/en/field.json";
import navbarEN from "../locales/en/navbar.json";

import commonNE from "../locales/ne/common.json";
import authNE from "../locales/ne/auth.json";
import issuesNE from "../locales/ne/issues.json";
import adminNE from "../locales/ne/admin.json";
import fieldNE from "../locales/ne/field.json";
import navbarNE from "../locales/ne/navbar.json";

const resources = {
  en: {
    common: commonEN,
    auth: authEN,
    issues: issuesEN,
    admin: adminEN,
    field: fieldEN,
    navbar: navbarEN,
  },
  ne: {
    common: commonNE,
    auth: authNE,
    issues: issuesNE,
    admin: adminNE,
    field: fieldNE,
    navbar: navbarNE,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: ["en", "ne"],
    load: "languageOnly",
    ns: ["common", "auth", "issues", "admin", "field", "navbar"],
    defaultNS: "common",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: "nepalsewa-language",
    },
  });

document.documentElement.lang = i18n.language;
i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
});

export default i18n;
