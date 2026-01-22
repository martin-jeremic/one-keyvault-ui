import * as vscode from 'vscode';
import { KeyVaultManager } from '../services/keyVaultManager';
import { KeyVaultTreeProvider } from './keyVaultTreeProvider';

export class SecretsWebViewProvider implements vscode.WebviewPanelSerializer {
  constructor(private keyVaultManager: KeyVaultManager, private treeProvider: KeyVaultTreeProvider) {}

  async deserializeWebviewPanel(webviewPanel: vscode.WebviewPanel, state: any): Promise<void> {
    if (state && state.vaultUrl) {
      webviewPanel.webview.html = this.getSecretsView(webviewPanel.webview, state.vaultUrl);
    }
  }

  getSecretsView(webview: vscode.Webview, vaultUrl: string): string {
    const nonce = getNonce();

    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}';">
    <title>Key Vault Secrets</title>
    <style nonce="${nonce}">
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
            padding: 16px;
            line-height: 1.6;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
        }

        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 24px;
            padding-bottom: 12px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }

        .header h1 {
            font-size: 20px;
            font-weight: 600;
        }

        .controls {
            display: flex;
            gap: 8px;
            align-items: center;
        }

        input[type="text"],
        select {
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            padding: 6px 10px;
            border-radius: 4px;
            font-size: 13px;
            font-family: inherit;
        }

        input[type="text"]:focus,
        select:focus {
            outline: none;
            border-color: var(--vscode-focusBorder);
        }

        button {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            padding: 6px 14px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            transition: background 0.2s;
        }

        button:hover {
            background: var(--vscode-button-hoverBackground);
        }

        button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }

        .button-secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }

        .button-secondary:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }

        .button-danger {
            background: #e81e63;
        }

        .button-danger:hover {
            background: #c2185b;
        }

        .loading {
            text-align: center;
            padding: 32px;
            color: var(--vscode-descriptionForeground);
        }

        .error {
            background: var(--vscode-inputValidation-errorBackground);
            color: var(--vscode-inputValidation-errorForeground);
            border: 1px solid var(--vscode-inputValidation-errorBorder);
            padding: 12px;
            border-radius: 4px;
            margin-bottom: 16px;
        }

        .success {
            background: var(--vscode-inputValidation-infoBackground);
            color: var(--vscode-inputValidation-infoForeground);
            border: 1px solid var(--vscode-inputValidation-infoBorder);
            padding: 12px;
            border-radius: 4px;
            margin-bottom: 16px;
        }

        .table-wrapper {
            overflow-x: auto;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 4px;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 13px;
        }

        thead {
            background: var(--vscode-list-hoverBackground);
        }

        th {
            padding: 12px;
            text-align: left;
            font-weight: 600;
            border-bottom: 1px solid var(--vscode-panel-border);
            cursor: pointer;
            user-select: none;
        }

        th:hover {
            background: var(--vscode-list-focusBackground);
        }

        th.sortable::after {
            content: '';
            display: inline-block;
            margin-left: 6px;
            opacity: 0.5;
        }

        th.sort-asc::after {
            content: '▲';
            opacity: 1;
        }

        th.sort-desc::after {
            content: '▼';
            opacity: 1;
        }

        tbody tr {
            border-bottom: 1px solid var(--vscode-panel-border);
            transition: background 0.1s;
        }

        tbody tr:hover {
            background: var(--vscode-list-hoverBackground);
        }

        td {
            padding: 12px;
            vertical-align: middle;
        }

        .secret-name {
            font-weight: 500;
            font-family: 'Monaco', 'Courier New', monospace;
            color: var(--vscode-symbolIcon-variableForeground);
        }

        .secret-value-cell {
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .secret-value {
            font-family: 'Monaco', 'Courier New', monospace;
            font-size: 12px;
            background: var(--vscode-textCodeBlock-background);
            padding: 4px 8px;
            border-radius: 3px;
            max-width: 300px;
            word-break: break-all;
            flex: 1;
        }

        .secret-value.masked::after {
            content: '••••••••';
            margin-left: 4px;
        }

        .toggle-visibility {
            background: transparent;
            border: none;
            color: var(--vscode-icon-foreground);
            cursor: pointer;
            padding: 2px;
            font-size: 14px;
        }

        .toggle-visibility:hover {
            background: var(--vscode-list-hoverBackground);
        }

        .inline-edit {
            display: flex;
            gap: 4px;
        }

        .inline-edit input {
            flex: 1;
        }

        .actions {
            display: flex;
            gap: 8px;
        }

        .pagination {
            display: flex;
            justify-content: center;
            gap: 8px;
            margin-top: 24px;
            padding-top: 16px;
            border-top: 1px solid var(--vscode-panel-border);
            align-items: center;
        }

        .pagination button {
            min-width: 36px;
            height: 36px;
            padding: 0;
        }

        .pagination .info {
            color: var(--vscode-descriptionForeground);
            margin: 0 12px;
        }

        .empty-state {
            text-align: center;
            padding: 48px 16px;
            color: var(--vscode-descriptionForeground);
        }

        .status-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 3px;
            font-size: 11px;
            font-weight: 500;
            background: var(--vscode-list-hoverBackground);
        }

        .status-badge.enabled {
            background: #31a24c;
            color: white;
        }

        .status-badge.disabled {
            background: #cc3333;
            color: white;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Secrets</h1>
            <div class="controls">
                <input type="text" id="searchInput" placeholder="Search secrets...">
                <select id="sortBy">
                    <option value="name">Sort by Name</option>
                    <option value="created">Sort by Created</option>
                    <option value="updated">Sort by Updated</option>
                </select>
                <button id="refreshBtn" class="button-secondary">Refresh</button>
            </div>
        </div>

        <div id="messageContainer"></div>

        <div id="loadingContainer" class="loading" style="display: none;">
            Loading secrets...
        </div>

        <div id="emptyContainer" class="empty-state" style="display: none;">
            <p>No secrets found in this Key Vault</p>
        </div>

        <div id="tableContainer" style="display: none;">
            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th class="sortable" data-sort="name">Name</th>
                            <th>Value</th>
                            <th>Status</th>
                            <th>Updated</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="secretsTable">
                    </tbody>
                </table>
            </div>

            <div class="pagination">
                <button id="prevBtn" class="button-secondary">← Previous</button>
                <span class="info">
                    <span id="pageInfo">Page 1</span>
                    (<span id="totalInfo">0</span> total)
                </span>
                <button id="nextBtn" class="button-secondary">Next →</button>
            </div>
        </div>
    </div>

    <script nonce="${nonce}">
        const vscode = acquireVsCodeApi();
        const vaultUrl = '${vaultUrl}';

        let currentPage = 0;
        const pageSize = 10;
        let totalSecrets = 0;
        let allSecrets = [];
        let sortField = 'name';
        let sortDirection = 'asc';
        let editingRow = null;

        // DOM elements
        const loadingContainer = document.getElementById('loadingContainer');
        const emptyContainer = document.getElementById('emptyContainer');
        const tableContainer = document.getElementById('tableContainer');
        const secretsTable = document.getElementById('secretsTable');
        const searchInput = document.getElementById('searchInput');
        const sortBySelect = document.getElementById('sortBy');
        const refreshBtn = document.getElementById('refreshBtn');
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        const pageInfo = document.getElementById('pageInfo');
        const totalInfo = document.getElementById('totalInfo');
        const messageContainer = document.getElementById('messageContainer');

        // Initialize
        loadSecrets();

        // Event listeners
        searchInput.addEventListener('input', filterAndDisplay);
        sortBySelect.addEventListener('change', (e) => {
            sortField = e.target.value;
            sortDirection = 'asc';
            currentPage = 0;
            filterAndDisplay();
        });
        refreshBtn.addEventListener('click', loadSecrets);
        prevBtn.addEventListener('click', previousPage);
        nextBtn.addEventListener('click', nextPage);

        // Add click listeners to sortable headers
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
            const activeTh = document.querySelector(\`th[data-sort="\${sortField}"]\`);
            if (activeTh) {
                activeTh.classList.add(\`sort-\${sortDirection}\`);
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

            // Sort
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

            // Paginate
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
            secrets.forEach((secret, index) => {
                const row = document.createElement('tr');
                const isEditing = editingRow === secret.name;

                const createdDate = new Date(secret.created).toLocaleString();
                const updatedDate = new Date(secret.updated).toLocaleString();

                row.innerHTML = \`
                    <td class="secret-name">\${escapeHtml(secret.name)}</td>
                    <td>
                        <div class="secret-value-cell">
                            <span class="secret-value masked" data-secret-id="\${index}">••••••••</span>
                            <button class="toggle-visibility" onclick="toggleVisibility(\${index}, '\${escapeHtml(secret.name)}')">👁</button>
                        </div>
                    </td>
                    <td>
                        <span class="status-badge \${secret.enabled ? 'enabled' : 'disabled'}">
                            \${secret.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                    </td>
                    <td>\${updatedDate}</td>
                    <td>
                        <div class="actions">
                            <button class="button-secondary" onclick="editSecret('\${escapeHtml(secret.name)}')">Edit</button>
                            <button class="button-danger" onclick="deleteSecret('\${escapeHtml(secret.name)}')">Delete</button>
                        </div>
                    </td>
                \`;

                secretsTable.appendChild(row);
            });

            showLoading(false);
            emptyContainer.style.display = 'none';
            tableContainer.style.display = 'block';
        }

        function updatePaginationUI() {
            const maxPage = Math.ceil(totalSecrets / pageSize);
            pageInfo.textContent = \`Page \${currentPage + 1} of \${Math.max(1, maxPage)}\`;
            totalInfo.textContent = totalSecrets;
            prevBtn.disabled = currentPage === 0;
            nextBtn.disabled = (currentPage + 1) >= maxPage;
        }

        function showLoading(show) {
            loadingContainer.style.display = show ? 'block' : 'none';
        }

        function toggleVisibility(index, secretName) {
            const element = document.querySelector(\`[data-secret-id="\${index}"]\`);
            if (element.classList.contains('masked')) {
                element.classList.remove('masked');
                const secret = allSecrets.find(s => s.name === secretName);
                element.textContent = escapeHtml(secret.value);
            } else {
                element.classList.add('masked');
                element.textContent = '••••••••';
            }
        }

        function editSecret(secretName) {
            vscode.postMessage({
                command: 'updateSecret',
                secretName: secretName,
                secretValue: prompt(\`Enter new value for '\${secretName}':\`),
            });
        }

        function deleteSecret(secretName) {
            if (confirm(\`Are you sure you want to delete '\${secretName}'?\`)) {
                vscode.postMessage({
                    command: 'deleteSecret',
                    secretName: secretName,
                });
            }
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

        // Handle messages from extension
        window.addEventListener('message', (event) => {
            const message = event.data;
            switch (message.command) {
                case 'secretsLoaded':
                    allSecrets = message.data.secrets;
                    currentPage = message.page;
                    updateSortUI();
                    filterAndDisplay();
                    break;
                case 'secretUpdated':
                    showMessage(\`Secret '\${message.secretName}' updated successfully\`, 'success');
                    loadSecrets();
                    break;
                case 'secretDeleted':
                    showMessage(\`Secret '\${message.secretName}' deleted successfully\`, 'success');
                    loadSecrets();
                    break;
                case 'error':
                    showMessage(message.message, 'error');
                    showLoading(false);
                    break;
            }
        });
    </script>
</body>
</html>`;
  }
}

function getNonce(): string {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
