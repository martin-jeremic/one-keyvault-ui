(function () {
    const initial = window.__ONE_KEYVAULT_STATE__ || {};
    window.OneKeyVault = window.OneKeyVault || {};
    window.OneKeyVault.state = {
        currentPage: 0,
        pageSize: 10,
        totalSecrets: 0,
        allSecrets: [],
        sortField: 'name',
        sortDirection: 'asc',
        statusFilter: 'all',
        expandedSecretName: null,
        editsBySecretName: {},
        vaultUrl: initial.vaultUrl || ''
    };
})();
