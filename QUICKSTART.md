# Quick Start Guide

Get started with One Key Vault UI in 5 minutes!

## 1. Installation

### Option A: Install from Pre-built VSIX

```bash
# Download the latest .vsix file and install:
# VS Code → Extensions → ... → Install from VSIX
```

### Option B: Build from Source

```bash
# Clone the repository
cd one-keyvault-ui

# Install dependencies
npm install

# Build the extension
npm run esbuild

# Package it
npm install -g vsce
vsce package

# Install the generated .vsix file
```

## 2. Prepare Azure Authentication

Choose one method:

### Azure CLI (Recommended)

```bash
az login
```

### Environment Variables

```bash
export AZURE_CLIENT_ID="your-client-id"
export AZURE_CLIENT_SECRET="your-client-secret"
export AZURE_TENANT_ID="your-tenant-id"
```

### VS Code Azure Account Extension

Install: `ms-vscode.azure-account` and sign in

## 3. Open the Extension

1. In VS Code, look at the left Activity Bar
2. Click the cloud icon (should appear after installation)
3. The "Key Vaults" panel opens in the sidebar

## 4. Add Your First Key Vault

1. Click **"+ Add Key Vault"** in the tree view
2. Enter your vault URL: `https://myvault.vault.azure.net/`
3. Enter a friendly name: `My Vault`
4. Press Enter

✅ Your vault is now added!

## 5. View Secrets

1. Click on the vault name in the tree
2. A new editor tab opens showing all secrets
3. Secrets are displayed in a table format

## 6. Common Tasks

### Search Secrets

- Type in the search box to find secrets by name

### Reveal Secret Value

- Click the eye icon (👁️) next to any secret

### Edit a Secret

1. Click the "Edit" button
2. Enter the new value
3. Confirm

### Delete a Secret

1. Click "Delete"
2. Confirm in the dialog

### Sort Secrets

- Click column headers to sort by Name, Created, or Updated

### Navigate Pages

- Use Previous/Next buttons at the bottom

## 7. Remove a Vault

1. Right-click on a vault in the tree
2. Click "Remove Key Vault"
3. Confirm

## Example Vault URLs

```
https://myproductionvault.vault.azure.net/
https://mydevvault.vault.azure.net/
https://test-secrets.vault.azure.net/
```

## Permissions Needed

Your Azure account needs these roles on the Key Vault:

- Key Vault Secrets Officer (can read, write, delete secrets)
- or Key Vault Administrator (full access)

Ask your Azure admin if you don't have these permissions.

## Troubleshooting

| Issue                  | Solution                                                             |
| ---------------------- | -------------------------------------------------------------------- |
| Extension not showing  | Reload VS Code (Ctrl+R)                                              |
| Can't authenticate     | Run `az login` or install Azure Account extension                    |
| Vault URL not accepted | Use format: `https://name.vault.azure.net/` (include trailing slash) |
| Secrets not loading    | Check your internet connection and vault URL                         |
| Access denied error    | Verify you have RBAC permissions on the vault                        |

## Tips

✨ **Pro Tips:**

- ⌨️ Use Ctrl+Shift+P to search for "Key Vault" commands
- 🔍 Search is case-insensitive and real-time
- 📌 Store vault names like "Prod Vault", "Dev Vault" for easy identification
- 🔐 Secret values are masked by default - they're only revealed when clicked
- ⚡ Click refresh button to sync latest changes from Azure

## Next Steps

- Read the full [README.md](README.md) for advanced features
- Check [Development Guide](#development) for contributing

## Support

Having issues? Check the troubleshooting section above or open an issue on GitHub.

Happy vault exploring! 🚀
