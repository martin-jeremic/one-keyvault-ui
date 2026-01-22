import * as vscode from "vscode";
import { KeyVaultManager } from "../services/keyVaultManager";

export class KeyVaultTreeProvider implements vscode.TreeDataProvider<KeyVaultItem> {
  private _onDidChangeTreeData: vscode.EventEmitter<
    KeyVaultItem | undefined | null | void
  > = new vscode.EventEmitter<KeyVaultItem | undefined | null | void>();
  readonly onDidChangeTreeData: vscode.Event<
    KeyVaultItem | undefined | null | void
  > = this._onDidChangeTreeData.event;

  private keyVaults: KeyVaultItem[] = [];

  constructor(
    private keyVaultManager: KeyVaultManager,
    private storedVaults: Map<string, string>,
  ) {
    this.loadKeyVaults();
  }

  refresh(): void {
    this.loadKeyVaults();
    this._onDidChangeTreeData.fire();
  }

  private loadKeyVaults(): void {
    this.keyVaults = [];

    // Add stored vaults
    for (const [name, url] of this.storedVaults.entries()) {
      this.keyVaults.push(
        new KeyVaultItem(
          name,
          vscode.TreeItemCollapsibleState.None,
          url,
          false,
        ),
      );
    }

    // Add button to add more vaults
    this.keyVaults.push(
      new KeyVaultItem(
        "+ Add Key Vault",
        vscode.TreeItemCollapsibleState.None,
        "",
        true,
      ),
    );
  }

  getTreeItem(element: KeyVaultItem): vscode.TreeItem {
    return element;
  }

  async getChildren(element?: KeyVaultItem): Promise<KeyVaultItem[]> {
    if (!element) {
      return this.keyVaults;
    }
    return [];
  }
}

export class KeyVaultItem extends vscode.TreeItem {
  constructor(
    public readonly label: string,
    public readonly collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly vaultUrl: string = "",
    public readonly isAddButton: boolean = false,
  ) {
    super(label, collapsibleState);

    if (isAddButton) {
      this.command = {
        command: "oneKeyVault.addKeyVault",
        title: "Add Key Vault",
      };
      this.iconPath = new vscode.ThemeIcon("add");
    } else if (vaultUrl) {
      this.command = {
        command: "oneKeyVault.openSecrets",
        title: "Open Secrets",
        arguments: [this],
      };
      this.iconPath = new vscode.ThemeIcon("cloud");
      this.tooltip = vaultUrl;
      this.contextValue = "keyVault";
    }
  }
}
