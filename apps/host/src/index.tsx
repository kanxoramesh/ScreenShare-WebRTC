import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { MaterialWrapper } from "./material";

const root = ReactDOM.createRoot(document.getElementById("root") as HTMLElement);
root.render(
  <React.StrictMode>
    <MaterialWrapper>
      <App />
    </MaterialWrapper>
  </React.StrictMode>
);
