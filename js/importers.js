import {
  REVEAL_TYPES,
  TEXT_BINDING_SOURCES,
  VISIBILITY_TYPES
} from "./constants.js";
import { normalizeDraft } from "./draft.js";
import { nonEmpty, splitTagsInput } from "./utils.js";

class ImportFailure extends Error {
  constructor(area, message, line = 0) {
    super(message);
    this.area = area;
    this.line = line;
  }
}

function importError(area, message, line = 0) {
  return {
    area,
    line,
    message: line > 0 ? `${message} (line ${line})` : message
  };
}

function fail(area, message, line = 0) {
  throw new ImportFailure(area, message, line);
}

function countIndent(rawLine, area, lineNumber) {
  if (/^\t+/.test(rawLine)) {
    fail(area, "Tabs are not supported for YAML indentation.", lineNumber);
  }

  return rawLine.match(/^ */)?.[0].length ?? 0;
}

function prepareYamlLines(text, area) {
  return `${text ?? ""}`
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((raw, index) => ({
      raw,
      line: index + 1,
      indent: countIndent(raw, area, index + 1),
      text: raw.trim()
    }))
    .filter(line => line.text.length > 0 && !line.text.startsWith("#"));
}

function splitKeyValue(text, area, lineNumber) {
  const index = text.indexOf(":");
  if (index <= 0) {
    fail(area, `Expected "key: value" but got "${text}".`, lineNumber);
  }

  return {
    key: text.slice(0, index).trim(),
    value: text.slice(index + 1).trim()
  };
}

function unquoteDoubleQuoted(text) {
  return text
    .slice(1, -1)
    .replace(/\\n/g, "\n")
    .replace(/\\"/g, "\"")
    .replace(/\\\\/g, "\\");
}

function unquoteSingleQuoted(text) {
  return text.slice(1, -1).replace(/''/g, "'");
}

function splitInlineList(text, area, lineNumber) {
  const values = [];
  let current = "";
  let quote = "";
  let escaped = false;

  for (const char of text) {
    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }
    if (quote === "\"" && char === "\\") {
      current += char;
      escaped = true;
      continue;
    }
    if (quote) {
      current += char;
      if (char === quote) {
        quote = "";
      }
      continue;
    }
    if (char === "\"" || char === "'") {
      quote = char;
      current += char;
      continue;
    }
    if (char === ",") {
      values.push(current.trim());
      current = "";
      continue;
    }
    current += char;
  }

  if (quote) {
    fail(area, "Unclosed quote in inline list.", lineNumber);
  }

  if (current.trim().length > 0) {
    values.push(current.trim());
  }

  return values;
}

function parseScalar(text, area, lineNumber) {
  if (text === "") {
    return "";
  }
  if (text.startsWith("[") && text.endsWith("]")) {
    const body = text.slice(1, -1).trim();
    return body.length === 0
      ? []
      : splitInlineList(body, area, lineNumber).map(item => parseScalar(item, area, lineNumber));
  }
  if (text.startsWith("\"") && text.endsWith("\"")) {
    return unquoteDoubleQuoted(text);
  }
  if (text.startsWith("'") && text.endsWith("'")) {
    return unquoteSingleQuoted(text);
  }
  if (/^(true|false)$/i.test(text)) {
    return text.toLowerCase() === "true";
  }
  if (/^-?\d+$/.test(text)) {
    return Number(text);
  }
  if (/^-?\d+\.\d+$/.test(text)) {
    return Number(text);
  }

  return text;
}

function parseYamlBlock(lines, index, indent, area) {
  if (index >= lines.length) {
    return { value: null, index };
  }

  if (lines[index].indent < indent) {
    return { value: null, index };
  }

  return lines[index].text.startsWith("- ")
    ? parseYamlArray(lines, index, lines[index].indent, area)
    : parseYamlObject(lines, index, lines[index].indent, area);
}

function parseYamlArray(lines, index, indent, area) {
  const result = [];

  while (index < lines.length) {
    const line = lines[index];
    if (line.indent < indent) {
      break;
    }
    if (line.indent > indent) {
      fail(area, "Unexpected indentation.", line.line);
    }
    if (!line.text.startsWith("- ")) {
      break;
    }

    const itemText = line.text.slice(2).trim();
    if (itemText.length === 0) {
      const nested = parseYamlBlock(lines, index + 1, indent + 2, area);
      result.push(nested.value);
      index = nested.index;
      continue;
    }

    if (itemText.includes(":")) {
      const item = {};
      const pair = splitKeyValue(itemText, area, line.line);
      item[pair.key] = pair.value.length === 0
        ? {}
        : parseScalar(pair.value, area, line.line);
      index += 1;

      if (index < lines.length && lines[index].indent > indent) {
        const nested = parseYamlObject(lines, index, lines[index].indent, area);
        Object.assign(item, nested.value);
        index = nested.index;
      }

      result.push(item);
      continue;
    }

    result.push(parseScalar(itemText, area, line.line));
    index += 1;
    if (index < lines.length && lines[index].indent > indent) {
      fail(area, "Scalar list item cannot contain nested YAML.", lines[index].line);
    }
  }

  return { value: result, index };
}

function parseYamlObject(lines, index, indent, area) {
  const result = {};

  while (index < lines.length) {
    const line = lines[index];
    if (line.indent < indent) {
      break;
    }
    if (line.indent > indent) {
      fail(area, "Unexpected indentation.", line.line);
    }
    if (line.text.startsWith("- ")) {
      break;
    }

    const pair = splitKeyValue(line.text, area, line.line);
    index += 1;
    if (pair.value.length > 0) {
      result[pair.key] = parseScalar(pair.value, area, line.line);
      continue;
    }

    if (index < lines.length && lines[index].indent > indent) {
      const nested = parseYamlBlock(lines, index, lines[index].indent, area);
      result[pair.key] = nested.value;
      index = nested.index;
    } else {
      result[pair.key] = {};
    }
  }

  return { value: result, index };
}

function parseYamlDocument(text, area) {
  if (!nonEmpty(text)) {
    fail(area, "Input is empty.");
  }

  const lines = prepareYamlLines(text, area);
  if (lines.length === 0) {
    fail(area, "Input is empty.");
  }

  const parsed = parseYamlBlock(lines, 0, lines[0].indent, area);
  if (parsed.index < lines.length) {
    fail(area, "Unexpected trailing YAML content.", lines[parsed.index].line);
  }

  return parsed.value;
}

function parseFtl(text) {
  const entries = new Map();
  let currentKey = "";
  const lines = `${text ?? ""}`.replace(/\r\n/g, "\n").split("\n");

  function hasFollowingContinuation(startIndex) {
    for (let index = startIndex; index < lines.length; index += 1) {
      const nextLine = lines[index];
      const trimmed = nextLine.trim();
      if (trimmed.length === 0 || trimmed.startsWith("#")) {
        continue;
      }
      return /^\s+/.test(nextLine);
    }

    return false;
  }

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (trimmed.length === 0) {
      if (currentKey && hasFollowingContinuation(index + 1)) {
        const previous = entries.get(currentKey) ?? "";
        entries.set(currentKey, `${previous}\n`);
      }
      return;
    }
    if (trimmed.startsWith("#")) {
      return;
    }

    const match = line.match(/^([A-Za-z0-9_.-]+)\s*=\s?(.*)$/);
    if (match) {
      currentKey = match[1];
      entries.set(currentKey, match[2] ?? "");
      return;
    }

    if (/^\s+/.test(line) && currentKey) {
      const previous = entries.get(currentKey) ?? "";
      entries.set(currentKey, `${previous}\n${line.replace(/^\s{1,4}/, "")}`);
      return;
    }

    fail("FTL", `Expected "key = value" entry.`, index + 1);
  });

  return entries;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function asString(value) {
  return value === undefined || value === null ? "" : `${value}`;
}

function asNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function asBoolean(value, fallback = false) {
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "string" && /^(true|false)$/i.test(value)) {
    return value.toLowerCase() === "true";
  }
  return fallback;
}

function requireString(value, area, message) {
  const text = asString(value);
  if (!nonEmpty(text)) {
    fail(area, message);
  }
  return text;
}

function readLoc(ftlEntries, key, area, fieldName, required = false) {
  const locKey = asString(key);
  if (!nonEmpty(locKey)) {
    if (required) {
      fail(area, `Missing required loc key ${fieldName}.`);
    }
    return "";
  }

  if (!ftlEntries.has(locKey)) {
    fail("FTL", `Missing FTL entry "${locKey}" referenced by ${fieldName}.`);
  }

  return ftlEntries.get(locKey) ?? "";
}

function mapPredicate(rawPredicate, fallbackScope) {
  const raw = asObject(rawPredicate);
  const compareTo = asObject(raw.compareTo);
  return {
    scope: asString(raw.scope) || fallbackScope,
    field: asString(raw.field),
    operator: asString(raw.operator) || "equals",
    key: asString(raw.key),
    value: asString(raw.value),
    values: asArray(raw.values).map(asString).filter(item => nonEmpty(item)),
    valueFrom: asString(raw.valueFrom),
    valueTo: asString(raw.valueTo),
    compareTo: nonEmpty(compareTo.slotId)
      ? {
          scope: asString(compareTo.scope) || "slot",
          slotId: asString(compareTo.slotId),
          field: asString(compareTo.field)
        }
      : null
  };
}

function mapTextBindings(rawBindings) {
  const bindings = asObject(rawBindings);
  return Object.entries(bindings).map(([parameter, rawBinding]) => {
    const binding = asObject(rawBinding);
    return {
      parameter,
      source: asString(binding.source) || TEXT_BINDING_SOURCES.self,
      slotId: asString(binding.slotId),
      field: asString(binding.field),
      value: asString(binding.value)
    };
  });
}

function mapVisibility(rawVisibility) {
  const visibility = asObject(rawVisibility);
  const reveal = asObject(visibility.reveal);
  const enabled = Object.keys(visibility).length > 0;
  return {
    visibilityEnabled: enabled,
    visibilityType: asString(visibility.type) || VISIBILITY_TYPES.visible,
    revealType: asString(reveal.type) || REVEAL_TYPES.none,
    revealMinutes: asNumber(reveal.minutes, 15)
  };
}

function mapSlot(rawEntry) {
  const entry = asObject(rawEntry);
  const visibility = mapVisibility(entry.visibilityOverride);
  return {
    slotId: asString(entry.slotId),
    kind: asString(entry.kind),
    intentionId: asString(entry.intentionId),
    required: asBoolean(entry.required, true),
    candidatePredicates: asArray(entry.candidatePredicates).map(item => mapPredicate(item, "candidate")),
    bindToSlot: asString(entry.bindToSlot),
    allowSameActorAs: asArray(entry.allowSameActorAs).map(asString).filter(item => nonEmpty(item)),
    textParameterBindings: mapTextBindings(entry.textParameterBindings),
    ...visibility
  };
}

function mapIntention(rawTemplate, ftlEntries, expectedKind) {
  const template = asObject(rawTemplate);
  const id = requireString(template.id, "Intentions YAML", "Intention template is missing id.");
  const kind = asString(template.kind) || expectedKind;
  const icon = asObject(template.icon);
  const tags = asArray(template.tags).map(asString).filter(item => nonEmpty(item));

  return {
    id,
    kind,
    name: readLoc(ftlEntries, template.nameLoc, "Intentions YAML", `${id}.nameLoc`, true),
    summary: readLoc(ftlEntries, template.summaryLoc, "Intentions YAML", `${id}.summaryLoc`),
    description: readLoc(ftlEntries, template.descriptionLoc, "Intentions YAML", `${id}.descriptionLoc`, true),
    oocInfo: readLoc(ftlEntries, template.oocInfoLoc, "Intentions YAML", `${id}.oocInfoLoc`),
    copyableText: readLoc(ftlEntries, template.copyableTextLoc, "Intentions YAML", `${id}.copyableTextLoc`),
    defaultVisibility: asString(template.defaultVisibility) || VISIBILITY_TYPES.visible,
    hiddenLabel: readLoc(ftlEntries, template.hiddenLabelLoc, "Intentions YAML", `${id}.hiddenLabelLoc`),
    iconEnabled: nonEmpty(icon.sprite) && nonEmpty(icon.state),
    iconSprite: asString(icon.sprite),
    iconState: asString(icon.state),
    color: asString(template.color),
    tags,
    tagsInput: tags.join(", "),
    author: asString(template.author),
    creationDate: asString(template.creationDate)
  };
}

function selectOneTemplate(items, type, area) {
  const matches = asArray(items).filter(item => asObject(item).type === type);
  if (matches.length !== 1) {
    fail(area, `Expected exactly one ${type}, found ${matches.length}.`);
  }
  return matches[0];
}

export function importScenarioPackage({
  scenarioYaml,
  intentionsYaml,
  ftlText,
  locale = "ru"
}) {
  const errors = [];
  let scenarioItems = null;
  let intentionItems = null;
  let ftlEntries = null;

  try {
    scenarioItems = parseYamlDocument(scenarioYaml, "Scenario YAML");
  } catch (error) {
    errors.push(error instanceof ImportFailure ? importError(error.area, error.message, error.line) : importError("Scenario YAML", `${error}`));
  }

  try {
    intentionItems = parseYamlDocument(intentionsYaml, "Intentions YAML");
  } catch (error) {
    errors.push(error instanceof ImportFailure ? importError(error.area, error.message, error.line) : importError("Intentions YAML", `${error}`));
  }

  try {
    ftlEntries = parseFtl(ftlText);
    if (ftlEntries.size === 0) {
      fail("FTL", "Input is empty.");
    }
  } catch (error) {
    errors.push(error instanceof ImportFailure ? importError(error.area, error.message, error.line) : importError("FTL", `${error}`));
  }

  if (errors.length > 0) {
    return { draft: null, errors };
  }

  try {
    const scenarioTemplate = selectOneTemplate(scenarioItems, "scenarioTemplate", "Scenario YAML");
    const intentionTemplates = asArray(intentionItems).filter(item => asObject(item).type === "intentionTemplate");
    if (intentionTemplates.length === 0) {
      fail("Intentions YAML", "No intentionTemplate entries found.");
    }

    const intentionsById = new Map();
    for (const template of intentionTemplates) {
      const id = asString(asObject(template).id);
      if (!nonEmpty(id)) {
        fail("Intentions YAML", "Intention template is missing id.");
      }
      if (intentionsById.has(id)) {
        fail("Intentions YAML", `Duplicate intentionTemplate id "${id}".`);
      }
      intentionsById.set(id, template);
    }

    const entries = asArray(scenarioTemplate.entries);
    const ownerEntry = entries.find(entry => asObject(entry).slotId === "owner" && asObject(entry).kind === "primary");
    if (!ownerEntry) {
      fail("Scenario YAML", "Owner entry with slotId: owner and kind: primary was not found.");
    }

    const ownerIntentionId = requireString(ownerEntry.intentionId, "Scenario YAML", "Owner entry is missing intentionId.");
    const ownerTemplate = intentionsById.get(ownerIntentionId);
    if (!ownerTemplate) {
      fail("Intentions YAML", `Missing intentionTemplate "${ownerIntentionId}" referenced by owner entry.`);
    }

    const secondaryEntries = entries.filter(entry => entry !== ownerEntry);
    const secondaryIntentions = [];
    const secondarySlots = [];
    for (const entry of secondaryEntries) {
      const slot = mapSlot(entry);
      if (!nonEmpty(slot.intentionId)) {
        fail("Scenario YAML", `Entry "${slot.slotId || "<unknown>"}" is missing intentionId.`);
      }
      const template = intentionsById.get(slot.intentionId);
      if (!template) {
        fail("Intentions YAML", `Missing intentionTemplate "${slot.intentionId}" referenced by slot "${slot.slotId}".`);
      }

      secondaryIntentions.push(mapIntention(template, ftlEntries, "secondary"));
      secondarySlots.push(slot);
    }

    const ownerSlot = mapSlot(ownerEntry);
    const rawDraft = {
      scenario: {
        id: asString(scenarioTemplate.id),
        name: asString(scenarioTemplate.name),
        category: asString(scenarioTemplate.category),
        enabled: asBoolean(scenarioTemplate.enabled, true),
        weight: asNumber(scenarioTemplate.weight, 1)
      },
      ownerIntention: mapIntention(ownerTemplate, ftlEntries, "primary"),
      secondaryIntentions,
      ownerSlot,
      secondarySlots,
      globalPredicates: asArray(scenarioTemplate.globalPredicates).map(item => mapPredicate(item, "round")),
      lastUpdatedAt: new Date().toISOString()
    };

    return {
      draft: normalizeDraft(rawDraft, locale),
      errors: []
    };
  } catch (error) {
    errors.push(error instanceof ImportFailure ? importError(error.area, error.message, error.line) : importError("Import", `${error}`));
    return { draft: null, errors };
  }
}
