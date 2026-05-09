import {
  INTENTION_KINDS,
  REVEAL_TYPES,
  TEXT_BINDING_SOURCES,
  VISIBILITY_TYPES
} from "./constants.js";
import { deepClone, ensureTagsBuffer, nextUid, todayIsoDate } from "./utils.js";

function localizedSeed(locale) {
  if (locale === "en") {
    return {
      scenarioName: "New scenario",
      ownerName: "Primary intention",
      ownerDescription: "Briefly describe the scene or initiative launched by the scenario owner.",
      oocInfo: "This is a roleplay prompt, not a mandatory objective."
    };
  }

  return {
    scenarioName: "Новый сценарий",
    ownerName: "Основное намерение",
    ownerDescription: "Опишите сцену, ситуацию или инициативу, вокруг которой строится сценарий.",
    oocInfo: "Это ролевой ориентир для отыгрыша, а не обязательная задача. Другие игроки не обязаны вам подыгрывать. Соблюдайте правила сервера."
  };
}

export function createPredicate(scope) {
  return {
    uid: nextUid("predicate"),
    scope,
    field: scope === "round" ? "crewCount" : "job",
    operator: "equals",
    value: "",
    values: [],
    valueFrom: "",
    valueTo: "",
    key: "",
    compareTo: null
  };
}

export function createTextBinding() {
  return {
    uid: nextUid("binding"),
    parameter: "",
    source: TEXT_BINDING_SOURCES.self,
    slotId: "",
    field: "characterName",
    value: ""
  };
}

export function createOwnerIntention(locale = "ru") {
  const seed = localizedSeed(locale);
  return ensureTagsBuffer({
    uid: nextUid("intention"),
    id: "IntentionNewOwner",
    kind: INTENTION_KINDS.primary,
    name: seed.ownerName,
    summary: "",
    description: seed.ownerDescription,
    oocInfo: seed.oocInfo,
    copyableText: "",
    defaultVisibility: VISIBILITY_TYPES.visible,
    hiddenLabel: "",
    tags: ["starter"],
    tagsInput: "",
    iconEnabled: false,
    iconSprite: "",
    iconState: "",
    color: "",
    author: "",
    creationDate: todayIsoDate()
  });
}

export function createSecondaryIntention(locale = "ru") {
  const seed = localizedSeed(locale);
  return ensureTagsBuffer({
    uid: nextUid("intention"),
    id: "IntentionNewSecondary",
    kind: INTENTION_KINDS.secondary,
    name: "",
    summary: "",
    description: "",
    oocInfo: seed.oocInfo,
    copyableText: "",
    defaultVisibility: VISIBILITY_TYPES.visible,
    hiddenLabel: "",
    tags: [],
    tagsInput: "",
    iconEnabled: false,
    iconSprite: "",
    iconState: "",
    color: "",
    author: "",
    creationDate: todayIsoDate()
  });
}

export function createOwnerSlot() {
  return {
    uid: nextUid("slot"),
    slotId: "owner",
    kind: INTENTION_KINDS.primary,
    intentionId: "IntentionNewOwner",
    required: true,
    candidatePredicates: [],
    bindToSlot: "",
    allowSameActorAs: [],
    textParameterBindings: [],
    visibilityEnabled: false,
    visibilityType: VISIBILITY_TYPES.visible,
    revealType: REVEAL_TYPES.none,
    revealMinutes: 15
  };
}

export function createSecondarySlot(linkedIntentionUid = "") {
  return {
    uid: nextUid("slot"),
    slotId: "",
    kind: INTENTION_KINDS.secondary,
    intentionId: "",
    linkedIntentionUid,
    required: true,
    candidatePredicates: [],
    bindToSlot: "",
    allowSameActorAs: [],
    textParameterBindings: [],
    visibilityEnabled: false,
    visibilityType: VISIBILITY_TYPES.hidden,
    revealType: REVEAL_TYPES.none,
    revealMinutes: 15
  };
}

export function createEmptyDraft(locale = "ru") {
  const seed = localizedSeed(locale);
  const ownerIntention = createOwnerIntention(locale);
  const ownerSlot = createOwnerSlot();
  ownerSlot.intentionId = ownerIntention.id;

  return {
    scenario: {
      id: "ScenarioNew",
      name: seed.scenarioName,
      category: "social",
      enabled: true,
      weight: 1
    },
    ownerIntention,
    secondaryIntentions: [],
    ownerSlot,
    secondarySlots: [],
    globalPredicates: [],
    lastUpdatedAt: new Date().toISOString()
  };
}

export function normalizeDraft(rawDraft, locale = "ru") {
  const base = createEmptyDraft(locale);
  if (!rawDraft || typeof rawDraft !== "object") {
    return base;
  }

  const draft = deepClone(base);
  draft.scenario = { ...draft.scenario, ...(rawDraft.scenario ?? {}) };
  draft.ownerIntention = ensureTagsBuffer({
    ...draft.ownerIntention,
    ...(rawDraft.ownerIntention ?? {}),
    kind: INTENTION_KINDS.primary
  });
  draft.ownerSlot = { ...draft.ownerSlot, ...(rawDraft.ownerSlot ?? {}) };
  draft.ownerSlot.slotId = "owner";
  draft.ownerSlot.kind = INTENTION_KINDS.primary;
  draft.ownerSlot.required = true;
  draft.ownerSlot.intentionId = draft.ownerIntention.id;
  draft.ownerSlot.candidatePredicates = (rawDraft.ownerSlot?.candidatePredicates ?? []).map(predicate => ({
    ...createPredicate("candidate"),
    ...predicate,
    uid: predicate.uid ?? nextUid("predicate"),
    scope: "candidate"
  }));
  draft.ownerSlot.textParameterBindings = (rawDraft.ownerSlot?.textParameterBindings ?? []).map(binding => ({
    ...createTextBinding(),
    ...binding,
    uid: binding.uid ?? nextUid("binding")
  }));

  draft.secondaryIntentions = (rawDraft.secondaryIntentions ?? []).map(intention => ensureTagsBuffer({
    ...createSecondaryIntention(locale),
    ...intention,
    uid: intention.uid ?? nextUid("intention"),
    kind: INTENTION_KINDS.secondary
  }));

  const linkedIntentionUids = new Set();
  draft.secondarySlots = (rawDraft.secondarySlots ?? []).map(slot => ({
    ...createSecondarySlot(),
    ...slot,
    uid: slot.uid ?? nextUid("slot"),
    kind: INTENTION_KINDS.secondary,
    candidatePredicates: (slot.candidatePredicates ?? []).map(predicate => ({
      ...createPredicate("candidate"),
      ...predicate,
      uid: predicate.uid ?? nextUid("predicate"),
      scope: "candidate"
    })),
    textParameterBindings: (slot.textParameterBindings ?? []).map(binding => ({
      ...createTextBinding(),
      ...binding,
      uid: binding.uid ?? nextUid("binding")
    }))
  })).map(slot => {
    let linked = draft.secondaryIntentions.find(intention => intention.uid === slot.linkedIntentionUid) ?? null;
    if (!linked && slot.intentionId) {
      linked = draft.secondaryIntentions.find(intention => intention.id === slot.intentionId) ?? null;
    }
    if (!linked) {
      linked = draft.secondaryIntentions.find(intention => !linkedIntentionUids.has(intention.uid)) ?? null;
    }
    if (linked) {
      slot.linkedIntentionUid = linked.uid;
      slot.intentionId = linked.id;
      linkedIntentionUids.add(linked.uid);
    }
    return slot;
  });

  draft.globalPredicates = (rawDraft.globalPredicates ?? []).map(predicate => ({
    ...createPredicate("round"),
    ...predicate,
    uid: predicate.uid ?? nextUid("predicate"),
    scope: "round"
  }));

  draft.lastUpdatedAt = rawDraft.lastUpdatedAt ?? draft.lastUpdatedAt;
  return draft;
}

export function getAllSlots(draft) {
  return [draft.ownerSlot, ...draft.secondarySlots];
}

export function getAllIntentions(draft) {
  return [draft.ownerIntention, ...draft.secondaryIntentions];
}
