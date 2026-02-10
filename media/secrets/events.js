(function () {
    function onStatusFilterChange(event) {
        const state = window.OneKeyVault.state;
        state.statusFilter = event.target.value;
        state.currentPage = 0;
        window.OneKeyVault.render.filterAndDisplay();
    }

    function onSortHeaderClick(th) {
        const state = window.OneKeyVault.state;
        const field = th.dataset.sort;
        if (state.sortField === field) {
            state.sortDirection = state.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            state.sortField = field;
            state.sortDirection = 'asc';
        }
        window.OneKeyVault.render.updateSortUI();
        state.currentPage = 0;
        window.OneKeyVault.render.filterAndDisplay();
    }

    function onTableClick(event) {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;

        const action = target.getAttribute('data-action');
        const encodedName = target.getAttribute('data-secret-name');
        if (!action) return;

        if (action === 'removeTag') {
            removeTagRow(target);
            return;
        }

        if (!encodedName) return;
        const secretName = decodeURIComponent(encodedName);
        if (action === 'toggle') {
            toggleVisibility(secretName);
        } else if (action === 'edit') {
            window.OneKeyVault.actions.editSecret(secretName);
        } else if (action === 'delete') {
            window.OneKeyVault.actions.deleteSecret(secretName);
        } else if (action === 'toggleEnabled') {
            const enabledValue = target.getAttribute('data-enabled') === 'true';
            window.OneKeyVault.actions.toggleEnabled(secretName, enabledValue);
        } else if (action === 'toggleDetails') {
            toggleDetails(secretName);
        } else if (action === 'addTag') {
            addTagRow(secretName);
        } else if (action === 'saveDetails') {
            saveDetails(secretName);
        } else if (action === 'cancelDetails') {
            cancelDetails(secretName);
        }
    }

    function onTableChange(event) {
        const target = event.target;
        if (!(target instanceof HTMLElement)) return;

        const role = target.getAttribute('data-role');
        const encodedName = target.getAttribute('data-secret-name');
        if (!role || !encodedName) return;

        const secretName = decodeURIComponent(encodedName);
        if (role === 'notBeforeEnabled' || role === 'expiresOnEnabled') {
            toggleDateEnabled(secretName, role === 'notBeforeEnabled');
        } else if (role === 'notBefore' || role === 'expiresOn') {
            updateDateValue(secretName, role === 'notBefore');
        } else if (role === 'tagKey' || role === 'tagValue') {
            updateTags(secretName);
        }
    }

    function toggleVisibility(secretName) {
        const safeName = CSS.escape(encodeURIComponent(secretName));
        const selector = '[data-secret-name="' + safeName + '"]';
        const element = document.querySelector(selector);
        if (!element) return;
        if (element.classList.contains('masked')) {
            element.classList.remove('masked');
            const secret = window.OneKeyVault.state.allSecrets.find(s => s.name === secretName);
            if (!secret) return;
            element.textContent = window.OneKeyVault.render.escapeHtml(secret.value);
        } else {
            element.classList.add('masked');
            element.textContent = '••••••••';
        }
    }

    function toggleDetails(secretName) {
        const state = window.OneKeyVault.state;
        if (state.expandedSecretName === secretName) {
            state.expandedSecretName = null;
            delete state.editsBySecretName[secretName];
        } else {
            state.expandedSecretName = secretName;
        }
        window.OneKeyVault.render.filterAndDisplay();
    }

    function toggleDateEnabled(secretName, isNotBefore) {
        const selector = '[data-secret-name="' + encodeURIComponent(secretName) + '"]';
        const container = document.querySelector('.details-row' + selector);
        if (!container) return;

        const inputRole = isNotBefore ? 'notBefore' : 'expiresOn';
        const checkboxRole = isNotBefore ? 'notBeforeEnabled' : 'expiresOnEnabled';
        const checkbox = container.querySelector('[data-role="' + checkboxRole + '"]');
        const input = container.querySelector('[data-role="' + inputRole + '"]');
        if (!(checkbox instanceof HTMLInputElement) || !(input instanceof HTMLInputElement)) return;

        input.disabled = !checkbox.checked;
        if (!checkbox.checked) {
            input.value = '';
        }
        updateSecretDates(secretName);
    }

    function updateDateValue(secretName, isNotBefore) {
        updateSecretDates(secretName);
    }

    function updateSecretDates(secretName) {
        const selector = '[data-secret-name="' + encodeURIComponent(secretName) + '"]';
        const container = document.querySelector('.details-row' + selector);
        if (!container) return;

        const notBeforeEnabled = container.querySelector('[data-role="notBeforeEnabled"]');
        const notBeforeInput = container.querySelector('[data-role="notBefore"]');
        const expiresEnabled = container.querySelector('[data-role="expiresOnEnabled"]');
        const expiresInput = container.querySelector('[data-role="expiresOn"]');
        if (!(notBeforeEnabled instanceof HTMLInputElement) || !(notBeforeInput instanceof HTMLInputElement)) return;
        if (!(expiresEnabled instanceof HTMLInputElement) || !(expiresInput instanceof HTMLInputElement)) return;

        const notBefore = notBeforeEnabled.checked && notBeforeInput.value
            ? new Date(notBeforeInput.value).toISOString()
            : null;
        const expiresOn = expiresEnabled.checked && expiresInput.value
            ? new Date(expiresInput.value).toISOString()
            : null;

        const draft = ensureDraft(secretName);
        draft.notBefore = notBefore;
        draft.expiresOn = expiresOn;
    }

    function addTagRow(secretName) {
        const tagsContainer = document.querySelector('.details-row[data-secret-name="' + encodeURIComponent(secretName) + '"] .tags');
        if (!tagsContainer) return;
        const row = document.createElement('div');
        row.className = 'tag-row';
        row.innerHTML = (
            '<input class="tag-input" type="text" data-role="tagKey" placeholder="key">' +
            '<input class="tag-input" type="text" data-role="tagValue" placeholder="value">' +
            '<button class="button-secondary tag-remove" data-action="removeTag">Remove</button>'
        );
        tagsContainer.appendChild(row);
    }

    function removeTagRow(button) {
        const row = button.closest('.tag-row');
        if (!row) return;
        const detailsRow = button.closest('.details-row');
        if (!detailsRow) return;
        const encodedName = detailsRow.getAttribute('data-secret-name');
        if (!encodedName) return;
        row.remove();
        updateTags(decodeURIComponent(encodedName));
    }

    function updateTags(secretName) {
        const detailsRow = document.querySelector('.details-row[data-secret-name="' + encodeURIComponent(secretName) + '"]');
        if (!detailsRow) return;
        const tagRows = detailsRow.querySelectorAll('.tag-row');
        const tags = {};
        tagRows.forEach(row => {
            const keyInput = row.querySelector('[data-role="tagKey"]');
            const valueInput = row.querySelector('[data-role="tagValue"]');
            if (!(keyInput instanceof HTMLInputElement) || !(valueInput instanceof HTMLInputElement)) return;
            const key = keyInput.value.trim();
            if (!key) return;
            tags[key] = valueInput.value;
        });

        const draft = ensureDraft(secretName);
        draft.tags = tags;
    }

    function ensureDraft(secretName) {
        const state = window.OneKeyVault.state;
        if (!state.editsBySecretName[secretName]) {
            const secret = state.allSecrets.find(s => s.name === secretName);
            state.editsBySecretName[secretName] = {
                notBefore: secret && secret.notBefore ? new Date(secret.notBefore).toISOString() : null,
                expiresOn: secret && secret.expiresOn ? new Date(secret.expiresOn).toISOString() : null,
                tags: secret && secret.tags ? { ...secret.tags } : {}
            };
        }
        return state.editsBySecretName[secretName];
    }

    function saveDetails(secretName) {
        const state = window.OneKeyVault.state;
        const details = readDetailsState(secretName);
        window.OneKeyVault.actions.updateSecretProperties(secretName, {
            notBefore: details.notBefore,
            expiresOn: details.expiresOn,
            tags: details.tags
        });
        delete state.editsBySecretName[secretName];
    }

    function cancelDetails(secretName) {
        const state = window.OneKeyVault.state;
        delete state.editsBySecretName[secretName];
        window.OneKeyVault.render.filterAndDisplay();
    }

    function readDetailsState(secretName) {
        const detailsRow = document.querySelector('.details-row[data-secret-name="' + encodeURIComponent(secretName) + '"]');
        if (!detailsRow) {
            return { notBefore: null, expiresOn: null, tags: {} };
        }

        const notBeforeEnabled = detailsRow.querySelector('[data-role="notBeforeEnabled"]');
        const notBeforeInput = detailsRow.querySelector('[data-role="notBefore"]');
        const expiresEnabled = detailsRow.querySelector('[data-role="expiresOnEnabled"]');
        const expiresInput = detailsRow.querySelector('[data-role="expiresOn"]');

        let notBefore = null;
        let expiresOn = null;

        if (notBeforeEnabled instanceof HTMLInputElement && notBeforeInput instanceof HTMLInputElement) {
            if (notBeforeEnabled.checked && notBeforeInput.value) {
                notBefore = new Date(notBeforeInput.value).toISOString();
            }
        }

        if (expiresEnabled instanceof HTMLInputElement && expiresInput instanceof HTMLInputElement) {
            if (expiresEnabled.checked && expiresInput.value) {
                expiresOn = new Date(expiresInput.value).toISOString();
            }
        }

        const tagRows = detailsRow.querySelectorAll('.tag-row');
        const tags = {};
        tagRows.forEach(row => {
            const keyInput = row.querySelector('[data-role="tagKey"]');
            const valueInput = row.querySelector('[data-role="tagValue"]');
            if (!(keyInput instanceof HTMLInputElement) || !(valueInput instanceof HTMLInputElement)) return;
            const key = keyInput.value.trim();
            if (!key) return;
            tags[key] = valueInput.value;
        });

        return { notBefore, expiresOn, tags };
    }

    function onWindowMessage(event) {
        const message = event.data;
        switch (message.command) {
            case 'secretsLoaded':
                window.OneKeyVault.state.allSecrets = message.data.secrets;
                window.OneKeyVault.state.totalSecrets = message.data.total ?? window.OneKeyVault.state.allSecrets.length;
                window.OneKeyVault.state.currentPage = message.page;
                window.OneKeyVault.render.updateSortUI();
                window.OneKeyVault.render.filterAndDisplay();
                break;
            case 'secretUpdated':
                window.OneKeyVault.render.showMessage("Secret '" + message.secretName + "' updated successfully", 'success');
                window.OneKeyVault.actions.loadSecrets();
                break;
            case 'secretDeleted':
                window.OneKeyVault.render.showMessage("Secret '" + message.secretName + "' deleted successfully", 'success');
                window.OneKeyVault.actions.loadSecrets();
                break;
            case 'error':
                window.OneKeyVault.render.showMessage(message.message, 'error');
                window.OneKeyVault.render.showLoading(false);
                break;
        }
    }

    function previousPage() {
        if (window.OneKeyVault.state.currentPage > 0) {
            window.OneKeyVault.state.currentPage--;
            window.OneKeyVault.render.filterAndDisplay();
        }
    }

    function nextPage() {
        const maxPage = Math.ceil(window.OneKeyVault.state.totalSecrets / window.OneKeyVault.state.pageSize);
        if (window.OneKeyVault.state.currentPage < maxPage - 1) {
            window.OneKeyVault.state.currentPage++;
            window.OneKeyVault.render.filterAndDisplay();
        }
    }

    function bindEvents() {
        const dom = window.OneKeyVault.dom;

        dom.searchInput.addEventListener('input', window.OneKeyVault.render.filterAndDisplay);
        dom.statusFilter.addEventListener('change', onStatusFilterChange);
        dom.createBtn.addEventListener('click', window.OneKeyVault.actions.requestCreateSecret);
        dom.refreshBtn.addEventListener('click', window.OneKeyVault.actions.loadSecrets);
        dom.prevBtn.addEventListener('click', previousPage);
        dom.nextBtn.addEventListener('click', nextPage);
        dom.secretsTable.addEventListener('click', onTableClick);
        dom.secretsTable.addEventListener('change', onTableChange);

        document.querySelectorAll('th.sortable').forEach(th => {
            th.addEventListener('click', () => onSortHeaderClick(th));
        });

        window.addEventListener('message', onWindowMessage);
    }

    window.OneKeyVault = window.OneKeyVault || {};
    window.OneKeyVault.events = {
        bindEvents
    };
})();
