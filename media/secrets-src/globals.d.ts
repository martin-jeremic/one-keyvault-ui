import type { TemplateUris, WebviewState } from "./types.js";

declare global {
  const acquireVsCodeApi: () => {
    postMessage: (message: unknown) => void;
  };

  interface Window {
    __ONE_KEYVAULT_STATE__?: WebviewState;
    __ONE_KEYVAULT_TEMPLATES__?: TemplateUris;
  }
}

export {};
