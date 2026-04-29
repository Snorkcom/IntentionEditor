export function nextUid(prefix = "uid") {
  nextUid.counter = (nextUid.counter ?? 0) + 1;
  return `${prefix}-${nextUid.counter}`;
}

export function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

export function todayIsoDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  const day = `${now.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function slugifyIdentifier(value) {
  return `${value ?? ""}`
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^A-Za-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .toLowerCase();
}

export function escapeHtml(value) {
  return `${value ?? ""}`
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function nonEmpty(value) {
  return `${value ?? ""}`.trim();
}

export function formatCount(value, singular, plural = `${singular}s`) {
  return `${value} ${value === 1 ? singular : plural}`;
}

export function isIsoDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(`${value ?? ""}`)) {
    return false;
  }

  const [year, month, day] = `${value}`.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year
    && date.getUTCMonth() === month - 1
    && date.getUTCDate() === day;
}

export function isHexColor(value) {
  return /^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(`${value ?? ""}`.trim());
}

export function isIntString(value) {
  return /^-?\d+$/.test(`${value ?? ""}`.trim());
}

export function isFloatString(value) {
  return /^-?\d+(\.\d+)?$/.test(`${value ?? ""}`.trim());
}

export function isBooleanString(value) {
  return /^(true|false)$/i.test(`${value ?? ""}`.trim());
}

export function isTimeSpanString(value) {
  return /^\d{1,2}:\d{2}:\d{2}$/.test(`${value ?? ""}`.trim());
}

export function fileSafeName(value, fallback = "intentions-package") {
  const slug = slugifyIdentifier(value);
  return slug.length > 0 ? slug : fallback;
}

export function splitTagsInput(text) {
  return `${text ?? ""}`
    .split(",")
    .map(tag => tag.trim())
    .filter(tag => tag.length > 0);
}

export function tagsToInput(tags) {
  return (Array.isArray(tags) ? tags : []).join(", ");
}

export function ensureTagsBuffer(intention) {
  const raw = intention.tagsInput ?? tagsToInput(intention.tags ?? []);
  return {
    ...intention,
    tagsInput: raw,
    tags: splitTagsInput(raw)
  };
}

export function normalizeTagsOnBlur(intention) {
  const tags = splitTagsInput(intention.tagsInput ?? intention.tags ?? []);
  intention.tags = tags;
  intention.tagsInput = tagsToInput(tags);
}

export function sortStrings(values, locale = "ru") {
  return [...values].sort((left, right) => left.localeCompare(right, locale));
}
