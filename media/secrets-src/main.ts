import { bindEvents } from "./events.js";
import { loadSecrets } from "./actions.js";
import { loadTemplates } from "./templates.js";
import { showLoading, showMessage } from "./render.js";

async function bootstrap(): Promise<void> {
  try {
    await loadTemplates();
    bindEvents();
    loadSecrets();
  } catch (error) {
    showLoading(false);
    const message = error instanceof Error ? error.message : String(error);
    showMessage("Failed to initialize webview: " + message, "error");
    console.error("Webview bootstrap failed:", error);
  }
}

bootstrap();
