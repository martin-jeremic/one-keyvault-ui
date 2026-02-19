import * as vscode from "vscode";
import * as fs from "fs";

export class SecretsWebViewProvider implements vscode.WebviewPanelSerializer {
  constructor(private extensionUri: vscode.Uri) {}

  async deserializeWebviewPanel(
    webviewPanel: vscode.WebviewPanel,
    state: { vaultUrl?: string } | undefined,
  ): Promise<void> {
    if (state && state.vaultUrl) {
      webviewPanel.webview.html = this.getSecretsView(
        webviewPanel.webview,
        state.vaultUrl,
      );
    }
  }

  getSecretsView(webview: vscode.Webview, vaultUrl: string): string {
    const nonce = getNonce();
    const htmlPath = vscode.Uri.joinPath(
      this.extensionUri,
      "media",
      "secretsView.html",
    );
    const html = fs.readFileSync(htmlPath.fsPath, "utf8");
    const mainScriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.extensionUri,
        "media",
        "secrets-dist",
        "main.js",
      ),
    );
    const secretRowTemplateUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.extensionUri,
        "media",
        "templates",
        "secretRow.html",
      ),
    );
    const detailsRowTemplateUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.extensionUri,
        "media",
        "templates",
        "detailsRow.html",
      ),
    );
    const tagRowTemplateUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.extensionUri,
        "media",
        "templates",
        "tagRow.html",
      ),
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "media", "secretsView.css"),
    );
    const csp = `default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}'; connect-src ${webview.cspSource};`;
    const state = encodeURIComponent(JSON.stringify({ vaultUrl }));

    return html
      .replace(/{{nonce}}/g, nonce)
      .replace("{{csp}}", csp)
      .replace("{{styleUri}}", styleUri.toString())
      .replace("{{mainScriptUri}}", mainScriptUri.toString())
      .replace("{{secretRowTemplateUri}}", secretRowTemplateUri.toString())
      .replace("{{detailsRowTemplateUri}}", detailsRowTemplateUri.toString())
      .replace("{{tagRowTemplateUri}}", tagRowTemplateUri.toString())
      .replace("{{state}}", state);
  }
}

function getNonce(): string {
  let text = "";
  const possible =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
