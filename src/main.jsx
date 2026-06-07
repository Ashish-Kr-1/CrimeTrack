import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import { CDRProvider } from "./context/CDRContext";


ReactDOM.createRoot(document.getElementById("root")).render(
  <CDRProvider>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </CDRProvider>
);