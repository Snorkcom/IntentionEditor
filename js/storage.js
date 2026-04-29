import { LOCALE_STORAGE_KEY, STORAGE_KEY } from "./constants.js";
import { DEFAULT_LOCALE, normalizeLocale } from "./i18n.js";
import { normalizeDraft } from "./draft.js";

export function loadDraft(locale = DEFAULT_LOCALE) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    return normalizeDraft(JSON.parse(raw), locale);
  } catch (error) {
    console.warn("Failed to load IntentionEditor draft:", error);
    return null;
  }
}

export function saveDraft(draft) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch (error) {
    console.warn("Failed to save IntentionEditor draft:", error);
  }
}

export function clearDraft() {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.warn("Failed to clear IntentionEditor draft:", error);
  }
}

export function loadLocale() {
  try {
    return normalizeLocale(window.localStorage.getItem(LOCALE_STORAGE_KEY) ?? DEFAULT_LOCALE);
  } catch (error) {
    console.warn("Failed to load IntentionEditor locale:", error);
    return DEFAULT_LOCALE;
  }
}

export function saveLocale(locale) {
  try {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, normalizeLocale(locale));
  } catch (error) {
    console.warn("Failed to save IntentionEditor locale:", error);
  }
}
