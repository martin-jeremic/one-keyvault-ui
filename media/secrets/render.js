(function () {
    function updateSortUI() {
        document.querySelectorAll('th.sortable').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
        });
        const state = window.OneKeyVault.state;
        const activeTh = document.querySelector('th[data-sort="' + state.sortField + '"]');
        if (activeTh) {
            activeTh.classList.add('sort-' + state.sortDirection);
        }
    }

    function showMessage(message, type) {
        const dom = window.OneKeyVault.dom;
        const div = document.createElement('div');
        div.className = type || 'success';
        div.textContent = message;
        dom.messageContainer.innerHTML = '';
        dom.messageContainer.appendChild(div);
        setTimeout(() => {
            div.remove();
        }, 5000);
    }

    function showLoading(show) {
        const dom = window.OneKeyVault.dom;
        dom.loadingContainer.style.display = show ? 'block' : 'none';
    }

    function updatePaginationUI() {
        const state = window.OneKeyVault.state;
        const dom = window.OneKeyVault.dom;
        const maxPage = Math.ceil(state.totalSecrets / state.pageSize);
        dom.pageInfo.textContent = 'Page ' + (state.currentPage + 1) + ' of ' + Math.max(1, maxPage);
        dom.totalInfo.textContent = state.totalSecrets;
        dom.prevBtn.disabled = state.currentPage === 0;
        dom.nextBtn.disabled = (state.currentPage + 1) >= maxPage;
    }

    function renderSecretRow(secret) {
        const fragment = document.createDocumentFragment();
        const row = document.createElement('tr');
        const createdDate = new Date(secret.created).toLocaleString();
        const updatedDate = new Date(secret.updated).toLocaleString();
        const encodedName = encodeURIComponent(secret.name);
        const enabledClass = secret.enabled ? 'enabled' : 'disabled';
        const enabledText = secret.enabled ? 'Enabled' : 'Disabled';
        const escapeHtml = window.OneKeyVault.format.escapeHtml;
        const state = window.OneKeyVault.state;
        const isExpanded = state.expandedSecretName === secret.name;

        row.innerHTML = window.OneKeyVault.templates.renderSecretRowHtml({
            encodedName,
            escapedName: escapeHtml(secret.name),
            enabledClass,
            enabledText,
            enabledValue: secret.enabled ? 'true' : 'false',
            createdDate,
            updatedDate
        });

        fragment.appendChild(row);
        fragment.appendChild(renderDetailsRow(secret, isExpanded));

        return fragment;
    }

    function renderDetailsRow(secret, isExpanded) {
        const detailsRow = document.createElement('tr');
        const encodedName = encodeURIComponent(secret.name);
        detailsRow.className = 'details-row' + (isExpanded ? '' : ' hidden');
        detailsRow.setAttribute('data-secret-name', encodedName);

        const draft = getDraft(secret);
        const notBeforeValue = window.OneKeyVault.format.toLocalInputValue(draft.notBefore);
        const expiresOnValue = window.OneKeyVault.format.toLocalInputValue(draft.expiresOn);
        const notBeforeChecked = !!draft.notBefore;
        const expiresOnChecked = !!draft.expiresOn;
        const escapeHtml = window.OneKeyVault.format.escapeHtml;

        detailsRow.innerHTML = window.OneKeyVault.templates.renderDetailsRowHtml({
            encodedName,
            escapedId: escapeHtml(secret.id || '-'),
            notBeforeValue,
            expiresOnValue,
            notBeforeChecked,
            expiresOnChecked,
            tags: draft.tags || {}
        });

        return detailsRow;
    }

    function getDraft(secret) {
        const state = window.OneKeyVault.state;
        const existing = state.editsBySecretName[secret.name];
        if (existing) {
            return existing;
        }
        return {
            notBefore: secret.notBefore || null,
            expiresOn: secret.expiresOn || null,
            tags: secret.tags ? { ...secret.tags } : {}
        };
    }

    function displaySecrets(secrets) {
        const dom = window.OneKeyVault.dom;
        const state = window.OneKeyVault.state;

        if (secrets.length === 0) {
            showLoading(false);
            dom.emptyContainer.style.display = state.allSecrets.length === 0 ? 'block' : 'none';
            dom.tableContainer.style.display = 'none';
            return;
        }

        dom.secretsTable.innerHTML = '';
        secrets.forEach((secret) => {
            dom.secretsTable.appendChild(renderSecretRow(secret));
        });

        showLoading(false);
        dom.emptyContainer.style.display = 'none';
        dom.tableContainer.style.display = 'block';
    }

    function filterAndDisplay() {
        const state = window.OneKeyVault.state;
        const dom = window.OneKeyVault.dom;
        const searchTerm = dom.searchInput.value.toLowerCase();
        const filtered = state.allSecrets.filter(secret => {
            const matchesName = secret.name.toLowerCase().includes(searchTerm);
            if (!matchesName) return false;
            if (state.statusFilter === 'enabled') {
                return secret.enabled === true;
            }
            if (state.statusFilter === 'disabled') {
                return secret.enabled === false;
            }
            return true;
        });

        filtered.sort((a, b) => {
            let aVal = a[state.sortField];
            let bVal = b[state.sortField];

            if (state.sortField === 'created' || state.sortField === 'updated') {
                const aTime = new Date(aVal).getTime();
                const bTime = new Date(bVal).getTime();
                aVal = Number.isFinite(aTime) ? aTime : 0;
                bVal = Number.isFinite(bTime) ? bTime : 0;
            }
            if (state.sortField === 'status') {
                aVal = a.enabled ? 1 : 0;
                bVal = b.enabled ? 1 : 0;
            }

            const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
            return state.sortDirection === 'asc' ? comparison : -comparison;
        });

        const start = state.currentPage * state.pageSize;
        const end = start + state.pageSize;
        const paginatedSecrets = filtered.slice(start, end);

        state.totalSecrets = filtered.length;
        displaySecrets(paginatedSecrets);
        updatePaginationUI();
    }

    window.OneKeyVault = window.OneKeyVault || {};
    window.OneKeyVault.render = {
        updateSortUI,
        showMessage,
        showLoading,
        updatePaginationUI,
        renderSecretRow,
        displaySecrets,
        filterAndDisplay
    };
})();
