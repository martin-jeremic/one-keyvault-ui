/* global acquireVsCodeApi */
(function () {
    const vscode = acquireVsCodeApi();
    const state = window.__ONE_KEYVAULT_STATE__ || {};
    const vaultUrl = state.vaultUrl || '';

    let currentPage = 0;
    const pageSize = 10;
    let totalSecrets = 0;
    let allSecrets = [];
    let sortField = 'name';
    let sortDirection = 'asc';
    let editingRow = null;

    const loadingContainer = document.getElementById('loadingContainer');
    const emptyContainer = document.getElementById('emptyContainer');
    const tableContainer = document.getElementById('tableContainer');
    const secretsTable = document.getElementById('secretsTable');
    const searchInput = document.getElementById('searchInput');
    const sortBySelect = document.getElementById('sortBy');
    const createBtn = document.getElementById('createBtn');
    const refreshBtn = document.getElementById('refreshBtn');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const pageInfo = document.getElementById('pageInfo');
    const totalInfo = document.getElementById('totalInfo');
    const messageContainer = document.getElementById('messageContainer');

    loadSecrets();

    searchInput.addEventListener('input', filterAndDisplay);
    sortBySelect.addEventListener('change', (e) => {
        sortField = e.target.value;
        sortDirection = 'asc';
        currentPage = 0;
        filterAndDisplay();
    });
    createBtn.addEventListener('click', requestCreateSecret);
    refreshBtn.addEventListener('click', loadSecrets);
    prevBtn.addEventListener('click', previousPage);
    nextBtn.addEventListener('click', nextPage);

    document.querySelectorAll('th.sortable').forEach(th => {
        th.addEventListener('click', () => {
            const field = th.dataset.sort;
            if (sortField === field) {
                sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
            } else {
                sortField = field;
                sortDirection = 'asc';
            }
            updateSortUI();
            currentPage = 0;
            filterAndDisplay();
        });
    });

    function updateSortUI() {
        document.querySelectorAll('th.sortable').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
        });
        const activeTh = document.querySelector('th[data-sort="' + sortField + '"]');
        if (activeTh) {
            activeTh.classList.add('sort-' + sortDirection);
        }
    }

    function showMessage(message, type = 'success') {
        const div = document.createElement('div');
        div.className = type;
        div.textContent = message;
        messageContainer.innerHTML = '';
        messageContainer.appendChild(div);
        setTimeout(() => {
            div.remove();
        }, 5000);
    }

    function loadSecrets() {
        showLoading(true);
        vscode.postMessage({
            command: 'loadSecrets',
            page: currentPage,
            pageSize: pageSize,
        });
    }

    function filterAndDisplay() {
        const searchTerm = searchInput.value.toLowerCase();
        const filtered = allSecrets.filter(secret =>
            secret.name.toLowerCase().includes(searchTerm)
        );

        filtered.sort((a, b) => {
            let aVal = a[sortField];
            let bVal = b[sortField];

            if (sortField === 'created' || sortField === 'updated') {
                aVal = new Date(aVal).getTime();
                bVal = new Date(bVal).getTime();
            }

            const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            return sortDirection === 'asc' ? comparison : -comparison;
        });

        const start = currentPage * pageSize;
        const end = start + pageSize;
        const paginatedSecrets = filtered.slice(start, end);

        totalSecrets = filtered.length;
        displaySecrets(paginatedSecrets);
        updatePaginationUI();
    }

    function displaySecrets(secrets) {
        if (secrets.length === 0) {
            showLoading(false);
            emptyContainer.style.display = allSecrets.length === 0 ? 'block' : 'none';
            tableContainer.style.display = 'none';
            return;
        }

        secretsTable.innerHTML = '';
        secrets.forEach((secret) => {
            const row = document.createElement('tr');
            const createdDate = new Date(secret.created).toLocaleString();
            const updatedDate = new Date(secret.updated).toLocaleString();
            const encodedName = encodeURIComponent(secret.name);

            row.innerHTML = (
                '<td class="secret-name">' + escapeHtml(secret.name) + '</td>' +
                '<td>' +
                '  <div class="secret-value-cell">' +
                '    <span class="secret-value masked" data-secret-name="' + encodedName + '">••••••••</span>' +
                '    <button class="toggle-visibility" data-action="toggle" data-secret-name="' + encodedName + '">👁</button>' +
                '  </div>' +
                '</td>' +
                '<td>' +
                '  <button class="status-badge status-toggle ' + (secret.enabled ? 'enabled' : 'disabled') + '" data-action="toggleEnabled" data-secret-name="' + encodedName + '" data-enabled="' + (secret.enabled ? 'true' : 'false') + '">' +
                (secret.enabled ? 'Enabled' : 'Disabled') +
                '  </button>' +
                '</td>' +
                '<td>' + updatedDate + '</td>' +
                '<td>' +
                '  <div class="actions">' +
                '    <button class="button-secondary" data-action="edit" data-secret-name="' + encodedName + '">Edit</button>' +
                '    <button class="button-danger" data-action="delete" data-secret-name="' + encodedName + '">Delete</button>' +
                '  </div>' +
                '</td>'
            );

            secretsTable.appendChild(row);
        });

        showLoading(false);
        emptyContainer.style.display = 'none';
        tableContainer.style.display = 'block';
    }

    function updatePaginationUI() {
        const maxPage = Math.ceil(totalSecrets / pageSize);
        pageInfo.textContent = 'Page ' + (currentPage + 1) + ' of ' + Math.max(1, maxPage);
        totalInfo.textContent = totalSecrets;
        prevBtn.disabled = currentPage === 0;
        nextBtn.disabled = (currentPage + 1) >= maxPage;
    }

    function showLoading(show) {
        loadingContainer.style.display = show ? 'block' : 'none';
    }

    secretsTable.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;

        const action = target.getAttribute('data-action');
        const encodedName = target.getAttribute('data-secret-name');
        if (!action || !encodedName) return;

        const secretName = decodeURIComponent(encodedName);
        if (action === 'toggle') {
            toggleVisibility(secretName);
        } else if (action === 'edit') {
            editSecret(secretName);
        } else if (action === 'delete') {
            deleteSecret(secretName);
        } else if (action === 'toggleEnabled') {
            const enabledValue = target.getAttribute('data-enabled') === 'true';
            toggleEnabled(secretName, enabledValue);
        }
    });

    function toggleVisibility(secretName) {
        const safeName = CSS.escape(encodeURIComponent(secretName));
        const selector = '[data-secret-name="' + safeName + '"]';
        const element = document.querySelector(selector);
        if (!element) return;
        if (element.classList.contains('masked')) {
            element.classList.remove('masked');
            const secret = allSecrets.find(s => s.name === secretName);
            if (!secret) return;
            element.textContent = escapeHtml(secret.value);
        } else {
            element.classList.add('masked');
            element.textContent = '••••••••';
        }
    }

    function editSecret(secretName) {
        vscode.postMessage({
            command: 'requestEditSecret',
            secretName: secretName,
        });
    }

    function deleteSecret(secretName) {
        vscode.postMessage({
            command: 'requestDeleteSecret',
            secretName: secretName,
        });
    }

    function toggleEnabled(secretName, enabled) {
        vscode.postMessage({
            command: 'requestToggleEnabled',
            secretName: secretName,
            enabled: enabled,
        });
    }

    function requestCreateSecret() {
        vscode.postMessage({
            command: 'requestCreateSecret',
        });
    }

    function previousPage() {
        if (currentPage > 0) {
            currentPage--;
            filterAndDisplay();
        }
    }

    function nextPage() {
        const maxPage = Math.ceil(totalSecrets / pageSize);
        if (currentPage < maxPage - 1) {
            currentPage++;
            filterAndDisplay();
        }
    }

    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    window.addEventListener('message', (event) => {
        const message = event.data;
        switch (message.command) {
            case 'secretsLoaded':
                allSecrets = message.data.secrets;
                totalSecrets = message.data.total ?? allSecrets.length;
                currentPage = message.page;
                updateSortUI();
                filterAndDisplay();
                break;
            case 'secretUpdated':
                showMessage("Secret '" + message.secretName + "' updated successfully", 'success');
                loadSecrets();
                break;
            case 'secretDeleted':
                showMessage("Secret '" + message.secretName + "' deleted successfully", 'success');
                loadSecrets();
                break;
            case 'error':
                showMessage(message.message, 'error');
                showLoading(false);
                break;
        }
    });
})();
