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
        const { GlobalStudentProfileListener } = require('./components/global-student-profile-listener');
        return (
          <ModalManagerProvider>
            <App />
            <GlobalStudentProfileListener />
          </ModalManagerProvider>
        );
      } catch {
        return <App />;
      }
    })()}
  </StrictMode>
);
