import { bindEvents } from "./events.js";
import { loadSecrets } from "./actions.js";
import { loadTemplates } from "./templates.js";
async function bootstrap() {
    await loadTemplates();
    bindEvents();
    loadSecrets();
}
bootstrap();
