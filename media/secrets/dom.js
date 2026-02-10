(function () {
    window.OneKeyVault = window.OneKeyVault || {};
    window.OneKeyVault.dom = {
        loadingContainer: document.getElementById('loadingContainer'),
        emptyContainer: document.getElementById('emptyContainer'),
        tableContainer: document.getElementById('tableContainer'),
        secretsTable: document.getElementById('secretsTable'),
        searchInput: document.getElementById('searchInput'),
        statusFilter: document.getElementById('statusFilter'),
        createBtn: document.getElementById('createBtn'),
        refreshBtn: document.getElementById('refreshBtn'),
        prevBtn: document.getElementById('prevBtn'),
        nextBtn: document.getElementById('nextBtn'),
        pageInfo: document.getElementById('pageInfo'),
        totalInfo: document.getElementById('totalInfo'),
        messageContainer: document.getElementById('messageContainer')
    };
})();
