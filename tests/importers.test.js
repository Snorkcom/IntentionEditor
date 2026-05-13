import test from "node:test";
import assert from "node:assert/strict";

import { createEmptyDraft, createPredicate, createSecondaryIntention, createSecondarySlot, createTextBinding } from "../js/draft.js";
import { PREDICATE_SCOPES, REVEAL_TYPES, TEXT_BINDING_SOURCES, VISIBILITY_TYPES } from "../js/constants.js";
import { buildExportArtifacts } from "../js/exporters.js";
import { importScenarioPackage } from "../js/importers.js";
import { validateDraft } from "../js/validation.js";

function importFromDraft(draft) {
  const artifacts = buildExportArtifacts(draft);
  return importScenarioPackage({
    scenarioYaml: artifacts.scenario.content,
    intentionsYaml: artifacts.intentions.content,
    ftlText: artifacts.ftl.content,
    locale: "en"
  });
}

test("importer roundtrips exported owner-only draft", () => {
  const draft = createEmptyDraft("en");
  draft.scenario.id = "ScenarioImportRoundtrip";
  draft.scenario.name = "Import roundtrip";
  draft.ownerIntention.id = "IntentionImportOwner";
  draft.ownerSlot.intentionId = draft.ownerIntention.id;
  draft.ownerIntention.name = "Imported owner";
  draft.ownerIntention.description = "Imported description.";

  const result = importFromDraft(draft);

  assert.equal(result.errors.length, 0);
  assert.equal(result.draft.scenario.id, draft.scenario.id);
  assert.equal(result.draft.ownerIntention.name, draft.ownerIntention.name);
  assert.equal(validateDraft(result.draft, "en").errors.length, 0);
});

test("importer maps secondary slot predicates, bindings and hidden timer", () => {
  const draft = createEmptyDraft("en");
  draft.scenario.id = "ScenarioImportComplex";
  draft.ownerIntention.id = "IntentionImportComplexOwner";
  draft.ownerSlot.intentionId = draft.ownerIntention.id;

  const predicate = createPredicate(PREDICATE_SCOPES.round);
  predicate.field = "crewCount";
  predicate.operator = ">=";
  predicate.value = "3";
  draft.globalPredicates = [predicate];

  const intention = createSecondaryIntention("en");
  intention.id = "IntentionImportComplexPartner";
  intention.name = "Partner";
  intention.description = "Partner description.";
  intention.defaultVisibility = VISIBILITY_TYPES.hidden;
  intention.hiddenLabel = "Hidden partner";
  intention.copyableText = "Meet {$partnerName}.";

  const slot = createSecondarySlot(intention.uid);
  slot.slotId = "partner";
  slot.intentionId = intention.id;
  slot.visibilityEnabled = true;
  slot.visibilityType = VISIBILITY_TYPES.hidden;
  slot.revealType = REVEAL_TYPES.timer;
  slot.revealMinutes = 5;

  const candidatePredicate = createPredicate(PREDICATE_SCOPES.candidate);
  candidatePredicate.field = "job";
  candidatePredicate.operator = "equals";
  candidatePredicate.value = "Captain";
  slot.candidatePredicates = [candidatePredicate];

  const binding = createTextBinding();
  binding.parameter = "partnerName";
  binding.source = TEXT_BINDING_SOURCES.slot;
  binding.slotId = "partner";
  binding.field = "characterName";
  slot.textParameterBindings = [binding];

  draft.secondaryIntentions = [intention];
  draft.secondarySlots = [slot];

  const result = importFromDraft(draft);

  assert.equal(result.errors.length, 0);
  assert.equal(result.draft.secondarySlots.length, 1);
  assert.equal(result.draft.secondarySlots[0].revealType, REVEAL_TYPES.timer);
  assert.equal(result.draft.secondarySlots[0].revealMinutes, 5);
  assert.equal(result.draft.secondarySlots[0].candidatePredicates[0].value, "Captain");
  assert.equal(result.draft.secondarySlots[0].textParameterBindings[0].parameter, "partnerName");
  assert.equal(result.draft.secondaryIntentions[0].hiddenLabel, "Hidden partner");
});

test("importer rejects missing FTL key", () => {
  const draft = createEmptyDraft("en");
  const artifacts = buildExportArtifacts(draft);
  const result = importScenarioPackage({
    scenarioYaml: artifacts.scenario.content,
    intentionsYaml: artifacts.intentions.content,
    ftlText: "",
    locale: "en"
  });

  assert.equal(result.draft, null);
  assert.ok(result.errors.some(error => error.area === "FTL"));
});

test("importer preserves blank lines in multiline FTL values", () => {
  const draft = createEmptyDraft("en");
  draft.scenario.id = "ScenarioImportMultiline";
  draft.ownerIntention.id = "IntentionImportMultilineOwner";
  draft.ownerSlot.intentionId = draft.ownerIntention.id;

  const artifacts = buildExportArtifacts(draft);
  const description = [
    "intentions-intention-import-multiline-owner-description = First paragraph.",
    "    ",
    "    Second paragraph.",
    "    ",
    "    - one;",
    "    - two."
  ].join("\n");
  const ftlText = artifacts.ftl.content.replace(
    /intentions-intention-import-multiline-owner-description = .*/,
    description
  );

  const result = importScenarioPackage({
    scenarioYaml: artifacts.scenario.content,
    intentionsYaml: artifacts.intentions.content,
    ftlText,
    locale: "en"
  });

  assert.equal(result.errors.length, 0);
  assert.equal(
    result.draft.ownerIntention.description,
    "First paragraph.\n\nSecond paragraph.\n\n- one;\n- two."
  );
});

test("importer rejects unknown intention reference", () => {
  const draft = createEmptyDraft("en");
  const artifacts = buildExportArtifacts(draft);
  const result = importScenarioPackage({
    scenarioYaml: artifacts.scenario.content.replace(draft.ownerIntention.id, "MissingIntention"),
    intentionsYaml: artifacts.intentions.content,
    ftlText: artifacts.ftl.content,
    locale: "en"
  });

  assert.equal(result.draft, null);
  assert.ok(result.errors.some(error => error.message.includes("MissingIntention")));
});

test("importer rejects missing owner slot", () => {
  const draft = createEmptyDraft("en");
  const artifacts = buildExportArtifacts(draft);
  const result = importScenarioPackage({
    scenarioYaml: artifacts.scenario.content.replace("slotId: owner", "slotId: partner"),
    intentionsYaml: artifacts.intentions.content,
    ftlText: artifacts.ftl.content,
    locale: "en"
  });

  assert.equal(result.draft, null);
  assert.ok(result.errors.some(error => error.message.includes("Owner entry")));
});

test("importer rejects invalid YAML shape", () => {
  const result = importScenarioPackage({
    scenarioYaml: "- type: scenarioTemplate\n    id: Broken",
    intentionsYaml: "- type: intentionTemplate\n  id: IntentionBroken",
    ftlText: "intentions-broken-name = Broken",
    locale: "en"
  });

  assert.equal(result.draft, null);
  assert.ok(result.errors.some(error => error.area === "Scenario YAML"));
});
