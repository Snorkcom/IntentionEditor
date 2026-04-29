import { PREDICATE_OPERATORS, REVEAL_TYPES, TEXT_BINDING_SOURCES, VISIBILITY_TYPES } from "./constants.js";
import { getAllIntentions, getAllSlots } from "./draft.js";
import { fileSafeName, nonEmpty, slugifyIdentifier, splitTagsInput } from "./utils.js";
import { validateDraft } from "./validation.js";

function yamlScalar(value) {
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? `${value}` : "0";
  }

  const text = `${value ?? ""}`;
  if (text.length === 0) {
    return "\"\"";
  }

  if (/^(true|false|null|~)$/i.test(text)) {
    return `"${text}"`;
  }

  if (/^[A-Za-z0-9_.\/:-]+$/.test(text)) {
    return text;
  }

  return `"${text
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")}"`;
}

function yamlInlineList(values) {
  return `[${values.map(item => yamlScalar(item)).join(", ")}]`;
}

function appendLine(lines, indent, text) {
  lines.push(`${"  ".repeat(indent)}${text}`);
}

function intentionLocKeys(intentionId) {
  const slug = slugifyIdentifier(intentionId || "intention");
  return {
    nameLoc: `intentions-${slug}-name`,
    summaryLoc: `intentions-${slug}-summary`,
    descriptionLoc: `intentions-${slug}-description`,
    oocInfoLoc: `intentions-${slug}-ooc-info`,
    copyableTextLoc: `intentions-${slug}-copy`,
    hiddenLabelLoc: `intentions-${slug}-hidden-label`
  };
}

function normalizeIntentionForExport(intention) {
  const tags = splitTagsInput(intention.tagsInput ?? intention.tags ?? []);
  return {
    ...intention,
    tags
  };
}

function serializePredicate(predicate) {
  const normalized = {
    scope: predicate.scope,
    field: predicate.field,
    operator: predicate.operator,
    key: predicate.key ?? "",
    value: predicate.value ?? "",
    values: Array.isArray(predicate.values) ? predicate.values.filter(item => nonEmpty(item)) : [],
    valueFrom: predicate.valueFrom ?? "",
    valueTo: predicate.valueTo ?? "",
    compareTo: predicate.compareTo?.slotId
      ? {
          scope: predicate.compareTo.scope,
          slotId: predicate.compareTo.slotId,
          field: predicate.compareTo.field
        }
      : null
  };

  if (normalized.operator === PREDICATE_OPERATORS.sameAs || normalized.operator === PREDICATE_OPERATORS.notSameAs) {
    normalized.value = "";
    normalized.values = [];
    normalized.valueFrom = "";
    normalized.valueTo = "";
  }

  return normalized;
}

function computeRequiredCrewGroups(draft, slotBuildOrder) {
  const slotById = new Map(getAllSlots(draft).map(slot => [slot.slotId, slot]));
  const requiredGroups = new Map();
  let nextGroupId = 0;

  function createGroup(slotId) {
    const groupId = `group-${nextGroupId}`;
    nextGroupId += 1;
    requiredGroups.set(slotId, groupId);
    return groupId;
  }

  for (const slotId of slotBuildOrder) {
    const slot = slotById.get(slotId);
    if (!slot || slot.required !== true) {
      continue;
    }

    if (slot.slotId === "owner") {
      createGroup(slot.slotId);
      continue;
    }

    if (nonEmpty(slot.bindToSlot)) {
      const targetGroup = requiredGroups.get(slot.bindToSlot);
      if (targetGroup) {
        requiredGroups.set(slot.slotId, targetGroup);
        continue;
      }
    }

    const reusableGroup = slot.allowSameActorAs
      .map(candidateSlotId => requiredGroups.get(candidateSlotId))
      .find(Boolean);

    if (reusableGroup) {
      requiredGroups.set(slot.slotId, reusableGroup);
      continue;
    }

    createGroup(slot.slotId);
  }

  return requiredGroups;
}

function computeMinimumRequiredCrew(draft, slotBuildOrder) {
  const groups = computeRequiredCrewGroups(draft, slotBuildOrder);
  return new Set(groups.values()).size || 1;
}

function authoredCrewPredicateSatisfies(predicate, minimumCrew) {
  if (predicate.field !== "crewCount") {
    return false;
  }

  if (!nonEmpty(predicate.value)) {
    return false;
  }

  const value = Number(predicate.value);
  if (!Number.isInteger(value)) {
    return false;
  }

  if (predicate.operator === PREDICATE_OPERATORS[">="]) {
    return value >= minimumCrew;
  }

  if (predicate.operator === PREDICATE_OPERATORS[">"]) {
    return value + 1 >= minimumCrew;
  }

  return false;
}

function buildSyntheticCrewPredicate(minimumCrew) {
  return {
    scope: "round",
    field: "crewCount",
    operator: PREDICATE_OPERATORS[">="],
    key: "",
    value: `${minimumCrew}`,
    values: [],
    valueFrom: "",
    valueTo: "",
    compareTo: null
  };
}

function appendPredicateYaml(lines, indent, predicate) {
  appendLine(lines, indent, `- scope: ${yamlScalar(predicate.scope)}`);
  appendLine(lines, indent + 1, `field: ${yamlScalar(predicate.field)}`);
  appendLine(lines, indent + 1, `operator: ${yamlScalar(predicate.operator)}`);

  if (nonEmpty(predicate.key)) {
    appendLine(lines, indent + 1, `key: ${yamlScalar(predicate.key)}`);
  }
  if (nonEmpty(predicate.value)) {
    appendLine(lines, indent + 1, `value: ${yamlScalar(predicate.value)}`);
  }
  if (predicate.values.length > 0) {
    appendLine(lines, indent + 1, `values: ${yamlInlineList(predicate.values)}`);
  }
  if (nonEmpty(predicate.valueFrom)) {
    appendLine(lines, indent + 1, `valueFrom: ${yamlScalar(predicate.valueFrom)}`);
  }
  if (nonEmpty(predicate.valueTo)) {
    appendLine(lines, indent + 1, `valueTo: ${yamlScalar(predicate.valueTo)}`);
  }
  if (predicate.compareTo?.slotId) {
    appendLine(lines, indent + 1, "compareTo:");
    appendLine(lines, indent + 2, `scope: ${yamlScalar(predicate.compareTo.scope)}`);
    appendLine(lines, indent + 2, `slotId: ${yamlScalar(predicate.compareTo.slotId)}`);
    appendLine(lines, indent + 2, `field: ${yamlScalar(predicate.compareTo.field)}`);
  }
}

function appendSlotYaml(lines, indent, slot) {
  appendLine(lines, indent, `- slotId: ${yamlScalar(slot.slotId)}`);
  appendLine(lines, indent + 1, `kind: ${yamlScalar(slot.kind)}`);
  appendLine(lines, indent + 1, `intentionId: ${yamlScalar(slot.intentionId)}`);
  appendLine(lines, indent + 1, `required: ${yamlScalar(Boolean(slot.required))}`);

  if (slot.candidatePredicates.length > 0) {
    appendLine(lines, indent + 1, "candidatePredicates:");
    slot.candidatePredicates.forEach(predicate => appendPredicateYaml(lines, indent + 2, serializePredicate(predicate)));
  }

  if (nonEmpty(slot.bindToSlot)) {
    appendLine(lines, indent + 1, `bindToSlot: ${yamlScalar(slot.bindToSlot)}`);
  }

  if (slot.allowSameActorAs.length > 0) {
    appendLine(lines, indent + 1, `allowSameActorAs: ${yamlInlineList(slot.allowSameActorAs)}`);
  }

  if (slot.textParameterBindings.length > 0) {
    appendLine(lines, indent + 1, "textParameterBindings:");
    slot.textParameterBindings.forEach(binding => {
      appendLine(lines, indent + 2, `${binding.parameter}:`);
      appendLine(lines, indent + 3, `source: ${yamlScalar(binding.source)}`);
      if (binding.source === TEXT_BINDING_SOURCES.slot && nonEmpty(binding.slotId)) {
        appendLine(lines, indent + 3, `slotId: ${yamlScalar(binding.slotId)}`);
      }
      if (binding.source === TEXT_BINDING_SOURCES.literal && nonEmpty(binding.value)) {
        appendLine(lines, indent + 3, `value: ${yamlScalar(binding.value)}`);
      } else if (binding.source !== TEXT_BINDING_SOURCES.literal && nonEmpty(binding.field)) {
        appendLine(lines, indent + 3, `field: ${yamlScalar(binding.field)}`);
      }
    });
  }

  if (slot.visibilityEnabled) {
    appendLine(lines, indent + 1, "visibilityOverride:");
    appendLine(lines, indent + 2, `type: ${yamlScalar(slot.visibilityType)}`);
    if (slot.visibilityType === VISIBILITY_TYPES.hidden) {
      appendLine(lines, indent + 2, "reveal:");
      appendLine(lines, indent + 3, `type: ${yamlScalar(slot.revealType)}`);
      if (slot.revealType === REVEAL_TYPES.timer) {
        appendLine(lines, indent + 3, `minutes: ${yamlScalar(Number(slot.revealMinutes) || 1)}`);
      }
    }
  }
}

function buildScenarioYaml(draft, exportMeta) {
  const lines = [];
  appendLine(lines, 0, "- type: scenarioTemplate");
  appendLine(lines, 1, `id: ${yamlScalar(draft.scenario.id)}`);
  appendLine(lines, 1, `name: ${yamlScalar(draft.scenario.name)}`);
  appendLine(lines, 1, `category: ${yamlScalar(draft.scenario.category)}`);
  appendLine(lines, 1, `enabled: ${yamlScalar(Boolean(draft.scenario.enabled))}`);
  appendLine(lines, 1, `weight: ${yamlScalar(Number(draft.scenario.weight) || 1)}`);

  const predicates = draft.globalPredicates.map(serializePredicate);
  if (exportMeta.syntheticCrewPredicateAdded) {
    predicates.push(buildSyntheticCrewPredicate(exportMeta.derivedCrewCount));
  }

  if (predicates.length > 0) {
    appendLine(lines, 1, "globalPredicates:");
    predicates.forEach(predicate => appendPredicateYaml(lines, 2, predicate));
  }

  appendLine(lines, 1, "entries:");
  getAllSlots(draft).forEach(slot => appendSlotYaml(lines, 2, slot));
  return `${lines.join("\n")}\n`;
}

function buildIntentionYaml(draft) {
  const lines = [];

  getAllIntentions(draft).map(normalizeIntentionForExport).forEach((intention, index) => {
    if (index > 0) {
      lines.push("");
    }

    const locKeys = intentionLocKeys(intention.id);
    appendLine(lines, 0, "- type: intentionTemplate");
    appendLine(lines, 1, `id: ${yamlScalar(intention.id)}`);
    appendLine(lines, 1, `kind: ${yamlScalar(intention.kind)}`);
    appendLine(lines, 1, `nameLoc: ${yamlScalar(locKeys.nameLoc)}`);
    if (nonEmpty(intention.summary)) {
      appendLine(lines, 1, `summaryLoc: ${yamlScalar(locKeys.summaryLoc)}`);
    }
    appendLine(lines, 1, `descriptionLoc: ${yamlScalar(locKeys.descriptionLoc)}`);
    if (nonEmpty(intention.oocInfo)) {
      appendLine(lines, 1, `oocInfoLoc: ${yamlScalar(locKeys.oocInfoLoc)}`);
    }
    if (nonEmpty(intention.copyableText)) {
      appendLine(lines, 1, `copyableTextLoc: ${yamlScalar(locKeys.copyableTextLoc)}`);
    }
    appendLine(lines, 1, `defaultVisibility: ${yamlScalar(intention.defaultVisibility)}`);
    if (nonEmpty(intention.hiddenLabel)) {
      appendLine(lines, 1, `hiddenLabelLoc: ${yamlScalar(locKeys.hiddenLabelLoc)}`);
    }
    if (intention.iconEnabled && nonEmpty(intention.iconSprite) && nonEmpty(intention.iconState)) {
      appendLine(lines, 1, "icon:");
      appendLine(lines, 2, `sprite: ${yamlScalar(intention.iconSprite)}`);
      appendLine(lines, 2, `state: ${yamlScalar(intention.iconState)}`);
    }
    if (nonEmpty(intention.color)) {
      appendLine(lines, 1, `color: ${yamlScalar(intention.color)}`);
    }
    if (intention.tags.length > 0) {
      appendLine(lines, 1, `tags: ${yamlInlineList(intention.tags)}`);
    }
    if (nonEmpty(intention.author)) {
      appendLine(lines, 1, `author: ${yamlScalar(intention.author)}`);
    }
    if (nonEmpty(intention.creationDate)) {
      appendLine(lines, 1, `creationDate: ${yamlScalar(intention.creationDate)}`);
    }
  });

  return `${lines.join("\n")}\n`;
}

function appendFtlEntry(lines, key, value) {
  const text = `${value ?? ""}`;
  const parts = text.split(/\r?\n/);
  if (parts.length === 0) {
    lines.push(`${key} =`);
    return;
  }

  lines.push(`${key} = ${parts[0]}`);
  for (let index = 1; index < parts.length; index += 1) {
    lines.push(`    ${parts[index]}`);
  }
}

function buildFtl(draft) {
  const lines = [];

  getAllIntentions(draft).map(normalizeIntentionForExport).forEach((intention, index) => {
    if (index > 0) {
      lines.push("");
    }

    const locKeys = intentionLocKeys(intention.id);
    appendFtlEntry(lines, locKeys.nameLoc, intention.name);
    if (nonEmpty(intention.summary)) {
      appendFtlEntry(lines, locKeys.summaryLoc, intention.summary);
    }
    appendFtlEntry(lines, locKeys.descriptionLoc, intention.description);
    if (nonEmpty(intention.oocInfo)) {
      appendFtlEntry(lines, locKeys.oocInfoLoc, intention.oocInfo);
    }
    if (nonEmpty(intention.copyableText)) {
      appendFtlEntry(lines, locKeys.copyableTextLoc, intention.copyableText);
    }
    if (nonEmpty(intention.hiddenLabel)) {
      appendFtlEntry(lines, locKeys.hiddenLabelLoc, intention.hiddenLabel);
    }
  });

  return `${lines.join("\n")}\n`;
}

function buildExportMeta(draft) {
  const validation = validateDraft(draft);
  const slotBuildOrder = validation.slotBuildOrder.length > 0
    ? validation.slotBuildOrder
    : getAllSlots(draft).map(slot => slot.slotId);
  const derivedCrewCount = computeMinimumRequiredCrew(draft, slotBuildOrder);
  const authoredCrewPredicate = draft.globalPredicates
    .map(serializePredicate)
    .find(predicate => authoredCrewPredicateSatisfies(predicate, derivedCrewCount));

  return {
    slotBuildOrder,
    derivedCrewCount,
    syntheticCrewPredicateAdded: !authoredCrewPredicate,
    authoredCrewPredicate
  };
}

export function buildExportArtifacts(draft) {
  const fileStem = fileSafeName(draft.scenario.id);
  const meta = buildExportMeta(draft);

  return {
    scenario: {
      filename: `scenario_templates.${fileStem}.yml`,
      content: buildScenarioYaml(draft, meta)
    },
    intentions: {
      filename: `intention_templates.${fileStem}.yml`,
      content: buildIntentionYaml(draft)
    },
    ftl: {
      filename: `intentions.${fileStem}.ftl`,
      content: buildFtl(draft)
    },
    meta
  };
}

export function getLocKeysForIntentions(draft) {
  return getAllIntentions(draft).map(intention => ({
    intentionId: intention.id,
    ...intentionLocKeys(intention.id)
  }));
}

export function getDerivedExportMeta(draft) {
  return buildExportMeta(draft);
}
