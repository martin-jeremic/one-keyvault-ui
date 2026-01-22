# Development Guide

Guide for developers working on One Key Vault UI extension.

## Project Setup

### Prerequisites

- Node.js 16+ and npm 8+
- VS Code 1.85+
- Git
- Azure CLI (for testing)

### Initial Setup

```bash
# Clone/navigate to project
cd one-keyvault-ui

# Install dependencies
npm install

# Build the project
npm run esbuild

# Start watch mode for development
npm run esbuild-watch
```

### First Debug Session

1. Press **F5** in VS Code
2. New VS Code window opens with extension loaded
3. Extension Host output shows in Debug Console
4. Make code changes - they auto-rebuild when saved
5. Press **Ctrl+R** in extension window to reload

---

## Project Structure

```
src/
├── extension.ts                    # Entry point
├── services/
│   └── keyVaultManager.ts          # Azure SDK wrapper
└── providers/
    ├── keyVaultTreeProvider.ts     # Tree view logic
    └── secretsWebViewProvider.ts   # Secrets editor UI
```

## Key Files Explained

### `extension.ts`

- **Purpose**: Extension lifecycle and command handlers
- **Key functions**:
  - `activate()` - Called when extension loads
  - `deactivate()` - Called when extension unloads
  - Command registration and message handlers

### `keyVaultManager.ts`

- **Purpose**: Wrapper around Azure Key Vault SDK
- **Methods**:
  - `getSecrets()` - Fetch secrets with pagination
  - `updateSecret()` - Modify a secret
  - `deleteSecret()` - Remove a secret
- **Uses**: @azure/identity, @azure/keyvault-secrets

### `keyVaultTreeProvider.ts`

- **Purpose**: Provides data for sidebar tree view
- **Implements**: vscode.TreeDataProvider interface
- **Key methods**:
  - `getChildren()` - Return tree items
  - `getTreeItem()` - Format display item

### `secretsWebViewProvider.ts`

- **Purpose**: HTML/CSS/JS UI for secrets viewer
- **Renders**: Interactive secrets table with search/sort/edit
- **Communication**: Message passing with extension core

---

## Development Workflow

### Making Changes

1. **Edit source file** in `src/`
2. **Auto-rebuild** happens automatically (with esbuild-watch)
3. **Reload extension** with Ctrl+R in debug window
4. **Test changes** in debug window

### Testing Changes

```bash
# Run in debug window (F5)
# Then test:
# 1. Add a vault
# 2. View secrets
# 3. Search secrets
# 4. Edit a secret
# 5. Delete a secret
# 6. Pagination
# 7. Sorting
# 8. Error cases
```

### Debugging Techniques

**Console Logging:**

```typescript
console.log("Debug info:", variable);
// Shows in Debug Console when running (F5)
```

**Breakpoints:**

1. Click line number to set breakpoint
2. Reload extension (Ctrl+R)
3. When breakpoint hit, execution pauses
4. Inspect variables in Variables panel

**Watch Expressions:**

1. Click "+" in Watch panel
2. Enter variable/expression
3. Value updates as code executes

---

## Adding New Features

### Example: Add a "Copy Secret" Button

**1. Update WebView HTML** (secretsWebViewProvider.ts)

```html
<button class="button-secondary" onclick="copySecret('${secretName}')">
  Copy
</button>
```

**2. Add JavaScript handler** (in same file)

```javascript
function copySecret(secretName) {
  const secret = allSecrets.find((s) => s.name === secretName);
  navigator.clipboard.writeText(secret.value);
  showMessage("Secret copied to clipboard", "success");
}
```

**3. No extension changes needed** if only modifying WebView

**4. Test:** Reload (Ctrl+R) and verify button works

### Example: Add a New Command

**1. Register command** (extension.ts)

```typescript
let myCommand = vscode.commands.registerCommand("oneKeyVault.myCommand", () => {
  vscode.window.showInformationMessage("Command executed!");
});
context.subscriptions.push(myCommand);
```

**2. Add to package.json**

```json
{
  "command": "oneKeyVault.myCommand",
  "title": "My Command"
}
```

**3. Call from elsewhere**

```typescript
vscode.commands.executeCommand("oneKeyVault.myCommand");
```

---

## Common Tasks

### Change UI Colors

Edit CSS in `secretsWebViewProvider.ts`:

```css
/* Uses VS Code theme colors */
background: var(--vscode-editor-background);
color: var(--vscode-editor-foreground);
border: 1px solid var(--vscode-panel-border);
```

[Full list of theme colors](https://code.visualstudio.com/api/references/theme-color)

### Add Input Validation

**In extension.ts:**

```typescript
const vault = await vscode.window.showInputBox({
  prompt: "Enter vault URL",
  validateInput: (value) => {
    if (!value.includes(".vault.azure.net")) {
      return "Invalid vault URL";
    }
    return null; // No error
  },
});
```

### Update Error Handling

**In keyVaultManager.ts:**

```typescript
try {
  // Azure operation
} catch (error) {
  if (error.code === "ResourceNotFound") {
    throw new Error("Vault not found");
  }
  throw error;
}
```

### Add Logging

**In extension.ts:**

```typescript
const outputChannel = vscode.window.createOutputChannel("One Key Vault");
outputChannel.appendLine("Info message");
outputChannel.show();
```

---

## Performance Optimization

### Current Performance

- Load secrets: 1-3s
- Search: <100ms
- Sort: <50ms

### If Slow:

**1. Profile code:**

```bash
npm run esbuild -- --analyze
```

**2. Check network:**

- Secrets size limit: 2 MB per secret
- Large vaults may take time

**3. Optimize queries:**

- Cache frequently accessed secrets
- Lazy-load secrets
- Implement virtual scrolling for large lists

### Memory Optimization

Currently stores all secrets in memory:

```typescript
let allSecrets = []; // Can be large
```

For large vaults, consider:

- Paginated loading from Azure
- Virtual scrolling
- Memory limits

---

## Testing

### Manual Testing

Test cases to verify before releases:

```
Authentication
  [ ] Azure CLI login works
  [ ] Azure Account extension login works

Vault Management
  [ ] Add vault with valid URL
  [ ] Add vault with invalid URL (shows error)
  [ ] Remove vault (with confirmation)
  [ ] Refresh vault list

Secrets Viewer
  [ ] Secrets load and display
  [ ] Empty vault shows message
  [ ] Pagination works
  [ ] Next/Previous buttons correct

Search & Sort
  [ ] Search filters by name
  [ ] Search is case-insensitive
  [ ] Sort by Name (ascending/descending)
  [ ] Sort by Created date
  [ ] Sort by Updated date

Secret Operations
  [ ] Eye icon reveals value
  [ ] Eye icon hides value (again)
  [ ] Edit button updates secret
  [ ] Delete button removes secret
  [ ] Delete confirmation works

Error Handling
  [ ] Invalid vault URL shows error
  [ ] Network error shows message
  [ ] Permission denied shows error
  [ ] Auth failure prompts login

UI/UX
  [ ] Extension loads without errors
  [ ] Sidebar panel shows correctly
  [ ] Editor panel displays properly
  [ ] All buttons are clickable
  [ ] Error messages are clear
  [ ] Loading states show
```

### Automated Testing (Future)

```typescript
// Test template
describe("KeyVaultManager", () => {
  it("should fetch secrets", async () => {
    const manager = new KeyVaultManager();
    const secrets = await manager.getSecrets("url");
    expect(secrets).toBeDefined();
  });
});
```

---

## Troubleshooting Development Issues

### Extension Not Updating

```bash
# Rebuild
npm run esbuild

# Reload window (Ctrl+R in debug window)
```

### TypeScript Errors

```bash
# Check types
npx tsc --noEmit

# Fix common issues
npm run esbuild
```

### Build Fails

```bash
# Clean and rebuild
rm -r out node_modules
npm install
npm run esbuild
```

### Debug Not Working

1. Close all VS Code windows
2. Delete `.vscode-test` folder
3. Press F5 to start fresh debug session

---

## Code Style

### TypeScript/JavaScript

- Use **const** by default, **let** for variables
- Use **arrow functions** for callbacks
- Add **type annotations** for function parameters
- Use **async/await** over promises

### Examples

**Good:**

```typescript
const getSecrets = async (vaultUrl: string): Promise<Secret[]> => {
  const client = this.getClient(vaultUrl);
  return await client.listSecrets();
};
```

**Avoid:**

```typescript
function getSecrets(vaultUrl) {
  return new Promise((resolve) => {
    // ...
  });
}
```

### Comments

**Good:**

```typescript
// Add up to 3 secrets per request
const MAX_SECRETS_PER_REQUEST = 3;
```

**Avoid:**

```typescript
// Set max
const max = 3;
```

---

## Debugging Azure SDK

### Enable Azure SDK Logging

```typescript
import { logger } from "@azure/logger";

logger.setLogLevel("debug");
logger.info("Debug info");
```

### Check Token

```typescript
const credential = new DefaultAzureCredential();
const token = await credential.getToken("https://vault.azure.net/.default");
console.log(token);
```

---

## Version Management

### Update Version

In `package.json`:

```json
{
  "version": "0.0.2" // Bump version
}
```

### Build Release

```bash
# Production build (optimized)
npm run vscode:prepublish

# Package
vsce package

# Creates: one-keyvault-ui-0.0.2.vsix
```

---

## Publishing to VS Code Marketplace

1. Create [Azure DevOps Personal Access Token](https://dev.azure.com/)
2. Setup vsce:

```bash
vsce login (publisher-name)
```

3. Publish:

```bash
vsce publish
```

Or test locally:

```bash
vsce package
code --install-extension one-keyvault-ui-*.vsix
```

---

## Resources

### VS Code Extension API

- [Extension API](https://code.visualstudio.com/api)
- [Theme Colors](https://code.visualstudio.com/api/references/theme-color)
- [Commands](https://code.visualstudio.com/api/extension-guides/command)

### Azure SDK

- [Azure Key Vault](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/keyvault)
- [Azure Identity](https://github.com/Azure/azure-sdk-for-js/tree/main/sdk/identity)

### TypeScript

- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

## Getting Help

1. **Check existing code** for examples
2. **Read error messages** carefully
3. **Search VS Code API** docs
4. **Check Azure SDK** examples
5. **Ask in discussions** or open issues

Happy coding! 🎉
