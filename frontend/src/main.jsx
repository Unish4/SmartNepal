import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import ReactDOM from "react-dom"; 

if (import.meta.env.DEV) {
  import("@axe-core/react").then(({ default: axe }) => {
    axe(React, ReactDOM, 1000);
  });
}
import * as Sentry from "@sentry/react";

// Early capture of PWA install prompt
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  window.deferredPrompt = e;
  window.dispatchEvent(new CustomEvent("pwa-install-promptable"));
});

import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";
import ErrorFallback from "./components/ErrorFallback.jsx"; // ← Phase 26
import { initSentry } from "./lib/sentry.js";

initSentry(); 

import "leaflet/dist/leaflet.css";

import "./lib/leafletSetup.js";

import "./i18n/index.js";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={ErrorFallback} showDialog>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  </StrictMode>,
);
