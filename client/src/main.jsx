import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GoogleOAuthProvider } from "@react-oauth/google";

import "./index.css";
import App from "./App.jsx";

import { Provider } from "react-redux";
import { appStore } from "./app/store";
import { Toaster } from "@/components/ui/toast";
import AppLoader from "./components/AppLoader.jsx";

const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={appStore}>
      <GoogleOAuthProvider clientId={googleClientId}>
        <AppLoader>
          <App />
        </AppLoader>
        <Toaster />
      </GoogleOAuthProvider>
    </Provider>
  </StrictMode>,
);
