import * as vscode from "vscode";
import {
  KeyVaultTreeProvider,
  KeyVaultItem,
} from "./providers/keyVaultTreeProvider";
import { SecretsWebViewProvider } from "./providers/secretsWebViewProvider";
import { KeyVaultManager } from "./services/keyVaultManager";
import { SecretsWebviewController } from "./webview/secretsWebviewController";

export async function activate(context: vscode.ExtensionContext) {
  console.log("One Key Vault UI Extension activated!");

  try {
    const storedVaults = loadStoredVaults(context);
    const devLogChannel = vscode.window.createOutputChannel("One Key Vault UI");
    context.subscriptions.push(devLogChannel);

    const keyVaultManager = new KeyVaultManager(context.secrets, devLogChannel);
    await keyVaultManager.loadStoredServicePrincipalInfo();

    const treeProvider = new KeyVaultTreeProvider(
      keyVaultManager,
      storedVaults,
    );
    const webviewController = new SecretsWebviewController(
      keyVaultManager,
      context.extensionUri,
    );

    // Register tree view provider
    vscode.window.registerTreeDataProvider("oneKeyVaultTree", treeProvider);

    // Register webview panel serializer for secrets view
    vscode.window.registerWebviewPanelSerializer(
      "oneKeyVaultSecrets",
      new SecretsWebViewProvider(context.extensionUri),
    );

    // Command: Add Key Vault
    const addVaultCommand = vscode.commands.registerCommand(
      "oneKeyVault.addKeyVault",
      async () => {
        await addKeyVault(context, storedVaults, treeProvider);
      },
    );
    context.subscriptions.push(addVaultCommand);

    // Command: Remove Key Vault
    const removeVaultCommand = vscode.commands.registerCommand(
      "oneKeyVault.removeKeyVault",
      async (item: KeyVaultItem) => {
        await removeKeyVault(context, storedVaults, treeProvider, item);
      },
    );
    context.subscriptions.push(removeVaultCommand);

    // Command: Refresh key vaults
    const refreshCommand = vscode.commands.registerCommand(
      "oneKeyVault.refresh",
      () => {
        treeProvider.refresh();
        vscode.window.showInformationMessage("Key Vaults refreshed");
      },
    );
    context.subscriptions.push(refreshCommand);

    // Command: Open key vault secrets
    const openSecretsCommand = vscode.commands.registerCommand(
      "oneKeyVault.openSecrets",
      async (treeItem: KeyVaultItem) => {
        if (!treeItem || !treeItem.vaultUrl) {
          vscode.window.showErrorMessage("Invalid key vault selected");
          return;
        }
        try {
          await keyVaultManager.ensureSessionSecretForOpen();
        } catch (error) {
          vscode.window.showErrorMessage(String(error));
          return;
        }
        webviewController.openPanel(treeItem.label, treeItem.vaultUrl);
      },
    );
    context.subscriptions.push(openSecretsCommand);

    const clearCredsCommand = vscode.commands.registerCommand(
      "oneKeyVault.clearStoredCredentials",
      async (item: KeyVaultItem) => {
        if (!item || item.isAddButton) {
          return;
        }
        const confirmed = await vscode.window.showWarningMessage(
          `Clear stored credentials for "${item.label}"?`,
          { modal: true },
          "Clear",
        );
        if (confirmed !== "Clear") {
          return;
        }
        await keyVaultManager.clearStoredServicePrincipalInfo();
        vscode.window.showInformationMessage(
          "Stored credentials cleared. You'll be prompted next time.",
        );
      },
    );
    context.subscriptions.push(clearCredsCommand);

    const editCredsCommand = vscode.commands.registerCommand(
      "oneKeyVault.editStoredCredentials",
      async (item: KeyVaultItem) => {
        if (!item || item.isAddButton) {
          return;
        }

        const current = keyVaultManager.getStoredServicePrincipalInfo();

        const tenantId = await vscode.window.showInputBox({
          prompt: `Tenant ID for "${item.label}"`,
          ignoreFocusOut: true,
          value: current?.tenantId ?? "",
          placeHolder: "e.g., 00000000-0000-0000-0000-000000000000",
        });

        if (tenantId === undefined) {
          return;
        }

        const trimmedTenantId = tenantId.trim();
        if (!trimmedTenantId) {
          vscode.window.showErrorMessage("Tenant ID is required.");
          return;
        }

        const clientId = await vscode.window.showInputBox({
          prompt: `Client ID for "${item.label}"`,
          ignoreFocusOut: true,
          value: current?.clientId ?? "",
          placeHolder: "e.g., 00000000-0000-0000-0000-000000000000",
        });

        if (clientId === undefined) {
          return;
        }

        const trimmedClientId = clientId.trim();
        if (!trimmedClientId) {
          vscode.window.showErrorMessage("Client ID is required.");
          return;
        }

        await keyVaultManager.setServicePrincipalInfo({
          tenantId: trimmedTenantId,
          clientId: trimmedClientId,
        });
        keyVaultManager.clearSessionClientSecret();

        vscode.window.showInformationMessage(
          "Stored credentials updated. You'll be prompted for the client secret when opening a Key Vault.",
        );
      },
    );
    context.subscriptions.push(editCredsCommand);

    // Set context for showing the view
    vscode.commands.executeCommand("setContext", "oneKeyVault:ready", true);

    vscode.window.showInformationMessage("One Key Vault UI is ready!");
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to activate extension: ${error}`);
    console.error("Extension activation error:", error);
  }
}

function loadStoredVaults(
  context: vscode.ExtensionContext,
): Map<string, string> {
  const stored = context.globalState.get<Record<string, string>>(
    "oneKeyVault.vaults",
    {},
  );
  return new Map(Object.entries(stored));
}

async function saveStoredVaults(
  context: vscode.ExtensionContext,
  storedVaults: Map<string, string>,
): Promise<void> {
  await context.globalState.update(
    "oneKeyVault.vaults",
    Object.fromEntries(storedVaults),
  );
}

async function addKeyVault(
  context: vscode.ExtensionContext,
  storedVaults: Map<string, string>,
  treeProvider: KeyVaultTreeProvider,
): Promise<void> {
  const vaultUrl = await vscode.window.showInputBox({
    prompt: "Enter Key Vault URL",
    placeHolder: "https://<vault-name>.vault.azure.net/",
    validateInput: (value) =>
      isValidVaultUrl(value)
        ? null
        : "Invalid URL format. Expected: https://<vault-name>.vault.azure.net/",
  });

  if (!vaultUrl) {
    return;
  }

  const vaultName = await vscode.window.showInputBox({
    prompt: "Enter a name for this vault",
    placeHolder: "My Vault",
    value: vaultUrl.split("/")[2].split(".")[0],
  });

  if (!vaultName) {
    return;
  }

  storedVaults.set(vaultName, vaultUrl);
  await saveStoredVaults(context, storedVaults);
  treeProvider.refresh();
  vscode.window.showInformationMessage(
    `Key Vault "${vaultName}" added successfully`,
  );
}

async function removeKeyVault(
  context: vscode.ExtensionContext,
  storedVaults: Map<string, string>,
  treeProvider: KeyVaultTreeProvider,
  item: KeyVaultItem,
): Promise<void> {
  if (!item || item.isAddButton) {
    return;
  }

  const confirmed = await vscode.window.showWarningMessage(
    `Remove Key Vault "${item.label}"?`,
    { modal: true },
    "Yes",
  );

  if (confirmed !== "Yes") {
    return;
  }

  storedVaults.delete(item.label);
  await saveStoredVaults(context, storedVaults);
  treeProvider.refresh();
  vscode.window.showInformationMessage(`Key Vault "${item.label}" removed`);
}

function isValidVaultUrl(value: string): boolean {
  return value.startsWith("https://") && value.includes(".vault.azure.net/");
}

export function deactivate() {
  console.log("One Key Vault UI Extension deactivated");
}
