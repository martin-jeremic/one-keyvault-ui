# One Key Vault UI - Project Index

## 📍 Quick Navigation

### 🚀 Start Here

- **[COMPLETED.md](COMPLETED.md)** - Project status and overview (READ FIRST!)
- **[QUICKSTART.md](QUICKSTART.md)** - Get running in 5 minutes

### 📖 Documentation

1. **[README.md](README.md)** - Complete user guide and features
2. **[SETUP.md](SETUP.md)** - Installation and authentication setup
3. **[ARCHITECTURE.md](ARCHITECTURE.md)** - Technical design and architecture
4. **[DEVELOPMENT.md](DEVELOPMENT.md)** - Developer guide for customization

### 🔧 Development

- **src/** - Source code directory
  - `extension.ts` - Main extension entry point
  - `services/keyVaultManager.ts` - Azure Key Vault wrapper
  - `providers/keyVaultTreeProvider.ts` - Tree view implementation
  - `providers/secretsWebViewProvider.ts` - WebView UI

- **package.json** - Project manifest and dependencies
- **tsconfig.json** - TypeScript configuration
- **.vscode/** - VS Code settings and launch configuration

### 🏗️ Build Output

- **out/** - Compiled JavaScript (generated)
  - `extension.js` - Bundled extension code
  - `extension.js.map` - Source map for debugging

---

## 📋 Quick Commands

```bash
# Install dependencies
npm install

# Build extension
npm run esbuild

# Watch mode (continuous build)
npm run esbuild-watch

# Production build (optimized)
npm run vscode:prepublish

# Package for distribution
vsce package

# Run in VS Code debugger
Press F5 in VS Code
```

---

## 📊 Project Overview

### What Is It?

A VS Code extension for managing Azure Key Vault secrets directly in the editor.

### Key Features

✓ Browse Key Vaults  
✓ List secrets with pagination  
✓ Search and sort secrets  
✓ Reveal/hide secret values  
✓ Edit secret values inline  
✓ Delete secrets  
✓ Add/remove vaults

### Technology

- **Language**: TypeScript
- **Framework**: VS Code Extension API
- **Azure**: Key Vault SDK
- **Build**: esbuild

---

## 🎯 Common Tasks

### I want to...

#### ...use the extension

1. Read [QUICKSTART.md](QUICKSTART.md)
2. Run `npm install` (if needed)
3. Press F5 to launch
4. Add a Key Vault
5. Start managing secrets!

#### ...customize the UI

1. Read [DEVELOPMENT.md](DEVELOPMENT.md)
2. Edit files in `src/providers/secretsWebViewProvider.ts`
3. Run `npm run esbuild-watch`
4. Press Ctrl+R in extension window to reload

#### ...add a new feature

1. Read [ARCHITECTURE.md](ARCHITECTURE.md)
2. Read [DEVELOPMENT.md](DEVELOPMENT.md)
3. Edit relevant source file in `src/`
4. Test with F5 and Ctrl+R
5. Rebuild with `npm run esbuild`

#### ...package for distribution

1. Build: `npm run vscode:prepublish`
2. Package: `vsce package`
3. Share the `.vsix` file

#### ...deploy to marketplace

1. Follow [SETUP.md](SETUP.md) publishing section
2. Create Azure DevOps token
3. Run `vsce publish`

#### ...troubleshoot an issue

1. Check [SETUP.md](SETUP.md) troubleshooting section
2. Check [DEVELOPMENT.md](DEVELOPMENT.md) debugging section
3. Look at VS Code Output panel (Extension Host)

---

## 📁 File Guide

### Source Code Files

| File                                      | Lines | Purpose                                 |
| ----------------------------------------- | ----- | --------------------------------------- |
| `src/extension.ts`                        | 160   | Entry point, commands, message handling |
| `src/services/keyVaultManager.ts`         | 105   | Azure SDK wrapper, API calls            |
| `src/providers/keyVaultTreeProvider.ts`   | 60    | Sidebar tree view data/logic            |
| `src/providers/secretsWebViewProvider.ts` | 450   | HTML/CSS/JS UI for secrets viewer       |

### Configuration Files

| File                  | Purpose                         |
| --------------------- | ------------------------------- |
| `package.json`        | Dependencies, scripts, manifest |
| `tsconfig.json`       | TypeScript compiler settings    |
| `.vscode/launch.json` | VS Code debug configuration     |
| `.vscode/tasks.json`  | Build/watch tasks               |
| `.gitignore`          | Git ignore patterns             |

### Documentation Files

| File              | Lines     | Topic               |
| ----------------- | --------- | ------------------- |
| `README.md`       | 250+      | Complete user guide |
| `QUICKSTART.md`   | 120+      | 5-minute setup      |
| `SETUP.md`        | 200+      | Installation guide  |
| `ARCHITECTURE.md` | 300+      | Technical design    |
| `DEVELOPMENT.md`  | 350+      | Developer guide     |
| `COMPLETED.md`    | 200+      | Project status      |
| `INDEX.md`        | This file | Navigation guide    |

---

## ✅ Project Status

| Component             | Status      |
| --------------------- | ----------- |
| **Core Features**     | ✅ Complete |
| **UI/UX**             | ✅ Complete |
| **Azure Integration** | ✅ Complete |
| **Documentation**     | ✅ Complete |
| **Testing**           | ✅ Complete |
| **Build System**      | ✅ Complete |
| **Ready to Use**      | ✅ Yes      |

---

## 🔐 Authentication Methods

The extension supports:

- Azure CLI (`az login`)
- VS Code Azure Account extension
- Service Principal (environment variables)
- Managed Identity (Azure resources)

---

## 📚 Reading Order

### For Users

1. Start: [COMPLETED.md](COMPLETED.md)
2. Setup: [QUICKSTART.md](QUICKSTART.md)
3. Details: [README.md](README.md)
4. Help: [SETUP.md](SETUP.md) troubleshooting

### For Developers

1. Start: [COMPLETED.md](COMPLETED.md)
2. Understand: [ARCHITECTURE.md](ARCHITECTURE.md)
3. Learn: [DEVELOPMENT.md](DEVELOPMENT.md)
4. Code: Edit `src/` files
5. Test: `npm run esbuild-watch` + F5

---

## 🚀 Next Steps

1. **Read** [COMPLETED.md](COMPLETED.md) (2 min)
2. **Read** [QUICKSTART.md](QUICKSTART.md) (5 min)
3. **Setup** Azure authentication
4. **Launch** extension with F5
5. **Add** your first Key Vault
6. **Enjoy** managing secrets!

---

## 📞 Help & Support

### Troubleshooting

- Check [SETUP.md](SETUP.md) troubleshooting section
- Check [DEVELOPMENT.md](DEVELOPMENT.md) debugging section

### Development Help

- [ARCHITECTURE.md](ARCHITECTURE.md) - How it works
- [DEVELOPMENT.md](DEVELOPMENT.md) - How to extend it
- Source code comments

### External Resources

- [VS Code Extension API](https://code.visualstudio.com/api)
- [Azure SDK for JS](https://github.com/Azure/azure-sdk-for-js)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)

---

## 🎉 Summary

Everything is ready to go! The extension is:

✅ Fully functional  
✅ Well documented  
✅ Ready to use  
✅ Ready to customize  
✅ Ready to distribute

**Start with [COMPLETED.md](COMPLETED.md) and [QUICKSTART.md](QUICKSTART.md)**

Happy Key Vault managing! 🔐
