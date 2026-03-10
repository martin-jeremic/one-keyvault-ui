import { dom } from "./dom.js";
import { escapeHtml, toLocalInputValue } from "./format.js";
import { renderDetailsRowHtml, renderSecretRowHtml } from "./templates.js";
import { state } from "./state.js";
export function updateSortUI() {
    document.querySelectorAll("th.sortable").forEach((th) => {
        th.classList.remove("sort-asc", "sort-desc");
    });
    const activeTh = document.querySelector('th[data-sort="' + state.sortField + '"]');
    if (activeTh) {
        activeTh.classList.add("sort-" + state.sortDirection);
    }
}
export function showMessage(message, type) {
    const div = document.createElement("div");
    div.className = type || "success";
    div.textContent = message;
    dom.messageContainer.innerHTML = "";
    dom.messageContainer.appendChild(div);
    setTimeout(() => {
        div.remove();
    }, 5000);
}
export function showLoading(show, progress = 0, statusText = "Loading secrets...") {
    dom.loadingContainer.style.display = show ? "block" : "none";
    if (!show) {
        return;
    }
    const boundedProgress = Math.max(0, Math.min(100, progress));
    dom.loadingStatusText.textContent = statusText;
    dom.loadingProgressFill.style.width = `${boundedProgress}%`;
    dom.loadingProgressPercent.textContent = `${Math.round(boundedProgress)}%`;
    dom.loadingProgressBar.setAttribute("aria-valuenow", String(Math.round(boundedProgress)));
}
export function updatePaginationUI() {
    const maxPage = Math.ceil(state.totalSecrets / state.pageSize);
    dom.pageInfo.textContent =
        "Page " + (state.currentPage + 1) + " of " + Math.max(1, maxPage);
    dom.totalInfo.textContent = String(state.totalSecrets);
    dom.prevBtn.disabled = state.currentPage === 0;
    dom.nextBtn.disabled = state.currentPage + 1 >= maxPage;
}
export function renderSecretRow(secret) {
    const fragment = document.createDocumentFragment();
    const row = document.createElement("tr");
    const createdDate = formatDate(secret.created);
    const updatedDate = formatDate(secret.updated);
    const encodedName = encodeURIComponent(secret.name);
    const interactionDisabledAttr = secret.enabled ? "" : "disabled";
    const enabledClass = secret.enabled ? "enabled" : "disabled";
    const enabledText = secret.enabled ? "Enabled" : "Disabled";
    const isExpanded = secret.enabled && state.expandedSecretName === secret.name;
    row.innerHTML = renderSecretRowHtml({
        encodedName,
        escapedName: escapeHtml(secret.name),
        interactionDisabledAttr,
        enabledClass,
        enabledText,
        enabledValue: secret.enabled ? "true" : "false",
        createdDate,
        updatedDate,
    });
    fragment.appendChild(row);
    fragment.appendChild(renderDetailsRow(secret, isExpanded));
    return fragment;
}
export function displaySecrets(secrets) {
    if (secrets.length === 0) {
        showLoading(false);
        dom.emptyContainer.style.display =
            state.allSecrets.length === 0 ? "block" : "none";
        dom.tableContainer.style.display = "none";
        return;
    }
    dom.secretsTable.innerHTML = "";
    secrets.forEach((secret) => {
        dom.secretsTable.appendChild(renderSecretRow(secret));
    });
    showLoading(false);
    dom.emptyContainer.style.display = "none";
    dom.tableContainer.style.display = "block";
}
export function filterAndDisplay() {
    const searchTerm = dom.searchInput.value.toLowerCase();
    const filtered = state.allSecrets.filter((secret) => {
        const matchesName = secret.name.toLowerCase().includes(searchTerm);
        if (!matchesName)
            return false;
        if (state.statusFilter === "enabled") {
            return secret.enabled === true;
        }
        if (state.statusFilter === "disabled") {
            return secret.enabled === false;
        }
        return true;
    });
    filtered.sort((a, b) => {
        const aVal = getSortValue(a, state.sortField);
        const bVal = getSortValue(b, state.sortField);
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return state.sortDirection === "asc" ? comparison : -comparison;
    });
    const start = state.currentPage * state.pageSize;
    const end = start + state.pageSize;
    const paginatedSecrets = filtered.slice(start, end);
    state.totalSecrets = filtered.length;
    displaySecrets(paginatedSecrets);
    updatePaginationUI();
}
function renderDetailsRow(secret, isExpanded) {
    const detailsRow = document.createElement("tr");
    const encodedName = encodeURIComponent(secret.name);
    detailsRow.className = "details-row" + (isExpanded ? "" : " hidden");
    detailsRow.setAttribute("data-secret-name", encodedName);
    const draft = getDraft(secret);
    const notBeforeValue = toLocalInputValue(draft.notBefore);
    const expiresOnValue = toLocalInputValue(draft.expiresOn);
    const notBeforeChecked = !!draft.notBefore;
    const expiresOnChecked = !!draft.expiresOn;
    detailsRow.innerHTML = renderDetailsRowHtml({
        encodedName,
        escapedId: escapeHtml(secret.id || "-"),
        notBeforeValue,
        expiresOnValue,
        notBeforeChecked,
        expiresOnChecked,
        tags: draft.tags || {},
    });
    return detailsRow;
}
function getDraft(secret) {
    const existing = state.editsBySecretName[secret.name];
    if (existing) {
        return existing;
    }
    return {
        notBefore: secret.notBefore
            ? new Date(secret.notBefore).toISOString()
            : null,
        expiresOn: secret.expiresOn
            ? new Date(secret.expiresOn).toISOString()
            : null,
        tags: secret.tags ? { ...secret.tags } : {},
    };
}
function getSortValue(secret, field) {
    switch (field) {
        case "created":
            return toTimestamp(secret.created);
        case "updated":
            return toTimestamp(secret.updated);
        case "status":
            return secret.enabled ? 1 : 0;
        default:
            return secret.name.toLowerCase();
    }
}
function toTimestamp(value) {
    if (!value)
        return 0;
    const date = new Date(value);
    const time = date.getTime();
    return Number.isFinite(time) ? time : 0;
}
function formatDate(value) {
    if (!value)
        return "-";
    const date = new Date(value);
    const time = date.getTime();
    return Number.isFinite(time) ? date.toLocaleString() : "-";
}
