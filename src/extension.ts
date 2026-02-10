import * as vscode from "vscode";
import { KeyVaultTreeProvider } from "./providers/keyVaultTreeProvider";
import { SecretsWebViewProvider } from "./providers/secretsWebViewProvider";
import { KeyVaultManager } from "./services/keyVaultManager";

let keyVaultManager: KeyVaultManager;
let treeProvider: KeyVaultTreeProvider;
let storedVaults: Map<string, string> = new Map();

export async function activate(context: vscode.ExtensionContext) {
  console.log("One Key Vault UI Extension activated!");

  try {
    // Load stored vaults from VS Code settings
    loadStoredVaults(context);

    // Initialize services with secret storage for secure credential storage
    keyVaultManager = new KeyVaultManager(context.secrets);

    // Load any stored service principal credentials
    await keyVaultManager.loadStoredServicePrincipalCreds();

    treeProvider = new KeyVaultTreeProvider(keyVaultManager, storedVaults);

    // Register tree view provider
    vscode.window.registerTreeDataProvider("oneKeyVaultTree", treeProvider);

    // Register webview panel serializer for secrets view
    vscode.window.registerWebviewPanelSerializer(
      "oneKeyVaultSecrets",
      new SecretsWebViewProvider(context.extensionUri),
    );

    // Command: Add Key Vault
    let addVaultCommand = vscode.commands.registerCommand(
      "oneKeyVault.addKeyVault",
      async () => {
        const vaultUrl = await vscode.window.showInputBox({
          prompt: "Enter Key Vault URL",
          placeHolder: "https://<vault-name>.vault.azure.net/",
          validateInput: (value) => {
            if (
              !value.startsWith("https://") ||
              !value.includes(".vault.azure.net/")
            ) {
              return "Invalid URL format. Expected: https://<vault-name>.vault.azure.net/";
            }
            return null;
          },
        });

        if (vaultUrl) {
          const vaultName = await vscode.window.showInputBox({
            prompt: "Enter a name for this vault",
            placeHolder: "My Vault",
            value: vaultUrl.split("/")[2].split(".")[0],
          });

          if (vaultName) {
            storedVaults.set(vaultName, vaultUrl);
            await context.globalState.update(
              "oneKeyVault.vaults",
              Object.fromEntries(storedVaults),
            );
            treeProvider.refresh();
            vscode.window.showInformationMessage(
              `Key Vault "${vaultName}" added successfully`,
            );
          }
        }
      },
    );
    context.subscriptions.push(addVaultCommand);

    // Command: Remove Key Vault
    let removeVaultCommand = vscode.commands.registerCommand(
      "oneKeyVault.removeKeyVault",
      async (item: any) => {
        const confirmed = await vscode.window.showWarningMessage(
          `Remove Key Vault "${item.label}"?`,
          { modal: true },
          "Yes",
        );

        if (confirmed === "Yes") {
          storedVaults.delete(item.label);
          await context.globalState.update(
            "oneKeyVault.vaults",
            Object.fromEntries(storedVaults),
          );
          treeProvider.refresh();
          vscode.window.showInformationMessage(
            `Key Vault "${item.label}" removed`,
          );
        }
      },
    );
    context.subscriptions.push(removeVaultCommand);

    // Command: Refresh key vaults
    let refreshCommand = vscode.commands.registerCommand(
      "oneKeyVault.refresh",
      () => {
        treeProvider.refresh();
        vscode.window.showInformationMessage("Key Vaults refreshed");
      },
    );
    context.subscriptions.push(refreshCommand);

    // Command: Open key vault secrets
    let openSecretsCommand = vscode.commands.registerCommand(
      "oneKeyVault.openSecrets",
      async (treeItem: any) => {
        if (!treeItem || !treeItem.vaultUrl) {
          vscode.window.showErrorMessage("Invalid key vault selected");
          return;
        }

        const panel = vscode.window.createWebviewPanel(
          "oneKeyVaultSecrets",
          `Secrets - ${treeItem.label}`,
          vscode.ViewColumn.One,
          {
            enableScripts: true,
            retainContextWhenHidden: true,
            localResourceRoots: [
              vscode.Uri.joinPath(context.extensionUri, "media"),
            ],
          },
        );

        const webviewProvider = new SecretsWebViewProvider(
          context.extensionUri,
        );
        panel.webview.html = webviewProvider.getSecretsView(
          panel.webview,
          treeItem.vaultUrl,
        );

        // Handle messages from webview
        panel.webview.onDidReceiveMessage(async (message) => {
          switch (message.command) {
            case "loadSecrets":
              try {
                const secrets = await keyVaultManager.getSecrets(
                  treeItem.vaultUrl,
                  message.page,
                  message.pageSize,
                );
                panel.webview.postMessage({
                  command: "secretsLoaded",
                  data: secrets,
                  page: message.page,
                  pageSize: message.pageSize,
                });
              } catch (error) {
                panel.webview.postMessage({
                  command: "error",
                  message: `Failed to load secrets: ${error}`,
                });
              }
              break;

            case "updateSecret":
              try {
                await keyVaultManager.updateSecret(
                  treeItem.vaultUrl,
                  message.secretName,
                  message.secretValue,
                );
                panel.webview.postMessage({
                  command: "secretUpdated",
                  secretName: message.secretName,
                });
                vscode.window.showInformationMessage(
                  `Secret "${message.secretName}" updated successfully`,
                );
              } catch (error) {
                panel.webview.postMessage({
                  command: "error",
                  message: `Failed to update secret: ${error}`,
                });
              }
              break;

            case "requestEditSecret":
              try {
                const nextValue = await vscode.window.showInputBox({
                  prompt: `Enter new value for "${message.secretName}"`,
                  ignoreFocusOut: true,
                  password: true,
                });
                if (nextValue === undefined) {
                  break;
                }
                await keyVaultManager.updateSecret(
                  treeItem.vaultUrl,
                  message.secretName,
                  nextValue,
                );
                panel.webview.postMessage({
                  command: "secretUpdated",
                  secretName: message.secretName,
                });
                vscode.window.showInformationMessage(
                  `Secret "${message.secretName}" updated successfully`,
                );
              } catch (error) {
                panel.webview.postMessage({
                  command: "error",
                  message: `Failed to update secret: ${error}`,
                });
              }
              break;

            case "requestDeleteSecret":
              try {
                const choice = await vscode.window.showWarningMessage(
                  `Delete secret "${message.secretName}"?`,
                  { modal: true },
                  "Delete",
                );
                if (choice !== "Delete") {
                  break;
                }
                await keyVaultManager.deleteSecret(
                  treeItem.vaultUrl,
                  message.secretName,
                );
                panel.webview.postMessage({
                  command: "secretDeleted",
                  secretName: message.secretName,
                });
                vscode.window.showInformationMessage(
                  `Secret "${message.secretName}" deleted successfully`,
                );
              } catch (error) {
                panel.webview.postMessage({
                  command: "error",
                  message: `Failed to delete secret: ${error}`,
                });
              }
              break;

            case "requestToggleEnabled":
              try {
                const nextEnabled = !message.enabled;
                let nextValue: string | undefined;
                if (nextEnabled) {
                  nextValue = await vscode.window.showInputBox({
                    prompt: `Enter value to enable "${message.secretName}"`,
                    ignoreFocusOut: true,
                    password: true,
                  });
                  if (nextValue === undefined) {
                    break;
                  }
                }
                await keyVaultManager.setSecretEnabled(
                  treeItem.vaultUrl,
                  message.secretName,
                  nextEnabled,
                  nextValue,
                );
                panel.webview.postMessage({
                  command: "secretUpdated",
                  secretName: message.secretName,
                });
                vscode.window.showInformationMessage(
                  `Secret "${message.secretName}" ${
                    nextEnabled ? "enabled" : "disabled"
                  } successfully`,
                );
              } catch (error) {
                panel.webview.postMessage({
                  command: "error",
                  message: `Failed to update secret: ${error}`,
                });
              }
              break;

            case "requestCreateSecret":
              try {
                const name = await vscode.window.showInputBox({
                  prompt: "Enter secret name",
                  ignoreFocusOut: true,
                });
                if (!name) {
                  break;
                }
                const value = await vscode.window.showInputBox({
                  prompt: `Enter value for "${name}"`,
                  ignoreFocusOut: true,
                  password: true,
                });
                if (value === undefined) {
                  break;
                }
                await keyVaultManager.updateSecret(
                  treeItem.vaultUrl,
                  name,
                  value,
                );
                panel.webview.postMessage({
                  command: "secretUpdated",
                  secretName: name,
                });
                vscode.window.showInformationMessage(
                  `Secret "${name}" created successfully`,
                );
              } catch (error) {
                panel.webview.postMessage({
                  command: "error",
                  message: `Failed to create secret: ${error}`,
                });
              }
              break;

            case "deleteSecret":
              try {
                await keyVaultManager.deleteSecret(
                  treeItem.vaultUrl,
                  message.secretName,
                );
                panel.webview.postMessage({
                  command: "secretDeleted",
                  secretName: message.secretName,
                });
                vscode.window.showInformationMessage(
                  `Secret "${message.secretName}" deleted successfully`,
                );
              } catch (error) {
                panel.webview.postMessage({
                  command: "error",
                  message: `Failed to delete secret: ${error}`,
                });
              }
              break;
          }
        });
      },
    );
    context.subscriptions.push(openSecretsCommand);

    // Set context for showing the view
    vscode.commands.executeCommand("setContext", "oneKeyVault:ready", true);

    vscode.window.showInformationMessage("One Key Vault UI is ready!");
  } catch (error) {
    vscode.window.showErrorMessage(`Failed to activate extension: ${error}`);
    console.error("Extension activation error:", error);
  }
}

function loadStoredVaults(context: vscode.ExtensionContext): void {
  const stored = context.globalState.get<Record<string, string>>(
    "oneKeyVault.vaults",
    {},
  );
  storedVaults = new Map(Object.entries(stored));
}

export function deactivate() {
  console.log("One Key Vault UI Extension deactivated");
}
