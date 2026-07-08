import * as vscode from "vscode";
import { SecretsWebViewProvider } from "../providers/secretsWebViewProvider";
import { KeyVaultManager } from "../services/keyVaultManager";

interface WebviewMessage {
  command: string;
  secretName?: string;
  secretValue?: string;
  page?: number;
  pageSize?: number;
  enabled?: boolean;
  secrets?: Record<string, string>;
  secretsData?: Record<string, string>;
  properties?: {
    notBefore?: string | null;
    expiresOn?: string | null;
    tags?: Record<string, string>;
  };
}

export class SecretsWebviewController {
  constructor(
    private readonly keyVaultManager: KeyVaultManager,
    private readonly extensionUri: vscode.Uri,
  ) {}

  openPanel(vaultName: string, vaultUrl: string): void {
    const panel = vscode.window.createWebviewPanel(
      "oneKeyVaultSecrets",
      `Secrets - ${vaultName}`,
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(this.extensionUri, "media")],
      },
    );

    const webviewProvider = new SecretsWebViewProvider(this.extensionUri);
    panel.webview.html = webviewProvider.getSecretsView(
      panel.webview,
      vaultUrl,
    );

    panel.onDidDispose(() => {
      this.keyVaultManager.clearSessionClientSecret();
    });

    panel.webview.onDidReceiveMessage((message: WebviewMessage) => {
      this.handleMessage(panel, vaultUrl, message);
    });
  }

  private async handleMessage(
    panel: vscode.WebviewPanel,
    vaultUrl: string,
    message: WebviewMessage,
  ): Promise<void> {
    switch (message.command) {
      case "loadSecrets":
        await this.handleLoadSecrets(panel, vaultUrl, message);
        break;
      case "updateSecret":
        await this.handleUpdateSecret(panel, vaultUrl, message);
        break;
      case "requestEditSecret":
        await this.handleRequestEditSecret(panel, vaultUrl, message);
        break;
      case "requestDeleteSecret":
        await this.handleRequestDeleteSecret(panel, vaultUrl, message);
        break;
      case "requestToggleEnabled":
        await this.handleToggleEnabled(panel, vaultUrl, message);
        break;
      case "requestCreateSecret":
        await this.handleCreateSecret(panel, vaultUrl);
        break;
      case "requestBulkCreateSecrets":
        await this.handleBulkCreateSecrets(panel, vaultUrl);
        break;
      case "requestUpdateSecretProperties":
        await this.handleUpdateSecretProperties(panel, vaultUrl, message);
        break;
      case "requestSecretDetails":
        await this.handleRequestSecretDetails(panel, vaultUrl, message);
        break;
      case "deleteSecret":
        await this.handleDeleteSecret(panel, vaultUrl, message);
        break;
      case "downloadSecrets":
        await this.handleDownloadSecrets(message);
        break;
      default:
        break;
    }
  }

  private async handleLoadSecrets(
    panel: vscode.WebviewPanel,
    vaultUrl: string,
    message: WebviewMessage,
  ): Promise<void> {
    try {
      panel.webview.postMessage({
        command: "secretsLoadProgress",
        progress: 0,
        processed: 0,
        total: 0,
        status: "Preparing secret list...",
      });

      let lastProgressSentAt = 0;
      const secrets = await this.keyVaultManager.getSecrets(
        vaultUrl,
        message.page,
        message.pageSize,
        (processed, total) => {
          const now = Date.now();
          const isComplete = total > 0 && processed >= total;
          if (!isComplete && now - lastProgressSentAt < 80) {
            return;
          }
          lastProgressSentAt = now;

          const progress =
            total > 0 ? Math.round((processed / total) * 100) : 0;
          panel.webview.postMessage({
            command: "secretsLoadProgress",
            progress,
            processed,
            total,
            status:
              total > 0
                ? `Loading secrets... (${processed}/${total})`
                : "Preparing secret list...",
          });
        },
      );
      panel.webview.postMessage({
        command: "secretsLoaded",
        data: secrets,
        page: message.page,
        pageSize: message.pageSize,
      });
    } catch (error) {
      this.postError(panel, error, "Failed to load secrets");
    }
  }

  private async handleUpdateSecret(
    panel: vscode.WebviewPanel,
    vaultUrl: string,
    message: WebviewMessage,
  ): Promise<void> {
    if (!message.secretName || message.secretValue === undefined) {
      return;
    }
    try {
      await this.keyVaultManager.updateSecret(
        vaultUrl,
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
      this.postError(panel, error, "Failed to update secret");
    }
  }

  private async handleRequestEditSecret(
    panel: vscode.WebviewPanel,
    vaultUrl: string,
    message: WebviewMessage,
  ): Promise<void> {
    if (!message.secretName) return;
    try {
      const nextValue = await vscode.window.showInputBox({
        prompt: `Enter new value for "${message.secretName}"`,
        ignoreFocusOut: true,
        password: true,
      });
      if (nextValue === undefined) {
        return;
      }
      await this.keyVaultManager.updateSecret(
        vaultUrl,
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
      this.postError(panel, error, "Failed to update secret");
    }
  }

  private async handleRequestDeleteSecret(
    panel: vscode.WebviewPanel,
    vaultUrl: string,
    message: WebviewMessage,
  ): Promise<void> {
    if (!message.secretName) return;
    try {
      const choice = await vscode.window.showWarningMessage(
        `Delete secret "${message.secretName}"?`,
        { modal: true },
        "Delete",
      );
      if (choice !== "Delete") {
        return;
      }
      await this.keyVaultManager.deleteSecret(vaultUrl, message.secretName);
      panel.webview.postMessage({
        command: "secretDeleted",
        secretName: message.secretName,
      });
      vscode.window.showInformationMessage(
        `Secret "${message.secretName}" deleted successfully`,
      );
    } catch (error) {
      this.postError(panel, error, "Failed to delete secret");
    }
  }

  private async handleToggleEnabled(
    panel: vscode.WebviewPanel,
    vaultUrl: string,
    message: WebviewMessage,
  ): Promise<void> {
    if (!message.secretName || message.enabled === undefined) return;
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
          return;
        }
      }
      await this.keyVaultManager.setSecretEnabled(
        vaultUrl,
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
      this.postError(panel, error, "Failed to update secret");
    }
  }

  private async handleCreateSecret(
    panel: vscode.WebviewPanel,
    vaultUrl: string,
  ): Promise<void> {
    try {
      const name = await vscode.window.showInputBox({
        prompt: "Enter secret name",
        ignoreFocusOut: true,
      });
      if (!name) {
        return;
      }
      const value = await vscode.window.showInputBox({
        prompt: `Enter value for "${name}"`,
        ignoreFocusOut: true,
        password: true,
      });
      if (value === undefined) {
        return;
      }
      await this.keyVaultManager.updateSecret(vaultUrl, name, value);
      panel.webview.postMessage({
        command: "secretUpdated",
        secretName: name,
      });
      vscode.window.showInformationMessage(
        `Secret "${name}" created successfully`,
      );
    } catch (error) {
      this.postError(panel, error, "Failed to create secret");
    }
  }

  private async handleBulkCreateSecrets(
    panel: vscode.WebviewPanel,
    vaultUrl: string,
  ): Promise<void> {
    try {
      const uris = await vscode.window.showOpenDialog({
        canSelectMany: false,
        canSelectFolders: false,
        filters: { "JSON files": ["json"] },
        title: "Select JSON file with key:value pairs",
      });
      if (!uris || uris.length === 0) {
        return;
      }

      const fileBytes = await vscode.workspace.fs.readFile(uris[0]);
      const text = Buffer.from(fileBytes).toString("utf-8");

      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        this.postError(
          panel,
          new Error("File is not valid JSON"),
          "Bulk import failed",
        );
        return;
      }

      if (
        typeof parsed !== "object" ||
        parsed === null ||
        Array.isArray(parsed)
      ) {
        this.postError(
          panel,
          new Error("JSON must be a flat object with string key:value pairs"),
          "Bulk import failed",
        );
        return;
      }

      const entries = Object.entries(parsed as Record<string, unknown>);
      const invalid = entries.find(([, v]) => typeof v !== "string");
      if (invalid) {
        this.postError(
          panel,
          new Error(`Value for key "${invalid[0]}" is not a string`),
          "Bulk import failed",
        );
        return;
      }

      let created = 0;
      let skipped = 0;
      for (const [name, value] of entries as [string, string][]) {
        if (!name.trim()) {
          skipped++;
          continue;
        }
        try {
          await this.keyVaultManager.updateSecret(vaultUrl, name, value);
          created++;
        } catch {
          skipped++;
        }
      }

      panel.webview.postMessage({
        command: "bulkSecretsCreated",
        created,
        skipped,
      });
      vscode.window.showInformationMessage(
        `Bulk import: ${created} secret(s) created/updated, ${skipped} skipped`,
      );
    } catch (error) {
      this.postError(panel, error, "Bulk import failed");
    }
  }

  private async handleUpdateSecretProperties(
    panel: vscode.WebviewPanel,
    vaultUrl: string,
    message: WebviewMessage,
  ): Promise<void> {
    if (!message.secretName) return;
    try {
      const props = message.properties || {};
      const notBefore = this.parseDate(props.notBefore);
      const expiresOn = this.parseDate(props.expiresOn);

      await this.keyVaultManager.updateSecretProperties(
        vaultUrl,
        message.secretName,
        {
          notBefore,
          expiresOn,
          tags: props.tags,
        },
      );
      panel.webview.postMessage({
        command: "secretUpdated",
        secretName: message.secretName,
      });
    } catch (error) {
      this.postError(panel, error, "Failed to update secret");
    }
  }

  private async handleRequestSecretDetails(
    panel: vscode.WebviewPanel,
    vaultUrl: string,
    message: WebviewMessage,
  ): Promise<void> {
    if (!message.secretName) return;
    try {
      const details = await this.keyVaultManager.getSecretDetails(
        vaultUrl,
        message.secretName,
      );
      panel.webview.postMessage({
        command: "secretDetailsLoaded",
        secretName: message.secretName,
        data: { details },
      });
    } catch (error) {
      this.postError(panel, error, "Failed to load secret details");
    }
  }

  private async handleDeleteSecret(
    panel: vscode.WebviewPanel,
    vaultUrl: string,
    message: WebviewMessage,
  ): Promise<void> {
    if (!message.secretName) return;
    try {
      await this.keyVaultManager.deleteSecret(vaultUrl, message.secretName);
      panel.webview.postMessage({
        command: "secretDeleted",
        secretName: message.secretName,
      });
      vscode.window.showInformationMessage(
        `Secret "${message.secretName}" deleted successfully`,
      );
    } catch (error) {
      this.postError(panel, error, "Failed to delete secret");
    }
  }

  private async handleDownloadSecrets(message: WebviewMessage): Promise<void> {
    if (!message.secretsData) return;
    const uri = await vscode.window.showSaveDialog({
      defaultUri: vscode.Uri.file("secrets.json"),
      filters: { JSON: ["json"] },
      saveLabel: "Download",
    });
    if (!uri) return;
    const output: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(message.secretsData)) {
      try {
        output[key] = JSON.parse(value);
      } catch {
        output[key] = value;
      }
    }
    const content = Buffer.from(JSON.stringify(output, null, 2), "utf8");
    await vscode.workspace.fs.writeFile(uri, content);
    vscode.window.showInformationMessage(`Secrets saved to ${uri.fsPath}`);
  }

  private parseDate(value?: string | null): Date | null | undefined {
    if (value === null) return null;
    if (!value) return undefined;
    return new Date(value);
  }

  private postError(
    panel: vscode.WebviewPanel,
    error: unknown,
    prefix: string,
  ): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    panel.webview.postMessage({
      command: "error",
      message: `${prefix}: ${errorMessage}`,
    });
  }
}
