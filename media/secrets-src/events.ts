import { dom } from "./dom.js";
import {
  filterAndDisplay,
  showLoading,
  showMessage,
  updateSortUI,
} from "./render.js";
import {
  deleteSecret,
  editSecret,
  loadSecrets,
  requestCreateSecret,
  requestSecretDetails,
  toggleEnabled,
  updateSecretProperties,
} from "./actions.js";
import { renderTagRowHtml } from "./templates.js";
import { state } from "./state.js";
import type { DetailsState, Draft, Secret } from "./types.js";

export function bindEvents(): void {
  dom.searchInput.addEventListener("input", filterAndDisplay);
  dom.statusFilter.addEventListener("change", onStatusFilterChange);
  dom.createBtn.addEventListener("click", requestCreateSecret);
  dom.refreshBtn.addEventListener("click", loadSecrets);
  dom.prevBtn.addEventListener("click", previousPage);
  dom.nextBtn.addEventListener("click", nextPage);
  dom.secretsTable.addEventListener("click", onTableClick);
  dom.secretsTable.addEventListener("change", onTableChange);

  document.querySelectorAll("th.sortable").forEach((th) => {
    th.addEventListener("click", () => onSortHeaderClick(th));
  });

  window.addEventListener("message", onWindowMessage);
}

function onStatusFilterChange(event: Event): void {
  state.statusFilter = (event.target as HTMLSelectElement).value as
    | "all"
    | "enabled"
    | "disabled";
  state.currentPage = 0;
  filterAndDisplay();
}

function onSortHeaderClick(th: Element): void {
  const field = (th as HTMLElement).dataset.sort as
    | "name"
    | "status"
    | "created"
    | "updated";
  if (state.sortField === field) {
    state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
  } else {
    state.sortField = field;
    state.sortDirection = "asc";
  }
  updateSortUI();
  state.currentPage = 0;
  filterAndDisplay();
}

function onTableClick(event: Event): void {
  const target = event.target as HTMLElement | null;
  if (!target) return;

  const action = target.getAttribute("data-action");
  const encodedName = target.getAttribute("data-secret-name");
  if (!action) return;

  if (action === "removeTag") {
    const detailsRow = target.closest(".details-row");
    const detailsEncodedName = detailsRow?.getAttribute("data-secret-name");
    if (detailsEncodedName) {
      const secretName = decodeURIComponent(detailsEncodedName);
      if (!isActionAllowedForSecret(secretName, action)) {
        return;
      }
    }
    removeTagRow(target);
    return;
  }

  if (!encodedName) return;
  const secretName = decodeURIComponent(encodedName);
  if (!isActionAllowedForSecret(secretName, action)) {
    return;
  }
  if (action === "toggle") {
    toggleVisibility(secretName);
  } else if (action === "edit") {
    editSecret(secretName);
  } else if (action === "delete") {
    deleteSecret(secretName);
  } else if (action === "toggleEnabled") {
    const enabledValue = target.getAttribute("data-enabled") === "true";
    toggleEnabled(secretName, enabledValue);
  } else if (action === "toggleDetails") {
    toggleDetails(secretName);
  } else if (action === "addTag") {
    addTagRow(secretName);
  } else if (action === "saveDetails") {
    saveDetails(secretName);
  } else if (action === "cancelDetails") {
    cancelDetails(secretName);
  }
}

function onTableChange(event: Event): void {
  const target = event.target as HTMLElement | null;
  if (!target) return;

  const role = target.getAttribute("data-role");
  const encodedName = target.getAttribute("data-secret-name");
  if (!role || !encodedName) return;

  const secretName = decodeURIComponent(encodedName);
  const secret = state.allSecrets.find((s) => s.name === secretName);
  if (!secret || !secret.enabled) {
    return;
  }
  if (role === "notBeforeEnabled" || role === "expiresOnEnabled") {
    toggleDateEnabled(secretName, role === "notBeforeEnabled");
  } else if (role === "notBefore" || role === "expiresOn") {
    updateDateValue(secretName);
  } else if (role === "tagKey" || role === "tagValue") {
    updateTags(secretName);
  }
}

function isActionAllowedForSecret(secretName: string, action: string): boolean {
  const secret = state.allSecrets.find((s) => s.name === secretName);
  if (!secret) {
    return true;
  }
  if (secret.enabled) {
    return true;
  }
  return action === "toggleEnabled" || action === "delete";
}

function toggleVisibility(secretName: string): void {
  const safeName = window.CSS.escape(encodeURIComponent(secretName));
  const selector = '.secret-value[data-secret-name="' + safeName + '"]';
  const element = document.querySelector(selector);
  if (!element) return;
  if (element.classList.contains("masked")) {
    element.classList.remove("masked");
    const secret = state.allSecrets.find((s) => s.name === secretName);
    if (!secret) return;
    element.textContent = secret.value;
  } else {
    element.classList.add("masked");
    element.textContent = "••••••••";
  }
}

function toggleDetails(secretName: string): void {
  const targetSecret = state.allSecrets.find((s) => s.name === secretName);
  if (!targetSecret || !targetSecret.enabled) {
    return;
  }

  if (state.expandedSecretName === secretName) {
    state.expandedSecretName = null;
    delete state.editsBySecretName[secretName];
  } else {
    state.expandedSecretName = secretName;
    if (!targetSecret.detailsLoaded) {
      requestSecretDetails(secretName);
    }
  }
  filterAndDisplay();
}

function toggleDateEnabled(secretName: string, isNotBefore: boolean): void {
  const selector =
    '[data-secret-name="' + encodeURIComponent(secretName) + '"]';
  const container = document.querySelector(".details-row" + selector);
  if (!container) return;

  const inputRole = isNotBefore ? "notBefore" : "expiresOn";
  const checkboxRole = isNotBefore ? "notBeforeEnabled" : "expiresOnEnabled";
  const checkbox = container.querySelector(
    '[data-role="' + checkboxRole + '"]',
  );
  const input = container.querySelector('[data-role="' + inputRole + '"]');
  if (!(checkbox instanceof HTMLInputElement)) return;
  if (!(input instanceof HTMLInputElement)) return;

  input.disabled = !checkbox.checked;
  if (!checkbox.checked) {
    input.value = "";
  }
  updateSecretDates(secretName);
}

function updateDateValue(secretName: string): void {
  updateSecretDates(secretName);
}

function updateSecretDates(secretName: string): void {
  const selector =
    '[data-secret-name="' + encodeURIComponent(secretName) + '"]';
  const container = document.querySelector(".details-row" + selector);
  if (!container) return;

  const notBeforeEnabled = container.querySelector(
    '[data-role="notBeforeEnabled"]',
  );
  const notBeforeInput = container.querySelector('[data-role="notBefore"]');
  const expiresEnabled = container.querySelector(
    '[data-role="expiresOnEnabled"]',
  );
  const expiresInput = container.querySelector('[data-role="expiresOn"]');
  if (!(notBeforeEnabled instanceof HTMLInputElement)) return;
  if (!(notBeforeInput instanceof HTMLInputElement)) return;
  if (!(expiresEnabled instanceof HTMLInputElement)) return;
  if (!(expiresInput instanceof HTMLInputElement)) return;

  const notBefore =
    notBeforeEnabled.checked && notBeforeInput.value
      ? new Date(notBeforeInput.value).toISOString()
      : null;
  const expiresOn =
    expiresEnabled.checked && expiresInput.value
      ? new Date(expiresInput.value).toISOString()
      : null;

  const draft = ensureDraft(secretName);
  draft.notBefore = notBefore;
  draft.expiresOn = expiresOn;
}

function addTagRow(secretName: string): void {
  const tagsContainer = document.querySelector(
    '.details-row[data-secret-name="' +
      encodeURIComponent(secretName) +
      '"] .tags',
  );
  if (!tagsContainer) return;
  tagsContainer.insertAdjacentHTML("beforeend", renderTagRowHtml("", ""));
}

function removeTagRow(button: HTMLElement): void {
  const row = button.closest(".tag-row");
  if (!row) return;
  const detailsRow = button.closest(".details-row");
  if (!detailsRow) return;
  const encodedName = detailsRow.getAttribute("data-secret-name");
  if (!encodedName) return;
  row.remove();
  updateTags(decodeURIComponent(encodedName));
}

function updateTags(secretName: string): void {
  const detailsRow = document.querySelector(
    '.details-row[data-secret-name="' + encodeURIComponent(secretName) + '"]',
  );
  if (!detailsRow) return;
  const tagRows = detailsRow.querySelectorAll(".tag-row");
  const tags: Record<string, string> = {};
  tagRows.forEach((row) => {
    const keyInput = row.querySelector('[data-role="tagKey"]');
    const valueInput = row.querySelector('[data-role="tagValue"]');
    if (!(keyInput instanceof HTMLInputElement)) return;
    if (!(valueInput instanceof HTMLInputElement)) return;
    const key = keyInput.value.trim();
    if (!key) return;
    tags[key] = valueInput.value;
  });

  const draft = ensureDraft(secretName);
  draft.tags = tags;
}

function ensureDraft(secretName: string): Draft {
  if (!state.editsBySecretName[secretName]) {
    const secret = state.allSecrets.find((s) => s.name === secretName);
    state.editsBySecretName[secretName] = {
      notBefore: secret?.notBefore
        ? new Date(secret.notBefore).toISOString()
        : null,
      expiresOn: secret?.expiresOn
        ? new Date(secret.expiresOn).toISOString()
        : null,
      tags: secret?.tags ? { ...secret.tags } : {},
    };
  }
  return state.editsBySecretName[secretName];
}

function saveDetails(secretName: string): void {
  const details = readDetailsState(secretName);
  updateSecretProperties(secretName, {
    notBefore: details.notBefore,
    expiresOn: details.expiresOn,
    tags: details.tags,
  });
  delete state.editsBySecretName[secretName];
}

function cancelDetails(secretName: string): void {
  delete state.editsBySecretName[secretName];
  filterAndDisplay();
}

function readDetailsState(secretName: string): DetailsState {
  const detailsRow = document.querySelector(
    '.details-row[data-secret-name="' + encodeURIComponent(secretName) + '"]',
  );
  if (!detailsRow) {
    return { notBefore: null, expiresOn: null, tags: {} };
  }

  const notBeforeEnabled = detailsRow.querySelector(
    '[data-role="notBeforeEnabled"]',
  );
  const notBeforeInput = detailsRow.querySelector('[data-role="notBefore"]');
  const expiresEnabled = detailsRow.querySelector(
    '[data-role="expiresOnEnabled"]',
  );
  const expiresInput = detailsRow.querySelector('[data-role="expiresOn"]');

  let notBefore: string | null = null;
  let expiresOn: string | null = null;

  if (notBeforeEnabled instanceof HTMLInputElement) {
    if (
      notBeforeEnabled.checked &&
      notBeforeInput instanceof HTMLInputElement
    ) {
      if (notBeforeInput.value) {
        notBefore = new Date(notBeforeInput.value).toISOString();
      }
    }
  }

  if (expiresEnabled instanceof HTMLInputElement) {
    if (expiresEnabled.checked && expiresInput instanceof HTMLInputElement) {
      if (expiresInput.value) {
        expiresOn = new Date(expiresInput.value).toISOString();
      }
    }
  }

  const tagRows = detailsRow.querySelectorAll(".tag-row");
  const tags: Record<string, string> = {};
  tagRows.forEach((row) => {
    const keyInput = row.querySelector('[data-role="tagKey"]');
    const valueInput = row.querySelector('[data-role="tagValue"]');
    if (!(keyInput instanceof HTMLInputElement)) return;
    if (!(valueInput instanceof HTMLInputElement)) return;
    const key = keyInput.value.trim();
    if (!key) return;
    tags[key] = valueInput.value;
  });

  return { notBefore, expiresOn, tags };
}

function onWindowMessage(event: MessageEvent): void {
  const message = event.data as {
    command?: string;
    secretName?: string;
    progress?: number;
    processed?: number;
    total?: number;
    status?: string;
    data?: {
      secrets?: Secret[];
      total?: number;
      details?: {
        id?: string;
        created?: string | Date | null;
        updated?: string | Date | null;
        notBefore?: string | Date | null;
        expiresOn?: string | Date | null;
        tags?: Record<string, string>;
      };
    };
    page?: number;
    message?: string;
  };
  switch (message.command) {
    case "secretsLoadProgress": {
      const processed = message.processed ?? 0;
      const total = message.total ?? 0;
      const progress =
        typeof message.progress === "number"
          ? message.progress
          : total > 0
            ? Math.round((processed / total) * 100)
            : 0;
      const status =
        message.status ||
        (total > 0
          ? `Loading secrets... (${processed}/${total})`
          : "Preparing secret list...");
      showLoading(true, progress, status);
      break;
    }
    case "secretsLoaded":
      state.allSecrets = (message.data?.secrets || []).map((secret) => ({
        ...secret,
        detailsLoaded: false,
      }));
      state.totalSecrets = message.data?.total ?? state.allSecrets.length;
      state.currentPage = message.page || 0;
      updateSortUI();
      filterAndDisplay();
      break;
    case "secretDetailsLoaded": {
      const details = message.data?.details;
      if (message.secretName && details) {
        const target = state.allSecrets.find(
          (secret) => secret.name === message.secretName,
        );
        if (target) {
          target.id = details.id;
          target.created = details.created;
          target.updated = details.updated;
          target.notBefore = details.notBefore;
          target.expiresOn = details.expiresOn;
          target.tags = details.tags;
          target.detailsLoaded = true;
          if (state.expandedSecretName === target.name) {
            filterAndDisplay();
          }
        }
      }
      break;
    }
    case "secretUpdated":
      showMessage(
        "Secret '" + message.secretName + "' updated successfully",
        "success",
      );
      loadSecrets();
      break;
    case "secretDeleted":
      showMessage(
        "Secret '" + message.secretName + "' deleted successfully",
        "success",
      );
      loadSecrets();
      break;
    case "error":
      showMessage(message.message || "Error", "error");
      showLoading(false);
      break;
  }
}

function previousPage(): void {
  if (state.currentPage > 0) {
    state.currentPage--;
    filterAndDisplay();
  }
}

function nextPage(): void {
  const maxPage = Math.ceil(state.totalSecrets / state.pageSize);
  if (state.currentPage < maxPage - 1) {
    state.currentPage++;
    filterAndDisplay();
  }
}
