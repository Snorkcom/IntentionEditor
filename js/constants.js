export const APP_TITLE = "IntentionEditor";
export const APP_VERSION = "1.1.0";

export const STORAGE_KEY = "intention-editor.draft.v2";
export const LOCALE_STORAGE_KEY = "intention-editor.locale.v1";

export const PREDICATE_SCOPES = {
  round: "round",
  candidate: "candidate",
  slot: "slot"
};

export const PREDICATE_OPERATORS = {
  equals: "equals",
  notEquals: "notEquals",
  in: "in",
  notIn: "notIn",
  contains: "contains",
  notContains: "notContains",
  ">": ">",
  ">=": ">=",
  "<": "<",
  "<=": "<=",
  between: "between",
  sameAs: "sameAs",
  notSameAs: "notSameAs"
};

export const VISIBILITY_TYPES = {
  visible: "visible",
  hidden: "hidden"
};

export const REVEAL_TYPES = {
  none: "none",
  timer: "timer"
};

export const TEXT_BINDING_SOURCES = {
  self: "self",
  slot: "slot",
  round: "round",
  literal: "literal"
};

export const TEXT_LIMITS = {
  name: 35,
  summary: 35,
  description: 2000,
  oocInfo: 500,
  copyableText: 5000,
  hiddenLabel: 45
};

export const INTENTION_KINDS = {
  primary: "primary",
  secondary: "secondary"
};

export const OPERATORS_BY_FIELD_TYPE = {
  string: ["equals", "notEquals", "in", "notIn"],
  bool: ["equals", "notEquals"],
  int: ["equals", "notEquals", ">", ">=", "<", "<=", "between", "in", "notIn"],
  timespan: ["equals", "notEquals", ">", ">=", "<", "<=", "between", "in", "notIn"],
  "list-string": ["contains", "notContains", "in", "notIn"],
  "map-int": ["equals", "notEquals", ">", ">=", "<", "<=", "between", "in", "notIn"]
};
