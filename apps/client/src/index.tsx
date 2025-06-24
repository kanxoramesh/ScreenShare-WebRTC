import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { MaterialWrapper } from "./material";

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(
  <MaterialWrapper>
    <App />
  </MaterialWrapper>
);
