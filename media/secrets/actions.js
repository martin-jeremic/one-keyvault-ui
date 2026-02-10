/* global acquireVsCodeApi */
(function () {
    const vscode = acquireVsCodeApi();

    function loadSecrets() {
        window.OneKeyVault.render.showLoading(true);
        vscode.postMessage({
            command: 'loadSecrets',
            page: window.OneKeyVault.state.currentPage,
            pageSize: window.OneKeyVault.state.pageSize
        });
    }

    function requestCreateSecret() {
        vscode.postMessage({
            command: 'requestCreateSecret'
        });
    }

    function editSecret(secretName) {
        vscode.postMessage({
            command: 'requestEditSecret',
            secretName: secretName
        });
    }

    function deleteSecret(secretName) {
        vscode.postMessage({
            command: 'requestDeleteSecret',
            secretName: secretName
        });
    }

    function toggleEnabled(secretName, enabled) {
        vscode.postMessage({
            command: 'requestToggleEnabled',
            secretName: secretName,
            enabled: enabled
        });
    }

    function updateSecretProperties(secretName, properties) {
        vscode.postMessage({
            command: 'requestUpdateSecretProperties',
            secretName: secretName,
            properties: properties
        });
    }

    window.OneKeyVault = window.OneKeyVault || {};
    window.OneKeyVault.actions = {
        loadSecrets,
        requestCreateSecret,
        editSecret,
        deleteSecret,
        toggleEnabled,
        updateSecretProperties
    };
})();
