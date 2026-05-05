import { STRINGS } from "./data/ui-strings.js";

export const SUPPORTED_LOCALES = ["ru", "en"];
export const DEFAULT_LOCALE = "ru";

function lookup(locale, key) {
  return key.split(".").reduce((current, part) => current?.[part], STRINGS[locale]);
}

export function normalizeLocale(locale) {
  return SUPPORTED_LOCALES.includes(locale) ? locale : DEFAULT_LOCALE;
}

export function getLocaleLabel(locale) {
  return locale === "ru" ? "\u0420\u0443\u0441\u0441\u043a\u0438\u0439" : "English";
}

export function t(locale, key, params = {}) {
  const safeLocale = normalizeLocale(locale);
  let message = lookup(safeLocale, key) ?? lookup(DEFAULT_LOCALE, key) ?? key;
  if (typeof message !== "string") {
    return message;
  }

  return message.replace(/\{(\w+)\}/g, (_, token) => `${params[token] ?? ""}`);
}

export function getLocalizedText(locale, value) {
  if (value === null || value === undefined) {
    return "";
  }

  if (typeof value === "string") {
    return value;
  }

  const safeLocale = normalizeLocale(locale);
  return value[safeLocale] ?? value[DEFAULT_LOCALE] ?? "";
}
