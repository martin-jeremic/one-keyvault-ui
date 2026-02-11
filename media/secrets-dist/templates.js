import { escapeHtml } from "./format.js";
let templates = null;
export async function loadTemplates() {
    if (templates) {
        return;
    }
    const uris = window.__ONE_KEYVAULT_TEMPLATES__;
    if (!uris) {
        throw new Error("Template URIs not available.");
    }
    templates = await fetchTemplates(uris);
}
export function renderTagRowHtml(key, value) {
    const store = requireTemplates();
    const escapedKey = escapeHtml(key || "");
    const escapedValue = escapeHtml(value || "");
    return applyTemplate(store.tagRow, {
        escapedKey,
        escapedValue,
    });
}
export function renderTagsHtml(tags) {
    const keys = Object.keys(tags || {});
    if (keys.length === 0) {
        return renderTagRowHtml("", "");
    }
    return keys.map((key) => renderTagRowHtml(key, tags[key])).join("");
}
export function renderSecretRowHtml(data) {
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
export function renderDetailsRowHtml(data) {
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
async function fetchTemplates(uris) {
    const [secretRow, detailsRow, tagRow] = await Promise.all([
        fetchTemplate(uris.secretRow),
        fetchTemplate(uris.detailsRow),
        fetchTemplate(uris.tagRow),
    ]);
    return { secretRow, detailsRow, tagRow };
}
async function fetchTemplate(uri) {
    const response = await fetch(uri, { cache: "no-cache" });
    if (!response.ok) {
        throw new Error("Failed to load template: " + uri);
    }
    return response.text();
}
function requireTemplates() {
    if (!templates) {
        throw new Error("Templates not loaded yet.");
    }
    return templates;
}
function applyTemplate(template, tokens) {
    return Object.entries(tokens).reduce((value, [key, token]) => {
        return value.split("{{" + key + "}}").join(token);
    }, template);
}
