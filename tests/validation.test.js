import test from "node:test";
import assert from "node:assert/strict";

import { CATEGORY_CATALOG } from "../js/catalogs.js";
import { createEmptyDraft, createPredicate, createSecondaryIntention, createSecondarySlot, createTextBinding } from "../js/draft.js";
import { PREDICATE_SCOPES, REVEAL_TYPES, TEXT_BINDING_SOURCES, VISIBILITY_TYPES } from "../js/constants.js";
import { validateDraft } from "../js/validation.js";

test("base draft passes without validation errors", () => {
  const draft = createEmptyDraft();
  const result = validateDraft(draft);

  assert.equal(result.errors.length, 0);
  assert.deepEqual(result.slotBuildOrder, ["owner"]);
});

test("category catalog exposes the requirements categories", () => {
  assert.deepEqual(
    CATEGORY_CATALOG.map(item => item.id),
    ["personal", "social", "professional", "conflict", "criminal", "sabotage", "antag", "events", "admin"]
  );
});

test("bindToSlot and allowSameActorAs cannot be combined", () => {
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

test("bound slot cannot keep candidate predicates", () => {
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
  slot.candidatePredicates.push(createPredicate(PREDICATE_SCOPES.candidate));
  draft.secondarySlots.push(slot);

  const result = validateDraft(draft);
  assert.ok(result.errors.some(item => item.code === "bound-slot-has-predicates"));
});

test("slot build order follows dependencies", () => {
  const draft = createEmptyDraft();

  const a = createSecondaryIntention();
  a.id = "IntentionPartner";
  a.name = "Партнёр";
  a.description = "Вторая роль.";
  const b = createSecondaryIntention();
  b.id = "IntentionWitness";
  b.name = "Свидетель";
  b.description = "Третья роль.";
  draft.secondaryIntentions.push(a, b);

  const partner = createSecondarySlot();
  partner.slotId = "partner";
  partner.intentionId = a.id;

  const witness = createSecondarySlot();
  witness.slotId = "witness";
  witness.intentionId = b.id;
  witness.allowSameActorAs = ["partner"];

  draft.secondarySlots.push(partner, witness);

  const result = validateDraft(draft);
  assert.equal(result.errors.length, 0);
  assert.deepEqual(result.slotBuildOrder, ["owner", "partner", "witness"]);
});

test("visibility timer requires positive minutes", () => {
  const draft = createEmptyDraft();
  const secondary = createSecondaryIntention();
  secondary.id = "IntentionReminder";
  secondary.name = "Напоминание";
  secondary.description = "Скрытая роль.";
  secondary.defaultVisibility = VISIBILITY_TYPES.hidden;
  secondary.hiddenLabel = "Скрыто";
  draft.secondaryIntentions.push(secondary);

  const slot = createSecondarySlot();
  slot.slotId = "reminder";
  slot.intentionId = secondary.id;
  slot.visibilityEnabled = true;
  slot.visibilityType = VISIBILITY_TYPES.hidden;
  slot.revealType = REVEAL_TYPES.timer;
  slot.revealMinutes = 0;
  draft.secondarySlots.push(slot);

  const result = validateDraft(draft);
  assert.ok(result.errors.some(item => item.code === "invalid-reveal-minutes"));
});

test("text bindings validate round fields interactively", () => {
  const draft = createEmptyDraft();
  const binding = createTextBinding();
  binding.parameter = "station";
  binding.source = TEXT_BINDING_SOURCES.round;
  binding.field = "wrongField";
  draft.ownerSlot.textParameterBindings.push(binding);

  const result = validateDraft(draft);
  assert.ok(result.errors.some(item => item.code === "invalid-round-binding"));
});
