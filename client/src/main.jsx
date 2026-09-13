import { BrowserRouter } from "react-router-dom";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { AuthProvider } from "./auth/AuthContext";
import { PlatformAuthProvider } from "./platform/auth/PlatformAuthContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <PlatformAuthProvider>
          <App />
        </PlatformAuthProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);