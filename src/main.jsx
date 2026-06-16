import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { CDRProvider } from "./context/CDRContext";
import { AuthProvider } from "./auth/AuthContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <CDRProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </CDRProvider>
  </AuthProvider>
);