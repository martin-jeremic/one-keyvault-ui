(function () {
    function renderTagRowHtml(key, value) {
        const escapedKey = window.OneKeyVault.format.escapeHtml(key || '');
        const escapedValue = window.OneKeyVault.format.escapeHtml(value || '');
        return (
            '<div class="tag-row">' +
            '  <input class="tag-input" type="text" data-role="tagKey" value="' + escapedKey + '" placeholder="key">' +
            '  <input class="tag-input" type="text" data-role="tagValue" value="' + escapedValue + '" placeholder="value">' +
            '  <button class="button-secondary tag-remove" data-action="removeTag">Remove</button>' +
            '</div>'
        );
    }

    function renderTagsHtml(tags) {
        const keys = Object.keys(tags || {});
        if (keys.length === 0) {
            return renderTagRowHtml('', '');
        }
        return keys.map(key => renderTagRowHtml(key, tags[key])).join('');
    }

    function renderSecretRowHtml(data) {
        return (
            '<td class="secret-name">' +
            '  <button class="secret-name-button" data-action="toggleDetails" data-secret-name="' + data.encodedName + '">' +
            data.escapedName +
            '  </button>' +
            '</td>' +
            '<td>' +
            '  <div class="secret-value-cell">' +
            '    <span class="secret-value masked" data-secret-name="' + data.encodedName + '">••••••••</span>' +
            '    <button class="toggle-visibility" data-action="toggle" data-secret-name="' + data.encodedName + '">👁</button>' +
            '  </div>' +
            '</td>' +
            '<td>' +
            '  <button class="status-badge status-toggle ' + data.enabledClass + '" data-action="toggleEnabled" data-secret-name="' + data.encodedName + '" data-enabled="' + data.enabledValue + '">' +
            data.enabledText +
            '  </button>' +
            '</td>' +
            '<td>' + data.createdDate + '</td>' +
            '<td>' + data.updatedDate + '</td>' +
            '<td>' +
            '  <div class="actions">' +
            '    <button class="button-secondary" data-action="edit" data-secret-name="' + data.encodedName + '">Edit</button>' +
            '    <button class="button-danger" data-action="delete" data-secret-name="' + data.encodedName + '">Delete</button>' +
            '  </div>' +
            '</td>'
        );
    }

    function renderDetailsRowHtml(data) {
        return (
            '<td colspan="6">' +
            '  <div class="details-container">' +
            '    <div class="details-section">' +
            '      <div class="details-label">Secret Identifier</div>' +
            '      <div class="details-value">' + data.escapedId + '</div>' +
            '    </div>' +
            '    <div class="details-grid">' +
            '      <label class="details-field">' +
            '        <input type="checkbox" data-role="notBeforeEnabled" data-secret-name="' + data.encodedName + '"' + (data.notBeforeChecked ? ' checked' : '') + '>' +
            '        Activation Date' +
            '      </label>' +
            '      <input type="datetime-local" data-role="notBefore" data-secret-name="' + data.encodedName + '" value="' + data.notBeforeValue + '"' + (data.notBeforeChecked ? '' : ' disabled') + '>' +
            '      <label class="details-field">' +
            '        <input type="checkbox" data-role="expiresOnEnabled" data-secret-name="' + data.encodedName + '"' + (data.expiresOnChecked ? ' checked' : '') + '>' +
            '        Expiration Date' +
            '      </label>' +
            '      <input type="datetime-local" data-role="expiresOn" data-secret-name="' + data.encodedName + '" value="' + data.expiresOnValue + '"' + (data.expiresOnChecked ? '' : ' disabled') + '>' +
            '    </div>' +
            '    <div class="details-section">' +
            '      <div class="details-label">Tags</div>' +
            '      <div class="tags" data-secret-name="' + data.encodedName + '">' +
            renderTagsHtml(data.tags || {}) +
            '      </div>' +
            '      <div class="details-actions">' +
            '        <button class="button-secondary tag-add" data-action="addTag" data-secret-name="' + data.encodedName + '">Add Tag</button>' +
            '        <button class="button-secondary" data-action="cancelDetails" data-secret-name="' + data.encodedName + '">Cancel</button>' +
            '        <button class="button-primary" data-action="saveDetails" data-secret-name="' + data.encodedName + '">Save</button>' +
            '      </div>' +
            '    </div>' +
            '  </div>' +
            '</td>'
        );
    }

    window.OneKeyVault = window.OneKeyVault || {};
    window.OneKeyVault.templates = {
        renderTagRowHtml,
        renderTagsHtml,
        renderSecretRowHtml,
        renderDetailsRowHtml
    };
})();
