import { SecretClient } from "@azure/keyvault-secrets";
import {
  VisualStudioCodeCredential,
  AzureCliCredential,
  ClientSecretCredential,
  ChainedTokenCredential,
  CredentialUnavailableError,
  TokenCredential,
} from "@azure/identity";
import * as vscode from "vscode";

export interface Secret {
  name: string;
  value: string;
  enabled: boolean;
  id?: string;
  created?: Date;
  updated?: Date;
  notBefore?: Date;
  expiresOn?: Date;
  tags?: Record<string, string>;
}

export interface SecretsPage {
  secrets: Secret[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export interface ServicePrincipalInfo {
  tenantId: string;
  clientId: string;
}

export class KeyVaultManager {
  private secretClients: Map<string, SecretClient> = new Map();
  private credential: TokenCredential;
  private allSecretsCache: Map<string, Secret[]> = new Map();
  private outputChannel: vscode.OutputChannel;
  private spInfo: ServicePrincipalInfo | null = null;
  private sessionClientSecret: string | null = null;
  private secretStorage: vscode.SecretStorage | null = null;
  private sessionAuthenticated: boolean = false;

  constructor(
    secretStorage?: vscode.SecretStorage,
    outputChannel?: vscode.OutputChannel,
  ) {
    this.secretStorage = secretStorage || null;
    this.outputChannel =
      outputChannel ?? vscode.window.createOutputChannel("One Key Vault UI");
    // Initialize with VS Code credential; will be replaced if SP creds are available
    this.credential = new VisualStudioCodeCredential();
    this.initializeCredential();
  }

  private buildLogContext(
    vaultUrl: string,
    context?: Record<string, unknown>,
  ): string {
    const baseContext: Record<string, unknown> = {
      vaultUrl,
      ...context,
    };
    return JSON.stringify(baseContext);
  }

  private logDeveloper(message: string): void {
    this.outputChannel.appendLine(`[KeyVaultManager] ${message}`);
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    return String(error);
  }

  private getCredentialRequiredMessage(): string {
    return "Authentication required. Sign in with VS Code or Azure CLI (az login), or use Service Principal credentials.";
  }

  private shouldPromptForCredentials(error: unknown): boolean {
    const errorMessage = this.getErrorMessage(error);

    if (error instanceof CredentialUnavailableError) {
      return true;
    }

    if (errorMessage.includes("CredentialUnavailableError")) {
      return true;
    }

    if (
      errorMessage.includes(
        "Visual Studio Code Authentication is not available",
      )
    ) {
      return true;
    }

    if (errorMessage.includes("Please run 'az login'")) {
      return true;
    }

    if (errorMessage.includes("Azure CLI could not be found")) {
      return true;
    }

    if (errorMessage.includes("Azure CLI not found on path")) {
      return true;
    }

    return false;
  }

  async authenticateForOpen(): Promise<boolean> {
    if (this.sessionAuthenticated) {
      return true;
    }
    this.clearSessionClientSecret();
    const result = await this.promptForAuthenticationMethod(true);
    if (result) {
      this.sessionAuthenticated = true;
    }
    return result;
  }

  private async promptForAuthenticationMethod(
    forOpen: boolean = false,
  ): Promise<boolean> {
    const options: Array<
      vscode.QuickPickItem & { id: "vscode" | "azcli" | "sp" }
    > = [
      {
        id: "vscode",
        label: "Sign in with VS Code",
        description: "Use Azure Account sign-in in VS Code",
      },
      {
        id: "azcli",
        label: "Sign in with Azure CLI",
        description: "Run az login in terminal",
      },
      {
        id: "sp",
        label: "Use Service Principal",
        description: "Enter tenant ID, client ID, and client secret",
      },
    ];

    const selected = await vscode.window.showQuickPick(options, {
      title: forOpen
        ? "Sign in before opening Key Vault"
        : "Authentication required",
      placeHolder: "Choose how you want to authenticate to Azure Key Vault",
      ignoreFocusOut: true,
    });

    if (!selected) {
      return false;
    }

    if (selected.id === "vscode") {
      try {
        await vscode.commands.executeCommand("azure-account.login");
      } catch (error) {
        throw new Error(
          `VS Code Azure sign-in is unavailable. Install/enable Azure Account extension or use az login. ${this.getErrorMessage(error)}`,
        );
      }
      this.initializeCredential();
      this.secretClients.clear();
      return true;
    }

    if (selected.id === "azcli") {
      const terminal = vscode.window.createTerminal("Azure CLI Login");
      terminal.show(true);
      terminal.sendText("az login");

      const continueChoice = await vscode.window.showInformationMessage(
        "Complete 'az login' in the terminal, then choose Continue.",
        { modal: true },
        "Continue",
      );

      this.initializeCredential();
      this.secretClients.clear();
      return continueChoice === "Continue";
    }

    if (!this.spInfo) {
      await this.promptForServicePrincipalInfo();
    }
    await this.ensureSessionSecretForOpen();
    return true;
  }

  private async trackKeyVaultRequest<T>(
    operation: string,
    vaultUrl: string,
    action: () => Promise<T>,
    context?: Record<string, unknown>,
  ): Promise<T> {
    const startedAt = Date.now();
    const details = this.buildLogContext(vaultUrl, context);
    this.logDeveloper(`REQUEST START ${operation} ${details}`);

    try {
      const result = await action();
      const durationMs = Date.now() - startedAt;
      this.logDeveloper(
        `REQUEST SUCCESS ${operation} durationMs=${durationMs} ${details}`,
      );
      return result;
    } catch (error) {
      const durationMs = Date.now() - startedAt;
      this.logDeveloper(
        `REQUEST ERROR ${operation} durationMs=${durationMs} error="${this.getErrorMessage(error)}" ${details}`,
      );
      throw error;
    }
  }

  private initializeCredential(): void {
    try {
      const credentials: TokenCredential[] = [
        new VisualStudioCodeCredential(),
        new AzureCliCredential(),
      ];

      // Load SP info if available
      this.loadServicePrincipalInfo();

      if (this.spInfo && this.sessionClientSecret) {
        const spCredential = new ClientSecretCredential(
          this.spInfo.tenantId,
          this.spInfo.clientId,
          this.sessionClientSecret,
        );
        credentials.push(spCredential);
      }

      if (credentials.length > 1) {
        this.credential = new ChainedTokenCredential(...credentials);
      } else {
        this.credential = credentials[0];
      }
      this.logDeveloper(
        `Credential initialized with ${credentials.length > 1 ? "ChainedTokenCredential" : "VisualStudioCodeCredential"}`,
      );
    } catch (error) {
      this.logDeveloper(
        `Credential initialization failed: ${this.getErrorMessage(error)}`,
      );
      console.error("Failed to initialize credential:", error);
    }
  }

  private loadServicePrincipalInfo(): void {
    // Load from memory or storage if available
    // This will be populated when user enters credentials
  }

  async setServicePrincipalInfo(info: ServicePrincipalInfo): Promise<void> {
    this.spInfo = info;

    if (this.secretStorage) {
      try {
        await this.secretStorage.store(
          "oneKeyVault.spInfo",
          JSON.stringify(info),
        );
      } catch (error) {
        console.error("Failed to store SP info:", error);
      }
    }

    this.initializeCredential();
    this.secretClients.clear();
  }

  getStoredServicePrincipalInfo(): ServicePrincipalInfo | null {
    if (!this.spInfo) {
      return null;
    }
    return {
      tenantId: this.spInfo.tenantId,
      clientId: this.spInfo.clientId,
    };
  }

  async loadStoredServicePrincipalInfo(): Promise<void> {
    if (!this.secretStorage) return;

    try {
      const storedInfo = await this.secretStorage.get("oneKeyVault.spInfo");
      if (storedInfo) {
        this.spInfo = JSON.parse(storedInfo);
        return;
      }

      const legacyStored = await this.secretStorage.get("oneKeyVault.spCreds");
      if (legacyStored) {
        const legacy = JSON.parse(legacyStored) as {
          tenantId?: string;
          clientId?: string;
        };
        if (legacy.tenantId && legacy.clientId) {
          this.spInfo = {
            tenantId: legacy.tenantId,
            clientId: legacy.clientId,
          };
          await this.secretStorage.store(
            "oneKeyVault.spInfo",
            JSON.stringify(this.spInfo),
          );
        }
        await this.secretStorage.delete("oneKeyVault.spCreds");
      }
    } catch (error) {
      console.error("Failed to load stored SP info:", error);
    }
  }

  async clearStoredServicePrincipalInfo(): Promise<void> {
    this.spInfo = null;
    this.sessionAuthenticated = false;
    if (this.secretStorage) {
      try {
        await this.secretStorage.delete("oneKeyVault.spInfo");
        await this.secretStorage.delete("oneKeyVault.spCreds");
      } catch (error) {
        console.error("Failed to delete stored SP info:", error);
      }
    }
    this.clearSessionClientSecret();
  }

  setSessionClientSecret(secret: string): void {
    this.sessionClientSecret = secret;
    this.initializeCredential();
    this.secretClients.clear();
  }

  clearSessionClientSecret(): void {
    this.sessionClientSecret = null;
    this.sessionAuthenticated = false;
    this.initializeCredential();
    this.secretClients.clear();
  }

  async ensureSessionSecretForOpen(): Promise<void> {
    if (!this.spInfo) {
      return;
    }
    const clientSecret = await vscode.window.showInputBox({
      prompt: "Enter Service Principal Client Secret",
      ignoreFocusOut: true,
      password: true,
      placeHolder: "Enter your client secret",
    });

    if (!clientSecret) {
      throw new Error("Client Secret is required to open Key Vault.");
    }

    this.setSessionClientSecret(clientSecret);
  }

  private getSecretClient(vaultUrl: string): SecretClient {
    if (!this.secretClients.has(vaultUrl)) {
      this.logDeveloper(
        `Creating SecretClient ${this.buildLogContext(vaultUrl)}`,
      );
      this.secretClients.set(
        vaultUrl,
        new SecretClient(vaultUrl, this.credential),
      );
    }
    return this.secretClients.get(vaultUrl)!;
  }

  async getAvailableKeyVaults(): Promise<
    Array<{ name: string; vaultUrl: string }>
  > {
    try {
      // Note: This is a placeholder. In a real scenario, you'd need to query Azure Resource Manager
      // to get the list of key vaults the user has access to.
      // For now, we'll return an empty array and the user will need to add vaults manually.
      return [];
    } catch (error) {
      throw new Error(`Failed to get key vaults: ${error}`);
    }
  }

  async getSecrets(
    vaultUrl: string,
    page: number = 0,
    pageSize: number = 10,
    onProgress?: (processed: number, total: number) => void,
    allowCredentialPrompt: boolean = true,
  ): Promise<SecretsPage> {
    try {
      const client = this.getSecretClient(vaultUrl);
      const allSecrets: Secret[] = [];
      const secretPropertiesList: Array<{
        name: string;
        enabled: boolean;
        created?: Date;
        updated?: Date;
      }> = [];

      // Fetch all secrets and return list fields.
      // Additional metadata is loaded on-demand via getSecretDetails.
      const secretsIterator = await this.trackKeyVaultRequest(
        "listPropertiesOfSecrets",
        vaultUrl,
        async () => client.listPropertiesOfSecrets(),
        { page, pageSize },
      );
      for await (const secretProperties of secretsIterator) {
        secretPropertiesList.push({
          name: secretProperties.name,
          enabled: secretProperties.enabled ?? true,
          created: secretProperties.createdOn,
          updated: secretProperties.updatedOn,
        });
      }

      const total = secretPropertiesList.length;
      onProgress?.(0, total);

      for (const secretProperties of secretPropertiesList) {
        const enabled = secretProperties.enabled;
        let value = "";
        if (enabled) {
          const secret = await this.trackKeyVaultRequest(
            "getSecret",
            vaultUrl,
            async () => client.getSecret(secretProperties.name),
            { secretName: secretProperties.name },
          );
          value = secret.value || "";
        }
        allSecrets.push({
          name: secretProperties.name,
          value,
          enabled,
          created: secretProperties.created,
          updated: secretProperties.updated,
        });
        onProgress?.(allSecrets.length, total);
      }

      // Cache the secrets
      this.allSecretsCache.set(vaultUrl, allSecrets);

      return {
        secrets: allSecrets,
        total,
        page,
        pageSize,
        hasMore: false,
      };
    } catch (error) {
      if (this.shouldPromptForCredentials(error) && allowCredentialPrompt) {
        const shouldRetry = await this.promptForAuthenticationMethod();
        if (shouldRetry) {
          return this.getSecrets(vaultUrl, page, pageSize, onProgress, false);
        }
      }

      if (this.shouldPromptForCredentials(error)) {
        throw new Error(this.getCredentialRequiredMessage());
      }

      throw new Error(`Failed to get secrets: ${error}`);
    }
  }

  async updateSecret(
    vaultUrl: string,
    secretName: string,
    secretValue: string,
  ): Promise<void> {
    try {
      const client = this.getSecretClient(vaultUrl);
      await this.trackKeyVaultRequest(
        "setSecret",
        vaultUrl,
        async () => client.setSecret(secretName, secretValue),
        { secretName },
      );

      // Invalidate cache
      this.allSecretsCache.delete(vaultUrl);
    } catch (error) {
      if (this.shouldPromptForCredentials(error)) {
        throw new Error(this.getCredentialRequiredMessage());
      }

      throw new Error(`Failed to update secret: ${error}`);
    }
  }

  async deleteSecret(vaultUrl: string, secretName: string): Promise<void> {
    try {
      const client = this.getSecretClient(vaultUrl);
      const poller = await this.trackKeyVaultRequest(
        "beginDeleteSecret",
        vaultUrl,
        async () => client.beginDeleteSecret(secretName),
        { secretName },
      );
      await this.trackKeyVaultRequest(
        "pollUntilDone",
        vaultUrl,
        async () => poller.pollUntilDone(),
        { secretName },
      );

      // Invalidate cache
      this.allSecretsCache.delete(vaultUrl);
    } catch (error) {
      if (this.shouldPromptForCredentials(error)) {
        throw new Error(this.getCredentialRequiredMessage());
      }

      throw new Error(`Failed to delete secret: ${error}`);
    }
  }

  async setSecretEnabled(
    vaultUrl: string,
    secretName: string,
    enabled: boolean,
    value?: string,
  ): Promise<void> {
    try {
      const client = this.getSecretClient(vaultUrl);
      if (enabled) {
        if (value === undefined) {
          throw new Error("Secret value required to enable a disabled secret.");
        }
        await this.trackKeyVaultRequest(
          "setSecret",
          vaultUrl,
          async () => client.setSecret(secretName, value, { enabled: true }),
          { secretName, enabled: true },
        );
      } else {
        const current = await this.trackKeyVaultRequest(
          "getSecret",
          vaultUrl,
          async () => client.getSecret(secretName),
          { secretName },
        );
        const currentValue = current.value ?? "";
        await this.trackKeyVaultRequest(
          "setSecret",
          vaultUrl,
          async () =>
            client.setSecret(secretName, currentValue, { enabled: false }),
          { secretName, enabled: false },
        );
      }

      // Invalidate cache
      this.allSecretsCache.delete(vaultUrl);
    } catch (error) {
      if (this.shouldPromptForCredentials(error)) {
        throw new Error(this.getCredentialRequiredMessage());
      }

      throw new Error(`Failed to update secret: ${error}`);
    }
  }

  async updateSecretProperties(
    vaultUrl: string,
    secretName: string,
    properties: {
      notBefore?: Date | null;
      expiresOn?: Date | null;
      tags?: Record<string, string>;
    },
  ): Promise<void> {
    try {
      const client = this.getSecretClient(vaultUrl);
      if (properties.tags !== undefined) {
        const current = await this.trackKeyVaultRequest(
          "getSecret",
          vaultUrl,
          async () => client.getSecret(secretName),
          { secretName },
        );
        const currentValue = current.value ?? "";
        await this.trackKeyVaultRequest(
          "setSecret",
          vaultUrl,
          async () =>
            client.setSecret(secretName, currentValue, {
              tags: properties.tags,
              notBefore: properties.notBefore ?? current.properties.notBefore,
              expiresOn: properties.expiresOn ?? current.properties.expiresOn,
              enabled: current.properties.enabled,
            }),
          {
            secretName,
            updateTags: true,
            updateNotBefore: properties.notBefore !== undefined,
            updateExpiresOn: properties.expiresOn !== undefined,
          },
        );
      } else {
        const updatePayload: {
          notBefore?: Date;
          expiresOn?: Date;
        } = {};
        if (properties.notBefore !== undefined) {
          updatePayload.notBefore =
            properties.notBefore === null ? undefined : properties.notBefore;
        }
        if (properties.expiresOn !== undefined) {
          updatePayload.expiresOn =
            properties.expiresOn === null ? undefined : properties.expiresOn;
        }
        const current = await this.trackKeyVaultRequest(
          "getSecret",
          vaultUrl,
          async () => client.getSecret(secretName),
          { secretName },
        );
        const version = current.properties.version;
        if (!version) {
          throw new Error("Secret version not found for update.");
        }
        await this.trackKeyVaultRequest(
          "updateSecretProperties",
          vaultUrl,
          async () =>
            client.updateSecretProperties(secretName, version, updatePayload),
          {
            secretName,
            version,
            updateNotBefore: properties.notBefore !== undefined,
            updateExpiresOn: properties.expiresOn !== undefined,
          },
        );
      }

      // Invalidate cache
      this.allSecretsCache.delete(vaultUrl);
    } catch (error) {
      if (this.shouldPromptForCredentials(error)) {
        throw new Error(this.getCredentialRequiredMessage());
      }

      throw new Error(`Failed to update secret: ${error}`);
    }
  }

  async getSecretDetails(
    vaultUrl: string,
    secretName: string,
  ): Promise<{
    id?: string;
    created?: Date;
    updated?: Date;
    notBefore?: Date;
    expiresOn?: Date;
    tags?: Record<string, string>;
  }> {
    try {
      const client = this.getSecretClient(vaultUrl);
      const secret = await this.trackKeyVaultRequest(
        "getSecret",
        vaultUrl,
        async () => client.getSecret(secretName),
        { secretName },
      );

      return {
        id: secret.properties.id,
        created: secret.properties.createdOn,
        updated: secret.properties.updatedOn,
        notBefore: secret.properties.notBefore,
        expiresOn: secret.properties.expiresOn,
        tags: secret.properties.tags,
      };
    } catch (error) {
      if (this.shouldPromptForCredentials(error)) {
        throw new Error(this.getCredentialRequiredMessage());
      }

      throw new Error(`Failed to get secret details: ${error}`);
    }
  }

  private async promptForServicePrincipalInfo(): Promise<void> {
    const tenantId = await vscode.window.showInputBox({
      prompt: "Enter Azure Tenant ID",
      ignoreFocusOut: true,
      password: false,
      placeHolder: "e.g., 00000000-0000-0000-0000-000000000000",
    });

    if (!tenantId) {
      throw new Error("Tenant ID is required");
    }

    const clientId = await vscode.window.showInputBox({
      prompt: "Enter Service Principal Client ID (Application ID)",
      ignoreFocusOut: true,
      password: false,
      placeHolder: "e.g., 00000000-0000-0000-0000-000000000000",
    });

    if (!clientId) {
      throw new Error("Client ID is required");
    }

    await this.setServicePrincipalInfo({ tenantId, clientId });

    vscode.window.showInformationMessage(
      "Service Principal details saved. You'll be prompted for the secret when opening a Key Vault.",
    );
  }
}
