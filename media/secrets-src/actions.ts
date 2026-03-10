import { showLoading } from "./render.js";
import { state } from "./state.js";
import type { SecretPropertiesUpdate } from "./types.js";

const vscode = acquireVsCodeApi();

export function loadSecrets(): void {
  showLoading(true, 0, "Preparing secret list...");
  vscode.postMessage({
    command: "loadSecrets",
    page: state.currentPage,
    pageSize: state.pageSize,
  });
}

export function requestCreateSecret(): void {
  vscode.postMessage({
    command: "requestCreateSecret",
  });
}

export function editSecret(secretName: string): void {
  vscode.postMessage({
    command: "requestEditSecret",
    secretName,
  });
}

export function deleteSecret(secretName: string): void {
  vscode.postMessage({
    command: "requestDeleteSecret",
    secretName,
  });
}

export function toggleEnabled(secretName: string, enabled: boolean): void {
  vscode.postMessage({
    command: "requestToggleEnabled",
    secretName,
    enabled,
  });
}

export function updateSecretProperties(
  secretName: string,
  properties: SecretPropertiesUpdate,
): void {
  vscode.postMessage({
    command: "requestUpdateSecretProperties",
    secretName,
    properties,
  });
}

export function requestSecretDetails(secretName: string): void {
  vscode.postMessage({
    command: "requestSecretDetails",
    secretName,
  });
}
