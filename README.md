# One Key Vault UI

Azure Key Vault explorer extension for VS Code with inline secret editing capabilities.

## Features

- 🔐 **Connect to Azure Key Vaults** - Add and manage multiple Key Vaults
- 📋 **Browse and list secrets** - View all secrets in a vault
- 🔍 **Search and filter secrets** - Find secrets quickly
- 📊 **Pagination and sorting** - Navigate through secrets with sorting options
- ✏️ **Inline secret editing** - Edit secret values directly
- 🗑️ **Delete secrets** - Remove secrets from the vault
- 👁️ **Toggle secret visibility** - Reveal/hide secret values for security

## Installation

### From Source

1. Clone or download this repository
2. Install dependencies:

```bash
npm install
```

3. Build the extension:

```bash
npm run esbuild
```

4. Package the extension (requires `vsce`):

```bash
npm install -g vsce
vsce package
```

5. Install in VS Code:
   - Go to Extensions (Ctrl+Shift+X)
   - Click the "..." menu
   - Select "Install from VSIX..."
   - Choose the generated `.vsix` file

## Development

### Prerequisites

- Node.js 16+
- npm or yarn
- Azure CLI or VS Code Azure extension for authentication

### Watch Mode

For continuous development:

```bash
npm run esbuild-watch
```

### Run Extension

1. Open the project in VS Code
2. Press `F5` to launch the extension in a new window
3. The extension will be loaded with the latest code

### Debug

- Set breakpoints in the source code
- Use VS Code's Debug console and variables inspector
- Check the Extension Host output for logs

## Usage

### Adding a Key Vault

1. Click the cloud icon in the Activity Bar (left sidebar) to open the Azure Key Vault explorer
2. Click the **"+ Add Key Vault"** button in the tree view
3. Enter your Key Vault URL in the format: `https://<vault-name>.vault.azure.net/`
4. Enter a friendly name for the vault
5. Click Enter to confirm

Example:

- URL: `https://myvault.vault.azure.net/`
- Name: `Production Vault`

### Viewing Secrets

1. Click on a Key Vault in the tree view to open the secrets editor
2. The secrets will be displayed in a table with:
   - **Name**: Secret name
   - **Value**: Secret value (masked by default)
   - **Status**: Enabled/Disabled badge
   - **Updated**: Last update timestamp
   - **Actions**: Edit and Delete buttons

### Searching Secrets

1. In the secrets view, type in the search box to filter secrets by name
2. Search is real-time and case-insensitive

### Sorting Secrets

1. Click on column headers to sort:
   - **Name**: Alphabetical order
   - **Created**: By creation date
   - **Updated**: By modification date
2. Click again to reverse sort direction (ascending/descending)

### Revealing Secret Values

1. Click the eye icon (👁️) next to a secret to reveal its value
2. Click again to hide the value
3. Values are masked by default for security

### Editing Secrets

1. Click the **Edit** button next to a secret
2. Enter the new value in the prompt dialog
3. Click OK to confirm
4. The secret will be updated in the Key Vault

### Deleting Secrets

1. Click the **Delete** button next to a secret
2. Confirm the deletion in the prompt
3. The secret will be permanently removed from the Key Vault

### Pagination

- Secrets are displayed 10 per page by default
- Use the **Previous** and **Next** buttons to navigate
- The page indicator shows current page and total secret count

### Removing a Key Vault

1. Right-click on a Key Vault in the tree view
2. Click **Remove Key Vault**
3. Confirm the removal
4. The vault will be removed from the extension (not from Azure)

## Authentication

The extension uses Azure Identity for authentication. Make sure you have one of the following configured:

### Option 1: Azure CLI (Recommended for local development)

```bash
az login
```

### Option 2: VS Code Azure Extension

Install the [Azure Account](https://marketplace.visualstudio.com/items?itemName=ms-vscode.azure-account) extension and sign in.

### Option 3: Environment Variables (Service Principal)

```bash
export AZURE_CLIENT_ID=your-client-id
export AZURE_CLIENT_SECRET=your-client-secret
export AZURE_TENANT_ID=your-tenant-id
```

### Option 4: Managed Identity (Azure VMs/Container Apps)

Automatically available when running on Azure resources.

## Permissions Required

Your Azure account needs the following permissions on the Key Vault:

- `Microsoft.KeyVault/vaults/read` - List vaults
- `Microsoft.KeyVault/vaults/secrets/read` - View secrets
- `Microsoft.KeyVault/vaults/secrets/write` - Edit secrets
- `Microsoft.KeyVault/vaults/secrets/delete` - Delete secrets

These are typically available with the "Key Vault Administrator" or "Key Vault Secrets Officer" roles.

## Configuration

The extension stores Key Vault URLs in VS Code's global settings (encrypted). No additional configuration is needed.

### Clear All Stored Vaults

To reset and clear all stored vaults:

1. Open Command Palette (Ctrl+Shift+P)
2. Type: `Developer: Set Context`
3. Search for `oneKeyVault.vaults` in settings
4. Clear the stored data

## Security Notes

⚠️ **Important Security Considerations:**

- Secret values are **masked by default** and only shown when you explicitly click the eye icon
- **Never share** secret values via screenshots, logs, or messages
- Ensure proper RBAC permissions on your Key Vault
- The extension caches secrets in memory for the current session
- Clear browser data periodically to remove any cached values
- Use Strong authentication (MFA recommended)

## Keyboard Shortcuts

- **F5** (in development) - Reload extension
- **Ctrl+Shift+P** - Open Command Palette
  - Search for "Key Vault" to see all available commands
- **Ctrl+K Ctrl+0** - Focus on Explorer
- **Ctrl+Shift+X** - Open Extensions

## Troubleshooting

### Extension doesn't appear in VS Code

- Make sure the `.vsix` file was properly installed
- Reload VS Code (Ctrl+R)
- Check Extensions panel to see if it's installed and enabled

### "Authentication required" error

- Run `az login` to authenticate with Azure CLI
- Or install and sign in with the [Azure Account](https://marketplace.visualstudio.com/items?itemName=ms-vscode.azure-account) extension

### Can't access Key Vault

- Verify the vault URL format: `https://<vault-name>.vault.azure.net/`
- Check that your Azure account has access to the vault
- Verify firewall/network rules aren't blocking access

### Secrets not loading

- Check the Output panel (View → Output) for error messages
- Select "Extension Host" from the dropdown
- Verify your Azure credentials are valid

### Slow performance

- Check your internet connection
- The extension fetches all secrets when opening a vault
- Large vaults may take longer to load

## Tips & Tricks

1. **Add frequently used vaults** to quickly switch between them
2. **Use meaningful names** for vaults to easily identify them
3. **Sort by "Updated"** to quickly find recently modified secrets
4. **Use search** to find secrets without scrolling through pagination
5. **Refresh** using the button in the title bar if you make changes outside the extension

## Known Limitations

- Currently supports Azure Key Vault's Secrets only (not Keys or Certificates)
- Maximum 10 secrets per page (configurable in future versions)
- Real-time sync not yet implemented - refresh manually if changes are made outside the extension
- Bulk operations not yet supported

## Future Enhancements

Planned features for future versions:

- [ ] Support for Azure Key Vault Keys and Certificates
- [ ] Bulk operations (delete, edit multiple secrets)
- [ ] Real-time secret sync across sessions
- [ ] Secret versioning and history
- [ ] Custom field mapping and tagging
- [ ] Export/Import functionality
- [ ] Scheduled secret rotation alerts
- [ ] Integration with GitHub Secrets

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -am 'Add my feature'`
4. Push to branch: `git push origin feature/my-feature`
5. Submit a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues, bugs, or feature requests, please open an issue on GitHub.

## Changelog

### v0.0.1 (Initial Release)

- Initial release with basic Key Vault connection
- Secret listing with pagination
- Search, sort, and filter capabilities
- Inline secret editing
- Secret deletion
- Add/remove vaults
- Secret visibility toggle
