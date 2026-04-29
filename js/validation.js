import {
  INTENTION_KINDS,
  PREDICATE_OPERATORS,
  PREDICATE_SCOPES,
  REVEAL_TYPES,
  TEXT_BINDING_SOURCES,
  TEXT_LIMITS,
  VISIBILITY_TYPES
} from "./constants.js";
import {
  getAllowedOperators,
  getCategory,
  getDictionaryValues,
  getFieldDefinition,
  ROUND_TEXT_BINDING_FIELDS,
  TEXT_BINDING_FIELDS
} from "./catalogs.js";
import { getAllIntentions, getAllSlots } from "./draft.js";
import { t } from "./i18n.js";
import {
  isBooleanString,
  isHexColor,
  isIntString,
  isIsoDate,
  isTimeSpanString,
  nonEmpty,
  splitTagsInput
} from "./utils.js";

function issue(severity, path, code, message) {
  return { severity, path, code, message };
}

function addIssue(issues, severity, path, code, message) {
  issues.push(issue(severity, path, code, message));
}

function issueText(locale, key, params = {}) {
  return t(locale, `issues.${key}`, params);
}

function uiText(locale, key, params = {}) {
  return t(locale, `ui.${key}`, params);
}

function validateTextLength(issues, locale, value, maxLength, path, label, required = false) {
  const text = `${value ?? ""}`;
  if (required && nonEmpty(text).length === 0) {
    addIssue(issues, "error", path, "required", issueText(locale, "required", { label }));
  }

  if (text.length > maxLength) {
    addIssue(issues, "error", path, "length-limit", issueText(locale, "lengthLimit", { label, max: maxLength }));
  }
}

function valueMatchesFieldType(value, fieldType, allowListElement = false) {
  if (value === null || value === undefined || `${value}`.trim().length === 0) {
    return false;
  }

  const text = `${value}`.trim();
  switch (fieldType) {
    case "string":
      return true;
    case "bool":
      return isBooleanString(text);
    case "int":
      return isIntString(text);
    case "timespan":
      return isTimeSpanString(text);
    case "list-string":
      return allowListElement;
    case "map-int":
      return isIntString(text);
    default:
      return false;
  }
}

function validateIdentifierAgainstPresets(issues, locale, path, field, values) {
  const fieldDefinition = getFieldDefinition(PREDICATE_SCOPES.round, field)
    ?? getFieldDefinition(PREDICATE_SCOPES.candidate, field);
  const dictionaryName = fieldDefinition?.dictionary;
  if (!dictionaryName) {
    return;
  }

  const dictionary = getDictionaryValues(dictionaryName);
  if (dictionary.length === 0) {
    return;
  }

  for (const value of values) {
    if (value && !dictionary.includes(value)) {
      addIssue(
        issues,
        "warning",
        path,
        "unknown-reference",
        issueText(locale, "unknownReference", { value, field })
      );
    }
  }
}

function validatePredicateShape(issues, locale, path, predicate, fieldDefinition) {
  const hasValue = nonEmpty(predicate.value).length > 0;
  const hasValues = Array.isArray(predicate.values) && predicate.values.length > 0;
  const hasRange = nonEmpty(predicate.valueFrom).length > 0 || nonEmpty(predicate.valueTo).length > 0;
  const hasCompare = predicate.compareTo !== null && nonEmpty(predicate.compareTo.slotId).length > 0;
  const formCount = [hasValue, hasValues, hasRange, hasCompare].filter(Boolean).length;

  if (formCount > 1) {
    addIssue(issues, "error", path, "conflicting-predicate-values", issueText(locale, "conflictingPredicateValues"));
  }

  switch (predicate.operator) {
    case PREDICATE_OPERATORS.equals:
    case PREDICATE_OPERATORS.notEquals:
    case PREDICATE_OPERATORS[">"]:
    case PREDICATE_OPERATORS[">="]:
    case PREDICATE_OPERATORS["<"]:
    case PREDICATE_OPERATORS["<="]:
    case PREDICATE_OPERATORS.contains:
    case PREDICATE_OPERATORS.notContains:
      if (!hasValue) {
        addIssue(issues, "error", `${path}.value`, "missing-predicate-value", issueText(locale, "missingPredicateValue"));
      }
      break;
    case PREDICATE_OPERATORS.in:
    case PREDICATE_OPERATORS.notIn:
      if (!hasValues) {
        addIssue(issues, "error", `${path}.values`, "missing-predicate-values", issueText(locale, "missingPredicateValues"));
      }
      break;
    case PREDICATE_OPERATORS.between:
      if (!nonEmpty(predicate.valueFrom) || !nonEmpty(predicate.valueTo)) {
        addIssue(issues, "error", path, "missing-predicate-range", issueText(locale, "missingPredicateRange"));
      }
      break;
    case PREDICATE_OPERATORS.sameAs:
    case PREDICATE_OPERATORS.notSameAs:
      if (!hasCompare) {
        addIssue(issues, "error", `${path}.compareTo`, "missing-compare-to", issueText(locale, "missingCompareTo"));
      }
      break;
  }

  if ((predicate.operator === PREDICATE_OPERATORS.contains || predicate.operator === PREDICATE_OPERATORS.notContains)
    && fieldDefinition.type !== "list-string") {
    addIssue(issues, "error", `${path}.operator`, "operator-field-mismatch", issueText(locale, "operatorFieldMismatchList"));
  }

  if ([PREDICATE_OPERATORS[">"], PREDICATE_OPERATORS[">="], PREDICATE_OPERATORS["<"], PREDICATE_OPERATORS["<="], PREDICATE_OPERATORS.between].includes(predicate.operator)
    && !["int", "timespan", "map-int"].includes(fieldDefinition.type)) {
    addIssue(issues, "error", `${path}.operator`, "operator-field-mismatch", issueText(locale, "operatorFieldMismatchCompare"));
  }
}

function validatePredicateValueTypes(issues, locale, path, predicate, fieldDefinition) {
  if (nonEmpty(predicate.value) && !valueMatchesFieldType(predicate.value, fieldDefinition.type, true)) {
    addIssue(issues, "error", `${path}.value`, "invalid-predicate-value-type", issueText(locale, "invalidPredicateValueType"));
  }

  if (predicate.values.length > 0) {
    for (const value of predicate.values) {
      if (!valueMatchesFieldType(value, fieldDefinition.type, true)) {
        addIssue(issues, "error", `${path}.values`, "invalid-predicate-value-type", issueText(locale, "invalidPredicateValueType"));
        break;
      }
    }
  }

  if (nonEmpty(predicate.valueFrom) && !valueMatchesFieldType(predicate.valueFrom, fieldDefinition.type, false)) {
    addIssue(issues, "error", `${path}.valueFrom`, "invalid-predicate-value-type", issueText(locale, "invalidPredicateValueType"));
  }

  if (nonEmpty(predicate.valueTo) && !valueMatchesFieldType(predicate.valueTo, fieldDefinition.type, false)) {
    addIssue(issues, "error", `${path}.valueTo`, "invalid-predicate-value-type", issueText(locale, "invalidPredicateValueType"));
  }
}

function validatePredicateIdentifiers(issues, locale, path, predicate, fieldDefinition) {
  const values = [];
  if (nonEmpty(predicate.key)) {
    values.push(predicate.key);
  }
  if (nonEmpty(predicate.value) && fieldDefinition.type !== "int" && fieldDefinition.type !== "timespan" && fieldDefinition.type !== "bool" && fieldDefinition.type !== "map-int") {
    values.push(predicate.value);
  }
  if (predicate.values.length > 0) {
    values.push(...predicate.values.filter(item => nonEmpty(item)));
  }
  validateIdentifierAgainstPresets(issues, locale, path, predicate.field, values);
}

function validateCompareTo(issues, locale, path, predicate, context) {
  if (![PREDICATE_OPERATORS.sameAs, PREDICATE_OPERATORS.notSameAs].includes(predicate.operator)) {
    if (predicate.compareTo) {
      addIssue(issues, "error", `${path}.compareTo`, "unexpected-compare-to", issueText(locale, "unexpectedCompareTo"));
    }
    return;
  }

  if (context.scope !== PREDICATE_SCOPES.candidate) {
    addIssue(issues, "error", `${path}.compareTo`, "compare-to-outside-candidate", issueText(locale, "compareOutsideCandidate"));
    return;
  }

  const compareTo = predicate.compareTo;
  if (!compareTo) {
    return;
  }

  if (compareTo.scope !== PREDICATE_SCOPES.slot) {
    addIssue(issues, "error", `${path}.compareTo.scope`, "invalid-compare-scope", issueText(locale, "invalidCompareScope"));
  }

  if (!context.slotIds.has(compareTo.slotId)) {
    addIssue(issues, "error", `${path}.compareTo.slotId`, "missing-compare-slot", issueText(locale, "missingCompareSlot"));
  }

  if (compareTo.field !== predicate.field) {
    addIssue(issues, "error", `${path}.compareTo.field`, "compare-field-mismatch", issueText(locale, "compareFieldMismatch"));
  }

  if (compareTo.slotId === context.currentSlotId) {
    addIssue(issues, "warning", `${path}.compareTo.slotId`, "owner-self-compare", issueText(locale, "ownerSelfCompare"));
  }
}

function validatePredicate(issues, locale, path, predicate, context) {
  if (predicate.scope !== context.scope) {
    addIssue(issues, "error", `${path}.scope`, "invalid-scope", issueText(locale, "invalidScope", { scope: context.scope }));
  }

  const fieldDefinition = getFieldDefinition(context.scope, predicate.field);
  if (!fieldDefinition) {
    addIssue(issues, "error", `${path}.field`, "unknown-field", issueText(locale, "unknownField"));
    return;
  }

  const allowedOperators = getAllowedOperators(context.scope, predicate.field, {
    allowCompareOperators: context.allowCompareOperators
  });
  if (!allowedOperators.includes(predicate.operator)) {
    addIssue(issues, "error", `${path}.operator`, "invalid-operator", issueText(locale, "invalidOperator"));
  }

  if (fieldDefinition.type === "map-int" && !nonEmpty(predicate.key)) {
    addIssue(issues, "error", `${path}.key`, "missing-map-key", issueText(locale, "missingMapKey"));
  }

  if (fieldDefinition.type !== "map-int" && nonEmpty(predicate.key)) {
    addIssue(issues, "error", `${path}.key`, "unexpected-map-key", issueText(locale, "unexpectedMapKey"));
  }

  validatePredicateShape(issues, locale, path, predicate, fieldDefinition);
  validatePredicateValueTypes(issues, locale, path, predicate, fieldDefinition);
  validatePredicateIdentifiers(issues, locale, path, predicate, fieldDefinition);
  validateCompareTo(issues, locale, path, predicate, context);
}

function validateTextBinding(issues, locale, path, binding, slotIds) {
  if (!nonEmpty(binding.parameter)) {
    addIssue(issues, "error", `${path}.parameter`, "missing-binding-parameter", issueText(locale, "missingBindingParameter"));
  }

  switch (binding.source) {
    case TEXT_BINDING_SOURCES.self:
      if (!TEXT_BINDING_FIELDS.some(field => field.id === binding.field)) {
        addIssue(issues, "error", `${path}.field`, "invalid-self-binding-field", issueText(locale, "invalidSelfBindingField"));
      }
      break;
    case TEXT_BINDING_SOURCES.slot:
      if (!slotIds.has(binding.slotId)) {
        addIssue(issues, "error", `${path}.slotId`, "invalid-text-binding-slot", issueText(locale, "invalidTextBindingSlot"));
      }
      if (!TEXT_BINDING_FIELDS.some(field => field.id === binding.field)) {
        addIssue(issues, "error", `${path}.field`, "invalid-slot-binding-field", issueText(locale, "invalidSlotBindingField"));
      }
      break;
    case TEXT_BINDING_SOURCES.round:
      if (!ROUND_TEXT_BINDING_FIELDS.some(field => field.id === binding.field)) {
        addIssue(issues, "error", `${path}.field`, "invalid-round-binding", issueText(locale, "invalidRoundBinding"));
      }
      break;
    case TEXT_BINDING_SOURCES.literal:
      if (!nonEmpty(binding.value)) {
        addIssue(issues, "error", `${path}.value`, "missing-literal-binding", issueText(locale, "missingLiteralBinding"));
      }
      break;
    default:
      addIssue(issues, "error", `${path}.source`, "invalid-text-binding-source", issueText(locale, "invalidTextBindingSource"));
      break;
  }
}

function validateVisibility(issues, locale, path, slot) {
  if (!slot.visibilityEnabled) {
    return;
  }

  if (![VISIBILITY_TYPES.visible, VISIBILITY_TYPES.hidden].includes(slot.visibilityType)) {
    addIssue(issues, "error", `${path}.visibilityType`, "invalid-visibility-type", issueText(locale, "invalidVisibilityType"));
  }

  if (slot.visibilityType === VISIBILITY_TYPES.visible && slot.revealType !== REVEAL_TYPES.none) {
    addIssue(issues, "error", `${path}.revealType`, "visible-with-reveal", issueText(locale, "visibleWithReveal"));
  }

  if (![REVEAL_TYPES.none, REVEAL_TYPES.timer].includes(slot.revealType)) {
    addIssue(issues, "error", `${path}.revealType`, "invalid-reveal-type", issueText(locale, "invalidRevealType"));
  }

  if (slot.revealType === REVEAL_TYPES.timer && (!Number.isFinite(slot.revealMinutes) || slot.revealMinutes <= 0)) {
    addIssue(issues, "error", `${path}.revealMinutes`, "invalid-reveal-minutes", issueText(locale, "invalidRevealMinutes"));
  }

  if (slot.revealType === REVEAL_TYPES.none
    && slot.visibilityType === VISIBILITY_TYPES.hidden
    && Number.isFinite(slot.revealMinutes)
    && slot.revealMinutes <= 0) {
    addIssue(issues, "warning", `${path}.revealMinutes`, "unused-reveal-minutes", issueText(locale, "unusedRevealMinutes"));
  }
}

function validateIntentionTemplate(issues, locale, intention, path) {
  const kindLabel = intention.kind === INTENTION_KINDS.primary
    ? uiText(locale, "sections.ownerIntention")
    : uiText(locale, "sections.secondaryIntentions");

  if (!nonEmpty(intention.id)) {
    addIssue(issues, "error", `${path}.id`, "missing-id", issueText(locale, "missingId", { kind: kindLabel }));
  }

  if (![INTENTION_KINDS.primary, INTENTION_KINDS.secondary].includes(intention.kind)) {
    addIssue(issues, "error", `${path}.kind`, "invalid-kind", issueText(locale, "invalidKind"));
  }

  const titleLabel = uiText(locale, "fields.title");
  const summaryLabel = uiText(locale, "fields.summary");
  const descriptionLabel = uiText(locale, "fields.description");
  const oocLabel = uiText(locale, "fields.oocInfo");
  const copyLabel = uiText(locale, "fields.copyableText");
  const hiddenLabel = uiText(locale, "fields.hiddenLabel");

  validateTextLength(issues, locale, intention.name, TEXT_LIMITS.name, `${path}.name`, titleLabel, true);
  validateTextLength(issues, locale, intention.summary, TEXT_LIMITS.summary, `${path}.summary`, summaryLabel);
  validateTextLength(issues, locale, intention.description, TEXT_LIMITS.description, `${path}.description`, descriptionLabel, true);
  validateTextLength(issues, locale, intention.oocInfo, TEXT_LIMITS.oocInfo, `${path}.oocInfo`, oocLabel);
  validateTextLength(issues, locale, intention.copyableText, TEXT_LIMITS.copyableText, `${path}.copyableText`, copyLabel);
  validateTextLength(issues, locale, intention.hiddenLabel, TEXT_LIMITS.hiddenLabel, `${path}.hiddenLabel`, hiddenLabel);

  if (![VISIBILITY_TYPES.visible, VISIBILITY_TYPES.hidden].includes(intention.defaultVisibility)) {
    addIssue(issues, "error", `${path}.defaultVisibility`, "invalid-default-visibility", issueText(locale, "invalidDefaultVisibility"));
  }

  if (nonEmpty(intention.color) && !isHexColor(intention.color)) {
    addIssue(issues, "error", `${path}.color`, "invalid-color", issueText(locale, "invalidColor"));
  }

  if (nonEmpty(intention.creationDate) && !isIsoDate(intention.creationDate)) {
    addIssue(issues, "error", `${path}.creationDate`, "invalid-creation-date", issueText(locale, "invalidCreationDate"));
  }

  if (intention.iconEnabled) {
    if (!nonEmpty(intention.iconSprite)) {
      addIssue(issues, "error", `${path}.iconSprite`, "missing-icon-sprite", issueText(locale, "missingIconSprite"));
    }
    if (!nonEmpty(intention.iconState)) {
      addIssue(issues, "error", `${path}.iconState`, "missing-icon-state", issueText(locale, "missingIconState"));
    }
  }

  if (intention.defaultVisibility === VISIBILITY_TYPES.hidden && !nonEmpty(intention.hiddenLabel)) {
    addIssue(issues, "warning", `${path}.hiddenLabel`, "missing-hidden-label", issueText(locale, "missingHiddenLabel"));
  }
}

function buildSlotDependencies(slot) {
  const dependencies = new Set();
  if (nonEmpty(slot.bindToSlot)) {
    dependencies.add(slot.bindToSlot);
  }

  for (const allowedSlot of slot.allowSameActorAs) {
    if (nonEmpty(allowedSlot)) {
      dependencies.add(allowedSlot);
    }
  }

  for (const predicate of slot.candidatePredicates) {
    if (predicate.compareTo?.slotId) {
      dependencies.add(predicate.compareTo.slotId);
    }
  }

  return dependencies;
}

function computeSlotBuildOrder(slots) {
  const dependencies = new Map();
  for (const slot of slots) {
    dependencies.set(slot.slotId, buildSlotDependencies(slot));
  }

  const result = [];
  const processed = new Set();

  while (result.length < slots.length) {
    const next = slots.find(slot =>
      !processed.has(slot.slotId)
      && [...(dependencies.get(slot.slotId) ?? [])].every(item => processed.has(item)));

    if (!next) {
      return [];
    }

    processed.add(next.slotId);
    result.push(next.slotId);
  }

  return result;
}

function getComparableSlots(currentSlotId, slotIds) {
  return [...slotIds].filter(slotId => slotId !== currentSlotId);
}

function validateSlot(issues, locale, slot, path, context) {
  if (!nonEmpty(slot.slotId)) {
    addIssue(issues, "error", `${path}.slotId`, "missing-slot-id", issueText(locale, "missingSlotId"));
  }

  if (![INTENTION_KINDS.primary, INTENTION_KINDS.secondary].includes(slot.kind)) {
    addIssue(issues, "error", `${path}.kind`, "invalid-slot-kind", issueText(locale, "invalidSlotKind"));
  }

  if (!context.intentionById.has(slot.intentionId)) {
    addIssue(issues, "error", `${path}.intentionId`, "missing-intention-reference", issueText(locale, "missingIntentionReference"));
  } else if (context.intentionById.get(slot.intentionId).kind !== slot.kind) {
    addIssue(issues, "error", `${path}.intentionId`, "kind-mismatch", issueText(locale, "kindMismatch"));
  }

  if (slot.bindToSlot && slot.allowSameActorAs.length > 0) {
    addIssue(issues, "error", path, "bind-and-allow-same-actor", issueText(locale, "bindAndAllowSameActor"));
  }

  if (slot.bindToSlot) {
    if (!context.slotIds.has(slot.bindToSlot)) {
      addIssue(issues, "error", `${path}.bindToSlot`, "missing-bound-slot", issueText(locale, "missingBoundSlot"));
    }
    if (slot.bindToSlot === slot.slotId) {
      addIssue(issues, "error", `${path}.bindToSlot`, "self-bind", issueText(locale, "selfBind"));
    }
    if (slot.candidatePredicates.length > 0) {
      addIssue(issues, "error", `${path}.candidatePredicates`, "bound-slot-has-predicates", issueText(locale, "boundSlotHasPredicates"));
    }
  }

  const allowSet = new Set();
  for (const allowedSlot of slot.allowSameActorAs) {
    if (allowedSlot === slot.slotId) {
      addIssue(issues, "error", `${path}.allowSameActorAs`, "self-allow-same-actor", issueText(locale, "selfAllowSameActor"));
    }
    if (allowSet.has(allowedSlot)) {
      addIssue(issues, "error", `${path}.allowSameActorAs`, "duplicate-allow-same-actor", issueText(locale, "duplicateAllowSameActor"));
    }
    allowSet.add(allowedSlot);
    if (!context.slotIds.has(allowedSlot)) {
      addIssue(issues, "error", `${path}.allowSameActorAs`, "missing-allow-same-actor-slot", issueText(locale, "missingAllowSameActorSlot"));
    }
  }

  const compareOptionsAvailable = getComparableSlots(slot.slotId, context.slotIds).length > 0;
  slot.candidatePredicates.forEach((predicate, index) => {
    validatePredicate(issues, locale, `${path}.candidatePredicates.${index}`, predicate, {
      scope: PREDICATE_SCOPES.candidate,
      slotIds: context.slotIds,
      currentSlotId: slot.slotId,
      allowCompareOperators: compareOptionsAvailable
    });
  });

  const bindingNames = new Set();
  slot.textParameterBindings.forEach((binding, index) => {
    validateTextBinding(issues, locale, `${path}.textParameterBindings.${index}`, binding, context.slotIds);
    if (bindingNames.has(binding.parameter)) {
      addIssue(issues, "error", `${path}.textParameterBindings.${index}.parameter`, "duplicate-binding-parameter", issueText(locale, "duplicateBindingParameter"));
    }
    bindingNames.add(binding.parameter);
  });

  validateVisibility(issues, locale, path, slot);
}

export function validateDraft(draft, locale = "ru") {
  const issues = [];

  if (!nonEmpty(draft.scenario.id)) {
    addIssue(issues, "error", "scenario.id", "missing-scenario-id", issueText(locale, "missingScenarioId"));
  }
  if (!nonEmpty(draft.scenario.name)) {
    addIssue(issues, "error", "scenario.name", "missing-scenario-name", issueText(locale, "missingScenarioName"));
  }
  if (!nonEmpty(draft.scenario.category)) {
    addIssue(issues, "error", "scenario.category", "missing-scenario-category", issueText(locale, "missingScenarioCategory"));
  } else if (!getCategory(draft.scenario.category)) {
    addIssue(issues, "error", "scenario.category", "category-not-in-catalog", issueText(locale, "categoryNotInCatalog"));
  }

  const weight = Number(draft.scenario.weight);
  if (!Number.isInteger(weight) || weight <= 0) {
    addIssue(issues, "error", "scenario.weight", "invalid-weight", issueText(locale, "invalidWeight"));
  }

  validateIntentionTemplate(issues, locale, {
    ...draft.ownerIntention,
    tags: splitTagsInput(draft.ownerIntention.tagsInput ?? draft.ownerIntention.tags ?? [])
  }, "ownerIntention");

  draft.secondaryIntentions.forEach((intention, index) => {
    validateIntentionTemplate(issues, locale, {
      ...intention,
      tags: splitTagsInput(intention.tagsInput ?? intention.tags ?? [])
    }, `secondaryIntentions.${index}`);
  });

  const allIntentions = getAllIntentions(draft);
  const intentionById = new Map();
  for (const intention of allIntentions) {
    if (!nonEmpty(intention.id)) {
      continue;
    }

    if (intentionById.has(intention.id)) {
      addIssue(issues, "error", "intentions", "duplicate-intention-id", issueText(locale, "duplicateIntentionId", { id: intention.id }));
    } else {
      intentionById.set(intention.id, intention);
    }
  }

  const slots = getAllSlots(draft);
  const slotIds = new Set();
  for (const slot of slots) {
    if (!nonEmpty(slot.slotId)) {
      continue;
    }

    if (slotIds.has(slot.slotId)) {
      addIssue(issues, "error", "slots", "duplicate-slot-id", issueText(locale, "duplicateSlotId", { id: slot.slotId }));
    } else {
      slotIds.add(slot.slotId);
    }
  }

  if (draft.ownerSlot.slotId !== "owner") {
    addIssue(issues, "error", "ownerSlot.slotId", "owner-slot-id", issueText(locale, "ownerSlotId"));
  }
  if (draft.ownerSlot.kind !== INTENTION_KINDS.primary) {
    addIssue(issues, "error", "ownerSlot.kind", "owner-slot-kind", issueText(locale, "ownerSlotKind"));
  }
  if (draft.ownerSlot.required !== true) {
    addIssue(issues, "error", "ownerSlot.required", "owner-slot-required", issueText(locale, "ownerSlotRequired"));
  }
  if (draft.ownerSlot.intentionId !== draft.ownerIntention.id) {
    addIssue(issues, "error", "ownerSlot.intentionId", "owner-intention-link", issueText(locale, "ownerIntentionLink"));
  }

  validateSlot(issues, locale, draft.ownerSlot, "ownerSlot", {
    slotIds,
    intentionById
  });

  draft.secondarySlots.forEach((slot, index) => {
    if (slot.kind !== INTENTION_KINDS.secondary) {
      addIssue(issues, "error", `secondarySlots.${index}.kind`, "secondary-slot-kind", issueText(locale, "invalidSlotKind"));
    }

    validateSlot(issues, locale, slot, `secondarySlots.${index}`, {
      slotIds,
      intentionById
    });
  });

  draft.globalPredicates.forEach((predicate, index) => {
    validatePredicate(issues, locale, `globalPredicates.${index}`, predicate, {
      scope: PREDICATE_SCOPES.round,
      slotIds: new Set(),
      currentSlotId: "",
      allowCompareOperators: false
    });
  });

  const slotBuildOrder = computeSlotBuildOrder(slots);
  if (buildSlotDependencies(draft.ownerSlot).size > 0) {
    addIssue(issues, "error", "ownerSlot", "owner-has-dependencies", issueText(locale, "ownerHasDependencies"));
  }
  if (slotBuildOrder.length === 0 && slots.length > 0) {
    addIssue(issues, "error", "slots", "slot-dependency-cycle", issueText(locale, "slotDependencyCycle"));
  } else if (slotBuildOrder.length > 0 && slotBuildOrder[0] !== "owner") {
    addIssue(issues, "error", "slots", "owner-not-first", issueText(locale, "ownerNotFirst"));
  }

  return {
    issues,
    errors: issues.filter(item => item.severity === "error"),
    warnings: issues.filter(item => item.severity === "warning"),
    slotBuildOrder,
    category: getCategory(draft.scenario.category),
    intentionCount: allIntentions.length,
    slotCount: slots.length
  };
}
