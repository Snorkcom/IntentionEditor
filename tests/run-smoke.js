import assert from "node:assert/strict";

import { CATEGORY_CATALOG, getDictionaryLabel } from "../js/catalogs.js";
import { PREDICATE_SCOPES, REVEAL_TYPES, TEXT_BINDING_SOURCES, VISIBILITY_TYPES } from "../js/constants.js";
import { createEmptyDraft, createPredicate, createSecondaryIntention, createSecondarySlot, createTextBinding } from "../js/draft.js";
import { buildExportArtifacts, getLocKeysForIntentions } from "../js/exporters.js";
import { validateDraft } from "../js/validation.js";

const results = [];

function run(name, callback) {
  try {
    callback();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, error });
  }
}

run("base draft passes", () => {
  const result = validateDraft(createEmptyDraft());
  assert.equal(result.errors.length, 0);
  assert.deepEqual(result.slotBuildOrder, ["owner"]);
});

run("category catalog matches requirements set", () => {
  assert.deepEqual(
    CATEGORY_CATALOG.map(item => item.id),
    ["personal", "social", "professional", "conflict", "criminal", "sabotage", "antag", "events", "admin"]
  );
});

run("candidate dictionary labels expose translated values", () => {
  const captain = getDictionaryLabel("jobs", "Captain");
  assert.deepEqual(captain, {
    ru: "Captain · Капитан",
    en: "Captain"
  });

  const engineering = getDictionaryLabel("departments", "Engineering");
  assert.deepEqual(engineering, {
    ru: "Engineering · Инженерный",
    en: "Engineering"
  });

  const objective = getDictionaryLabel("objectiveTypes", "KillRandomPersonObjective");
  assert.deepEqual(objective, {
    ru: "KillRandomPersonObjective · Устранить случайного персонажа",
    en: "Kill random person objective"
  });
});

run("round dictionaries expose localized labels", () => {
  const gameMode = getDictionaryLabel("gameModes", "Nukeops");
  assert.deepEqual(gameMode, {
    ru: "Nukeops · Ядерные оперативники",
    en: "Nuclear Operatives"
  });

  const eventTag = getDictionaryLabel("eventTags", "Halloween");
  assert.deepEqual(eventTag, {
    ru: "Halloween · Хэллоуин",
    en: "Halloween"
  });
});

run("bindToSlot and allowSameActorAs conflict", () => {
  const draft = createEmptyDraft();
  const secondary = createSecondaryIntention();
  secondary.id = "IntentionPartner";
  secondary.name = "Партнёр";
  secondary.description = "Вторая роль.";
  draft.secondaryIntentions.push(secondary);
  const slot = createSecondarySlot();
  slot.slotId = "partner";
  slot.intentionId = secondary.id;
  slot.bindToSlot = "owner";
  slot.allowSameActorAs = ["owner"];
  draft.secondarySlots.push(slot);
  const result = validateDraft(draft);
  assert.ok(result.errors.some(item => item.code === "bind-and-allow-same-actor"));
});

run("slotBuildOrder respects dependency chain", () => {
  const draft = createEmptyDraft();
  const partnerIntention = createSecondaryIntention();
  partnerIntention.id = "IntentionPartner";
  partnerIntention.name = "Партнёр";
  partnerIntention.description = "Вторая роль.";
  const witnessIntention = createSecondaryIntention();
  witnessIntention.id = "IntentionWitness";
  witnessIntention.name = "Свидетель";
  witnessIntention.description = "Третья роль.";
  draft.secondaryIntentions.push(partnerIntention, witnessIntention);

  const partner = createSecondarySlot();
  partner.slotId = "partner";
  partner.intentionId = partnerIntention.id;
  const witness = createSecondarySlot();
  witness.slotId = "witness";
  witness.intentionId = witnessIntention.id;
  witness.allowSameActorAs = ["partner"];
  draft.secondarySlots.push(partner, witness);

  const result = validateDraft(draft);
  assert.equal(result.errors.length, 0);
  assert.deepEqual(result.slotBuildOrder, ["owner", "partner", "witness"]);
});

run("round text binding validates allowed fields", () => {
  const draft = createEmptyDraft();
  const binding = createTextBinding();
  binding.parameter = "station";
  binding.source = TEXT_BINDING_SOURCES.round;
  binding.field = "wrongField";
  draft.ownerSlot.textParameterBindings.push(binding);
  const result = validateDraft(draft);
  assert.ok(result.errors.some(item => item.code === "invalid-round-binding"));
});

run("export serializes reveal config and loc keys", () => {
  const draft = createEmptyDraft();
  draft.scenario.id = "ScenarioCardDebt";
  const secondary = createSecondaryIntention();
  secondary.id = "IntentionDebtReminder";
  secondary.name = "Старый долг";
  secondary.summary = "Пора решить, как поступить.";
  secondary.description = "Напоминание о долге.";
  secondary.defaultVisibility = VISIBILITY_TYPES.hidden;
  secondary.hiddenLabel = "Скрытое намерение";
  draft.secondaryIntentions.push(secondary);
  const slot = createSecondarySlot();
  slot.slotId = "debtorReminder";
  slot.intentionId = secondary.id;
  slot.bindToSlot = "owner";
  slot.visibilityEnabled = true;
  slot.visibilityType = VISIBILITY_TYPES.hidden;
  slot.revealType = REVEAL_TYPES.timer;
  slot.revealMinutes = 20;
  draft.secondarySlots.push(slot);

  const artifacts = buildExportArtifacts(draft);
  const locKeys = getLocKeysForIntentions(draft);
  assert.match(artifacts.scenario.content, /minutes: 20/);
  assert.match(artifacts.intentions.content, /hiddenLabelLoc:/);
  assert.equal(locKeys[1].hiddenLabelLoc, "intentions-intention-debt-reminder-hidden-label");
});

run("global predicate export keeps round operators", () => {
  const draft = createEmptyDraft();
  const predicate = createPredicate(PREDICATE_SCOPES.round);
  predicate.field = "gameMode";
  predicate.operator = "notIn";
  predicate.values = ["nuclear", "zombie"];
  draft.globalPredicates.push(predicate);
  const artifacts = buildExportArtifacts(draft);
  assert.match(artifacts.scenario.content, /operator: notIn/);
  assert.match(artifacts.scenario.content, /values: \[nuclear, zombie\]/);
});

run("derived crew count reuses allowSameActorAs and skips duplicate predicate", () => {
  const draft = createEmptyDraft();

  const partner = createSecondaryIntention();
  partner.id = "IntentionPartner";
  partner.name = "Partner";
  partner.description = "Partner slot.";

  const witness = createSecondaryIntention();
  witness.id = "IntentionWitness";
  witness.name = "Witness";
  witness.description = "Witness slot.";

  draft.secondaryIntentions.push(partner, witness);

  const partnerSlot = createSecondarySlot();
  partnerSlot.slotId = "partner";
  partnerSlot.intentionId = partner.id;

  const witnessSlot = createSecondarySlot();
  witnessSlot.slotId = "witness";
  witnessSlot.intentionId = witness.id;
  witnessSlot.allowSameActorAs = ["partner"];

  draft.secondarySlots.push(partnerSlot, witnessSlot);

  const authored = createPredicate(PREDICATE_SCOPES.round);
  authored.field = "crewCount";
  authored.operator = ">=";
  authored.value = "2";
  draft.globalPredicates.push(authored);

  const artifacts = buildExportArtifacts(draft);
  assert.equal(artifacts.meta.derivedCrewCount, 2);
  assert.equal(artifacts.meta.syntheticCrewPredicateAdded, false);
});

run("tags keep trailing comma during editing but export trims it", () => {
  const draft = createEmptyDraft();
  draft.ownerIntention.tagsInput = "starter, social, ";
  const artifacts = buildExportArtifacts(draft);
  assert.match(artifacts.intentions.content, /tags: \[starter, social\]/);
});

const failed = results.filter(item => !item.ok);
for (const result of results) {
  if (result.ok) {
    console.log(`PASS ${result.name}`);
  } else {
    console.error(`FAIL ${result.name}`);
    console.error(result.error);
  }
}

if (failed.length > 0) {
  process.exitCode = 1;
}
