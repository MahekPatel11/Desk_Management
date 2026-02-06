import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import DeskProvider from "./pages/DeskContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <DeskProvider>
        <App />
      </DeskProvider>
    </BrowserRouter>
  </React.StrictMode>
);

