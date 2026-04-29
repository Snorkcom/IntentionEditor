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
import { clearDraft, loadDraft, loadLocale, saveDraft, saveLocale } from "./storage.js";
import {
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

const SOURCE_HELP_TEXT = {
  ru: "Откуда брать значение для параметра: self — из текущего участника, slot — из другого slot, round — из данных раунда, literal — вручную заданный текст.",
  en: "Where the parameter value comes from: self — current participant, slot — another slot, round — round data, literal — manually entered text."
};

const BOOLEAN_OPTIONS = [
  { id: "true", label: { ru: "true · да", en: "true" } },
  { id: "false", label: { ru: "false · нет", en: "false" } }
];

const MODAL_TYPES = {
  rules: "rules",
  categories: "categories"
};

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
  return `
    <span class="help-icon" tabindex="0" aria-label="${escapeHtml(text)}" data-tooltip="${escapeHtml(text)}">?</span>
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

  const state = {
    locale: initialLocale,
    draft: normalizeDraft(initialDraft, initialLocale),
    validation: validateDraft(initialDraft, initialLocale),
    artifacts: buildExportArtifacts(initialDraft),
    actionStatus: null,
    modal: null
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

  function captureFocusSnapshot() {
    const active = document.activeElement;
    if (!active || !(active instanceof HTMLInputElement || active instanceof HTMLTextAreaElement || active instanceof HTMLSelectElement)) {
      return null;
    }
    if (!root.contains(active)) {
      return null;
    }

    return {
      entity: active.dataset.entity ?? "",
      field: active.dataset.field ?? "",
      uid: active.dataset.uid ?? "",
      ownerKind: active.dataset.ownerKind ?? "",
      ownerUid: active.dataset.ownerUid ?? "",
      valueBuffer: active.dataset.valueBuffer ?? "",
      selectionStart: typeof active.selectionStart === "number" ? active.selectionStart : null,
      selectionEnd: typeof active.selectionEnd === "number" ? active.selectionEnd : null
    };
  }

  function restoreFocusSnapshot(snapshot) {
    if (!snapshot) {
      return;
    }

    let selector = "";
    if (snapshot.valueBuffer) {
      selector = `[data-value-buffer="${snapshot.valueBuffer}"]`;
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

    const next = root.querySelector(selector);
    if (!(next instanceof HTMLInputElement || next instanceof HTMLTextAreaElement || next instanceof HTMLSelectElement)) {
      return;
    }

    next.focus({ preventScroll: true });
    if ((next instanceof HTMLInputElement || next instanceof HTMLTextAreaElement)
      && snapshot.selectionStart !== null
      && snapshot.selectionEnd !== null) {
      try {
        next.setSelectionRange(snapshot.selectionStart, snapshot.selectionEnd);
      } catch {
        // noop
      }
    }
  }

  function recalculate({ save = true, actionStatus = null, normalizeTagBuffers = false } = {}) {
    const focusSnapshot = captureFocusSnapshot();
    state.draft.ownerSlot.intentionId = state.draft.ownerIntention.id;
    state.draft.lastUpdatedAt = new Date().toISOString();
    synchronizeDraftTags({ normalizeBuffers: normalizeTagBuffers });
    state.validation = validateDraft(state.draft, state.locale);
    state.artifacts = buildExportArtifacts(state.draft);
    if (save) {
      saveDraft(state.draft);
    }
    state.actionStatus = actionStatus;
    render();
    restoreFocusSnapshot(focusSnapshot);
  }

  function setLocale(nextLocale) {
    state.locale = nextLocale;
    saveLocale(nextLocale);
    recalculate({ save: true });
  }

  function resetDraft() {
    clearDraft();
    state.draft = createEmptyDraft(state.locale);
    recalculate({ save: true });
  }

  function withMutation(callback, options = {}) {
    callback();
    recalculate(options);
  }

  function findSecondaryIntention(uid) {
    return state.draft.secondaryIntentions.find(item => item.uid === uid) ?? null;
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

  function setField(target) {
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
    });
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
      return;
    }

    const action = button.dataset.action;
    switch (action) {
      case "reset-draft":
        resetDraft();
        return;
      case "set-locale":
        setLocale(button.dataset.locale);
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
          state.draft.secondaryIntentions.push(createSecondaryIntention(state.locale));
        });
        return;
      case "delete-secondary-intention":
        withMutation(() => {
          const uid = button.dataset.uid;
          const intention = findSecondaryIntention(uid);
          if (!intention) {
            return;
          }
          state.draft.secondaryIntentions = state.draft.secondaryIntentions.filter(item => item.uid !== uid);
          state.draft.secondarySlots.forEach(slot => {
            if (slot.intentionId === intention.id) {
              slot.intentionId = "";
            }
          });
        });
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
          state.draft.secondarySlots.push(createSecondarySlot());
        });
        return;
      case "delete-slot":
        withMutation(() => {
          const slotUid = button.dataset.uid;
          const slot = findSlot("slot", slotUid);
          if (!slot) {
            return;
          }

          state.draft.secondarySlots = state.draft.secondarySlots.filter(item => item.uid !== slotUid);
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
          const value = nonEmpty(input?.value);
          if (!value) {
            return;
          }
          predicate.values = [...predicate.values, value];
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

    if (target.dataset.entity && target.dataset.field) {
      setField(target);
    }
  }

  function handleFocusOut(event) {
    const target = event.target;
    if (!(target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement)) {
      return;
    }
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
    }, { normalizeTagBuffers: false });
  }

  function renderTopBar() {
    return `
      <header class="hero">
        <div>
          <p class="eyebrow">${escapeHtml(t(state.locale, "ui.eyebrow"))}</p>
          <h1>${escapeHtml(APP_TITLE)}</h1>
          <p class="hero-copy">${escapeHtml(t(state.locale, "ui.hero"))}</p>
        </div>
        <div class="hero-actions">
          <div class="topbar-controls">
            <button type="button" data-action="open-modal" data-modal="${MODAL_TYPES.rules}">${escapeHtml(t(state.locale, "ui.rules"))}</button>
            <button type="button" data-action="open-modal" data-modal="${MODAL_TYPES.categories}">${escapeHtml(t(state.locale, "ui.categories"))}</button>
          </div>
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
    dataListId = ""
  }) {
    const counter = counterMax > 0 ? renderCounter(`${value ?? ""}`.length, counterMax) : "";
    const commonAttrs = `
      data-entity="${entity}"
      data-field="${field}"
      ${uid ? `data-uid="${uid}"` : ""}
      ${ownerKind ? `data-owner-kind="${ownerKind}"` : ""}
      ${ownerUid ? `data-owner-uid="${ownerUid}"` : ""}
      ${valueType !== "text" ? `data-value-type="${valueType}"` : ""}
      ${maxLength ? `maxlength="${maxLength}"` : ""}
      ${placeholder ? `placeholder="${escapeHtml(placeholder)}"` : ""}
      ${disabled ? "disabled" : ""}
      ${dataListId ? `list="${dataListId}"` : ""}
    `;

    const control = rows > 0
      ? `<textarea rows="${rows}" ${commonAttrs}>${escapeHtml(value)}</textarea>`
      : `<input type="${type}" value="${escapeHtml(value)}" ${commonAttrs}>`;

    return `
      <label class="field">
        <span>${escapeHtml(label)}</span>
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

  function renderPredicateValueList(predicate, ownerKind, ownerUid, fieldDefinition) {
    const dictionaryName = fieldDefinition.type === "string" || fieldDefinition.type === "list-string"
      ? fieldDefinition.dictionary
      : "";
    const values = dictionaryName ? getDictionaryOptions(dictionaryName) : [];
    const selectorId = dictionaryName ? `dict-${dictionaryName}` : "";
    const inputControl = dictionaryName
      ? `
        <select data-value-buffer="${predicate.uid}">
          <option value="">${escapeHtml(placeholderText(state.locale, "selectValue"))}</option>
          ${values.map(value => {
            const label = typeof value.label === "string"
              ? value.label
              : localized(state.locale, value.label);
            return `<option value="${escapeHtml(value.id)}">${escapeHtml(label)}</option>`;
          }).join("")}
        </select>
      `
      : `
        <input
          type="${fieldDefinition.type === "int" || fieldDefinition.type === "map-int" ? "number" : "text"}"
          data-value-buffer="${predicate.uid}"
          ${selectorId ? `list="${selectorId}"` : ""}
          placeholder="${escapeHtml(placeholderText(state.locale, "addValue"))}">
      `;

    return `
      <div class="field">
        <span>${escapeHtml(fieldText(state.locale, "values"))}</span>
        <div class="inline-editor">
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
      valueControl = `
        <select ${commonAttrs}>
          <option value="">${escapeHtml(placeholderText(state.locale, "selectValue"))}</option>
          ${dictionary.map(value => {
            const label = typeof value.label === "string"
              ? value.label
              : localized(state.locale, value.label);
            return `
            <option value="${escapeHtml(value.id)}"${value.id === predicate.value ? " selected" : ""}>${escapeHtml(label)}</option>
          `;
          }).join("")}
        </select>
      `;
    } else {
      const type = fieldDefinition.type === "int" || fieldDefinition.type === "map-int" ? "number" : "text";
      const valueType = fieldDefinition.type === "int" ? `data-value-type="text"` : "";
      valueControl = `<input type="${type}" value="${escapeHtml(predicate.value)}" ${commonAttrs} ${valueType}>`;
    }

    return `
      <label class="field">
        <span>${escapeHtml(fieldText(state.locale, "value"))}</span>
        ${valueControl}
      </label>
    `;
  }

  function renderRangeEditor(predicate, ownerKind, ownerUid, fieldDefinition) {
    const type = fieldDefinition.type === "int" ? "number" : "text";
    return `
      <div class="field-grid two">
        <label class="field">
          <span>${escapeHtml(fieldText(state.locale, "valueFrom"))}</span>
          <input
            type="${type}"
            value="${escapeHtml(predicate.valueFrom)}"
            data-entity="predicate"
            data-owner-kind="${ownerKind}"
            data-owner-uid="${ownerUid}"
            data-uid="${predicate.uid}"
            data-field="valueFrom">
        </label>
        <label class="field">
          <span>${escapeHtml(fieldText(state.locale, "valueTo"))}</span>
          <input
            type="${type}"
            value="${escapeHtml(predicate.valueTo)}"
            data-entity="predicate"
            data-owner-kind="${ownerKind}"
            data-owner-uid="${ownerUid}"
            data-uid="${predicate.uid}"
            data-field="valueTo">
        </label>
      </div>
    `;
  }

  function renderMapKeyEditor(predicate, ownerKind, ownerUid, fieldDefinition) {
    const dictionary = fieldDefinition.dictionary ? getDictionaryOptions(fieldDefinition.dictionary) : [];
    const label = localized(state.locale, fieldDefinition.keyLabel) || fieldText(state.locale, "key");

    return `
      <label class="field">
        <span>${escapeHtml(label)}</span>
        <select
          data-entity="predicate"
          data-owner-kind="${ownerKind}"
          data-owner-uid="${ownerUid}"
          data-uid="${predicate.uid}"
          data-field="key">
          <option value="">${escapeHtml(placeholderText(state.locale, "selectValue"))}</option>
          ${dictionary.map(value => {
            const optionLabel = typeof value.label === "string"
              ? value.label
              : localized(state.locale, value.label);
            return `
            <option value="${escapeHtml(value.id)}"${value.id === predicate.key ? " selected" : ""}>${escapeHtml(optionLabel)}</option>
          `;
          }).join("")}
        </select>
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
          <span>${escapeHtml(fieldText(state.locale, "compareSlot"))}</span>
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
    const fieldHelp = predicate.scope === PREDICATE_SCOPES.round
      ? hintText(state.locale, "globalPredicates")
      : hintText(state.locale, "candidatePredicates");

    return `
      <section class="predicate-card">
        <div class="subsection-header tight">
          <div>
            <strong>${escapeHtml(title)}</strong>
            <p>${escapeHtml(fieldHelp)}</p>
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
            <span>${escapeHtml(fieldText(state.locale, "field"))}</span>
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
            <span>${escapeHtml(state.locale === "ru" ? "Оператор" : "Operator")}</span>
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

  function renderBindingCard(binding, ownerKind, ownerUid) {
    const slotOptions = getSlotsForSelection(findSlot(ownerKind, ownerUid)?.slotId ?? "");
    const sourceOptions = Object.values(TEXT_BINDING_SOURCES).map(source => ({
      id: source,
      label: localized(state.locale, SOURCE_LABELS[source])
    }));
    const fieldOptions = binding.source === TEXT_BINDING_SOURCES.round
      ? ROUND_TEXT_BINDING_FIELDS.map(field => ({ id: field.id, label: localized(state.locale, field.label) }))
      : TEXT_BINDING_FIELDS.map(field => ({ id: field.id, label: localized(state.locale, field.label) }));

    return `
      <section class="subcard">
        <div class="subsection-header tight">
          <strong>${escapeHtml(fieldText(state.locale, "textBindings"))}</strong>
          <button
            type="button"
            data-action="delete-binding"
            data-owner-kind="${ownerKind}"
            data-owner-uid="${ownerUid}"
            data-uid="${binding.uid}">
            ${escapeHtml(t(state.locale, "ui.delete"))}
          </button>
        </div>

        <div class="field-grid four">
          <label class="field">
            <span>${escapeHtml(fieldText(state.locale, "parameter"))}</span>
            <input
              type="text"
              value="${escapeHtml(binding.parameter)}"
              data-entity="binding"
              data-owner-kind="${ownerKind}"
              data-owner-uid="${ownerUid}"
              data-uid="${binding.uid}"
              data-field="parameter"
              placeholder="${escapeHtml(placeholderText(state.locale, "bindingParam"))}">
            ${renderHint(hintText(state.locale, "parameter"))}
          </label>
            <label class="field">
              <span>${escapeHtml(fieldText(state.locale, "source"))} ${renderHelpIcon(localized(state.locale, SOURCE_HELP_TEXT))}</span>
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
              <span>${escapeHtml(fieldText(state.locale, "slot"))}</span>
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
              <span>${escapeHtml(fieldText(state.locale, "value"))}</span>
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
              <span>${escapeHtml(fieldText(state.locale, "field"))}</span>
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

function renderIntentionEditor(intention, entity, title, description, canDelete = false) {
    const locale = state.locale;
    const uid = entity === "secondary-intention" ? intention.uid : "";
    const sectionClass = entity === "owner-intention"
      ? "editor-section intentions-section owner-intention-section"
      : "editor-section intentions-section secondary-intention-section";
    const visibilityOptions = [
      { id: VISIBILITY_TYPES.visible, label: localized(locale, VISIBILITY_LABELS.visible) },
      { id: VISIBILITY_TYPES.hidden, label: localized(locale, VISIBILITY_LABELS.hidden) }
    ];

    return `
      <section class="${sectionClass}">
        <div class="section-header">
          <div>
            <h2>${escapeHtml(title)}</h2>
            <p>${escapeHtml(description)}</p>
          </div>
          ${canDelete ? `
            <button type="button" data-action="delete-secondary-intention" data-uid="${uid}">
              ${escapeHtml(t(locale, "ui.delete"))}
            </button>
          ` : ""}
        </div>

        <div class="field-grid two">
          ${renderTextField({
            entity,
            uid,
            field: "id",
            value: intention.id,
            label: fieldText(locale, "templateId"),
            hint: hintText(locale, "templateId"),
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
          rows: 4
        })}
        ${renderTextField({
          entity,
          uid,
          field: "oocInfo",
          value: intention.oocInfo,
          label: fieldText(locale, "oocInfo"),
          hint: hintText(locale, "ooc500"),
          rows: 3
        })}
        ${renderTextField({
          entity,
          uid,
          field: "copyableText",
          value: intention.copyableText,
          label: fieldText(locale, "copyableText"),
          hint: hintText(locale, "copy5000"),
          rows: 4,
          maxLength: TEXT_LIMITS.copyableText,
          counterMax: TEXT_LIMITS.copyableText
        })}

        <div class="field-grid three">
          <label class="field">
            <span>${escapeHtml(fieldText(locale, "visibility"))}</span>
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
            maxLength: TEXT_LIMITS.hiddenLabel,
            counterMax: TEXT_LIMITS.hiddenLabel
          })}
          ${renderTextField({
            entity,
            uid,
            field: "creationDate",
            value: intention.creationDate,
            label: fieldText(locale, "creationDate"),
            hint: hintText(locale, "date"),
            placeholder: "2026-04-30"
          })}
        </div>

        <div class="field-grid two">
          ${renderTextField({
            entity,
            uid,
            field: "tagsInput",
            value: intention.tagsInput ?? "",
            label: fieldText(locale, "tags"),
            hint: hintText(locale, "tags")
          })}
          ${renderColorField(entity, "color", intention.color, uid)}
        </div>

        <div class="subsection">
          <div class="subsection-header tight">
            <strong>${escapeHtml(fieldText(locale, "addIcon"))}</strong>
          </div>
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
              disabled: !intention.iconEnabled,
              placeholder: placeholderText(locale, "iconSprite")
            })}
            ${renderTextField({
              entity,
              uid,
              field: "iconState",
              value: intention.iconState,
              label: fieldText(locale, "iconState"),
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
          <label class="check-row">
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
          type: "number",
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
    const bindOptions = getSlotsForSelection(slot.slotId);
    const allowOptions = getSlotsForSelection(slot.slotId);
    const templateOptions = isOwnerSlot
      ? [{ id: state.draft.ownerIntention.id, label: state.draft.ownerIntention.id }]
      : getSecondaryIntentionOptions();
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

        <div class="field-grid four">
          ${renderTextField({
            entity: ownerKind,
            uid,
            field: "slotId",
            value: slot.slotId,
            label: fieldText(locale, "slotId"),
            hint: hintText(locale, "slotId"),
            disabled: isOwnerSlot
          })}
          <label class="field">
            <span>${escapeHtml(fieldText(locale, "intentionTemplate"))}</span>
            <select
              data-entity="${ownerKind}"
              data-uid="${uid}"
              data-field="intentionId"
              ${isOwnerSlot ? "disabled" : ""}>
              ${renderSelectOptions(locale, templateOptions, slot.intentionId, {
                allowEmpty: !isOwnerSlot,
                emptyLabel: placeholderText(locale, "selectTemplate")
              })}
            </select>
          </label>
          <label class="field">
            <span>${escapeHtml(fieldText(locale, "bindToSlot"))} ${renderHelpIcon(hintText(locale, "bindToSlot"))}</span>
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
          <label class="check-row">
            <input
              type="checkbox"
              data-entity="${ownerKind}"
              data-uid="${uid}"
              data-field="required"
              data-value-type="checkbox"
              ${slot.required ? "checked" : ""}
              ${isOwnerSlot ? "disabled" : ""}>
            <span>${escapeHtml(fieldText(locale, "required"))}</span>
          </label>
        </div>

        <div class="subsection">
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
        </div>

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
              ? `<p class="muted-text">${escapeHtml(t(locale, "ui.noIssues"))}</p>`
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
            ? `<p class="muted-text">${escapeHtml(t(locale, "ui.noIssues"))}</p>`
            : slot.textParameterBindings.map(binding => renderBindingCard(binding, ownerKind, uid)).join("")}
        </div>

        ${renderVisibilityEditor(slot, ownerKind)}
      </section>
    `;
  }

  function renderScenarioSection() {
    const locale = state.locale;
    const categoryOptions = CATEGORY_CATALOG.map(category => ({
      id: category.id,
      label: `${localized(locale, category.title)} · ${category.id}`
    }));

    return `
      <section class="editor-section scenario-section">
        <div class="section-header">
          <div>
            <h2>${escapeHtml(t(locale, "ui.sections.scenario"))}</h2>
            <p>${escapeHtml(t(locale, "ui.sectionDescriptions.scenario"))}</p>
          </div>
        </div>

        <div class="field-grid four">
          ${renderTextField({
            entity: "scenario",
            field: "id",
            value: state.draft.scenario.id,
            label: fieldText(locale, "scenarioId"),
            hint: hintText(locale, "scenarioId"),
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
          <label class="field">
            <span>${escapeHtml(fieldText(locale, "category"))}</span>
            <select data-entity="scenario" data-field="category">
              ${renderSelectOptions(locale, categoryOptions, state.draft.scenario.category)}
            </select>
            ${renderHint(hintText(locale, "category"))}
          </label>
          <label class="field">
            <span>${escapeHtml(fieldText(locale, "weight"))}</span>
            <input
              type="number"
              min="1"
              step="1"
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
          <span>${escapeHtml(fieldText(locale, "enabled"))}</span>
        </label>

        <div class="subsection">
          <div class="subsection-header">
            <strong>${escapeHtml(fieldText(locale, "globalPredicates"))} ${renderHelpIcon(hintText(locale, "globalPredicates"))}</strong>
            <button type="button" data-action="add-global-predicate">${escapeHtml(buttonText(locale, "addGlobalPredicate"))}</button>
          </div>
          ${state.draft.globalPredicates.length === 0
            ? `<p class="muted-text">${escapeHtml(hintText(locale, "globalPredicates"))}</p>`
            : state.draft.globalPredicates.map((predicate, index) =>
              renderPredicateCard(predicate, "global", "", predicateTitle(locale, index + 1))).join("")}
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

  function render() {
    document.documentElement.lang = state.locale;
    document.title = `${APP_TITLE} · ${getLocaleLabel(state.locale)}`;

    root.innerHTML = `
      <div class="shell">
        ${renderTopBar()}
        <main class="layout">
          <aside class="sidebar">
            ${renderStatusPanel()}
            ${renderIssuePanel()}
          </aside>
          <div class="content">
            ${renderScenarioSection()}
            ${renderIntentionEditor(
              state.draft.ownerIntention,
              "owner-intention",
              t(state.locale, "ui.sections.ownerIntention"),
              t(state.locale, "ui.sectionDescriptions.ownerIntention")
            )}
            <section class="section-group">
              <div class="section-header">
                <div>
                  <h2>${escapeHtml(t(state.locale, "ui.sections.secondaryIntentions"))}</h2>
                  <p>${escapeHtml(t(state.locale, "ui.sectionDescriptions.secondaryIntentions"))}</p>
                </div>
                <button type="button" data-action="add-secondary-intention">${escapeHtml(buttonText(state.locale, "addSecondaryTemplate"))}</button>
              </div>
                ${state.draft.secondaryIntentions.length === 0
                  ? `<p class="muted-text">${escapeHtml(t(state.locale, "ui.noIssues"))}</p>`
                  : state.draft.secondaryIntentions.map((intention, index) => renderIntentionEditor(
                    intention,
                    "secondary-intention",
                    secondaryTemplateTitle(state.locale, index + 1),
                    t(state.locale, "ui.kinds.secondaryDescription"),
                    true
                  )).join("")}
              </section>
            ${renderSlotEditor(
              state.draft.ownerSlot,
              "owner-slot",
              t(state.locale, "ui.sections.ownerSlot"),
              t(state.locale, "ui.sectionDescriptions.ownerSlot")
            )}
            <section class="section-group">
              <div class="section-header">
                <div>
                  <h2>${escapeHtml(t(state.locale, "ui.sections.secondarySlots"))}</h2>
                  <p>${escapeHtml(t(state.locale, "ui.sectionDescriptions.secondarySlots"))}</p>
                </div>
                <button type="button" data-action="add-slot">${escapeHtml(buttonText(state.locale, "addSecondarySlot"))}</button>
              </div>
                ${state.draft.secondarySlots.length === 0
                  ? `<p class="muted-text">${escapeHtml(t(state.locale, "ui.noIssues"))}</p>`
                  : state.draft.secondarySlots.map((slot, index) => renderSlotEditor(
                    slot,
                    "slot",
                    secondarySlotTitle(state.locale, index + 1),
                    state.locale === "ru"
                      ? "Настройки конкретного secondary slot: связи, правила подбора, reveal и text bindings."
                      : "Settings for this specific secondary slot: links, selection rules, reveal, and text bindings.",
                    true
                  )).join("")}
            </section>
            ${renderExportPanel()}
          </div>
        </main>
        ${renderDataLists()}
        ${renderModal()}
      </div>
    `;
  }

  root.addEventListener("click", handleClick);
  root.addEventListener("input", handleInput);
  root.addEventListener("change", handleInput);
  root.addEventListener("focusout", handleFocusOut);
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && state.modal) {
      state.modal = null;
      render();
    }
  });

  recalculate({ save: false });
}
