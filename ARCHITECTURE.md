# One Key Vault UI - Project Documentation

## Project Overview

**One Key Vault UI** is a Visual Studio Code extension that provides a user-friendly interface for managing Azure Key Vault secrets. It allows developers to browse, search, edit, and delete secrets directly from VS Code without leaving their development environment.

## Architecture

### Project Structure

```
one-keyvault-ui/
├── .vscode/
│   ├── launch.json          # VS Code debug configuration
│   ├── tasks.json           # Build and watch tasks
│   ├── settings.json        # Extension settings
│   └── extensions.json      # Recommended extensions
├── src/
│   ├── extension.ts         # Main extension entry point
│   ├── services/
│   │   └── keyVaultManager.ts    # Azure Key Vault API client
│   └── providers/
│       ├── keyVaultTreeProvider.ts    # Tree view provider for vaults
│       └── secretsWebViewProvider.ts  # WebView provider for secrets editor
├── out/                     # Compiled JavaScript (generated)
├── package.json            # Extension manifest
├── tsconfig.json           # TypeScript configuration
├── README.md               # Main documentation
├── QUICKSTART.md           # Quick start guide
├── .gitignore              # Git ignore rules
└── LICENSE                 # MIT License
```

### Key Components

#### 1. **Extension Core** (`src/extension.ts`)

- Activates the extension and registers commands
- Manages tree view and webview panels
- Handles user interactions and commands
- Stores vault configuration in VS Code global state

#### 2. **Key Vault Manager** (`src/services/keyVaultManager.ts`)

- Authenticates with Azure using DefaultAzureCredential
- Manages connections to multiple Key Vaults
- Handles CRUD operations (Create, Read, Update, Delete)
- Implements pagination and caching

#### 3. **Tree View Provider** (`src/providers/keyVaultTreeProvider.ts`)

- Displays list of added Key Vaults in sidebar
- Handles vault selection and item rendering
- Provides context menu actions

#### 4. **Secrets WebView Provider** (`src/providers/secretsWebViewProvider.ts`)

- Renders interactive secrets editor UI
- Handles search, sort, and pagination
- Manages inline secret editing
- Communicates with extension core via messages

## Data Flow

```
User Action (UI)
    ↓
WebView Component (HTML/CSS/JS)
    ↓
postMessage() → Extension Core
    ↓
Key Vault Manager (Azure SDK)
    ↓
Azure Key Vault API
    ↓
Response → postMessage() back to WebView
    ↓
UI Updated
```

## Technologies Used

### Frontend

- **HTML/CSS/JavaScript** - WebView UI
- **VS Code API** - Integration with VS Code
- **Theme Colors** - Native VS Code theming

### Backend

- **TypeScript** - Type-safe code
- **Node.js** - Runtime environment
- **esbuild** - Fast bundling

### Azure Integration

- **@azure/keyvault-secrets** - Key Vault SDK
- **@azure/identity** - Authentication (DefaultAzureCredential)

### Development Tools

- **npm** - Package manager
- **TypeScript Compiler** - Type checking
- **ESBuild** - Bundler and minifier
- **VS Code Extension API** - Extension framework

## Features

### User-Facing Features

1. **Vault Management**
   - Add multiple Key Vaults by URL
   - Remove vaults from the extension
   - Refresh vault list

2. **Secret Browsing**
   - List all secrets in a vault
   - View secret metadata (status, updated date)
   - Pagination (10 secrets per page)

3. **Secret Search & Filter**
   - Real-time search by secret name
   - Case-insensitive filtering
   - Instant results

4. **Secret Sorting**
   - Sort by Name, Created, or Updated
   - Ascending/Descending order
   - Column header UI indicators

5. **Secret Editing**
   - Inline secret value editing
   - Update secrets directly in Azure
   - Immediate feedback

6. **Secret Visibility**
   - Toggle secret visibility (eye icon)
   - Secrets masked by default
   - Security-first approach

7. **Secret Deletion**
   - Delete secrets with confirmation
   - Permanent removal

## Authentication Flow

```
VS Code Extension
    ↓
DefaultAzureCredential (Azure Identity SDK)
    ↓
Tries (in order):
1. Environment Variables (AZURE_*)
2. Shared Token Cache (CLI/Azure Account)
3. Managed Identity (Azure resources)
4. Interactive Login
    ↓
Access Token
    ↓
Key Vault API Requests
```

## API Integration

### Methods

```typescript
// List all secrets
keyVaultManager.getSecrets(vaultUrl, page, pageSize);
// Returns: SecretsPage with pagination info

// Update a secret
keyVaultManager.updateSecret(vaultUrl, secretName, value);
// Returns: void (throws on error)

// Delete a secret
keyVaultManager.deleteSecret(vaultUrl, secretName);
// Returns: void (throws on error)
```

## WebView Communication

### Extension → WebView

```typescript
panel.webview.postMessage({
  command: "secretsLoaded",
  data: secrets,
  page: currentPage,
  pageSize: pageSize,
});
```

### WebView → Extension

```javascript
vscode.postMessage({
  command: "loadSecrets",
  page: 0,
  pageSize: 10,
});
```

## Commands

| Command                      | Description         |
| ---------------------------- | ------------------- |
| `oneKeyVault.addKeyVault`    | Add a new Key Vault |
| `oneKeyVault.removeKeyVault` | Remove a Key Vault  |
| `oneKeyVault.openSecrets`    | Open secrets viewer |
| `oneKeyVault.refresh`        | Refresh vault list  |

## VS Code UI Integration

### Activity Bar

- Cloud icon triggers vault explorer

### Sidebar

- Tree view showing added vaults
- Add/Remove vault buttons
- Context menu actions

### Editor

- WebView panel for secrets
- Full screen display
- Interactive UI with search/sort

## Security Considerations

1. **Secret Masking** - Secrets hidden by default
2. **Authentication** - Uses Azure SDK with secure token cache
3. **No Persistent Storage** - Secrets only in memory during session
4. **RBAC** - Respects Azure RBAC permissions
5. **Network** - HTTPS only, Azure-managed encryption

## Development

### Setup

```bash
npm install
npm run esbuild
```

### Watch Mode

```bash
npm run esbuild-watch
```

### Debug

- Press F5 in VS Code
- Extension launches in new window
- Set breakpoints and inspect

### Build for Release

```bash
npm run vscode:prepublish
```

### Package

```bash
vsce package
```

## Performance Characteristics

- **Startup Time**: < 1s
- **Vault List Load**: Instant (from extension state)
- **Secrets Load**: 1-3s (depends on vault size)
- **Search**: < 100ms (local filtering)
- **Sort**: < 50ms (local sorting)
- **Edit/Delete**: 1-2s (API latency)

## Known Limitations

1. Only supports Key Vault **Secrets** (not Keys or Certificates)
2. Maximum 10 secrets per page
3. No real-time sync with other clients
4. Bulk operations not supported
5. No scheduled secret rotation

## Future Enhancements

- [ ] Support for Keys and Certificates
- [ ] Bulk operations
- [ ] Real-time sync
- [ ] Secret versioning
- [ ] Export/Import
- [ ] Secret rotation alerts
- [ ] Custom pagination size
- [ ] Advanced filtering

## Testing

### Manual Testing Checklist

- [ ] Extension installs without errors
- [ ] Sidebar shows with vault explorer
- [ ] Can add a vault
- [ ] Can remove a vault
- [ ] Vault secrets display correctly
- [ ] Search filters work
- [ ] Sort by columns works
- [ ] Pagination works
- [ ] Eye icon toggles visibility
- [ ] Can edit a secret
- [ ] Can delete a secret
- [ ] Error messages display correctly
- [ ] Refresh button works

### Browser Compatibility

N/A - VS Code extension uses native WebView, not browser.

## Dependencies

### Production

- `@azure/identity@^4.0.0` - Azure authentication
- `@azure/keyvault-secrets@^4.7.0` - Key Vault SDK

### Development

- `@types/node@^20.0.0` - Node.js types
- `@types/vscode@^1.85.0` - VS Code API types
- `typescript@^5.0.0` - TypeScript compiler
- `esbuild@^0.19.0` - Bundler
- `eslint@^8.0.0` - Linter

## License

MIT License - Open source and free to use

## Contributing

Contributions welcome! Areas:

- Bug fixes
- Performance improvements
- New features
- Documentation improvements
- Localization

## Support

- Issues: GitHub Issues
- Discussions: GitHub Discussions
- Security: Report privately to maintainers

## Changelog

### v0.0.1 (Initial)

- Initial release
- Basic vault management
- Secret listing and editing
- Search, sort, pagination
- Inline editing and deletion
