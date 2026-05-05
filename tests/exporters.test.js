import test from "node:test";
import assert from "node:assert/strict";

import { createEmptyDraft, createPredicate, createSecondaryIntention, createSecondarySlot, createTextBinding } from "../js/draft.js";
import { PREDICATE_SCOPES, REVEAL_TYPES, TEXT_BINDING_SOURCES, VISIBILITY_TYPES } from "../js/constants.js";
import { buildExportArtifacts, getLocKeysForIntentions } from "../js/exporters.js";

test("export generates three files with predictable names", () => {
  const draft = createEmptyDraft();
  draft.scenario.id = "ScenarioCardDebt";

  const artifacts = buildExportArtifacts(draft);
  assert.equal(artifacts.scenario.filename, "scenario_templates.scenario-card-debt.yml");
  assert.equal(artifacts.intentions.filename, "intention_templates.scenario-card-debt.yml");
  assert.equal(artifacts.ftl.filename, "intentions.scenario-card-debt.ftl");
});

test("export serializes slots, bindings and reveal config", () => {
  const draft = createEmptyDraft();
  draft.scenario.id = "ScenarioCardDebt";
  draft.scenario.name = "Карточный долг";

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
  const binding = createTextBinding();
  binding.parameter = "stationName";
  binding.source = TEXT_BINDING_SOURCES.round;
  binding.field = "stationName";
  slot.textParameterBindings.push(binding);
  draft.secondarySlots.push(slot);

  const artifacts = buildExportArtifacts(draft);
  assert.match(artifacts.scenario.content, /bindToSlot: owner/);
  assert.match(artifacts.scenario.content, /visibilityOverride:/);
  assert.match(artifacts.scenario.content, /minutes: 20/);
  assert.match(artifacts.scenario.content, /stationName:/);
  assert.match(artifacts.intentions.content, /hiddenLabelLoc:/);
  assert.match(artifacts.ftl.content, /intentions-intention-debt-reminder-hidden-label = Скрытое намерение/);
});

test("generated loc keys follow deterministic slug format", () => {
  const draft = createEmptyDraft();
  draft.ownerIntention.id = "IntentionCardDebtCollector";
  draft.ownerSlot.intentionId = draft.ownerIntention.id;
  const keys = getLocKeysForIntentions(draft);

  assert.equal(keys[0].nameLoc, "intentions-intention-card-debt-collector-name");
  assert.equal(keys[0].descriptionLoc, "intentions-intention-card-debt-collector-description");
});

test("global predicate export keeps operator and values", () => {
  const draft = createEmptyDraft();
  const predicate = createPredicate(PREDICATE_SCOPES.round);
  predicate.field = "gameMode";
  predicate.operator = "notIn";
  predicate.value = "";
  predicate.values = ["nuclear", "zombie"];
  draft.globalPredicates.push(predicate);

  const artifacts = buildExportArtifacts(draft);
  assert.match(artifacts.scenario.content, /field: gameMode/);
  assert.match(artifacts.scenario.content, /operator: notIn/);
  assert.match(artifacts.scenario.content, /values: \[nuclear, zombie\]/);
});

test("derived crew count reuses required slots with allowSameActorAs", () => {
  const draft = createEmptyDraft();

  const partner = createSecondaryIntention();
  partner.id = "IntentionPartner";
  partner.name = "Partner";
  partner.description = "Partner slot.";
  draft.secondaryIntentions.push(partner);

  const witness = createSecondaryIntention();
  witness.id = "IntentionWitness";
  witness.name = "Witness";
  witness.description = "Witness slot.";
  draft.secondaryIntentions.push(witness);

  const partnerSlot = createSecondarySlot();
  partnerSlot.slotId = "partner";
  partnerSlot.intentionId = partner.id;

  const witnessSlot = createSecondarySlot();
  witnessSlot.slotId = "witness";
  witnessSlot.intentionId = witness.id;
  witnessSlot.allowSameActorAs = ["partner"];

  draft.secondarySlots.push(partnerSlot, witnessSlot);

  const artifacts = buildExportArtifacts(draft);
  assert.equal(artifacts.meta.derivedCrewCount, 2);
  assert.match(artifacts.scenario.content, /field: crewCount/);
  assert.match(artifacts.scenario.content, /value: 2/);
});

test("existing strict crewCount predicate suppresses synthetic one", () => {
  const draft = createEmptyDraft();
  const predicate = createPredicate(PREDICATE_SCOPES.round);
  predicate.field = "crewCount";
  predicate.operator = ">=";
  predicate.value = "1";
  draft.globalPredicates.push(predicate);

  const artifacts = buildExportArtifacts(draft);
  assert.equal(artifacts.meta.syntheticCrewPredicateAdded, false);
  assert.equal((artifacts.scenario.content.match(/field: crewCount/g) ?? []).length, 1);
});

test("trailing comma in tags is removed only in export", () => {
  const draft = createEmptyDraft();
  draft.ownerIntention.tagsInput = "starter, social, ";
  const artifacts = buildExportArtifacts(draft);

  assert.equal(draft.ownerIntention.tagsInput, "starter, social, ");
  assert.match(artifacts.intentions.content, /tags: \[starter, social\]/);
});
