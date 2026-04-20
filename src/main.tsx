import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { useAssetStore } from "./store/assetStore";
import { useDocumentStore } from "./store/documentStore";
import { useEditorStore } from "./store/editorStore";
import { applyTheme, useSettingsStore } from "./store/settingsStore";
import "./index.css";

if (import.meta.env.DEV) {
  (window as unknown as { __SNAPPY__: unknown }).__SNAPPY__ = {
    document: useDocumentStore,
    editor: useEditorStore,
    settings: useSettingsStore,
    assets: useAssetStore,
  };
}

applyTheme(useSettingsStore.getState().theme);
useSettingsStore.subscribe((state) => applyTheme(state.theme));

if (window.matchMedia) {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (useSettingsStore.getState().theme === "system") applyTheme("system");
  });
}

const rootEl = document.getElementById("root");
if (!rootEl) throw new Error("Root element not found");

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
    </HashRouter>
  </React.StrictMode>,
);
