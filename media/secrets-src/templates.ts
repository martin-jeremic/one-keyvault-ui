import { escapeHtml } from "./format.js";
import type {
  TemplateDetailsData,
  TemplateRowData,
  TemplateUris,
} from "./types.js";

type TemplateStore = {
  secretRow: string;
  detailsRow: string;
  tagRow: string;
};

let templates: TemplateStore | null = null;

export async function loadTemplates(): Promise<void> {
  if (templates) {
    return;
  }

  const uris = window.__ONE_KEYVAULT_TEMPLATES__;
  if (!uris) {
    throw new Error("Template URIs not available.");
  }

  templates = await fetchTemplates(uris);
}

export function renderTagRowHtml(key: string, value: string): string {
  const store = requireTemplates();
  const escapedKey = escapeHtml(key || "");
  const escapedValue = escapeHtml(value || "");
  return applyTemplate(store.tagRow, {
    escapedKey,
    escapedValue,
  });
}

export function renderTagsHtml(tags: Record<string, string>): string {
  const keys = Object.keys(tags || {});
  if (keys.length === 0) {
    return renderTagRowHtml("", "");
  }
  return keys.map((key) => renderTagRowHtml(key, tags[key])).join("");
}

export function renderSecretRowHtml(data: TemplateRowData): string {
  const store = requireTemplates();
  return applyTemplate(store.secretRow, {
    encodedName: data.encodedName,
    escapedName: data.escapedName,
    enabledClass: data.enabledClass,
    enabledText: data.enabledText,
    enabledValue: data.enabledValue,
    createdDate: data.createdDate,
    updatedDate: data.updatedDate,
  });
}

export function renderDetailsRowHtml(data: TemplateDetailsData): string {
  const store = requireTemplates();
  const notBeforeChecked = data.notBeforeChecked ? "checked" : "";
  const notBeforeDisabled = data.notBeforeChecked ? "" : "disabled";
  const expiresOnChecked = data.expiresOnChecked ? "checked" : "";
  const expiresOnDisabled = data.expiresOnChecked ? "" : "disabled";

  return applyTemplate(store.detailsRow, {
    encodedName: data.encodedName,
    escapedId: data.escapedId,
    notBeforeValue: data.notBeforeValue,
    expiresOnValue: data.expiresOnValue,
    notBeforeChecked,
    notBeforeDisabled,
    expiresOnChecked,
    expiresOnDisabled,
    tagsHtml: renderTagsHtml(data.tags || {}),
  });
}

async function fetchTemplates(uris: TemplateUris): Promise<TemplateStore> {
  const [secretRow, detailsRow, tagRow] = await Promise.all([
    fetchTemplate(uris.secretRow),
    fetchTemplate(uris.detailsRow),
    fetchTemplate(uris.tagRow),
  ]);

  return { secretRow, detailsRow, tagRow };
}

async function fetchTemplate(uri: string): Promise<string> {
  const response = await fetch(uri, { cache: "no-cache" });
  if (!response.ok) {
    throw new Error("Failed to load template: " + uri);
  }
  return response.text();
}

function requireTemplates(): TemplateStore {
  if (!templates) {
    throw new Error("Templates not loaded yet.");
  }
  return templates;
}

function applyTemplate(
  template: string,
  tokens: Record<string, string>,
): string {
  return Object.entries(tokens).reduce((value, [key, token]) => {
    return value.split("{{" + key + "}}").join(token);
  }, template);
}
