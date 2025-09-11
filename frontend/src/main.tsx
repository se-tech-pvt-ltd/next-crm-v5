import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Import ResizeObserver error suppression
import "./lib/resize-observer-polyfill";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* ModalManagerProvider ensures only one modal is open at a time */}
    {(() => {
      try {
        const { ModalManagerProvider } = require('./contexts/ModalManagerContext');
        return (
          <ModalManagerProvider>
            <App />
          </ModalManagerProvider>
        );
      } catch {
        return <App />;
      }
    })()}
  </StrictMode>
);
