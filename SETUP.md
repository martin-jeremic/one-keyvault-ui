# One Key Vault UI - Setup & Installation Guide

## ✅ Project Status

The **One Key Vault UI** VS Code extension is ready for development and deployment!

### What's Included

✓ Full TypeScript source code  
✓ Compiled JavaScript bundles (in `out/` directory)  
✓ Package configuration  
✓ Complete documentation  
✓ Development setup  
✓ Azure SDK integration

---

## 🚀 Getting Started

### Step 1: Prepare Your System

Ensure you have:

- **VS Code** (v1.85.0 or later)
- **Node.js** (v16 or later)
- **npm** (v8 or later)
- **Azure Account** with access to Key Vault(s)

### Step 2: Verify Installation

Navigate to the project directory:

```bash
cd c:\Users\marti\Documents\projects\vscode-addon\one-keyvault-ui
```

Verify dependencies are installed:

```bash
npm list --depth=0
```

You should see:

- `@azure/identity`
- `@azure/keyvault-secrets`
- `typescript`
- `esbuild`
- And others

### Step 3: Verify Build

Check the compiled code exists:

```bash
ls out/
```

You should see:

- `extension.js` (1.0 MB)
- `extension.js.map` (2.3 MB)

---

## 🔧 Development Workflow

### Option A: Watch Mode (Recommended for Development)

```bash
# Start continuous build
npm run esbuild-watch
```

Then:

1. Press **F5** in VS Code to start debugger
2. Extension loads in new window
3. Code changes automatically rebuild
4. Reload (Ctrl+R) to test changes

### Option B: Manual Build

```bash
# Single build
npm run esbuild

# Then press F5 to debug
```

### Option C: Production Build

```bash
# Optimized/minified build
npm run vscode:prepublish

# Package for distribution
npm install -g vsce
vsce package
```

This creates `one-keyvault-ui-0.0.1.vsix`

---

## 📦 Installation Methods

### Method 1: Direct Installation (from VS Code)

1. In VS Code, open **Extensions** (Ctrl+Shift+X)
2. Click **...** menu
3. Select **Install from VSIX...**
4. Choose the `.vsix` file

### Method 2: Command Line Installation

```bash
# Install VSCE if not already installed
npm install -g vsce

# Package the extension
vsce package

# Install (VS Code must be closed)
code --install-extension one-keyvault-ui-0.0.1.vsix
```

### Method 3: Development Installation

1. Open the project folder in VS Code
2. Press **F5**
3. Extension loads in new window automatically

---

## 🔐 Azure Authentication Setup

### Choose ONE method below:

#### Method 1: Azure CLI (Easiest for Local Development)

```bash
# Login to Azure
az login

# Verify login
az account show
```

#### Method 2: VS Code Azure Extension

1. Install [Azure Account](https://marketplace.visualstudio.com/items?itemName=ms-vscode.azure-account) extension
2. Sign in via the extension

#### Method 3: Environment Variables (CI/CD)

```bash
# For Windows PowerShell:
$env:AZURE_CLIENT_ID = "your-client-id"
$env:AZURE_CLIENT_SECRET = "your-client-secret"
$env:AZURE_TENANT_ID = "your-tenant-id"

# For bash:
export AZURE_CLIENT_ID="your-client-id"
export AZURE_CLIENT_SECRET="your-client-secret"
export AZURE_TENANT_ID="your-tenant-id"
```

#### Method 4: Managed Identity (Azure Resources)

Automatically available when running on:

- Azure VMs
- App Service
- Container Apps
- Azure Functions

---

## 📋 First-Time Usage

### 1. After Installation

- Reload VS Code (Ctrl+R)
- You should see a **cloud icon** in Activity Bar
- Click it to open the extension

### 2. Add Your First Key Vault

1. In the "Key Vaults" panel, click **"+ Add Key Vault"**
2. Enter vault URL: `https://mykeyvault.vault.azure.net/`
3. Enter a name: `My Vault`
4. Press Enter

### 3. View Secrets

1. Click on the vault you added
2. Secrets display in a table
3. Interact with search, sort, edit, delete

---

## 🛠️ Available Commands

Run these from Command Palette (Ctrl+Shift+P):

```
One Key Vault UI: Add Key Vault
One Key Vault UI: Remove Key Vault
One Key Vault UI: Refresh
One Key Vault UI: Open Secrets
```

---

## 📂 Project Files Reference

| File                                      | Purpose                            |
| ----------------------------------------- | ---------------------------------- |
| `src/extension.ts`                        | Main entry point, command handlers |
| `src/services/keyVaultManager.ts`         | Azure Key Vault SDK wrapper        |
| `src/providers/keyVaultTreeProvider.ts`   | Sidebar tree view                  |
| `src/providers/secretsWebViewProvider.ts` | Secrets editor UI                  |
| `package.json`                            | Extension manifest & dependencies  |
| `tsconfig.json`                           | TypeScript configuration           |
| `out/extension.js`                        | Compiled code (generated)          |
| `README.md`                               | User documentation                 |
| `QUICKSTART.md`                           | Quick start guide                  |
| `ARCHITECTURE.md`                         | Technical architecture             |

---

## 🧪 Testing Checklist

After installation, verify these work:

- [ ] Extension appears in Activity Bar
- [ ] Clicking icon opens "Key Vaults" sidebar
- [ ] "Add Key Vault" button is clickable
- [ ] Can enter vault URL and name
- [ ] Vault appears in list
- [ ] Clicking vault opens secrets editor
- [ ] Search box filters secrets
- [ ] Column headers sort secrets
- [ ] Eye icon reveals/hides secret values
- [ ] Edit button updates secrets
- [ ] Delete button removes secrets
- [ ] Pagination buttons work
- [ ] Error messages display properly

---

## 🐛 Debugging

### Enable Debug Logging

In `src/extension.ts`, add:

```typescript
console.log("Debug message here");
```

### View Debug Output

1. Press F5 to start debugging
2. Open Debug Console (Ctrl+Shift+Y)
3. Logs appear in console

### Set Breakpoints

1. Click line numbers to set breakpoints
2. Code pauses at breakpoint during execution
3. Inspect variables in Variables panel

### Extension Host Output

View extension logs:

- In new VS Code window: View → Output
- Select "Extension Host" from dropdown

---

## 📚 Documentation Files

| File                | Content                               |
| ------------------- | ------------------------------------- |
| **README.md**       | Complete user guide with all features |
| **QUICKSTART.md**   | 5-minute getting started guide        |
| **ARCHITECTURE.md** | Technical design and architecture     |
| **SETUP.md**        | This file - installation and setup    |

---

## ⚙️ Configuration

### VS Code Settings

Settings stored in:

```
~/.config/Code/User/globalStorage/oneKeyVault/
```

Or access via:

1. Ctrl+Shift+P
2. Type "Preferences: Open Settings"
3. Search "oneKeyVault"

### Vault Storage

Vaults stored in VS Code global state (encrypted):

- Encrypted automatically by VS Code
- Persists across sessions
- Secure storage

---

## 🔄 Update & Maintenance

### Update Dependencies

```bash
# Check for updates
npm outdated

# Update packages
npm update

# Update TypeScript
npm install -g typescript@latest
```

### Rebuild After Updates

```bash
npm run esbuild
```

---

## 🆘 Troubleshooting

### Extension Not Showing

```bash
# Reload VS Code
Ctrl+R

# Or restart VS Code entirely
```

### Authentication Fails

```bash
# Verify Azure CLI login
az login
az account show

# Or verify VS Code Azure extension is signed in
# (click Azure icon in Activity Bar)
```

### Secrets Not Loading

1. Check extension output (View → Output)
2. Select "Extension Host" from dropdown
3. Look for error messages
4. Verify vault URL format: `https://name.vault.azure.net/`

### Build Errors

```bash
# Clean and rebuild
rm -r out
npm run esbuild

# Or in PowerShell:
Remove-Item -Path out -Recurse
npm run esbuild
```

---

## 📞 Support Resources

| Issue                         | Solution                           |
| ----------------------------- | ---------------------------------- |
| **"Extension not found"**     | Reinstall from VSIX                |
| **"Cannot access Key Vault"** | Check Azure login and permissions  |
| **"TypeScript errors"**       | Run `npm run esbuild` to recompile |
| **"Slow performance"**        | Check internet connection          |
| **"Secrets not displaying"**  | Click refresh button in sidebar    |

---

## 🎯 Next Steps

1. **Read** [QUICKSTART.md](QUICKSTART.md) for 5-minute setup
2. **Review** [README.md](README.md) for all features
3. **Explore** [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
4. **Start** using the extension!

---

## ✨ You're All Set!

The extension is ready to use. Click the cloud icon in VS Code and start managing your Azure Key Vaults securely and efficiently!

**Happy coding! 🚀**
