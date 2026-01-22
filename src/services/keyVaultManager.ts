import { SecretClient } from "@azure/keyvault-secrets";
import { VisualStudioCodeCredential } from "@azure/identity";

export interface Secret {
  name: string;
  value: string;
  enabled: boolean;
  created?: Date;
  updated?: Date;
}

export interface SecretsPage {
  secrets: Secret[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export class KeyVaultManager {
  private secretClients: Map<string, SecretClient> = new Map();
  private credential: VisualStudioCodeCredential;
  private allSecretsCache: Map<string, Secret[]> = new Map();

  constructor() {
    // Visual Studio Code sign-in keeps auth aligned with the Azure Account extension and supports multi-tenant use by default.
    this.credential = new VisualStudioCodeCredential();
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
        const secret = await client.getSecret(secretProperties.name);
        allSecrets.push({
          name: secretProperties.name,
          value: secret.value || "",
          enabled: secretProperties.enabled ?? true,
          created: secretProperties.createdOn,
          updated: secretProperties.updatedOn,
        });
      }

      // Cache the secrets
      this.allSecretsCache.set(vaultUrl, allSecrets);

      // Calculate pagination
      const total = allSecrets.length;
      const start = page * pageSize;
      const end = start + pageSize;
      const paginatedSecrets = allSecrets.slice(start, end);

      return {
        secrets: paginatedSecrets,
        total,
        page,
        pageSize,
        hasMore: end < total,
      };
    } catch (error) {
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
      throw new Error(`Failed to delete secret: ${error}`);
    }
  }
}
