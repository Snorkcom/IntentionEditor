import {
  APP_TITLE,
  APP_VERSION,
  PREDICATE_OPERATORS,
  PREDICATE_SCOPES,
  REVEAL_TYPES,
  TEXT_BINDING_SOURCES,
  TEXT_LIMITS,
  VISIBILITY_TYPES
} from "./constants.js";
import {
  CATEGORY_CATALOG,
  FIELD_DEFINITIONS,
  ROUND_TEXT_BINDING_FIELDS,
  TEXT_BINDING_FIELDS,
  getAllowedOperators,
  getDictionaryLabel,
  getDictionaryOptions,
  getDictionaryValues,
  getFieldDefinition,
  getFieldOptions
} from "./catalogs.js";
import {
  createEmptyDraft,
  createPredicate,
  createSecondaryIntention,
  createSecondarySlot,
  createTextBinding,
  getAllIntentions,
  getAllSlots,
  normalizeDraft
} from "./draft.js";
import { buildExportArtifacts, getLocKeysForIntentions } from "./exporters.js";
import { getLocaleLabel, getLocalizedText, t } from "./i18n.js";
import { clearDraft, loadDraft, loadLocale, loadTheme, saveDraft, saveLocale, saveTheme } from "./storage.js";
import {
  deepClone,
  escapeHtml,
  nonEmpty,
  normalizeTagsOnBlur,
  splitTagsInput
} from "./utils.js";
import { validateDraft } from "./validation.js";

const VISIBILITY_LABELS = {
  visible: { ru: "visible · видно", en: "visible" },
  hidden: { ru: "hidden · скрыто", en: "hidden" }
};

const REVEAL_LABELS = {
  none: { ru: "none · без авто-раскрытия", en: "none" },
  timer: { ru: "timer · по таймеру", en: "timer" }
};

const SOURCE_LABELS = {
  self: { ru: "self", en: "self" },
  slot: { ru: "slot", en: "slot" },
  round: { ru: "round", en: "round" },
  literal: { ru: "literal", en: "literal" }
};

const BOOLEAN_OPTIONS = [
  { id: "true", label: { ru: "true · да", en: "true" } },
  { id: "false", label: { ru: "false · нет", en: "false" } }
];

const MODAL_TYPES = {
  rules: "rules",
  categories: "categories"
};

const INTENTION_CONTENT_FIELDS = [
  "name",
  "summary",
  "description",
  "oocInfo",
  "copyableText",
  "hiddenLabel"
];

const HISTORY_MAX_DEPTH = 100;
const HISTORY_TEXT_COALESCE_MS = 1200;

function localized(locale, value) {
  return getLocalizedText(locale, value);
}

function fieldText(locale, key, params = {}) {
  return t(locale, `ui.fields.${key}`, params);
}

function hintText(locale, key, params = {}) {
  return t(locale, `ui.fieldHints.${key}`, params);
}

function buttonText(locale, key, params = {}) {
  return t(locale, `ui.buttons.${key}`, params);
}

function selectText(locale, key, params = {}) {
  return t(locale, `ui.select.${key}`, params);
}

function placeholderText(locale, key, params = {}) {
  return t(locale, `ui.placeholders.${key}`, params);
}

function exportText(locale, key, params = {}) {
  return t(locale, `ui.export.${key}`, params);
}

function issueSeverityText(locale, severity) {
  return t(locale, `severity.${severity}`);
}

function operatorLabel(locale, operator) {
  return t(locale, `operators.${operator}`);
}

function dictionaryLabel(locale, dictionaryName, value) {
  const label = getDictionaryLabel(dictionaryName, value);
  return typeof label === "string"
    ? label
    : localized(locale, label);
}

function predicateTitle(locale, index) {
  return locale === "ru" ? `Предикат ${index}` : `Predicate ${index}`;
}

function secondaryTemplateTitle(locale, index) {
  return locale === "ru" ? `Шаблон ${index}` : `Template ${index}`;
}

function secondarySlotTitle(locale, index) {
  return locale === "ru" ? `Слот ${index}` : `Slot ${index}`;
}

function renderHelpIcon(text) {
  if (!text) {
    return "";
  }

  return `
    <span class="help-icon" tabindex="0" aria-label="${escapeHtml(text)}" data-tooltip="${escapeHtml(text)}">?</span>
  `;
}

function renderFieldLabel(label, helpText = "") {
  return `
    <span class="field-label">
      ${escapeHtml(label)}
      ${renderHelpIcon(helpText)}
    </span>
  `;
}

function renderHint(text, counter = "") {
  if (!text && !counter) {
    return "";
  }

  return `
    <div class="field-hint-row">
      <span class="field-hint">${escapeHtml(text)}</span>
      ${counter}
    </div>
  `;
}

function renderCounter(current, max) {
  return `<span class="field-counter">${current} / ${max}</span>`;
}

function renderSelectOptions(locale, options, selectedValue, {
  allowEmpty = false,
  emptyLabel = ""
} = {}) {
  const html = [];
  if (allowEmpty) {
    html.push(`<option value="">${escapeHtml(emptyLabel || selectText(locale, "none"))}</option>`);
  }

  for (const option of options) {
    const selected = option.id === selectedValue ? " selected" : "";
    const label = typeof option.label === "string"
      ? option.label
      : localized(locale, option.label);
    html.push(`<option value="${escapeHtml(option.id)}"${selected}>${escapeHtml(label)}</option>`);
  }

  return html.join("");
}

function renderDatalist(id, values) {
  return `
    <datalist id="${escapeHtml(id)}">
      ${values.map(value => `<option value="${escapeHtml(value)}"></option>`).join("")}
    </datalist>
  `;
}

function getStatusTone(validation) {
  if (validation.errors.length > 0) {
    return "error";
  }
  if (validation.warnings.length > 0) {
    return "warning";
  }
  return "ok";
}

function createActionStatus(locale, key, params = {}, tone = "ok") {
  return {
    message: t(locale, key, params),
    tone
  };
}

export function mountApp(root) {
  const initialLocale = loadLocale();
  const initialDraft = loadDraft(initialLocale) ?? createEmptyDraft(initialLocale);
  const initialTheme = loadTheme();

  const state = {
    locale: initialLocale,
    theme: initialTheme,
    draft: normalizeDraft(initialDraft, initialLocale),
    validation: validateDraft(initialDraft, initialLocale),
    artifacts: buildExportArtifacts(initialDraft),
    actionStatus: null,
    intentionClipboard: null,
    categoryDropdownOpen: false,
    searchableDropdown: {
      openId: "",
      filter: ""
    },
    predicateValueBuffers: {},
    pendingFocus: null,
    modal: null,
    textareaHeights: {},
    textareaScrollTops: {},
    history: {
      undoStack: [],
      redoStack: [],
      maxDepth: HISTORY_MAX_DEPTH,
      lastMutationKey: "",
      lastMutationAt: 0
    }
  };

  function synchronizeDraftTags({ normalizeBuffers = false } = {}) {
    for (const intention of getAllIntentions(state.draft)) {
      if (normalizeBuffers) {
        normalizeTagsOnBlur(intention);
      } else {
        intention.tags = splitTagsInput(intention.tagsInput ?? intention.tags ?? []);
      }
    }
  }

  function getControlKeyFromParts({
    entity = "",
    field = "",
    uid = "",
    ownerKind = "",
    ownerUid = ""
  }) {
    return [entity, field, uid, ownerKind, ownerUid].join("|");
  }

  function getControlKey(control) {
    return control.dataset.controlKey
      || getControlKeyFromParts({
        entity: control.dataset.entity ?? "",
        field: control.dataset.field ?? "",
        uid: control.dataset.uid ?? "",
        ownerKind: control.dataset.ownerKind ?? "",
        ownerUid: control.dataset.ownerUid ?? ""
      });
  }

  function rememberTextareaState(control) {
    if (!(control instanceof HTMLTextAreaElement)) {
      return;
    }
    if (!control.dataset.entity || !control.dataset.field) {
      return;
    }

    const key = getControlKey(control);
    if (key) {
      state.textareaHeights[key] = control.offsetHeight;
      state.textareaScrollTops[key] = control.scrollTop;
    }
  }

  function captureFocusSnapshot() {
    const active = document.activeElement;
    if (!active || !(active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement)) {
      return null;
    }
    if (!root.contains(active)) {
      return null;
    }
    rememberTextareaState(active);
    const controlKey = getControlKey(active);

    return {
      entity: active.dataset.entity ?? "",
      field: active.dataset.field ?? "",
      uid: active.dataset.uid ?? "",
      ownerKind: active.dataset.ownerKind ?? "",
      ownerUid: active.dataset.ownerUid ?? "",
      valueBuffer: active.dataset.valueBuffer ?? "",
      searchableFilterId: active.dataset.searchableFilterId ?? "",
      selectionStart: typeof active.selectionStart === "number" ? active.selectionStart : null,
      selectionEnd: typeof active.selectionEnd === "number" ? active.selectionEnd : null,
      scrollTop: active instanceof HTMLTextAreaElement ? active.scrollTop : null,
      controlKey
    };
  }

  function pushHistorySnapshot({
    key = "",
    coalesceMs = 0,
    force = false
  } = {}) {
    const now = Date.now();
    const canCoalesce = !force
      && key
      && coalesceMs > 0
      && state.history.lastMutationKey === key
      && now - state.history.lastMutationAt <= coalesceMs;

    if (canCoalesce) {
      state.history.lastMutationAt = now;
      return;
    }

    state.history.undoStack.push(deepClone(state.draft));
    if (state.history.undoStack.length > state.history.maxDepth) {
      state.history.undoStack.shift();
    }
    state.history.redoStack = [];
    state.history.lastMutationKey = key;
    state.history.lastMutationAt = now;
  }

  function resetHistoryCoalescing() {
    state.history.lastMutationKey = "";
    state.history.lastMutationAt = 0;
  }

  function clearTransientEditingState() {
    closeSearchableDropdown();
    state.categoryDropdownOpen = false;
    state.modal = null;
    state.predicateValueBuffers = {};
  }

  function restoreDraftFromHistory(snapshot) {
    const focusSnapshot = captureFocusSnapshot();
    state.draft = normalizeDraft(deepClone(snapshot), state.locale);
    clearTransientEditingState();
    restoreFocusSnapshot(focusSnapshot);
    recalculate({ save: true, preserveFocus: false });
  }

  function undoHistory() {
    const snapshot = state.history.undoStack.pop();
    if (!snapshot) {
      return;
    }

    state.history.redoStack.push(deepClone(state.draft));
    resetHistoryCoalescing();
    restoreDraftFromHistory(snapshot);
  }

  function redoHistory() {
    const snapshot = state.history.redoStack.pop();
    if (!snapshot) {
      return;
    }

    state.history.undoStack.push(deepClone(state.draft));
    if (state.history.undoStack.length > state.history.maxDepth) {
      state.history.undoStack.shift();
    }
    resetHistoryCoalescing();
    restoreDraftFromHistory(snapshot);
  }

  function restoreFocusSnapshot(snapshot) {
    if (!snapshot) {
      return;
    }

    let selector = "";
    if (snapshot.valueBuffer) {
      selector = `[data-value-buffer="${snapshot.valueBuffer}"]`;
    } else if (snapshot.searchableFilterId) {
      selector = `[data-searchable-filter-id="${snapshot.searchableFilterId}"]`;
    } else if (snapshot.entity && snapshot.field) {
      selector = [
        `[data-entity="${snapshot.entity}"]`,
        `[data-field="${snapshot.field}"]`,
        snapshot.uid ? `[data-uid="${snapshot.uid}"]` : "",
        snapshot.ownerKind ? `[data-owner-kind="${snapshot.ownerKind}"]` : "",
        snapshot.ownerUid ? `[data-owner-uid="${snapshot.ownerUid}"]` : ""
      ].join("");
    }

    if (!selector) {
      return;
    }

    queueFocus(selector, snapshot.selectionStart, snapshot.selectionEnd, snapshot.scrollTop);
  }

  function recalculate({
    save = true,
    actionStatus = null,
    normalizeTagBuffers = false,
    preserveFocus = true
  } = {}) {
    const focusSnapshot = preserveFocus ? captureFocusSnapshot() : null;
    restoreFocusSnapshot(focusSnapshot);
    state.draft.ownerSlot.intentionId = state.draft.ownerIntention.id;
    synchronizeLinkedIntentions();
    state.draft.lastUpdatedAt = new Date().toISOString();
    synchronizeDraftTags({ normalizeBuffers: normalizeTagBuffers });
    state.validation = validateDraft(state.draft, state.locale);
    state.artifacts = buildExportArtifacts(state.draft);
    if (save) {
      saveDraft(state.draft);
    }
    state.actionStatus = actionStatus;
    render();
  }

  function queueFocus(selector, selectionStart = null, selectionEnd = null, scrollTop = null) {
    state.pendingFocus = { selector, selectionStart, selectionEnd, scrollTop };
  }

  function applyPendingFocus() {
    if (!state.pendingFocus) {
      return;
    }

    const pending = state.pendingFocus;
    state.pendingFocus = null;
    requestAnimationFrame(() => {
      const next = root.querySelector(pending.selector);
      if (!(next instanceof HTMLInputElement || next instanceof HTMLTextAreaElement || next instanceof HTMLSelectElement)) {
        return;
      }

      next.focus({ preventScroll: true });
      if (next instanceof HTMLTextAreaElement && pending.scrollTop !== null) {
        next.scrollTop = pending.scrollTop;
      }
      if (pending.selectionStart !== null && pending.selectionEnd !== null) {
        try {
          next.setSelectionRange(pending.selectionStart, pending.selectionEnd);
        } catch {
          // noop
        }
      }
    });
  }

  function setLocale(nextLocale) {
    state.locale = nextLocale;
    saveLocale(nextLocale);
    recalculate({ save: true });
  }

  function setTheme(nextTheme) {
    state.theme = nextTheme === "dark" ? "dark" : "light";
    saveTheme(state.theme);
    render();
  }

  function resetDraft() {
    pushHistorySnapshot({ key: "reset-draft", force: true });
    clearDraft();
    state.draft = createEmptyDraft(state.locale);
    resetHistoryCoalescing();
    recalculate({ save: true });
  }

  function withMutation(callback, options = {}) {
    const {
      history = true,
      historyKey = "",
      historyCoalesceMs = 0,
      historyForce = false,
      ...recalculateOptions
    } = options;
    if (history) {
      pushHistorySnapshot({
        key: historyKey,
        coalesceMs: historyCoalesceMs,
        force: historyForce
      });
    }
    callback();
    if (!historyKey || historyForce) {
      resetHistoryCoalescing();
    }
    recalculate(recalculateOptions);
  }

  function findSecondaryIntention(uid) {
    return state.draft.secondaryIntentions.find(item => item.uid === uid) ?? null;
  }

  function findLinkedIntention(slot) {
    if (!slot) {
      return null;
    }
    return state.draft.secondaryIntentions.find(item => item.uid === slot.linkedIntentionUid)
      ?? state.draft.secondaryIntentions.find(item => item.id === slot.intentionId)
      ?? null;
  }

  function synchronizeLinkedIntentions() {
    const used = new Set();
    for (const slot of state.draft.secondarySlots) {
      let intention = findLinkedIntention(slot);
      if (!intention || used.has(intention.uid)) {
        intention = state.draft.secondaryIntentions.find(item => !used.has(item.uid)) ?? null;
      }
      if (!intention) {
        intention = createSecondaryIntention(state.locale);
        state.draft.secondaryIntentions.push(intention);
      }
      slot.linkedIntentionUid = intention.uid;
      slot.intentionId = intention.id;
      used.add(intention.uid);
    }

    state.draft.secondaryIntentions = state.draft.secondaryIntentions.filter(intention => used.has(intention.uid));
  }

  function findSlot(ownerKind, uid) {
    if (ownerKind === "owner-slot") {
      return state.draft.ownerSlot;
    }
    return state.draft.secondarySlots.find(item => item.uid === uid) ?? null;
  }

  function findPredicate(ownerKind, ownerUid, uid) {
    const collection = ownerKind === "global"
      ? state.draft.globalPredicates
      : findSlot(ownerKind, ownerUid)?.candidatePredicates;
    return collection?.find(item => item.uid === uid) ?? null;
  }

  function findBinding(ownerKind, ownerUid, uid) {
    return findSlot(ownerKind, ownerUid)?.textParameterBindings.find(item => item.uid === uid) ?? null;
  }

  function getSlotsForSelection(excludeSlotId = "") {
    return getAllSlots(state.draft)
      .filter(slot => nonEmpty(slot.slotId) && slot.slotId !== excludeSlotId)
      .map(slot => ({
        id: slot.slotId,
        label: slot.slotId === "owner"
          ? { ru: "owner · владелец", en: "owner · scenario owner" }
          : slot.slotId
      }));
  }

  function getSecondaryIntentionOptions() {
    return state.draft.secondaryIntentions
      .filter(intention => nonEmpty(intention.id))
      .map(intention => ({
        id: intention.id,
        label: `${intention.id} · ${intention.name || t(state.locale, "ui.choose")}`
      }));
  }

  function getSearchableOptionLabel(option) {
    return typeof option.label === "string"
      ? option.label
      : localized(state.locale, option.label);
  }

  function filterSearchableOptions(options, filter) {
    const normalizedFilter = filter.trim().toLocaleLowerCase();
    if (!normalizedFilter) {
      return options;
    }

    return options.filter(option => {
      const label = getSearchableOptionLabel(option).toLocaleLowerCase();
      const id = option.id.toLocaleLowerCase();
      return label.includes(normalizedFilter) || id.includes(normalizedFilter);
    });
  }

  function closeSearchableDropdown() {
    state.searchableDropdown.openId = "";
    state.searchableDropdown.filter = "";
  }

  function setSearchableDropdownOpen(dropdownId, open) {
    if (open) {
      state.searchableDropdown.openId = dropdownId;
      state.searchableDropdown.filter = "";
      queueFocus(`[data-searchable-filter-id="${dropdownId}"]`);
      render();
      return;
    }

    closeSearchableDropdown();
    render();
  }

  function normalizePredicate(predicate, ownerKind, ownerUid) {
    const scope = ownerKind === "global" ? PREDICATE_SCOPES.round : PREDICATE_SCOPES.candidate;
    const currentSlotId = ownerKind === "global" ? "" : (findSlot(ownerKind, ownerUid)?.slotId ?? "");
    const fieldOptions = getFieldOptions(scope);
    if (!fieldOptions.some(item => item.id === predicate.field)) {
      predicate.field = fieldOptions[0]?.id ?? "";
    }

    const compareOptions = getSlotsForSelection(currentSlotId);
    const allowCompareOperators = scope === PREDICATE_SCOPES.candidate && compareOptions.length > 0;
    const allowedOperators = getAllowedOperators(scope, predicate.field, { allowCompareOperators });
    if (!allowedOperators.includes(predicate.operator)) {
      predicate.operator = allowedOperators[0];
    }

    const fieldDefinition = getFieldDefinition(scope, predicate.field);
    if (fieldDefinition?.type !== "map-int") {
      predicate.key = "";
    }

    if (predicate.operator === PREDICATE_OPERATORS.sameAs || predicate.operator === PREDICATE_OPERATORS.notSameAs) {
      predicate.value = "";
      predicate.values = [];
      predicate.valueFrom = "";
      predicate.valueTo = "";
      predicate.compareTo = {
        scope: PREDICATE_SCOPES.slot,
        slotId: predicate.compareTo?.slotId || compareOptions[0]?.id || "",
        field: predicate.field
      };
      return;
    }

    predicate.compareTo = null;

    if (predicate.operator === PREDICATE_OPERATORS.in || predicate.operator === PREDICATE_OPERATORS.notIn) {
      predicate.value = "";
      predicate.valueFrom = "";
      predicate.valueTo = "";
      return;
    }

    if (predicate.operator === PREDICATE_OPERATORS.between) {
      predicate.value = "";
      predicate.values = [];
      return;
    }

    predicate.values = [];
    predicate.valueFrom = "";
    predicate.valueTo = "";
  }

  function normalizeBinding(binding) {
    if (binding.source === TEXT_BINDING_SOURCES.round) {
      binding.slotId = "";
      binding.value = "";
      if (!ROUND_TEXT_BINDING_FIELDS.some(field => field.id === binding.field)) {
        binding.field = ROUND_TEXT_BINDING_FIELDS[0]?.id ?? "";
      }
      return;
    }

    if (binding.source === TEXT_BINDING_SOURCES.literal) {
      binding.slotId = "";
      binding.field = "";
      return;
    }

    binding.value = "";
    if (!TEXT_BINDING_FIELDS.some(field => field.id === binding.field)) {
      binding.field = TEXT_BINDING_FIELDS[0]?.id ?? "";
    }
    if (binding.source === TEXT_BINDING_SOURCES.self) {
      binding.slotId = "";
    }
  }

  function getInputHistoryOptions(target) {
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
      return {};
    }
    if (!target.dataset.entity || !target.dataset.field) {
      return {};
    }

    return {
      historyKey: `input:${getControlKey(target)}`,
      historyCoalesceMs: HISTORY_TEXT_COALESCE_MS
    };
  }

  function setField(target, options = {}) {
    const entity = target.dataset.entity;
    const field = target.dataset.field;
    const uid = target.dataset.uid;
    const ownerKind = target.dataset.ownerKind;
    const ownerUid = target.dataset.ownerUid;
    const valueType = target.dataset.valueType ?? "text";

    let model = null;
    switch (entity) {
      case "scenario":
        model = state.draft.scenario;
        break;
      case "owner-intention":
        model = state.draft.ownerIntention;
        break;
      case "secondary-intention":
        model = findSecondaryIntention(uid);
        break;
      case "owner-slot":
        model = state.draft.ownerSlot;
        break;
      case "slot":
        model = findSlot("slot", uid);
        break;
      case "predicate":
        model = findPredicate(ownerKind, ownerUid, uid);
        break;
      case "binding":
        model = findBinding(ownerKind, ownerUid, uid);
        break;
    }

    if (!model || !field) {
      return;
    }

    let nextValue;
    switch (valueType) {
      case "checkbox":
        nextValue = target.checked;
        break;
      case "number":
        nextValue = target.value === "" ? 0 : Number(target.value);
        break;
      default:
        nextValue = target.value;
        break;
    }

    withMutation(() => {
      if (entity === "predicate" && field === "compareSlotId") {
        model.compareTo = nextValue
          ? {
              scope: PREDICATE_SCOPES.slot,
              slotId: nextValue,
              field: model.field
            }
          : null;
        return;
      }

      model[field] = nextValue;

      if (entity === "owner-intention" && field === "id") {
        state.draft.ownerSlot.intentionId = model.id;
      }

      if (entity === "predicate" && field === "field" && model.compareTo) {
        model.compareTo.field = nextValue;
      }

      if (entity === "predicate") {
        normalizePredicate(model, ownerKind, ownerUid);
      }

      if (entity === "binding") {
        normalizeBinding(model);
      }

      if ((entity === "slot" || entity === "owner-slot") && field === "bindToSlot" && nonEmpty(model.bindToSlot)) {
        model.allowSameActorAs = [];
        model.candidatePredicates = [];
      }

      if ((entity === "slot" || entity === "owner-slot") && field === "visibilityType" && model.visibilityType === VISIBILITY_TYPES.visible) {
        model.revealType = REVEAL_TYPES.none;
      }
    }, options);
  }

  async function downloadArtifact(kind) {
    if (state.validation.errors.length > 0) {
      recalculate({
        save: false,
        actionStatus: createActionStatus(state.locale, "ui.export.blocked", {}, "error")
      });
      return;
    }

    const artifact = state.artifacts[kind];
    if (!artifact) {
      return;
    }

    const blob = new Blob([artifact.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = artifact.filename;
    anchor.click();
    URL.revokeObjectURL(url);

    recalculate({
      save: false,
      actionStatus: createActionStatus(state.locale, "ui.export.downloaded", { filename: artifact.filename })
    });
  }

  async function copyArtifact(kind) {
    if (state.validation.errors.length > 0) {
      recalculate({
        save: false,
        actionStatus: createActionStatus(state.locale, "ui.export.blocked", {}, "error")
      });
      return;
    }

    const artifact = state.artifacts[kind];
    if (!artifact) {
      return;
    }

    try {
      await navigator.clipboard.writeText(artifact.content);
      recalculate({
        save: false,
        actionStatus: createActionStatus(state.locale, "ui.export.copied", { filename: artifact.filename })
      });
    } catch {
      recalculate({
        save: false,
        actionStatus: createActionStatus(state.locale, "ui.export.copyFailed", {}, "error")
      });
    }
  }

  async function copyBindingToken(ownerKind, ownerUid, uid) {
    const binding = findBinding(ownerKind, ownerUid, uid);
    const parameter = nonEmpty(binding?.parameter);
    if (!parameter) {
      recalculate({
        save: false,
        actionStatus: createActionStatus(state.locale, "ui.copyPaste.bindingTokenEmpty", {}, "warning")
      });
      return;
    }

    try {
      const token = `{$${parameter}}`;
      await navigator.clipboard.writeText(token);
      recalculate({
        save: false,
        actionStatus: createActionStatus(state.locale, "ui.copyPaste.bindingTokenCopied", { token })
      });
    } catch {
      recalculate({
        save: false,
        actionStatus: createActionStatus(state.locale, "ui.export.copyFailed", {}, "error")
      });
    }
  }

  function handleClick(event) {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }

    const button = target.closest("[data-action]");
    if (!button) {
      if (state.modal) {
        const backdrop = target.closest(".modal-backdrop");
        const insideCard = target.closest("[data-modal-card]");
        if (backdrop && !insideCard) {
          state.modal = null;
          render();
        }
      }
      if (state.categoryDropdownOpen && !target.closest("[data-category-picker]")) {
        state.categoryDropdownOpen = false;
        render();
      }
      if (state.searchableDropdown.openId && !target.closest("[data-searchable-dropdown]")) {
        closeSearchableDropdown();
        render();
      }
      return;
    }

    const action = button.dataset.action;
    if (
      state.categoryDropdownOpen &&
      action !== "toggle-category-dropdown" &&
      action !== "set-category" &&
      !button.closest("[data-category-picker]")
    ) {
      state.categoryDropdownOpen = false;
    }
    if (
      state.searchableDropdown.openId &&
      ![
        "toggle-searchable-dropdown",
        "select-searchable-value",
        "clear-searchable-value"
      ].includes(action) &&
      !button.closest("[data-searchable-dropdown]")
    ) {
      closeSearchableDropdown();
    }

    switch (action) {
      case "reset-draft":
        resetDraft();
        return;
      case "set-locale":
        setLocale(button.dataset.locale);
        return;
      case "set-theme":
        setTheme(button.dataset.theme);
        return;
      case "toggle-category-dropdown":
        state.categoryDropdownOpen = !state.categoryDropdownOpen;
        render();
        return;
      case "set-category":
        withMutation(() => {
          state.draft.scenario.category = button.dataset.categoryId;
          state.categoryDropdownOpen = false;
        });
        return;
      case "toggle-searchable-dropdown":
        setSearchableDropdownOpen(
          button.dataset.dropdownId,
          state.searchableDropdown.openId !== button.dataset.dropdownId
        );
        return;
      case "select-searchable-value":
        if (button.dataset.mode === "buffer") {
          state.predicateValueBuffers[button.dataset.uid] = button.dataset.value ?? "";
          closeSearchableDropdown();
          render();
          return;
        }
        withMutation(() => {
          const predicate = findPredicate(button.dataset.ownerKind, button.dataset.ownerUid, button.dataset.uid);
          if (!predicate) {
            return;
          }
          if (button.dataset.mode === "key") {
            predicate.key = button.dataset.value ?? "";
          } else {
            predicate.value = button.dataset.value ?? "";
          }
          closeSearchableDropdown();
        });
        return;
      case "clear-searchable-value":
        if (button.dataset.mode === "buffer") {
          state.predicateValueBuffers[button.dataset.uid] = "";
          closeSearchableDropdown();
          render();
          return;
        }
        withMutation(() => {
          const predicate = findPredicate(button.dataset.ownerKind, button.dataset.ownerUid, button.dataset.uid);
          if (!predicate) {
            return;
          }
          if (button.dataset.mode === "key") {
            predicate.key = "";
          } else {
            predicate.value = "";
          }
          closeSearchableDropdown();
        });
        return;
      case "open-modal":
        state.modal = button.dataset.modal;
        render();
        return;
      case "close-modal":
        state.modal = null;
        render();
        return;
      case "add-secondary-intention":
        withMutation(() => {
          const intention = createSecondaryIntention(state.locale);
          const slot = createSecondarySlot(intention.uid);
          slot.intentionId = intention.id;
          state.draft.secondaryIntentions.push(intention);
          state.draft.secondarySlots.push(slot);
        });
        return;
      case "delete-secondary-intention":
        return;
      case "add-global-predicate":
        withMutation(() => {
          state.draft.globalPredicates.push(createPredicate(PREDICATE_SCOPES.round));
        });
        return;
      case "delete-global-predicate":
        withMutation(() => {
          state.draft.globalPredicates = state.draft.globalPredicates.filter(item => item.uid !== button.dataset.uid);
        });
        return;
      case "add-slot":
        withMutation(() => {
          const intention = createSecondaryIntention(state.locale);
          const slot = createSecondarySlot(intention.uid);
          slot.intentionId = intention.id;
          state.draft.secondaryIntentions.push(intention);
          state.draft.secondarySlots.push(slot);
        });
        return;
      case "delete-slot":
        if (!window.confirm(t(state.locale, "ui.confirmDeleteSlot"))) {
          return;
        }
        withMutation(() => {
          const slotUid = button.dataset.uid;
          const slot = findSlot("slot", slotUid);
          if (!slot) {
            return;
          }

          state.draft.secondarySlots = state.draft.secondarySlots.filter(item => item.uid !== slotUid);
          state.draft.secondaryIntentions = state.draft.secondaryIntentions.filter(item => item.uid !== slot.linkedIntentionUid);
          const removedSlotId = slot.slotId;
          for (const current of getAllSlots(state.draft)) {
            if (current.bindToSlot === removedSlotId) {
              current.bindToSlot = "";
            }
            current.allowSameActorAs = current.allowSameActorAs.filter(item => item !== removedSlotId);
            current.candidatePredicates.forEach(predicate => {
              if (predicate.compareTo?.slotId === removedSlotId) {
                predicate.compareTo = null;
                predicate.operator = PREDICATE_OPERATORS.equals;
              }
            });
            current.textParameterBindings.forEach(binding => {
              if (binding.slotId === removedSlotId) {
                binding.slotId = "";
              }
            });
          }
        });
        return;
      case "copy-intention-content":
        {
          const intention = button.dataset.entity === "owner-intention"
            ? state.draft.ownerIntention
            : findSecondaryIntention(button.dataset.uid);
          if (!intention) {
            return;
          }
          state.intentionClipboard = Object.fromEntries(INTENTION_CONTENT_FIELDS.map(field => [field, intention[field] ?? ""]));
          recalculate({
            save: false,
            actionStatus: createActionStatus(state.locale, "ui.copyPaste.copied")
          });
        }
        return;
      case "paste-intention-content":
        {
          if (!state.intentionClipboard) {
            return;
          }
          withMutation(() => {
            const intention = button.dataset.entity === "owner-intention"
              ? state.draft.ownerIntention
              : findSecondaryIntention(button.dataset.uid);
            if (!intention) {
              return;
            }
            for (const field of INTENTION_CONTENT_FIELDS) {
              intention[field] = state.intentionClipboard[field] ?? "";
            }
          }, {
            actionStatus: createActionStatus(state.locale, "ui.copyPaste.pasted")
          });
        }
        return;
      case "add-slot-predicate":
        withMutation(() => {
          const slot = findSlot(button.dataset.ownerKind, button.dataset.ownerUid);
          if (!slot || nonEmpty(slot.bindToSlot)) {
            return;
          }
          slot.candidatePredicates.push(createPredicate(PREDICATE_SCOPES.candidate));
        });
        return;
      case "delete-predicate":
        withMutation(() => {
          const collection = button.dataset.ownerKind === "global"
            ? state.draft.globalPredicates
            : findSlot(button.dataset.ownerKind, button.dataset.ownerUid)?.candidatePredicates;
          if (!collection) {
            return;
          }
          const index = collection.findIndex(item => item.uid === button.dataset.uid);
          if (index >= 0) {
            collection.splice(index, 1);
          }
        });
        return;
      case "add-binding":
        withMutation(() => {
          const slot = findSlot(button.dataset.ownerKind, button.dataset.ownerUid);
          if (!slot) {
            return;
          }
          slot.textParameterBindings.push(createTextBinding());
        });
        return;
      case "delete-binding":
        withMutation(() => {
          const slot = findSlot(button.dataset.ownerKind, button.dataset.ownerUid);
          if (!slot) {
            return;
          }
          slot.textParameterBindings = slot.textParameterBindings.filter(item => item.uid !== button.dataset.uid);
        });
        return;
      case "copy-binding-token":
        copyBindingToken(button.dataset.ownerKind, button.dataset.ownerUid, button.dataset.uid);
        return;
      case "toggle-allow-same-actor":
        withMutation(() => {
          const slot = findSlot(button.dataset.ownerKind, button.dataset.ownerUid);
          if (!slot || nonEmpty(slot.bindToSlot)) {
            return;
          }
          const targetSlotId = button.dataset.targetSlotId;
          const exists = slot.allowSameActorAs.includes(targetSlotId);
          slot.allowSameActorAs = exists
            ? slot.allowSameActorAs.filter(item => item !== targetSlotId)
            : [...slot.allowSameActorAs, targetSlotId];
        });
        return;
      case "add-predicate-value":
        withMutation(() => {
          const predicate = findPredicate(button.dataset.ownerKind, button.dataset.ownerUid, button.dataset.uid);
          if (!predicate) {
            return;
          }
          const input = root.querySelector(`[data-value-buffer="${button.dataset.uid}"]`);
          const value = nonEmpty(state.predicateValueBuffers[button.dataset.uid] ?? input?.value);
          if (!value) {
            return;
          }
          predicate.values = [...predicate.values, value];
          state.predicateValueBuffers[button.dataset.uid] = "";
          if (input instanceof HTMLInputElement || input instanceof HTMLSelectElement) {
            input.value = "";
          }
        }, { save: true });
        return;
      case "remove-predicate-value":
        withMutation(() => {
          const predicate = findPredicate(button.dataset.ownerKind, button.dataset.ownerUid, button.dataset.uid);
          if (!predicate) {
            return;
          }
          const removeIndex = Number(button.dataset.valueIndex);
          predicate.values = predicate.values.filter((_, index) => index !== removeIndex);
        });
        return;
      case "copy-artifact":
        copyArtifact(button.dataset.kind);
        return;
      case "download-artifact":
        downloadArtifact(button.dataset.kind);
        return;
    }
  }

  function handleInput(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement)) {
      return;
    }

    if (target.dataset.searchableFilterId) {
      state.searchableDropdown.filter = target.value;
      queueFocus(
        `[data-searchable-filter-id="${target.dataset.searchableFilterId}"]`,
        target.selectionStart ?? null,
        target.selectionEnd ?? null
      );
      render();
      return;
    }

    if (target.dataset.entity && target.dataset.field) {
      rememberTextareaState(target);
      const duplicateTextChange = event.type === "change"
        && !(target instanceof HTMLSelectElement)
        && target.type !== "checkbox";
      setField(target, duplicateTextChange ? { history: false } : getInputHistoryOptions(target));
    }
  }

  function handleFocusOut(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
      return;
    }
    rememberTextareaState(target);
    if (target.dataset.field !== "tagsInput") {
      return;
    }

    const entity = target.dataset.entity;
    const uid = target.dataset.uid;
    const intention = entity === "owner-intention"
      ? state.draft.ownerIntention
      : entity === "secondary-intention"
        ? findSecondaryIntention(uid)
        : null;

    if (!intention) {
      return;
    }

    withMutation(() => {
      normalizeTagsOnBlur(intention);
    }, { history: false, normalizeTagBuffers: false });
  }

  function renderTopBar() {
    const draftTitle = nonEmpty(state.draft.scenario.name) || state.draft.scenario.id || t(state.locale, "ui.untitledDraft");
    return `
      <header class="app-topbar">
        <div class="brand-row">
          <strong>${escapeHtml(APP_TITLE)}</strong>
          <span>${escapeHtml(draftTitle)}</span>
        </div>
        <div class="topbar-actions">
          <div class="locale-switch" aria-label="${escapeHtml(t(state.locale, "ui.locale"))}">
            ${["ru", "en"].map(locale => `
              <button
                type="button"
                class="${locale === state.locale ? "is-active" : ""}"
                data-action="set-locale"
                data-locale="${locale}">
                ${escapeHtml(getLocaleLabel(locale))}
              </button>
            `).join("")}
          </div>
          <div class="locale-switch" aria-label="${escapeHtml(t(state.locale, "ui.theme"))}">
            ${["light", "dark"].map(theme => `
              <button
                type="button"
                class="${theme === state.theme ? "is-active" : ""}"
                data-action="set-theme"
                data-theme="${theme}">
                ${escapeHtml(t(state.locale, `ui.themes.${theme}`))}
              </button>
            `).join("")}
          </div>
          <button type="button" data-action="reset-draft">${escapeHtml(t(state.locale, "ui.reset"))}</button>
          <span class="version">v${APP_VERSION}</span>
        </div>
      </header>
    `;
  }

  function renderStatusPanel() {
    const tone = getStatusTone(state.validation);
    const chips = [
      { className: "error", label: t(state.locale, "ui.errors"), value: state.validation.errors.length },
      { className: "warning", label: t(state.locale, "ui.warnings"), value: state.validation.warnings.length },
      { className: "neutral", label: t(state.locale, "ui.secondaryTemplates"), value: state.draft.secondaryIntentions.length },
      { className: "neutral", label: t(state.locale, "ui.secondarySlots"), value: state.draft.secondarySlots.length }
    ];

    const message = state.actionStatus?.message
      ?? (state.validation.issues.length === 0 ? t(state.locale, "ui.statusOk") : t(state.locale, "ui.saveHint"));
    const messageTone = state.actionStatus?.tone ?? tone;

    return `
      <section class="sidebar-block status-panel status-panel-${tone}">
        <h2>${escapeHtml(t(state.locale, "ui.statusTitle"))}</h2>
        <div class="status-chip-row">
          ${chips.map(chip => `
            <div class="severity-chip severity-chip-${chip.className}">
              <span>${escapeHtml(chip.label)}</span>
              <strong>${chip.value}</strong>
            </div>
          `).join("")}
        </div>
        <p class="status-copy status-copy-${messageTone}">${escapeHtml(message)}</p>
      </section>
    `;
  }

  function renderIssue(issueItem) {
    return `
      <li class="issue issue-${issueItem.severity}">
        <div class="issue-head">
          <strong>${escapeHtml(issueSeverityText(state.locale, issueItem.severity))}</strong>
          <code>${escapeHtml(issueItem.code)}</code>
        </div>
        <span>${escapeHtml(issueItem.message)}</span>
        <code>${escapeHtml(issueItem.path)}</code>
      </li>
    `;
  }

  function renderIssuePanel() {
    return `
      <section class="sidebar-block">
        <h2>${escapeHtml(t(state.locale, "ui.issuesTitle"))}</h2>
        <ul class="issues-list">
          ${state.validation.issues.length === 0
            ? `<li class="issue issue-ok"><strong>${escapeHtml(t(state.locale, "severity.ok"))}</strong><span>${escapeHtml(t(state.locale, "ui.noIssues"))}</span></li>`
            : state.validation.issues.map(renderIssue).join("")}
        </ul>
      </section>
    `;
  }

  function renderValidationPanel() {
    return `
      <section class="editor-section validation-section">
        <div class="section-header">
          <div>
            <h2>${escapeHtml(t(state.locale, "ui.validationExportTitle"))}</h2>
            <p>${escapeHtml(t(state.locale, "ui.validationExportDescription"))}</p>
          </div>
        </div>
        <div class="bottom-grid">
          ${renderStatusPanel()}
          ${renderIssuePanel()}
        </div>
      </section>
    `;
  }

  function renderTextField({
    entity,
    field,
    value,
    label,
    hint,
    placeholder = "",
    uid = "",
    maxLength = "",
    rows = 0,
    type = "text",
    valueType = "text",
    counterMax = 0,
    ownerKind = "",
    ownerUid = "",
    disabled = false,
    dataListId = "",
    help = ""
  }) {
    const counter = counterMax > 0 ? renderCounter(`${value ?? ""}`.length, counterMax) : "";
    const controlKey = getControlKeyFromParts({ entity, field, uid, ownerKind, ownerUid });
    const textareaHeight = rows > 0 ? state.textareaHeights[controlKey] : null;
    const commonAttrs = `
      data-entity="${entity}"
      data-field="${field}"
      data-control-key="${escapeHtml(controlKey)}"
      ${uid ? `data-uid="${uid}"` : ""}
      ${ownerKind ? `data-owner-kind="${ownerKind}"` : ""}
      ${ownerUid ? `data-owner-uid="${ownerUid}"` : ""}
      ${valueType !== "text" ? `data-value-type="${valueType}"` : ""}
      ${maxLength ? `maxlength="${maxLength}"` : ""}
      ${placeholder ? `placeholder="${escapeHtml(placeholder)}"` : ""}
      ${disabled ? "disabled" : ""}
      ${dataListId ? `list="${dataListId}"` : ""}
      ${type === "text" && valueType === "number" ? `inputmode="numeric" pattern="[0-9]*"` : ""}
    `;

    const control = rows > 0
      ? `<textarea rows="${rows}" ${textareaHeight ? `style="height:${textareaHeight}px"` : ""} ${commonAttrs}>${escapeHtml(value)}</textarea>`
      : `<input type="${type}" value="${escapeHtml(value)}" ${commonAttrs}>`;

    return `
      <label class="field">
        ${renderFieldLabel(label, help)}
        ${control}
        ${renderHint(hint, counter)}
      </label>
    `;
  }

  function renderColorField(entity, field, value, uid = "") {
    const swatch = nonEmpty(value) ? value : "#00000000";
    return `
      <label class="field">
        <span>${escapeHtml(fieldText(state.locale, "color"))}</span>
        <div class="color-field">
          <span class="color-swatch" style="background:${escapeHtml(swatch)}"></span>
          <input
            type="text"
            value="${escapeHtml(value)}"
            data-entity="${entity}"
            data-field="${field}"
            ${uid ? `data-uid="${uid}"` : ""}
            placeholder="${escapeHtml(placeholderText(state.locale, "color"))}">
        </div>
        ${renderHint(hintText(state.locale, "color"))}
      </label>
    `;
  }

  function renderSearchableDropdown({
    dropdownId,
    selectedValue,
    options,
    placeholder,
    mode,
    uid,
    ownerKind = "",
    ownerUid = ""
  }) {
    const isOpen = state.searchableDropdown.openId === dropdownId;
    const filteredOptions = filterSearchableOptions(options, isOpen ? state.searchableDropdown.filter : "");
    const selectedOption = options.find(option => option.id === selectedValue) ?? null;
    const selectedLabel = selectedOption ? getSearchableOptionLabel(selectedOption) : placeholder;

    return `
      <div class="searchable-dropdown" data-searchable-dropdown="true">
        <button
          type="button"
          class="searchable-trigger"
          data-action="toggle-searchable-dropdown"
          data-dropdown-id="${escapeHtml(dropdownId)}"
          aria-haspopup="listbox"
          aria-expanded="${isOpen ? "true" : "false"}">
          <span class="${selectedOption ? "is-selected" : "is-placeholder"}">${escapeHtml(selectedLabel)}</span>
          <span aria-hidden="true">v</span>
        </button>
        ${isOpen ? `
          <div class="searchable-menu" role="listbox">
            <input
              type="text"
              class="searchable-filter"
              value="${escapeHtml(state.searchableDropdown.filter)}"
              data-searchable-filter-id="${escapeHtml(dropdownId)}"
              placeholder="${escapeHtml(placeholderText(state.locale, "searchValue"))}"
              aria-label="${escapeHtml(t(state.locale, "ui.searchValueAria"))}">
            <button
              type="button"
              class="searchable-option searchable-option-clear"
              data-action="clear-searchable-value"
              data-dropdown-id="${escapeHtml(dropdownId)}"
              data-mode="${escapeHtml(mode)}"
              data-uid="${escapeHtml(uid)}"
              ${ownerKind ? `data-owner-kind="${escapeHtml(ownerKind)}"` : ""}
              ${ownerUid ? `data-owner-uid="${escapeHtml(ownerUid)}"` : ""}>
              ${escapeHtml(selectText(state.locale, "clearValue"))}
            </button>
            <div class="searchable-options">
              ${filteredOptions.length > 0 ? filteredOptions.map(option => `
                <button
                  type="button"
                  class="searchable-option ${option.id === selectedValue ? "is-active" : ""}"
                  data-action="select-searchable-value"
                  data-dropdown-id="${escapeHtml(dropdownId)}"
                  data-mode="${escapeHtml(mode)}"
                  data-uid="${escapeHtml(uid)}"
                  data-value="${escapeHtml(option.id)}"
                  ${ownerKind ? `data-owner-kind="${escapeHtml(ownerKind)}"` : ""}
                  ${ownerUid ? `data-owner-uid="${escapeHtml(ownerUid)}"` : ""}
                  role="option"
                  aria-selected="${option.id === selectedValue ? "true" : "false"}">
                  <strong>${escapeHtml(option.id)}</strong>
                  <span>${escapeHtml(getSearchableOptionLabel(option))}</span>
                </button>
              `).join("") : `<div class="searchable-empty">${escapeHtml(selectText(state.locale, "noMatches"))}</div>`}
            </div>
          </div>
        ` : ""}
      </div>
    `;
  }

  function renderPredicateValueList(predicate, ownerKind, ownerUid, fieldDefinition) {
    const dictionaryName = fieldDefinition.type === "string" || fieldDefinition.type === "list-string"
      ? fieldDefinition.dictionary
      : "";
    const values = dictionaryName ? getDictionaryOptions(dictionaryName) : [];
    const bufferedValue = state.predicateValueBuffers[predicate.uid] ?? "";
    const inputControl = dictionaryName
      ? renderSearchableDropdown({
        dropdownId: `predicate-values-${predicate.uid}`,
        selectedValue: bufferedValue,
        options: values,
        placeholder: placeholderText(state.locale, "selectValue"),
        mode: "buffer",
        uid: predicate.uid
      })
      : `
        <input
          type="text"
          ${fieldDefinition.type === "int" || fieldDefinition.type === "map-int" ? `inputmode="numeric" pattern="[0-9]*"` : ""}
          data-value-buffer="${predicate.uid}"
          placeholder="${escapeHtml(placeholderText(state.locale, "addValue"))}">
      `;

    return `
      <div class="field">
        ${renderFieldLabel(fieldText(state.locale, "values"), hintText(state.locale, "values"))}
        <div class="inline-editor inline-editor-wide">
          ${inputControl}
          <button
            type="button"
            data-action="add-predicate-value"
            data-owner-kind="${ownerKind}"
            data-owner-uid="${ownerUid}"
            data-uid="${predicate.uid}">
            ${escapeHtml(t(state.locale, "ui.add"))}
          </button>
        </div>
        <div class="chips">
          ${predicate.values.map((value, index) => `
            <span class="chip">
              ${escapeHtml(dictionaryName ? dictionaryLabel(state.locale, dictionaryName, value) : value)}
              <button
                type="button"
                class="chip-remove"
                aria-label="${escapeHtml(t(state.locale, "ui.delete"))}"
                data-action="remove-predicate-value"
                data-owner-kind="${ownerKind}"
                data-owner-uid="${ownerUid}"
                data-uid="${predicate.uid}"
                data-value-index="${index}">
                ×
              </button>
            </span>
          `).join("")}
        </div>
      </div>
    `;
  }

  function renderScalarEditor(predicate, ownerKind, ownerUid, fieldDefinition) {
    const dictionaryName = fieldDefinition.type === "string" || fieldDefinition.type === "list-string"
      ? fieldDefinition.dictionary
      : "";
    const dictionary = dictionaryName ? getDictionaryOptions(dictionaryName) : [];
    const commonAttrs = `
      data-entity="predicate"
      data-owner-kind="${ownerKind}"
      data-owner-uid="${ownerUid}"
      data-uid="${predicate.uid}"
      data-field="value"
    `;

    let valueControl = "";
    if (fieldDefinition.type === "bool") {
      valueControl = `
        <select ${commonAttrs}>
          ${renderSelectOptions(state.locale, BOOLEAN_OPTIONS, predicate.value, { allowEmpty: true })}
        </select>
      `;
    } else if (dictionary.length > 0) {
      valueControl = renderSearchableDropdown({
        dropdownId: `predicate-value-${predicate.uid}`,
        selectedValue: predicate.value,
        options: dictionary,
        placeholder: placeholderText(state.locale, "selectValue"),
        mode: "scalar",
        uid: predicate.uid,
        ownerKind,
        ownerUid
      });
    } else {
      const numericAttrs = fieldDefinition.type === "int" || fieldDefinition.type === "map-int"
        ? `inputmode="numeric" pattern="[0-9]*"`
        : "";
      valueControl = `<input type="text" value="${escapeHtml(predicate.value)}" ${commonAttrs} ${numericAttrs}>`;
    }

    return `
      <label class="field">
        ${renderFieldLabel(fieldText(state.locale, "value"), hintText(state.locale, "value"))}
        ${valueControl}
      </label>
    `;
  }

  function renderRangeEditor(predicate, ownerKind, ownerUid, fieldDefinition) {
    const numericAttrs = fieldDefinition.type === "int" ? `inputmode="numeric" pattern="[0-9]*"` : "";
    return `
      <div class="field-grid two">
        <label class="field">
          ${renderFieldLabel(fieldText(state.locale, "valueFrom"), hintText(state.locale, "valueFrom"))}
          <input
            type="text"
            value="${escapeHtml(predicate.valueFrom)}"
            data-entity="predicate"
            data-owner-kind="${ownerKind}"
            data-owner-uid="${ownerUid}"
            data-uid="${predicate.uid}"
            data-field="valueFrom"
            ${numericAttrs}>
        </label>
        <label class="field">
          ${renderFieldLabel(fieldText(state.locale, "valueTo"), hintText(state.locale, "valueTo"))}
          <input
            type="text"
            value="${escapeHtml(predicate.valueTo)}"
            data-entity="predicate"
            data-owner-kind="${ownerKind}"
            data-owner-uid="${ownerUid}"
            data-uid="${predicate.uid}"
            data-field="valueTo"
            ${numericAttrs}>
        </label>
      </div>
    `;
  }

  function renderMapKeyEditor(predicate, ownerKind, ownerUid, fieldDefinition) {
    const dictionary = fieldDefinition.dictionary ? getDictionaryOptions(fieldDefinition.dictionary) : [];
    const label = localized(state.locale, fieldDefinition.keyLabel) || fieldText(state.locale, "key");

    return `
      <label class="field">
        ${renderFieldLabel(label, hintText(state.locale, "key"))}
        ${renderSearchableDropdown({
          dropdownId: `predicate-key-${predicate.uid}`,
          selectedValue: predicate.key,
          options: dictionary,
          placeholder: placeholderText(state.locale, "selectValue"),
          mode: "key",
          uid: predicate.uid,
          ownerKind,
          ownerUid
        })}
      </label>
    `;
  }

  function renderPredicateValueEditor(predicate, ownerKind, ownerUid) {
    const fieldDefinition = getFieldDefinition(predicate.scope, predicate.field);
    if (!fieldDefinition) {
      return "";
    }

    if (predicate.operator === PREDICATE_OPERATORS.sameAs || predicate.operator === PREDICATE_OPERATORS.notSameAs) {
      const currentSlotId = ownerKind === "global" ? "" : (findSlot(ownerKind, ownerUid)?.slotId ?? "");
      const compareOptions = getSlotsForSelection(currentSlotId);
      return `
        <label class="field">
          ${renderFieldLabel(fieldText(state.locale, "compareSlot"), hintText(state.locale, "compareSlot"))}
          <select
            data-entity="predicate"
            data-owner-kind="${ownerKind}"
            data-owner-uid="${ownerUid}"
            data-uid="${predicate.uid}"
            data-field="compareSlotId">
            ${renderSelectOptions(state.locale, compareOptions, predicate.compareTo?.slotId ?? "", {
              allowEmpty: true,
              emptyLabel: selectText(state.locale, "none")
            })}
          </select>
        </label>
      `;
    }

    const keyEditor = fieldDefinition.type === "map-int"
      ? renderMapKeyEditor(predicate, ownerKind, ownerUid, fieldDefinition)
      : "";

    if (predicate.operator === PREDICATE_OPERATORS.in || predicate.operator === PREDICATE_OPERATORS.notIn) {
      return `${keyEditor}${renderPredicateValueList(predicate, ownerKind, ownerUid, fieldDefinition)}`;
    }

    if (predicate.operator === PREDICATE_OPERATORS.between) {
      return `${keyEditor}${renderRangeEditor(predicate, ownerKind, ownerUid, fieldDefinition)}`;
    }

    return `${keyEditor}${renderScalarEditor(predicate, ownerKind, ownerUid, fieldDefinition)}`;
  }

  function renderPredicateCard(predicate, ownerKind, ownerUid, title) {
    const fieldOptions = getFieldOptions(predicate.scope).map(item => ({
      id: item.id,
      label: localized(state.locale, item.label)
    }));
    const operatorOptions = getAllowedOperators(predicate.scope, predicate.field, {
      allowCompareOperators: ownerKind === "global"
        ? false
        : getSlotsForSelection(findSlot(ownerKind, ownerUid)?.slotId ?? "").length > 0
    }).map(operator => ({
      id: operator,
      label: operatorLabel(state.locale, operator)
    }));
    const fieldDefinition = getFieldDefinition(predicate.scope, predicate.field);

    return `
      <section class="predicate-card">
        <div class="subsection-header tight">
          <div>
            <strong>${escapeHtml(title)}</strong>
          </div>
          <button
            type="button"
            data-action="${ownerKind === "global" ? "delete-global-predicate" : "delete-predicate"}"
            data-owner-kind="${ownerKind}"
            data-owner-uid="${ownerUid}"
            data-uid="${predicate.uid}">
            ${escapeHtml(t(state.locale, "ui.delete"))}
          </button>
        </div>

        <div class="field-grid two">
          <label class="field">
            ${renderFieldLabel(fieldText(state.locale, "field"), hintText(state.locale, "field"))}
            <select
              data-entity="predicate"
              data-owner-kind="${ownerKind}"
              data-owner-uid="${ownerUid}"
              data-uid="${predicate.uid}"
              data-field="field">
              ${renderSelectOptions(state.locale, fieldOptions, predicate.field)}
            </select>
          </label>
          <label class="field">
            ${renderFieldLabel(t(state.locale, "ui.fields.operator"), hintText(state.locale, "operator"))}
            <select
              data-entity="predicate"
              data-owner-kind="${ownerKind}"
              data-owner-uid="${ownerUid}"
              data-uid="${predicate.uid}"
              data-field="operator">
              ${renderSelectOptions(state.locale, operatorOptions, predicate.operator)}
            </select>
          </label>
        </div>

        ${fieldDefinition ? renderPredicateValueEditor(predicate, ownerKind, ownerUid) : ""}
      </section>
    `;
  }

  function renderBindingCard(binding, ownerKind, ownerUid, index) {
    const slotOptions = getSlotsForSelection(findSlot(ownerKind, ownerUid)?.slotId ?? "");
    const sourceOptions = Object.values(TEXT_BINDING_SOURCES).map(source => ({
      id: source,
      label: localized(state.locale, SOURCE_LABELS[source])
    }));
    const fieldOptions = binding.source === TEXT_BINDING_SOURCES.round
      ? ROUND_TEXT_BINDING_FIELDS.map(field => ({ id: field.id, label: localized(state.locale, field.label) }))
      : TEXT_BINDING_FIELDS.map(field => ({ id: field.id, label: localized(state.locale, field.label) }));

    const token = nonEmpty(binding.parameter) ? `{$${nonEmpty(binding.parameter)}}` : "";

    return `
      <section class="subcard text-binding-card">
        <div class="subsection-header tight">
          <div>
            <strong>${escapeHtml(t(state.locale, "ui.textParameterTitle", { index: index + 1 }))}</strong>
            ${token ? `<code>${escapeHtml(token)}</code>` : ""}
          </div>
          <div class="button-row">
            <button
              type="button"
              data-action="copy-binding-token"
              data-owner-kind="${ownerKind}"
              data-owner-uid="${ownerUid}"
              data-uid="${binding.uid}"
              title="${escapeHtml(token || t(state.locale, "ui.copyPaste.bindingTokenEmpty"))}"
              ${token ? "" : "disabled"}>
              ${escapeHtml(t(state.locale, "ui.copyPaste.copyBindingToken"))}
            </button>
            <button
              type="button"
              data-action="delete-binding"
              data-owner-kind="${ownerKind}"
              data-owner-uid="${ownerUid}"
              data-uid="${binding.uid}">
              ${escapeHtml(t(state.locale, "ui.delete"))}
            </button>
          </div>
        </div>

        <div class="field-grid four">
          <label class="field">
            ${renderFieldLabel(fieldText(state.locale, "parameter"), hintText(state.locale, "parameter"))}
            <input
              type="text"
              value="${escapeHtml(binding.parameter)}"
              data-entity="binding"
              data-owner-kind="${ownerKind}"
              data-owner-uid="${ownerUid}"
              data-uid="${binding.uid}"
              data-field="parameter"
              placeholder="${escapeHtml(placeholderText(state.locale, "bindingParam"))}">
          </label>
            <label class="field">
              ${renderFieldLabel(fieldText(state.locale, "source"), hintText(state.locale, "source"))}
              <select
                data-entity="binding"
                data-owner-kind="${ownerKind}"
              data-owner-uid="${ownerUid}"
              data-uid="${binding.uid}"
              data-field="source">
              ${renderSelectOptions(state.locale, sourceOptions, binding.source)}
            </select>
          </label>
          ${binding.source === TEXT_BINDING_SOURCES.slot ? `
            <label class="field">
              ${renderFieldLabel(fieldText(state.locale, "slot"), hintText(state.locale, "slot"))}
              <select
                data-entity="binding"
                data-owner-kind="${ownerKind}"
                data-owner-uid="${ownerUid}"
                data-uid="${binding.uid}"
                data-field="slotId">
                ${renderSelectOptions(state.locale, slotOptions, binding.slotId, {
                  allowEmpty: true,
                  emptyLabel: placeholderText(state.locale, "selectSlot")
                })}
              </select>
            </label>
          ` : ""}
          ${binding.source === TEXT_BINDING_SOURCES.literal ? `
            <label class="field">
              ${renderFieldLabel(fieldText(state.locale, "value"), hintText(state.locale, "value"))}
              <input
                type="text"
                value="${escapeHtml(binding.value)}"
                data-entity="binding"
                data-owner-kind="${ownerKind}"
                data-owner-uid="${ownerUid}"
                data-uid="${binding.uid}"
                data-field="value"
                placeholder="${escapeHtml(placeholderText(state.locale, "literal"))}">
            </label>
          ` : `
            <label class="field">
              ${renderFieldLabel(fieldText(state.locale, "field"), hintText(state.locale, "field"))}
              <select
                data-entity="binding"
                data-owner-kind="${ownerKind}"
                data-owner-uid="${ownerUid}"
                data-uid="${binding.uid}"
                data-field="field">
                ${renderSelectOptions(state.locale, fieldOptions, binding.field)}
              </select>
            </label>
          `}
        </div>
      </section>
    `;
  }

function renderIntentionEditor(intention, entity, title, description, {
    canDelete = false,
    slot = null,
    slotOwnerKind = ""
  } = {}) {
    const locale = state.locale;
    const uid = entity === "secondary-intention" ? intention.uid : "";
    const sectionClass = entity === "owner-intention"
      ? "editor-section intentions-section owner-intention-section"
      : "editor-section intentions-section secondary-intention-section";
    const visibilityOptions = [
      { id: VISIBILITY_TYPES.visible, label: localized(locale, VISIBILITY_LABELS.visible) },
      { id: VISIBILITY_TYPES.hidden, label: localized(locale, VISIBILITY_LABELS.hidden) }
    ];
    const revealOptions = [
      { id: REVEAL_TYPES.none, label: localized(locale, REVEAL_LABELS.none) },
      { id: REVEAL_TYPES.timer, label: localized(locale, REVEAL_LABELS.timer) }
    ];
    const slotUid = slot?.uid ?? "";

    return `
      <section class="${sectionClass}">
        <div class="section-header">
          <div>
            <h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(description)}</p>
          </div>
          <div class="button-row">
            <button
              type="button"
              data-action="copy-intention-content"
              data-entity="${entity}"
              data-uid="${uid}">
              ${escapeHtml(t(locale, "ui.copyPaste.copy"))}
            </button>
            <button
              type="button"
              data-action="paste-intention-content"
              data-entity="${entity}"
              data-uid="${uid}"
              ${state.intentionClipboard ? "" : "disabled"}>
              ${escapeHtml(t(locale, "ui.copyPaste.paste"))}
            </button>
            ${canDelete ? `
              <button type="button" data-action="delete-slot" data-uid="${slotUid}">
                ${escapeHtml(t(locale, "ui.delete"))}
              </button>
            ` : ""}
          </div>
        </div>

        <div class="intention-tabs" aria-label="${escapeHtml(t(locale, "ui.intentionTabs"))}">
          <button type="button" class="is-active">${escapeHtml(t(locale, "ui.intentionTabOne"))}</button>
          <button type="button" disabled>${escapeHtml(t(locale, "ui.intentionTabsFuture"))}</button>
        </div>

        <div class="field-grid two">
          ${renderTextField({
            entity,
            uid,
            field: "id",
            value: intention.id,
            label: fieldText(locale, "templateId"),
            hint: hintText(locale, "templateId"),
            help: hintText(locale, "templateIdTooltip"),
            placeholder: placeholderText(locale, "templateId")
          })}
          ${renderTextField({
            entity,
            uid,
            field: "author",
            value: intention.author,
            label: fieldText(locale, "author"),
            hint: hintText(locale, "author")
          })}
        </div>

        <div class="field-grid two">
          ${renderTextField({
            entity,
            uid,
            field: "name",
            value: intention.name,
            label: fieldText(locale, "title"),
            hint: hintText(locale, "title35"),
            maxLength: TEXT_LIMITS.name,
            counterMax: TEXT_LIMITS.name
          })}
          ${renderTextField({
            entity,
            uid,
            field: "summary",
            value: intention.summary,
            label: fieldText(locale, "summary"),
            hint: hintText(locale, "summary35"),
            help: hintText(locale, "summaryTooltip"),
            maxLength: TEXT_LIMITS.summary,
            counterMax: TEXT_LIMITS.summary
          })}
        </div>

        ${renderTextField({
          entity,
          uid,
          field: "description",
          value: intention.description,
          label: fieldText(locale, "description"),
          hint: hintText(locale, "description2000"),
          rows: 5,
          maxLength: TEXT_LIMITS.description,
          counterMax: TEXT_LIMITS.description
        })}
        ${renderTextField({
          entity,
          uid,
          field: "oocInfo",
          value: intention.oocInfo,
          label: fieldText(locale, "oocInfo"),
          hint: hintText(locale, "ooc500"),
          help: hintText(locale, "oocInfoTooltip"),
          rows: 3,
          maxLength: TEXT_LIMITS.oocInfo,
          counterMax: TEXT_LIMITS.oocInfo
        })}
        ${renderTextField({
          entity,
          uid,
          field: "copyableText",
          value: intention.copyableText,
          label: fieldText(locale, "copyableText"),
          hint: hintText(locale, "copy5000"),
          help: hintText(locale, "copyableTextTooltip"),
          rows: 8,
          maxLength: TEXT_LIMITS.copyableText,
          counterMax: TEXT_LIMITS.copyableText
        })}

        <div class="subsection visibility-combo">
          <div class="subsection-header tight">
            <strong>${escapeHtml(t(locale, "ui.visibilityAndReveal"))}</strong>
          </div>
          <div class="field-grid four">
            <label class="field">
              ${renderFieldLabel(fieldText(locale, "visibility"), hintText(locale, "defaultVisibility"))}
              <select data-entity="${entity}" data-uid="${uid}" data-field="defaultVisibility">
                ${renderSelectOptions(locale, visibilityOptions, intention.defaultVisibility)}
              </select>
            </label>
            ${renderTextField({
              entity,
              uid,
              field: "hiddenLabel",
              value: intention.hiddenLabel,
              label: fieldText(locale, "hiddenLabel"),
              hint: hintText(locale, "hidden45"),
              help: hintText(locale, "hiddenLabelTooltip"),
              maxLength: TEXT_LIMITS.hiddenLabel,
              counterMax: TEXT_LIMITS.hiddenLabel
            })}
            ${slot ? `
              <label class="check-row">
                <input
                  type="checkbox"
                  data-entity="${slotOwnerKind}"
                  data-uid="${slotUid}"
                  data-field="visibilityEnabled"
                  data-value-type="checkbox"
                  ${slot.visibilityEnabled ? "checked" : ""}>
                <span>${escapeHtml(fieldText(locale, "visibilityOverride"))}</span>
              </label>
              <label class="field">
                ${renderFieldLabel(fieldText(locale, "visibilityOverride"), hintText(locale, "visibilityOverride"))}
                <select
                  data-entity="${slotOwnerKind}"
                  data-uid="${slotUid}"
                  data-field="visibilityType"
                  ${slot.visibilityEnabled ? "" : "disabled"}>
                  ${renderSelectOptions(locale, visibilityOptions, slot.visibilityType)}
                </select>
              </label>
              <label class="field">
                <span>${escapeHtml(fieldText(locale, "reveal"))} ${renderHelpIcon(hintText(locale, "reveal"))}</span>
                <select
                  data-entity="${slotOwnerKind}"
                  data-uid="${slotUid}"
                  data-field="revealType"
                  ${slot.visibilityEnabled && slot.visibilityType === VISIBILITY_TYPES.hidden ? "" : "disabled"}>
                  ${renderSelectOptions(locale, revealOptions, slot.revealType)}
                </select>
              </label>
          ${renderTextField({
            entity: slotOwnerKind,
            uid: slotUid,
            field: "revealMinutes",
            value: slot.revealMinutes,
                label: fieldText(locale, "revealMinutes"),
                hint: hintText(locale, "revealMinutes"),
                type: "text",
                valueType: "number",
                disabled: !(slot.visibilityEnabled && slot.visibilityType === VISIBILITY_TYPES.hidden && slot.revealType === REVEAL_TYPES.timer)
              })}
            ` : ""}
          </div>
        </div>

        <div class="field-grid two">
          ${renderTextField({
            entity,
            uid,
            field: "tagsInput",
            value: intention.tagsInput ?? "",
            label: fieldText(locale, "tags"),
            hint: hintText(locale, "tags"),
            help: "",
            placeholder: placeholderText(locale, "tags")
          })}
          ${renderColorField(entity, "color", intention.color, uid)}
        </div>

        ${renderTextField({
          entity,
          uid,
          field: "creationDate",
          value: intention.creationDate,
          label: fieldText(locale, "creationDate"),
          hint: hintText(locale, "date"),
          placeholder: "2026-04-30"
        })}

        <div class="subsection">
          <label class="check-row">
            <input
              type="checkbox"
              data-entity="${entity}"
              data-uid="${uid}"
              data-field="iconEnabled"
              data-value-type="checkbox"
              ${intention.iconEnabled ? "checked" : ""}>
            <span>${escapeHtml(fieldText(locale, "addIcon"))}</span>
          </label>
          <div class="field-grid two">
            ${renderTextField({
              entity,
              uid,
              field: "iconSprite",
              value: intention.iconSprite,
              label: fieldText(locale, "iconSprite"),
              help: hintText(locale, "iconSprite"),
              disabled: !intention.iconEnabled,
              placeholder: placeholderText(locale, "iconSprite")
            })}
            ${renderTextField({
              entity,
              uid,
              field: "iconState",
              value: intention.iconState,
              label: fieldText(locale, "iconState"),
              help: hintText(locale, "iconState"),
              disabled: !intention.iconEnabled,
              placeholder: placeholderText(locale, "iconState")
            })}
          </div>
        </div>
      </section>
    `;
  }

  function renderVisibilityEditor(slot, ownerKind) {
    const locale = state.locale;
    const uid = ownerKind === "owner-slot" ? slot.uid : slot.uid;
    const visibilityOptions = [
      { id: VISIBILITY_TYPES.visible, label: localized(locale, VISIBILITY_LABELS.visible) },
      { id: VISIBILITY_TYPES.hidden, label: localized(locale, VISIBILITY_LABELS.hidden) }
    ];
    const revealOptions = [
      { id: REVEAL_TYPES.none, label: localized(locale, REVEAL_LABELS.none) },
      { id: REVEAL_TYPES.timer, label: localized(locale, REVEAL_LABELS.timer) }
    ];

    return `
      <div class="subsection">
        <div class="subsection-header tight">
          <strong>
            ${escapeHtml(fieldText(locale, "visibilityOverride"))}
            ${renderHelpIcon(hintText(locale, "visibilityOverride"))}
          </strong>
        </div>
        <div class="field-grid three">
          <label class="check-row check-row-centered">
            <input
              type="checkbox"
              data-entity="${ownerKind}"
              data-uid="${uid}"
              data-field="visibilityEnabled"
              data-value-type="checkbox"
              ${slot.visibilityEnabled ? "checked" : ""}>
            <span>${escapeHtml(fieldText(locale, "visibilityOverride"))}</span>
          </label>
          <label class="field">
            <span>${escapeHtml(fieldText(locale, "visibility"))}</span>
            <select
              data-entity="${ownerKind}"
              data-uid="${uid}"
              data-field="visibilityType"
              ${slot.visibilityEnabled ? "" : "disabled"}>
              ${renderSelectOptions(locale, visibilityOptions, slot.visibilityType)}
            </select>
          </label>
          <label class="field">
            <span>${escapeHtml(fieldText(locale, "reveal"))} ${renderHelpIcon(hintText(locale, "reveal"))}</span>
            <select
              data-entity="${ownerKind}"
              data-uid="${uid}"
              data-field="revealType"
              ${slot.visibilityEnabled && slot.visibilityType === VISIBILITY_TYPES.hidden ? "" : "disabled"}>
              ${renderSelectOptions(locale, revealOptions, slot.revealType)}
            </select>
          </label>
        </div>
        ${renderTextField({
          entity: ownerKind,
          uid,
          field: "revealMinutes",
          value: slot.revealMinutes,
          label: fieldText(locale, "revealMinutes"),
          hint: locale === "ru" ? "Минимум 1 минута." : "Minimum 1 minute.",
          type: "text",
          valueType: "number",
          disabled: !(slot.visibilityEnabled && slot.visibilityType === VISIBILITY_TYPES.hidden && slot.revealType === REVEAL_TYPES.timer)
        })}
      </div>
    `;
  }

function renderSlotEditor(slot, ownerKind, title, description, canDelete = false) {
    const locale = state.locale;
    const uid = slot.uid ?? "";
    const isOwnerSlot = ownerKind === "owner-slot";
    const sectionClass = isOwnerSlot
      ? "editor-section slots-section owner-slot-section"
      : "editor-section slots-section secondary-slot-section";
    const bindOptions = isOwnerSlot ? [] : getSlotsForSelection(slot.slotId);
    const allowOptions = isOwnerSlot ? [] : getSlotsForSelection(slot.slotId);
    const slotDisabledByBind = nonEmpty(slot.bindToSlot);

    return `
      <section class="${sectionClass}">
        <div class="section-header">
          <div>
            <h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(description)}</p>
          </div>
          ${canDelete ? `
            <button type="button" data-action="delete-slot" data-uid="${uid}">
              ${escapeHtml(t(locale, "ui.delete"))}
            </button>
          ` : ""}
        </div>

        <div class="field-grid three">
          ${renderTextField({
            entity: ownerKind,
            uid,
            field: "slotId",
            value: slot.slotId,
            label: fieldText(locale, "slotId"),
            hint: hintText(locale, "slotId"),
            help: "",
            disabled: isOwnerSlot
          })}
          ${isOwnerSlot ? "" : `
            <label class="field">
              ${renderFieldLabel(fieldText(locale, "bindToSlot"), hintText(locale, "bindToSlot"))}
              <select
                data-entity="${ownerKind}"
                data-uid="${uid}"
                data-field="bindToSlot">
                ${renderSelectOptions(locale, bindOptions, slot.bindToSlot, {
                  allowEmpty: true,
                  emptyLabel: selectText(locale, "noBind")
                })}
              </select>
            </label>
          `}
          <label class="check-row check-row-centered">
            <input
              type="checkbox"
              data-entity="${ownerKind}"
              data-uid="${uid}"
              data-field="required"
              data-value-type="checkbox"
              ${slot.required ? "checked" : ""}
              ${isOwnerSlot ? "disabled" : ""}>
            ${renderFieldLabel(fieldText(locale, "required"), hintText(locale, "required"))}
          </label>
        </div>

        ${isOwnerSlot ? "" : `<div class="subsection">
          <div class="subsection-header tight">
            <strong>${escapeHtml(fieldText(locale, "allowSameActorAs"))} ${renderHelpIcon(hintText(locale, "allowSameActorAs"))}</strong>
          </div>
          <div class="checkbox-stack ${slotDisabledByBind ? "is-disabled" : ""}">
            ${allowOptions.length === 0
              ? `<span class="muted-text">${escapeHtml(t(locale, "ui.choose"))}</span>`
              : allowOptions.map(option => `
                <label class="check-row ${slotDisabledByBind ? "is-disabled" : ""}">
                  <input
                    type="checkbox"
                    data-action="toggle-allow-same-actor"
                    data-owner-kind="${ownerKind}"
                    data-owner-uid="${uid}"
                    data-target-slot-id="${option.id}"
                    ${slot.allowSameActorAs.includes(option.id) ? "checked" : ""}
                    ${slotDisabledByBind ? "disabled" : ""}>
                  <span>${escapeHtml(localized(locale, option.label))}</span>
                </label>
              `).join("")}
          </div>
        </div>`}

        <div class="subsection">
          <div class="subsection-header">
            <strong>${escapeHtml(fieldText(locale, "candidatePredicates"))} ${renderHelpIcon(hintText(locale, "candidatePredicates"))}</strong>
            <button
              type="button"
              data-action="add-slot-predicate"
              data-owner-kind="${ownerKind}"
              data-owner-uid="${uid}"
              ${slotDisabledByBind ? "disabled" : ""}>
              ${escapeHtml(buttonText(locale, "addCandidatePredicate"))}
            </button>
          </div>
          ${slotDisabledByBind
            ? `<p class="muted-text">${escapeHtml(hintText(locale, "bindToSlot"))}</p>`
            : slot.candidatePredicates.length === 0
              ? `<p class="muted-text">${escapeHtml(t(locale, "ui.emptySection"))}</p>`
              : slot.candidatePredicates.map((predicate, index) =>
                renderPredicateCard(predicate, ownerKind, uid, predicateTitle(locale, index + 1))).join("")}
        </div>

        <div class="subsection">
          <div class="subsection-header">
            <strong>${escapeHtml(fieldText(locale, "textBindings"))} ${renderHelpIcon(hintText(locale, "textBindings"))}</strong>
            <button
              type="button"
              data-action="add-binding"
              data-owner-kind="${ownerKind}"
              data-owner-uid="${uid}">
              ${escapeHtml(buttonText(locale, "addBinding"))}
            </button>
          </div>
          ${slot.textParameterBindings.length === 0
            ? `<p class="muted-text">${escapeHtml(t(locale, "ui.emptySection"))}</p>`
            : slot.textParameterBindings.map((binding, index) => renderBindingCard(binding, ownerKind, uid, index)).join("")}
        </div>
      </section>
    `;
  }

  function renderScenarioSection() {
    const locale = state.locale;

    return `
      <section class="editor-section scenario-section">
        <div class="section-header">
          <div>
            <h2>${escapeHtml(t(locale, "ui.sections.scenario"))}</h2>
            <p>${escapeHtml(t(locale, "ui.sectionDescriptions.scenario"))}</p>
          </div>
        </div>

        <div class="scenario-grid">
          <div class="subsection flat">
            <div class="subsection-header tight">
              <strong>${escapeHtml(t(locale, "ui.scenarioCommon"))}</strong>
            </div>
            <div class="field-grid four">
              ${renderTextField({
                entity: "scenario",
                field: "id",
                value: state.draft.scenario.id,
                label: fieldText(locale, "scenarioId"),
                hint: hintText(locale, "scenarioId"),
                help: hintText(locale, "scenarioIdTooltip"),
                placeholder: placeholderText(locale, "scenarioId")
              })}
              ${renderTextField({
                entity: "scenario",
                field: "name",
                value: state.draft.scenario.name,
                label: fieldText(locale, "humanName"),
                hint: hintText(locale, "humanName"),
                placeholder: placeholderText(locale, "scenarioName")
              })}
              ${renderCategoryPicker()}
              <label class="field">
                <span>${escapeHtml(fieldText(locale, "weight"))}</span>
                <input
                  type="text"
                  inputmode="numeric"
                  pattern="[0-9]*"
                  value="${escapeHtml(state.draft.scenario.weight)}"
                  data-entity="scenario"
                  data-field="weight"
                  data-value-type="number">
                ${renderHint(hintText(locale, "weight"))}
              </label>
            </div>

            <label class="check-row">
              <input
                type="checkbox"
                data-entity="scenario"
                data-field="enabled"
                data-value-type="checkbox"
                ${state.draft.scenario.enabled ? "checked" : ""}>
              ${renderFieldLabel(fieldText(locale, "enabled"), hintText(locale, "enabled"))}
            </label>
          </div>

          <div class="subsection">
            <div class="subsection-header">
              <strong>${escapeHtml(fieldText(locale, "globalPredicates"))} ${renderHelpIcon(hintText(locale, "globalPredicates"))}</strong>
              <button type="button" data-action="add-global-predicate">${escapeHtml(buttonText(locale, "addGlobalPredicate"))}</button>
            </div>
            ${state.draft.globalPredicates.length === 0
              ? `<p class="muted-text">${escapeHtml(t(locale, "ui.emptySection"))}</p>`
              : state.draft.globalPredicates.map((predicate, index) =>
                renderPredicateCard(predicate, "global", "", predicateTitle(locale, index + 1))).join("")}
          </div>
        </div>
      </section>
    `;
  }

  function renderExportPanel() {
    const locale = state.locale;
    const locKeys = getLocKeysForIntentions(state.draft);
    const artifacts = state.artifacts;
    const exportBlocked = state.validation.errors.length > 0;

    return `
      <section class="editor-section export-section">
        <div class="section-header">
          <div>
            <h2>${escapeHtml(t(locale, "ui.sections.export"))}</h2>
            <p>${escapeHtml(t(locale, "ui.sectionDescriptions.export"))}</p>
          </div>
        </div>

        <div class="export-summary">
          <div class="summary-box">
            <span>${escapeHtml(exportText(locale, "derivedCrew"))}</span>
            <strong>${artifacts.meta.derivedCrewCount}</strong>
          </div>
          <div class="summary-box">
            <span>${escapeHtml(exportText(locale, "slotBuildOrder"))}</span>
            <div class="pill-row">
              ${artifacts.meta.slotBuildOrder.length === 0
                ? `<span class="pill pill-muted">${escapeHtml(selectText(locale, "none"))}</span>`
                : artifacts.meta.slotBuildOrder.map(item => `<span class="pill">${escapeHtml(item)}</span>`).join("")}
            </div>
          </div>
          <div class="summary-box ${artifacts.meta.syntheticCrewPredicateAdded ? "summary-box-derivation" : ""}">
            <span>${escapeHtml(artifacts.meta.syntheticCrewPredicateAdded
              ? exportText(locale, "syntheticCrewAdded")
              : exportText(locale, "syntheticCrewSkipped"))}</span>
          </div>
        </div>

        <div class="export-actions">
          <button type="button" data-action="download-artifact" data-kind="scenario" ${exportBlocked ? "disabled" : ""}>${escapeHtml(buttonText(locale, "downloadScenario"))}</button>
          <button type="button" data-action="download-artifact" data-kind="intentions" ${exportBlocked ? "disabled" : ""}>${escapeHtml(buttonText(locale, "downloadIntentions"))}</button>
          <button type="button" data-action="download-artifact" data-kind="ftl" ${exportBlocked ? "disabled" : ""}>${escapeHtml(buttonText(locale, "downloadFtl"))}</button>
          <button type="button" data-action="copy-artifact" data-kind="scenario" ${exportBlocked ? "disabled" : ""}>${escapeHtml(buttonText(locale, "copyScenario"))}</button>
          <button type="button" data-action="copy-artifact" data-kind="intentions" ${exportBlocked ? "disabled" : ""}>${escapeHtml(buttonText(locale, "copyIntentions"))}</button>
          <button type="button" data-action="copy-artifact" data-kind="ftl" ${exportBlocked ? "disabled" : ""}>${escapeHtml(buttonText(locale, "copyFtl"))}</button>
        </div>

        <div class="subsection">
          <div class="subsection-header">
            <strong>${escapeHtml(exportText(locale, "generatedLocKeys"))}</strong>
          </div>
          <div class="loc-grid">
            ${locKeys.map(item => `
              <div class="loc-card">
                <strong>${escapeHtml(item.intentionId || "—")}</strong>
                <code>${escapeHtml(item.nameLoc)}</code>
                <code>${escapeHtml(item.summaryLoc)}</code>
                <code>${escapeHtml(item.descriptionLoc)}</code>
                <code>${escapeHtml(item.oocInfoLoc)}</code>
                <code>${escapeHtml(item.copyableTextLoc)}</code>
                <code>${escapeHtml(item.hiddenLabelLoc)}</code>
              </div>
            `).join("")}
          </div>
        </div>

        <div class="preview-grid">
          <label class="field">
            <span>${escapeHtml(artifacts.scenario.filename)}</span>
            <textarea rows="18" readonly>${escapeHtml(artifacts.scenario.content)}</textarea>
          </label>
          <label class="field">
            <span>${escapeHtml(artifacts.intentions.filename)}</span>
            <textarea rows="18" readonly>${escapeHtml(artifacts.intentions.content)}</textarea>
          </label>
          <label class="field">
            <span>${escapeHtml(artifacts.ftl.filename)}</span>
            <textarea rows="18" readonly>${escapeHtml(artifacts.ftl.content)}</textarea>
          </label>
        </div>
      </section>
    `;
  }

  function renderModal() {
    if (!state.modal) {
      return "";
    }

    if (state.modal === MODAL_TYPES.rules) {
      return `
        <div class="modal-backdrop">
          <div class="modal-card" data-modal-card="true" role="dialog" aria-modal="true">
            <div class="modal-header">
              <h2>${escapeHtml(t(state.locale, "ui.modalRulesTitle"))}</h2>
              <button type="button" data-action="close-modal">${escapeHtml(t(state.locale, "ui.close"))}</button>
            </div>
            <ul class="compact-list">
              ${t(state.locale, "ui.ruleModal").map(item => `<li>${escapeHtml(item)}</li>`).join("")}
            </ul>
          </div>
        </div>
      `;
    }

    if (state.modal === MODAL_TYPES.categories) {
      return `
        <div class="modal-backdrop">
          <div class="modal-card modal-card-wide" data-modal-card="true" role="dialog" aria-modal="true">
            <div class="modal-header">
              <h2>${escapeHtml(t(state.locale, "ui.modalCategoriesTitle"))}</h2>
              <button type="button" data-action="close-modal">${escapeHtml(t(state.locale, "ui.close"))}</button>
            </div>
            <div class="category-grid">
              ${CATEGORY_CATALOG.map(category => `
                <section class="category-card">
                  <h3>${escapeHtml(localized(state.locale, category.title))}</h3>
                  <code>${escapeHtml(category.id)}</code>
                  <p>${escapeHtml(localized(state.locale, category.description))}</p>
                  <ul>
                    ${(category.examples[state.locale] ?? category.examples.ru ?? []).map(example => `<li>${escapeHtml(example)}</li>`).join("")}
                  </ul>
                </section>
              `).join("")}
            </div>
          </div>
        </div>
      `;
    }

    return "";
  }

  function renderDataLists() {
    const dictionaries = new Set();
    const lists = [];
    for (const fieldSet of Object.values(FIELD_DEFINITIONS)) {
      for (const definition of Object.values(fieldSet)) {
        if (definition.dictionary && !dictionaries.has(definition.dictionary)) {
          dictionaries.add(definition.dictionary);
          lists.push(renderDatalist(`dict-${definition.dictionary}`, getDictionaryValues(definition.dictionary)));
        }
      }
    }
    return lists.join("");
  }

  function renderCategoryPicker() {
    const selectedCategory = CATEGORY_CATALOG.find(category => category.id === state.draft.scenario.category) ?? CATEGORY_CATALOG[0];
    const selectedTitle = selectedCategory ? localized(state.locale, selectedCategory.title) : "";

    return `
      <div class="field category-field" data-category-picker="true">
        ${renderFieldLabel(fieldText(state.locale, "category"), hintText(state.locale, "categoryTooltip"))}
        <button
          type="button"
          class="category-trigger"
          data-action="toggle-category-dropdown"
          aria-haspopup="listbox"
          aria-expanded="${state.categoryDropdownOpen ? "true" : "false"}">
          <strong>${escapeHtml(selectedTitle)}</strong>
          <span aria-hidden="true">v</span>
        </button>
        ${state.categoryDropdownOpen ? `
          <div class="category-menu" role="listbox">
            ${CATEGORY_CATALOG.map(category => `
              <button
                type="button"
                class="category-option ${category.id === state.draft.scenario.category ? "is-active" : ""}"
                data-action="set-category"
                data-category-id="${escapeHtml(category.id)}"
                role="option"
                aria-selected="${category.id === state.draft.scenario.category ? "true" : "false"}">
                <strong>${escapeHtml(localized(state.locale, category.title))}</strong>
                <span>${escapeHtml(localized(state.locale, category.description))}</span>
              </button>
            `).join("")}
          </div>
        ` : ""}
        ${renderHint(selectedCategory ? localized(state.locale, selectedCategory.description) : hintText(state.locale, "category"))}
      </div>
    `;
  }

  function renderOwnerPair() {
    return `
      <section class="slot-intention-pair owner-pair">
        ${renderSlotEditor(
          state.draft.ownerSlot,
          "owner-slot",
          t(state.locale, "ui.sections.ownerSlot"),
          t(state.locale, "ui.sectionDescriptions.ownerSlot")
        )}
        ${renderIntentionEditor(
          state.draft.ownerIntention,
          "owner-intention",
          t(state.locale, "ui.sections.ownerIntention"),
          t(state.locale, "ui.sectionDescriptions.ownerIntention"),
          {
            slot: state.draft.ownerSlot,
            slotOwnerKind: "owner-slot"
          }
        )}
      </section>
    `;
  }

  function renderSecondaryPairs() {
    return `
      <section class="section-group secondary-pairs-section">
        <div class="section-header">
          <div>
            <h2>${escapeHtml(t(state.locale, "ui.sections.secondarySlots"))}</h2>
            <p>${escapeHtml(t(state.locale, "ui.sectionDescriptions.secondarySlots"))}</p>
          </div>
          <button type="button" data-action="add-slot">${escapeHtml(buttonText(state.locale, "addSecondarySlot"))}</button>
        </div>
        ${state.draft.secondarySlots.length === 0
          ? `<p class="muted-text">${escapeHtml(t(state.locale, "ui.noSecondaryPairs"))}</p>`
          : state.draft.secondarySlots.map((slot, index) => {
            const intention = findLinkedIntention(slot);
            if (!intention) {
              return "";
            }
            return `
              <div class="slot-intention-pair">
                ${renderSlotEditor(
                  slot,
                  "slot",
                  secondarySlotTitle(state.locale, index + 1),
                  t(state.locale, "ui.sectionDescriptions.secondarySlotPair"),
                  false
                )}
                ${renderIntentionEditor(
                  intention,
                  "secondary-intention",
                  secondaryTemplateTitle(state.locale, index + 1),
                  t(state.locale, "ui.kinds.secondaryDescription"),
                  {
                    canDelete: true,
                    slot,
                    slotOwnerKind: "slot"
                  }
                )}
              </div>
            `;
          }).join("")}
      </section>
    `;
  }

  function render() {
    document.documentElement.lang = state.locale;
    document.documentElement.dataset.theme = state.theme;
    document.title = `${APP_TITLE} - ${getLocaleLabel(state.locale)}`;

    root.innerHTML = `
      <div class="shell">
        ${renderTopBar()}
        <main class="layout">
          ${renderScenarioSection()}
          ${renderOwnerPair()}
          ${renderSecondaryPairs()}
          ${renderValidationPanel()}
          ${renderExportPanel()}
        </main>
        ${renderDataLists()}
        ${renderModal()}
      </div>
    `;
    applyPendingFocus();
  }

  function isUndoEvent(event) {
    const key = `${event.key ?? ""}`.toLocaleLowerCase();
    return (event.ctrlKey || event.metaKey)
      && !event.altKey
      && !event.shiftKey
      && (key === "z" || event.code === "KeyZ");
  }

  function isRedoEvent(event) {
    const key = `${event.key ?? ""}`.toLocaleLowerCase();
    return (event.ctrlKey || event.metaKey)
      && !event.altKey
      && (
        key === "y"
        || event.code === "KeyY"
        || ((key === "z" || event.code === "KeyZ") && event.shiftKey)
      );
  }

  function handleUndoRedoShortcut(event) {
    if (isUndoEvent(event)) {
      event.preventDefault();
      undoHistory();
      return true;
    }
    if (isRedoEvent(event)) {
      event.preventDefault();
      redoHistory();
      return true;
    }

    return false;
  }

  root.addEventListener("click", handleClick);
  root.addEventListener("input", handleInput);
  root.addEventListener("change", handleInput);
  root.addEventListener("focusout", handleFocusOut);
  root.addEventListener("beforeinput", event => {
    if (event.inputType === "historyUndo") {
      event.preventDefault();
      undoHistory();
      return;
    }
    if (event.inputType === "historyRedo") {
      event.preventDefault();
      redoHistory();
    }
  });
  document.addEventListener("keydown", event => {
    if (handleUndoRedoShortcut(event)) {
      return;
    }

    if (event.key === "Escape" && state.searchableDropdown.openId) {
      closeSearchableDropdown();
      render();
      return;
    }
    if (event.key === "Escape" && state.modal) {
      state.modal = null;
      render();
    }
  });

  recalculate({ save: false });
}
