import { showLoading } from "./render.js";
import { state } from "./state.js";
const vscode = acquireVsCodeApi();
export function loadSecrets() {
    showLoading(true, 0, "Preparing secret list...");
    vscode.postMessage({
        command: "loadSecrets",
        page: state.currentPage,
        pageSize: state.pageSize,
    });
}
export function requestCreateSecret() {
    vscode.postMessage({
        command: "requestCreateSecret",
    });
}
export function editSecret(secretName) {
    vscode.postMessage({
        command: "requestEditSecret",
        secretName,
    });
}
export function deleteSecret(secretName) {
    vscode.postMessage({
        command: "requestDeleteSecret",
        secretName,
    });
}
export function toggleEnabled(secretName, enabled) {
    vscode.postMessage({
        command: "requestToggleEnabled",
        secretName,
        enabled,
    });
}
export function updateSecretProperties(secretName, properties) {
    vscode.postMessage({
        command: "requestUpdateSecretProperties",
        secretName,
        properties,
    });
}
export function requestSecretDetails(secretName) {
    vscode.postMessage({
        command: "requestSecretDetails",
        secretName,
    });
}
