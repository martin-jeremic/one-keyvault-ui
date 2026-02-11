import { SecretClient } from "@azure/keyvault-secrets";
import {
  VisualStudioCodeCredential,
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

export interface ServicePrincipalCreds {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

export class KeyVaultManager {
  private secretClients: Map<string, SecretClient> = new Map();
  private credential: TokenCredential;
  private allSecretsCache: Map<string, Secret[]> = new Map();
  private spCreds: ServicePrincipalCreds | null = null;
  private secretStorage: vscode.SecretStorage | null = null;

  constructor(secretStorage?: vscode.SecretStorage) {
    this.secretStorage = secretStorage || null;
    // Initialize with VS Code credential; will be replaced if SP creds are available
    this.credential = new VisualStudioCodeCredential();
    this.initializeCredential();
  }

  private initializeCredential(): void {
    try {
      const credentials: TokenCredential[] = [new VisualStudioCodeCredential()];

      // Load SP credentials if available
      this.loadServicePrincipalCreds();

      if (this.spCreds) {
        const spCredential = new ClientSecretCredential(
          this.spCreds.tenantId,
          this.spCreds.clientId,
          this.spCreds.clientSecret,
        );
        credentials.push(spCredential);
      }

      if (credentials.length > 1) {
        this.credential = new ChainedTokenCredential(...credentials);
      } else {
        this.credential = credentials[0];
      }
    } catch (error) {
      console.error("Failed to initialize credential:", error);
    }
  }

  private loadServicePrincipalCreds(): void {
    // Load from memory or storage if available
    // This will be populated when user enters credentials
  }

  async setServicePrincipalCreds(creds: ServicePrincipalCreds): Promise<void> {
    this.spCreds = creds;

    // Store in VS Code secret storage if available
    if (this.secretStorage) {
      try {
        await this.secretStorage.store(
          "oneKeyVault.spCreds",
          JSON.stringify(creds),
        );
      } catch (error) {
        console.error("Failed to store SP credentials:", error);
      }
    }

    // Reinitialize credential with new SP creds
    this.initializeCredential();

    // Clear cached clients as credential has changed
    this.secretClients.clear();
  }

  async loadStoredServicePrincipalCreds(): Promise<void> {
    if (!this.secretStorage) return;

    try {
      const stored = await this.secretStorage.get("oneKeyVault.spCreds");
      if (stored) {
        this.spCreds = JSON.parse(stored);
        this.initializeCredential();
      }
    } catch (error) {
      console.error("Failed to load stored SP credentials:", error);
    }
  }

  private getSecretClient(vaultUrl: string): SecretClient {
    if (!this.secretClients.has(vaultUrl)) {
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
  ): Promise<SecretsPage> {
    try {
      const client = this.getSecretClient(vaultUrl);
      const allSecrets: Secret[] = [];

      // Fetch all secrets (with pagination from API)
      const secretsIterator = client.listPropertiesOfSecrets();
      for await (const secretProperties of secretsIterator) {
        const enabled = secretProperties.enabled ?? true;
        let value = "";
        if (enabled) {
          const secret = await client.getSecret(secretProperties.name);
          value = secret.value || "";
        }
        allSecrets.push({
          name: secretProperties.name,
          value,
          enabled,
          created: secretProperties.createdOn,
          updated: secretProperties.updatedOn,
        });
      }

      // Cache the secrets
      this.allSecretsCache.set(vaultUrl, allSecrets);

      const total = allSecrets.length;

      return {
        secrets: allSecrets,
        total,
        page,
        pageSize,
        hasMore: false,
      };
    } catch (error) {
      const errorMessage = (error as Error).message;

      // Check if this is a credential unavailable error
      if (
        error instanceof CredentialUnavailableError ||
        errorMessage.includes("CredentialUnavailableError") ||
        errorMessage.includes(
          "Visual Studio Code Authentication is not available",
        )
      ) {
        // Prompt user to enter SP credentials
        await this.promptForServicePrincipalCreds();

        // Retry with new credentials
        return this.getSecrets(vaultUrl, page, pageSize);
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
      await client.setSecret(secretName, secretValue);

      // Invalidate cache
      this.allSecretsCache.delete(vaultUrl);
    } catch (error) {
      const errorMessage = (error as Error).message;

      // Check if this is a credential unavailable error
      if (
        error instanceof CredentialUnavailableError ||
        errorMessage.includes("CredentialUnavailableError") ||
        errorMessage.includes(
          "Visual Studio Code Authentication is not available",
        )
      ) {
        // Prompt user to enter SP credentials
        await this.promptForServicePrincipalCreds();

        // Retry with new credentials
        return this.updateSecret(vaultUrl, secretName, secretValue);
      }

      throw new Error(`Failed to update secret: ${error}`);
    }
  }

  async deleteSecret(vaultUrl: string, secretName: string): Promise<void> {
    try {
      const client = this.getSecretClient(vaultUrl);
      const poller = await client.beginDeleteSecret(secretName);
      await poller.pollUntilDone();

      // Invalidate cache
      this.allSecretsCache.delete(vaultUrl);
    } catch (error) {
      const errorMessage = (error as Error).message;

      // Check if this is a credential unavailable error
      if (
        error instanceof CredentialUnavailableError ||
        errorMessage.includes("CredentialUnavailableError") ||
        errorMessage.includes(
          "Visual Studio Code Authentication is not available",
        )
      ) {
        // Prompt user to enter SP credentials
        await this.promptForServicePrincipalCreds();

        // Retry with new credentials
        return this.deleteSecret(vaultUrl, secretName);
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
        await client.setSecret(secretName, value, { enabled: true });
      } else {
        const current = await client.getSecret(secretName);
        const currentValue = current.value ?? "";
        await client.setSecret(secretName, currentValue, { enabled: false });
      }

      // Invalidate cache
      this.allSecretsCache.delete(vaultUrl);
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (
        error instanceof CredentialUnavailableError ||
        errorMessage.includes("CredentialUnavailableError") ||
        errorMessage.includes(
          "Visual Studio Code Authentication is not available",
        )
      ) {
        await this.promptForServicePrincipalCreds();
        return this.setSecretEnabled(vaultUrl, secretName, enabled, value);
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
        const current = await client.getSecret(secretName);
        const currentValue = current.value ?? "";
        await client.setSecret(secretName, currentValue, {
          tags: properties.tags,
          notBefore: properties.notBefore ?? current.properties.notBefore,
          expiresOn: properties.expiresOn ?? current.properties.expiresOn,
          enabled: current.properties.enabled,
        });
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
        const current = await client.getSecret(secretName);
        const version = current.properties.version;
        if (!version) {
          throw new Error("Secret version not found for update.");
        }
        await client.updateSecretProperties(secretName, version, updatePayload);
      }

      // Invalidate cache
      this.allSecretsCache.delete(vaultUrl);
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (
        error instanceof CredentialUnavailableError ||
        errorMessage.includes("CredentialUnavailableError") ||
        errorMessage.includes(
          "Visual Studio Code Authentication is not available",
        )
      ) {
        await this.promptForServicePrincipalCreds();
        return this.updateSecretProperties(vaultUrl, secretName, properties);
      }

      throw new Error(`Failed to update secret: ${error}`);
    }
  }

  async getSecretDetails(
    vaultUrl: string,
    secretName: string,
  ): Promise<{
    id?: string;
    notBefore?: Date;
    expiresOn?: Date;
    tags?: Record<string, string>;
  }> {
    try {
      const client = this.getSecretClient(vaultUrl);
      const iterator = client.listPropertiesOfSecrets();
      for await (const props of iterator) {
        if (props.name === secretName) {
          return {
            id: props.id,
            notBefore: props.notBefore,
            expiresOn: props.expiresOn,
            tags: props.tags,
          };
        }
      }

      throw new Error("Secret not found in Key Vault.");
    } catch (error) {
      const errorMessage = (error as Error).message;

      if (
        error instanceof CredentialUnavailableError ||
        errorMessage.includes("CredentialUnavailableError") ||
        errorMessage.includes(
          "Visual Studio Code Authentication is not available",
        )
      ) {
        await this.promptForServicePrincipalCreds();
        return this.getSecretDetails(vaultUrl, secretName);
      }

      throw new Error(`Failed to get secret details: ${error}`);
    }
  }

  private async promptForServicePrincipalCreds(): Promise<void> {
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

    const clientSecret = await vscode.window.showInputBox({
      prompt: "Enter Service Principal Client Secret",
      ignoreFocusOut: true,
      password: true,
      placeHolder: "Enter your client secret",
    });

    if (!clientSecret) {
      throw new Error("Client Secret is required");
    }

    // Save the credentials
    await this.setServicePrincipalCreds({
      tenantId,
      clientId,
      clientSecret,
    });

    vscode.window.showInformationMessage(
      "Service Principal credentials saved and will be used for authentication.",
    );
  }
}
