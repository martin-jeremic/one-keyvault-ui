import * as vscode from "vscode";
import * as fs from "fs";

export class SecretsWebViewProvider implements vscode.WebviewPanelSerializer {
  constructor(private extensionUri: vscode.Uri) {}

  async deserializeWebviewPanel(
    webviewPanel: vscode.WebviewPanel,
    state: any,
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
    const stateScriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "media", "secrets", "state.js"),
    );
    const domScriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "media", "secrets", "dom.js"),
    );
    const formatScriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "media", "secrets", "format.js"),
    );
    const templatesScriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(
        this.extensionUri,
        "media",
        "secrets",
        "templates.js",
      ),
    );
    const renderScriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "media", "secrets", "render.js"),
    );
    const actionsScriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "media", "secrets", "actions.js"),
    );
    const eventsScriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "media", "secrets", "events.js"),
    );
    const mainScriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "media", "secrets", "main.js"),
    );
    const styleUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.extensionUri, "media", "secretsView.css"),
    );
    const csp = `default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}';`;
    const state = JSON.stringify({ vaultUrl });

    return html
      .replace(/{{nonce}}/g, nonce)
      .replace("{{csp}}", csp)
      .replace("{{styleUri}}", styleUri.toString())
      .replace("{{stateScriptUri}}", stateScriptUri.toString())
      .replace("{{domScriptUri}}", domScriptUri.toString())
      .replace("{{formatScriptUri}}", formatScriptUri.toString())
      .replace("{{templatesScriptUri}}", templatesScriptUri.toString())
      .replace("{{renderScriptUri}}", renderScriptUri.toString())
      .replace("{{actionsScriptUri}}", actionsScriptUri.toString())
      .replace("{{eventsScriptUri}}", eventsScriptUri.toString())
      .replace("{{mainScriptUri}}", mainScriptUri.toString())
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
