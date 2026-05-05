import {
  OPERATORS_BY_FIELD_TYPE,
  PREDICATE_OPERATORS,
  PREDICATE_SCOPES
} from "./constants.js";
import {
  buildDictionaryLabel,
  CATEGORY_CATALOG,
  LOCALIZED_DICTIONARY_LABELS,
  VALUE_DICTIONARIES
} from "./data/catalog-data.js";
export { CATEGORY_CATALOG, VALUE_DICTIONARIES } from "./data/catalog-data.js";

export const TEXT_BINDING_FIELDS = [
  { id: "characterName", label: { ru: "Имя персонажа", en: "Character name" } },
  { id: "job", label: { ru: "Профессия", en: "Job" } },
  { id: "department", label: { ru: "Отдел", en: "Department" } },
  { id: "age", label: { ru: "Возраст", en: "Age" } },
  { id: "species", label: { ru: "Вид", en: "Species" } },
  { id: "sex", label: { ru: "Пол", en: "Sex" } },
  { id: "traits", label: { ru: "Черты", en: "Traits" } },
  { id: "hasMindshield", label: { ru: "Есть mindshield", en: "Has mindshield" } },
  { id: "antagRole", label: { ru: "Роли антагониста", en: "Antag roles" } },
  { id: "antagObjectiveType", label: { ru: "Типы целей антагониста", en: "Antag objective types" } },
  { id: "mindId", label: { ru: "MindId", en: "MindId" } },
  { id: "ownerEntityUid", label: { ru: "Owner entity uid", en: "Owner entity uid" } }
];

export const ROUND_TEXT_BINDING_FIELDS = [
  { id: "stationName", label: { ru: "Имя станции", en: "Station name" } },
  { id: "stationTime", label: { ru: "Время станции", en: "Station time" } }
];

export const FIELD_DEFINITIONS = {
  round: {
    gameMode: {
      type: "string",
      dictionary: "gameModes",
      label: { ru: "Режим игры", en: "Game mode" }
    },
    stationTime: {
      type: "timespan",
      label: { ru: "Время станции", en: "Station time" }
    },
    crewCount: {
      type: "int",
      min: 0,
      label: { ru: "Число членов экипажа", en: "Crew count" }
    },
    securityCount: {
      type: "int",
      min: 0,
      label: { ru: "Число сотрудников СБ", en: "Security count" }
    },
    eventTags: {
      type: "list-string",
      dictionary: "eventTags",
      label: { ru: "Теги событий", en: "Event tags" }
    },
    "antagSummary.totalCount": {
      type: "int",
      min: 0,
      label: { ru: "Всего антагонистов", en: "Antag total count" }
    },
    "antagSummary.gameModeAntagCount": {
      type: "int",
      min: 0,
      label: { ru: "Антагонисты режима", en: "Game-mode antag count" }
    },
    "antagSummary.ghostRoleAntagCount": {
      type: "int",
      min: 0,
      label: { ru: "Ghost-role антагонисты", en: "Ghost-role antag count" }
    },
    "antagSummary.byRole": {
      type: "map-int",
      min: 0,
      dictionary: "antagRoles",
      keyLabel: { ru: "ID antag role", en: "Antag role id" },
      label: { ru: "Антагонисты по ролям", en: "Antag count by role" }
    },
    "antagSummary.byObjectiveType": {
      type: "map-int",
      min: 0,
      dictionary: "objectiveTypes",
      keyLabel: { ru: "ID objective type", en: "Objective type id" },
      label: { ru: "Антагонисты по типам целей", en: "Antag count by objective type" }
    }
  },
  candidate: {
    job: {
      type: "string",
      dictionary: "jobs",
      label: { ru: "Профессия", en: "Job" }
    },
    department: {
      type: "string",
      dictionary: "departments",
      label: { ru: "Отдел", en: "Department" }
    },
    age: {
      type: "int",
      label: { ru: "Возраст", en: "Age" }
    },
    species: {
      type: "string",
      dictionary: "species",
      label: { ru: "Вид", en: "Species" }
    },
    sex: {
      type: "string",
      dictionary: "sex",
      label: { ru: "Пол", en: "Sex" }
    },
    traits: {
      type: "list-string",
      dictionary: "traits",
      label: { ru: "Черты", en: "Traits" }
    },
    hasMindshield: {
      type: "bool",
      label: { ru: "Есть защита разума", en: "Has mindshield" }
    },
    antagRole: {
      type: "list-string",
      dictionary: "antagRoles",
      label: { ru: "Роли антагониста", en: "Antag roles" }
    },
    antagObjectiveType: {
      type: "list-string",
      dictionary: "objectiveTypes",
      label: { ru: "Типы целей антагониста", en: "Antag objective types" }
    }
  }
};

export function getCategory(categoryId) {
  return CATEGORY_CATALOG.find(category => category.id === categoryId) ?? null;
}

export function getFieldDefinition(scope, field) {
  return FIELD_DEFINITIONS[scope]?.[field] ?? null;
}

export function getFieldOptions(scope) {
  return Object.entries(FIELD_DEFINITIONS[scope] ?? {}).map(([id, meta]) => ({
    id,
    ...meta
  }));
}

export function getDictionaryValues(dictionaryName) {
  return VALUE_DICTIONARIES[dictionaryName] ?? [];
}

export function getDictionaryLabel(dictionaryName, value) {
  if (!value) {
    return "";
  }

  const entry = LOCALIZED_DICTIONARY_LABELS[dictionaryName]?.[value] ?? null;
  return buildDictionaryLabel(value, entry);
}

export function getDictionaryOptions(dictionaryName) {
  return getDictionaryValues(dictionaryName).map(value => ({
    id: value,
    label: getDictionaryLabel(dictionaryName, value)
  }));
}

export function getAllowedOperators(scope, field, options = {}) {
  const definition = getFieldDefinition(scope, field);
  if (!definition) {
    return [PREDICATE_OPERATORS.equals];
  }

  const operators = [...(OPERATORS_BY_FIELD_TYPE[definition.type] ?? [PREDICATE_OPERATORS.equals])];
  if (scope === PREDICATE_SCOPES.candidate && options.allowCompareOperators !== false) {
    operators.push(PREDICATE_OPERATORS.sameAs, PREDICATE_OPERATORS.notSameAs);
  }

  return operators;
}
